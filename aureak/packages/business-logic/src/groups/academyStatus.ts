// Logique métier : statut académie + génération des badges
// Le statut est CALCULÉ (jamais saisi manuellement).
// Source : vue SQL v_child_academy_status

import type { AcademyStatus, ChildAcademyStatusData } from '@aureak/types'

// ── Configuration visuelle par statut ────────────────────────────────────────

export const ACADEMY_STATUS_CONFIG: Record<
  AcademyStatus,
  { label: string; color: string; bg: string; variant: 'gold' | 'present' | 'zinc' | 'attention' }
> = {
  'ACADÉMICIEN'        : { label: 'ACADÉMICIEN',        color: '#FFB800', bg: '#FFB80018', variant: 'gold'      },
  'NOUVEAU_ACADÉMICIEN': { label: 'NOUVEAU ACADÉMICIEN', color: '#66BB6A', bg: '#66BB6A18', variant: 'present'   },
  'ANCIEN'             : { label: 'ANCIEN',              color: '#9E9E9E', bg: '#9E9E9E14', variant: 'zinc'      },
  'STAGE_UNIQUEMENT'   : { label: 'STAGE UNIQUEMENT',    color: '#4FC3F7', bg: '#4FC3F718', variant: 'attention' },
  'PROSPECT'           : { label: 'PROSPECT',            color: '#616161', bg: '#61616114', variant: 'zinc'      },
}

// ── Badge generation ──────────────────────────────────────────────────────────

/**
 * Génère la liste des badges contextuels à afficher sous le statut principal.
 *
 * Exemples de sortie :
 *   ['Académie 2025-2026', '3 saisons', '2 stages', 'Premier stage : Été 2024']
 */
export function generateAcademyBadges(data: ChildAcademyStatusData): string[] {
  const badges: string[] = []

  // Badge saison active
  if (data.currentSeasonLabel && data.inCurrentSeason) {
    badges.push(`Académie ${data.currentSeasonLabel}`)
  }

  // Badge nombre de saisons
  if (data.totalAcademySeasons === 1) {
    badges.push('1ère saison')
  } else if (data.totalAcademySeasons > 1) {
    badges.push(`${data.totalAcademySeasons} saisons`)
  }

  // Badge nombre de stages
  if (data.totalStages === 1) {
    badges.push('1 stage')
  } else if (data.totalStages > 1) {
    badges.push(`${data.totalStages} stages`)
  }

  // Premier stage (si au moins 1)
  if (data.firstStageName) {
    badges.push(`Premier stage : ${data.firstStageName}`)
  }

  // Dernier stage (si différent du premier)
  if (data.lastStageName && data.lastStageName !== data.firstStageName) {
    badges.push(`Dernier stage : ${data.lastStageName}`)
  }

  return badges
}

// ── Status helpers ────────────────────────────────────────────────────────────

/** Retourne true si le statut correspond à un enfant actif en académie */
export function isActiveAcademician(status: AcademyStatus): boolean {
  return status === 'ACADÉMICIEN' || status === 'NOUVEAU_ACADÉMICIEN'
}

/** Retourne true si l'enfant a eu au moins un lien avec l'académie */
export function hasAcademyHistory(status: AcademyStatus): boolean {
  return status !== 'PROSPECT' && status !== 'STAGE_UNIQUEMENT'
}
