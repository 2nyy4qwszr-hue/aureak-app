// CRUD reviews de matching RBFA — Story 28-1
// Table : club_match_reviews (migration 00082)

import { supabase }           from '../supabase'
import type { ClubMatchReview } from '@aureak/types'

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
  }
}

/** Liste les reviews en attente, triées par score décroissant. */
export async function listPendingMatchReviews(): Promise<{
  data : ClubMatchReview[]
  error: unknown
}> {
  const { data, error } = await supabase
    .from('club_match_reviews')
    .select('*')
    .eq('status', 'pending')
    .order('match_score', { ascending: false })

  if (error) return { data: [], error }
  return { data: (data as Record<string, unknown>[]).map(mapRow), error: null }
}

/**
 * Confirme un matching : applique les données RBFA sur club_directory + marque la review.
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

  const { error: dbErr } = await supabase
    .from('club_directory')
    .update({
      rbfa_id         : candidate.rbfaId,
      rbfa_url        : candidate.rbfaUrl,
      rbfa_logo_url   : candidate.logoUrl,
      rbfa_confidence : r.match_score,
      rbfa_status     : 'matched',
      last_verified_at: new Date().toISOString(),
    })
    .eq('id', r.club_directory_id as string)

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
 * Rejette un matching : marque la review comme rejetée + club comme 'rejected'.
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
