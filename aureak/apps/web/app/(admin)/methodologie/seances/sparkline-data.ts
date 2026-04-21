// Story 93.5 — Helper dérivé des sessions Méthodologie pour alimenter le sparkline StatsHero
import type { MethodologySession } from '@aureak/types'

/** 30 valeurs = count cumulé d'entraînements publiés à date J sur les 30 derniers jours.
 *  `published_at` n'existe pas sur MethodologySession → fallback sur `createdAt`. */
export function buildMethodologySparklineData(
  sessions: MethodologySession[],
): number[] {
  const DAYS   = 30
  const msDay  = 86_400_000
  const now    = new Date()
  const cutoff = new Date(now.getTime() - DAYS * msDay)

  const dates: number[] = []
  for (const s of sessions) {
    if (!s.isActive) continue
    const raw = s.createdAt
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (!Number.isFinite(t)) continue
    dates.push(t)
  }

  const priorCount = dates.filter(t => t < cutoff.getTime()).length

  const result: number[] = []
  let running = priorCount
  for (let i = DAYS - 1; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - (i + 1) * msDay).getTime()
    const dayEnd   = new Date(now.getTime() - i * msDay).getTime()
    const addedToday = dates.filter(t => t >= dayStart && t < dayEnd).length
    running += addedToday
    result.push(running)
  }

  return result
}
