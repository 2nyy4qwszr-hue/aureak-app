'use client'
// Fiche gardien — vue détaillée club : historique · évals · progression · alertes · parcours football
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getChildThemeProgression, listHistoryByChild, getGoalkeeperDetail, listUpcomingSessionsForIds } from '@aureak/api-client'
import { colors } from '@aureak/theme'
import type { EvaluationSignal, FootballTeamLevel, ChildClubHistory } from '@aureak/types'
import type { ThemeProgressEntry, MasteryStatus } from '@aureak/api-client'

// ── Types ─────────────────────────────────────────────────────────────────────
type DetailAtt = {
  id        : string
  status    : string
  created_at: string
  sessions  : {
    id              : string
    scheduled_at    : string
    duration_minutes: number
    location        : string | null
    implantation_id : string
    implantations   : { name: string } | null
  } | null
}
type DetailEval = {
  session_id  : string
  receptivite : EvaluationSignal
  gout_effort : EvaluationSignal
  attitude    : EvaluationSignal
  top_seance  : 'star' | 'none'
  created_at  : string
}
type CoachNote = {
  note      : string
  updated_at: string
  sessions  : { scheduled_at: string } | null
}
type UpcomingSession = {
  id              : string
  scheduled_at    : string
  duration_minutes: number
  location        : string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRESENT_STATUSES = new Set(['present', 'late', 'trial'])

const STATUS_LABEL: Record<string, string> = {
  present: 'Présent', absent: 'Absent', late: 'En retard', trial: 'Essai', injured: 'Blessé',
}
const STATUS_COLOR: Record<string, string> = {
  present: colors.status.present, late: colors.status.attention,
  trial: colors.accent.gold,      absent: colors.status.absent,
  injured: colors.status.absent,
}
const SIGNAL_ICON : Record<EvaluationSignal, string> = { positive: '✓', attention: '!', none: '–' }
const SIGNAL_COLOR: Record<EvaluationSignal, string> = {
  positive: colors.status.present, attention: colors.status.attention, none: colors.text.muted,
}
const SIGNAL_BG: Record<EvaluationSignal, string> = {
  positive: 'rgba(76,175,80,0.16)', attention: 'rgba(255,193,7,0.16)', none: colors.light.muted,
}
const TEAM_LEVEL_COLOR: Record<FootballTeamLevel, string> = {
  'Provinciaux'      : colors.text.muted,
  'Interprovinciaux' : colors.status.attention,
  'Régionaux'        : '#7C8CF8',
  'Nationaux'        : colors.accent.gold,
  'International'    : colors.status.present,
}

const MASTERY_COLOR: Record<MasteryStatus, string> = {
  not_started: colors.text.muted,
  in_progress: colors.status.attention,
  acquired   : colors.status.present,
  revalidated: colors.accent.gold,
}
const MASTERY_LABEL: Record<MasteryStatus, string> = {
  not_started: 'Non commencé', in_progress: 'En cours', acquired: 'Acquis', revalidated: 'Revalidé',
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateShort(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function daysAgo(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 7)  return `Il y a ${diff} j`
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`
  return `Il y a ${Math.floor(diff / 30)} mois`
}
function rateColor(rate: number | null): string {
  if (rate === null) return colors.text.muted
  if (rate >= 80) return colors.status.present
  if (rate >= 60) return colors.status.attention
  return colors.status.absent
}

// ── Signal dots ───────────────────────────────────────────────────────────────
function SignalDot({ signal, label }: { signal: EvaluationSignal; label: string }) {
  return (
    <div title={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        backgroundColor: SIGNAL_BG[signal],
        border: `1.5px solid ${SIGNAL_COLOR[signal]}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: SIGNAL_COLOR[signal],
      }}>
        {SIGNAL_ICON[signal]}
      </div>
      <div style={{ fontSize: 9, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

// ── Attendance bar (horizontal history) ───────────────────────────────────────
function AttendanceSparkline({ attendances }: { attendances: DetailAtt[] }) {
  const last20 = attendances.slice(0, 20).reverse()
  if (last20.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {last20.map((a, i) => {
        const ok    = PRESENT_STATUSES.has(a.status)
        const color = STATUS_COLOR[a.status] ?? colors.text.muted
        const date  = a.sessions?.scheduled_at ? fmtDateShort(new Date(a.sessions.scheduled_at)) : ''
        return (
          <div
            key={i}
            title={`${date} — ${STATUS_LABEL[a.status] ?? a.status}`}
            style={{
              width: 12, height: ok ? 24 : 9, borderRadius: 3,
              backgroundColor: color, opacity: ok ? 0.82 : 0.45,
              cursor: 'default', transition: 'height 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={G.page}>
      <style>{`@keyframes gk-p{0%,100%{opacity:.12}50%{opacity:.35}} .gk-sk{background:${colors.light.muted};border-radius:6px;animation:gk-p 1.9s ease-in-out infinite}`}</style>
      <div className="gk-sk" style={{ height: 13, width: 110, marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div className="gk-sk" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <div><div className="gk-sk" style={{ height: 28, width: 180, marginBottom: 6 }} /><div className="gk-sk" style={{ height: 13, width: 120 }} /></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[0,1,2,3].map(i => <div key={i} className="gk-sk" style={{ flex: 1, height: 70, borderRadius: 10 }} />)}
      </div>
      {[0,1,2].map(i => <div key={i} className="gk-sk" style={{ height: 200, borderRadius: 10, marginBottom: 14 }} />)}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GoalkeeperDetailPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()

  const [displayName,    setDisplayName]    = useState('')
  const [attendances,    setAttendances]    = useState<DetailAtt[]>([])
  const [evaluations,    setEvaluations]    = useState<DetailEval[]>([])
  const [notes,          setNotes]          = useState<CoachNote[]>([])
  const [themes,         setThemes]         = useState<ThemeProgressEntry[]>([])
  const [upcoming,       setUpcoming]       = useState<UpcomingSession[]>([])
  const [footballHistory,setFootballHistory] = useState<ChildClubHistory[]>([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!childId) return
    const load = async () => {
      try {
      // Profile + attendances + evals in parallel (ARCH-1 compliant)
      const { data: gkData, error: gkError } = await getGoalkeeperDetail(childId)
      if (gkError || !gkData) { return }

      setDisplayName(gkData.displayName ?? '')

      const atts: DetailAtt[] = gkData.attendances.map(a => ({
        id        : a.id,
        status    : a.status,
        created_at: a.createdAt,
        sessions  : a.sessions ? {
          id              : a.sessions.id,
          scheduled_at    : a.sessions.scheduledAt,
          duration_minutes: a.sessions.durationMinutes,
          location        : a.sessions.location,
          implantation_id : a.sessions.implantationId,
          implantations   : a.sessions.implantationName ? { name: a.sessions.implantationName } : null,
        } : null,
      }))
      const evals: DetailEval[] = gkData.evaluations.map(e => ({
        session_id  : e.sessionId,
        receptivite : e.receptivite,
        gout_effort : e.goutEffort,
        attitude    : e.attitude,
        top_seance  : e.topSeance,
        created_at  : e.createdAt,
      }))
      setAttendances(atts)
      setEvaluations(evals)

      // Upcoming sessions
      if (gkData.upcomingSessionIds.length > 0) {
        const { data: upSessions } = await listUpcomingSessionsForIds(gkData.upcomingSessionIds)
        setUpcoming((upSessions ?? []).slice(0, 4).map(s => ({
          id              : s.id,
          scheduled_at    : s.scheduledAt,
          duration_minutes: s.durationMinutes,
          location        : s.location,
        })))
      }

      // Coach notes (may be empty if no RLS access)
      // TODO (ARCH-1): move coach_session_notes query to @aureak/api-client
      const sessionIdsForNotes = atts.map(a => a.sessions?.id).filter(Boolean) as string[]
      if (sessionIdsForNotes.length > 0) {
        // Skipped: direct supabase access for coach_session_notes is out of scope for this sprint
        void sessionIdsForNotes
      }

      // Progression (best-effort — club may or may not have access)
      try {
        const themeData = await getChildThemeProgression(childId)
        setThemes(themeData)
      } catch { /* RLS may deny access */ }

      // Football history (best-effort — RLS filters to linked/affiliated children)
      try {
        const { data: histData } = await listHistoryByChild(childId)
        setFootballHistory(histData)
      } catch { /* RLS may deny access */ }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [childId])

  if (loading) return <Skeleton />

  // ── Computed ──────────────────────────────────────────────────────────────
  const presentCount = attendances.filter(a => PRESENT_STATUSES.has(a.status)).length
  const rate         = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : null
  const rc           = rateColor(rate)
  const topCount     = evaluations.filter(e => e.top_seance === 'star').length
  const evalMap      = new Map(evaluations.map(e => [e.session_id, e]))

  const lastSession  = attendances[0]?.sessions?.scheduled_at
    ? new Date(attendances[0].sessions.scheduled_at)
    : null

  // Alerts
  type AlertItem = { type: 'error' | 'warning' | 'info'; msg: string }
  const alertsList: AlertItem[] = []
  if (rate !== null && rate < 60)   alertsList.push({ type: 'error',   msg: `Assiduité faible : ${rate}% — intervention recommandée` })
  if (rate !== null && rate < 80 && rate >= 60) alertsList.push({ type: 'warning', msg: `Assiduité à surveiller : ${rate}%` })
  if (lastSession && daysAgo(lastSession).includes('mois')) alertsList.push({ type: 'warning', msg: `Dernière présence : ${daysAgo(lastSession)}` })
  if (evaluations.length === 0)     alertsList.push({ type: 'info',    msg: 'Aucune évaluation enregistrée à ce jour' })

  const acquiredThemes  = themes.filter(t => t.masteryStatus === 'acquired' || t.masteryStatus === 'revalidated')
  const inProgressThemes= themes.filter(t => t.masteryStatus === 'in_progress')

  return (
    <div style={G.page}>
      <style>{`
        .gk-back:hover{color:${colors.accent.gold}!important}
        .gk-att:hover{background:rgba(255,255,255,0.02)!important}
        .gk-eval:hover{background:rgba(255,255,255,0.02)!important}
      `}</style>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <button
        className="gk-back"
        style={G.back}
        onClick={() => router.push('/club/dashboard' as never)}
      >
        ← Dashboard club
      </button>

      {/* ── Identity hero ───────────────────────────────────────────────────── */}
      <div style={G.hero}>
        <div style={G.avatar}>{displayName.charAt(0).toUpperCase() || '?'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h1 style={G.name}>{displayName || '—'}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                {rate !== null && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                    border: `1px solid ${rc}40`, backgroundColor: rc + '12', color: rc,
                  }}>
                    {rate}% assiduité
                  </span>
                )}
                {lastSession && (
                  <span style={{ fontSize: 12, color: colors.text.muted }}>
                    Dernière séance : {daysAgo(lastSession)}
                  </span>
                )}
              </div>
            </div>
            {alertsList.some(a => a.type === 'error') && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 5,
                backgroundColor: 'rgba(244,67,54,0.10)', border: `1px solid ${colors.status.absent}40`,
                color: colors.status.absent,
              }}>
                ⚠ Attention requise
              </span>
            )}
          </div>

          {/* Sparkline */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              20 dernières séances
            </div>
            <AttendanceSparkline attendances={attendances} />
          </div>
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div style={G.kpiRow}>
        {[
          { label: 'Séances',     value: attendances.length,     color: colors.accent.gold      },
          { label: 'Présent',     value: presentCount,           color: colors.status.present   },
          { label: 'Assiduité',   value: rate !== null ? `${rate}%` : '–', color: rc           },
          { label: 'Top séance',  value: topCount > 0 ? `⭐ ${topCount}` : '–', color: colors.accent.gold },
        ].map((k, i) => (
          <div key={i} style={G.kpi}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alert panel ──────────────────────────────────────────────────────── */}
      {alertsList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {alertsList.map((a, i) => {
            const color = a.type === 'error' ? colors.status.absent
              : a.type === 'warning' ? colors.status.attention
              : colors.text.muted
            return (
              <div key={i} style={{
                padding: '9px 13px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: color + '08',
                border: `1px solid ${color}30`,
              }}>
                <span style={{ fontSize: 13, color }}>
                  {a.type === 'error' ? '⚠' : a.type === 'warning' ? '◈' : 'ℹ'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{a.msg}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────────────────────── */}
      <div style={G.twoCol}>
        {/* LEFT — attendance + evaluations */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Attendance history */}
          <section>
            <div style={G.sectionLabel}>Historique de présences</div>
            {attendances.length === 0 ? (
              <div style={G.emptyCard}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, color: colors.text.muted }}>Aucune présence enregistrée.</div>
              </div>
            ) : (
              <div style={G.card}>
                {attendances.slice(0, 15).map((a, i) => {
                  const session  = a.sessions
                  const sColor   = STATUS_COLOR[a.status] ?? colors.text.muted
                  const ev       = session ? evalMap.get(session.id) : undefined
                  const implName = (session?.implantations as { name: string } | null)?.name
                  return (
                    <div key={a.id ?? i} className="gk-att" style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                      borderBottom: i < Math.min(attendances.length - 1, 14) ? `1px solid ${colors.border.light}` : 'none',
                      borderLeft: `3px solid ${sColor}`, transition: 'background 0.1s',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                          {session?.scheduled_at ? fmtDate(new Date(session.scheduled_at)) : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: colors.text.muted }}>
                          {session?.duration_minutes ? `${session.duration_minutes} min` : ''}
                          {implName ? ` · ${implName}` : ''}
                          {session?.location ? ` · ${session.location}` : ''}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        border: `1px solid ${sColor}40`, backgroundColor: sColor + '12', color: sColor,
                        flexShrink: 0,
                      }}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                      {ev && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
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
                          {ev.top_seance === 'star' && <span style={{ fontSize: 12 }}>⭐</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
                {attendances.length > 15 && (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: colors.text.muted, textAlign: 'center' }}>
                    + {attendances.length - 15} séances plus anciennes
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Evaluation summary */}
          <section>
            <div style={G.sectionLabel}>Résumé des évaluations</div>
            {evaluations.length === 0 ? (
              <div style={G.emptyCard}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 13, color: colors.text.muted }}>Aucune évaluation enregistrée.</div>
              </div>
            ) : (
              <div style={G.card}>
                {/* Aggregated signals */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.border.light}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Distribution sur {evaluations.length} éval{evaluations.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {(['receptivite', 'gout_effort', 'attitude'] as const).map(key => {
                      const posCount = evaluations.filter(e => e[key] === 'positive').length
                      const attCount = evaluations.filter(e => e[key] === 'attention').length
                      const noneCount= evaluations.filter(e => e[key] === 'none').length
                      const total    = evaluations.length
                      const label    = key === 'gout_effort' ? 'Effort' : key === 'receptivite' ? 'Réceptivité' : 'Attitude'
                      const posRate  = Math.round((posCount / total) * 100)
                      return (
                        <div key={key} style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.muted, marginBottom: 8 }}>{label}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {[
                              { label: '✓', count: posCount, color: colors.status.present },
                              { label: '!', count: attCount, color: colors.status.attention },
                              { label: '–', count: noneCount, color: colors.text.muted },
                            ].map((seg, si) => (
                              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, width: 12, textAlign: 'center', color: seg.color, fontWeight: 700 }}>{seg.label}</span>
                                <div style={{ flex: 1, height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${total > 0 ? Math.round((seg.count / total) * 100) : 0}%`, backgroundColor: seg.color, borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 11, color: seg.color, fontWeight: 600, width: 20, textAlign: 'right' }}>{seg.count}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: posRate >= 70 ? colors.status.present : posRate >= 40 ? colors.status.attention : colors.text.muted, marginTop: 6 }}>
                            {posRate}% positif
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recent evals timeline */}
                {evaluations.slice(0, 6).map((ev, i) => (
                  <div key={i} className="gk-eval" style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
                    borderBottom: i < Math.min(evaluations.length - 1, 5) ? `1px solid ${colors.border.light}` : 'none',
                    transition: 'background 0.1s',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.muted }}>
                        {new Date(ev.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <SignalDot signal={ev.receptivite} label="Réc." />
                      <SignalDot signal={ev.gout_effort}  label="Effort" />
                      <SignalDot signal={ev.attitude}     label="Att." />
                    </div>
                    {ev.top_seance === 'star' && <span style={{ fontSize: 14 }}>⭐</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT column */}
        <div style={G.rightCol}>

          {/* Upcoming sessions */}
          <section style={{ marginBottom: 20 }}>
            <div style={G.sectionLabel}>Prochaines séances</div>
            {upcoming.length === 0 ? (
              <div style={{ ...G.sideCard, padding: '18px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>📅</div>
                <div style={{ fontSize: 12, color: colors.text.muted }}>Aucune séance à venir</div>
              </div>
            ) : (
              <div style={G.sideCard}>
                {upcoming.map((s, i) => {
                  const d    = new Date(s.scheduled_at)
                  const days = Math.ceil((d.getTime() - Date.now()) / 86400000)
                  return (
                    <div key={s.id} style={{
                      padding: '10px 12px',
                      borderBottom: i < upcoming.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{fmtDate(d)}</div>
                          <div style={{ fontSize: 11, color: colors.text.muted }}>
                            {fmtTime(d)} · {s.duration_minutes} min{s.location ? ` · ${s.location}` : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                          backgroundColor: days <= 3 ? 'rgba(193,172,92,0.10)' : colors.light.muted,
                          color: days <= 3 ? colors.accent.gold : colors.text.muted,
                          border: `1px solid ${days <= 3 ? colors.accent.gold + '40' : colors.border.light}`,
                        }}>
                          {days === 0 ? "Auj." : days === 1 ? 'Dem.' : `J-${days}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Progression overview */}
          {themes.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <div style={G.sectionLabel}>Progression pédagogique</div>
              <div style={G.sideCard}>
                {/* Overview bar */}
                <div style={{ padding: '12px 12px 8px' }}>
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
                    {[
                      { count: acquiredThemes.length,   color: colors.status.present   },
                      { count: inProgressThemes.length, color: colors.status.attention },
                      { count: themes.filter(t => t.masteryStatus === 'not_started').length, color: colors.light.muted },
                    ].map((seg, i) => seg.count > 0 && (
                      <div key={i} style={{ flex: seg.count, backgroundColor: seg.color, borderRadius: 2 }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors.status.present }} />
                      <span style={{ fontSize: 11, color: colors.text.muted }}>Acquis</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.status.present }}>{acquiredThemes.length}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors.status.attention }} />
                      <span style={{ fontSize: 11, color: colors.text.muted }}>En cours</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.status.attention }}>{inProgressThemes.length}</span>
                    </div>
                  </div>
                </div>
                {/* Theme rows */}
                {themes.filter(t => t.masteryStatus !== 'not_started').slice(0, 5).map(t => {
                  const c = MASTERY_COLOR[t.masteryStatus]
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderTop: `1px solid ${colors.border.light}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 500, flex: 1, marginRight: 8, color: colors.text.dark }}>{t.name}</div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        border: `1px solid ${c}40`, backgroundColor: c + '10', color: c,
                        whiteSpace: 'nowrap',
                      }}>
                        {MASTERY_LABEL[t.masteryStatus]}
                      </span>
                    </div>
                  )
                })}
                {themes.filter(t => t.masteryStatus !== 'not_started').length === 0 && (
                  <div style={{ padding: '10px 12px', fontSize: 12, color: colors.text.muted, borderTop: `1px solid ${colors.border.light}` }}>
                    Aucun thème commencé
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Coach notes */}
          {notes.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <div style={G.sectionLabel}>Observations coach</div>
              <div style={G.sideCard}>
                {notes.map((n, i) => (
                  <div key={i} style={{
                    padding: '11px 12px',
                    borderBottom: i < notes.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                  }}>
                    {n.sessions?.scheduled_at && (
                      <div style={{ fontSize: 10, color: colors.text.muted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {fmtDate(new Date(n.sessions.scheduled_at))}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: colors.text.dark, lineHeight: 1.5, fontStyle: 'italic' }}>
                      "{n.note}"
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Football history */}
          {footballHistory.length > 0 && (
            <section>
              <div style={G.sectionLabel}>Parcours football</div>
              <div style={G.sideCard}>
                {/* Affiliation summary */}
                <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${colors.border.light}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: colors.text.muted }}>
                      {footballHistory.length} saison{footballHistory.length > 1 ? 's' : ''}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      border: `1px solid ${colors.status.present}40`,
                      backgroundColor: colors.status.present + '10',
                      color: colors.status.present,
                    }}>
                      {footballHistory.filter(h => h.isAffiliated).length} affilié{footballHistory.filter(h => h.isAffiliated).length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {footballHistory.map((entry, i) => {
                  const lvlColor = entry.teamLevel ? TEAM_LEVEL_COLOR[entry.teamLevel] : colors.text.muted
                  return (
                    <div key={entry.id} style={{
                      padding: '10px 12px',
                      borderBottom: i < footballHistory.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                          backgroundColor: 'rgba(193,172,92,0.10)',
                          border: `1px solid ${colors.accent.gold}40`,
                          color: colors.accent.gold, letterSpacing: '0.04em',
                        }}>
                          {entry.season}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                            backgroundColor: colors.light.muted,
                            border: `1px solid ${colors.border.light}`,
                            color: colors.text.muted,
                          }}>
                            {entry.ageCategory}
                          </span>
                          {entry.isAffiliated && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                              backgroundColor: colors.status.present + '10',
                              border: `1px solid ${colors.status.present}40`,
                              color: colors.status.present,
                            }}>✓</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark, marginBottom: 2 }}>
                        {entry.clubName}
                      </div>
                      {entry.teamLevel && (
                        <div style={{ fontSize: 11, color: lvlColor, fontWeight: 500 }}>
                          {entry.teamLevel}
                        </div>
                      )}
                      {entry.notes && (
                        <div style={{ fontSize: 11, color: colors.text.muted, fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const G: Record<string, React.CSSProperties> = {
  page       : { padding: '24px 30px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 1050 },
  back       : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 18, transition: 'color 0.15s', display: 'block' },
  hero       : { display: 'flex', alignItems: 'flex-start', gap: 18, padding: '20px 20px', backgroundColor: colors.light.surface, borderRadius: 12, border: `1px solid ${colors.border.light}`, marginBottom: 16 },
  avatar     : { width: 56, height: 56, borderRadius: '50%', backgroundColor: colors.accent.gold, color: colors.text.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 },
  name       : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: 0 },
  kpiRow     : { display: 'flex', backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden', marginBottom: 16 },
  kpi        : { flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${colors.border.light}` },
  twoCol     : { display: 'flex', gap: 20, alignItems: 'flex-start' },
  rightCol   : { width: 272, flexShrink: 0 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 },
  card       : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden' },
  sideCard   : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden' },
  emptyCard  : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, padding: '28px 16px', textAlign: 'center', color: colors.text.dark },
}
