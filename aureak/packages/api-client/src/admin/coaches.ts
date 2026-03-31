// Admin — Liste des coachs avec pagination
// Conformité ARCH-1 : remplace l'accès direct profiles dans coaches/index.tsx.

import { supabase } from '../supabase'

export type CoachListRow = {
  userId     : string
  displayName: string | null
}

/**
 * Liste les profils coach avec pagination et compte total.
 * Utilisé par la page admin coaches/index.tsx.
 */
export async function listCoaches(opts: {
  page    : number
  pageSize: number
}): Promise<{ data: CoachListRow[]; count: number; error: unknown }> {
  const { data, count, error } = await supabase
    .from('profiles')
    .select('user_id, display_name', { count: 'exact' })
    .eq('user_role', 'coach')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
    .range(opts.page * opts.pageSize, (opts.page + 1) * opts.pageSize - 1)

  if (error) return { data: [], count: 0, error }

  const rows: CoachListRow[] = (
    (data ?? []) as { user_id: string; display_name: string | null }[]
  ).map(p => ({
    userId     : p.user_id,
    displayName: p.display_name,
  }))

  return { data: rows, count: count ?? 0, error: null }
}
