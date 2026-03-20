// Batch job d'enrichissement RBFA — Story 28-1
// Traite tous les clubs ayant rbfa_status = 'pending', par pages de 50.
// Délai de 2s entre requêtes RBFA pour respecter le rate-limiting.

import { supabase }         from '../supabase'
import type { SyncResult }  from '@aureak/types'
import { searchRbfaClubs }  from './rbfa-search'
import { parseRbfaClubs }   from './rbfa-parser'
import { findBestMatch }    from './club-matching'
import { importRbfaLogo }   from './club-logo-import'

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
  let storagePath: string | null = null
  if (candidate.logoUrl) {
    const logoResult = await importRbfaLogo({
      rbfaLogoUrl: candidate.logoUrl,
      tenantId,
      clubId     : club.id,
    })
    if (logoResult.success) storagePath = logoResult.storagePath
  }

  const updatePayload: Record<string, unknown> = {
    rbfa_id         : candidate.rbfaId,
    rbfa_url        : candidate.rbfaUrl,
    rbfa_logo_url   : candidate.logoUrl,
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
