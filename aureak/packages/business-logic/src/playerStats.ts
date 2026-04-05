// playerStats.ts — Calcul des 6 attributs gardien et du tier gamifié
// Story 52-2 : PLO/TIR/TEC/TAC/PHY/MEN calculés depuis JoueurListItem
// Story 52-7 : computePlayerXP — score proxy XP basé sur saisons/stages/saison courante
// Story 52-9 : computePlayerBadges — 10 badges gamifiés
// Source de vérité couleurs : gamification.statBands dans @aureak/theme

import type { JoueurListItem } from '@aureak/api-client'
import type { PlayerTier, BadgeItem } from '@aureak/types'

// ── Type commun minimal pour computePlayerXP ──────────────────────────────────

type XPInputFields = {
  totalAcademySeasons: number
  totalStages        : number
  inCurrentSeason    : boolean
}

// ── Types exportés ─────────────────────────────────────────────────────────────

export type PlayerStats = {
  PLO: number  // Plongeon
  TIR: number  // Tir arrêté
  TEC: number  // Technique balle
  TAC: number  // Tactique
  PHY: number  // Physique
  MEN: number  // Mental
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clamp une valeur entre min et max inclus */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// ── computePlayerStats ────────────────────────────────────────────────────────

/**
 * Calcule les 6 attributs gardien depuis un JoueurListItem.
 * Valeurs clampées [40, 85].
 *
 * Logique proxy (remplacée par une vraie table `player_stats` en story 59-1) :
 *  - Base : 50 pour chaque attribut
 *  - totalAcademySeasons > 3 → +10 PHY, +10 MEN
 *  - totalStages > 2        → +8 TEC
 *  - inCurrentSeason = true → +5 TAC
 */
export function computePlayerStats(joueur: JoueurListItem): PlayerStats {
  const base = 50

  let PLO = base
  let TIR = base
  let TEC = base
  let TAC = base
  let PHY = base
  let MEN = base

  if (joueur.totalAcademySeasons > 3) {
    PHY += 10
    MEN += 10
  }
  if (joueur.totalStages > 2) {
    TEC += 8
  }
  if (joueur.inCurrentSeason) {
    TAC += 5
  }

  return {
    PLO: clamp(PLO, 40, 85),
    TIR: clamp(TIR, 40, 85),
    TEC: clamp(TEC, 40, 85),
    TAC: clamp(TAC, 40, 85),
    PHY: clamp(PHY, 40, 85),
    MEN: clamp(MEN, 40, 85),
  }
}

// ── computePlayerTier ─────────────────────────────────────────────────────────

/**
 * Calcule le tier gamifié d'un joueur.
 *
 * Règle Elite : moyenne des 6 stats > 70 ET totalAcademySeasons >= 3
 * Sinon : mapping depuis computedStatus (Académicien/Ancien/Nouveau/Prospect)
 */
export function computePlayerTier(joueur: JoueurListItem): PlayerTier {
  const stats = computePlayerStats(joueur)
  const values = [stats.PLO, stats.TIR, stats.TEC, stats.TAC, stats.PHY, stats.MEN]
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length

  if (avg > 70 && joueur.totalAcademySeasons >= 3) {
    return 'Elite'
  }

  // Mapping depuis computedStatus → PlayerTier
  switch (joueur.computedStatus) {
    case 'ACADÉMICIEN':
    case 'NOUVEAU_ACADÉMICIEN':
      return 'Académicien'
    case 'ANCIEN':
      return 'Confirmé'
    case 'STAGE_UNIQUEMENT':
    case 'PROSPECT':
    default:
      return 'Prospect'
  }
}

// ── computePlayerXP ───────────────────────────────────────────────────────────

/**
 * Calcule un score XP proxy depuis les données disponibles.
 * Story 52-7 — remplacé par vraie table player_xp_events en story 59-1.
 *
 * Formule :
 *  - Base : totalAcademySeasons × 200
 *  - Bonus stage : totalStages × 50
 *  - Bonus saison courante : inCurrentSeason ? 100 : 0
 *  - Bonus ancienneté ≥ 5 saisons : 300
 */
export function computePlayerXP(joueur: XPInputFields): number {
  const base         = joueur.totalAcademySeasons * 200
  const stageBonus   = joueur.totalStages * 50
  const currentBonus = joueur.inCurrentSeason ? 100 : 0
  const seniorBonus  = joueur.totalAcademySeasons >= 5 ? 300 : 0
  return base + stageBonus + currentBonus + seniorBonus
}

// ── computePlayerBadges — Story 52-9 ─────────────────────────────────────────

/**
 * Type minimal pour le calcul des badges gamifiés.
 * Compatible avec JoueurListItem et les champs de ChildAcademyStatusData.
 */
type BadgeInputFields = {
  totalAcademySeasons: number
  totalStages        : number
  inCurrentSeason    : boolean
  computedStatus     : string | null
}

/** Définition interne d'un badge avec sa condition de déclenchement */
type BadgeDefinition = {
  id         : string
  label      : string
  description: string
  icon       : string
  isUnlocked : (j: BadgeInputFields, tier: PlayerTier) => boolean
}

/** 10 badges statiques (data future table story 59-4) */
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id         : 'premiere-saison',
    label      : 'Première saison',
    description: 'A participé à au moins 1 saison à l\'académie',
    icon       : '🏆',
    isUnlocked : (j) => j.totalAcademySeasons >= 1,
  },
  {
    id         : 'veteran-3',
    label      : 'Vétéran 3 saisons',
    description: 'A participé à au moins 3 saisons à l\'académie',
    icon       : '🌟',
    isUnlocked : (j) => j.totalAcademySeasons >= 3,
  },
  {
    id         : 'veteran-5',
    label      : 'Vétéran 5 saisons',
    description: 'A participé à au moins 5 saisons à l\'académie',
    icon       : '👑',
    isUnlocked : (j) => j.totalAcademySeasons >= 5,
  },
  {
    id         : 'premier-stage',
    label      : 'Premier stage',
    description: 'A participé à au moins 1 stage',
    icon       : '⛺',
    isUnlocked : (j) => j.totalStages >= 1,
  },
  {
    id         : 'stagiaire-confirme',
    label      : 'Stagiaire confirmé',
    description: 'A participé à au moins 3 stages',
    icon       : '🎯',
    isUnlocked : (j) => j.totalStages >= 3,
  },
  {
    id         : 'academicien',
    label      : 'Académicien',
    description: 'Académicien ou ancien de l\'académie Aureak',
    icon       : '🎓',
    isUnlocked : (j) =>
      j.computedStatus === 'ACADÉMICIEN' || j.computedStatus === 'ANCIEN',
  },
  {
    id         : 'capitaine',
    label      : 'Capitaine',
    description: 'Au moins 4 saisons et 2 stages à l\'académie',
    icon       : '🦁',
    isUnlocked : (j) => j.totalAcademySeasons >= 4 && j.totalStages >= 2,
  },
  {
    id         : 'assidu',
    label      : 'Assidu',
    description: 'Présent cette saison et au moins 2 saisons d\'expérience',
    icon       : '✅',
    isUnlocked : (j) => j.inCurrentSeason && j.totalAcademySeasons >= 2,
  },
  {
    id         : 'elite',
    label      : 'Élite',
    description: 'A atteint le tier Élite',
    icon       : '⚡',
    isUnlocked : (_j, tier) => tier === 'Elite',
  },
  {
    id         : 'legende',
    label      : 'Légende',
    description: 'A participé à au moins 7 saisons à l\'académie',
    icon       : '🏅',
    isUnlocked : (j) => j.totalAcademySeasons >= 7,
  },
]

/**
 * Calcule les 10 badges gamifiés d'un joueur.
 * Story 52-9 — données statiques, remplacées par table player_badges en story 59-4.
 */
export function computePlayerBadges(joueur: BadgeInputFields): BadgeItem[] {
  const tier = computePlayerTier(joueur as JoueurListItem)
  return BADGE_DEFINITIONS.map(def => ({
    id         : def.id,
    label      : def.label,
    description: def.description,
    icon       : def.icon,
    unlocked   : def.isUnlocked(joueur, tier),
  }))
}
