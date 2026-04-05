// @aureak/api-client — Analytics (Epic 60)
// Requêtes analytics agrégées : présences par groupe/mois, heatmap, classement implantations
// RÈGLE : accès Supabase UNIQUEMENT via supabase client — zéro logique métier dans ce fichier

import { supabase } from './supabase'
import type { AttendanceMonthlyData, HeatmapCell, HeatmapPeriod, ImplantationRankingItem, BarChartPeriod } from '@aureak/types'

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
      if (process.env.NODE_ENV !== 'production') console.error('[analytics] getStatsRoomKpis sessions error:', sessionsRes.error)
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
    if (process.env.NODE_ENV !== 'production') console.error('[analytics] getStatsRoomKpis exception:', err)
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
      if (process.env.NODE_ENV !== 'production') console.error('[analytics] getAttendanceByGroupMonth sessions error:', sessionsError)
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
      if (process.env.NODE_ENV !== 'production') console.error('[analytics] getAttendanceByGroupMonth attendance error:', attError)
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
    if (process.env.NODE_ENV !== 'production') console.error('[analytics] getAttendanceByGroupMonth exception:', err)
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
      if (process.env.NODE_ENV !== 'production') console.error('[analytics] getSessionHeatmap error:', error)
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
    if (process.env.NODE_ENV !== 'production') console.error('[analytics] getSessionHeatmap exception:', err)
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
        if (process.env.NODE_ENV !== 'production') console.error('[analytics] getImplantationRankings sessions error:', sErr)
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
        if (process.env.NODE_ENV !== 'production') console.error('[analytics] getImplantationRankings attendance error:', aErr)
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
      if (process.env.NODE_ENV !== 'production') console.error('[analytics] getImplantationRankings mastery error:', eErr)
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
    if (process.env.NODE_ENV !== 'production') console.error('[analytics] getImplantationRankings exception:', err)
    return { data: null, error: err }
  }
}
