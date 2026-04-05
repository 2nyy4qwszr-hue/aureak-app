// Admin Dashboard — compteurs KPI + activity feed
// Extrait les counts depuis Supabase (conformité ARCH-1 : accès centralisé).

import { supabase } from '../supabase'
import { countActivePlayersCurrentSeason } from './child-directory'

// ── Activity Feed (Story 50.5) ────────────────────────────────────────────────

export type ActivityEventType = 'presence' | 'new_player' | 'badge'

export type ActivityEventItem = {
  id         : string
  type       : ActivityEventType
  playerName : string
  description: string
  createdAt  : string  // ISO
  isNew     ?: boolean
}

/**
 * Charge les événements initiaux du feed d'activité :
 * - 5 dernières présences validées (attendance_records WHERE status='present')
 * - 5 derniers nouveaux joueurs (child_directory ORDER BY created_at DESC)
 * Fusionné et trié par date DESC, limité à 10.
 */
export async function fetchActivityFeed(): Promise<{ data: ActivityEventItem[]; error: unknown }> {
  const [attendanceRes, playersRes] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('id, child_id, created_at, session_id')
      .eq('status', 'present')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('child_directory')
      .select('id, display_name, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (attendanceRes.error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[dashboard] fetchActivityFeed attendance error:', attendanceRes.error)
  }
  if (playersRes.error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[dashboard] fetchActivityFeed players error:', playersRes.error)
  }

  const presenceEvents: ActivityEventItem[] = ((attendanceRes.data ?? []) as {
    id: string; child_id: string; created_at: string; session_id: string
  }[]).map(r => ({
    id         : `presence-${r.id}`,
    type       : 'presence' as ActivityEventType,
    playerName : r.child_id ? `Joueur` : 'Joueur',
    description: 'Présence validée en séance',
    createdAt  : r.created_at,
  }))

  const playerEvents: ActivityEventItem[] = ((playersRes.data ?? []) as {
    id: string; display_name: string; created_at: string
  }[]).map(r => ({
    id         : `new_player-${r.id}`,
    type       : 'new_player' as ActivityEventType,
    playerName : r.display_name ?? 'Joueur',
    description: 'Nouveau joueur inscrit',
    createdAt  : r.created_at,
  }))

  const merged = [...presenceEvents, ...playerEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return { data: merged, error: attendanceRes.error ?? playersRes.error ?? null }
}

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
