// @aureak/api-client — Analytics (Epic 60)
// Requêtes analytics agrégées : présences par groupe/mois, heatmap, classement implantations
// RÈGLE : accès Supabase UNIQUEMENT via supabase client — zéro logique métier dans ce fichier

import { supabase } from './supabase'
import type { AttendanceMonthlyData, HeatmapCell, HeatmapPeriod, ImplantationRankingItem, BarChartPeriod, RankingMetric, PlayerRankingItem, MonthlyReportData } from '@aureak/types'

// ── KPIs globaux Stats Room (Story 60.1) ──────────────────────────────────────

export interface StatsRoomKpis {
  totalSessions   : number
  avgAttendanceRate: number   // 0–100
  activePlayers   : number
  linkedClubs     : number
}

export async function getStatsRoomKpis(): Promise<{ data: StatsRoomKpis | null; error: unknown }> {
  try {
    const [sessionsRes, playersRes, clubsRes, attendanceRes] = await Promise.all([
      supabase.from('sessions').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
      supabase.from('child_directory').select('id', { count: 'exact', head: true }).eq('actif', true),
      supabase.from('club_directory').select('id', { count: 'exact', head: true }).eq('actif', true),
      supabase.from('attendance_records').select('status'),
    ])

    if (sessionsRes.error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getStatsRoomKpis sessions error:', sessionsRes.error)
      return { data: null, error: sessionsRes.error }
    }

    // Calcul taux présence moyen sur toutes les attendance_records
    const records = (attendanceRes.data ?? []) as { status: string }[]
    const total   = records.length
    const present = records.filter(r => r.status === 'present').length
    const avgRate = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      data: {
        totalSessions   : sessionsRes.count ?? 0,
        avgAttendanceRate: avgRate,
        activePlayers   : playersRes.count ?? 0,
        linkedClubs     : clubsRes.count ?? 0,
      },
      error: null,
    }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getStatsRoomKpis exception:', err)
    return { data: null, error: err }
  }
}

// ── Présences agrégées par groupe/mois (Story 60.2) ──────────────────────────

export async function getAttendanceByGroupMonth(
  implantationId: string,
  months = 12,
): Promise<{ data: AttendanceMonthlyData[] | null; error: unknown }> {
  try {
    // Date de début : il y a `months` mois
    const since = new Date()
    since.setMonth(since.getMonth() - months)
    const sinceIso = since.toISOString().slice(0, 10)

    // Récupérer les séances de l'implantation sur la période
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, scheduled_at, group_id, groups!inner(id, name, implantation_id)')
      .eq('groups.implantation_id', implantationId)
      .gte('scheduled_at', sinceIso)
      .neq('status', 'cancelled')

    if (sessionsError) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getAttendanceByGroupMonth sessions error:', sessionsError)
      return { data: null, error: sessionsError }
    }

    if (!sessions || sessions.length === 0) return { data: [], error: null }

    const sessionIds = sessions.map(s => s.id)

    // Récupérer les présences pour ces séances
    const { data: attendances, error: attError } = await supabase
      .from('attendance_records')
      .select('session_id, status')
      .in('session_id', sessionIds)

    if (attError) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getAttendanceByGroupMonth attendance error:', attError)
      return { data: null, error: attError }
    }

    // Indexer attendances par session_id
    const attBySession = new Map<string, { present: number; total: number }>()
    for (const rec of (attendances ?? []) as { session_id: string; status: string }[]) {
      const entry = attBySession.get(rec.session_id) ?? { present: 0, total: 0 }
      entry.total++
      if (rec.status === 'present') entry.present++
      attBySession.set(rec.session_id, entry)
    }

    // Agréger par groupe × mois
    type Key = string  // `${groupId}|${YYYY-MM}`
    const agg = new Map<Key, { groupId: string; groupName: string; month: string; totalPresent: number; totalAll: number; sessionCount: number }>()

    for (const s of sessions as unknown as {
      id: string
      scheduled_at: string
      group_id: string
      groups: { id: string; name: string } | { id: string; name: string }[]
    }[]) {
      const grp = Array.isArray(s.groups) ? s.groups[0] : s.groups
      if (!grp) continue
      const month = s.scheduled_at.slice(0, 7)  // YYYY-MM
      const key   = `${grp.id}|${month}`
      const att   = attBySession.get(s.id) ?? { present: 0, total: 0 }
      const entry = agg.get(key) ?? { groupId: grp.id, groupName: grp.name, month, totalPresent: 0, totalAll: 0, sessionCount: 0 }
      entry.totalPresent += att.present
      entry.totalAll     += att.total
      entry.sessionCount++
      agg.set(key, entry)
    }

    const result: AttendanceMonthlyData[] = []
    for (const [, v] of agg.entries()) {
      result.push({
        groupId     : v.groupId,
        groupName   : v.groupName,
        month       : v.month,
        rate        : v.totalAll > 0 ? Math.round((v.totalPresent / v.totalAll) * 100) : 0,
        sessionCount: v.sessionCount,
      })
    }

    return { data: result.sort((a, b) => a.month.localeCompare(b.month)), error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getAttendanceByGroupMonth exception:', err)
    return { data: null, error: err }
  }
}

