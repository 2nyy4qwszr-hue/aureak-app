// Story 3.1 — CRUD référentiel thèmes (ThemeGroup, Theme, ThemeSequence)
import { supabase } from '../supabase'
import type { ThemeGroup, Theme, ThemeSequence, ThemeLevel, AgeGroup, CoachGradeLevel } from '@aureak/types'

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
    imageUrl      : r.image_url ?? null,
    orderIndex         : r.order_index ?? 0,
    category           : r.category ?? null,
    positionIndex      : r.position_index ?? null,
    requiredGradeLevel : (r.required_grade_level as CoachGradeLevel) ?? 'bronze',
    deletedAt          : r.deleted_at ?? null,
    createdAt          : r.created_at,
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

export async function updateThemeGroup(
  id: string,
  params: { name: string },
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('theme_groups')
    .update({ name: params.name })
    .eq('id', id)

  return { error: error ?? null }
}

export async function deleteThemeGroup(
  id: string,
): Promise<{ error: null | { type: 'IN_USE'; count: number } | unknown }> {
  // 1. Vérifier les thèmes qui utilisent ce bloc
  const { count: themeCount } = await supabase
    .from('themes')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', id)
    .is('deleted_at', null)

  // 2. Vérifier les situations qui utilisent ce bloc
  const { count: sitCount } = await supabase
    .from('situations')
    .select('id', { count: 'exact', head: true })
    .eq('bloc_id', id)
    .is('deleted_at', null)

  const total = (themeCount ?? 0) + (sitCount ?? 0)
  if (total > 0) {
    return { error: { type: 'IN_USE' as const, count: total } }
  }

  // 3. Soft-delete
  const { error } = await supabase
    .from('theme_groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error ?? null }
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
  imageUrl?      : string | null
  category?      : string | null
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
      image_url      : params.imageUrl ?? null,
      category       : params.category ?? null,
    })
    .select()
    .single()

  return { data: data ? mapTheme(data) : null, error }
}

export async function listThemes(
  params?: { groupId?: string; category?: string }
): Promise<{ data: Theme[]; error: unknown }> {
  let query = supabase
    .from('themes')
    .select('*')
    .eq('is_current', true)
    .is('deleted_at', null)
    .order('position_index', { ascending: true, nullsFirst: false })
    .order('order_index',    { ascending: true, nullsFirst: false })
    .order('name',           { ascending: true })

  if (params?.groupId)  query = query.eq('group_id', params.groupId)
  if (params?.category) query = query.eq('category', params.category)

  const { data, error } = await query
  return { data: data ? (data as unknown[]).map(mapTheme) : [], error }
}

export type UpdateThemeParams = {
  id                  : string
  name?               : string
  description?        : string | null
  groupId?            : string | null
  imageUrl?           : string | null
  orderIndex?         : number
  category?           : string | null
  positionIndex?      : number | null
  requiredGradeLevel? : CoachGradeLevel
}

export async function updateTheme(
  params: UpdateThemeParams
): Promise<{ data: Theme | null; error: unknown }> {
  const payload: Record<string, unknown> = {}
  if (params.name        !== undefined) payload.name        = params.name
  if (params.description !== undefined) payload.description = params.description
  if (params.groupId     !== undefined) payload.group_id    = params.groupId
  if (params.imageUrl    !== undefined) payload.image_url   = params.imageUrl
  if (params.orderIndex          !== undefined) payload.order_index           = params.orderIndex
  if (params.category            !== undefined) payload.category              = params.category
  if (params.positionIndex       !== undefined) payload.position_index        = params.positionIndex
  if (params.requiredGradeLevel  !== undefined) payload.required_grade_level  = params.requiredGradeLevel

  const { data, error } = await supabase
    .from('themes')
    .update(payload)
    .eq('id', params.id)
    .select()
    .single()

  return { data: data ? mapTheme(data) : null, error }
}

export async function updateThemeOrder(
  id        : string,
  orderIndex: number,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('themes')
    .update({ order_index: orderIndex })
    .eq('id', id)
  return { error }
}

export async function updateThemePositionIndex(
  id           : string,
  positionIndex: number | null,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('themes')
    .update({ position_index: positionIndex })
    .eq('id', id)
  return { error }
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

  if (error || !data) return { data: null, error }

  // Transférer position_index vers la nouvelle version.
  // L'ancienne version est maintenant is_current = false, donc la contrainte
  // uq_themes_group_position (WHERE is_current = true) ne bloque pas.
  const newTheme = mapTheme(data)
  if (raw.position_index != null) {
    const { error: posError } = await updateThemePositionIndex(newTheme.id, raw.position_index as number)
    if (posError) {
      // La version est créée mais la position n'a pas été transférée — on remonte l'erreur.
      return { data: newTheme, error: posError }
    }
    newTheme.positionIndex = raw.position_index as number
  }

  return { data: newTheme, error: null }
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

export type UpdateThemeSequenceParams = Partial<{
  name         : string
  description  : string | null
  shortCues    : string[]
  coachVideoUrl: string | null
  sortOrder    : number
}>

export async function updateThemeSequence(
  id    : string,
  params: UpdateThemeSequenceParams,
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (params.name          !== undefined) payload.name            = params.name
  if (params.description   !== undefined) payload.description     = params.description
  if (params.shortCues     !== undefined) payload.short_cues      = params.shortCues
  if (params.coachVideoUrl !== undefined) payload.coach_video_url = params.coachVideoUrl
  if (params.sortOrder     !== undefined) payload.sort_order      = params.sortOrder

  const { error } = await supabase
    .from('theme_sequences')
    .update(payload)
    .eq('id', id)
  if (error) throw error
}

export async function deleteThemeSequence(id: string): Promise<void> {
  const { error } = await supabase.from('theme_sequences').delete().eq('id', id)
  if (error) throw error
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
