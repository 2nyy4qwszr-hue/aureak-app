// Batch job d'enrichissement RBFA — Story 28-1
// Traite tous les clubs ayant rbfa_status = 'pending', par pages de 50.
// Délai de 2s entre requêtes RBFA pour respecter le rate-limiting.

import { supabase }                          from '../supabase'
import type { SyncResult }                  from '@aureak/types'
import { searchRbfaClubs, fetchLogoFromClubPage } from './rbfa-search'
import { parseRbfaClubs }                   from './rbfa-parser'
import { findBestMatch }                    from './club-matching'
import { importRbfaLogo }                   from './club-logo-import'

const BATCH_DELAY_MS = 2_000
const MAX_RETRY      = 2
const PAGE_SIZE      = 50

type ClubRow = {
  id       : string
  nom      : string
  matricule: string | null
  ville    : string | null
  province : string | null
  tenant_id: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function searchWithRetry(query: string) {
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      const raws = await searchRbfaClubs(query, 10)
      return parseRbfaClubs(raws)
    } catch {
      if (attempt === MAX_RETRY) return []
      await sleep(BATCH_DELAY_MS * (attempt + 1))
    }
  }
  return []
}

async function processClub(
  club    : ClubRow,
  tenantId: string,
): Promise<{ outcome: 'matched' | 'pending_review' | 'rejected' | 'skipped' | 'error' }> {
  const candidates = await searchWithRetry(club.nom)

  if (!candidates.length) {
    await supabase
      .from('club_directory')
      .update({ rbfa_status: 'skipped', last_verified_at: new Date().toISOString() })
      .eq('id', club.id)
    return { outcome: 'skipped' }
  }

  const match = findBestMatch(
    { nom: club.nom, matricule: club.matricule, ville: club.ville, province: club.province },
    candidates,
  )

  if (!match) {
    await supabase
      .from('club_directory')
      .update({ rbfa_status: 'skipped', last_verified_at: new Date().toISOString() })
      .eq('id', club.id)
    return { outcome: 'skipped' }
  }

  const { candidate, score } = match

  if (score.confidence === 'low') {
    await supabase
      .from('club_directory')
      .update({
        rbfa_status     : 'rejected',
        rbfa_confidence : score.total,
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', club.id)
    return { outcome: 'rejected' }
  }

  if (score.confidence === 'medium') {
    // Review manuelle — upsert pour éviter les doublons si le job retourne
    await supabase.from('club_match_reviews').upsert(
      {
        tenant_id        : tenantId,
        club_directory_id: club.id,
        rbfa_candidate   : candidate,
        match_score      : score.total,
        score_detail     : score,
        status           : 'pending',
      },
      { onConflict: 'club_directory_id' },
    )
    return { outcome: 'pending_review' }
  }

  // confidence === 'high' → import automatique
  // Si le GraphQL retourne no_logo.jpg (logoUrl=null), tentative de fallback sur la page HTML du club
  let resolvedLogoUrl = candidate.logoUrl
  if (!resolvedLogoUrl && candidate.rbfaId) {
    resolvedLogoUrl = await fetchLogoFromClubPage(candidate.rbfaId)
    if (resolvedLogoUrl) {
      console.info(`[RBFA] Fallback logo trouvé sur page club pour ${candidate.nom}: ${resolvedLogoUrl}`)
    }
  }

  let storagePath: string | null = null
  if (resolvedLogoUrl) {
    const logoResult = await importRbfaLogo({
      rbfaLogoUrl: resolvedLogoUrl,
      tenantId,
      clubId     : club.id,
    })
    if (logoResult.success) storagePath = logoResult.storagePath
  }

  const updatePayload: Record<string, unknown> = {
    rbfa_id         : candidate.rbfaId,
    rbfa_url        : candidate.rbfaUrl,
    rbfa_logo_url   : resolvedLogoUrl ?? candidate.logoUrl,
    rbfa_confidence : score.total,
    rbfa_status     : 'matched',
    last_verified_at: new Date().toISOString(),
  }
  if (storagePath) updatePayload.logo_path = storagePath

  const { error } = await supabase
    .from('club_directory')
    .update(updatePayload)
    .eq('id', club.id)

  if (error) {
    // Rollback Storage si la DB échoue
    if (storagePath) {
      await supabase.storage.from('club-logos').remove([storagePath])
    }
    return { outcome: 'error' }
  }

  return { outcome: 'matched' }
}

export type RbfaStats = {
  pending : number
  matched : number
  rejected: number
  skipped : number
  total   : number
}

/**
 * Compte les clubs par rbfa_status pour affichage dans l'UI.
 */
export async function getClubRbfaStats(tenantId: string): Promise<{ data: RbfaStats; error: unknown }> {
  const { data, error } = await supabase
    .from('club_directory')
    .select('rbfa_status')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  if (error || !data) return {
    data : { pending: 0, matched: 0, rejected: 0, skipped: 0, total: 0 },
    error,
  }

  const stats: RbfaStats = { pending: 0, matched: 0, rejected: 0, skipped: 0, total: data.length }
  for (const row of data as { rbfa_status: string | null }[]) {
    const s = row.rbfa_status ?? 'pending'
    if (s === 'matched')  stats.matched++
    else if (s === 'rejected') stats.rejected++
    else if (s === 'skipped')  stats.skipped++
    else stats.pending++
  }
  return { data: stats, error: null }
}

/**
 * Enrichit les clubs à rbfa_status='pending' via l'API RBFA.
 * Respecte un délai de 2s entre chaque requête (rate limiting).
 */
export async function syncMissingClubLogos(tenantId: string): Promise<SyncResult> {
  const result: SyncResult = {
    processed    : 0,
    matched      : 0,
    pendingReview: 0,
    rejected     : 0,
    skipped      : 0,
    errors       : 0,
  }

  let offset = 0
  while (true) {
    const { data: clubs, error } = await supabase
      .from('club_directory')
      .select('id, nom, matricule, ville, province, tenant_id')
      .eq('tenant_id', tenantId)
      .eq('rbfa_status', 'pending')
      .is('deleted_at', null)
      .order('nom', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error || !clubs || clubs.length === 0) break

    for (const club of clubs as ClubRow[]) {
      result.processed++
      await sleep(BATCH_DELAY_MS)

      const { outcome } = await processClub(club, tenantId)
      switch (outcome) {
        case 'matched'       : result.matched++       ; break
        case 'pending_review': result.pendingReview++ ; break
        case 'rejected'      : result.rejected++      ; break
        case 'skipped'       : result.skipped++       ; break
        case 'error'         : result.errors++        ; break
      }
    }

    if (clubs.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return result
}

/**
 * Remet tous les clubs rejected/skipped à rbfa_status='pending' pour un nouveau passage.
 * Ne touche PAS les clubs 'matched' (logo déjà validé).
 * Supprime également les reviews pending associées.
 */
export async function resetAllClubsForSync(
  tenantId: string,
): Promise<{ count: number; error: unknown }> {
  // 1. Récupérer les IDs des clubs à remettre en pending
  const { data: clubs, error: selectErr } = await supabase
    .from('club_directory')
    .select('id')
    .eq('tenant_id', tenantId)
    .in('rbfa_status', ['rejected', 'skipped'])
    .is('deleted_at', null)

  if (selectErr || !clubs) return { count: 0, error: selectErr }
  if (clubs.length === 0)   return { count: 0, error: null }

  const clubIds = clubs.map((c: { id: string }) => c.id)

  // 2. Supprimer les reviews pending de ces clubs
  await supabase
    .from('club_match_reviews')
    .delete()
    .in('club_directory_id', clubIds)
    .eq('status', 'pending')

  // 3. Remettre à pending
  const { error: updateErr } = await supabase
    .from('club_directory')
    .update({ rbfa_status: 'pending', last_verified_at: null })
    .in('id', clubIds)
    .eq('tenant_id', tenantId)

  if (updateErr) return { count: 0, error: updateErr }

  return { count: clubIds.length, error: null }
}
