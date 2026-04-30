// Helpers de formatage des noms/prénoms pour l'affichage Panini.
// Convention Aureak : NOM en MAJUSCULES, prénom en Capitalisé.

/**
 * Met le nom de famille en MAJUSCULES (toUpperCase + trim).
 * Préserve les accents et les séparateurs (espace, tiret, apostrophe).
 *   "moreira da costa" → "MOREIRA DA COSTA"
 *   "marlair"          → "MARLAIR"
 */
export function formatNom(nom: string | null | undefined): string {
  return (nom ?? '').trim().toUpperCase()
}

/**
 * Met le prénom en "Capitalize each word" — première lettre majuscule, reste minuscule.
 * Gère les séparateurs courants : espace, tiret, apostrophe.
 *   "TOM"          → "Tom"
 *   "jean-pierre"  → "Jean-Pierre"
 *   "MARIE CLAIRE" → "Marie Claire"
 *   "thyméo"       → "Thyméo"
 */
export function formatPrenom(prenom: string | null | undefined): string {
  const v = (prenom ?? '').trim()
  if (!v) return ''
  // Découpe sur tout séparateur courant en conservant le séparateur.
  return v.replace(/([^\s\-'])([^\s\-']*)/g, (_, first: string, rest: string) =>
    first.toUpperCase() + rest.toLowerCase(),
  )
}
