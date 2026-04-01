'use client'
// Story 9.3 — Comparaison inter-implantations (anonymisée)
import { useEffect, useState } from 'react'
import { getComparisonReport } from '@aureak/api-client'
import { computeRankings } from '@aureak/business-logic'
import type { ImplantationStat } from '@aureak/business-logic'
import { colors, shadows } from '@aureak/theme'

const METRICS: { key: keyof ImplantationStat; label: string; isPct: boolean }[] = [
  { key: 'attendance_rate_pct', label: 'Présence %',         isPct: true  },
  { key: 'mastery_rate_pct',    label: 'Maîtrise %',         isPct: true  },
  { key: 'sessions_closed',     label: 'Séances clôturées',  isPct: false },
  { key: 'sessions_total',      label: 'Séances totales',    isPct: false },
]

function rateColor(pct: number): string {
  if (pct >= 80) return colors.status.present
  if (pct >= 60) return colors.status.attention
  return colors.status.absent
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <>
      <style>{`
        @keyframes cp-pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
        .cp-skel { animation: cp-pulse 1.4s ease-in-out infinite; background: ${colors.light.muted}; border-radius: 4px; }
      `}</style>
      <div style={styles.container}>
        <div className="cp-skel" style={{ height: 32, width: 320, marginBottom: 24, borderRadius: 6 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[120, 120, 160, 100].map((w, i) => (
            <div key={i} className="cp-skel" style={{ height: 36, width: w, borderRadius: 6 }} />
          ))}
        </div>
        <div style={{ ...styles.chartCard, gap: 16 }}>
          {[90, 75, 60, 45, 30].map((pct, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="cp-skel" style={{ height: 13, width: 100, flexShrink: 0 }} />
              <div className="cp-skel" style={{ height: 20, width: `${pct}%`, borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ ranked, metricKey }: {
  ranked: ReturnType<typeof computeRankings>
  metricKey: keyof ImplantationStat
}) {
  const metric   = METRICS.find(m => m.key === metricKey)!
  const maxValue = Math.max(...ranked.map(r => (r[metricKey] as number) ?? 0), 1)

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>{metric.label}</div>
      {ranked.length === 0 ? (
        <div style={{ color: colors.text.muted, fontSize: 14 }}>Aucune donnée pour cette période</div>
      ) : (
        ranked.map((row, idx) => {
          const value   = (row[metricKey] as number) ?? 0
          const barPct  = (value / maxValue) * 100
          const barColor = metric.isPct ? rateColor(value) : colors.accent.gold
          const isFirst  = row.isFirst
          const isLast   = row.isLast
          return (
            <div key={row.implantation_id} style={styles.barRow}>
              <div style={styles.barLabel}>
                <span style={{ fontSize: 12, marginRight: 4 }}>
                  {isFirst ? '🥇' : isLast ? '⚠️' : `#${row.rank}`}
                </span>
                <span style={{ fontWeight: isFirst ? 700 : 400, color: isFirst ? colors.text.dark : colors.text.muted, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                  {row.implantation_name}
                </span>
              </div>
              <div style={styles.barTrack}>
                <div
                  style={{
                    height: '100%',
                    width: `${barPct}%`,
                    backgroundColor: barColor,
                    borderRadius: 3,
                    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                    opacity: 0.85 + (idx === 0 ? 0.15 : 0),
                    minWidth: value > 0 ? 4 : 0,
                  }}
                />
              </div>
              <div style={{ ...styles.barValue, color: barColor }}>
                {typeof value === 'number' ? (metric.isPct ? `${value}%` : value) : '—'}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default function ComparisonPage() {
  const [data, setData]             = useState<ImplantationStat[]>([])
  const [loading, setLoading]       = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [metricKey, setMetricKey]   = useState<keyof ImplantationStat>('attendance_rate_pct')
  const [from, setFrom]             = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    try {
      const result = await getComparisonReport(
        new Date(from).toISOString(),
        new Date(to).toISOString(),
      )
      setData((result.data as ImplantationStat[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [from, to])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/export-comparison-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: new Date(from).toISOString(), to: new Date(to).toISOString() }),
      })
      const { url } = await res.json()
      window.open(url, '_blank')
    } finally {
      setExportLoading(false)
    }
  }

  const ranked = computeRankings(data, metricKey)

  if (loading) return <Skeleton />

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Comparaison inter-implantations</h1>

      {/* Filtres */}
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Période</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={styles.input} />
            <span style={styles.sep}>→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={styles.input} />
          </div>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Indicateur</span>
          <select
            value={metricKey as string}
            onChange={e => setMetricKey(e.target.value as keyof ImplantationStat)}
            style={styles.select}
          >
            {METRICS.map(m => (
              <option key={m.key as string} value={m.key as string}>{m.label}</option>
            ))}
          </select>
        </div>
        <button
          style={exportLoading ? { ...styles.exportBtn, opacity: 0.6 } : styles.exportBtn}
          onClick={handleExport}
          disabled={exportLoading}
        >
          {exportLoading ? 'Export...' : 'Exporter CSV'}
        </button>
      </div>

      {/* Bar chart */}
      <BarChart ranked={ranked} metricKey={metricKey} />

      {/* Tableau comparatif */}
      <div style={styles.tableSection}>
        <div style={styles.sectionLabel}>Tableau détaillé</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Implantation</th>
              {METRICS.map(m => (
                <th
                  key={m.key as string}
                  style={m.key === metricKey ? { ...styles.th, ...styles.thActive } : styles.th}
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map(row => (
              <tr
                key={row.implantation_id}
                style={row.isFirst ? { ...styles.tr, ...styles.trFirst } : row.isLast ? { ...styles.tr, ...styles.trLast } : styles.tr}
              >
                <td style={styles.td}>
                  {row.isFirst ? '🥇' : row.isLast ? '⚠️' : row.rank}
                </td>
                <td style={{ ...styles.td, fontWeight: 600 }}>{row.implantation_name}</td>
                {METRICS.map(m => (
                  <td
                    key={m.key as string}
                    style={m.key === metricKey ? { ...styles.td, ...styles.tdActive } : styles.td}
                  >
                    {typeof row[m.key] === 'number'
                      ? m.isPct
                        ? `${row[m.key]}%`
                        : row[m.key]
                      : '—'}
                  </td>
                ))}
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: colors.text.muted }}>
                  Aucune donnée pour cette période
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={styles.disclaimer}>
        Données anonymisées — aucun nom individuel (joueur, parent, coach) n&apos;est affiché.
      </p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container    : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 960 },
  title        : { fontSize: '26px', fontWeight: 700, marginBottom: '24px', fontFamily: 'Rajdhani, sans-serif' },
  filterRow    : { display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' },
  filterGroup  : { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel  : { fontSize: '10px', color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  input        : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: '14px' },
  sep          : { color: colors.text.muted },
  select       : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: '14px', cursor: 'pointer' },
  exportBtn    : { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 600, marginBottom: 1 },
  // ── Chart ──
  chartCard    : { backgroundColor: colors.light.surface, borderRadius: '12px', border: `1px solid ${colors.border.light}`, padding: '20px 24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: 14, ...shadows.sm },
  chartTitle   : { fontSize: '11px', fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
  barRow       : { display: 'flex', alignItems: 'center', gap: 12 },
  barLabel     : { display: 'flex', alignItems: 'center', gap: 4, width: 200, flexShrink: 0 },
  barTrack     : { flex: 1, height: 20, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden' },
  barValue     : { width: 52, textAlign: 'right', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  // ── Table ──
  tableSection : { marginBottom: 16 },
  sectionLabel : { fontSize: '11px', fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  table        : { width: '100%', borderCollapse: 'collapse', backgroundColor: colors.light.surface, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border.light}`, ...shadows.sm },
  th           : { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${colors.border.light}` },
  thActive     : { color: colors.accent.gold },
  tr           : { borderBottom: `1px solid ${colors.border.light}` },
  trFirst      : { backgroundColor: 'rgba(76,175,80,0.07)' },
  trLast       : { backgroundColor: 'rgba(244,67,54,0.07)' },
  td           : { padding: '12px 16px', fontSize: '14px' },
  tdActive     : { color: colors.accent.gold, fontWeight: 700 },
  disclaimer   : { marginTop: '16px', fontSize: '12px', color: colors.text.muted, fontStyle: 'italic' },
}
