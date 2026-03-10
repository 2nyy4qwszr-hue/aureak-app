// Story 3.1 — CRUD référentiel thèmes (ThemeGroup, Theme, ThemeSequence)
import { supabase } from '../supabase'
import type { ThemeGroup, Theme, ThemeSequence, ThemeLevel, AgeGroup } from '@aureak/types'

// ─── Mappers snake_case → camelCase ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGroup(r: any): ThemeGroup {
  return {
    id       : r.id,
    tenantId : r.tenant_id,
    name     : r.name,
    sortOrder: r.sort_order ?? null,
    deletedAt: r.deleted_at ?? null,
    createdAt: r.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTheme(r: any): Theme {
  return {
    id            : r.id,
    tenantId      : r.tenant_id,
    groupId       : r.group_id ?? null,
    themeKey      : r.theme_key,
    name          : r.name,
    description   : r.description ?? null,
    level         : (r.level as ThemeLevel) ?? null,
    ageGroup      : (r.age_group as AgeGroup) ?? null,
    targetAudience: r.target_audience ?? {},
    version       : r.version,
    isCurrent     : r.is_current,
    deletedAt     : r.deleted_at ?? null,
    createdAt     : r.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSequence(r: any): ThemeSequence {
  return {
    id           : r.id,
    themeId      : r.theme_id,
    tenantId     : r.tenant_id,
    name         : r.name,
    description  : r.description ?? null,
    sortOrder    : r.sort_order ?? null,
    createdAt    : r.created_at,
    shortCues    : r.short_cues ?? [],
    coachVideoUrl: r.coach_video_url ?? null,
    criteriaIds  : r.criteria_ids ?? undefined,
  }
}

// ─── ThemeGroup ───────────────────────────────────────────────────────────────

export type CreateThemeGroupParams = {
  tenantId  : string
  name      : string
  sortOrder?: number
}

export async function createThemeGroup(
  params: CreateThemeGroupParams
): Promise<{ data: ThemeGroup | null; error: unknown }> {
  const { data, error } = await supabase
    .from('theme_groups')
    .insert({
      tenant_id : params.tenantId,
      name      : params.name,
      sort_order: params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data ? mapGroup(data) : null, error }
}

export async function listThemeGroups(): Promise<{ data: ThemeGroup[]; error: unknown }> {
  const { data, error } = await supabase
    .from('theme_groups')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: data ? (data as unknown[]).map(mapGroup) : [], error }
}

export async function updateThemeGroupOrder(
  id: string,
  sortOrder: number
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('theme_groups')
    .update({ sort_order: sortOrder })
    .eq('id', id)

  return { error }
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type CreateThemeParams = {
  tenantId       : string
  groupId?       : string
  themeKey       : string
  name           : string
  description?   : string
  level?         : ThemeLevel
  ageGroup?      : AgeGroup
  targetAudience?: Record<string, unknown>
}

export async function createTheme(
  params: CreateThemeParams
): Promise<{ data: Theme | null; error: unknown }> {
  const { data, error } = await supabase
    .from('themes')
    .insert({
      tenant_id      : params.tenantId,
      group_id       : params.groupId ?? null,
      theme_key      : params.themeKey,
      name           : params.name,
      description    : params.description ?? null,
      level          : params.level ?? null,
      age_group      : params.ageGroup ?? null,
      target_audience: params.targetAudience ?? {},
    })
    .select()
    .single()

  return { data: data ? mapTheme(data) : null, error }
}

export async function listThemes(
  params?: { groupId?: string }
): Promise<{ data: Theme[]; error: unknown }> {
  let query = supabase
    .from('themes')
    .select('*')
    .eq('is_current', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (params?.groupId) {
    query = query.eq('group_id', params.groupId)
  }

  const { data, error } = await query
  return { data: data ? (data as unknown[]).map(mapTheme) : [], error }
}

export type UpdateThemeParams = {
  id          : string
  name?       : string
  description?: string | null
  groupId?    : string | null
}

export async function updateTheme(
  params: UpdateThemeParams
): Promise<{ data: Theme | null; error: unknown }> {
  const payload: Record<string, unknown> = {}
  if (params.name        !== undefined) payload.name        = params.name
  if (params.description !== undefined) payload.description = params.description
  if (params.groupId     !== undefined) payload.group_id    = params.groupId

  const { data, error } = await supabase
    .from('themes')
    .update(payload)
    .eq('id', params.id)
    .select()
    .single()

  return { data: data ? mapTheme(data) : null, error }
}

export async function getThemeByKey(
  themeKey: string
): Promise<{ data: Theme | null; error: unknown }> {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('theme_key', themeKey)
    .eq('is_current', true)
    .single()

  return { data: data ? mapTheme(data) : null, error }
}

export type NewThemeVersionParams = {
  themeKey       : string
  tenantId       : string
  name?          : string
  description?   : string
  level?         : ThemeLevel
  ageGroup?      : AgeGroup
  targetAudience?: Record<string, unknown>
}

export async function createNewThemeVersion(
  params: NewThemeVersionParams
): Promise<{ data: Theme | null; error: unknown }> {
  // Récupérer la version courante
  const { data: current, error: fetchError } = await supabase
    .from('themes')
    .select('*')
    .eq('theme_key', params.themeKey)
    .eq('is_current', true)
    .single()

  if (fetchError || !current) return { data: null, error: fetchError ?? new Error('Theme not found') }

  // current is raw snake_case from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = current as any
  const { data, error } = await supabase.rpc('create_theme_version', {
    p_theme_key      : params.themeKey,
    p_current_id     : raw.id,
    p_name           : params.name ?? raw.name,
    p_description    : params.description ?? raw.description,
    p_level          : params.level ?? raw.level,
    p_age_group      : params.ageGroup ?? raw.age_group,
    p_target_audience: params.targetAudience ?? raw.target_audience,
    p_tenant_id      : params.tenantId,
  })

  return { data: data ? mapTheme(data) : null, error }
}

// ─── ThemeSequence ────────────────────────────────────────────────────────────

export type CreateThemeSequenceParams = {
  tenantId    : string
  themeId     : string
  name        : string
  description?: string
  sortOrder?  : number
}

export async function createThemeSequence(
  params: CreateThemeSequenceParams
): Promise<{ data: ThemeSequence | null; error: unknown }> {
  const { data, error } = await supabase
    .from('theme_sequences')
    .insert({
      tenant_id  : params.tenantId,
      theme_id   : params.themeId,
      name       : params.name,
      description: params.description ?? null,
      sort_order : params.sortOrder ?? null,
    })
    .select()
    .single()

  return { data: data ? mapSequence(data) : null, error }
}

export async function listSequencesByTheme(
  themeId: string
): Promise<{ data: ThemeSequence[]; error: unknown }> {
  const { data, error } = await supabase
    .from('theme_sequences')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: data ? (data as unknown[]).map(mapSequence) : [], error }
}
