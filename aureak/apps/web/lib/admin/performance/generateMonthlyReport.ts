// Story 60.7 — Générateur rapport PDF mensuel académie
// Import dynamique jspdf obligatoire pour éviter crash SSR Expo Router
// RÈGLE : try/finally obligatoire sur tout state de chargement (géré dans le composant appelant)
// RÈGLE : console guards obligatoires

import type { MonthlyReportData, ReportOptions } from '@aureak/types'

// Couleurs AUREAK (synchronisées manuellement avec tokens pour éviter import côté serveur)
const GOLD   = '#C1AC5C'
const GREEN  = '#10B981'
const RED    = '#E05252'
const DARK   = '#18181B'
const MUTED  = '#71717A'
const WHITE  = '#FFFFFF'
const LIGHT  = '#F3EFE7'

// ── Utilitaire couleur valeur (miroir de getStatColor) ────────────────────────

function statColor(value: number, high: number, low: number): [number, number, number] {
  if (value >= high) return hexToRgb(GREEN)
  if (value >= low)  return hexToRgb(GOLD)
  return hexToRgb(RED)
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

// ── Export principal ──────────────────────────────────────────────────────────

export async function generateMonthlyReport(
  data   : MonthlyReportData,
  options: ReportOptions,
): Promise<void> {
  // Import dynamique — évite le crash SSR Expo Router
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PAGE_W  = 210
  const PAGE_H  = 297
  const MARGIN  = 16
  const COL_W   = PAGE_W - MARGIN * 2
  let   y       = MARGIN

  // ── Utilitaires de dessin ─────────────────────────────────────────────────

  function setColor(hex: string) {
    const [r, g, b] = hexToRgb(hex)
    doc.setTextColor(r, g, b)
  }

  function setFill(hex: string) {
    const [r, g, b] = hexToRgb(hex)
    doc.setFillColor(r, g, b)
  }

  function setDraw(hex: string) {
    const [r, g, b] = hexToRgb(hex)
    doc.setDrawColor(r, g, b)
  }

  function text(str: string, x: number, yPos: number, opts?: object) {
    doc.text(str, x, yPos, opts)
  }

  // ── Header ────────────────────────────────────────────────────────────────

  // Fond header
  setFill(DARK)
  doc.rect(0, 0, PAGE_W, 38, 'F')

  // Stripe or
  setFill(GOLD)
  doc.rect(0, 0, PAGE_W, 2, 'F')

  // Titre AUREAK
  setColor(GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  text('AUREAK', MARGIN, 18)

  doc.setFontSize(10)
  setColor(WHITE)
  doc.setFont('helvetica', 'normal')
  text('Académie des Gardiens', MARGIN, 26)

  // Mois et implantation
  const [year, month] = options.month.split('-')
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const monthLabel  = monthNames[parseInt(month, 10) - 1] ?? month
  const dateLabel   = `${monthLabel} ${year}`
  const implLabel   = options.implantationId ? data.implantationName : 'Toutes implantations'

  doc.setFontSize(10)
  setColor(WHITE)
  text(dateLabel,  PAGE_W - MARGIN, 18, { align: 'right' })
  text(implLabel,  PAGE_W - MARGIN, 26, { align: 'right' })

  y = 46

  // ── Titre section ─────────────────────────────────────────────────────────

  function sectionTitle(title: string) {
    setColor(DARK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    text(title, MARGIN, y)
    setDraw(GOLD)
    doc.setLineWidth(0.4)
    doc.line(MARGIN, y + 2, MARGIN + COL_W, y + 2)
    y += 10
  }

  // ── Section 1 : KPIs globaux ──────────────────────────────────────────────

  if (options.sections.presences) {
    sectionTitle('Chiffres clés')

    const kpis = [
      { label: 'Séances',          value: String(data.totalSessions),     color: GOLD  as string },
      { label: 'Joueurs actifs',   value: String(data.activePlayers),      color: DARK  as string },
      { label: 'Taux de présence', value: `${data.avgAttendanceRate}%`,
        color: (() => {
          const [r, g, b] = statColor(data.avgAttendanceRate, 80, 60)
          return `rgb(${r},${g},${b})`
        })() },
    ]

    const kpiW  = COL_W / kpis.length
    const kpiX0 = MARGIN

    kpis.forEach((kpi, idx) => {
      const kx = kpiX0 + idx * kpiW + 2
      const ky = y

      // Card fond
      setFill(LIGHT)
      doc.roundedRect(kx, ky, kpiW - 4, 22, 2, 2, 'F')

      // Label
      setColor(MUTED)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      text(kpi.label.toUpperCase(), kx + (kpiW - 4) / 2, ky + 7, { align: 'center' })

      // Valeur colorée
      const [vr, vg, vb] = statColor(
        parseFloat(kpi.value) || 0,
        kpi.label === 'Taux de présence' ? 80 : 9999,
        kpi.label === 'Taux de présence' ? 60 : -1,
      )
      // Couleur or pour séances/joueurs
      if (kpi.color === GOLD) {
        const [gr, gg, gb] = hexToRgb(GOLD)
        doc.setTextColor(gr, gg, gb)
      } else if (kpi.label === 'Joueurs actifs') {
        const [dr, dg, db] = hexToRgb(DARK)
        doc.setTextColor(dr, dg, db)
      } else {
        doc.setTextColor(vr, vg, vb)
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      text(kpi.value, kx + (kpiW - 4) / 2, ky + 17, { align: 'center' })
    })

    y += 32
  }

  // ── Section 2 : Par groupe ────────────────────────────────────────────────

  if (options.sections.presences && data.groups.length > 0) {
    sectionTitle('Résultats par groupe')

    // En-tête tableau
    setFill(DARK)
    doc.rect(MARGIN, y, COL_W, 7, 'F')
    setColor(WHITE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    text('Groupe',         MARGIN + 3,             y + 5)
    text('Séances',        MARGIN + COL_W * 0.55,  y + 5)
    text('Présence',       MARGIN + COL_W * 0.70,  y + 5)
    text('Maîtrise moy.',  MARGIN + COL_W * 0.85,  y + 5)
    y += 9

    data.groups.forEach((grp, idx) => {
      const rowBg = idx % 2 === 0 ? LIGHT : WHITE
      setFill(rowBg)
      doc.rect(MARGIN, y, COL_W, 7, 'F')

      setColor(DARK)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      text(grp.groupName.slice(0, 30),   MARGIN + 3,             y + 5)
      text(String(grp.sessionCount),     MARGIN + COL_W * 0.55,  y + 5)

      // Présence colorée
      const [pr, pg, pb] = statColor(grp.attendanceRate, 80, 60)
      doc.setTextColor(pr, pg, pb)
      doc.setFont('helvetica', 'bold')
      text(`${grp.attendanceRate}%`,     MARGIN + COL_W * 0.70,  y + 5)

      setColor(MUTED)
      doc.setFont('helvetica', 'normal')
      text(grp.masteryAvg > 0 ? `${grp.masteryAvg}/5` : '—', MARGIN + COL_W * 0.85, y + 5)

      y += 7
    })

    y += 8
  }

  // ── Section 3 : Top joueurs ───────────────────────────────────────────────

  if (options.sections.topPlayers && data.topPlayers.length > 0) {
    // Nouvelle page si trop bas
    if (y > PAGE_H - 60) {
      doc.addPage()
      y = MARGIN
    }

    sectionTitle('Top joueurs — Présence')

    data.topPlayers.forEach((player) => {
      const medals = ['🥇', '🥈', '🥉', '4.', '5.']
      const medalText = medals[player.rank - 1] ?? `${player.rank}.`

      setColor(MUTED)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      text(`${medalText.replace(/[🥇🥈🥉]/u, `#${player.rank}`)}`, MARGIN + 2, y)

      setColor(DARK)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      text(player.displayName, MARGIN + 16, y)

      setColor(MUTED)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      text(player.groupName, MARGIN + 80, y)

      const [vr, vg, vb] = statColor(player.rate, 80, 60)
      doc.setTextColor(vr, vg, vb)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      text(`${player.rate}%`, PAGE_W - MARGIN - 5, y, { align: 'right' })

      y += 8
    })

    y += 4
  }

  // ── Footer ────────────────────────────────────────────────────────────────

  const genDate = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
  setFill(DARK)
  doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F')
  setColor(MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  text(`Généré le ${genDate} — Aureak Academy Platform`, PAGE_W / 2, PAGE_H - 4, { align: 'center' })

  // ── Téléchargement ────────────────────────────────────────────────────────
  doc.save(options.filename)

  if (process.env.NODE_ENV !== 'production') console.info('[generateMonthlyReport] PDF généré :', options.filename)
}
