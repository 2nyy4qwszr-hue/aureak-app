'use client'
// Admin Dashboard — vue de contrôle multi-implantations (Light Premium DA)
// Story 49-5 — Design : Dashboard Admin — Game Manager Premium
// Story 50-1 — Hero Band salle de commandement
// Story 50-5 — Live activity feed
// Story 50-10 — KPI tiles réorganisables drag-drop
// Story 55-8 — Joueur de la semaine tile
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  getImplantationStats, listAnomalies, resolveAnomaly, listImplantations, getDashboardKpiCounts,
  listNextSessionForDashboard, listGroupsByImplantation,
  fetchActivityFeed, getTopStreakPlayers, getPlayerOfWeek, supabase,
  getXPLeaderboard,
  getAcademyScore,
  checkAcademyMilestones, markMilestoneCelebrated,
  getSeasonTrophyData,
} from '@aureak/api-client'
import type { ImplantationStats, AnomalyEvent, UpcomingSessionRow, ActivityEventItem, StreakPlayer, AcademyScoreResult, AcademyMilestone, SeasonTrophyData } from '@aureak/api-client'
import type { PlayerOfWeek, LeaderboardEntry } from '@aureak/types'
import { colors, shadows, radius, transitions, gamification, typography, getStatColor, STAT_THRESHOLDS } from '@aureak/theme'
import { PlayerOfWeekTile, MilestoneCelebration, SeasonTrophy, exportTrophyAsPng, LiveCounter, HelpTooltip, HELP_TEXTS } from '@aureak/ui'
import { useLiveSessionCounts } from '@aureak/api-client'

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
  return getStatColor(pct, STAT_THRESHOLDS.attendance.high, STAT_THRESHOLDS.attendance.low)
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

function HeroBand({ implantationCount, onEnterFocusMode }: { implantationCount: number; onEnterFocusMode: () => void }) {
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
      <div className="hero-date" style={{ position: 'relative', zIndex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
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
          letterSpacing: 0.3,
        }}>
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        </div>

        {/* ⛶ Focus Mode toggle (Story 50-9) */}
        <button
          className="aureak-focus-toggle"
          onClick={onEnterFocusMode}
          title="Mode plein écran"
          style={{
            background   : 'none',
            border       : `1px solid rgba(255,255,255,0.25)`,
            borderRadius : radius.xs,
            padding      : '4px 8px',
            cursor       : 'pointer',
            fontSize     : 16,
            color        : colors.accent.ivory,
            lineHeight   : 1,
            transition   : `all ${transitions.fast}`,
            marginTop    : 4,
          }}
        >
          ⛶
        </button>
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
  /** Story 62.4 — Texte d'aide contextuel HelpTooltip */
  helpText?   : string
}

