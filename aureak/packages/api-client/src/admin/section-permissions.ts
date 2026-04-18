// @aureak/api-client — Permissions granulaires par section (Story 86.3)
// getUserPermissions : retourne sections autorisées (défauts rôle + overrides individuels)
// setUserSectionOverride : admin uniquement — ajoute/modifie un override
// resetUserSectionOverrides : admin uniquement — supprime tous les overrides d'un utilisateur

import { supabase } from '../supabase'
import type { AppSection, UserRole, UserSectionPermission, UserSectionOverride, RoleDefaultSection } from '@aureak/types'
import { APP_SECTIONS } from '@aureak/types'

// ── Snake → camelCase mapping ──────────────────────────────────────────────

function mapDefaultRow(row: Record<string, unknown>): RoleDefaultSection {
  return {
    id        : row.id          as string,
    role      : row.role        as UserRole,
    sectionKey: row.section_key as AppSection,
    enabled   : row.enabled     as boolean,
    createdAt : row.created_at  as string,
  }
}

function mapOverrideRow(row: Record<string, unknown>): UserSectionOverride {
  return {
    id        : row.id          as string,
    userId    : row.user_id     as string,
    sectionKey: row.section_key as AppSection,
    enabled   : row.enabled     as boolean,
    grantedBy : (row.granted_by as string) ?? null,
    createdAt : row.created_at  as string,
  }
}

/**
 * Retourne les permissions de section résolues pour un utilisateur.
 * Combine les défauts du rôle + les overrides individuels.
 * Nécessite le rôle actif de l'utilisateur.
 */
export async function getUserPermissions(
  userId: string,
  role: UserRole,
): Promise<{ data: UserSectionPermission[]; error: unknown }> {
  // 1. Charger les défauts du rôle
  const { data: defaultRows, error: defaultError } = await supabase
    .from('role_default_sections')
    .select('*')
    .eq('role', role)

  if (defaultError) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] getUserPermissions defaults error:', defaultError)
    return { data: [], error: defaultError }
  }

  // 2. Charger les overrides individuels
  const { data: overrideRows, error: overrideError } = await supabase
    .from('user_section_overrides')
    .select('*')
    .eq('user_id', userId)

  if (overrideError) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] getUserPermissions overrides error:', overrideError)
    return { data: [], error: overrideError }
  }

  const defaults  = (defaultRows ?? []).map(r => mapDefaultRow(r as Record<string, unknown>))
  const overrides = (overrideRows ?? []).map(r => mapOverrideRow(r as Record<string, unknown>))

  // 3. Construire la map des défauts
  const defaultMap = new Map<AppSection, boolean>()
  for (const d of defaults) {
    defaultMap.set(d.sectionKey, d.enabled)
  }

  // 4. Construire la map des overrides
  const overrideMap = new Map<AppSection, boolean>()
  for (const o of overrides) {
    overrideMap.set(o.sectionKey, o.enabled)
  }

  // 5. Fusionner : pour chaque section, override > default > false
  const permissions: UserSectionPermission[] = APP_SECTIONS.map(section => {
    const defaultValue = defaultMap.get(section) ?? false
    const hasOverride  = overrideMap.has(section)
    const enabled      = hasOverride ? overrideMap.get(section)! : defaultValue

    return {
      sectionKey  : section,
      enabled,
      isDefault   : !hasOverride,
      defaultValue,
    }
  })

  return { data: permissions, error: null }
}

/**
 * Définit ou met à jour un override de section pour un utilisateur.
 * Admin uniquement (la RLS le garantit côté DB).
 * Utilise un upsert sur la contrainte unique (user_id, section_key).
 */
export async function setUserSectionOverride(
  userId: string,
  sectionKey: AppSection,
  enabled: boolean,
  grantedBy?: string,
): Promise<{ success: boolean; error?: unknown }> {
  const { error } = await supabase
    .from('user_section_overrides')
    .upsert(
      {
        user_id    : userId,
        section_key: sectionKey,
        enabled,
        granted_by : grantedBy ?? null,
      },
      { onConflict: 'user_id,section_key' },
    )

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] setUserSectionOverride error:', error)
    return { success: false, error }
  }

  return { success: true }
}

/**
 * Supprime un override individuel pour une section (retour au défaut du rôle).
 */
export async function removeUserSectionOverride(
  userId: string,
  sectionKey: AppSection,
): Promise<{ success: boolean; error?: unknown }> {
  const { error } = await supabase
    .from('user_section_overrides')
    .delete()
    .eq('user_id', userId)
    .eq('section_key', sectionKey)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] removeUserSectionOverride error:', error)
    return { success: false, error }
  }

  return { success: true }
}

/**
 * Supprime tous les overrides d'un utilisateur (réinitialisation aux défauts du rôle).
 */
export async function resetUserSectionOverrides(
  userId: string,
): Promise<{ success: boolean; error?: unknown }> {
  const { error } = await supabase
    .from('user_section_overrides')
    .delete()
    .eq('user_id', userId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] resetUserSectionOverrides error:', error)
    return { success: false, error }
  }

  return { success: true }
}
