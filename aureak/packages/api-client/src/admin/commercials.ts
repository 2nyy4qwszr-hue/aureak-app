// Admin — Liste des commerciaux avec pagination
// Story 87.1 : Page Academie > Commerciaux

import { supabase } from '../supabase'

export type CommercialListRow = {
  userId     : string
  displayName: string | null
}

/** listCommercials — liste paginée des profils avec user_role = 'commercial' */
export async function listCommercials(opts: {
  page    : number
  pageSize: number
}): Promise<{ data: CommercialListRow[]; count: number; error: unknown }> {
  const { data, count, error } = await supabase
    .from('profiles')
    .select('user_id, display_name', { count: 'exact' })
    .eq('user_role', 'commercial')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
    .range(opts.page * opts.pageSize, (opts.page + 1) * opts.pageSize - 1)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listCommercials] error:', error)
    return { data: [], count: 0, error }
  }

  const rows: CommercialListRow[] = (
    (data ?? []) as { user_id: string; display_name: string | null }[]
  ).map(p => ({
    userId     : p.user_id,
    displayName: p.display_name,
  }))

  return { data: rows, count: count ?? 0, error: null }
}

/** getCommercialProfile — profil détaillé d'un commercial */
export async function getCommercialProfile(userId: string): Promise<{ data: CommercialListRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .eq('user_id', userId)
    .eq('user_role', 'commercial')
    .is('deleted_at', null)
    .single()

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[commercials] getCommercialProfile error:', error)
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
