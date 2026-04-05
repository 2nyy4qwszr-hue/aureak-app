// playerStats.ts — Calcul des 6 attributs gardien et du tier gamifié
// Story 52-2 : PLO/TIR/TEC/TAC/PHY/MEN calculés depuis JoueurListItem
// Story 52-7 : computePlayerXP — score proxy XP basé sur saisons/stages/saison courante
// Source de vérité couleurs : gamification.statBands dans @aureak/theme

import type { JoueurListItem } from '@aureak/api-client'
import type { PlayerTier } from '@aureak/types'

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
