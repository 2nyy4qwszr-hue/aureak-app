// Admin Dashboard — compteurs KPI + activity feed + streak players
// Extrait les counts depuis Supabase (conformité ARCH-1 : accès centralisé).

import { supabase } from '../supabase'
import { countActivePlayersCurrentSeason } from './child-directory'
import type { NavBadgeCounts } from '@aureak/types'

// ── Streak Players (Story 50.6) ───────────────────────────────────────────────

export type StreakPlayer = {
  childId    : string
  displayName: string
  streak     : number  // nombre de présences consécutives
}

/**
 * Retourne les `limit` joueurs ayant la plus longue streak de présences consécutives.
 * Calcul JS côté client : récupère 90 jours d'attendance, groupe par child_id,
 * remonte depuis la séance la plus récente jusqu'au premier absent.
 * Seuls les joueurs avec streak >= 5 sont inclus (AC2).
 */
export async function getTopStreakPlayers(
  limit = 3
): Promise<{ data: StreakPlayer[] | null; error: unknown }> {
  const since = new Date(Date.now() - 90 * 24 * 3600_000).toISOString()

  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('child_id, status, sessions(scheduled_at)')
    .gte('sessions.scheduled_at', since)
    .in('status', ['present', 'absent'])
    .order('child_id')

  if (recordsError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[dashboard] getTopStreakPlayers attendance error:', recordsError)
    return { data: null, error: recordsError }
  }

  // Grouper par child_id
  // Note: Supabase retourne sessions comme array (résultat de join) — accès via [0]
  const byChild = new Map<string, { status: string; date: string }[]>()
  for (const row of (records ?? []) as unknown as { child_id: string; status: string; sessions: { scheduled_at: string }[] | null }[]) {
    const childId = row.child_id
    if (!childId) continue
    const arr = byChild.get(childId) ?? []
    const scheduledAt = Array.isArray(row.sessions) ? (row.sessions[0]?.scheduled_at ?? '') : ''
    arr.push({ status: row.status, date: scheduledAt })
    byChild.set(childId, arr)
  }

  // Calculer streak pour chaque enfant
  const streaks: Array<{ childId: string; streak: number }> = []
  for (const [childId, recs] of byChild.entries()) {
    // Trier DESC par date (le plus récent en premier)
    const sorted = recs
      .filter(r => r.date !== '')
      .sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    for (const r of sorted) {
      if (r.status === 'present') streak++
      else break
    }
    if (streak >= 5) streaks.push({ childId, streak })
  }

  // Trier DESC par streak, résoudre les égalités par childId (stable, déterministe)
  streaks.sort((a, b) => b.streak - a.streak || a.childId.localeCompare(b.childId))
  const top = streaks.slice(0, limit)

  if (top.length === 0) return { data: [], error: null }

  // Récupérer les noms depuis profiles
  const ids = top.map(t => t.childId)
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', ids)

  if (profilesError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[dashboard] getTopStreakPlayers profiles error:', profilesError)
  }

  const nameMap = new Map(
    ((profilesData ?? []) as { user_id: string; display_name: string | null }[])
      .map(p => [p.user_id, p.display_name ?? 'Joueur'])
  )

  return {
    data: top.map(t => ({
      childId    : t.childId,
      displayName: nameMap.get(t.childId) ?? 'Joueur',
      streak     : t.streak,
    })),
    error: null,
  }
}

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

// ── Nav Badge Counts (Story 51.4) ─────────────────────────────────────────────

export type { NavBadgeCounts }

/**
 * Retourne les compteurs pour les pastilles de notification de la sidebar.
 * - presencesUnvalidated : nombre de séances avec statut 'réalisée' ayant au moins
 *   un session_attendee avec status NULL (présences non saisies).
 * - sessionsUpcoming24h : true si au moins une séance planifiée dans les 24 prochaines heures.
 */
export async function getNavBadgeCounts(): Promise<NavBadgeCounts> {
  const now   = new Date().toISOString()
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const [unvalidatedRes, upcoming24hRes] = await Promise.all([
    // Séances réalisées avec au moins un attendee sans statut (présences non saisies)
    supabase
      .from('sessions')
      .select('id, session_attendees!inner(status)')
      .eq('status', 'réalisée')
      .is('session_attendees.status', null),

    // Séances planifiées dans les 24 prochaines heures
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'planifiée')
      .gte('scheduled_at', now)
      .lte('scheduled_at', in24h),
  ])

  if (unvalidatedRes.error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[dashboard] getNavBadgeCounts unvalidated error:', unvalidatedRes.error)
  }
  if (upcoming24hRes.error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[dashboard] getNavBadgeCounts upcoming24h error:', upcoming24hRes.error)
  }

  // Dédupliquer : une session peut apparaître plusieurs fois si plusieurs attendees NULL
  const unvalidatedIds = new Set(
    ((unvalidatedRes.data ?? []) as { id: string }[]).map(r => r.id)
  )

  return {
    presencesUnvalidated : unvalidatedIds.size,
    sessionsUpcoming24h  : (upcoming24hRes.count ?? 0) > 0,
  }
}
