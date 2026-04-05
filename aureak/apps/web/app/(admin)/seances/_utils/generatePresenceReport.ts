// Story 54-8 — Générateur de rapport PDF présences hebdomadaires
// Utilise window.print() via un iframe caché (pas de dépendance externe)
import type { SessionRowAdmin } from '@aureak/api-client'

export type PresenceReportEntry = {
  name  : string
  status: string
}

export type PresenceReportData = {
  session    : SessionRowAdmin
  groupName  : string
  attendances: PresenceReportEntry[]
}

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const DAYS_FR   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']

function fmtDateLong(iso: string): string {
  const d = new Date(iso)
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}h${String(d.getMinutes()).padStart(2,'0')}`
}

function statusLabel(status: string): string {
  switch (status) {
    case 'present'    : return '✓ Présent'
    case 'absent'     : return '✗ Absent'
    case 'late'       : return '⏱ Retard'
    case 'injured'    : return '🩹 Blessé'
    case 'trial'      : return '👀 Essai'
    case 'unconfirmed': return '? Non confirmé'
    default           : return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'present'    : return '#059669'
    case 'absent'     : return '#DC2626'
    case 'late'       : return '#D97706'
    case 'injured'    : return '#D97706'
    case 'trial'      : return '#4F46E5'
    default           : return '#6B7280'
  }
}

/**
 * Construit une string HTML complète (page A4 imprimable) pour le rapport de présences.
 */
export function buildPresenceReportHTML(
  weekLabel: string,
  sessions : PresenceReportData[],
): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const sessionBlocks = sessions.map(({ session, groupName, attendances }) => {
    const rows = attendances.length > 0
      ? attendances.map(a => `
          <tr>
            <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;">${a.name}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;color:${statusColor(a.status)};font-weight:700;">${statusLabel(a.status)}</td>
          </tr>`).join('')
      : `<tr><td colspan="2" style="padding:8px;color:#9ca3af;font-style:italic;">Aucune présence enregistrée</td></tr>`

    const typeLabel = session.sessionType
      ? (session.sessionType === 'goal_and_player' ? 'Goal & Player' :
         session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1))
      : ''

    return `
      <div class="session-block">
        <div class="session-header">
          <div class="session-group">${groupName}</div>
          <div class="session-meta">
            ${fmtDateLong(session.scheduledAt)}
            · ${fmtTime(session.scheduledAt)}
            · ${session.durationMinutes} min
            ${typeLabel ? `· ${typeLabel}` : ''}
            · <span style="text-transform:capitalize">${session.status}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:4px 8px;font-size:10px;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;text-transform:uppercase;letter-spacing:0.05em;">Joueur</th>
              <th style="text-align:left;padding:4px 8px;font-size:10px;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;text-transform:uppercase;letter-spacing:0.05em;">Statut</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('<div class="session-divider"></div>')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de présences — ${weekLabel}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1f2937; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-break { page-break-inside: avoid; }
    }
    .report-header {
      border-bottom: 3px solid #D4AF37;
      padding-bottom: 14px;
      margin-bottom: 24px;
      text-align: center;
    }
    .report-brand {
      font-size: 22px;
      font-weight: 900;
      color: #1A1A1A;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .report-brand span { color: #D4AF37; }
    .report-subtitle {
      font-size: 14px;
      font-weight: 700;
      color: #4b5563;
      margin-top: 6px;
    }
    .report-period { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .session-block {
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .session-header {
      background: #f9fafb;
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .session-group {
      font-size: 15px;
      font-weight: 800;
      color: #1f2937;
    }
    .session-meta {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .session-divider { height: 0; margin: 0; }
    .report-footer {
      margin-top: 32px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="report-brand">AURE<span>AK</span></div>
    <div class="report-subtitle">Rapport de présences</div>
    <div class="report-period">${weekLabel}</div>
  </div>

  ${sessions.length === 0
    ? '<p style="color:#9ca3af;text-align:center;padding:40px 0;">Aucune séance sur cette période.</p>'
    : sessionBlocks
  }

  <div class="report-footer">
    <span>Imprimé le ${today}</span>
    <span>aureak.be</span>
  </div>
</body>
</html>`
}

/**
 * Injecte le HTML dans un iframe caché et déclenche l'impression.
 * Nettoie l'iframe après 2 secondes.
 */
export function printReport(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.display  = 'none'
  iframe.style.position = 'absolute'
  iframe.style.top      = '-9999px'
  document.body.appendChild(iframe)
  try {
    iframe.contentDocument?.write(html)
    iframe.contentDocument?.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  } finally {
    setTimeout(() => {
      try { document.body.removeChild(iframe) } catch { /* already removed */ }
    }, 2000)
  }
}
