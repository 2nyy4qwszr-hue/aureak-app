// CRUD reviews de matching RBFA — Story 28-1 / fix 28-3
// Table : club_match_reviews (migration 00082)

import { supabase }                from '../supabase'
import { importRbfaLogo }         from './club-logo-import'
import { buildMatchedClubPayload } from './rbfa-sync'
import type { ClubMatchReview }   from '@aureak/types'

function mapRow(r: Record<string, unknown>): ClubMatchReview {
  return {
    id              : r.id as string,
    tenantId        : r.tenant_id as string,
    clubDirectoryId : r.club_directory_id as string,
    rbfaCandidate   : r.rbfa_candidate as ClubMatchReview['rbfaCandidate'],
    matchScore      : r.match_score as number,
    scoreDetail     : r.score_detail as ClubMatchReview['scoreDetail'],
    status          : r.status as 'pending' | 'confirmed' | 'rejected',
    reviewedBy      : (r.reviewed_by as string | null) ?? null,
    reviewedAt      : (r.reviewed_at as string | null) ?? null,
    createdAt       : r.created_at as string,
    updatedAt       : r.updated_at as string,
    // Champ enrichi (joint depuis club_directory)
    clubNom         : (r.club_nom as string | null) ?? null,
  }
}

/**
 * Liste les reviews en attente avec le nom local du club (joint depuis club_directory).
 * Triées par score décroissant.
 */
export async function listPendingMatchReviews(tenantId?: string): Promise<{
  data : ClubMatchReview[]
  error: unknown
}> {
  let q = supabase
    .from('club_match_reviews')
    .select('*, club_directory!inner(nom)')
    .eq('status', 'pending')
    .order('match_score', { ascending: false })

  if (tenantId) q = q.eq('tenant_id', tenantId)

  const { data, error } = await q

  if (error) return { data: [], error }

  const rows = (data as Record<string, unknown>[]).map(r => {
    const cd = r.club_directory as Record<string, unknown> | null
    return mapRow({ ...r, club_nom: cd?.nom ?? null })
  })

  return { data: rows, error: null }
}

/**
 * Confirme un matching : applique les données RBFA sur club_directory,
 * importe le logo si disponible, puis marque la review comme confirmée.
 */
export async function confirmMatchReview(params: {
  reviewId  : string
  reviewedBy: string
}): Promise<{ error: unknown }> {
  const { reviewId, reviewedBy } = params

  const { data: review, error: fetchErr } = await supabase
    .from('club_match_reviews')
    .select('*')
    .eq('id', reviewId)
    .single()

  if (fetchErr || !review) return { error: fetchErr ?? 'not_found' }

  const r         = review as Record<string, unknown>
  const candidate = r.rbfa_candidate as ClubMatchReview['rbfaCandidate']
  const clubId    = r.club_directory_id as string
  const tenantId  = r.tenant_id as string

  // Tenter l'import du logo via Edge Function
  let storagePath: string | null = null
  if (candidate.logoUrl) {
    const logoResult = await importRbfaLogo({
      rbfaLogoUrl: candidate.logoUrl,
      tenantId,
      clubId,
    })
    if (logoResult.success) storagePath = logoResult.storagePath
  }

  const updatePayload = buildMatchedClubPayload({
    candidate,
    resolvedLogoUrl: candidate.logoUrl ?? null,
    confidence     : r.match_score as number,
    storagePath,
  })

  const { error: dbErr } = await supabase
    .from('club_directory')
    .update(updatePayload)
    .eq('id', clubId)

  if (dbErr) return { error: dbErr }

  const { error } = await supabase
    .from('club_match_reviews')
    .update({
      status     : 'confirmed',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)

  return { error: error ?? null }
}

/**
 * Rejette un matching : marque la review + le club comme rejeté.
 */
export async function rejectMatchReview(params: {
  reviewId  : string
  reviewedBy: string
}): Promise<{ error: unknown }> {
  const { reviewId, reviewedBy } = params

  const { data: review, error: fetchErr } = await supabase
    .from('club_match_reviews')
    .select('club_directory_id')
    .eq('id', reviewId)
    .single()

  if (fetchErr || !review) return { error: fetchErr ?? 'not_found' }

  const clubId = (review as Record<string, unknown>).club_directory_id as string

  await supabase
    .from('club_directory')
    .update({ rbfa_status: 'rejected', last_verified_at: new Date().toISOString() })
    .eq('id', clubId)

  const { error } = await supabase
    .from('club_match_reviews')
    .update({
      status     : 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)

  return { error: error ?? null }
}
