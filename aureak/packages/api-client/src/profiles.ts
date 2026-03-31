// @aureak/api-client — Résolution de noms de profils
// Utilisé par toute couche UI qui a besoin de résoudre user_id → display_name
// sans accéder directement à Supabase (conformité ARCH-1).

import { supabase } from './supabase'

/** Résout le display_name d'un utilisateur unique. */
export async function getProfileDisplayName(
  userId: string
): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error }
  return { data: (data as { display_name: string | null } | null)?.display_name ?? null, error: null }
}

/** Résout les display_names de plusieurs utilisateurs en une seule requête.
 *  Retourne un map user_id → display_name. */
export async function resolveProfileDisplayNames(
  userIds: string[]
): Promise<{ data: Record<string, string>; error: unknown }> {
  if (userIds.length === 0) return { data: {}, error: null }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds)

  if (error) return { data: {}, error }

  const map: Record<string, string> = {}
  for (const p of (data ?? []) as { user_id: string; display_name: string | null }[]) {
    if (p.display_name) map[p.user_id] = p.display_name
  }
  return { data: map, error: null }
}
