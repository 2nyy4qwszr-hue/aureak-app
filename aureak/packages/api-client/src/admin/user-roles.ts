// @aureak/api-client — Multi-rôle utilisateur (Story 86.2)
// Fonctions CRUD pour la table user_roles (many-to-many user ↔ rôle)

import { supabase } from '../supabase'
import type { UserRoleAssignment } from '@aureak/types'
import type { UserRole } from '@aureak/types'

// ── Snake → camelCase mapping ──────────────────────────────────────────────
function mapRow(row: Record<string, unknown>): UserRoleAssignment {
  return {
    id       : row.id        as string,
    userId   : row.user_id   as string,
    role     : row.role       as UserRole,
    isPrimary: row.is_primary as boolean,
    createdAt: row.created_at as string,
  }
}

/**
 * Liste tous les rôles assignés à un utilisateur.
 */
export async function listUserRoles(userId: string): Promise<UserRoleAssignment[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] listUserRoles error:', error)
    return []
  }

  return (data ?? []).map(mapRow)
}

/**
 * Définit le rôle actif (is_primary) pour un utilisateur.
 * Met à jour is_primary = false sur tous les autres rôles de cet utilisateur,
 * puis is_primary = true sur le rôle sélectionné.
 */
export async function setActiveRole(
  userId: string,
  role: UserRole,
): Promise<{ success: boolean; error?: unknown }> {
  // 1. Remettre tous les rôles de l'utilisateur à is_primary = false
  const { error: resetError } = await supabase
    .from('user_roles')
    .update({ is_primary: false })
    .eq('user_id', userId)

  if (resetError) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] setActiveRole reset error:', resetError)
    return { success: false, error: resetError }
  }

  // 2. Mettre le rôle sélectionné à is_primary = true
  const { error: setError } = await supabase
    .from('user_roles')
    .update({ is_primary: true })
    .eq('user_id', userId)
    .eq('role', role)

  if (setError) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] setActiveRole set error:', setError)
    return { success: false, error: setError }
  }

  // 3. Mettre à jour profiles.user_role pour backward compatibility
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ user_role: role })
    .eq('user_id', userId)

  if (profileError) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] setActiveRole profile sync error:', profileError)
    // Non-blocking — le rôle actif est dans user_roles, profiles est juste pour compat
  }

  return { success: true }
}

/**
 * Ajoute un rôle à un utilisateur (admin uniquement).
 */
export async function addUserRole(
  userId: string,
  role: UserRole,
  isPrimary = false,
): Promise<{ data: UserRoleAssignment | null; error: unknown }> {
  const { data, error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role, is_primary: isPrimary })
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] addUserRole error:', error)
    return { data: null, error }
  }

  return { data: mapRow(data as Record<string, unknown>), error: null }
}

/**
 * Supprime un rôle d'un utilisateur (admin uniquement).
 */
export async function removeUserRole(
  userId: string,
  role: UserRole,
): Promise<{ success: boolean; error?: unknown }> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[api-client] removeUserRole error:', error)
    return { success: false, error }
  }

  return { success: true }
}
