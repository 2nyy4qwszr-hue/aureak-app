// Story 93.1 — Helpers de formatage de période (eyebrow AdminPageHeader)
// Formats français, capitalisation manuelle (toLocaleDateString renvoie "avril" minuscule).

export function formatPeriodLabel(date: Date = new Date()): string {
  const raw = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function formatEyebrow(context: string, date: Date = new Date()): string {
  return `${context} · ${formatPeriodLabel(date)}`.toUpperCase()
}
