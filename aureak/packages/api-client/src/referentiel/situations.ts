// Story 3.3 — CRUD référentiel situationnel
import { supabase } from '../supabase'
import type { SituationGroup, Situation, SituationCriterion, SituationThemeLink, CoachGradeLevel } from '@aureak/types'

// ─── SituationGroup ───────────────────────────────────────────────────────────

export type CreateSituationGroupParams = {
  tenantId  : string
  name      : string
  sortOrder?: number
}

export async function createSituationGroup(
  params: CreateSituationGroupParams
): Promise<{ data: SituationGroup | null; error: unknown }> {
  const { data, error } = await supabase
    .from('situation_groups')
    .insert({
      tenant_id : params.tenantId,
      name      : params.name,
      sort_order: params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as SituationGroup | null, error }
}

export async function listSituationGroups(): Promise<{ data: SituationGroup[]; error: unknown }> {
  const { data, error } = await supabase
    .from('situation_groups')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as SituationGroup[]) ?? [], error }
}

// ─── Situation ────────────────────────────────────────────────────────────────

export type CreateSituationParams = {
  tenantId       : string
  groupId?       : string
  blocId?        : string                    // FK → theme_groups (Blocs)
  situationKey   : string
  name           : string
  description?   : string
  variables?     : Record<string, unknown>
  targetAudience?: Record<string, unknown>
}

export async function createSituation(
  params: CreateSituationParams
): Promise<{ data: Situation | null; error: unknown }> {
  const { data, error } = await supabase
    .from('situations')
    .insert({
      tenant_id      : params.tenantId,
      group_id       : params.groupId ?? null,
      bloc_id        : params.blocId ?? null,
      situation_key  : params.situationKey,
      name           : params.name,
      description    : params.description ?? null,
      variables      : params.variables ?? null,
      target_audience: params.targetAudience ?? {},
    })
    .select()
    .single()

  return { data: data as Situation | null, error }
}

export async function listSituations(
  params?: { groupId?: string; blocId?: string }
): Promise<{ data: Situation[]; error: unknown }> {
  let query = supabase
    .from('situations')
    .select('*')
    .eq('is_current', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (params?.blocId) {
    query = query.eq('bloc_id', params.blocId)
  } else if (params?.groupId) {
    query = query.eq('group_id', params.groupId)
  }

  const { data, error } = await query
  return { data: (data as Situation[]) ?? [], error }
}

export async function getSituationByKey(
  situationKey: string
): Promise<{ data: Situation | null; error: unknown }> {
  const { data, error } = await supabase
    .from('situations')
    .select('*')
    .eq('situation_key', situationKey)
    .eq('is_current', true)
    .single()

  return { data: data as Situation | null, error }
}

export type NewSituationVersionParams = {
  situationKey   : string
  tenantId       : string
  name?          : string
  description?   : string
  variables?     : Record<string, unknown>
  targetAudience?: Record<string, unknown>
}

export async function createNewSituationVersion(
  params: NewSituationVersionParams
): Promise<{ data: Situation | null; error: unknown }> {
  const { data: current, error: fetchError } = await supabase
    .from('situations')
    .select('*')
    .eq('situation_key', params.situationKey)
    .eq('is_current', true)
    .single()

  if (fetchError || !current) return { data: null, error: fetchError ?? new Error('Situation not found') }

  const c = current as {
    id: string; name: string; description: string | null;
    variables: Record<string, unknown> | null; target_audience: Record<string, unknown>
  }

  const { data, error } = await supabase.rpc('create_situation_version', {
    p_situation_key  : params.situationKey,
    p_current_id     : c.id,
    p_name           : params.name ?? c.name,
    p_description    : params.description ?? c.description,
    p_variables      : params.variables ?? c.variables,
    p_target_audience: params.targetAudience ?? c.target_audience,
    p_tenant_id      : params.tenantId,
  })

  return { data: data as Situation | null, error }
}

// ─── SituationCriterion ───────────────────────────────────────────────────────

export type CreateSituationCriterionParams = {
  tenantId    : string
  situationId : string
  label       : string
  sortOrder?  : number
}

export async function createSituationCriterion(
  params: CreateSituationCriterionParams
): Promise<{ data: SituationCriterion | null; error: unknown }> {
  const { data, error } = await supabase
    .from('situation_criteria')
    .insert({
      tenant_id   : params.tenantId,
      situation_id: params.situationId,
      label       : params.label,
      sort_order  : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data as SituationCriterion | null, error }
}

export async function listSituationCriteria(
  situationId: string
): Promise<{ data: SituationCriterion[]; error: unknown }> {
  const { data, error } = await supabase
    .from('situation_criteria')
    .select('*')
    .eq('situation_id', situationId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as SituationCriterion[]) ?? [], error }
}

// ─── SituationThemeLink ───────────────────────────────────────────────────────

export async function linkSituationToTheme(params: {
  situationId: string
  themeId    : string
  tenantId   : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('situation_theme_links')
    .insert({
      situation_id: params.situationId,
      theme_id    : params.themeId,
      tenant_id   : params.tenantId,
    })
  return { error }
}

export async function unlinkSituationFromTheme(params: {
  situationId: string
  themeId    : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('situation_theme_links')
    .delete()
    .eq('situation_id', params.situationId)
    .eq('theme_id', params.themeId)
  return { error }
}

export async function listThemeLinksForSituation(
  situationId: string
): Promise<{ data: SituationThemeLink[]; error: unknown }> {
  const { data, error } = await supabase
    .from('situation_theme_links')
    .select('*')
    .eq('situation_id', situationId)

  return { data: (data as SituationThemeLink[]) ?? [], error }
}

// Story 11.2 — Mise à jour du grade minimum requis pour une situation
export async function updateSituationGradeLevel(
  situationId       : string,
  requiredGradeLevel: CoachGradeLevel,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('situations')
    .update({ required_grade_level: requiredGradeLevel })
    .eq('id', situationId)
  return { error }
}
