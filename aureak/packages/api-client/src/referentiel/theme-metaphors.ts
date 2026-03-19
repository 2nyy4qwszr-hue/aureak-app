import { supabase } from '../supabase'
import type { ThemeMetaphor } from '@aureak/types'

function toThemeMetaphor(r: Record<string, unknown>): ThemeMetaphor {
  return {
    id         : r.id as string,
    tenantId   : r.tenant_id as string,
    themeId    : r.theme_id as string,
    title      : r.title as string,
    description: r.description as string | null,
    sequenceId : r.sequence_id as string | null,
    sortOrder  : (r.sort_order as number) ?? 0,
    createdAt  : r.created_at as string,
    updatedAt  : r.updated_at as string,
  }
}

export type CreateThemeMetaphorParams = {
  tenantId    : string
  themeId     : string
  title       : string
  description?: string | null
  sequenceId ?: string | null
  sortOrder  ?: number
}

export type UpdateThemeMetaphorParams = Partial<{
  title      : string
  description: string | null
  sequenceId : string | null
  sortOrder  : number
}>

export async function listMetaphorsByTheme(themeId: string): Promise<ThemeMetaphor[]> {
  const { data } = await supabase
    .from('theme_metaphors')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order', { ascending: true })
  return (data ?? []).map(r => toThemeMetaphor(r as Record<string, unknown>))
}

export async function createThemeMetaphor(
  params: CreateThemeMetaphorParams
): Promise<ThemeMetaphor> {
  const { data, error } = await supabase
    .from('theme_metaphors')
    .insert({
      tenant_id  : params.tenantId,
      theme_id   : params.themeId,
      title      : params.title,
      description: params.description ?? null,
      sequence_id: params.sequenceId ?? null,
      sort_order : params.sortOrder ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return toThemeMetaphor(data as Record<string, unknown>)
}

export async function updateThemeMetaphor(
  id    : string,
  params: UpdateThemeMetaphorParams,
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (params.title       !== undefined) payload.title       = params.title
  if (params.description !== undefined) payload.description = params.description
  if (params.sequenceId  !== undefined) payload.sequence_id = params.sequenceId
  if (params.sortOrder   !== undefined) payload.sort_order  = params.sortOrder
  const { error } = await supabase
    .from('theme_metaphors')
    .update(payload)
    .eq('id', id)
  if (error) throw error
}

export async function deleteThemeMetaphor(id: string): Promise<void> {
  const { error } = await supabase.from('theme_metaphors').delete().eq('id', id)
  if (error) throw error
}

export async function linkMetaphorToSequence(
  metaphorId: string,
  sequenceId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('theme_metaphors')
    .update({ sequence_id: sequenceId })
    .eq('id', metaphorId)
  if (error) throw error
}
