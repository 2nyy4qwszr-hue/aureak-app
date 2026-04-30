// Helpers de formatage et calcul de dates côté web.
// Story 105.2 — affichage participants stage (DDN + âge calculé).

/**
 * Calcule l'âge en années à partir d'une date ISO (YYYY-MM-DD).
 * Retourne null si la date est absente ou invalide.
 */
export function computeAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

/**
 * Formatte une date ISO (YYYY-MM-DD) en JJ/MM/AAAA.
 * Retourne '—' si la date est absente ou invalide.
 */
export function formatDateFR(birthDate: string | null | undefined): string {
  if (!birthDate) return '—'
  const d = new Date(birthDate)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
