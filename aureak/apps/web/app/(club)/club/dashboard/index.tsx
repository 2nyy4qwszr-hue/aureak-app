'use client'
// Club Dashboard v2 — filtres · analytics · navigation gardiens · export · affiliations
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { supabase, listImplantations, listAffiliatedChildrenByClub } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import type { EvaluationSignal, ChildClubHistory, FootballTeamLevel } from '@aureak/types'
import type { Implantation } from '@aureak/types'

// ── Types ─────────────────────────────────────────────────────────────────────
type ClubRow = {
  user_id          : string
  name             : string
  club_access_level: 'partner' | 'common'
  tenant_id        : string
}
type AttendanceRow = {
  child_id  : string
  status    : string
  sessions  : { scheduled_at: string; implantation_id: string } | null
}
type EvalRow = {
  child_id    : string
  receptivite : EvaluationSignal
  gout_effort : EvaluationSignal
  attitude    : EvaluationSignal
  top_seance  : 'star' | 'none'
  created_at  : string
}
type UpcomingSession = {
  id               : string
  scheduled_at     : string
  duration_minutes : number
  location         : string | null
  status           : string
}
type GoalkeeperStat = {
  childId    : string
  name       : string
  allSessions: AttendanceRow[]
  lastEval   : EvalRow | null
}

// ── Filter types ──────────────────────────────────────────────────────────────
type PeriodKey   = '30j' | '90j' | '6m' | '1an' | 'all'
type AttendFilter = 'all' | 'bon' | 'moyen' | 'faible'
type EvalFilter   = 'all' | 'couverts' | 'en_attente'

