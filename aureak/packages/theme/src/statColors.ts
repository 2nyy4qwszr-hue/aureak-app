// @aureak/theme — Utilitaires couleur stats (Story 60.5)
// RÈGLE : jamais de valeur hardcodée — toujours via tokens colors

import { colors } from './tokens'

// ── Seuils prédéfinis ────────────────────────────────────────────────────────

export const STAT_THRESHOLDS = {
  attendance : { high: 80,  low: 60  },  // taux de présence (%)
  mastery    : { high: 4.0, low: 3.0 },  // note /5
  progression: { high: 75,  low: 50  },  // progression (%)
  xp         : { high: 500, low: 200 },  // points XP mensuels
} as const

// ── getStatColor ─────────────────────────────────────────────────────────────

/**
 * Retourne une couleur hex selon la valeur par rapport aux seuils.
 *
 * @param value         - Valeur numérique à évaluer
 * @param thresholdHigh - Seuil haut (>= → vert success)
 * @param thresholdLow  - Seuil bas  (>= → or moyen, < → rouge)
 * @param isRecord      - Si true, retourne or record indépendamment des seuils
 * @returns couleur hex string
 */
export function getStatColor(
  value        : number,
  thresholdHigh: number,
  thresholdLow : number,
  isRecord?    : boolean,
): string {
  if (isRecord) return colors.accent.gold
  if (value >= thresholdHigh) return colors.status.success
  if (value >= thresholdLow)  return colors.accent.gold
  return colors.status.errorStrong
}

// ── getStatColorClass ─────────────────────────────────────────────────────────

/**
 * Retourne une classe CSS string selon la valeur par rapport aux seuils.
 * Utilisable comme clé dans StyleSheet ou className CSS.
 *
 * @param value         - Valeur numérique à évaluer
 * @param thresholdHigh - Seuil haut (>= → 'stat-good')
 * @param thresholdLow  - Seuil bas  (>= → 'stat-medium', < → 'stat-low')
 * @returns 'stat-good' | 'stat-medium' | 'stat-low'
 */
export function getStatColorClass(
  value        : number,
  thresholdHigh: number,
  thresholdLow : number,
): 'stat-good' | 'stat-medium' | 'stat-low' {
  if (value >= thresholdHigh) return 'stat-good'
  if (value >= thresholdLow)  return 'stat-medium'
  return 'stat-low'
}
