'use client'
// Admin Dashboard — vue de contrôle multi-implantations
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { getImplantationStats, listAnomalies, resolveAnomaly, supabase } from '@aureak/api-client'
import type { ImplantationStats, AnomalyEvent } from '@aureak/api-client'
import { colors } from '@aureak/theme'

// ── Design tokens (local helpers) ─────────────────────────────────────────────

const SEV_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 }

const SEV_COLOR: Record<string, string> = {
  critical: colors.status.absent,
  warning : colors.status.attention,
  info    : colors.accent.gold,
}

const SEV_LABEL: Record<string, string> = {
  critical: 'Critique',
  warning : 'Avertissement',
  info    : 'Info',
}

function rateColor(pct: number | null): string {
  if (pct === null || pct === undefined) return colors.text.secondary
  if (pct >= 80) return colors.status.present
  if (pct >= 60) return colors.status.attention
  return colors.status.absent
}

function anomalyLabel(type: string): string {
  return type
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonBlock({ h, w = '100%', r = 8 }: { h: number; w?: string; r?: number }) {
  return <div className="a-skel" style={{ height: h, width: w, borderRadius: r, flexShrink: 0 }} />
}

function DashboardSkeleton() {
  return (
    <div style={S.container}>
      <style>{`
        @keyframes a-pulse{0%,100%{opacity:.18}50%{opacity:.45}}
        .a-skel{background:${colors.background.elevated};animation:a-pulse 1.8s ease-in-out infinite}
      `}</style>

      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBlock h={28} w="180px" r={5} />
          <SkeletonBlock h={14} w="240px" r={4} />
        </div>
        <SkeletonBlock h={34} w="300px" r={8} />
      </div>

      {/* KPI strip skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[0,1,2,3,4].map(i => <SkeletonBlock key={i} h={92} r={10} />)}
      </div>

      {/* Implantation cards skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <SkeletonBlock h={16} w="140px" r={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[0,1,2].map(i => <SkeletonBlock key={i} h={188} r={12} />)}
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

type KpiCardProps = {
  label : string
  value : string | number
  sub  ?: string
  accent: string
}

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div style={{ ...S.kpiCard, borderTop: `2px solid ${accent}` }}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={{ ...S.kpiValue, color: accent }}>{value}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct, label }: { pct: number | null; label: string }) {
  const val   = Math.min(pct ?? 0, 100)
  const color = rateColor(pct)
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: colors.text.secondary }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'Geist Mono, monospace' }}>
          {pct !== null && pct !== undefined ? `${val}%` : '—'}
        </span>
      </div>
      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill, width: `${val}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Implantation Card ─────────────────────────────────────────────────────────

function ImplantationCard({ stat }: { stat: ImplantationStats }) {
  const attendanceColor  = rateColor(stat.attendance_rate_pct)
  const seancesRatio     = stat.sessions_total > 0
    ? `${stat.sessions_closed}/${stat.sessions_total}`
    : '—'
  const seancesPct       = stat.sessions_total > 0
    ? Math.round((stat.sessions_closed / stat.sessions_total) * 100)
    : null

  return (
    <div style={{ ...S.implantCard, borderTop: `2px solid ${attendanceColor}` }}>
      <div style={S.implantName}>{stat.implantation_name}</div>

      <ProgressBar pct={stat.attendance_rate_pct} label="Présence" />
      <ProgressBar pct={stat.mastery_rate_pct} label="Maîtrise" />

      <div style={S.implantFooter}>
        <span style={{ fontSize: 11, color: colors.text.secondary }}>Séances clôturées</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={S.implantSeances}>{seancesRatio}</span>
          {seancesPct !== null && (
            <span style={{ fontSize: 10, color: colors.text.secondary }}>({seancesPct}%)</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '+ Nouvelle séance',    href: '/sessions/new', primary: true  },
  { label: '+ Inviter utilisateur', href: '/users/new',   primary: true  },
  { label: '→ Présences',          href: '/attendance',   primary: false },
  { label: '→ Évaluations',        href: '/evaluations',  primary: false },
  { label: '→ Coachs',             href: '/coaches',      primary: false },
] as const

export default function DashboardPage() {
  const router = useRouter()
  const [stats,         setStats]         = useState<ImplantationStats[]>([])
  const [anomalies,     setAnomalies]     = useState<AnomalyEvent[]>([])
  const [childrenTotal, setChildrenTotal] = useState<number | null>(null)
  const [coachesTotal,  setCoachesTotal]  = useState<number | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [resolving,     setResolving]     = useState<string | null>(null)

  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    const [statsResult, anomalyResult, childrenRes, coachesRes] = await Promise.all([
      getImplantationStats(new Date(from).toISOString(), new Date(to).toISOString()),
      listAnomalies(),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true })
        .eq('user_role', 'child').is('deleted_at', null),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true })
        .eq('user_role', 'coach').is('deleted_at', null),
    ])
    setStats(statsResult.data ?? [])
    setAnomalies(anomalyResult.data)
    setChildrenTotal(childrenRes.count ?? 0)
    setCoachesTotal(coachesRes.count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  const handleResolve = async (id: string) => {
    setResolving(id)
    await resolveAnomaly(id)
    setResolving(null)
    await load()
  }

  if (loading) return <DashboardSkeleton />

  // ── Computed global KPIs ──
  const totalSessions  = stats.reduce((s, i) => s + (i.sessions_total  ?? 0), 0)
  const closedSessions = stats.reduce((s, i) => s + (i.sessions_closed ?? 0), 0)
  const avgAttendance  = stats.length
    ? Math.round(stats.reduce((s, i) => s + (i.attendance_rate_pct ?? 0), 0) / stats.length)
    : null
  const avgMastery     = stats.length
    ? Math.round(stats.reduce((s, i) => s + (i.mastery_rate_pct ?? 0), 0) / stats.length)
    : null

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length
  const sortedAnomalies = [...anomalies].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
  )

  return (
    <div style={S.container}>
      <style>{`
        .aureak-resolve-btn:hover { opacity: 0.85; }
        .aureak-refresh-btn:hover { border-color: ${colors.accent.gold}; color: ${colors.accent.gold}; }
        .aureak-card:hover { border-color: ${colors.accent.zinc}; transform: translateY(-1px); }
      `}</style>

      {/* ── Page Header ── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Tableau de bord</h1>
          <div style={S.pageSubtitle}>Vue globale · {stats.length} implantation{stats.length !== 1 ? 's' : ''}</div>
        </div>

        <div style={S.filterRow}>
          <div style={S.dateGroup}>
            <label style={S.dateLabel}>Du</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={S.dateInput}
            />
          </div>
          <span style={{ color: colors.text.secondary, fontSize: 13, paddingTop: 16 }}>→</span>
          <div style={S.dateGroup}>
            <label style={S.dateLabel}>Au</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              style={S.dateInput}
            />
          </div>
          <button className="aureak-refresh-btn" style={S.refreshBtn} onClick={load}>
            ↺ Actualiser
          </button>
        </div>
      </div>

      {/* ── Global KPI Strip ── */}
      <div style={S.kpiStrip}>
        <KpiCard
          label="Joueurs actifs"
          value={childrenTotal ?? '—'}
          accent={colors.accent.gold}
        />
        <KpiCard
          label="Coachs"
          value={coachesTotal ?? '—'}
          accent={colors.status.present}
        />
        <KpiCard
          label="Séances"
          value={totalSessions > 0 ? `${closedSessions} / ${totalSessions}` : '—'}
          sub="clôturées / total"
          accent={colors.text.primary}
        />
        <KpiCard
          label="Taux de présence"
          value={avgAttendance !== null ? `${avgAttendance}%` : '—'}
          sub="moyenne globale"
          accent={rateColor(avgAttendance)}
        />
        <KpiCard
          label="Taux de maîtrise"
          value={avgMastery !== null ? `${avgMastery}%` : '—'}
          sub="moyenne globale"
          accent={rateColor(avgMastery)}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div style={S.qaBar}>
        <span style={S.qaBarLabel}>Actions rapides</span>
        <div style={S.qaRow}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.href}
              style={action.primary ? S.qaBtnPrimary : S.qaBtnSecondary}
              onClick={() => router.push(action.href as never)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Anomaly Panel ── */}
      {anomalies.length > 0 && (
        <div style={{
          ...S.anomalyPanel,
          borderLeft: `3px solid ${criticalCount > 0 ? colors.status.absent : colors.status.attention}`,
        }}>
          {/* Panel header */}
          <div style={S.anomalyPanelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{criticalCount > 0 ? '🚨' : '⚠️'}</span>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: criticalCount > 0 ? colors.status.absent : colors.status.attention,
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: 0.3,
              }}>
                {anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''} non résolue{anomalies.length > 1 ? 's' : ''}
              </span>
              {criticalCount > 0 && (
                <span style={{ fontSize: 11, color: colors.text.secondary }}>
                  dont {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Anomaly rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedAnomalies.map(a => (
              <div key={a.id} style={S.anomalyRow}>
                {/* Severity dot */}
                <div style={{
                  width: 7, height: 7, borderRadius: 4,
                  backgroundColor: SEV_COLOR[a.severity] ?? colors.text.secondary,
                  flexShrink: 0,
                }} />

                {/* Type */}
                <div style={{ flex: 1, fontSize: 13, color: colors.text.primary }}>
                  {anomalyLabel(a.anomalyType)}
                </div>

                {/* Severity badge */}
                <span style={{
                  fontSize     : 10,
                  fontWeight   : 600,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  padding      : '2px 8px',
                  borderRadius : 4,
                  backgroundColor: colors.background.primary,
                  color        : SEV_COLOR[a.severity] ?? colors.text.secondary,
                }}>
                  {SEV_LABEL[a.severity] ?? a.severity}
                </span>

                {/* Resolve button */}
                <button
                  className="aureak-resolve-btn"
                  style={{
                    ...S.resolveBtn,
                    opacity: resolving === a.id ? 0.5 : 1,
                    cursor : resolving === a.id ? 'wait' : 'pointer',
                  }}
                  onClick={() => handleResolve(a.id)}
                  disabled={resolving === a.id}
                >
                  {resolving === a.id ? '...' : 'Résoudre'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Implantations Section ── */}
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>Implantations</h2>
        <span style={S.sectionCount}>
          {stats.length} site{stats.length !== 1 ? 's' : ''}
        </span>
      </div>

      {stats.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, fontFamily: 'Rajdhani, sans-serif' }}>
            Aucune donnée disponible
          </div>
          <div style={{ fontSize: 13, color: colors.text.secondary, maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
            Ajustez la période de filtrage ou vérifiez que des séances ont été enregistrées.
          </div>
        </div>
      ) : (
        <div style={S.implantGrid}>
          {stats.map(s => (
            <ImplantationCard key={s.implantation_id} stat={s} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container       : {
    padding        : '28px 32px',
    backgroundColor: colors.background.primary,
    minHeight      : '100vh',
    color          : colors.text.primary,
    fontFamily     : 'Geist, system-ui, sans-serif',
    boxSizing      : 'border-box',
  },

  // Header
  pageHeader      : {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'flex-end',
    marginBottom   : 24,
    flexWrap       : 'wrap',
    gap            : 16,
  },
  pageTitle       : {
    fontSize       : 26,
    fontWeight     : 700,
    fontFamily     : 'Rajdhani, sans-serif',
    letterSpacing  : 0.4,
    margin         : 0,
    color          : colors.text.primary,
    lineHeight     : 1.1,
  },
  pageSubtitle    : {
    fontSize       : 12,
    color          : colors.text.secondary,
    marginTop      : 4,
    letterSpacing  : 0.3,
  },
  filterRow       : {
    display        : 'flex',
    alignItems     : 'flex-end',
    gap            : 8,
    flexWrap       : 'wrap',
  },
  dateGroup       : {
    display        : 'flex',
    flexDirection  : 'column',
    gap            : 5,
  },
  dateLabel       : {
    fontSize       : 10,
    fontWeight     : 600,
    letterSpacing  : 1,
    textTransform  : 'uppercase',
    color          : colors.text.secondary,
  },
  dateInput       : {
    padding        : '7px 11px',
    borderRadius   : 7,
    border         : `1px solid ${colors.accent.zinc}`,
    backgroundColor: colors.background.surface,
    color          : colors.text.primary,
    fontSize       : 13,
    outline        : 'none',
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
  },
  refreshBtn      : {
    padding        : '7px 16px',
    borderRadius   : 7,
    border         : `1px solid ${colors.accent.zinc}`,
    backgroundColor: 'transparent',
    color          : colors.text.secondary,
    fontSize       : 13,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    transition     : 'all 0.15s',
    whiteSpace     : 'nowrap',
  },

  // KPI Strip
  kpiStrip        : {
    display               : 'grid',
    gridTemplateColumns   : 'repeat(5, 1fr)',
    gap                   : 12,
    marginBottom          : 24,
  },
  kpiCard         : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : '16px 18px',
    border         : `1px solid ${colors.accent.zinc}`,
    display        : 'flex',
    flexDirection  : 'column',
    gap            : 0,
  },
  kpiLabel        : {
    fontSize       : 10,
    fontWeight     : 600,
    letterSpacing  : 1.1,
    textTransform  : 'uppercase',
    color          : colors.text.secondary,
    marginBottom   : 8,
  },
  kpiValue        : {
    fontSize       : 28,
    fontWeight     : 700,
    fontFamily     : 'Rajdhani, sans-serif',
    lineHeight     : 1,
    letterSpacing  : 0.5,
  },
  kpiSub          : {
    fontSize       : 11,
    color          : colors.text.secondary,
    marginTop      : 5,
    lineHeight     : 1.3,
  },

  // Anomaly Panel
  anomalyPanel    : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : '14px 18px',
    border         : `1px solid ${colors.accent.zinc}`,
    marginBottom   : 24,
  },
  anomalyPanelHeader: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    marginBottom   : 10,
  },
  anomalyRow      : {
    display        : 'flex',
    alignItems     : 'center',
    gap            : 10,
    padding        : '8px 10px',
    borderRadius   : 6,
    backgroundColor: colors.background.elevated,
  },
  resolveBtn      : {
    padding        : '4px 12px',
    borderRadius   : 5,
    border         : 'none',
    backgroundColor: colors.status.present,
    color          : colors.text.dark,
    fontSize       : 12,
    fontWeight     : 600,
    fontFamily     : 'Geist, sans-serif',
    flexShrink     : 0,
    transition     : 'opacity 0.15s',
  },

  // Section header
  sectionHeader   : {
    display        : 'flex',
    alignItems     : 'center',
    gap            : 10,
    marginBottom   : 14,
  },
  sectionTitle    : {
    fontSize       : 11,
    fontWeight     : 700,
    fontFamily     : 'Geist, sans-serif',
    letterSpacing  : 1.5,
    textTransform  : 'uppercase',
    margin         : 0,
    color          : colors.accent.gold,
  },
  sectionCount    : {
    fontSize       : 11,
    color          : colors.text.secondary,
    paddingTop     : 1,
  },

  // Implantation grid
  implantGrid     : {
    display               : 'grid',
    gridTemplateColumns   : 'repeat(auto-fill, minmax(280px, 1fr))',
    gap                   : 16,
  },
  implantCard     : {
    backgroundColor: colors.background.surface,
    borderRadius   : 12,
    padding        : '20px',
    border         : `1px solid ${colors.accent.zinc}`,
    transition     : 'transform 0.15s',
  },
  implantName     : {
    fontSize       : 16,
    fontWeight     : 700,
    fontFamily     : 'Rajdhani, sans-serif',
    letterSpacing  : 0.3,
    color          : colors.text.primary,
    marginBottom   : 14,
  },
  progressTrack   : {
    height         : 4,
    backgroundColor: colors.background.elevated,
    borderRadius   : 2,
    overflow       : 'hidden',
  },
  progressFill    : {
    height         : 4,
    borderRadius   : 2,
    transition     : 'width 0.6s ease',
  },
  implantFooter   : {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    paddingTop     : 12,
    marginTop      : 4,
    borderTop      : `1px solid ${colors.accent.zinc}`,
  },
  implantSeances  : {
    fontSize       : 13,
    fontWeight     : 700,
    fontFamily     : 'Geist Mono, monospace',
    color          : colors.text.primary,
  },

  // Quick actions
  qaBar           : {
    display        : 'flex',
    alignItems     : 'center',
    gap            : 16,
    marginBottom   : 24,
    padding        : '12px 16px',
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    border         : `1px solid ${colors.accent.zinc}`,
    flexWrap       : 'wrap',
  },
  qaBarLabel      : {
    fontSize       : 10,
    fontWeight     : 700,
    letterSpacing  : 1.2,
    textTransform  : 'uppercase',
    color          : colors.text.secondary,
    whiteSpace     : 'nowrap',
  },
  qaRow           : {
    display        : 'flex',
    gap            : 8,
    flexWrap       : 'wrap',
    flex           : 1,
  },
  qaBtnPrimary    : {
    padding        : '6px 14px',
    borderRadius   : 6,
    border         : 'none',
    backgroundColor: colors.accent.gold,
    color          : colors.text.dark,
    fontSize       : 12,
    fontWeight     : 700,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    whiteSpace     : 'nowrap',
    transition     : 'opacity 0.15s',
  },
  qaBtnSecondary  : {
    padding        : '6px 14px',
    borderRadius   : 6,
    border         : `1px solid ${colors.accent.zinc}`,
    backgroundColor: 'transparent',
    color          : colors.text.secondary,
    fontSize       : 12,
    fontWeight     : 600,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    whiteSpace     : 'nowrap',
    transition     : 'all 0.15s',
  },

  // Empty state
  emptyState      : {
    backgroundColor: colors.background.surface,
    borderRadius   : 12,
    padding        : '48px 24px',
    textAlign      : 'center',
    border         : `1px solid ${colors.accent.zinc}`,
    display        : 'flex',
    flexDirection  : 'column',
    alignItems     : 'center',
  },
}
