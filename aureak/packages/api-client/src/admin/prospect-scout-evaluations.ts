// @aureak/api-client — Évaluations scout sur prospects gardiens (Story 89.2)
// Table dédiée `prospect_scout_evaluations` — distincte d'`evaluations` (coach).

import { supabase } from '../supabase'
import type {
  ProspectScoutEvaluation,
  ProspectScoutEvaluationWithAuthor,
  ProspectScoutEvaluationStats,
  ScoutObservationContext,
} from '@aureak/types'

// ── Mapper snake_case → camelCase ──────────────────────────────────────────────

function toEvaluation(row: Record<string, unknown>): ProspectScoutEvaluation {
  return {
    id                : row.id                   as string,
    tenantId          : row.tenant_id            as string,
    childId           : row.child_id             as string,
    evaluatorId       : row.evaluator_id         as string,
    ratingStars       : row.rating_stars         as number,
    comment           : (row.comment             as string | null) ?? null,
    observationContext: (row.observation_context as ScoutObservationContext | null) ?? null,
    observationDate   : (row.observation_date    as string | null) ?? null,
    deletedAt         : (row.deleted_at          as string | null) ?? null,
    createdAt         : row.created_at           as string,
    updatedAt         : row.updated_at           as string,
  }
}

// ── Types params ───────────────────────────────────────────────────────────────

export type CreateScoutEvaluationParams = {
  tenantId           : string
  childId            : string
  ratingStars        : number                       // 1..5
  comment?           : string | null
  observationContext?: ScoutObservationContext | null
  observationDate?   : string | null                // YYYY-MM-DD
}

export type UpdateScoutEvaluationParams = Partial<
  Pick<CreateScoutEvaluationParams, 'ratingStars' | 'comment' | 'observationContext' | 'observationDate'>
>

// ── Queries ────────────────────────────────────────────────────────────────────

/**
 * Liste toutes les évaluations scout non-deleted pour un gardien donné.
 * Ordre : observation_date DESC NULLS LAST, created_at DESC.
 * Inclut les infos auteur (display_name + email) via JOIN profiles.
 */
export async function listScoutEvaluationsByChild(
  childId: string,
): Promise<ProspectScoutEvaluationWithAuthor[]> {
  const { data, error } = await supabase
    .from('prospect_scout_evaluations')
    .select('*, profiles!prospect_scout_evaluations_evaluator_id_fkey(display_name,email)')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('observation_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const profile = (row as { profiles?: { display_name?: string | null; email?: string | null } }).profiles
    return {
      ...toEvaluation(row as Record<string, unknown>),
      authorName : profile?.display_name ?? null,
      authorEmail: profile?.email ?? null,
    }
  })
}

/**
 * Stats agrégées : count, averageRating (1 décimale), lastRating, lastDate, lastAuthorName.
 * Retourne { count: 0, averageRating: null, ... } si aucune éval.
 */
export async function getScoutEvaluationStats(
  childId: string,
): Promise<ProspectScoutEvaluationStats> {
  const evals = await listScoutEvaluationsByChild(childId)
  if (evals.length === 0) {
    return { count: 0, averageRating: null, lastRating: null, lastDate: null, lastAuthorName: null }
  }
  const avg = evals.reduce((s, e) => s + e.ratingStars, 0) / evals.length
  const last = evals[0]   // déjà trié desc
  return {
    count         : evals.length,
    averageRating : Math.round(avg * 10) / 10,
    lastRating    : last.ratingStars,
    lastDate      : last.observationDate ?? last.createdAt,
    lastAuthorName: last.authorName,
  }
}

/**
 * Crée une nouvelle évaluation scout.
 * `evaluator_id` est injecté depuis `supabase.auth.getUser()` — jamais fourni par le client.
 */
export async function createScoutEvaluation(
  params: CreateScoutEvaluationParams,
): Promise<ProspectScoutEvaluation> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) throw new Error('Utilisateur non authentifié')

  const { data, error } = await supabase
    .from('prospect_scout_evaluations')
    .insert({
      tenant_id          : params.tenantId,
      child_id           : params.childId,
      evaluator_id       : uid,
      rating_stars       : params.ratingStars,
      comment            : params.comment            ?? null,
      observation_context: params.observationContext ?? null,
      observation_date   : params.observationDate    ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toEvaluation(data)
}

/**
 * Met à jour une évaluation existante. La fenêtre 24h + gate auteur sont garanties côté RLS.
 * UpdateScoutEvaluationParams ne contient que les champs métier (jamais deleted_at ici).
 */
export async function updateScoutEvaluation(
  id: string,
  patch: UpdateScoutEvaluationParams,
): Promise<ProspectScoutEvaluation> {
  const update: Record<string, unknown> = {}
  if (patch.ratingStars        !== undefined) update.rating_stars        = patch.ratingStars
  if (patch.comment            !== undefined) update.comment             = patch.comment
  if (patch.observationContext !== undefined) update.observation_context = patch.observationContext
  if (patch.observationDate    !== undefined) update.observation_date    = patch.observationDate

  const { data, error } = await supabase
    .from('prospect_scout_evaluations')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toEvaluation(data)
}

/**
 * Soft-delete : UPDATE deleted_at = now(). Jamais de DELETE physique.
 * RLS autorise l'UPDATE au tenant ; par convention, cette fonction n'envoie QUE deleted_at.
 */
export async function deleteScoutEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_scout_evaluations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