const PERIOD_DAYS: Record<PeriodKey, number | null> = {
  '30j': 30, '90j': 90, '6m': 180, '1an': 365, 'all': null,
}
const PERIOD_LABELS: Record<PeriodKey, string> = {
  '30j': '30 j', '90j': '90 j', '6m': '6 mois', '1an': '1 an', 'all': 'Tout',
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRESENT_STATUSES = new Set(['present', 'late', 'trial'])

const SIGNAL_ICON : Record<EvaluationSignal, string> = { positive: '✓', attention: '!', none: '–' }
const SIGNAL_COLOR: Record<EvaluationSignal, string> = {
  positive : colors.status.present,
  attention: colors.status.attention,
  none     : colors.text.muted,
}
const SIGNAL_BG: Record<EvaluationSignal, string> = {
  positive : 'rgba(76,175,80,0.16)',
  attention: 'rgba(255,193,7,0.16)',
  none     : colors.light.muted,
}

// ── Football affiliation constants ────────────────────────────────────────────
const TEAM_LEVEL_COLOR: Record<FootballTeamLevel, string> = {
  'Provinciaux'      : colors.text.muted,
  'Interprovinciaux' : colors.status.attention,
  'Régionaux'        : '#7C8CF8',
  'Nationaux'        : colors.accent.gold,
  'International'    : colors.status.present,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function daysUntil(d: Date) {
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}
function cutoffFor(period: PeriodKey): Date | null {
  const days = PERIOD_DAYS[period]
  if (!days) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}
function rateColor(rate: number | null): string {
  if (rate === null) return colors.text.muted
  if (rate >= 80)   return colors.status.present
  if (rate >= 60)   return colors.status.attention
  return colors.status.absent
}
function computeRate(sessions: AttendanceRow[]): number | null {
  if (sessions.length === 0) return null
  return Math.round(sessions.filter(s => PRESENT_STATUSES.has(s.status)).length / sessions.length * 100)
}

// ── MiniBar ───────────────────────────────────────────────────────────────────
function MiniBar({ sessions }: { sessions: AttendanceRow[] }) {
  const last8 = [...sessions].slice(0, 8)
  if (last8.length === 0) return <span style={{ fontSize: 11, color: colors.text.muted }}>–</span>
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
      {last8.map((s, i) => {
        const ok    = PRESENT_STATUSES.has(s.status)
        const color = ok ? colors.status.present : s.status === 'absent' ? colors.status.absent : colors.text.muted
        return (
          <div key={i} style={{
            width: 10, height: ok ? 18 : 7, borderRadius: 2,
            backgroundColor: color, opacity: ok ? 0.85 : 0.45,
          }} />
        )
      })}
    </div>
  )
}

// ── EvalDots ──────────────────────────────────────────────────────────────────
function EvalDots({ ev }: { ev: EvalRow | null }) {
  if (!ev) return <span style={{ fontSize: 11, color: colors.text.muted }}>–</span>
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {(['receptivite', 'gout_effort', 'attitude'] as const).map(key => (
        <div key={key} title={key === 'gout_effort' ? 'Effort' : key === 'receptivite' ? 'Réceptivité' : 'Attitude'} style={{
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: SIGNAL_BG[ev[key]],
          border: `1px solid ${SIGNAL_COLOR[ev[key]]}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: SIGNAL_COLOR[ev[key]],
        }}>
          {SIGNAL_ICON[ev[key]]}
        </div>
      ))}
      {ev.top_seance === 'star' && <span style={{ fontSize: 12, marginLeft: 2 }}>⭐</span>}
    </div>
  )
}

// ── Monthly analytics chart ───────────────────────────────────────────────────
function MonthlyChart({ goalies }: { goalies: GoalkeeperStat[] }) {
  const allSessions = goalies.flatMap(g => g.allSessions)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })
  const data = months.map(m => {
    const rows   = allSessions.filter(s => {
      if (!s.sessions) return false
      const d = new Date(s.sessions.scheduled_at)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    })
    const present = rows.filter(s => PRESENT_STATUSES.has(s.status)).length
    const rate    = rows.length > 0 ? Math.round((present / rows.length) * 100) : null
    return { ...m, total: rows.length, present, rate }
  })
  const hasData = data.some(d => d.total > 0)
  if (!hasData) return null

  return (
    <div style={{ ...D.sectionBox, marginTop: 24 }}>
      <div style={D.sectionLabel}>Tendance mensuelle — 6 derniers mois</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 90, padding: '0 4px' }}>
        {data.map((m, i) => {
          const height = m.rate !== null ? Math.max(m.rate * 0.7, 4) : 4
          const color  = m.rate === null ? colors.light.muted
            : m.rate >= 80 ? colors.status.present
            : m.rate >= 60 ? colors.status.attention
            : colors.status.absent
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: m.rate !== null ? color : colors.text.muted }}>
                {m.rate !== null ? `${m.rate}%` : '–'}
              </div>
              <div style={{ width: '100%', height: 70, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                <div style={{
                  width: '100%', height: '100%',
                  backgroundColor: colors.light.muted, borderRadius: 4, position: 'absolute', bottom: 0,
                }} />
                <div style={{
                  width: '100%', height: `${height}px`,
                  backgroundColor: color, borderRadius: 4, position: 'relative',
                  transition: 'height 0.4s ease', opacity: m.rate !== null ? 0.8 : 0.3,
                }} />
              </div>
              <div style={{ fontSize: 10, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m.label}
              </div>
              {m.total > 0 && (
                <div style={{ fontSize: 9, color: colors.text.muted }}>{m.total}</div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        {[
          { label: '≥ 80%', color: colors.status.present },
          { label: '60-79%', color: colors.status.attention },
          { label: '< 60%', color: colors.status.absent },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: l.color }} />
            <span style={{ fontSize: 11, color: colors.text.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={D.page}>
      <style>{`@keyframes cl-p{0%,100%{opacity:.12}50%{opacity:.35}} .cl-sk{background:${colors.light.muted};border-radius:6px;animation:cl-p 1.9s ease-in-out infinite}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div className="cl-sk" style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div><div className="cl-sk" style={{ height: 26, width: 200, marginBottom: 6 }} /><div className="cl-sk" style={{ height: 13, width: 100 }} /></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <div key={i} className="cl-sk" style={{ flex: 1, height: 78, borderRadius: 10 }} />)}
      </div>
      <div className="cl-sk" style={{ height: 44, borderRadius: 8, marginBottom: 20 }} />
      <div className="cl-sk" style={{ height: 300, borderRadius: 10, marginBottom: 16 }} />
      <div className="cl-sk" style={{ height: 120, borderRadius: 10 }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClubDashboard() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)

  const [club,         setClub]         = useState<ClubRow | null>(null)
  const [goalies,      setGoalies]      = useState<GoalkeeperStat[]>([])
  const [upcoming,     setUpcoming]     = useState<UpcomingSession[]>([])
  const [implants,     setImplants]     = useState<Pick<Implantation, 'id' | 'name'>[]>([])
  const [affiliated,   setAffiliated]   = useState<ChildClubHistory[]>([])
  const [loading,      setLoading]      = useState(true)

  // Filters
  const [period,       setPeriod]       = useState<PeriodKey>('90j')
  const [implantId,    setImplantId]    = useState('all')
  const [attendFilter, setAttendFilter] = useState<AttendFilter>('all')
  const [evalFilter,   setEvalFilter]   = useState<EvalFilter>('all')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data: clubRow } = await supabase
        .from('clubs').select('user_id, name, club_access_level, tenant_id')
        .eq('user_id', user.id).single()

      if (!clubRow) { setLoading(false); return }
      setClub(clubRow as ClubRow)

      const [{ data: links }, implRes] = await Promise.all([
        supabase.from('club_child_links').select('child_id').eq('club_id', user.id),
        listImplantations(),
      ])
      setImplants((implRes.data ?? []) as Pick<Implantation, 'id' | 'name'>[])

      const childIds = (links ?? []).map((l: { child_id: string }) => l.child_id)
      if (childIds.length === 0) { setLoading(false); return }

      const [profilesRes, attendRes, evalRes, saRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name').in('user_id', childIds),
        supabase
          .from('attendances')
          .select('child_id, status, sessions(scheduled_at, implantation_id)')
          .in('child_id', childIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('session_evaluations_merged')
          .select('child_id, receptivite, gout_effort, attitude, top_seance, created_at')
          .in('child_id', childIds)
          .order('created_at', { ascending: false }),
        supabase.from('session_attendees').select('session_id').in('child_id', childIds),
      ])

      const profiles  = (profilesRes.data ?? []) as { user_id: string; display_name: string }[]
      const allAtt    = (attendRes.data   ?? []) as unknown as AttendanceRow[]
      const allEvals  = (evalRes.data     ?? []) as EvalRow[]

      const stats: GoalkeeperStat[] = childIds.map(id => ({
        childId    : id,
        name       : profiles.find(p => p.user_id === id)?.display_name ?? '—',
        allSessions: allAtt.filter(a => a.child_id === id),
        lastEval   : allEvals.find(e => e.child_id === id) ?? null,
      }))
      setGoalies(stats.sort((a, b) => a.name.localeCompare(b.name)))

      // Upcoming sessions
      const sessionIds = [...new Set((saRes.data ?? []).map((r: { session_id: string }) => r.session_id))]
      if (sessionIds.length > 0) {
        const { data: upSessions } = await supabase
          .from('sessions')
          .select('id, scheduled_at, duration_minutes, location, status')
          .in('id', sessionIds)
          .gt('scheduled_at', new Date().toISOString())
          .in('status', ['planifiée', 'en_cours'])
          .order('scheduled_at', { ascending: true })
          .limit(5)
        setUpcoming((upSessions ?? []) as UpcomingSession[])
      }

      // Affiliated children — all seasons, for this club
      try {
        const { data: affiliatedData } = await listAffiliatedChildrenByClub(user.id)
        setAffiliated(affiliatedData)
      } catch { /* best-effort */ }

      setLoading(false)
    }
    load()
  }, [user?.id])

  // ── Filtered goalies (memoized) ─────────────────────────────────────────────
  const filteredGoalies = useMemo(() => {
    const cutoff = cutoffFor(period)
    return goalies
      .map(g => {
        let sessions = g.allSessions
        if (cutoff)         sessions = sessions.filter(s => s.sessions && new Date(s.sessions.scheduled_at) >= cutoff)
        if (implantId !== 'all') sessions = sessions.filter(s => s.sessions?.implantation_id === implantId)
        const rate = computeRate(sessions)
        return { ...g, filteredSessions: sessions, rate }
      })
      .filter(g => {
        if (attendFilter === 'bon')    return g.rate !== null && g.rate >= 80
        if (attendFilter === 'moyen')  return g.rate !== null && g.rate >= 60 && g.rate < 80
        if (attendFilter === 'faible') return g.rate !== null && g.rate < 60
        return true
      })
      .filter(g => {
        if (evalFilter === 'couverts')    return g.lastEval !== null
        if (evalFilter === 'en_attente')  return g.lastEval === null
        return true
      })
  }, [goalies, period, implantId, attendFilter, evalFilter])

  if (loading) return <Skeleton />

  // ── Summary stats from filtered dataset ────────────────────────────────────
  const totalGoalies = filteredGoalies.length
  const ratesAvail   = filteredGoalies.filter(g => g.rate !== null)
  const globalRate   = ratesAvail.length > 0
    ? Math.round(ratesAvail.reduce((s, g) => s + (g.rate ?? 0), 0) / ratesAvail.length)
    : null
  const evalCovered  = filteredGoalies.filter(g => g.lastEval !== null).length
  const evalPct      = totalGoalies > 0 ? Math.round((evalCovered / totalGoalies) * 100) : 0
  const alerts       = filteredGoalies.filter(g => g.rate !== null && (g.rate as number) < 60)
  const topCount     = filteredGoalies.filter(g => g.lastEval?.top_seance === 'star').length

  const kpis = [
    { value: totalGoalies, label: 'Gardiens', color: colors.accent.gold, icon: '🥊' },
    {
      value: globalRate !== null ? `${globalRate}%` : '–',
      label: 'Assiduité moy.',
      color: rateColor(globalRate),
      icon: '📊',
    },
    {
      value: `${evalPct}%`,
      label: 'Couverture évals',
      color: evalPct >= 70 ? colors.status.present : evalPct >= 40 ? colors.status.attention : colors.text.muted,
      icon: '📋',
    },
    { value: upcoming.length, label: 'Séances à venir', color: upcoming.length > 0 ? colors.accent.gold : colors.text.muted, icon: '📅' },
  ]

  const accessLabel = club?.club_access_level === 'partner' ? 'Partenaire' : 'Commun'
  const accessColor = club?.club_access_level === 'partner' ? colors.status.present : colors.text.muted

  return (
    <div style={D.page}>
      <style>{`
        .cl-row:hover{background:rgba(255,255,255,0.03)!important;cursor:pointer}
        .cl-kpi:hover{border-color:${colors.accent.gold}40!important;transform:translateY(-1px)}
        .cl-sess:hover{background:rgba(193,172,92,0.05)!important}
        .cl-pill:hover{border-color:${colors.accent.gold}!important;color:${colors.accent.gold}!important}
        .cl-exp:hover{opacity:.85}
        @media print{
          .no-print{display:none!important}
          body{background:#fff;color:#000}
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={D.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={D.clubAvatar}>{club?.name?.charAt(0)?.toUpperCase() ?? 'C'}</div>
          <div>
            <h1 style={D.clubName}>{club?.name ?? '—'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                border: `1px solid ${accessColor}40`, backgroundColor: accessColor + '12',
                color: accessColor, textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>{accessLabel}</span>
              <span style={{ fontSize: 11, color: colors.text.muted }}>Vue opérationnelle</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="no-print">
          <div style={{ fontSize: 11, color: colors.text.muted, textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: colors.text.dark, marginBottom: 1 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
            Données live
          </div>
          <button
            className="cl-exp"
            style={{
              padding: '8px 14px', borderRadius: 7,
              border: `1px solid ${colors.border.light}`,
              backgroundColor: colors.light.surface,
              color: colors.text.muted, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.15s', marginLeft: 8,
            }}
            onClick={() => window.print()}
          >
            ↓ Rapport
          </button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div style={D.kpiRow}>
        {kpis.map((k, i) => (
          <div key={i} className="cl-kpi" style={D.kpiCard}>
            <div style={{ fontSize: 20, marginBottom: 5 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: k.color, lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div style={D.filterBar} className="no-print">
        {/* Period pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map(pk => (
            <button
              key={pk}
              className="cl-pill"
              style={{
                padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                border: `1px solid ${period === pk ? colors.accent.gold : colors.border.light}`,
                color: period === pk ? colors.accent.gold : colors.text.muted,
                backgroundColor: period === pk ? 'rgba(193,172,92,0.10)' : colors.light.muted,
              }}
              onClick={() => setPeriod(pk)}
            >
              {PERIOD_LABELS[pk]}
            </button>
          ))}
        </div>

        <div style={{ width: 1, backgroundColor: colors.border.light, alignSelf: 'stretch' }} />

        {/* Implantation dropdown */}
        {implants.length > 0 && (
          <select
            value={implantId}
            onChange={e => setImplantId(e.target.value)}
            style={D.select}
          >
            <option value="all">Toutes les implantations</option>
            {implants.map(imp => (
              <option key={imp.id} value={imp.id}>{imp.name}</option>
            ))}
          </select>
        )}

        {/* Attendance filter */}
        <select value={attendFilter} onChange={e => setAttendFilter(e.target.value as AttendFilter)} style={D.select}>
          <option value="all">Toute assiduité</option>
          <option value="bon">Bonne (≥ 80%)</option>
          <option value="moyen">Moyenne (60-79%)</option>
          <option value="faible">Faible (&lt; 60%)</option>
        </select>

        {/* Eval filter */}
        <select value={evalFilter} onChange={e => setEvalFilter(e.target.value as EvalFilter)} style={D.select}>
          <option value="all">Toutes les évals</option>
          <option value="couverts">Évalués</option>
          <option value="en_attente">Sans éval</option>
        </select>

        {/* Active filter indicator */}
        {(period !== '90j' || implantId !== 'all' || attendFilter !== 'all' || evalFilter !== 'all') && (
          <button
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${colors.status.attention}40`, color: colors.status.attention,
              backgroundColor: 'rgba(255,193,7,0.06)', cursor: 'pointer',
            }}
            onClick={() => { setPeriod('90j'); setImplantId('all'); setAttendFilter('all'); setEvalFilter('all') }}
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* ── Alert banner ────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={D.alertBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14 }}>⚠</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.status.attention }}>
                {alerts.length} gardien{alerts.length > 1 ? 's' : ''} avec une assiduité &lt; 60%
              </span>
              <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                {alerts.map(a => a.name).join(', ')} — Cliquez pour voir le détail
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div style={D.twoCol}>
        {/* LEFT — goalkeeper table */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={D.sectionLabel}>Gardiens{filteredGoalies.length !== goalies.length ? ` (${filteredGoalies.length}/${goalies.length})` : ` (${goalies.length})`}</div>
            {topCount > 0 && (
              <span style={{ fontSize: 11, color: colors.accent.gold, fontWeight: 600 }}>⭐ {topCount} top séance</span>
            )}
          </div>

          {goalies.length === 0 ? (
            <div style={D.emptyState}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🥊</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucun gardien lié</div>
              <div style={{ fontSize: 13, color: colors.text.muted, maxWidth: 260 }}>
                Contactez l'académie pour associer vos gardiens à ce club.
              </div>
            </div>
          ) : filteredGoalies.length === 0 ? (
            <div style={D.emptyState}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucun résultat</div>
              <div style={{ fontSize: 12, color: colors.text.muted }}>Essayez d'ajuster les filtres.</div>
            </div>
          ) : (
            <div style={D.table}>
              {/* Head */}
              <div style={D.tableHead}>
                <div style={{ flex: 1, ...D.headCell }}>Gardien</div>
                <div style={{ width: 84, ...D.headCell }}>Assiduité</div>
                <div style={{ width: 90, ...D.headCell }}>Présences</div>
                <div style={{ width: 116, ...D.headCell }}>Dernière éval</div>
                <div style={{ width: 24 }} />
              </div>

              {/* Rows */}
              {filteredGoalies.map(g => {
                const color = rateColor(g.rate)
                return (
                  <div
                    key={g.childId}
                    className="cl-row"
                    style={D.tableRow}
                    onClick={() => router.push(`/club/goalkeepers/${g.childId}` as never)}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: colors.light.muted,
                        border: `1px solid ${color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color,
                      }}>
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: colors.text.muted }}>
                          {g.filteredSessions.length} séance{g.filteredSessions.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ width: 84 }}>
                      {g.rate !== null ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color }}>{g.rate}%</div>
                          <div style={{ height: 3, backgroundColor: colors.light.muted, borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${g.rate}%`, backgroundColor: color, borderRadius: 2 }} />
                          </div>
                        </>
                      ) : <span style={{ fontSize: 12, color: colors.text.muted }}>–</span>}
                    </div>

                    <div style={{ width: 90 }}>
                      <MiniBar sessions={g.filteredSessions} />
                    </div>

                    <div style={{ width: 116 }}>
                      <EvalDots ev={g.lastEval} />
                    </div>

                    <div style={{ width: 24, color: colors.text.muted, fontSize: 14 }}>›</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Monthly analytics */}
          <MonthlyChart goalies={goalies} />
        </div>

        {/* RIGHT column */}
        <div style={D.rightCol}>
          {/* Upcoming sessions */}
          <div style={{ marginBottom: 20 }}>
            <div style={D.sectionLabel}>Séances à venir</div>
            {upcoming.length === 0 ? (
              <div style={{ ...D.rightCard, padding: '20px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>📅</div>
                <div style={{ fontSize: 12, color: colors.text.muted }}>Aucune séance planifiée</div>
              </div>
            ) : (
              <div style={D.rightCard}>
                {upcoming.map((s, i) => {
                  const d    = new Date(s.scheduled_at)
                  const days = daysUntil(d)
                  const near = days <= 3
                  return (
                    <div key={s.id} className="cl-sess" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 13px', transition: 'background 0.12s',
                      borderBottom: i < upcoming.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 1 }}>{fmtDate(d)} · {fmtTime(d)}</div>
                        <div style={{ fontSize: 11, color: colors.text.muted }}>{s.duration_minutes} min{s.location ? ` · ${s.location}` : ''}</div>
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
                        backgroundColor: near ? 'rgba(193,172,92,0.10)' : colors.light.muted,
                        color: near ? colors.accent.gold : colors.text.muted,
                        border: `1px solid ${near ? colors.accent.gold + '40' : colors.border.light}`,
                      }}>
                        {days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `J-${days}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recap */}
          <div style={{ marginBottom: 20 }}>
            <div style={D.sectionLabel}>Récapitulatif</div>
            <div style={D.rightCard}>
              {[
                {
                  label: 'Meilleure assiduité',
                  value: (() => {
                    const best = [...filteredGoalies].filter(g => g.rate !== null).sort((a,b) => (b.rate ?? 0) - (a.rate ?? 0))[0]
                    return best ? `${best.name} (${best.rate}%)` : '–'
                  })(),
                  color: colors.status.present,
                },
                {
                  label: 'Tous signaux positifs',
                  value: (() => {
                    const n = filteredGoalies.filter(g => g.lastEval?.receptivite === 'positive' && g.lastEval?.gout_effort === 'positive' && g.lastEval?.attitude === 'positive').length
                    return n > 0 ? `${n} gardien${n > 1 ? 's' : ''}` : '–'
                  })(),
                  color: colors.status.present,
                },
                {
                  label: 'Signal attention',
                  value: (() => {
                    const n = filteredGoalies.filter(g => g.lastEval?.receptivite === 'attention' || g.lastEval?.gout_effort === 'attention' || g.lastEval?.attitude === 'attention').length
                    return n > 0 ? `${n} gardien${n > 1 ? 's' : ''}` : '–'
                  })(),
                  color: colors.status.attention,
                },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '11px 13px', borderBottom: i < 2 ? `1px solid ${colors.border.light}` : 'none' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution */}
          {filteredGoalies.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.sectionLabel}>Distribution assiduité</div>
              <div style={D.rightCard}>
                {[
                  { label: 'Bon (≥ 80%)', count: filteredGoalies.filter(g => g.rate !== null && g.rate >= 80).length, color: colors.status.present },
                  { label: 'Moyen (60–79%)', count: filteredGoalies.filter(g => g.rate !== null && g.rate >= 60 && g.rate < 80).length, color: colors.status.attention },
                  { label: 'Faible (< 60%)', count: filteredGoalies.filter(g => g.rate !== null && g.rate < 60).length, color: colors.status.absent },
                  { label: 'Sans données', count: filteredGoalies.filter(g => g.rate === null).length, color: colors.text.muted },
                ].map((seg, i) => (
                  <div key={i} style={{ padding: '9px 13px', borderBottom: i < 3 ? `1px solid ${colors.border.light}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: seg.color }} />
                      <span style={{ fontSize: 12, color: colors.text.muted }}>{seg.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: seg.count > 0 ? seg.color : colors.text.muted }}>{seg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affiliations par saison */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={D.sectionLabel}>Affiliations officielles</div>
              {affiliated.length > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  backgroundColor: colors.status.present + '10',
                  border: `1px solid ${colors.status.present}40`,
                  color: colors.status.present,
                }}>
                  {affiliated.length}
                </span>
              )}
            </div>
            {affiliated.length === 0 ? (
              <div style={{ ...D.rightCard, padding: '20px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>📋</div>
                <div style={{ fontSize: 12, color: colors.text.muted }}>
                  Aucune affiliation officielle enregistrée pour ce club.
                </div>
                <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 6, lineHeight: 1.5 }}>
                  Les parents peuvent ajouter l'historique via le profil de leur enfant.
                </div>
              </div>
            ) : (
              <div style={D.rightCard}>
                {/* Group by season */}
                {Array.from(new Set(affiliated.map(a => a.season))).sort((a, b) => b.localeCompare(a)).map(season => {
                  const seasonEntries = affiliated.filter(a => a.season === season)
                  return (
                    <div key={season} style={{ borderBottom: `1px solid ${colors.border.light}` }}>
                      {/* Season header */}
                      <div style={{
                        padding: '7px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: 'rgba(193,172,92,0.04)',
                        borderBottom: `1px solid ${colors.border.light}`,
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: colors.accent.gold, letterSpacing: '0.05em',
                        }}>
                          {season}
                        </span>
                        <span style={{ fontSize: 10, color: colors.text.muted }}>
                          {seasonEntries.length} gardien{seasonEntries.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {/* Children */}
                      {seasonEntries.map((entry, i) => {
                        const lvlColor = entry.teamLevel ? TEAM_LEVEL_COLOR[entry.teamLevel] : colors.text.muted
                        return (
                          <div
                            key={entry.id}
                            className="cl-row"
                            style={{
                              padding: '9px 13px',
                              borderBottom: i < seasonEntries.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                              cursor: 'pointer', transition: 'background 0.12s',
                            }}
                            onClick={() => router.push(`/club/goalkeepers/${entry.childId}` as never)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <div style={{
                                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                backgroundColor: colors.status.present + '15',
                                border: `1px solid ${colors.status.present}40`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, color: colors.status.present,
                              }}>
                                ✓
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {entry.ageCategory}
                                </div>
                                {entry.teamLevel && (
                                  <div style={{ fontSize: 10, color: lvlColor, fontWeight: 500 }}>{entry.teamLevel}</div>
                                )}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: colors.text.muted }}>›</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const D: Record<string, React.CSSProperties> = {
  page       : { padding: '26px 30px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 1100 },
  header     : { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  clubAvatar : { width: 46, height: 46, borderRadius: '50%', backgroundColor: colors.accent.gold, color: colors.text.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  clubName   : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 5px', letterSpacing: '0.02em' },
  kpiRow     : { display: 'flex', gap: 10, marginBottom: 16 },
  kpiCard    : { flex: 1, backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, padding: '18px 16px', cursor: 'default', transition: 'border-color 0.15s, transform 0.15s' },
  filterBar  : { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 14px', backgroundColor: colors.light.surface, borderRadius: 8, border: `1px solid ${colors.border.light}`, marginBottom: 16 },
  select     : { padding: '5px 10px', borderRadius: 6, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 12, cursor: 'pointer', outline: 'none' },
  alertBanner: { padding: '11px 14px', borderRadius: 8, marginBottom: 16, backgroundColor: 'rgba(255,193,7,0.05)', border: `1px solid ${colors.status.attention}30` },
  twoCol     : { display: 'flex', gap: 20, alignItems: 'flex-start' },
  rightCol   : { width: 268, flexShrink: 0 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 },
  sectionBox : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, padding: '16px' },
  table      : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden' },
  tableHead  : { display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', backgroundColor: colors.light.muted, borderBottom: `1px solid ${colors.border.light}` },
  headCell   : { fontSize: 9, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.09em' } as React.CSSProperties,
  tableRow   : { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: `1px solid ${colors.border.light}`, transition: 'background 0.12s', userSelect: 'none' } as React.CSSProperties,
  rightCard  : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden' },
  emptyState : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, padding: '36px 20px', textAlign: 'center', color: colors.text.dark },
}
