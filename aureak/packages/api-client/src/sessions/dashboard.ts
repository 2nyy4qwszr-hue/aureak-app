// Sessions — Dashboard Opérationnel Admin (Story 32.2)
// Fournit les données agrégées pour le tableau de bord séances :
// cartes séances, alertes, métriques coach, absences consécutives

import { supabase } from '../supabase'
import type {
  AdminAlert,
  CoachQualityMetrics,
  SessionAttendanceStats,
  ChildConsecutiveAbsence,
  TopGroupResult,
} from '@aureak/types'

// ─── Filtres ──────────────────────────────────────────────────────────────────

export type SessionCardFilters = {
  implantationId? : string
  groupId?        : string
  sessionType?    : string
  status?         : string
  /** ISO date range */
  fromDate?       : string
  toDate?         : string
}

// ─── Session Cards ────────────────────────────────────────────────────────────

/**
 * Retourne les séances avec leurs stats de présence agrégées.
 * Utilisé pour la grille de cartes du dashboard.
 */
export async function listSessionCards(
  filters?: SessionCardFilters,
): Promise<{ data: SessionAttendanceStats[]; error: unknown }> {
  let query = supabase
    .from('v_session_attendance_stats')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(200)

  if (filters?.implantationId) query = query.eq('implantation_id', filters.implantationId)
  if (filters?.groupId)        query = query.eq('group_id', filters.groupId)
  if (filters?.sessionType)    query = query.eq('session_type', filters.sessionType)
  if (filters?.status)         query = query.eq('status', filters.status)
  if (filters?.fromDate)       query = query.gte('scheduled_at', filters.fromDate)
  if (filters?.toDate)         query = query.lte('scheduled_at', filters.toDate)

  const { data, error } = await query

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] listSessionCards:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(mapSessionStatsRow),
    error: null,
  }
}

function mapSessionStatsRow(r: Record<string, unknown>): SessionAttendanceStats {
  return {
    sessionId          : r['session_id']          as string,
    tenantId           : r['tenant_id']           as string,
    groupId            : r['group_id']            as string,
    implantationId     : r['implantation_id']     as string,
    scheduledAt        : r['scheduled_at']        as string,
    status             : r['status']              as string,
    sessionType        : r['session_type']        as string | null,
    closedAt           : r['closed_at']           as string | null,
    label              : r['label']               as string | null,
    durationMinutes    : r['duration_minutes']    as number,
    cancellationReason : r['cancellation_reason'] as string | null,
    totalAttendees     : Number(r['total_attendees']  ?? 0),
    presentCount       : Number(r['present_count']    ?? 0),
    absentCount        : Number(r['absent_count']     ?? 0),
    lateCount          : Number(r['late_count']       ?? 0),
  }
}

// ─── Session Detail ───────────────────────────────────────────────────────────

export type SessionDetailRow = {
  id                : string
  scheduledAt       : string
  durationMinutes   : number
  status            : string
  sessionType       : string | null
  label             : string | null
  closedAt          : string | null
  groupId           : string
  implantationId    : string
  cancellationReason: string | null
  coaches           : { coachId: string; role: string; displayName: string }[]
  attendees         : { childId: string; status: string; isGuest: boolean; displayName: string }[]
  debrief           : string | null
}

/**
 * Fiche complète d'une séance : coachs, participants, statut débrief.
 */
