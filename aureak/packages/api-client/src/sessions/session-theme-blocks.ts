// Story 21.2 — Blocs thème/séquence/ressource liés aux séances opérationnelles
// Table : session_theme_blocks (migration 00072)
import { supabase } from '../supabase'
import type { SessionThemeBlock } from '@aureak/types'

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapBlock(r: Record<string, unknown>): SessionThemeBlock {
  return {
    id           : r['id']            as string,
    tenantId     : r['tenant_id']     as string,
    sessionId    : r['session_id']    as string,
    themeId      : r['theme_id']      as string,
    sequenceId   : (r['sequence_id']  as string | null) ?? null,
    resourceId   : (r['resource_id']  as string | null) ?? null,
    sortOrder    : (r['sort_order']   as number) ?? 0,
    createdAt    : r['created_at']    as string,
    // Joined data (présents si le select inclut les tables jointes)
    themeName    : (r['theme_name']   as string | undefined),
    sequenceName : (r['sequence_name'] as string | undefined),
    resourceLabel: (r['resource_label'] as string | undefined),
    resourceUrl  : (r['resource_url']  as string | undefined),
  }
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

/**
 * Lister les blocs thème d'une séance, triés par sort_order.
 * Joint les noms de thème, séquence et ressource pour l'affichage.
 */
export async function listSessionThemeBlocks(
  sessionId: string
): Promise<SessionThemeBlock[]> {
  const { data, error } = await supabase
    .from('session_theme_blocks')
    .select(`
      id, tenant_id, session_id, theme_id, sequence_id, resource_id, sort_order, created_at,
      themes!theme_id            ( name ),
      theme_sequences!sequence_id ( name ),
      theme_resources!resource_id ( label, url )
    `)
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  if (error) return []

  return ((data ?? []) as unknown as Record<string, unknown>[]).map(r => {
    const theme    = r['themes']           as Record<string, unknown> | null
    const sequence = r['theme_sequences']  as Record<string, unknown> | null
    const resource = r['theme_resources']  as Record<string, unknown> | null
    return mapBlock({
      ...r,
      theme_name    : theme?.['name'],
      sequence_name : sequence?.['name'],
      resource_label: resource?.['label'],
      resource_url  : resource?.['url'],
    })
  })
}

export type AddSessionThemeBlockParams = {
  sessionId  : string
  tenantId   : string
  themeId    : string
  sequenceId?: string
  resourceId?: string
  sortOrder? : number
}

/** Ajouter un bloc thème à une séance. */
export async function addSessionThemeBlock(
  params: AddSessionThemeBlockParams
): Promise<{ data: SessionThemeBlock | null; error: string | null }> {
  const { data, error } = await supabase
    .from('session_theme_blocks')
    .insert({
      tenant_id  : params.tenantId,
      session_id : params.sessionId,
      theme_id   : params.themeId,
      sequence_id: params.sequenceId ?? null,
      resource_id: params.resourceId ?? null,
      sort_order : params.sortOrder ?? 0,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data ? mapBlock(data as unknown as Record<string, unknown>) : null, error: null }
}

/** Mettre à jour un bloc (séquence, ressource ou ordre). */
export async function updateSessionThemeBlock(
  blockId: string,
  patch: Partial<Pick<SessionThemeBlock, 'sequenceId' | 'resourceId' | 'sortOrder'>>
): Promise<{ error: string | null }> {
  const updates: Record<string, unknown> = {}
  if (patch.sequenceId !== undefined) updates['sequence_id'] = patch.sequenceId
  if (patch.resourceId !== undefined) updates['resource_id'] = patch.resourceId
  if (patch.sortOrder  !== undefined) updates['sort_order']  = patch.sortOrder

  const { error } = await supabase
    .from('session_theme_blocks')
    .update(updates)
    .eq('id', blockId)

  return { error: error?.message ?? null }
}

/** Supprimer un bloc thème. */
export async function removeSessionThemeBlock(
  blockId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('session_theme_blocks')
    .delete()
    .eq('id', blockId)

  return { error: error?.message ?? null }
}
