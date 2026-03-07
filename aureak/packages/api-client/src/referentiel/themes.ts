// Story 3.1 — CRUD référentiel thèmes (ThemeGroup, Theme, ThemeSequence)
import { supabase } from '../supabase'
import type { ThemeGroup, Theme, ThemeSequence, ThemeLevel, AgeGroup } from '@aureak/types'

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

  return { data: data as ThemeGroup | null, error }
}

export async function listThemeGroups(): Promise<{ data: ThemeGroup[]; error: unknown }> {
  const { data, error } = await supabase
    .from('theme_groups')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as ThemeGroup[]) ?? [], error }
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

  return { data: data as Theme | null, error }
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
  return { data: (data as Theme[]) ?? [], error }
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

  return { data: data as Theme | null, error }
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

  const { data, error } = await supabase.rpc('create_theme_version', {
    p_theme_key      : params.themeKey,
    p_current_id     : (current as { id: string }).id,
    p_name           : params.name ?? (current as { name: string }).name,
    p_description    : params.description ?? (current as { description: string | null }).description,
    p_level          : params.level ?? (current as { level: string | null }).level,
    p_age_group      : params.ageGroup ?? (current as { age_group: string | null }).age_group,
    p_target_audience: params.targetAudience ?? (current as { target_audience: Record<string, unknown> }).target_audience,
    p_tenant_id      : params.tenantId,
  })

  return { data: data as Theme | null, error }
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

  return { data: data as ThemeSequence | null, error }
}

export async function listSequencesByTheme(
  themeId: string
): Promise<{ data: ThemeSequence[]; error: unknown }> {
  const { data, error } = await supabase
    .from('theme_sequences')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as ThemeSequence[]) ?? [], error }
}
