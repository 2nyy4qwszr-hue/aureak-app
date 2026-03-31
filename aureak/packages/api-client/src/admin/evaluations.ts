// Admin — Liste des évaluations avec résolution des noms d'enfants
// Conformité ARCH-1 : accès Supabase centralisé hors composants UI.

import { supabase } from '../supabase'

export type AdminEvalRow = {
  id         : string
  sessionId  : string
  childId    : string
  childName  : string | null
  receptivite: string
  goutEffort : string
  attitude   : string
  topSeance  : boolean
  evalAt     : string
}

/**
 * Liste les évaluations sur une plage de dates, avec le display_name de l'enfant résolu.
 * Utilisé par la page admin evaluations/index.tsx.
 */
export async function listEvaluationsAdmin(
  from: string,
  to  : string,
): Promise<{ data: AdminEvalRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      id, session_id, child_id, receptivite, gout_effort, attitude, top_seance, updated_at,
      profiles!evaluations_child_id_fkey ( display_name )
    `)
    .gte('updated_at', new Date(from + 'T00:00:00').toISOString())
    .lte('updated_at', new Date(to + 'T23:59:59').toISOString())
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) return { data: [], error }

  const rows: AdminEvalRow[] = ((data ?? []) as unknown[]).map((r) => {
    const row = r as {
      id: string; session_id: string; child_id: string
      receptivite: string; gout_effort: string; attitude: string
      top_seance: boolean; updated_at: string
      profiles: { display_name: string | null }[] | { display_name: string | null } | null
    }
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id         : row.id,
      sessionId  : row.session_id,
      childId    : row.child_id,
      childName  : (profile as { display_name: string | null } | undefined)?.display_name ?? null,
      receptivite: row.receptivite,
      goutEffort : row.gout_effort,
      attitude   : row.attitude,
      topSeance  : row.top_seance,
      evalAt     : row.updated_at,
    }
  })

  return { data: rows, error: null }
}
