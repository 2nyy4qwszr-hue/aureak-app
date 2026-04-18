// Story 89.3 — CRUD évaluations scout pour gardiens prospects
import { supabase } from '../supabase'
import type {
  ScoutEvaluation,
  ScoutEvaluationWithScout,
  CreateScoutEvaluationParams,
  ScoutEvaluationCriteria,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapCriteria(raw: unknown): ScoutEvaluationCriteria {
  if (!raw || typeof raw !== 'object') {
    return { reflexes: 0, positionnement: 0, jeuAuPied: 0, communication: 0, mental: 0 }
  }
  const c = raw as Record<string, unknown>
  return {
    reflexes       : (c.reflexes as number) ?? 0,
    positionnement : (c.positionnement as number) ?? 0,
    jeuAuPied      : (c.jeu_au_pied as number) ?? (c.jeuAuPied as number) ?? 0,
    communication  : (c.communication as number) ?? 0,
    mental         : (c.mental as number) ?? 0,
  }
}

function mapRow(r: Record<string, unknown>): ScoutEvaluation {
  return {
    id        : r.id as string,
    childId   : r.child_id as string,
    scoutId   : r.scout_id as string,
    rating    : r.rating as number,
    notes     : (r.notes as string | null) ?? null,
    criteria  : mapCriteria(r.criteria),
    tenantId  : r.tenant_id as string,
    createdAt : r.created_at as string,
    deletedAt : (r.deleted_at as string | null) ?? null,
  }
}

// ── Requêtes ───────────────────────────────────────────────────────────────

/**
 * Liste les évaluations scout d'un gardien prospect (chronologie inversée).
 * Résout les displayNames des scouts via profiles.
 */
export async function listScoutEvaluations(childId: string): Promise<ScoutEvaluationWithScout[]> {
  const { data, error } = await supabase
    .from('scout_evaluations')
    .select('*')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  const rows = data as Record<string, unknown>[]
  const evaluations = rows.map(mapRow)

  // Résolution noms scouts
  const scoutIds = [...new Set(evaluations.map(e => e.scoutId))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', scoutIds)

  const nameMap = new Map<string, string>()
  if (profiles) {
    for (const p of profiles as { user_id: string; display_name: string }[]) {
      nameMap.set(p.user_id, p.display_name)
    }
  }

  return evaluations.map(e => ({
    ...e,
    scoutDisplayName: nameMap.get(e.scoutId) ?? 'Inconnu',
  }))
}

/**
 * Crée une évaluation scout pour un gardien prospect.
 */
export async function createScoutEvaluation(
  params: CreateScoutEvaluationParams,
  tenantId: string,
): Promise<ScoutEvaluation> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session?.session?.user?.id
  if (!userId) throw new Error('Not authenticated')

  const criteriaJson = {
    reflexes       : params.criteria.reflexes,
    positionnement : params.criteria.positionnement,
    jeu_au_pied    : params.criteria.jeuAuPied,
    communication  : params.criteria.communication,
    mental         : params.criteria.mental,
  }

  const { data, error } = await supabase
    .from('scout_evaluations')
    .insert({
      child_id  : params.childId,
      scout_id  : userId,
      rating    : params.rating,
      notes     : params.notes ?? null,
      criteria  : criteriaJson,
      tenant_id : tenantId,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/**
 * Soft-delete une évaluation scout.
 */
export async function deleteScoutEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from('scout_evaluations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
