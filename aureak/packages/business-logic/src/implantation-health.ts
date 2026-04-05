import type { HealthScore } from '@aureak/types'

/**
 * Story 57-7 — Score de santé d'une implantation
 * score = attendanceRatePct × 0.6 + masteryRatePct × 0.4
 */
export function computeImplantationHealth(
  attendanceRatePct: number,
  masteryRatePct   : number,
): HealthScore {
  const score = Math.round(attendanceRatePct * 0.6 + masteryRatePct * 0.4)
  if (score >= 75) return { score, level: 'green', label: 'Excellent' }
  if (score >= 50) return { score, level: 'gold',  label: 'Correct' }
  return { score, level: 'red', label: 'À surveiller' }
}