// ── Heatmap sessions par jour/heure (Story 60.3) ─────────────────────────────

function periodToSince(period: HeatmapPeriod): string {
  const now = new Date()
  switch (period) {
    case 'month'  : now.setMonth(now.getMonth() - 1);  break
    case '3months': now.setMonth(now.getMonth() - 3);  break
    case '6months': now.setMonth(now.getMonth() - 6);  break
    case 'year'   : now.setFullYear(now.getFullYear() - 1); break
  }
  return now.toISOString().slice(0, 10)
}

export async function getSessionHeatmap(
  period      : HeatmapPeriod,
  implantationId?: string,
): Promise<{ data: HeatmapCell[][] | null; error: unknown }> {
  try {
    const sinceIso = periodToSince(period)

    let query = supabase
      .from('sessions')
      .select('scheduled_at, group_id, groups!inner(id, name, implantation_id)')
      .gte('scheduled_at', sinceIso)
      .neq('status', 'cancelled')

    if (implantationId) {
      query = query.eq('groups.implantation_id', implantationId)
    }

    const { data: sessions, error } = await query

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getSessionHeatmap error:', error)
      return { data: null, error }
    }

    // Initialiser la matrice 7×24
    const matrix: HeatmapCell[][] = Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (__, hour) => ({ day, hour, count: 0, groups: [] }))
    )

    for (const s of (sessions ?? []) as unknown as { scheduled_at: string; groups: { name: string } | { name: string }[] }[]) {
      const dt  = new Date(s.scheduled_at)
      const dow = dt.getDay()   // 0=Sun … 6=Sat
      const hr  = dt.getHours()
      const grp = Array.isArray(s.groups) ? s.groups[0] : s.groups
      const cell = matrix[dow][hr]
      cell.count++
      if (grp && !cell.groups.includes(grp.name)) {
        cell.groups.push(grp.name)
      }
    }

    return { data: matrix, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getSessionHeatmap exception:', err)
    return { data: null, error: err }
  }
}

// ── Classement implantations (Story 60.4) ────────────────────────────────────

function barPeriodToSince(period: BarChartPeriod): string {
  const now = new Date()
  switch (period) {
    case 'month'  : now.setMonth(now.getMonth() - 1);      break
    case 'quarter': now.setMonth(now.getMonth() - 3);      break
    case 'year'   : now.setFullYear(now.getFullYear() - 1); break
  }
  return now.toISOString().slice(0, 10)
}

