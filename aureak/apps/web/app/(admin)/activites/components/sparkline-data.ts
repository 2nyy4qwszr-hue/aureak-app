// Story 93.3 — Helpers dérivés des sessions pour alimenter les widgets StatsHero
import type { SessionAttendanceSummary } from '@aureak/api-client'

/** 30 valeurs représentant le % présence moyen de chaque jour des 30 derniers jours. */
export function buildActivitesSparklineData(
  sessions: SessionAttendanceSummary[],
): number[] {
  const DAYS = 30
  const now  = new Date()
  const msDay = 86_400_000
  const result: number[] = []

  // Index sessions par jour (YYYY-MM-DD) → liste de taux
  const dailyRates = new Map<string, number[]>()
  for (const s of sessions) {
    if (!s.scheduledAt || s.totalAttendance === 0) continue
    const d   = new Date(s.scheduledAt)
    const key = d.toISOString().slice(0, 10)
    const rate = (s.presentCount / s.totalAttendance) * 100
    const arr  = dailyRates.get(key) ?? []
    arr.push(rate)
    dailyRates.set(key, arr)
  }

  // Calculer la moyenne globale (fallback pour jours sans séance)
  let globalSum = 0
  let globalCount = 0
  for (const arr of dailyRates.values()) {
    for (const r of arr) { globalSum += r; globalCount++ }
  }
  const globalAvg = globalCount > 0 ? globalSum / globalCount : 0

  for (let i = DAYS - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * msDay)
    const key = day.toISOString().slice(0, 10)
    const rates = dailyRates.get(key)
    if (rates && rates.length > 0) {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length
      result.push(Math.round(avg))
    } else {
      result.push(Math.round(globalAvg))
    }
  }

  return result
}

/** 7 valeurs = nombre de séances par jour sur les 7 derniers jours (L → D). */
export function buildWeeklySessionsData(sessions: SessionAttendanceSummary[]): number[] {
  const now   = new Date()
  const msDay = 86_400_000
  const counts = new Array(7).fill(0) as number[]

  for (const s of sessions) {
    if (!s.scheduledAt) continue
    const d = new Date(s.scheduledAt)
    const diffDays = Math.floor((now.getTime() - d.getTime()) / msDay)
    if (diffDays < 0 || diffDays > 6) continue
    // index 0 = il y a 6 jours, index 6 = aujourd'hui
    const idx = 6 - diffDays
    if (idx >= 0 && idx < 7) counts[idx]++
  }

  return counts
}
