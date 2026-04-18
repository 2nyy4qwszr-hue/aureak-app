// @aureak/api-client — Story 86-2
// Fonctions CRUD pour la table profile_roles (rôles additionnels par profil).
// RÈGLE : seul ce fichier accède à supabase.from('profile_roles').
// profile_roles est ADDITIF — profiles.user_role reste source de vérité RLS.

import { supabase } from '../supabase'
import type { UserRole } from '@aureak/types'

/**
 * listUserRoles — rôles actifs (non soft-deleted) d'un profil.
 * Retourne un array de UserRole, tri non garanti.
 * Admin → peut lister n'importe quel profil. User → peut lister ses propres rôles (RLS).
 */
export async function listUserRoles(profileId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('role')
    .eq('profile_id', profileId)
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listUserRoles] error:', error)
    throw error
  }
  return (data ?? []).map((r) => r.role as UserRole)
}

/**
 * assignRoleToUser — attribue un rôle à un profil (admin uniquement, vérifié par RLS).
 * Idempotent : si le rôle existe déjà (actif ou soft-deleted), réactive (deleted_at = null).
 */
export async function assignRoleToUser(profileId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profile_roles')
    .upsert(
      { profile_id: profileId, role, deleted_at: null },
      { onConflict: 'profile_id,role' }
    )

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[assignRoleToUser] error:', error)
    throw error
  }
}

/**
 * revokeRoleFromUser — soft-delete d'un rôle (admin uniquement, vérifié par RLS).
 * Le rôle n'est pas supprimé physiquement — deleted_at est mis à jour.
 */
export async function revokeRoleFromUser(profileId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profile_roles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .eq('role', role)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[revokeRoleFromUser] error:', error)
    throw error
  }
}
