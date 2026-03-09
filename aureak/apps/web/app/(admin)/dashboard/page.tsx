'use client'
// Admin Dashboard — vue de contrôle multi-implantations (Light Premium DA)
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  getImplantationStats, listAnomalies, resolveAnomaly, listImplantations, supabase,
} from '@aureak/api-client'
import type { ImplantationStats, AnomalyEvent } from '@aureak/api-client'
import { colors, shadows, radius, transitions } from '@aureak/theme'

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
  if (pct === null || pct === undefined) return colors.text.muted
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
        @keyframes a-pulse{0%,100%{opacity:.12}50%{opacity:.25}}
        .a-skel{background:${colors.border.divider};animation:a-pulse 1.8s ease-in-out infinite}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        {[0,1,2,3,4,5].map(i => <SkeletonBlock key={i} h={92} r={radius.card} />)}
      </div>

      {/* Implantation cards skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <SkeletonBlock h={16} w="140px" r={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[0,1,2].map(i => <SkeletonBlock key={i} h={188} r={radius.card} />)}
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
  borderAccent?: string
}

function KpiCard({ label, value, sub, accent, borderAccent }: KpiCardProps) {
  return (
    <div style={{ ...S.kpiCard, borderTop: `3px solid ${borderAccent ?? accent}` }}>
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
        <span style={{ fontSize: 11, color: colors.text.muted }}>{label}</span>
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
    <div className="aureak-card" style={{ ...S.implantCard, borderTop: `3px solid ${attendanceColor}` }}>
      <div style={S.implantName}>{stat.implantation_name}</div>

      <ProgressBar pct={stat.attendance_rate_pct} label="Présence" />
      <ProgressBar pct={stat.mastery_rate_pct} label="Maîtrise" />

      <div style={S.implantFooter}>
        <span style={{ fontSize: 11, color: colors.text.muted }}>Séances clôturées</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={S.implantSeances}>{seancesRatio}</span>
          {seancesPct !== null && (
            <span style={{ fontSize: 10, color: colors.text.muted }}>({seancesPct}%)</span>
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

  // ── Stats & anomalies ──
  const [stats,         setStats]         = useState<ImplantationStats[]>([])
  const [anomalies,     setAnomalies]     = useState<AnomalyEvent[]>([])
  const [loading,       setLoading]       = useState(true)
  const [resolving,     setResolving]     = useState<string | null>(null)

  // ── Implantation selector ──
  const [implantations,          setImplantations]          = useState<{ id: string; name: string }[]>([])
  const [selectedImplantationId, setSelectedImplantationId] = useState<string | null>(null)

  // ── KPI counts (vary with implantation selection) ──
  const [childrenTotal, setChildrenTotal] = useState<number | null>(null)
  const [coachesTotal,  setCoachesTotal]  = useState<number | null>(null)
  const [groupsTotal,   setGroupsTotal]   = useState<number | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(false)

  // ── Date range ──
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  // ── Load stats + implantations list ──
  const load = async () => {
    setLoading(true)
    const [statsResult, anomalyResult, implRes] = await Promise.all([
      getImplantationStats(new Date(from).toISOString(), new Date(to).toISOString()),
      listAnomalies(),
      listImplantations(),
    ])
    setStats(statsResult.data ?? [])
    setAnomalies(anomalyResult.data)
    setImplantations((implRes.data ?? []).map(i => ({ id: i.id, name: i.name })))
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  // ── Load KPI counts filtered by implantation ──
  useEffect(() => {
    setLoadingCounts(true)

    if (!selectedImplantationId) {
      // Global counts
      Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true })
          .eq('user_role', 'child').is('deleted_at', null),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true })
          .eq('user_role', 'coach').is('deleted_at', null),
        supabase.from('groups').select('id', { count: 'exact', head: true })
          .is('deleted_at', null),
      ]).then(([childRes, coachRes, groupRes]) => {
        setChildrenTotal(childRes.count ?? 0)
        setCoachesTotal(coachRes.count ?? 0)
        setGroupsTotal(groupRes.count ?? 0)
        setLoadingCounts(false)
      })
    } else {
      // Filtered counts for the selected implantation
      const fetchFiltered = async () => {
        // Joueurs: distinct children in groups of this implantation
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id')
          .eq('implantation_id', selectedImplantationId)
          .is('deleted_at', null)

        const groupIds = (groupsData ?? []).map((g: Record<string, string>) => g.id)

        const [childData, coachData, groupCountRes] = await Promise.all([
          groupIds.length > 0
            ? supabase.from('group_members').select('child_id').in('group_id', groupIds)
            : Promise.resolve({ data: [] }),
          supabase.from('coach_implantation_assignments')
            .select('coach_id', { count: 'exact', head: true })
            .eq('implantation_id', selectedImplantationId)
            .is('unassigned_at', null),
          Promise.resolve({ count: groupIds.length }),
        ])

        const distinctChildren = new Set(
          ((childData as { data: { child_id: string }[] | null }).data ?? []).map(m => m.child_id)
        )
        setChildrenTotal(distinctChildren.size)
        setCoachesTotal((coachData as { count: number | null }).count ?? 0)
        setGroupsTotal(groupCountRes.count ?? 0)
        setLoadingCounts(false)
      }

      fetchFiltered()
    }
  }, [selectedImplantationId])

  const handleResolve = async (id: string) => {
    setResolving(id)
    await resolveAnomaly(id)
    setResolving(null)
    await load()
  }

  if (loading) return <DashboardSkeleton />

  // ── Derived: filter stats to selected implantation ──
  const visibleStats = selectedImplantationId
    ? stats.filter(s => s.implantation_id === selectedImplantationId)
    : stats

  const selectedName = selectedImplantationId
    ? implantations.find(i => i.id === selectedImplantationId)?.name ?? '—'
    : null

  // ── Computed KPIs from visibleStats ──
  const totalSessions  = visibleStats.reduce((s, i) => s + (i.sessions_total  ?? 0), 0)
  const closedSessions = visibleStats.reduce((s, i) => s + (i.sessions_closed ?? 0), 0)
  const avgAttendance  = visibleStats.length
    ? Math.round(visibleStats.reduce((s, i) => s + (i.attendance_rate_pct ?? 0), 0) / visibleStats.length)
    : null
  const avgMastery     = visibleStats.length
    ? Math.round(visibleStats.reduce((s, i) => s + (i.mastery_rate_pct ?? 0), 0) / visibleStats.length)
    : null

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length
  const sortedAnomalies = [...anomalies].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
  )

  const countVal = (n: number | null) =>
    loadingCounts ? '…' : n !== null ? n : '—'

  return (
    <div style={S.container}>
      <style>{`
        .aureak-resolve-btn:hover { opacity: 0.85; }
        .aureak-refresh-btn:hover { border-color: ${colors.accent.gold}; color: ${colors.accent.gold}; }
        .aureak-card:hover { box-shadow: ${shadows.md}; transform: translateY(-2px); }
        .aureak-qa-btn:hover { transform: translateY(-1px); box-shadow: ${shadows.sm}; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Tableau de bord</h1>
          <div style={S.pageSubtitle}>
            {selectedName
              ? <>Vue filtrée · <span style={{ color: colors.accent.gold, fontWeight: 600 }}>{selectedName}</span></>
              : `Vue globale · ${stats.length} implantation${stats.length !== 1 ? 's' : ''}`
            }
          </div>
        </div>

        <div style={S.filterRow}>
          {/* ── Implantation selector ── */}
          <div style={S.dateGroup}>
            <label style={S.dateLabel}>Implantation</label>
            <select
              value={selectedImplantationId ?? ''}
              onChange={e => setSelectedImplantationId(e.target.value || null)}
              style={S.implantSelect}
            >
              <option value="">Toutes les implantations</option>
              {implantations.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div style={{ ...S.dateGroup, marginLeft: 8 }}>
            <label style={S.dateLabel}>Du</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={S.dateInput}
            />
          </div>
          <span style={{ color: colors.text.muted, fontSize: 13, paddingTop: 16 }}>→</span>
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
          value={countVal(childrenTotal)}
          sub={selectedName ? `dans ${selectedName}` : undefined}
          accent={colors.accent.gold}
        />
        <KpiCard
          label="Coachs"
          value={countVal(coachesTotal)}
          sub={selectedName ? `assignés` : undefined}
          accent={colors.accent.gold}
        />
        <KpiCard
          label="Groupes"
          value={countVal(groupsTotal)}
          sub={selectedName ? `dans ${selectedName}` : undefined}
          accent={colors.accent.gold}
        />
        <KpiCard
          label="Séances"
          value={totalSessions > 0 ? `${closedSessions} / ${totalSessions}` : '—'}
          sub="clôturées / total"
          accent={colors.accent.gold}
        />
        <KpiCard
          label="Taux de présence"
          value={avgAttendance !== null ? `${avgAttendance}%` : '—'}
          sub={selectedName ? 'implantation' : 'moyenne globale'}
          accent={rateColor(avgAttendance)}
          borderAccent={colors.accent.gold}
        />
        <KpiCard
          label="Taux de maîtrise"
          value={avgMastery !== null ? `${avgMastery}%` : '—'}
          sub={selectedName ? 'implantation' : 'moyenne globale'}
          accent={rateColor(avgMastery)}
          borderAccent={colors.accent.gold}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div style={S.qaBar}>
        <span style={S.qaBarLabel}>Actions rapides</span>
        <div style={S.qaRow}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.href}
              className="aureak-qa-btn"
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
                <span style={{ fontSize: 11, color: colors.text.muted }}>
                  dont {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {selectedName && (
              <span style={{ fontSize: 11, color: colors.text.muted, fontStyle: 'italic' }}>
                Anomalies non filtrables par implantation
              </span>
            )}
          </div>

          {/* Anomaly rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedAnomalies.map(a => (
              <div key={a.id} style={S.anomalyRow}>
                {/* Severity dot */}
                <div style={{
                  width: 7, height: 7, borderRadius: 4,
                  backgroundColor: SEV_COLOR[a.severity] ?? colors.text.muted,
                  flexShrink: 0,
                }} />

                {/* Type */}
                <div style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>
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
                  backgroundColor: colors.light.muted,
                  color        : SEV_COLOR[a.severity] ?? colors.text.muted,
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
        <h2 style={S.sectionTitle}>
          {selectedName ? `Implantation : ${selectedName}` : 'Implantations'}
        </h2>
        <span style={S.sectionCount}>
          {selectedName ? '1 site' : `${visibleStats.length} site${visibleStats.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {visibleStats.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, fontFamily: 'Rajdhani, sans-serif', color: colors.text.dark }}>
            Aucune donnée disponible
          </div>
          <div style={{ fontSize: 13, color: colors.text.muted, maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
            {selectedName
              ? `Aucune séance enregistrée pour ${selectedName} sur cette période.`
              : 'Ajustez la période de filtrage ou vérifiez que des séances ont été enregistrées.'
            }
          </div>
        </div>
      ) : (
        <div style={S.implantGrid}>
          {visibleStats.map(s => (
            <ImplantationCard key={s.implantation_id} stat={s} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Styles (Light Premium DA) ─────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container       : {
    padding        : '28px 32px',
    backgroundColor: colors.light.primary,
    minHeight      : '100vh',
    color          : colors.text.dark,
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
    fontWeight     : 900,
    fontFamily     : 'Rajdhani, sans-serif',
    letterSpacing  : 0.4,
    margin         : 0,
    color          : colors.accent.gold,
    lineHeight     : 1.1,
  },
  pageSubtitle    : {
    fontSize       : 12,
    color          : colors.text.muted,
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
    color          : colors.text.muted,
  },
  dateInput       : {
    padding        : '7px 11px',
    borderRadius   : radius.xs,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    color          : colors.text.dark,
    fontSize       : 13,
    outline        : 'none',
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    transition     : `border-color ${transitions.fast}`,
  },
  implantSelect   : {
    padding        : '7px 32px 7px 11px',
    borderRadius   : radius.xs,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    color          : colors.text.dark,
    fontSize       : 13,
    outline        : 'none',
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    minWidth       : 210,
    appearance     : 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2371717A' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat  : 'no-repeat',
    backgroundPosition: 'right 10px center',
    transition     : `border-color ${transitions.fast}`,
  },
  refreshBtn      : {
    padding        : '7px 16px',
    borderRadius   : radius.xs,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    color          : colors.text.muted,
    fontSize       : 13,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    transition     : `all ${transitions.fast}`,
    whiteSpace     : 'nowrap',
  },

  // KPI Strip
  kpiStrip        : {
    display               : 'grid',
    gridTemplateColumns   : 'repeat(6, 1fr)',
    gap                   : 12,
    marginBottom          : 24,
  },
  kpiCard         : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : '16px 18px',
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
    display        : 'flex',
    flexDirection  : 'column',
    gap            : 0,
    transition     : `box-shadow ${transitions.normal}`,
  },
  kpiLabel        : {
    fontSize       : 10,
    fontWeight     : 600,
    letterSpacing  : 1.1,
    textTransform  : 'uppercase',
    color          : colors.text.muted,
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
    color          : colors.text.muted,
    marginTop      : 5,
    lineHeight     : 1.3,
  },

  // Anomaly Panel
  anomalyPanel    : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : '14px 18px',
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
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
    borderRadius   : radius.xs,
    backgroundColor: colors.light.muted,
  },
  resolveBtn      : {
    padding        : '4px 12px',
    borderRadius   : 5,
    border         : 'none',
    backgroundColor: colors.status.present,
    color          : '#FFFFFF',
    fontSize       : 12,
    fontWeight     : 600,
    fontFamily     : 'Geist, sans-serif',
    flexShrink     : 0,
    transition     : `opacity ${transitions.fast}`,
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
    color          : colors.text.muted,
    paddingTop     : 1,
  },

  // Implantation grid
  implantGrid     : {
    display               : 'grid',
    gridTemplateColumns   : 'repeat(auto-fill, minmax(280px, 1fr))',
    gap                   : 16,
  },
  implantCard     : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : '20px',
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
    transition     : `all ${transitions.normal}`,
    cursor         : 'default',
  },
  implantName     : {
    fontSize       : 16,
    fontWeight     : 700,
    fontFamily     : 'Rajdhani, sans-serif',
    letterSpacing  : 0.3,
    color          : colors.text.dark,
    marginBottom   : 14,
  },
  progressTrack   : {
    height         : 4,
    backgroundColor: colors.border.divider,
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
    borderTop      : `1px solid ${colors.border.divider}`,
  },
  implantSeances  : {
    fontSize       : 13,
    fontWeight     : 700,
    fontFamily     : 'Geist Mono, monospace',
    color          : colors.text.dark,
  },

  // Quick actions
  qaBar           : {
    display        : 'flex',
    alignItems     : 'center',
    gap            : 16,
    marginBottom   : 24,
    padding        : '12px 16px',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
    flexWrap       : 'wrap',
  },
  qaBarLabel      : {
    fontSize       : 10,
    fontWeight     : 700,
    letterSpacing  : 1.2,
    textTransform  : 'uppercase',
    color          : colors.text.muted,
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
    borderRadius   : radius.button,
    border         : 'none',
    backgroundColor: colors.accent.gold,
    color          : colors.text.dark,
    fontSize       : 12,
    fontWeight     : 700,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    whiteSpace     : 'nowrap',
    transition     : `all ${transitions.fast}`,
  },
  qaBtnSecondary  : {
    padding        : '6px 14px',
    borderRadius   : radius.button,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    color          : colors.text.muted,
    fontSize       : 12,
    fontWeight     : 600,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    whiteSpace     : 'nowrap',
    transition     : `all ${transitions.fast}`,
  },

  // Empty state
  emptyState      : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : '48px 24px',
    textAlign      : 'center',
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
    display        : 'flex',
    flexDirection  : 'column',
    alignItems     : 'center',
  },
}