function KpiCard({ label, value, sub, accent, borderAccent, sparkline, size = 'medium', icon, cardStyle, valueColor, labelColor, subColor, helpText }: KpiCardProps) {
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
        <div style={{ ...S.kpiLabel, color: labelColor ?? (S.kpiLabel as React.CSSProperties).color, display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {/* Story 62.4 — HelpTooltip éducatif */}
          {helpText && <HelpTooltip content={helpText} />}
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

// ── Implantation Card (Story 50.4 — terrain premium) ─────────────────────────

type ImplantationCardProps = {
  stat   : ImplantationStats
  groups?: { id: string; name: string }[]
}

function ImplantationCard({ stat, groups }: ImplantationCardProps) {
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
      {/* Header terrain premium — AC1, AC2, AC4 */}
      <div
        className="implant-card-header"
        style={{
          height        : 80,
          background    : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)',
          position      : 'relative',
          display       : 'flex',
          alignItems    : 'flex-end',
          justifyContent: 'space-between',
          padding       : '0 14px 12px 14px',
        }}
      >
        {/* Nom implantation en bas à gauche — AC4 */}
        <div style={{
          fontFamily : 'Montserrat, sans-serif',
          fontWeight : '700',
          fontSize   : 16,
          color      : '#FFFFFF',
          textShadow : '0 1px 3px rgba(0,0,0,0.5)',
          lineHeight : 1.2,
        }}>
          {stat.implantation_name}
        </div>

        {/* Badge or nombre de groupes en haut à droite — AC2 */}
        {groups != null && (
          <div style={{
            backgroundColor: colors.accent.gold,
            color          : '#1A1A1A',
            borderRadius   : radius.badge,
            paddingLeft    : 8,
            paddingRight   : 8,
            paddingTop     : 3,
            paddingBottom  : 3,
            fontSize       : 11,
            fontWeight     : 700,
            fontFamily     : 'Geist Mono, monospace',
            position       : 'absolute',
            top            : 10,
            right          : 14,
            whiteSpace     : 'nowrap',
          }}>
            {groups.length} groupe{groups.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Corps avec padding */}
      <div style={{ padding: '12px 14px 14px 14px' }}>

        {/* Chips groupes scrollables — AC3 */}
        {groups != null && (
          groups.length > 0 ? (
            <div className="groups-scroll" style={{
              display     : 'flex',
              gap         : 6,
              overflowX   : 'auto',
              marginBottom: 12,
            }}>
              {groups.map(g => (
                <span key={g.id} style={{
                  backgroundColor: colors.light.muted,
                  color          : colors.text.dark,
                  borderRadius   : radius.badge,
                  paddingLeft    : 10,
                  paddingRight   : 10,
                  paddingTop     : 4,
                  paddingBottom  : 4,
                  fontSize       : 11,
                  fontWeight     : 500,
                  whiteSpace     : 'nowrap',
                  flexShrink     : 0,
                }}>
                  {g.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: colors.text.muted, marginBottom: 12 }}>Aucun groupe</div>
          )
        )}

        {/* ProgressBars préservées — AC5 */}
        <ProgressBar pct={stat.attendance_rate_pct} label="Présence" />
        <ProgressBar pct={stat.mastery_rate_pct}    label="Maîtrise" />

        {/* Footer séances clôturées — AC5 */}
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

// ── KPI Tile DnD — Story 50-10 ────────────────────────────────────────────────

type KpiTileId = 'sessions' | 'attendance' | 'mastery' | 'children' | 'coaches' | 'groups'

const KPI_DEFAULT_ORDER: KpiTileId[] = ['children', 'attendance', 'mastery', 'sessions', 'coaches', 'groups']

const KPI_ORDER_KEY = 'aureak_kpi_order'

function loadKpiOrder(): KpiTileId[] {
  try {
    const raw = localStorage.getItem(KPI_ORDER_KEY)
    if (!raw) return KPI_DEFAULT_ORDER
    const parsed = JSON.parse(raw) as KpiTileId[]
    if (!Array.isArray(parsed)) return KPI_DEFAULT_ORDER
    const isValid = KPI_DEFAULT_ORDER.every(id => parsed.includes(id))
    return isValid ? parsed : KPI_DEFAULT_ORDER
  } catch {
    return KPI_DEFAULT_ORDER
  }
}

function DraggableKpiCard({
  id,
  draggedId,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: {
  id         : KpiTileId
  draggedId  : KpiTileId | null
  dragOverId : KpiTileId | null
  onDragStart: (id: KpiTileId) => void
  onDragOver : (e: React.DragEvent, id: KpiTileId) => void
  onDrop     : (id: KpiTileId) => void
  onDragEnd  : () => void
  children   : React.ReactNode
}) {
  const isDragging   = draggedId  === id
  const isDropTarget = dragOverId === id && draggedId !== id

  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDrop={() => onDrop(id)}
      onDragEnd={onDragEnd}
      style={{
        opacity     : isDragging ? 0.5 : 1,
        cursor      : isDragging ? 'grabbing' : 'grab',
        outline     : isDropTarget ? `2px dashed ${colors.accent.gold}` : 'none',
        outlineOffset: isDropTarget ? 2 : 0,
        background  : isDropTarget ? 'rgba(214,201,142,0.08)' : undefined,
        borderRadius: radius.card,
        transition  : 'opacity 0.15s ease, outline 0.1s ease',
        height      : '100%',
        userSelect  : 'none',
      } as React.CSSProperties}
    >
      {children}
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

// ── Activity Feed (Story 50-5) ────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return "À l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

function ActivityFeed({ events, tick }: { events: ActivityEventItem[]; tick: number }) {
  // tick est utilisé pour forcer le recalcul des timestamps relatifs chaque minute
  void tick

  const TYPE_ICON: Record<ActivityEventItem['type'], string> = {
    presence  : '✅',
    new_player: '👤',
    badge     : '🏅',
  }

  return (
    <div style={{
      backgroundColor: colors.light.surface,
      borderRadius   : radius.card,
      border         : `1px solid ${colors.border.light}`,
      overflow       : 'hidden',
      boxShadow      : shadows.sm,
    }}>
      <div style={{
        padding      : '14px 16px',
        borderBottom : `1px solid ${colors.border.divider}`,
        fontSize     : 12,
        fontWeight   : 600,
        color        : colors.text.muted,
        textTransform: 'uppercase' as React.CSSProperties['textTransform'],
        letterSpacing: 0.8,
        fontFamily   : 'Montserrat, sans-serif',
      }}>
        Activité récente
      </div>

      <div
        className="aside-scroll"
        style={{ maxHeight: 420, overflowY: 'auto' }}
      >
        {events.length === 0 && (
          <div style={{ padding: 20, fontSize: 13, color: colors.text.muted, textAlign: 'center' }}>
            Aucune activité récente
          </div>
        )}
        {events.map(evt => (
          <div
            key={evt.id}
            className={`feed-item${evt.isNew ? ' feed-item-new' : ''}`}
            style={{
              display    : 'flex',
              alignItems : 'flex-start',
              gap        : 10,
              padding    : '10px 16px',
              borderBottom: `1px solid ${colors.border.divider}`,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>{TYPE_ICON[evt.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize     : 13,
                fontWeight   : 500,
                color        : colors.text.dark,
                overflow     : 'hidden',
                textOverflow : 'ellipsis',
                whiteSpace   : 'nowrap',
              }}>
                {evt.playerName}
              </div>
              <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 1 }}>
                {evt.description}
              </div>
            </div>
            <div style={{ fontSize: 10, color: colors.text.subtle, flexShrink: 0, marginTop: 2 }}>
              {relativeTime(evt.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Streak Tile (Story 50.6) ──────────────────────────────────────────────────

function InitialsAvatar({ name, rank }: { name: string; rank: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const bg = rank === 1
    ? colors.accent.gold
    : rank === 2
      ? colors.text.secondary
      : colors.border.dark

  return (
    <div style={{
      width          : 36,
      height         : 36,
      borderRadius   : radius.badge,
      backgroundColor: bg,
      display        : 'flex',
      alignItems     : 'center',
      justifyContent : 'center',
      fontFamily     : 'Montserrat, sans-serif',
      fontWeight     : '700',
      fontSize       : 13,
      color          : rank === 1 ? '#1A1A1A' : '#FFFFFF',
      flexShrink     : 0,
    }}>
      {initials}
    </div>
  )
}

function StreakTile({ players, loading }: { players: StreakPlayer[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="aureak-card" style={S.kpiCard}>
        <div style={{
          fontSize      : 12,
          fontWeight    : 600,
          color         : colors.text.muted,
          textTransform : 'uppercase',
          letterSpacing : 0.8,
          marginBottom  : 12,
        }}>
          Forme du moment 🔥
        </div>
        {[0, 1, 2].map(i => <SkeletonBlock key={i} h={40} r={8} />)}
      </div>
    )
  }

  return (
    <div className="aureak-card" style={{ ...S.kpiCard, borderTop: `3px solid ${colors.accent.gold}` }}>
      <div style={{
        fontSize      : 12,
        fontWeight    : 600,
        color         : colors.text.muted,
        textTransform : 'uppercase' as React.CSSProperties['textTransform'],
        letterSpacing : 0.8,
        marginBottom  : 14,
      }}>
        Forme du moment 🔥
      </div>

      {players.length === 0 ? (
        <div>
          <div style={{ fontSize: 14, color: colors.text.dark, fontWeight: 500 }}>
            Aucune streak active
          </div>
          <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 4, lineHeight: 1.4 }}>
            Les streaks apparaissent après 5 présences consécutives
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {players.map((p, i) => (
            <div key={p.childId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <InitialsAvatar name={p.displayName} rank={i + 1} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize    : i === 0 ? 14 : 13,
                  fontWeight  : i === 0 ? 700 : 500,
                  color       : colors.text.dark,
                  overflow    : 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace  : 'nowrap',
                }}>
                  {i === 0 && (
                    <span style={{
                      color        : colors.accent.gold,
                      marginRight  : 4,
                      fontSize     : 11,
                      fontWeight   : 700,
                      fontFamily   : 'Geist Mono, monospace',
                    }}>
                      #1
                    </span>
                  )}
                  {p.displayName}
                </div>
              </div>
              <div style={{
                fontSize  : 12,
                fontWeight: 700,
                color     : colors.text.muted,
                fontFamily: 'Geist Mono, monospace',
                flexShrink: 0,
              }}>
                {p.streak}{p.streak >= 10 ? ' 🔥' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Anomaly Pills & Modal (Story 50-7) ───────────────────────────────────────

function AnomalyPill({ anomaly, onClick }: { anomaly: AnomalyEvent; onClick: () => void }) {
  const color  = SEV_COLOR[anomaly.severity] ?? colors.status.info
  const bgAlpha = anomaly.severity === 'critical' ? 'rgba(244,67,54,0.10)'
                : anomaly.severity === 'warning'  ? 'rgba(255,193,7,0.10)'
                :                                   'rgba(193,172,92,0.10)'

  return (
    <button
      onClick={onClick}
      className="aureak-anomaly-pill"
      style={{
        display        : 'inline-flex',
        alignItems     : 'center',
        gap            : 6,
        backgroundColor: bgAlpha,
        border         : `1px solid ${color}`,
        borderRadius   : radius.badge,
        paddingLeft    : 12,
        paddingRight   : 12,
        paddingTop     : 6,
        paddingBottom  : 6,
        cursor         : 'pointer',
        fontSize       : 12,
        fontWeight     : 600,
        color          : color,
        transition     : 'opacity 0.15s ease',
        fontFamily     : 'Geist, sans-serif',
      } as React.CSSProperties}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      {anomalyLabel(anomaly.anomalyType)}
      {anomaly.metadata?.entity_name && (
        <span style={{ opacity: 0.7, fontSize: 11 }}>· {String(anomaly.metadata.entity_name)}</span>
      )}
    </button>
  )
}

function AnomalyModal({
  anomaly,
  onClose,
  onResolve,
}: {
  anomaly   : AnomalyEvent | null
  onClose   : () => void
  onResolve : (id: string) => Promise<void>
}) {
  const [resolving, setResolving] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!anomaly) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [anomaly, onClose])

  if (!anomaly) return null

  const handleResolveInModal = async () => {
    setResolving(true)
    setError(null)
    try {
      await onResolve(anomaly.id)
    } catch (err) {
      setError('Erreur lors de la résolution')
      if (process.env.NODE_ENV !== 'production') console.error('[AnomalyModal] resolve error:', err)
    } finally {
      setResolving(false)
    }
  }

  const sevColor = SEV_COLOR[anomaly.severity] ?? colors.status.info
  const description = anomaly.metadata?.description ? String(anomaly.metadata.description) : null

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: colors.overlay.dark, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        padding        : 28,
        width          : 440,
        maxWidth       : 'calc(100vw - 32px)',
        boxShadow      : shadows.lg,
        fontFamily     : 'Geist, sans-serif',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sevColor, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: colors.text.dark, fontFamily: 'Montserrat, sans-serif' }}>
            {anomalyLabel(anomaly.anomalyType)}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: sevColor, backgroundColor: `${sevColor}1A`, borderRadius: radius.badge, padding: '3px 8px' }}>
            {SEV_LABEL[anomaly.severity] ?? anomaly.severity}
          </span>
        </div>

        {/* Entity */}
        {anomaly.resourceId && (
          <div style={{ fontSize: 12, color: colors.text.muted, marginBottom: 8 }}>
            Ressource : <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11 }}>{anomaly.resourceType} / {anomaly.resourceId}</span>
          </div>
        )}

        {/* Description from metadata */}
        {description && (
          <div style={{ fontSize: 14, color: colors.text.muted, marginBottom: 16, lineHeight: 1.6 }}>
            {description}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: colors.status.absent, marginBottom: 12 }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: radius.button, border: `1px solid ${colors.border.light}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: colors.text.muted, fontFamily: 'Geist, sans-serif' }}
          >
            Fermer
          </button>
          <button
            onClick={handleResolveInModal}
            disabled={resolving}
            style={{ padding: '8px 16px', borderRadius: radius.button, border: 'none', background: colors.status.success, cursor: resolving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#FFFFFF', opacity: resolving ? 0.6 : 1, fontFamily: 'Geist, sans-serif' }}
          >
            {resolving ? 'Résolution…' : 'Marquer résolu ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position       : 'fixed',
      bottom         : 24,
      right          : 24,
      backgroundColor: colors.status.success,
      color          : '#FFFFFF',
      borderRadius   : radius.button,
      padding        : '10px 18px',
      fontSize       : 13,
      fontWeight     : 600,
      boxShadow      : shadows.md,
      zIndex         : 2000,
      animation      : 'feed-slide-in 0.2s ease',
      fontFamily     : 'Geist, sans-serif',
    } as React.CSSProperties}>
      {message}
    </div>
  )
}

// ── Weather Widget (Story 50-8) ───────────────────────────────────────────────

// Constante localisation — modifier ici pour changer la ville cible
const WEATHER_COORDS    = { lat: 50.85, lon: 4.35, label: 'Bruxelles' }
const WEATHER_CACHE_KEY = 'aureak_weather_cache'
const WEATHER_CACHE_TTL = 60 * 60 * 1000  // 1h en ms

type WeatherData = {
  temperature : number  // °C
  windSpeed   : number  // km/h
  weatherCode : number  // WMO code
  fetchedAt   : number  // Date.now()
}

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '🌥️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌦️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

function wmoEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡️'
}

function wmoLabel(code: number): string {
  if (code === 0)  return 'Dégagé'
  if (code <= 3)   return 'Partiellement nuageux'
  if (code <= 48)  return 'Brouillard'
  if (code <= 55)  return 'Bruine'
  if (code <= 65)  return 'Pluie'
  if (code <= 77)  return 'Neige'
  if (code <= 82)  return 'Averses'
  if (code <= 99)  return 'Orage'
  return 'Variable'
}

function outdoorRecommendation(w: WeatherData): { ok: boolean; label: string; reason?: string } {
  if (w.temperature < 5)  return { ok: false, label: 'Extérieur ✗', reason: 'Trop froid' }
  if (w.windSpeed > 40)   return { ok: false, label: 'Extérieur ✗', reason: 'Vent fort' }
  if (w.weatherCode >= 61 && w.weatherCode <= 82)
                          return { ok: false, label: 'Extérieur ✗', reason: 'Pluie' }
  if (w.weatherCode >= 95) return { ok: false, label: 'Extérieur ✗', reason: 'Orage' }
  return { ok: true, label: 'Extérieur ✓' }
}

function loadWeatherCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as WeatherData
    if (Date.now() - data.fetchedAt > WEATHER_CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function saveWeatherCache(data: WeatherData) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data))
  } catch { /* quota exceeded — ignore */ }
}

async function fetchWeatherData(signal: AbortSignal): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_COORDS.lat}&longitude=${WEATHER_COORDS.lon}&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`
  const res  = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json() as {
    current: { temperature_2m: number; wind_speed_10m: number; weather_code: number }
  }
  return {
    temperature: json.current.temperature_2m,
    windSpeed  : json.current.wind_speed_10m,
    weatherCode: json.current.weather_code,
    fetchedAt  : Date.now(),
  }
}

function WeatherWidget() {
  const [weather,        setWeather]        = useState<WeatherData | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [errorWeather,   setErrorWeather]   = useState(false)

  const load = (force = false) => {
    const controller = new AbortController()
    setLoadingWeather(true)
    setErrorWeather(false)
    ;(async () => {
      try {
        if (!force) {
          const cached = loadWeatherCache()
          if (cached) { setWeather(cached); return }
        } else {
          try { localStorage.removeItem(WEATHER_CACHE_KEY) } catch { /* ignore */ }
        }
        const data = await fetchWeatherData(controller.signal)
        saveWeatherCache(data)
        setWeather(data)
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        setErrorWeather(true)
        if (process.env.NODE_ENV !== 'production') console.error('[WeatherWidget] fetch error:', err)
      } finally {
        setLoadingWeather(false)
      }
    })()
    return controller
  }

  useEffect(() => {
    const controller = load()
    return () => { controller?.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loadingWeather) return <SkeletonBlock h={80} r={radius.card} />

  if (errorWeather || !weather) {
    return (
      <div className="aureak-card" style={{ ...S.kpiCard, minHeight: 80, justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: colors.text.muted }}>Météo indisponible</span>
      </div>
    )
  }

  const rec = outdoorRecommendation(weather)

  return (
    <div className="aureak-card" style={{ ...S.kpiCard, borderTop: `3px solid ${colors.status.info}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Montserrat, sans-serif' }}>
          Météo terrain
        </div>
        <button
          onClick={() => load(true)}
          title="Forcer le rafraîchissement"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: colors.text.muted, padding: 0 }}
        >
          ↻
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{wmoEmoji(weather.weatherCode)}</span>
        <div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700, fontSize: 22, color: colors.text.dark, lineHeight: 1 }}>
            {Math.round(weather.temperature)}°C
          </div>
          <div style={{ fontSize: 11, color: colors.text.muted }}>
            {wmoLabel(weather.weatherCode)} · {Math.round(weather.windSpeed)} km/h
          </div>
        </div>
      </div>

      <div style={{
        marginTop : 10,
        fontSize  : 12,
        fontWeight: 600,
        color     : rec.ok ? colors.status.present : colors.status.absent,
      }}>
        {rec.label}
        {rec.reason && (
          <span style={{ fontWeight: 400, color: colors.text.muted }}> — {rec.reason}</span>
        )}
      </div>

      <div style={{ fontSize: 10, color: colors.text.subtle, marginTop: 4 }}>
        {WEATHER_COORDS.label}
      </div>
    </div>
  )
}

// ── Season Trophy Tile (Story 59-10) ─────────────────────────────────────────

function SeasonTrophyTileInner({
  trophyData,
  academyScore,
  top3,
  loading,
  svgRef,
}: {
  trophyData   : SeasonTrophyData
  academyScore : number
  top3         : LeaderboardEntry[]
  loading      : boolean
  svgRef       : React.RefObject<SVGSVGElement>
}) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!svgRef.current) return
    setIsExporting(true)
    try {
      await exportTrophyAsPng(svgRef.current, `trophee-${trophyData.season.label.replace(/\s+/g, '-')}`)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[dashboard] exportTrophyAsPng error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const top3Mapped = top3.slice(0, 3).map(e => ({
    rank: e.rank,
    name: e.displayName,
    xp  : e.totalXp,
  }))

  if (loading) return (
    <div style={{
      backgroundColor: colors.light.surface,
      borderRadius   : radius.card,
      border         : `1px solid ${colors.border.light}`,
      boxShadow      : shadows.sm,
      padding        : 20,
    }}>
      <div style={{
        height         : 200,
        backgroundColor: colors.light.muted,
        borderRadius   : radius.xs,
        animation      : 'a-pulse 1.8s ease-in-out infinite',
      }} />
    </div>
  )

  return (
    <div style={{
      backgroundColor: colors.light.surface,
      borderRadius   : radius.card,
      border         : `1px solid ${colors.border.light}`,
      boxShadow      : shadows.sm,
      padding        : 20,
    }}>
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: colors.text.dark }}>
            Trophée de saison
          </span>
        </div>

        {/* Bouton export */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            padding        : '6px 14px',
            borderRadius   : radius.button,
            border         : `1px solid ${colors.border.light}`,
            backgroundColor: colors.light.surface,
            color          : colors.text.muted,
            fontSize       : 12,
            fontWeight     : 600,
            cursor         : isExporting ? 'wait' : 'pointer',
            fontFamily     : 'Montserrat, sans-serif',
            display        : 'flex',
            alignItems     : 'center',
            gap            : 6,
            transition     : `all ${transitions.fast}`,
            opacity        : isExporting ? 0.7 : 1,
          }}
        >
          {isExporting ? '⏳' : '⬇'} Télécharger
        </button>
      </div>

      {/* Trophy SVG preview (50% via transform scale) */}
      <div style={{
        display        : 'flex',
        justifyContent : 'center',
        overflow       : 'hidden',
        height         : 200,
        alignItems     : 'flex-start',
      }}>
        <div style={{
          transform      : 'scale(0.5)',
          transformOrigin: 'top center',
          flexShrink     : 0,
        }}>
          <SeasonTrophy
            ref={svgRef}
            season={trophyData.season}
            academyScore={academyScore}
            top3={top3Mapped}
            badgeCount={trophyData.badgeCount}
          />
        </div>
      </div>
    </div>
  )
}

// ── Academy Score Tile (Story 59-6) ──────────────────────────────────────────

const ACADEMY_LEVEL_COLORS: Record<string, string> = {
  'Débutante'      : gamification.levels.bronze.color,
  'En développement': gamification.levels.silver.color,
  'Confirmée'      : gamification.levels.gold.color,
  'Excellence'     : gamification.levels.platinum.color,
  'Élite'          : gamification.levels.diamond.color,
}

function AcademyScoreTile({
  score,
  loading,
  error,
  onRetry,
}: {
  score   : AcademyScoreResult | null
  loading : boolean
  error   : boolean
  onRetry : () => void
}) {
  const levelColor = score ? (ACADEMY_LEVEL_COLORS[score.level] ?? gamification.levels.bronze.color) : gamification.levels.bronze.color
  const pct        = score ? Math.min(100, Math.max(0, score.score)) : 0

  return (
    <div
      style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        border         : `1px solid ${colors.border.light}`,
        boxShadow      : shadows.sm,
        padding        : 24,
      }}
    >
      <style>{`
        @keyframes academy-score-fill {
          from { width: 0%; }
          to   { width: ${pct}%; }
        }
        @keyframes academy-pulse {
          0%,100% { opacity: .12 }
          50%     { opacity: .25 }
        }
        .academy-score-bar-fill {
          animation: academy-score-fill ${gamification.animations.xpFill} forwards;
        }
        .academy-skel { background: ${colors.light.muted}; animation: academy-pulse 1.8s ease-in-out infinite; border-radius: 6px; }
      `}</style>

      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🎓</span>
        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: colors.text.dark }}>
          Niveau Académie
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div>
          <div className="academy-skel" style={{ height: 56, marginBottom: 12 }} />
          <div className="academy-skel" style={{ height: 12, marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="academy-skel" style={{ height: 32, flex: 1 }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
            Score indisponible
          </div>
          <button
            onClick={onRetry}
            style={{
              background: 'none',
              border: `1px solid ${colors.border.light}`,
              borderRadius: radius.button,
              padding: '6px 14px',
              fontSize: 12,
              color: colors.text.muted,
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Score */}
      {!loading && !error && score && (
        <>
          {/* Hero score + niveau */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
            <div style={{
              fontFamily  : 'Geist Mono, monospace',
              fontWeight  : 900,
              fontSize    : 48,
              color       : levelColor,
              lineHeight  : 1,
            }}>
              {score.score}
            </div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{
                fontFamily  : 'Montserrat, sans-serif',
                fontWeight  : 600,
                fontSize    : 18,
                color       : colors.text.dark,
              }}>
                {score.level}
              </div>
              <div style={{
                fontSize  : 12,
                color     : score.trend >= 0 ? colors.status.success : colors.accent.red,
                fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                marginTop : 2,
              }}>
                {score.trend >= 0 ? `+${score.trend}` : `${score.trend}`} pts cette semaine
              </div>
            </div>
          </div>

          {/* Jauge linéaire animée */}
          <div style={{
            height         : gamification.xp.barHeight,
            backgroundColor: gamification.xp.trackColor,
            borderRadius   : gamification.xp.barRadius,
            overflow       : 'hidden',
            marginBottom   : 16,
          }}>
            <div
              className="academy-score-bar-fill"
              style={{
                height         : '100%',
                backgroundColor: levelColor,
                borderRadius   : gamification.xp.barRadius,
                width          : `${pct}%`,
              }}
            />
          </div>

          {/* Mini-stats composantes */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Présence',   value: score.components.presenceRate,     icon: '📅' },
              { label: 'Progression', value: score.components.progressionScore, icon: '📈' },
              { label: 'Activité',   value: score.components.activityScore,     icon: '✓'  },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  flex           : 1,
                  backgroundColor: colors.light.muted,
                  border         : `1px solid ${colors.border.light}`,
                  borderRadius   : radius.xs,
                  padding        : '8px 10px',
                  textAlign      : 'center',
                }}
              >
                <div style={{ fontSize: 14 }}>{icon}</div>
                <div style={{
                  fontFamily: 'Geist Mono, monospace',
                  fontWeight: 700,
                  fontSize  : 14,
                  color     : colors.text.dark,
                }}>
                  {value}%
                </div>
                <div style={{
                  fontSize  : typography.caption.size,
                  color     : colors.text.muted,
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight : `${typography.caption.lineHeight}px`,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Leaderboard Tile (Story 59-3) ─────────────────────────────────────────────

function LeaderboardTile({
  entries,
  loading,
  onRowClick,
}: {
  entries: LeaderboardEntry[]
  loading: boolean
  onRowClick: (childId: string) => void
}) {
  const PODIUM_BG: Record<number, string> = {
    1: gamification.levels.gold.color,
    2: gamification.levels.silver.color,
    3: gamification.levels.bronze.color,
  }

  const EVOLUTION_ICON: Record<string, { icon: string; color: string }> = {
    up    : { icon: '▲', color: colors.status.success },
    down  : { icon: '▼', color: colors.accent.red },
    stable: { icon: '—', color: colors.text.subtle },
  }

  return (
    <div
      style={{
        background  : colors.light.surface,
        borderRadius: radius.card,
        boxShadow   : shadows.sm,
        padding     : 20,
        minHeight   : 320,
      }}
    >
      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🏆</span>
        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: colors.text.dark }}>
          Classement XP — Saison
        </span>
      </div>

      {/* Chargement */}
      {loading && (
        <div>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                height      : 40,
                borderRadius: radius.card,
                background  : colors.light.muted,
                marginBottom: 8,
                animation   : 'a-pulse 1.8s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: colors.text.subtle, fontSize: 13, fontFamily: 'Montserrat, sans-serif' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          Aucun joueur classé cette saison
        </div>
      )}

      {/* Lignes classement */}
      {!loading && entries.map(entry => {
        const isPodium   = entry.rank <= 3
        const podiumBg   = PODIUM_BG[entry.rank]
        const evo        = EVOLUTION_ICON[entry.evolution] ?? EVOLUTION_ICON.stable

        return (
          <div
            key={entry.childId}
            onClick={() => onRowClick(entry.childId)}
            style={{
              display        : 'flex',
              alignItems     : 'center',
              gap            : 10,
              padding        : '7px 10px',
              borderRadius   : 8,
              marginBottom   : 4,
              cursor         : 'pointer',
              background     : isPodium ? `${podiumBg}18` : colors.light.surface,
              borderLeft     : isPodium ? `3px solid ${podiumBg}` : `3px solid transparent`,
              transition     : 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = colors.light.hover }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isPodium ? `${podiumBg}18` : colors.light.surface }}
          >
            {/* Rang */}
            <span style={{
              width     : 24,
              fontSize  : isPodium ? 16 : 13,
              fontWeight: 700,
              fontFamily: 'Geist Mono, monospace',
              color     : isPodium ? podiumBg : colors.text.muted,
              textAlign : 'center',
              flexShrink: 0,
            }}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
            </span>

            {/* Nom */}
            <span style={{
              flex      : 1,
              fontSize  : 13,
              fontWeight: isPodium ? 700 : 500,
              fontFamily: 'Montserrat, sans-serif',
              color     : colors.text.dark,
              overflow  : 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {entry.displayName}
            </span>

            {/* Évolution */}
            <span style={{ fontSize: 11, color: evo.color, fontWeight: 700, flexShrink: 0 }}>
              {evo.icon}
            </span>

            {/* XP total */}
            <span style={{
              fontSize  : 12,
              fontWeight: 700,
              fontFamily: 'Geist Mono, monospace',
              color     : isPodium ? podiumBg : colors.text.dark,
              flexShrink: 0,
            }}>
              {entry.totalXp.toLocaleString('fr-BE')} XP
            </span>
          </div>
        )
      })}
    </div>
  )
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

  // ── Live counters (Story 60.8) ──
  const liveCounters = useLiveSessionCounts()

  // ── Stats & anomalies ──
  const [stats,            setStats]            = useState<ImplantationStats[]>([])
  const [anomalies,        setAnomalies]        = useState<AnomalyEvent[]>([])
  const [loading,          setLoading]          = useState(true)
  const [statsError,       setStatsError]       = useState(false)
  const [selectedAnomaly,  setSelectedAnomaly]  = useState<AnomalyEvent | null>(null)
  const [toastMessage,     setToastMessage]     = useState<string | null>(null)

  // ── Implantation selector ──
  const [implantations,          setImplantations]          = useState<{ id: string; name: string }[]>([])
  const [selectedImplantationId, setSelectedImplantationId] = useState<string | null>(null)

  // ── Groups map par implantation (Story 50.4) ──
  const [implantationGroups, setImplantationGroups] = useState<Record<string, { id: string; name: string }[]>>({})

  // ── Upcoming session (countdown tile — Story 50.3) ──
  const [upcomingSession,  setUpcomingSession]  = useState<UpcomingSessionRow | null>(null)
  const [loadingUpcoming,  setLoadingUpcoming]  = useState(true)

  // ── Activity feed (Story 50-5) ──
  const [activityEvents, setActivityEvents] = useState<ActivityEventItem[]>([])
  const [tickMinute,     setTickMinute]     = useState(0)

  // ── Streak players (Story 50-6) ──
  const [streakPlayers,  setStreakPlayers]  = useState<StreakPlayer[]>([])
  const [loadingStreaks,  setLoadingStreaks]  = useState(true)

  // ── Joueur de la semaine (Story 55-8) ──
  const [playerOfWeek,   setPlayerOfWeek]   = useState<PlayerOfWeek | null>(null)

  // ── Leaderboard XP (Story 59-3) ──
  const [leaderboard,    setLeaderboard]    = useState<LeaderboardEntry[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)

  // ── Score académie (Story 59-6) ──
  const [academyScore,        setAcademyScore]        = useState<AcademyScoreResult | null>(null)
  const [loadingAcademyScore, setLoadingAcademyScore] = useState(true)
  const [academyScoreError,   setAcademyScoreError]   = useState(false)

  // ── Milestones célébration (Story 59-7) ──
  const [celebrationMilestone, setCelebrationMilestone] = useState<AcademyMilestone | null>(null)

  // ── Trophée de saison (Story 59-10) ──
  const [trophyData,        setTrophyData]        = useState<SeasonTrophyData | null>(null)
  const [loadingTrophy,     setLoadingTrophy]     = useState(true)
  const trophySvgRef = useRef<SVGSVGElement>(null)

  // ── KPI counts (vary with implantation selection) ──
  const [childrenTotal, setChildrenTotal] = useState<number | null>(null)
  const [coachesTotal,  setCoachesTotal]  = useState<number | null>(null)
  const [groupsTotal,   setGroupsTotal]   = useState<number | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(false)

  // ── Focus Mode (Story 50-9) ──
  const [focusMode, setFocusMode] = useState(false)

  // ── KPI order DnD (Story 50-10) ──
  const [kpiOrder,   setKpiOrder]   = useState<KpiTileId[]>(loadKpiOrder)
  const [draggedId,  setDraggedId]  = useState<KpiTileId | null>(null)
  const [dragOverId, setDragOverId] = useState<KpiTileId | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KPI_ORDER_KEY, JSON.stringify(kpiOrder))
    } catch { /* quota exceeded — ignore */ }
  }, [kpiOrder])

  const handleDragStart = (id: KpiTileId) => setDraggedId(id)

  const handleDragOver = (e: React.DragEvent, id: KpiTileId) => {
    e.preventDefault()
    if (id !== draggedId) setDragOverId(id)
  }

  const handleDrop = (targetId: KpiTileId) => {
    if (!draggedId || draggedId === targetId) return
    setKpiOrder(prev => {
      const next    = [...prev]
      const fromIdx = next.indexOf(draggedId)
      const toIdx   = next.indexOf(targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, draggedId)
      return next
    })
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const resetKpiOrder = () => {
    try { localStorage.removeItem(KPI_ORDER_KEY) } catch { /* ignore */ }
    setKpiOrder(KPI_DEFAULT_ORDER)
  }

  // Focus Mode — body class + global styles injection
  useEffect(() => {
    if (!focusMode) return
    document.body.classList.add('focus-mode-active')

    // Injecter les styles globaux ciblant la sidebar et la topbar
    const styleEl = document.createElement('style')
    styleEl.id = 'focus-mode-styles'
    styleEl.textContent = `
      body.focus-mode-active [data-sidebar] { display: none !important; }
      body.focus-mode-active [data-topbar]  { display: none !important; }
    `
    document.head.appendChild(styleEl)

    return () => {
      document.body.classList.remove('focus-mode-active')
      document.getElementById('focus-mode-styles')?.remove()
    }
  }, [focusMode])

  // Focus Mode — Escape key listener
  useEffect(() => {
    if (!focusMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusMode])

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

      // ── Charger groupes par implantation en parallèle (AC7) ──
      const groupsMap: Record<string, { id: string; name: string }[]> = {}
      await Promise.all(
        (statsResult.data ?? []).map(async (s) => {
          try {
            const { data } = await listGroupsByImplantation(s.implantation_id)
            groupsMap[s.implantation_id] = (data ?? []).map(g => ({ id: g.id, name: g.name }))
          } catch (gErr) {
            if (process.env.NODE_ENV !== 'production') console.error('[dashboard] listGroupsByImplantation error:', gErr)
            groupsMap[s.implantation_id] = []
          }
        })
      )
      setImplantationGroups(groupsMap)
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

  // ── Load activity feed initial data (Story 50-5) ──
  useEffect(() => {
    const loadFeed = async () => {
      try {
        const { data } = await fetchActivityFeed()
        setActivityEvents(data ?? [])
      } catch (err) {
        if (process.env.NODE_ENV !== 'production')
          console.error('[dashboard] fetchActivityFeed error:', err)
      }
    }
    loadFeed()
  }, [])

  // ── Load streak players (Story 50-6) ──
  useEffect(() => {
    const loadStreaks = async () => {
      setLoadingStreaks(true)
      try {
        const { data, error } = await getTopStreakPlayers(3)
        if (error) {
          if (process.env.NODE_ENV !== 'production')
            console.error('[dashboard] getTopStreakPlayers error:', error)
        }
        setStreakPlayers(data ?? [])
      } finally {
        setLoadingStreaks(false)
      }
    }
    loadStreaks()
  }, [])

  // ── Load joueur de la semaine (Story 55-8) ──
  useEffect(() => {
    const loadPlayerOfWeek = async () => {
      try {
        const { data, error } = await getPlayerOfWeek()
        if (error) {
          if (process.env.NODE_ENV !== 'production')
            console.error('[dashboard] getPlayerOfWeek error:', error)
        }
        setPlayerOfWeek(data ?? null)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production')
          console.error('[dashboard] getPlayerOfWeek exception:', err)
      }
    }
    loadPlayerOfWeek()
  }, [])

  // ── Load leaderboard XP (Story 59-3) ──
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoadingLeaderboard(true)
      try {
        const { data, error } = await getXPLeaderboard(10)
        if (error) {
          if (process.env.NODE_ENV !== 'production')
            console.error('[dashboard] getXPLeaderboard error:', error)
        }
        setLeaderboard(data ?? [])
      } catch (err) {
        if (process.env.NODE_ENV !== 'production')
          console.error('[dashboard] getXPLeaderboard exception:', err)
      } finally {
        setLoadingLeaderboard(false)
      }
    }
    loadLeaderboard()
  }, [])

  // ── Load score académie (Story 59-6) ──
  useEffect(() => {
    const loadScore = async () => {
      setLoadingAcademyScore(true)
      setAcademyScoreError(false)
      try {
        const { data, error } = await getAcademyScore()
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[dashboard] getAcademyScore error:', error)
          setAcademyScoreError(true)
        }
        setAcademyScore(data ?? null)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[dashboard] getAcademyScore exception:', err)
        setAcademyScoreError(true)
      } finally {
        setLoadingAcademyScore(false)
      }
    }
    loadScore()
  }, [])

  // ── Load trophée de saison (Story 59-10) ──
  useEffect(() => {
    const loadTrophy = async () => {
      setLoadingTrophy(true)
      try {
        const { data, error } = await getSeasonTrophyData()
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[dashboard] getSeasonTrophyData error:', error)
        }
        setTrophyData(data ?? null)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[dashboard] getSeasonTrophyData exception:', err)
      } finally {
        setLoadingTrophy(false)
      }
    }
    loadTrophy()
  }, [])

  // ── Check milestones au montage (Story 59-7) ──
  // Marque celebrated=true AVANT de lancer l'animation (évite re-affichage navigation rapide)
  useEffect(() => {
    const checkMilestones = async () => {
      try {
        const { data, error } = await checkAcademyMilestones()
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[dashboard] checkAcademyMilestones error:', error)
          return
        }
        if (data.length > 0) {
          // Prendre le premier (plus ancien par reached_at)
          const first = data[0]
          // Marquer comme célébré immédiatement pour éviter le re-affichage
          await markMilestoneCelebrated(first.id)
          setCelebrationMilestone(first)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[dashboard] checkMilestones exception:', err)
      }
    }
    checkMilestones()
  }, [])

  // ── Realtime subscription — attendance_records INSERT (Story 50-5, AC4) ──
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        (payload) => {
          const record = payload.new as { id: string; child_id?: string; created_at: string }
          const event: ActivityEventItem = {
            id         : `presence-${record.id}`,
            type       : 'presence',
            playerName : 'Joueur',
            description: 'Présence validée en séance',
            createdAt  : record.created_at,
            isNew      : true,
          }
          setActivityEvents(prev => [event, ...prev].slice(0, 20))
          // Retirer le flag isNew après 5s
          setTimeout(() => {
            setActivityEvents(prev =>
              prev.map(e => e.id === event.id ? { ...e, isNew: false } : e)
            )
          }, 5000)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          if (process.env.NODE_ENV !== 'production')
            console.error('[dashboard] Realtime channel error — affichage statique uniquement')
        }
      })

    return () => { channel.unsubscribe() }
  }, [])

  // ── Timer minute pour recalculer les timestamps relatifs (Story 50-5, AC5) ──
  useEffect(() => {
    const timer = setInterval(() => setTickMinute(t => t + 1), 60_000)
    return () => clearInterval(timer)
  }, [])

  const handleResolve = async (id: string) => {
    // throws si erreur — laisse AnomalyModal gérer le try/finally
    await resolveAnomaly(id)
    setAnomalies(prev => prev.filter(a => a.id !== id))
    setSelectedAnomaly(null)
    setToastMessage('Anomalie résolue ✓')
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

  const criticalCount   = anomalies.filter(a => a.severity === 'critical').length
  const warningCount    = anomalies.filter(a => a.severity === 'warning').length
  const infoCount       = anomalies.filter(a => a.severity === 'info').length
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

  // ── KPI order changed check (Story 50-10) ──
  const isOrderDefault = useMemo(
    () => JSON.stringify(kpiOrder) === JSON.stringify(KPI_DEFAULT_ORDER),
    [kpiOrder]
  )

  // ── Focus Mode container style (Story 50-9) ──
  const containerStyle: React.CSSProperties = focusMode
    ? {
        ...S.container,
        position : 'fixed',
        inset    : 0,
        zIndex   : 500,
        background: colors.light.primary,
        overflowY: 'auto',
        padding  : 24,
        animation: 'focus-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : S.container

  return (
    <div style={containerStyle} className={focusMode ? 'focus-mode-enter' : undefined}>
      {/* ── Célébration milestone (Story 59-7) ── */}
      {celebrationMilestone && (
        <MilestoneCelebration
          label={celebrationMilestone.milestoneLabel}
          date={celebrationMilestone.reachedAt ?? undefined}
          onDismiss={() => setCelebrationMilestone(null)}
        />
      )}
      <style>{`
        .aureak-resolve-btn:hover { opacity: 0.85; }
        .aureak-refresh-btn:hover { border-color: ${colors.accent.gold}; color: ${colors.accent.gold}; }
        .aureak-anomaly-pill:hover { opacity: 0.8; }
        .aureak-card:hover { box-shadow: ${shadows.md}; transform: translateY(-2px); }
        .aureak-qa-btn:hover { transform: translateY(-1px); box-shadow: ${shadows.sm}; }

        /* ── ImplantationCard terrain premium (Story 50.4) ── */
        .implant-card-header { transition: box-shadow 0.2s ease; }
        .aureak-card:hover .implant-card-header { box-shadow: 0 4px 20px rgba(64,145,108,0.3); }
        .groups-scroll::-webkit-scrollbar { display: none; }
        .groups-scroll { scrollbar-width: none; }

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

        /* ── Page layout 2 colonnes (Story 50-5) ── */
        .page-layout { display: flex; gap: 24px; align-items: flex-start; }
        .main-col    { flex: 1 1 0; min-width: 0; }
        .aside-col   { width: 280px; flex-shrink: 0; position: sticky; top: 24px; }

        /* ── Activity feed (Story 50-5) ── */
        @keyframes feed-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .feed-item     { animation: feed-slide-in 0.25s ease forwards; }
        .feed-item-new { background: rgba(193,172,92,0.08); }
        .aside-scroll::-webkit-scrollbar { display: none; }
        .aside-scroll  { scrollbar-width: none; }

        @media (max-width: 1024px) {
          .page-layout { flex-direction: column; }
          .aside-col   { width: 100%; position: static; }
        }

        /* ── Focus Mode (Story 50-9) ── */
        @keyframes focus-enter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .focus-mode-enter { animation: focus-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .aureak-focus-toggle:hover { border-color: ${colors.accent.gold} !important; color: ${colors.accent.gold} !important; }
        .aureak-focus-quit:hover   { border-color: ${colors.accent.gold} !important; }

        /* ── Drag & Drop KPI tiles (Story 50-10) ── */
        [draggable="true"] { user-select: none; }
        [draggable="true"]:active { cursor: grabbing; }
      `}</style>

      {/* ── Focus Mode — Badge + Bouton Quitter (Story 50-9) ── */}
      {focusMode && (
        <div style={{
          position       : 'fixed',
          top            : 12,
          left           : 12,
          zIndex         : 501,
          backgroundColor: 'rgba(0,0,0,0.4)',
          color          : '#FFF',
          borderRadius   : radius.badge,
          padding        : '4px 10px',
          fontSize       : 11,
          fontWeight     : 600,
          fontFamily     : 'Geist, system-ui, sans-serif',
          pointerEvents  : 'none',
        }}>
          🎯 Focus
        </div>
      )}
      {focusMode && (
        <button
          className="aureak-focus-quit"
          onClick={() => setFocusMode(false)}
          style={{
            position       : 'fixed',
            top            : 12,
            right          : 12,
            zIndex         : 501,
            backgroundColor: colors.light.surface,
            border         : `1px solid ${colors.border.light}`,
            borderRadius   : radius.badge,
            padding        : '6px 14px',
            cursor         : 'pointer',
            fontSize       : 13,
            fontWeight     : 600,
            color          : colors.text.dark,
            boxShadow      : shadows.sm,
            fontFamily     : 'Geist, system-ui, sans-serif',
            transition     : `all ${transitions.fast}`,
          }}
        >
          ✕ Quitter
        </button>
      )}

      {/* ── Hero Band (full width, avant le layout 2 cols) ── */}
      <HeroBand implantationCount={stats.length} onEnterFocusMode={() => setFocusMode(true)} />

      {/* ── Live Counter — séances en cours (Story 60.8) — visible uniquement si séances actives ── */}
      {liveCounters.sessionCount > 0 && (
        <LiveCounter
          sessionCount={liveCounters.sessionCount}
          presentCount={liveCounters.presentCount}
          totalCount={liveCounters.totalCount}
          isLive={liveCounters.isLive}
        />
      )}

      {/* ── Layout 2 colonnes : main + aside activity feed ── */}
      <div className="page-layout">
      <div className="main-col">

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

      {/* ── Bento KPI Grid — draggable (Story 50-10) ── */}
      <div className="bento-grid">

        {/* Draggable KPI tiles — ordre contrôlé par kpiOrder */}
        {kpiOrder.map(id => {
          if (id === 'children') return (
            <div key="children" className="bento-large">
              <DraggableKpiCard id="children" draggedId={draggedId} dragOverId={dragOverId}
                onDragStart={handleDragStart} onDragOver={handleDragOver}
                onDrop={handleDrop} onDragEnd={handleDragEnd}
              >
                <KpiCard
                  label="Joueurs actifs"
                  value={countVal(childrenTotal)}
                  sub={selectedName ? `dans ${selectedName}` : "inscrits à l'académie"}
                  accent={colors.status.present}
                  size="large"
                  icon="👥"
                  sparkline={sparkChildren}
                />
              </DraggableKpiCard>
            </div>
          )
          if (id === 'attendance') return (
            <div key="attendance" className="bento-medium">
              <DraggableKpiCard id="attendance" draggedId={draggedId} dragOverId={dragOverId}
                onDragStart={handleDragStart} onDragOver={handleDragOver}
                onDrop={handleDrop} onDragEnd={handleDragEnd}
              >
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
                  helpText={HELP_TEXTS.attendanceKpi}
                />
              </DraggableKpiCard>
            </div>
          )
          if (id === 'mastery') return (
            <div key="mastery" className="bento-medium">
              <DraggableKpiCard id="mastery" draggedId={draggedId} dragOverId={dragOverId}
                onDragStart={handleDragStart} onDragOver={handleDragOver}
                onDrop={handleDrop} onDragEnd={handleDragEnd}
              >
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
                  helpText={HELP_TEXTS.masteryKpi}
                />
              </DraggableKpiCard>
            </div>
          )
          if (id === 'sessions') return (
            <div key="sessions" className="bento-large">
              <DraggableKpiCard id="sessions" draggedId={draggedId} dragOverId={dragOverId}
                onDragStart={handleDragStart} onDragOver={handleDragOver}
                onDrop={handleDrop} onDragEnd={handleDragEnd}
              >
                <KpiCard
                  label="Séances"
                  value={totalSessions > 0 ? `${closedSessions} / ${totalSessions}` : '—'}
                  sub={statsError ? 'Données indisponibles' : 'clôturées sur le total de la période'}
                  accent={colors.accent.gold}
                  size="large"
                  icon="📅"
                  sparkline={sparkSessions}
                />
              </DraggableKpiCard>
            </div>
          )
          if (id === 'coaches') return (
            <div key="coaches" className="bento-small">
              <DraggableKpiCard id="coaches" draggedId={draggedId} dragOverId={dragOverId}
                onDragStart={handleDragStart} onDragOver={handleDragOver}
                onDrop={handleDrop} onDragEnd={handleDragEnd}
              >
                <KpiCard
                  label="Coachs"
                  value={countVal(coachesTotal)}
                  sub={selectedName ? 'assignés' : 'actifs'}
                  accent={colors.entity.coach}
                  size="small"
                  icon="👨‍🏫"
                  sparkline={sparkCoaches}
                />
              </DraggableKpiCard>
            </div>
          )
          if (id === 'groups') return (
            <div key="groups" className="bento-small">
              <DraggableKpiCard id="groups" draggedId={draggedId} dragOverId={dragOverId}
                onDragStart={handleDragStart} onDragOver={handleDragOver}
                onDrop={handleDrop} onDragEnd={handleDragEnd}
              >
                <KpiCard
                  label="Groupes"
                  value={countVal(groupsTotal)}
                  sub={selectedName ? `dans ${selectedName}` : 'actifs'}
                  accent={colors.entity.club}
                  size="small"
                  icon="🏆"
                  sparkline={sparkGroups}
                />
              </DraggableKpiCard>
            </div>
          )
          return null
        })}

        {/* Tiles fixes non réorganisables (AC7) */}

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

        {/* SMALL — Météo terrain (Story 50-8) */}
        <div className="bento-small">
          <WeatherWidget />
        </div>

        {/* MEDIUM — Countdown prochaine séance (Story 50.3) */}
        <div className="bento-medium">
          <CountdownTile
            session={upcomingSession}
            loading={loadingUpcoming}
            onNavigate={id => router.push(`/seances/${id}` as never)}
          />
        </div>

        {/* MEDIUM — Forme du moment (Story 50.6) */}
        <div className="bento-medium">
          <StreakTile players={streakPlayers} loading={loadingStreaks} />
        </div>

        {/* MEDIUM — Joueur de la semaine (Story 55-8) */}
        {playerOfWeek && (
          <div className="bento-medium">
            <PlayerOfWeekTile
              player={playerOfWeek}
              onPress={() => router.push(`/(admin)/children/${playerOfWeek.childId}` as never)}
            />
          </div>
        )}

        {/* MEDIUM — Score Académie (Story 59-6) */}
        <div className="bento-medium">
          <AcademyScoreTile
            score={academyScore}
            loading={loadingAcademyScore}
            error={academyScoreError}
            onRetry={async () => {
              setLoadingAcademyScore(true)
              setAcademyScoreError(false)
              try {
                const { data, error } = await getAcademyScore()
                if (error) { setAcademyScoreError(true) }
                setAcademyScore(data ?? null)
              } catch { setAcademyScoreError(true) }
              finally { setLoadingAcademyScore(false) }
            }}
          />
        </div>

        {/* LARGE — Leaderboard XP (Story 59-3) */}
        <div className="bento-large">
          <LeaderboardTile
            entries={leaderboard}
            loading={loadingLeaderboard}
            onRowClick={(childId) => router.push(`/(admin)/children/${childId}` as never)}
          />
        </div>

        {/* MEDIUM — Trophée de saison (Story 59-10 — visible seulement si saison terminée) */}
        {(trophyData !== null || loadingTrophy) && (
          <div className="bento-medium">
            {trophyData ? (
              <SeasonTrophyTileInner
                trophyData={trophyData}
                academyScore={academyScore?.score ?? 0}
                top3={leaderboard}
                loading={loadingTrophy}
                svgRef={trophySvgRef as React.RefObject<SVGSVGElement>}
              />
            ) : (
              <div style={{
                backgroundColor: colors.light.surface,
                borderRadius   : radius.card,
                border         : `1px solid ${colors.border.light}`,
                boxShadow      : shadows.sm,
                padding        : 20,
              }}>
                <div style={{
                  height         : 200,
                  backgroundColor: colors.light.muted,
                  borderRadius   : radius.xs,
                  animation      : 'a-pulse 1.8s ease-in-out infinite',
                }} />
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Bouton Réinitialiser l'ordre (Story 50-10) — visible si ordre modifié ── */}
      {!isOrderDefault && (
        <div style={{ textAlign: 'right', marginTop: -16, marginBottom: 16 }}>
          <button
            onClick={resetKpiOrder}
            style={{
              background     : 'none',
              border         : 'none',
              cursor         : 'pointer',
              fontSize       : 11,
              color          : colors.text.muted,
              textDecoration : 'underline',
              fontFamily     : 'Geist, sans-serif',
              padding        : 0,
            }}
          >
            Réinitialiser l'ordre
          </button>
        </div>
      )}

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

      {/* ── Anomaly Panel (Story 50-7 — pills inline) ── */}
      <div style={{
        ...S.anomalyPanel,
        borderLeft: anomalies.length === 0
          ? `3px solid ${colors.status.success}`
          : `3px solid ${criticalCount > 0 ? colors.status.absent : colors.status.attention}`,
      }}>
        {/* Summary row */}
        <div style={S.anomalyPanelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {anomalies.length === 0 ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.status.success, fontFamily: 'Montserrat, sans-serif' }}>
                Aucune anomalie ✓
              </span>
            ) : (
              <>
                {criticalCount > 0 && (
                  <span style={{ fontSize: 12, color: colors.status.absent }}>
                    🔴 {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                  </span>
                )}
                {warningCount > 0 && (
                  <span style={{ fontSize: 12, color: colors.status.warning }}>
                    🟡 {warningCount} avertissement{warningCount > 1 ? 's' : ''}
                  </span>
                )}
                {infoCount > 0 && (
                  <span style={{ fontSize: 12, color: criticalCount === 0 && warningCount === 0 ? colors.text.muted : colors.accent.gold }}>
                    🔵 {infoCount} info{infoCount > 1 ? 's' : ''}
                  </span>
                )}
              </>
            )}
          </div>
          {selectedName && anomalies.length > 0 && (
            <span style={{ fontSize: 11, color: colors.text.muted, fontStyle: 'italic' }}>
              Anomalies non filtrables par implantation
            </span>
          )}
        </div>

        {/* Pills */}
        {anomalies.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sortedAnomalies.map(a => (
              <AnomalyPill key={a.id} anomaly={a} onClick={() => setSelectedAnomaly(a)} />
            ))}
          </div>
        )}

        {/* Empty state fond vert léger */}
        {anomalies.length === 0 && (
          <div style={{
            backgroundColor: 'rgba(16,185,129,0.06)',
            borderRadius   : radius.xs,
            padding        : '8px 12px',
            fontSize       : 12,
            color          : colors.status.success,
          }}>
            Toutes les anomalies ont été résolues — aucune alerte active.
          </div>
        )}
      </div>

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
            <ImplantationCard
              key={s.implantation_id}
              stat={s}
              groups={implantationGroups[s.implantation_id]}
            />
          ))}
        </div>
      )}

      {/* ── Fin main-col ── */}
      </div>

      {/* ── Aside : Activity Feed ── */}
      <div className="aside-col">
        <ActivityFeed events={activityEvents} tick={tickMinute} />
      </div>

      {/* ── Fin page-layout ── */}
      </div>

      {/* ── Anomaly Modal (Story 50-7) ── */}
      <AnomalyModal
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onResolve={handleResolve}
      />

      {/* ── Toast feedback (Story 50-7) ── */}
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
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
