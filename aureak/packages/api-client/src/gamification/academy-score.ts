// Story 59-6 — Score académie global KPI
// Formule composite (0–100) :
//   presenceRate      = (présences validées / total attendues) × 100       — pondération 40%
//   progressionScore  = (joueurs XP ≥ 1 ce mois / joueurs actifs) × 100   — pondération 35%
//   activityScore     = (séances validées ce mois / séances planifiées)×100 — pondération 25%
//   score = presenceRate * 0.4 + progressionScore * 0.35 + activityScore * 0.25, arrondi entier
//
// Seuils niveau :
//   0–39   → "Débutante"
//   40–59  → "En développement"
//   60–74  → "Confirmée"
//   75–89  → "Excellence"
//   90–100 → "Élite"

import { supabase } from '../supabase'
import type { AcademyScoreResult } from '@aureak/types'

export type { AcademyScoreResult }

function resolveAcademyLevel(score: number): AcademyScoreResult['level'] {
  if (score >= 90) return 'Élite'
  if (score >= 75) return 'Excellence'
  if (score >= 60) return 'Confirmée'
  if (score >= 40) return 'En développement'
  return 'Débutante'
}

export async function getAcademyScore(
  seasonId?: string,
): Promise<{ data: AcademyScoreResult | null; error: unknown }> {
  try {
    const now       = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const weekAgo    = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const twoWeekAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // ── Taux de présence (40%) ────────────────────────────────────────────────
    // présences validées (status = 'present') vs total pour ce mois
    const [presentResult, totalPresenceResult] = await Promise.all([
      supabase
        .from('attendances')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'present')
        .gte('recorded_at', monthStart),
      supabase
        .from('attendances')
        .select('id', { count: 'exact', head: true })
        .gte('recorded_at', monthStart),
    ])

    const presentCount     = presentResult.count    ?? 0
    const totalAttendances = totalPresenceResult.count ?? 0
    const presenceRate     = totalAttendances > 0
      ? Math.round((presentCount / totalAttendances) * 100)
      : 0

    // ── Score progression (35%) ───────────────────────────────────────────────
    // joueurs ayant gagné ≥1 XP ce mois / total joueurs actifs
    const [xpThisMonthResult, activePlayers] = await Promise.all([
      supabase
        .from('xp_ledger')
        .select('child_id')
        .gte('created_at', monthStart),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('user_role', 'child'),
    ])

    const uniqueChildrenWithXp = new Set(
      (xpThisMonthResult.data ?? []).map(r => r.child_id)
    ).size
    const totalActivePlayers = activePlayers.count ?? 0
    const progressionScore   = totalActivePlayers > 0
      ? Math.round((uniqueChildrenWithXp / totalActivePlayers) * 100)
      : 0

    // ── Score activité (25%) ──────────────────────────────────────────────────
    // séances clôturées ce mois / séances planifiées ce mois
    const [closedSessions, plannedSessions] = await Promise.all([
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .not('closed_at', 'is', null)
        .gte('scheduled_at', monthStart),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', monthStart)
        .is('deleted_at', null),
    ])

    const closedCount  = closedSessions.count  ?? 0
    const plannedCount = plannedSessions.count ?? 0
    const activityScore = plannedCount > 0
      ? Math.round((closedCount / plannedCount) * 100)
      : 0

    // ── Score composite ───────────────────────────────────────────────────────
    const score = Math.round(
      presenceRate    * 0.40 +
      progressionScore * 0.35 +
      activityScore   * 0.25
    )

    // ── Tendance hebdomadaire : delta score vs semaine précédente ─────────────
    // Approche simple : comparer presenceRate semaine en cours vs semaine -1
    const [presentWeek, totalWeek, presentPrevWeek, totalPrevWeek] = await Promise.all([
      supabase.from('attendances').select('id', { count: 'exact', head: true }).eq('status', 'present').gte('recorded_at', weekAgo),
      supabase.from('attendances').select('id', { count: 'exact', head: true }).gte('recorded_at', weekAgo),
      supabase.from('attendances').select('id', { count: 'exact', head: true }).eq('status', 'present').gte('recorded_at', twoWeekAgo).lt('recorded_at', weekAgo),
      supabase.from('attendances').select('id', { count: 'exact', head: true }).gte('recorded_at', twoWeekAgo).lt('recorded_at', weekAgo),
    ])

    const rateThisWeek  = (totalWeek.count ?? 0) > 0
      ? Math.round(((presentWeek.count ?? 0) / (totalWeek.count ?? 1)) * 100)
      : 0
    const ratePrevWeek  = (totalPrevWeek.count ?? 0) > 0
      ? Math.round(((presentPrevWeek.count ?? 0) / (totalPrevWeek.count ?? 1)) * 100)
      : 0
    const trend = rateThisWeek - ratePrevWeek

    const result: AcademyScoreResult = {
      score,
      level     : resolveAcademyLevel(score),
      components: { presenceRate, progressionScore, activityScore },
      trend,
      computedAt: new Date().toISOString(),
    }

    return { data: result, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[academy-score] getAcademyScore error:', err)
    return { data: null, error: err }
  }
}