export async function getImplantationRankings(
  metric: 'attendance' | 'mastery',
  period: BarChartPeriod,
): Promise<{ data: ImplantationRankingItem[] | null; error: unknown }> {
  try {
    const sinceIso = barPeriodToSince(period)

    if (metric === 'attendance') {
      // Récupérer séances + groupes + implantations
      const { data: sessions, error: sErr } = await supabase
        .from('sessions')
        .select('id, group_id, groups!inner(id, implantation_id, implantations!inner(id, name))')
        .gte('scheduled_at', sinceIso)
        .neq('status', 'cancelled')

      if (sErr) {
        if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getImplantationRankings sessions error:', sErr)
        return { data: null, error: sErr }
      }

      if (!sessions || sessions.length === 0) return { data: [], error: null }

      const sessionIds = sessions.map(s => s.id)

      // Attendances
      const { data: attendances, error: aErr } = await supabase
        .from('attendance_records')
        .select('session_id, status')
        .in('session_id', sessionIds)

      if (aErr) {
        if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getImplantationRankings attendance error:', aErr)
        return { data: null, error: aErr }
      }

      const attBySession = new Map<string, { present: number; total: number }>()
      for (const rec of (attendances ?? []) as { session_id: string; status: string }[]) {
        const e = attBySession.get(rec.session_id) ?? { present: 0, total: 0 }
        e.total++
        if (rec.status === 'present') e.present++
        attBySession.set(rec.session_id, e)
      }

      // Agréger par implantation
      const implMap = new Map<string, { id: string; name: string; present: number; total: number; sessionCount: number }>()

      for (const s of sessions as unknown as {
        id: string
        groups: { implantation_id: string; implantations: { id: string; name: string } | { id: string; name: string }[] } |
                { implantation_id: string; implantations: { id: string; name: string } | { id: string; name: string }[] }[]
      }[]) {
        const grp   = Array.isArray(s.groups) ? s.groups[0] : s.groups
        if (!grp) continue
        const impl  = Array.isArray(grp.implantations) ? grp.implantations[0] : grp.implantations
        if (!impl) continue
        const att   = attBySession.get(s.id) ?? { present: 0, total: 0 }
        const entry = implMap.get(impl.id) ?? { id: impl.id, name: impl.name, present: 0, total: 0, sessionCount: 0 }
        entry.present += att.present
        entry.total   += att.total
        entry.sessionCount++
        implMap.set(impl.id, entry)
      }

      const sorted = Array.from(implMap.values())
        .map(e => ({
          id          : e.id,
          name        : e.name,
          value       : e.total > 0 ? Math.round((e.present / e.total) * 100) : 0,
          sessionCount: e.sessionCount,
        }))
        .sort((a, b) => b.value - a.value)
        .map((e, i) => ({ ...e, rank: i + 1 }))

      return { data: sorted, error: null }
    }

    // metric === 'mastery' — via evaluation_records average score
    const { data: evals, error: eErr } = await supabase
      .from('evaluation_records')
      .select('score, sessions!inner(id, scheduled_at, groups!inner(id, implantation_id, implantations!inner(id, name)))')
      .gte('sessions.scheduled_at', sinceIso)

    if (eErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getImplantationRankings mastery error:', eErr)
      return { data: null, error: eErr }
    }

    type EvalRow = {
      score  : number
      sessions: { groups: { implantation_id: string; implantations: { id: string; name: string } | null } | null } | null
    }

    const implMap2 = new Map<string, { id: string; name: string; sum: number; count: number }>()
    for (const ev of (evals ?? []) as unknown as EvalRow[]) {
      const sess = ev.sessions
      const grp  = sess?.groups
      const impl = grp?.implantations
      if (!impl) continue
      const e = implMap2.get(impl.id) ?? { id: impl.id, name: impl.name, sum: 0, count: 0 }
      e.sum   += ev.score ?? 0
      e.count++
      implMap2.set(impl.id, e)
    }

    const sorted2 = Array.from(implMap2.values())
      .map(e => ({
        id          : e.id,
        name        : e.name,
        value       : e.count > 0 ? parseFloat((e.sum / e.count).toFixed(2)) : 0,
        sessionCount: e.count,
      }))
      .sort((a, b) => b.value - a.value)
      .map((e, i) => ({ ...e, rank: i + 1 }))

    return { data: sorted2, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getImplantationRankings exception:', err)
    return { data: null, error: err }
  }
}

// ── Classement joueurs (Story 60.6) ──────────────────────────────────────────

export async function getPlayerRankings(
  metric       : RankingMetric,
  limit        : number = 10,
  implantationId?: string,
): Promise<{ data: PlayerRankingItem[] | null; error: unknown }> {
  try {
    const viewName = metric === 'xp' ? 'v_player_xp_ranking' : 'v_player_attendance_ranking'

    let query = supabase
      .from(viewName)
      .select('child_id, display_name, group_name, value, rank, weekly_delta')
      .order('rank', { ascending: true })
      .limit(limit)

    // Filtre implantation — jointure indirecte via group membership
    // Note : les vues ne supportent pas de filtre implantation directement
    // On filtre post-requête si nécessaire (à enrichir avec une vue paramétrée dans une story future)
    void implantationId

    const { data, error } = await query

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getPlayerRankings error:', error)
      return { data: null, error }
    }

    const result: PlayerRankingItem[] = (data ?? []).map((row: {
      child_id    : string
      display_name: string
      group_name  : string
      value       : number
      rank        : number
      weekly_delta: number
    }) => ({
      childId    : row.child_id,
      displayName: row.display_name,
      groupName  : row.group_name,
      value      : row.value,
      rank       : row.rank,
      weeklyDelta: row.weekly_delta,
    }))

    return { data: result, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getPlayerRankings exception:', err)
    return { data: null, error: err }
  }
}

// ── Données rapport mensuel (Story 60.7) ─────────────────────────────────────

export async function getMonthlyReportData(
  month         : string,          // 'YYYY-MM'
  implantationId?: string | null,
): Promise<{ data: MonthlyReportData | null; error: unknown }> {
  try {
    const since = `${month}-01`
    const nextMonth = new Date(`${month}-01`)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const until = nextMonth.toISOString().slice(0, 10)

    // Récupérer les séances du mois
    let sessQuery = supabase
      .from('sessions')
      .select('id, group_id, groups!inner(id, name, implantation_id)')
      .gte('scheduled_at', since)
      .lt('scheduled_at', until)
      .neq('status', 'cancelled')

    if (implantationId) {
      sessQuery = sessQuery.eq('groups.implantation_id', implantationId)
    }

    const { data: sessions, error: sessErr } = await sessQuery

    if (sessErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getMonthlyReportData sessions error:', sessErr)
      return { data: null, error: sessErr }
    }

    if (!sessions || sessions.length === 0) {
      // Retourner une structure vide valide
      return {
        data: {
          month,
          implantationName : implantationId ? 'Implantation' : 'Toutes',
          totalSessions    : 0,
          activePlayers    : 0,
          avgAttendanceRate: 0,
          groups           : [],
          topPlayers       : [],
        },
        error: null,
      }
    }

    const sessionIds = sessions.map(s => s.id)

    // Récupérer les présences
    const { data: attendances, error: attErr } = await supabase
      .from('attendance_records')
      .select('session_id, child_id, status')
      .in('session_id', sessionIds)

    if (attErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getMonthlyReportData attendance error:', attErr)
      return { data: null, error: attErr }
    }

    const attRecords = (attendances ?? []) as { session_id: string; child_id: string; status: string }[]

    // Calculer stats globales
    const totalPresent = attRecords.filter(a => a.status === 'present').length
    const totalAll     = attRecords.length
    const avgAttendanceRate = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0
    const activePlayers     = new Set(attRecords.map(a => a.child_id)).size

    // Agréger par groupe
    type GroupKey = string
    const groupAgg = new Map<GroupKey, { groupId: string; groupName: string; sessionCount: number; present: number; total: number }>()

    for (const s of sessions as unknown as { id: string; group_id: string; groups: { id: string; name: string } | { id: string; name: string }[] }[]) {
      const grp = Array.isArray(s.groups) ? s.groups[0] : s.groups
      if (!grp) continue
      const att   = attRecords.filter(a => a.session_id === s.id)
      const entry = groupAgg.get(grp.id) ?? { groupId: grp.id, groupName: grp.name, sessionCount: 0, present: 0, total: 0 }
      entry.sessionCount++
      entry.present += att.filter(a => a.status === 'present').length
      entry.total   += att.length
      groupAgg.set(grp.id, entry)
    }

    const groups = Array.from(groupAgg.values()).map(g => ({
      groupId      : g.groupId,
      groupName    : g.groupName,
      sessionCount : g.sessionCount,
      attendanceRate: g.total > 0 ? Math.round((g.present / g.total) * 100) : 0,
      masteryAvg   : 0,  // à enrichir via evaluation_records dans une story future
    }))

    // Top 5 joueurs par présence
    const playerAgg = new Map<string, { childId: string; displayName: string; groupName: string; present: number; total: number }>()

    for (const s of sessions as unknown as { id: string; groups: { name: string } | { name: string }[] }[]) {
      const grp = Array.isArray(s.groups) ? s.groups[0] : s.groups
      for (const a of attRecords.filter(r => r.session_id === s.id)) {
        const e = playerAgg.get(a.child_id) ?? { childId: a.child_id, displayName: a.child_id, groupName: grp?.name ?? '', present: 0, total: 0 }
        e.total++
        if (a.status === 'present') e.present++
        playerAgg.set(a.child_id, e)
      }
    }

    // Enrichir les noms depuis child_directory si possible
    const childIds = Array.from(playerAgg.keys())
    if (childIds.length > 0) {
      const { data: children } = await supabase
        .from('child_directory')
        .select('id, display_name')
        .in('id', childIds)

      for (const c of (children ?? []) as { id: string; display_name: string }[]) {
        const e = playerAgg.get(c.id)
        if (e) { e.displayName = c.display_name; playerAgg.set(c.id, e) }
      }
    }

    const topPlayers = Array.from(playerAgg.values())
      .map(p => ({ ...p, rate: p.total > 0 ? Math.round((p.present / p.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
      .map((p, idx) => ({
        rank       : idx + 1,
        displayName: p.displayName,
        groupName  : p.groupName,
        rate       : p.rate,
      }))

    return {
      data: {
        month,
        implantationName : implantationId ? 'Implantation' : 'Toutes',
        totalSessions    : sessions.length,
        activePlayers,
        avgAttendanceRate,
        groups,
        topPlayers,
      },
      error: null,
    }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[analytics] getMonthlyReportData exception:', err)
    return { data: null, error: err }
  }
}