export async function getSessionDetail(
  sessionId: string,
): Promise<{ data: SessionDetailRow | null; error: unknown }> {
  const [sessionRes, coachesRes, attendeesRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, status, session_type, label, closed_at, group_id, implantation_id, cancellation_reason')
      .eq('id', sessionId)
      .single(),
    supabase
      .from('session_coaches')
      .select('coach_id, role, profiles(display_name)')
      .eq('session_id', sessionId),
    supabase
      .from('attendances')
      .select('child_id, status')
      .eq('session_id', sessionId),
  ])

  if (sessionRes.error || !sessionRes.data) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] getSessionDetail:', sessionRes.error)
    return { data: null, error: sessionRes.error }
  }

  const session = sessionRes.data as Record<string, unknown>

  // Résoudre les noms des participants
  const attendeeIds = ((attendeesRes.data ?? []) as { child_id: string; status: string }[])
    .map(a => a.child_id)

  const profilesRes = attendeeIds.length > 0
    ? await supabase.from('profiles').select('user_id, display_name').in('user_id', attendeeIds)
    : { data: [] as { user_id: string; display_name: string }[] }

  const nameMap = new Map(
    ((profilesRes.data ?? []) as { user_id: string; display_name: string }[])
      .map(p => [p.user_id, p.display_name]),
  )

  return {
    data: {
      id                : session['id']                 as string,
      scheduledAt       : session['scheduled_at']       as string,
      durationMinutes   : session['duration_minutes']   as number,
      status            : session['status']             as string,
      sessionType       : session['session_type']       as string | null,
      label             : session['label']              as string | null,
      closedAt          : session['closed_at']          as string | null,
      groupId           : session['group_id']           as string,
      implantationId    : session['implantation_id']    as string,
      cancellationReason: session['cancellation_reason'] as string | null,
      debrief           : session['closed_at'] ? 'rempli' : null,
      coaches: ((coachesRes.data ?? []) as unknown as { coach_id: string; role: string; profiles: { display_name: string } | null }[])
        .map(c => ({
          coachId     : c.coach_id,
          role        : c.role,
          displayName : c.profiles?.display_name ?? c.coach_id,
        })),
      attendees: ((attendeesRes.data ?? []) as { child_id: string; status: string }[])
        .map(a => ({
          childId     : a.child_id,
          status      : a.status,
          isGuest     : false,
          displayName : nameMap.get(a.child_id) ?? a.child_id,
        })),
    },
    error: null,
  }
}

// ─── Admin Alerts ─────────────────────────────────────────────────────────────

/**
 * Liste les alertes admin actives ou résolues.
 */
export async function listAdminAlerts(
  status: 'active' | 'resolved' = 'active',
): Promise<{ data: AdminAlert[]; error: unknown }> {
  const { data, error } = await supabase
    .from('admin_alerts')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] listAdminAlerts:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      id          : r['id']           as string,
      tenantId    : r['tenant_id']    as string,
      type        : r['type']         as AdminAlert['type'],
      entityId    : r['entity_id']    as string,
      entityType  : r['entity_type']  as AdminAlert['entityType'],
      metadata    : (r['metadata'] ?? {}) as Record<string, unknown>,
      status      : r['status']       as AdminAlert['status'],
      resolvedAt  : r['resolved_at']  as string | null,
      resolvedBy  : r['resolved_by']  as string | null,
      createdAt   : r['created_at']   as string,
    })),
    error: null,
  }
}

/**
 * Marque une alerte comme résolue.
 */
export async function resolveAlert(
  alertId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('admin_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', alertId)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] resolveAlert:', error)
  }
  return { error: error ?? null }
}

// ─── Coach Quality Metrics ────────────────────────────────────────────────────

/**
 * Métriques qualité d'un coach : débrief, présence, délai.
 */
export async function getCoachQualityMetrics(
  coachId: string,
): Promise<{ data: CoachQualityMetrics | null; error: unknown }> {
  const { data, error } = await supabase
    .from('v_coach_quality_metrics')
    .select('*')
    .eq('coach_id', coachId)
    .maybeSingle()

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] getCoachQualityMetrics:', error)
    return { data: null, error }
  }

  if (!data) return { data: null, error: null }

  const r = data as Record<string, unknown>
  return {
    data: {
      coachId              : r['coach_id']               as string,
      tenantId             : r['tenant_id']              as string,
      totalSessions        : Number(r['total_sessions']         ?? 0),
      sessionsDone         : Number(r['sessions_done']          ?? 0),
      debriefsFilled       : Number(r['debriefs_filled']        ?? 0),
      debriefsMissing      : Number(r['debriefs_missing']       ?? 0),
      debriefFillRate      : r['debrief_fill_rate']  != null ? Number(r['debrief_fill_rate'])  : null,
      presenceRate         : r['presence_rate']       != null ? Number(r['presence_rate'])      : null,
      avgDebriefDelayHours : r['avg_debrief_delay_hours'] != null ? Number(r['avg_debrief_delay_hours']) : null,
    },
    error: null,
  }
}

