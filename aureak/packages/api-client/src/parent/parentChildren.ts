// Parent — Liste des enfants liés à un parent
// Conformité ARCH-1 : remplace l'accès direct parent_child_links dans parent/dashboard.

import { supabase } from '../supabase'

export type ParentChildLink = {
  childId    : string
  displayName: string | null
}

/**
 * Retourne les enfants liés à un parent avec leur display_name résolu.
 * Utilisé par parent/dashboard/index.tsx.
 */
export async function listChildrenOfParent(
  parentId: string
): Promise<{ data: ParentChildLink[]; error: unknown }> {
  const { data, error } = await supabase
    .from('parent_child_links')
    .select('child_id, profiles!child_id(display_name)')
    .eq('parent_id', parentId)

  if (error) return { data: [], error }

  const rows: ParentChildLink[] = ((data ?? []) as unknown[]).map((link) => {
    const l = link as {
      child_id: string
      profiles: { display_name: string | null } | { display_name: string | null }[] | null
    }
    const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles
    return {
      childId    : l.child_id,
      displayName: profile?.display_name ?? null,
    }
  })

  return { data: rows, error: null }
}
