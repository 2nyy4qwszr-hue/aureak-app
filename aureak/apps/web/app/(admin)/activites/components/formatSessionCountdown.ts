// Story 93.4 — Helpers pour le countdown + format absolu de la prochaine séance
// Fonctions pures, zéro I/O.

export type SessionCountdown = {
  relative : string   // "Maintenant" | "Dans Nmin" | "Dans Nh Mmin" | "Demain" | "Dans N jours"
  absolute : string   // "mardi 22 avril · 17:30 — 19:00"
  dayBadge : string   // "H-0" | "H-N" | "J-1" | "J-N" | "—"
  secondsTo: number   // secondes restantes (peut être <= 0 si séance dépassée)
}

export function decomposeSeconds(totalSec: number): {
  days : number
  hours: number
  mins : number
  secs : number
} {
  const clamped = Math.max(0, Math.floor(totalSec))
  const days  = Math.floor(clamped / 86400)
  const hours = Math.floor((clamped % 86400) / 3600)
  const mins  = Math.floor((clamped % 3600) / 60)
  const secs  = clamped % 60
  return { days, hours, mins, secs }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function isTomorrow(target: Date, now: Date): boolean {
  const t = new Date(target)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  return (
    t.getFullYear() === tomorrow.getFullYear() &&
    t.getMonth()    === tomorrow.getMonth() &&
    t.getDate()     === tomorrow.getDate()
  )
}

export function formatSessionCountdown(
  scheduledAt    : string,
  durationMinutes: number,
  now            : Date = new Date(),
): SessionCountdown {
  const target = new Date(scheduledAt)
  const diffMs = target.getTime() - now.getTime()
  const secondsTo = Math.floor(diffMs / 1000)

  // Format absolu : "mardi 22 avril · 17:30 — 19:00"
  const datePart = target.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day    : 'numeric',
    month  : 'long',
  })
  const startH = pad(target.getHours())
  const startM = pad(target.getMinutes())
  const end    = new Date(target.getTime() + durationMinutes * 60_000)
  const endH   = pad(end.getHours())
  const endM   = pad(end.getMinutes())
  const absolute = `${datePart} · ${startH}:${startM} — ${endH}:${endM}`

  // Relative + dayBadge
  if (secondsTo <= 0) {
    return { relative: 'Maintenant', absolute, dayBadge: 'H-0', secondsTo }
  }

  if (secondsTo < 3600) {
    const m = Math.ceil(secondsTo / 60)
    return { relative: `Dans ${m} min`, absolute, dayBadge: 'H-0', secondsTo }
  }

  if (secondsTo < 86400) {
    const h = Math.floor(secondsTo / 3600)
    const m = Math.floor((secondsTo % 3600) / 60)
    const rel = m > 0 ? `Dans ${h}h ${m}min` : `Dans ${h}h`
    return { relative: rel, absolute, dayBadge: `H-${h}`, secondsTo }
  }

  if (isTomorrow(target, now)) {
    return { relative: 'Demain', absolute, dayBadge: 'J-1', secondsTo }
  }

  const days = Math.floor(secondsTo / 86400)
  return { relative: `Dans ${days} jours`, absolute, dayBadge: `J-${days}`, secondsTo }
}
