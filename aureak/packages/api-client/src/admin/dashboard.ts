// Admin Dashboard — compteurs KPI
// Extrait les counts depuis Supabase (conformité ARCH-1 : accès centralisé).

import { supabase } from '../supabase'
import { countActivePlayersCurrentSeason } from './child-directory'

export type DashboardKpiCounts = {
  childrenTotal: number
  coachesTotal : number
  groupsTotal  : number
}

/**
 * Retourne les compteurs KPI globaux ou filtrés par implantation.
 * Appelé par dashboard/page.tsx à chaque changement de filtre.
 *
 * Mode global : `childrenTotal` = joueurs ayant un membership en saison courante
 *   → source : `v_child_academy_status WHERE in_current_season = true` (Story 42.3)
 * Mode par implantation : `childrenTotal` = enfants dans les groupes de l'implantation
 *   (accès opérationnel — groupes auth, logique distincte de l'annuaire)
 */
export async function getDashboardKpiCounts(
  implantationId?: string
): Promise<{ data: DashboardKpiCounts; error: unknown }> {
  const empty: DashboardKpiCounts = { childrenTotal: 0, coachesTotal: 0, groupsTotal: 0 }

  if (!implantationId) {
    // Compteurs globaux — joueurs actifs via v_child_academy_status (saison courante)
    const [activePlayersCount, coachRes, groupRes] = await Promise.all([
      countActivePlayersCurrentSeason(),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('user_role', 'coach')
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ])

    const error = coachRes.error ?? groupRes.error
    if (error) return { data: empty, error }

    return {
      data: {
        childrenTotal: activePlayersCount,
        coachesTotal : coachRes.count  ?? 0,
        groupsTotal  : groupRes.count  ?? 0,
      },
      error: null,
    }
  }

  // Compteurs filtrés par implantation
  const { data: groupsData, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .eq('implantation_id', implantationId)
    .is('deleted_at', null)

  if (groupsError) return { data: empty, error: groupsError }

  const groupIds   = (groupsData ?? []).map((g: { id: string }) => g.id)
  const groupsTotal = groupIds.length

  const [childData, coachData] = await Promise.all([
    groupIds.length > 0
      ? supabase.from('group_members').select('child_id').in('group_id', groupIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('coach_implantation_assignments')
      .select('coach_id', { count: 'exact', head: true })
      .eq('implantation_id', implantationId)
      .is('unassigned_at', null),
  ])

  const error = childData.error ?? coachData.error
  if (error) return { data: empty, error }

  const distinctChildren = new Set(
    ((childData.data ?? []) as { child_id: string }[]).map(m => m.child_id)
  )

  return {
    data: {
      childrenTotal: distinctChildren.size,
      coachesTotal : (coachData as { count: number | null }).count ?? 0,
      groupsTotal,
    },
    error: null,
  }
}
