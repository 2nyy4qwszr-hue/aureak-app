// Batch job d'enrichissement RBFA — Story 28-1
// Traite tous les clubs ayant rbfa_status = 'pending', par pages de 50.
// Délai de 2s entre requêtes RBFA pour respecter le rate-limiting.

import { supabase }                          from '../supabase'
import type { SyncResult, RbfaClubResult } from '@aureak/types'
import { searchRbfaClubs, fetchLogoFromClubPage } from './rbfa-search'
import { parseRbfaClubs }                   from './rbfa-parser'
import { findBestMatch }                    from './club-matching'
import { importRbfaLogo }                   from './club-logo-import'

/**
 * Construit le payload d'UPDATE club_directory pour un matching RBFA confirmé.
 * Exporté pour permettre les tests unitaires (Story 29-1).
 * Règle matricule : inclus uniquement si le candidat en fournit un (preserve les valeurs manuelles).
 */
export function buildMatchedClubPayload(params: {
  candidate      : Pick<RbfaClubResult, 'rbfaId' | 'rbfaUrl' | 'logoUrl' | 'matricule'>
  resolvedLogoUrl: string | null
  confidence     : number
  storagePath    : string | null
}): Record<string, unknown> {
  const { candidate, resolvedLogoUrl, confidence, storagePath } = params
  const payload: Record<string, unknown> = {
    rbfa_id         : candidate.rbfaId,
    rbfa_url        : candidate.rbfaUrl,
    rbfa_logo_url   : resolvedLogoUrl ?? candidate.logoUrl,
    rbfa_confidence : confidence,
    rbfa_status     : 'matched',
    last_verified_at: new Date().toISOString(),
  }
  if (storagePath)         payload.logo_path  = storagePath
  if (candidate.matricule) payload.matricule  = candidate.matricule
  return payload
}

const BATCH_DELAY_MS = 2_000
const MAX_RETRY      = 2
const PAGE_SIZE      = 50

// Préfixes belges à retirer pour construire une requête de fallback
const STRIP_PREFIX_RE = /^(?:(?:[A-Z]\.)+|R(?:oyal)?|K(?:oninklijk)?|F\.?C\.?|R\.?F\.?C\.?|K\.?F\.?C\.?|K\.?V\.?|R\.?S\.?C\.?|S\.?K\.?|A\.?S\.?|S\.?V\.?|V\.?V\.?)\s+/gi

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

/** Retire les préfixes courants du nom de club pour une requête de fallback. */
function stripClubPrefix(nom: string): string {
  let result = nom
  for (let i = 0; i < 4; i++) {
    const stripped = result.replace(STRIP_PREFIX_RE, '').trim()
    if (stripped === result || stripped.length < 3) break
    result = stripped
  }
  return result
}

/** Premier mot significatif (≥4 lettres) du nom, pour une recherche de dernier recours. */
function firstSignificantWord(nom: string): string | null {
  const words = nom.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 4)
  return words[0] ?? null
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

/** Déduplique une liste de candidats par rbfaId. */
function dedupById(candidates: ReturnType<typeof parseRbfaClubs>) {
  const seen = new Set<string>()
  return candidates.filter(c => {
    if (seen.has(c.rbfaId)) return false
    seen.add(c.rbfaId)
    return true
  })
}

/**
 * Stratégie de recherche multi-passes :
 * 1. Nom complet
 * 2. Nom sans préfixes (si différent du nom complet et résultats insuffisants)
 * 3. Premier mot significatif (dernier recours si toujours 0 résultat)
 */
async function searchCandidates(nom: string) {
  // Passe 1 : nom complet
  let candidates = await searchWithRetry(nom)
  if (candidates.length >= 3) return candidates

  // Passe 2 : nom sans préfixes
  const stripped = stripClubPrefix(nom)
  if (stripped !== nom && stripped.length >= 3) {
    const extra = await searchWithRetry(stripped)
    candidates = dedupById([...candidates, ...extra])
    if (candidates.length >= 1) return candidates
  }

  // Passe 3 : premier mot significatif
  const word = firstSignificantWord(stripped.length >= 3 ? stripped : nom)
  if (word) {
    const extra = await searchWithRetry(word)
    candidates = dedupById([...candidates, ...extra])
  }

  return candidates
}

async function processClub(
  club    : ClubRow,
  tenantId: string,
): Promise<{ outcome: 'matched' | 'pending_review' | 'rejected' | 'skipped' | 'error' }> {
  const candidates = await searchCandidates(club.nom)

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
      if (process.env.NODE_ENV !== 'production') console.info(`[RBFA] Fallback logo trouvé sur page club pour ${candidate.nom}: ${resolvedLogoUrl}`)
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

  const updatePayload = buildMatchedClubPayload({
    candidate,
    resolvedLogoUrl,
    confidence : score.total,
    storagePath,
  })

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

  // Pré-charger les clubs ayant déjà une review pending pour les exclure du traitement
  const { data: pendingReviewRows } = await supabase
    .from('club_match_reviews')
    .select('club_directory_id')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
  const pendingReviewSet = new Set<string>(
    ((pendingReviewRows ?? []) as { club_directory_id: string }[]).map(r => r.club_directory_id),
  )

  let offset = 0
  while (true) {
    const { data: clubs, error } = await supabase
      .from('club_directory')
      .select('id, nom, matricule, ville, province, tenant_id')
      .eq('tenant_id', tenantId)
      .or('rbfa_status.eq.pending,rbfa_status.is.null')
      .is('deleted_at', null)
      .order('nom', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error || !clubs || clubs.length === 0) break

    for (const club of clubs as ClubRow[]) {
      // Ignorer les clubs déjà en attente de review manuelle
      if (pendingReviewSet.has(club.id)) {
        result.pendingReview++
        continue
      }
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
 * Remet les clubs rejected, skipped et jamais traités (NULL) à rbfa_status='pending'.
 * Ne touche PAS les clubs 'matched' (logo déjà validé).
 * Supprime les reviews pending associées.
 */
export async function resetAllClubsForSync(
  tenantId: string,
): Promise<{ count: number; error: unknown }> {
  // 1. Supprimer les reviews pending du tenant
  await supabase
    .from('club_match_reviews')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  // 2. Remettre à pending tous les clubs sauf 'matched'
  //    .neq('rbfa_status', 'matched') exclut les matchés
  //    mais ne filtre PAS les NULL — ils sont inclus via neq (NULL != 'matched' en SQL)
  const { count, error } = await supabase
    .from('club_directory')
    .update({ rbfa_status: 'pending', last_verified_at: null })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .neq('rbfa_status', 'matched')
    .select('id', { count: 'exact', head: true })

  if (error) return { count: 0, error }

  return { count: count ?? 0, error: null }
}
