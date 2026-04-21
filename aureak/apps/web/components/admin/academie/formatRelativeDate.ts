// Story 87.1 — Helper partagé : formate un timestamp ISO en libellé relatif court.
// Exemples : "aujourd'hui", "hier", "il y a 3j", "il y a 2m", "il y a 1a".

export function formatRelativeDate(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const then = new Date(isoString).getTime()
  if (Number.isNaN(then)) return '—'

  const diffMs   = Date.now() - then
  const diffDays = Math.floor(diffMs / (24 * 3600 * 1000))

  if (diffDays <= 0) return "aujourd'hui"
  if (diffDays === 1) return 'hier'
  if (diffDays < 30)  return `il y a ${diffDays}j`
  const months = Math.floor(diffDays / 30)
  if (months < 12)    return `il y a ${months}m`
  const years = Math.floor(diffDays / 365)
  return `il y a ${years}a`
}
