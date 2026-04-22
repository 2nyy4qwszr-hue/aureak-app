// Story 93.1 — Helper de formatage de période (periodButton AdminPageHeader)
// Story 97.3 — formatEyebrow retiré (eyebrow devenu optionnel, plus aucun usage).
// Formats français, capitalisation manuelle (toLocaleDateString renvoie "avril" minuscule).

export function formatPeriodLabel(date: Date = new Date()): string {
  const raw = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}
