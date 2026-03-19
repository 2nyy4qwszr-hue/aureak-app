// Story 25.0 — Calcul des étoiles de niveau équipe (miroir côté application de la colonne générée DB)
// Utile pour l'affichage optimiste dans le formulaire (avant rechargement depuis la DB).
// Source de vérité DB : migration 00083 (GENERATED ALWAYS AS … STORED).

const YOUTH_STARS: Record<string, number> = {
  'Régional'  : 1,
  'Provincial': 2,
  'Inter'     : 3,
  'Élite 2'   : 4,
  'Élite 1'   : 5,
}

const SENIOR_STARS: Record<string, number> = {
  'P4'         : 1,
  'P3'         : 1,
  'P2'         : 2,
  'P1'         : 2,
  'D3 amateurs': 3,
  'D2 amateurs': 3,
  'D1 amateurs': 3,
  'D1B'        : 4,
  'D1A'        : 5,
}

/**
 * Calcule le nombre d'étoiles (1-5) selon le type de joueur et son niveau.
 * Retourne null si age_category ou le niveau n'est pas renseigné.
 *
 * Miroir exact de la logique dans migration 00083 (team_level_stars GENERATED ALWAYS AS).
 */
export function computeTeamLevelStars(
  ageCategory   : string | null,
  youthLevel    : string | null,
  seniorDivision: string | null,
): number | null {
  if (!ageCategory) return null
  if (ageCategory === 'Senior') {
    return SENIOR_STARS[seniorDivision ?? ''] ?? null
  }
  return YOUTH_STARS[youthLevel ?? ''] ?? null
}
