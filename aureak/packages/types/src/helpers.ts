// @aureak/types — Helpers d'affichage
// Story 18.5 — formatNomPrenom, capitalize

/**
 * capitalize — première lettre majuscule, reste en minuscules.
 * ex: 'MARIE' → 'Marie', 'marie' → 'Marie'
 */
export function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/**
 * formatNomPrenom — affichage "NOM Prénom" depuis les champs distincts ou displayName en fallback.
 *
 * Règle :
 * - nom ET prénom renseignés → `${nom.toUpperCase()} ${capitalize(prenom)}`
 * - nom seul              → `${nom.toUpperCase()}`
 * - prénom seul (nom=null) → `displayName` tel quel (fallback — prénom seul non exploitable sans nom)
 * - aucun (joueurs Notion) → `displayName` tel quel (fallback)
 *
 * @param nom         Nom de famille (peut être null)
 * @param prenom      Prénom (peut être null)
 * @param displayName Valeur de repli — toujours renseignée pour les enregistrements Notion
 */
export function formatNomPrenom(
  nom        : string | null,
  prenom     : string | null,
  displayName: string,
): string {
  if (nom && prenom) return `${nom.trim().toUpperCase()} ${capitalize(prenom.trim())}`
  if (nom)           return nom.trim().toUpperCase()
  return displayName
}