// ─── Child Consecutive Absences ───────────────────────────────────────────────

/**
 * Liste les enfants avec au moins `threshold` absences consécutives dans un groupe.
 * Trie par nombre décroissant d'absences.
 */
export async function listChildConsecutiveAbsences(
  groupId   : string,
  threshold : number = 2,
): Promise<{ data: ChildConsecutiveAbsence[]; error: unknown }> {
  const { data, error } = await supabase
    .from('v_child_consecutive_absences')
    .select('*')
    .eq('group_id', groupId)
    .gte('consecutive_absences', threshold)
    .order('consecutive_absences', { ascending: false })

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] listChildConsecutiveAbsences:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      childId             : r['child_id']             as string,
      groupId             : r['group_id']             as string,
      tenantId            : r['tenant_id']            as string,
      consecutiveAbsences : Number(r['consecutive_absences'] ?? 0),
      childName           : r['child_name']           as string,
    })),
    error: null,
  }
}

// ─── Top Group By Attendance (Story 56-5) ─────────────────────────────────────

/**
 * Retourne le groupe avec le meilleur taux de présence sur la période.
 * Taux = nb présences "present" / nb total présences (séances non annulées).
 * En cas d'égalité, le groupe le plus ancien (created_at ASC) est retourné.
 * Retourne null si aucune donnée de présence dans la période.
 */
export async function getTopGroupByAttendance(
  tenantId: string,
  period  : 'month' | 'season',
): Promise<{ data: TopGroupResult; error: unknown }> {
  const now   = new Date()
  let fromDate: string

  if (period === 'month') {
    // Premier jour du mois courant
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  } else {
    // Début de la saison académique courante : 1er septembre de l'année scolaire
    const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
    fromDate   = new Date(year, 8, 1).toISOString()  // 1er sept
  }

  // Jointure attendances → sessions → groups pour calculer le taux par groupe
  const { data, error } = await supabase
    .from('attendances')
    .select('status, sessions!inner(group_id, status, scheduled_at, groups!inner(id, name, created_at, tenant_id))')
    .neq('sessions.status', 'annulée')
    .gte('sessions.scheduled_at', fromDate)
    .eq('sessions.groups.tenant_id', tenantId)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[dashboard] getTopGroupByAttendance:', error)
    return { data: null, error }
  }

  if (!data || data.length === 0) return { data: null, error: null }

  // Agréger côté client : { groupId → { total, present, name, createdAt } }
  type GroupAgg = { total: number; present: number; name: string; createdAt: string }
  const agg = new Map<string, GroupAgg>()

  for (const row of data as unknown as {
    status: string
    sessions: {
      group_id: string
      status  : string
      scheduled_at: string
      groups  : { id: string; name: string; created_at: string; tenant_id: string }
    }
  }[]) {
    const g   = row.sessions?.groups
    if (!g) continue
    const gid = g.id
    if (!agg.has(gid)) agg.set(gid, { total: 0, present: 0, name: g.name, createdAt: g.created_at })
    const entry = agg.get(gid)!
    entry.total++
    if (row.status === 'present') entry.present++
  }

  if (agg.size === 0) return { data: null, error: null }

  // Tri : taux DESC, createdAt ASC (tie-break)
  const sorted = [...agg.entries()].sort(([, a], [, b]) => {
    const rateA = a.total > 0 ? a.present / a.total : 0
    const rateB = b.total > 0 ? b.present / b.total : 0
    if (rateB !== rateA) return rateB - rateA
    return a.createdAt < b.createdAt ? -1 : 1
  })

  const [bestId, bestAgg] = sorted[0]
  const rate = bestAgg.total > 0 ? bestAgg.present / bestAgg.total : 0

  // Ne retourner un badge que s'il y a au moins des données (rate > 0)
  if (bestAgg.total === 0) return { data: null, error: null }

  return {
    data: {
      groupId       : bestId,
      groupName     : bestAgg.name,
      attendanceRate: Math.round(rate * 1000) / 1000,
    },
    error: null,
  }
}
