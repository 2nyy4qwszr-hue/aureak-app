'use client'
// Admin Dashboard — vue de contrôle multi-implantations (Light Premium DA)
// Story 49-5 — Design : Dashboard Admin — Game Manager Premium
// Story 50-1 — Hero Band salle de commandement
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  getImplantationStats, listAnomalies, resolveAnomaly, listImplantations, getDashboardKpiCounts,
  listNextSessionForDashboard,
} from '@aureak/api-client'
import type { ImplantationStats, AnomalyEvent, UpcomingSessionRow } from '@aureak/api-client'
import { colors, shadows, radius, transitions } from '@aureak/theme'

// ── Constantes locales terrain (pas de token pour ces valeurs spécifiques) ─────

const HERO_BG          = '#2A2827'
const TERRAIN_GRADIENT = 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 60%, #1a472a 100%)'

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
        .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .bento-large  { grid-column: span 2; }
        .bento-medium { grid-column: span 1; }
        .bento-small  { grid-column: span 1; }
        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-large { grid-column: span 1; }
        }
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-large { grid-column: span 1; }
        }
      `}</style>

      {/* Hero band skeleton */}
      <SkeletonBlock h={160} r={radius.card} />
      <div style={{ height: 20 }} />

      {/* Filters skeleton */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <SkeletonBlock h={34} w="300px" r={8} />
      </div>

      {/* Bento KPI skeleton — 3 cols desktop */}
      <div className="bento-grid">
        {/* Large card — span 2 */}
        <div className="bento-large">
          <SkeletonBlock h={160} r={radius.card} />
        </div>
        {/* Medium card — span 1 */}
        <div className="bento-medium">
          <SkeletonBlock h={160} r={radius.card} />
        </div>
        {/* Medium card — span 1 */}
        <div className="bento-medium">
          <SkeletonBlock h={160} r={radius.card} />
        </div>
        {/* Large card — span 2 */}
        <div className="bento-large">
          <SkeletonBlock h={130} r={radius.card} />
        </div>
        {/* Small card */}
        <div className="bento-small">
          <SkeletonBlock h={130} r={radius.card} />
        </div>
        {/* Small card */}
        <div className="bento-small">
          <SkeletonBlock h={130} r={radius.card} />
        </div>
        {/* Small card */}
        <div className="bento-small">
          <SkeletonBlock h={130} r={radius.card} />
        </div>
        {/* Small card */}
        <div className="bento-small">
          <SkeletonBlock h={130} r={radius.card} />
        </div>
      </div>

      {/* Next session tile skeleton */}
      <SkeletonBlock h={72} r={radius.card} />
      <div style={{ height: 20 }} />

      {/* Implantation cards skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8 }}>
        <SkeletonBlock h={16} w="140px" r={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[0,1,2].map(i => <SkeletonBlock key={i} h={260} r={radius.card} />)}
      </div>
    </div>
  )
}

// ── Hero Band ─────────────────────────────────────────────────────────────────

function HeroBand({ implantationCount }: { implantationCount: number }) {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const dateLabel = currentTime.toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeLabel = currentTime.toLocaleTimeString('fr-BE', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="hero-band"
      style={{
        position       : 'relative',
        height         : 160,
        backgroundColor: HERO_BG,
        borderTop      : `3px solid ${colors.accent.gold}`,
        borderRadius   : radius.card,
        overflow       : 'hidden',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'space-between',
        paddingLeft    : 32,
        paddingRight   : 32,
        marginBottom   : 24,
        boxShadow      : shadows.lg,
      }}
    >
      {/* Texture terrain SVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="terrain-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#terrain-grid)" />
        {/* Cercle central */}
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="white" strokeWidth="0.8" />
      </svg>

      {/* Logo gauche */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily   : 'Montserrat, sans-serif',
          fontWeight   : '900',
          fontSize     : 28,
          color        : colors.accent.gold,
          letterSpacing: 3,
          lineHeight   : 1.1,
        }}>
          AUREAK
        </div>
        <div style={{
          fontFamily   : 'Montserrat, sans-serif',
          fontWeight   : '400',
          fontSize     : 13,
          color        : colors.accent.goldLight,
          letterSpacing: 2,
          marginTop    : 4,
          textTransform: 'uppercase',
        }}>
          Académie des Gardiens
        </div>
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize  : 12,
          color     : colors.text.muted,
          marginTop : 8,
        }}>
          {implantationCount} implantation{implantationCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Date & heure droite */}
      <div className="hero-date" style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
        <div style={{
          fontFamily: 'Geist Mono, monospace',
          fontWeight: '600',
          fontSize  : 22,
          color     : colors.accent.gold,
          lineHeight: 1,
        }}>
          {timeLabel}
        </div>
        <div style={{
          fontFamily   : 'Montserrat, sans-serif',
          fontWeight   : '600',
          fontSize     : 15,
          color        : colors.accent.ivory,
          marginTop    : 8,
          letterSpacing: 0.3,
        }}>
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        </div>
      </div>
    </div>
  )
}

// ── Sparkline SVG (AC1, AC5, AC6, AC7) ───────────────────────────────────────
// SVG natif — aucune dépendance externe (polyline + circle uniquement)

function SparklineSVG({ values, color, height = 36 }: { values: number[]; color: string; height?: number }) {
  if (!values || values.length < 2) return null

  const W   = 100  // viewBox width (percentage-based via preserveAspectRatio)
  const pad = 4

  const safeValues = values.map(v => (isNaN(v) || !isFinite(v) ? 0 : v))
  const min   = Math.min(...safeValues)
  const max   = Math.max(...safeValues)
  const range = max - min || 1

  const pts = safeValues.map((v, i) => ({
    x: pad + (i / (safeValues.length - 1)) * (W - pad * 2),
    y: (height - pad) - ((v - min) / range) * (height - pad * 2),
  }))

  const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ')
  const last = pts[pts.length - 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block', marginTop: 8 }}
      aria-hidden="true"
    >
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      {/* Marqueur dernier point — AC5 */}
      <circle cx={last.x} cy={last.y} r={3} fill={color} />
    </svg>
  )
}

// ── Delta Pill (AC3) — calcule le delta depuis les données sparkline ───────────

function DeltaPill({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null

  const first = data[0]
  const last  = data[data.length - 1]
  const delta = (first === 0 || isNaN(first)) ? 0 : ((last - first) / Math.abs(first)) * 100
  const abs   = Math.abs(delta)

  if (abs < 0.1) {
    return (
      <span style={{
        display   : 'inline-flex',
        alignItems: 'center',
        fontSize  : 10,
        color     : colors.text.muted,
        fontFamily: 'Geist Mono, monospace',
        marginTop : 4,
      }}>
        — stable
      </span>
    )
  }

  const positive = delta > 0
  const symbol   = positive ? '▲' : '▼'
  const sign     = positive ? '+' : ''

  return (
    <span style={{
      display        : 'inline-flex',
      alignItems     : 'center',
      gap            : 2,
      backgroundColor: positive ? 'rgba(76,175,80,0.10)' : 'rgba(244,67,54,0.10)',
      color          : positive ? colors.status.present : colors.status.absent,
      borderRadius   : radius.badge,
      paddingLeft    : 6,
      paddingRight   : 6,
      paddingTop     : 2,
      paddingBottom  : 2,
      fontSize       : 10,
      fontWeight     : 700,
      fontFamily     : 'Geist Mono, monospace',
      marginTop      : 4,
      whiteSpace     : 'nowrap',
    }}>
      {symbol}{sign}{abs.toFixed(1)}%
    </span>
  )
}

// ── Bento KPI Card ───────────────────────────────────────────────────────────

type BentoSize = 'large' | 'medium' | 'small'

type KpiCardProps = {
  label       : string
  value       : string | number
  sub        ?: string
  accent      : string
  borderAccent?: string
  /** sparkline: 6 valeurs pour mini-graphique tendance (AC4) */
  sparkline   ?: number[]
  size        ?: BentoSize
  icon        ?: string
  /** Overrides de style pour la card elle-même (ex: gradient de fond) */
  cardStyle   ?: React.CSSProperties
  /** Overrides de couleur pour la valeur (ex: texte blanc sur fond sombre) */
  valueColor  ?: string
  /** Overrides de couleur pour le label */
  labelColor  ?: string
  /** Overrides de couleur pour le sous-texte */
  subColor    ?: string
}

function KpiCard({ label, value, sub, accent, borderAccent, sparkline, size = 'medium', icon, cardStyle, valueColor, labelColor, subColor }: KpiCardProps) {
  const valueFontSize = size === 'large' ? 52 : size === 'medium' ? 38 : 28

  return (
    <div
      className="aureak-card"
      style={{
        ...S.kpiCard,
        borderTop: `3px solid ${borderAccent ?? accent}`,
        ...(size === 'large' && S.kpiCardLarge),
        ...cardStyle,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icône en haut à droite */}
      {icon && (
        <div style={{
          position  : 'absolute',
          top       : size === 'large' ? 24 : 16,
          right     : size === 'large' ? 28 : 20,
          fontSize  : 28,
          opacity   : 0.7,
          lineHeight: 1,
          userSelect: 'none',
        } as React.CSSProperties}>
          {icon}
        </div>
      )}

      <div style={S.kpiCardTop}>
        <div style={{ ...S.kpiLabel, color: labelColor ?? (S.kpiLabel as React.CSSProperties).color }}>
          {label}
        </div>
      </div>
      <div style={{ ...S.kpiValue, color: valueColor ?? accent, fontSize: valueFontSize }}>{value}</div>
      {sub && <div style={{ ...S.kpiSub, color: subColor ?? (S.kpiSub as React.CSSProperties).color }}>{sub}</div>}

      {/* Sparkline + DeltaPill dérivée — AC4: si sparkline fourni, afficher les deux */}
      {sparkline && sparkline.length >= 2 && (
        <>
          <SparklineSVG values={sparkline} color={accent} />
          <DeltaPill data={sparkline} />
        </>
      )}
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

// ── Implantation Card Header ──────────────────────────────────────────────────

function ImplantationCardHeader({ stat }: { stat: ImplantationStats }) {
  return (
    <div style={{
      borderRadius    : `${radius.card}px ${radius.card}px 0 0`,
      height          : 72,
      position        : 'relative',
      overflow        : 'hidden',
      marginBottom    : 0,
      backgroundImage : `
        ${TERRAIN_GRADIENT},
        repeating-linear-gradient(
          45deg,
          rgba(255,255,255,0.03) 0px,
          rgba(255,255,255,0.03) 1px,
          transparent 1px,
          transparent 8px
        )
      `,
    }}>
      {/* Nom implantation en bas à gauche */}
      <div style={{
        position     : 'absolute',
        bottom       : 10,
        left         : 14,
        fontSize     : 15,
        fontWeight   : 700,
        fontFamily   : 'Montserrat, sans-serif',
        color        : colors.text.primary,
        lineHeight   : 1.2,
        letterSpacing: 0.2,
      }}>
        {stat.implantation_name}
      </div>

      {/* Badge OR sessions en haut à droite */}
      <div style={{
        position       : 'absolute',
        top            : 10,
        right          : 12,
        backgroundColor: colors.accent.gold,
        color          : colors.text.dark,
        fontSize       : 10,
        fontWeight     : 600,
        fontFamily     : 'Montserrat, sans-serif',
        padding        : '3px 8px',
        borderRadius   : radius.badge,
        whiteSpace     : 'nowrap',
      }}>
        {stat.sessions_total} séance{stat.sessions_total !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// ── Implantation Card ─────────────────────────────────────────────────────────

function ImplantationCard({ stat }: { stat: ImplantationStats }) {
  const seancesRatio = stat.sessions_total > 0
    ? `${stat.sessions_closed}/${stat.sessions_total}`
    : '—'
  const seancesPct   = stat.sessions_total > 0
    ? Math.round((stat.sessions_closed / stat.sessions_total) * 100)
    : null

  return (
    <div className="aureak-card" style={{
      ...S.implantCard,
      padding : 0,
      overflow: 'hidden',
    }}>
      {/* Header terrain */}
      <ImplantationCardHeader stat={stat} />

      {/* Corps avec padding */}
      <div style={{ padding: '16px 16px 16px 16px' }}>
        <ProgressBar pct={stat.attendance_rate_pct} label="Présence" />
        <ProgressBar pct={stat.mastery_rate_pct}    label="Maîtrise" />

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
    </div>
  )
}

// ── Next Session Tile ─────────────────────────────────────────────────────────

function NextSessionTile({
  pendingSessions,
  onNavigate,
}: {
  pendingSessions: number
  onNavigate: () => void
}) {
  if (pendingSessions === 0) return null

  return (
    <div className="aureak-card" style={{
      ...S.kpiCard,
      borderTop    : `3px solid ${colors.accent.gold}`,
      flexDirection: 'row',
      alignItems   : 'center',
      gap          : 16,
      padding      : '14px 20px',
      marginBottom : 20,
    }}>
      <span style={{ fontSize: 22 }}>⏱</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize     : 10,
          fontWeight   : 700,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color        : colors.text.muted,
          marginBottom : 4,
          fontFamily   : 'Montserrat, sans-serif',
        }}>
          Séances en attente de clôture
        </div>
        <div style={{
          fontSize  : 18,
          fontWeight: 700,
          color     : colors.text.dark,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {pendingSessions} séance{pendingSessions > 1 ? 's' : ''} ouvertes
        </div>
      </div>
      <span style={{
        display        : 'inline-flex',
        alignItems     : 'center',
        padding        : '3px 10px',
        borderRadius   : radius.badge,
        backgroundColor: 'rgba(244,67,54,0.12)',
        color          : colors.status.absent,
        fontSize       : 10,
        fontWeight     : 600,
        fontFamily     : 'Montserrat, sans-serif',
        letterSpacing  : 0.8,
        textTransform  : 'uppercase',
      }}>EN RETARD</span>
      <button
        onClick={onNavigate}
        style={{
          background: 'none',
          border    : 'none',
          color     : colors.accent.gold,
          fontSize  : 13,
          fontWeight: 600,
          fontFamily: 'Montserrat, sans-serif',
          cursor    : 'pointer',
          whiteSpace: 'nowrap',
          padding   : 0,
        }}
      >
        Voir →
      </button>
    </div>
  )
}

// ── Countdown Tile (Story 50.3) ───────────────────────────────────────────────

function formatCountdown(totalSeconds: number): string {
  const h   = Math.floor(totalSeconds / 3600)
  const m   = Math.floor((totalSeconds % 3600) / 60)
  const sec = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function CountdownTile({
  session,
  loading,
  onNavigate,
}: {
  session   : UpcomingSessionRow | null
  loading   : boolean
  onNavigate: (sessionId: string) => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!session) return
    const calc = () => Math.max(0, Math.floor((new Date(session.scheduledAt).getTime() - Date.now()) / 1000))
    setSecondsLeft(calc())
    const timer = setInterval(() => setSecondsLeft(calc()), 1000)
    return () => clearInterval(timer)
  }, [session?.scheduledAt])

  if (loading) return <SkeletonBlock h={120} r={radius.card} />

  const isOngoing = session !== null && secondsLeft === 0

  return (
    <div
      className="aureak-card"
      style={{
        background  : 'linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)',
        borderTop   : `3px solid ${colors.accent.gold}`,
        borderRadius: radius.card,
        padding     : 20,
        minHeight   : 120,
        boxSizing   : 'border-box',
      }}
    >
      <div style={{
        fontSize      : 11,
        color         : session ? colors.accent.goldLight : colors.text.muted,
        fontWeight    : 600,
        textTransform : 'uppercase',
        letterSpacing : 1,
        marginBottom  : 8,
        fontFamily    : 'Montserrat, sans-serif',
      }}>
        Prochaine séance
      </div>

      {session ? (
        <>
          {isOngoing ? (
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.status.present, fontFamily: 'Montserrat, sans-serif' }}>
              🟢 En cours
            </div>
          ) : (
            <div style={{
              fontFamily: 'Geist Mono, monospace',
              fontWeight: 900,
              fontSize  : 36,
              color     : colors.accent.gold,
              lineHeight: 1,
            }}>
              {formatCountdown(secondsLeft)}
            </div>
          )}

          <div style={{ fontSize: 13, color: colors.text.secondary, marginTop: 8 }}>
            {session.groupName}
            {session.location && (
              <span style={{ color: colors.text.muted }}> · {session.location}</span>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => onNavigate(session.id)}
              style={{
                background: 'none',
                border    : 'none',
                color     : colors.accent.gold,
                fontSize  : 13,
                fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                cursor    : 'pointer',
                padding   : 0,
              }}
            >
              → Voir la séance
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 16, color: colors.text.secondary, fontFamily: 'Geist, sans-serif' }}>
            Aucune séance dans les 24h
          </div>
          <div style={{ fontSize: 12, color: colors.status.present, marginTop: 6, fontFamily: 'Geist, sans-serif' }}>
            Tout est calme ✓
          </div>
        </>
      )}
    </div>
  )
}

// ── Données sparkline simulées (déterministes, sans Math.random) ──────────────
// TODO(50.x): remplacer par données historiques réelles depuis l'API
// Génère 6 points pseudo-aléatoires déterministes basés sur la valeur courante.
// Utilise un seed fixe (pas de Math.random) pour éviter les hydration mismatches SSR/client.
function simulateSpark(current: number, seed: number): number[] {
  const base    = current || 1
  const offsets = [0.82, 0.88, 0.91, 0.87, 0.95, 1.0]
  const jitter  = [seed % 7, seed % 5, seed % 11, seed % 3, seed % 9, 0].map(j => j / 100)
  return offsets.map((o, i) => Math.round(base * (o + jitter[i])))
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '+ Nouvelle séance',    href: '/seances/new', primary: true  },
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
  const [statsError,    setStatsError]    = useState(false)

  // ── Implantation selector ──
  const [implantations,          setImplantations]          = useState<{ id: string; name: string }[]>([])
  const [selectedImplantationId, setSelectedImplantationId] = useState<string | null>(null)

  // ── Upcoming session (countdown tile — Story 50.3) ──
  const [upcomingSession,  setUpcomingSession]  = useState<UpcomingSessionRow | null>(null)
  const [loadingUpcoming,  setLoadingUpcoming]  = useState(true)

  // ── KPI counts (vary with implantation selection) ──
  const [childrenTotal, setChildrenTotal] = useState<number | null>(null)
  const [coachesTotal,  setCoachesTotal]  = useState<number | null>(null)
  const [groupsTotal,   setGroupsTotal]   = useState<number | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(false)

  // ── Date range ──
  type Preset = 'this-week' | 'last-week' | '4-weeks' | 'custom'

  function getPresetDates(preset: Preset): { from: string; to: string } {
    const today = new Date()
    const iso   = (d: Date) => d.toISOString().split('T')[0]
    const ago   = (days: number) => { const d = new Date(today); d.setDate(d.getDate() - days); return d }

    // Monday of current week
    const dayOfWeek = (today.getDay() + 6) % 7 // Mon=0
    const monday    = new Date(today); monday.setDate(today.getDate() - dayOfWeek)
    const sunday    = new Date(monday); sunday.setDate(monday.getDate() + 6)

    const lastMonday = new Date(monday); lastMonday.setDate(monday.getDate() - 7)
    const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6)

    switch (preset) {
      case 'this-week': return { from: iso(monday),     to: iso(sunday)     }
      case 'last-week': return { from: iso(lastMonday), to: iso(lastSunday) }
      case '4-weeks':   return { from: iso(ago(28)),    to: iso(today)      }
      case 'custom':    return { from: iso(ago(30)),    to: iso(today)      }
    }
  }

  const [preset,  setPreset]  = useState<Preset>('4-weeks')
  const [from,    setFrom]    = useState(() => getPresetDates('4-weeks').from)
  const [to,      setTo]      = useState(() => getPresetDates('4-weeks').to)
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo,   setCustomTo]   = useState(to)

  // ── Load stats + implantations list ──
  const load = async (f = from, t = to) => {
    setStatsError(false)
    setLoading(true)
    try {
      const [statsResult, anomalyResult, implRes] = await Promise.all([
        getImplantationStats(new Date(f).toISOString(), new Date(t).toISOString()),
        listAnomalies(),
        listImplantations(),
      ])
      if (statsResult.error) {
        if (process.env.NODE_ENV !== 'production') console.error('[dashboard] getImplantationStats error:', statsResult.error)
        setStatsError(true)
      }
      if (anomalyResult.error) { if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listAnomalies error:', anomalyResult.error) }
      if (implRes.error)       { if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listImplantations error:', implRes.error) }
      setStats(statsResult.data ?? [])
      setAnomalies(anomalyResult.data ?? [])
      setImplantations((implRes.data ?? []).map(i => ({ id: i.id, name: i.name })))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[dashboard] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetChange = (p: Preset) => {
    setPreset(p)
    if (p !== 'custom') {
      const { from: f, to: t } = getPresetDates(p)
      setFrom(f); setTo(t)
      load(f, t)
    }
  }

  const handleApplyCustom = () => {
    setFrom(customFrom); setTo(customTo)
    load(customFrom, customTo)
  }

  useEffect(() => { load() }, [])

  // ── Load upcoming session for countdown tile (Story 50.3) ──
  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true)
      try {
        const { data, error } = await listNextSessionForDashboard()
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listNextSessionForDashboard error:', error)
        }
        setUpcomingSession(data ?? null)
      } finally {
        setLoadingUpcoming(false)
      }
    }
    fetchUpcoming()
  }, [])

  // ── Load KPI counts filtered by implantation ──
  useEffect(() => {
    const loadCounts = async () => {
      setLoadingCounts(true)
      try {
        const { data, error } = await getDashboardKpiCounts(selectedImplantationId ?? undefined)
        if (error || !data) {
          if (process.env.NODE_ENV !== 'production') console.error('[dashboard] getDashboardKpiCounts error:', error)
          return
        }
        setChildrenTotal(data.childrenTotal)
        setCoachesTotal(data.coachesTotal)
        setGroupsTotal(data.groupsTotal)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[dashboard] loadCounts error:', err)
      } finally {
        setLoadingCounts(false)
      }
    }
    loadCounts()
  }, [selectedImplantationId])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await resolveAnomaly(id)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[dashboard] handleResolve error:', err)
    } finally {
      setResolving(null)
    }
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

  // ── Sparkline simulées — données déterministes (AC2) ────────────────────────
  // TODO(50.x): remplacer par données historiques réelles depuis l'API
  const sparkSessions   = totalSessions   > 0          ? simulateSpark(totalSessions,  7)  : undefined
  const sparkAttendance = avgAttendance   !== null      ? simulateSpark(avgAttendance,  3)  : undefined
  const sparkMastery    = avgMastery      !== null      ? simulateSpark(avgMastery,     11) : undefined
  const sparkChildren   = childrenTotal   !== null      ? simulateSpark(childrenTotal,  5)  : undefined
  const sparkCoaches    = coachesTotal    !== null      ? simulateSpark(coachesTotal,   13) : undefined
  const sparkGroups     = groupsTotal     !== null      ? simulateSpark(groupsTotal,    17) : undefined

  // ── Pending sessions (séances non clôturées) ──
  const pendingSessions = visibleStats.reduce(
    (acc, s) => acc + Math.max(0, (s.sessions_total ?? 0) - (s.sessions_closed ?? 0)),
    0
  )

  return (
    <div style={S.container}>
      <style>{`
        .aureak-resolve-btn:hover { opacity: 0.85; }
        .aureak-refresh-btn:hover { border-color: ${colors.accent.gold}; color: ${colors.accent.gold}; }
        .aureak-card:hover { box-shadow: ${shadows.md}; transform: translateY(-2px); }
        .aureak-qa-btn:hover { transform: translateY(-1px); box-shadow: ${shadows.sm}; }

        /* ── Bento responsive ── */
        .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .bento-large  { grid-column: span 2; }
        .bento-medium { grid-column: span 1; }
        .bento-small  { grid-column: span 1; }

        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-large  { grid-column: span 1; }
          .bento-medium { grid-column: span 1; }
          .bento-small  { grid-column: span 1; }
        }

        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-large  { grid-column: span 1; }
          .bento-medium { grid-column: span 1; }
          .bento-small  { grid-column: span 1; }
          .hero-band { height: 120px !important; flex-direction: column !important; align-items: flex-start !important; gap: 12px; padding-top: 16px !important; padding-bottom: 16px !important; }
          .hero-date { text-align: left !important; }
        }
      `}</style>

      {/* ── Hero Band ── */}
      <HeroBand implantationCount={stats.length} />

      {/* ── Filters ── */}
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

        {/* Preset selector */}
        <div style={{ ...S.dateGroup, marginLeft: 8 }}>
          <label style={S.dateLabel}>Période</label>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value as Preset)}
            style={S.implantSelect}
          >
            <option value="this-week">Semaine en cours</option>
            <option value="last-week">Semaine passée</option>
            <option value="4-weeks">4 dernières semaines</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        {/* Custom date pickers — only shown in custom mode */}
        {preset === 'custom' && (<>
          <div style={S.dateGroup}>
            <label style={S.dateLabel}>Du</label>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              style={S.dateInput}
            />
          </div>
          <span style={{ color: colors.text.muted, fontSize: 13, paddingTop: 16 }}>→</span>
          <div style={S.dateGroup}>
            <label style={S.dateLabel}>Au</label>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              style={S.dateInput}
            />
          </div>
          <button style={S.applyBtn} onClick={handleApplyCustom}>
            Appliquer
          </button>
        </>)}
      </div>

      {/* ── Bento KPI Grid ── */}
      <div className="bento-grid">

        {/* LARGE — Joueurs actifs (span 2 cols) */}
        <div className="bento-large">
          <KpiCard
            label="Joueurs actifs"
            value={countVal(childrenTotal)}
            sub={selectedName ? `dans ${selectedName}` : "inscrits à l'académie"}
            accent={colors.status.present}
            size="large"
            icon="👥"
            sparkline={sparkChildren}
          />
        </div>

        {/* MEDIUM — Taux de présence (span 1 col) */}
        <div className="bento-medium">
          <KpiCard
            label="Taux de présence"
            value={avgAttendance !== null ? `${avgAttendance}%` : '—'}
            sub={
              statsError
                ? 'Données indisponibles'
                : avgAttendance === null
                  ? 'Aucune donnée sur la période'
                  : selectedName ? 'implantation' : 'moyenne globale'
            }
            accent={statsError ? colors.text.muted : rateColor(avgAttendance)}
            borderAccent={colors.accent.gold}
            size="medium"
            icon="✅"
            sparkline={sparkAttendance}
          />
        </div>

        {/* MEDIUM — Taux de maîtrise (span 1 col) */}
        <div className="bento-medium">
          <KpiCard
            label="Taux de maîtrise"
            value={avgMastery !== null ? `${avgMastery}%` : '—'}
            sub={
              statsError
                ? 'Données indisponibles'
                : avgMastery === null
                  ? 'Aucune donnée sur la période'
                  : selectedName ? 'implantation' : 'moyenne globale'
            }
            accent={statsError ? colors.text.muted : rateColor(avgMastery)}
            borderAccent={colors.accent.gold}
            size="medium"
            icon="🎯"
            sparkline={sparkMastery}
          />
        </div>

        {/* LARGE — Séances (span 2 cols) */}
        <div className="bento-large">
          <KpiCard
            label="Séances"
            value={totalSessions > 0 ? `${closedSessions} / ${totalSessions}` : '—'}
            sub={statsError ? 'Données indisponibles' : 'clôturées sur le total de la période'}
            accent={colors.accent.gold}
            size="large"
            icon="📅"
            sparkline={sparkSessions}
          />
        </div>

        {/* SMALL — Coachs */}
        <div className="bento-small">
          <KpiCard
            label="Coachs"
            value={countVal(coachesTotal)}
            sub={selectedName ? 'assignés' : 'actifs'}
            accent={colors.entity.coach}
            size="small"
            icon="👨‍🏫"
            sparkline={sparkCoaches}
          />
        </div>

        {/* SMALL — Groupes */}
        <div className="bento-small">
          <KpiCard
            label="Groupes"
            value={countVal(groupsTotal)}
            sub={selectedName ? `dans ${selectedName}` : 'actifs'}
            accent={colors.entity.club}
            size="small"
            icon="🏆"
            sparkline={sparkGroups}
          />
        </div>

        {/* SMALL — Implantations — card avec gradient vert terrain */}
        <div className="bento-small">
          <KpiCard
            label="Implantations"
            value={stats.length > 0 ? stats.length : '—'}
            sub="sites actifs"
            accent={colors.text.primary}
            borderAccent="transparent"
            size="small"
            icon="🏟️"
            cardStyle={{
              background: TERRAIN_GRADIENT,
              border    : 'none',
              boxShadow : shadows.md,
            } as React.CSSProperties}
            valueColor={colors.text.primary}
            labelColor="rgba(255,255,255,0.75)"
            subColor="rgba(255,255,255,0.6)"
          />
        </div>

        {/* SMALL — Anomalies critiques */}
        <div className="bento-small">
          <KpiCard
            label="Anomalies"
            value={criticalCount > 0 ? criticalCount : anomalies.length > 0 ? anomalies.length : '✓'}
            sub={criticalCount > 0 ? 'critiques' : anomalies.length > 0 ? 'aucune critique' : 'aucune alerte'}
            accent={criticalCount > 0 ? colors.status.absent : anomalies.length > 0 ? colors.status.attention : colors.status.present}
            size="small"
            icon={criticalCount > 0 ? '🚨' : anomalies.length > 0 ? '⚠️' : '✅'}
          />
        </div>

        {/* MEDIUM — Countdown prochaine séance (Story 50.3) */}
        <div className="bento-medium">
          <CountdownTile
            session={upcomingSession}
            loading={loadingUpcoming}
            onNavigate={id => router.push(`/seances/${id}` as never)}
          />
        </div>

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

      {/* ── Next Session Tile ── */}
      <NextSessionTile
        pendingSessions={pendingSessions}
        onNavigate={() => router.push('/seances' as never)}
      />

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
                fontSize  : 13,
                fontWeight: 700,
                color     : criticalCount > 0 ? colors.status.absent : colors.status.attention,
                fontFamily: 'Montserrat, sans-serif',
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
                  width          : 7,
                  height         : 7,
                  borderRadius   : 4,
                  backgroundColor: SEV_COLOR[a.severity] ?? colors.text.muted,
                  flexShrink     : 0,
                }} />

                {/* Type */}
                <div style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>
                  {anomalyLabel(a.anomalyType)}
                </div>

                {/* Severity badge */}
                <span style={{
                  fontSize       : 10,
                  fontWeight     : 600,
                  letterSpacing  : 0.8,
                  textTransform  : 'uppercase',
                  padding        : '2px 8px',
                  borderRadius   : 4,
                  backgroundColor: colors.light.muted,
                  color          : SEV_COLOR[a.severity] ?? colors.text.muted,
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
          <div style={{ fontSize: 36, marginBottom: 14 }}>{statsError ? '⚠️' : '📊'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, fontFamily: 'Montserrat, sans-serif', color: colors.text.dark }}>
            {statsError ? 'Données indisponibles' : 'Aucune donnée disponible'}
          </div>
          <div style={{ fontSize: 13, color: colors.text.muted, maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
            {statsError
              ? 'Impossible de charger les statistiques. Vérifiez votre connexion ou contactez le support.'
              : selectedName
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

  // Filter row (was pageHeader — hero replaced the title)
  filterRow       : {
    display        : 'flex',
    alignItems     : 'flex-end',
    gap            : 8,
    flexWrap       : 'wrap',
    marginBottom   : 20,
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
  applyBtn        : {
    padding        : '7px 16px',
    borderRadius   : radius.xs,
    border         : 'none',
    backgroundColor: colors.accent.gold,
    color          : colors.text.dark,
    fontSize       : 13,
    fontWeight     : 700,
    cursor         : 'pointer',
    fontFamily     : 'Geist, sans-serif',
    whiteSpace     : 'nowrap',
    alignSelf      : 'flex-end',
  },

  // KPI Card (bento)
  kpiCard         : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : '20px 24px',
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
    display        : 'flex',
    flexDirection  : 'column',
    gap            : 0,
    transition     : `box-shadow ${transitions.normal}, transform ${transitions.fast}`,
    height         : '100%',
    boxSizing      : 'border-box',
  } as React.CSSProperties,
  kpiCardLarge    : {
    padding        : '28px 32px',
  } as React.CSSProperties,
  kpiCardTop      : {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    marginBottom   : 12,
  } as React.CSSProperties,
  kpiLabel        : {
    fontSize       : 10,
    fontWeight     : 700,
    letterSpacing  : 1.1,
    textTransform  : 'uppercase',
    color          : colors.text.muted,
    display        : 'flex',
    alignItems     : 'center',
  } as React.CSSProperties,
  kpiValue        : {
    fontWeight     : 900,
    fontFamily     : 'Montserrat, sans-serif',
    lineHeight     : 1,
    letterSpacing  : -0.5,
  } as React.CSSProperties,
  kpiSub          : {
    fontSize       : 12,
    color          : colors.text.muted,
    marginTop      : 8,
    lineHeight     : 1.4,
    letterSpacing  : 0.2,
  } as React.CSSProperties,

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
    color          : colors.text.primary,
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
    border         : `1px solid ${colors.border.light}`,
    boxShadow      : shadows.sm,
    transition     : `all ${transitions.normal}`,
    cursor         : 'default',
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
