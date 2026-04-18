// Admin — Liste des marketeurs avec pagination
// Story 87.2 : Page Academie > Marketeurs

import { supabase } from '../supabase'

export type MarketerListRow = {
  userId     : string
  displayName: string | null
}

/** listMarketers — liste paginee des profils avec user_role = 'marketeur' */
export async function listMarketers(opts: {
  page    : number
  pageSize: number
}): Promise<{ data: MarketerListRow[]; count: number; error: unknown }> {
  const { data, count, error } = await supabase
    .from('profiles')
    .select('user_id, display_name', { count: 'exact' })
    .eq('user_role', 'marketeur')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
    .range(opts.page * opts.pageSize, (opts.page + 1) * opts.pageSize - 1)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listMarketers] error:', error)
    return { data: [], count: 0, error }
  }

  const rows: MarketerListRow[] = (
    (data ?? []) as { user_id: string; display_name: string | null }[]
  ).map(p => ({
    userId     : p.user_id,
    displayName: p.display_name,
  }))

  return { data: rows, count: count ?? 0, error: null }
}

/** getMarketerProfile — profil detaille d'un marketeur */
export async function getMarketerProfile(userId: string): Promise<{ data: MarketerListRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .eq('user_id', userId)
    .eq('user_role', 'marketeur')
    .is('deleted_at', null)
    .single()

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[marketers] getMarketerProfile error:', error)
    return { data: null, error }
  }

  return {
    data: {
      userId     : (data as { user_id: string }).user_id,
      displayName: (data as { display_name: string | null }).display_name,
    },
    error: null,
  }
}
