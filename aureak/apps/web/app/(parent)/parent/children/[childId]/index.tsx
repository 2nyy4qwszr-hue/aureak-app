'use client'
// Fiche enfant — mini-chart présences + signaux d'évaluation
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getChildProfile, supabase } from '@aureak/api-client'
import { colors } from '@aureak/theme'
import type { EvaluationSignal } from '@aureak/types'

type AttendanceRow = {
  id       : string
  status   : string
  sessions?: { scheduled_at: string; groups?: { name: string } | null } | null
}
type EvalRow = {
  session_id  : string
  receptivite : EvaluationSignal
  gout_effort : EvaluationSignal
  attitude    : EvaluationSignal
  top_seance  : 'star' | 'none'
}

const PRESENT_STATUSES = new Set(['present', 'late', 'trial'])

const STATUS_LABEL: Record<string, string> = {
  present: 'Présent', absent: 'Absent', late: 'En retard', trial: 'Essai', injured: 'Blessé',
}
const STATUS_COLOR: Record<string, string> = {
  present: colors.status.present,
  late   : colors.status.attention,
  trial  : colors.accent.gold,
  absent : colors.status.absent,
  injured: colors.status.absent,
}

const SIGNAL_ICON : Record<EvaluationSignal, string> = { positive: '✓', attention: '!', none: '–' }
const SIGNAL_COLOR: Record<EvaluationSignal, string> = {
  positive : colors.status.present,
  attention: colors.status.attention,
  none     : colors.text.secondary,
}
const SIGNAL_BG: Record<EvaluationSignal, string> = {
  positive : 'rgba(76,175,80,0.14)',
  attention: 'rgba(255,193,7,0.14)',
  none     : colors.background.elevated,
}

// Colored square per session (mini attendance chart)
function AttMiniChart({ attendances }: { attendances: AttendanceRow[] }) {
  const last15 = [...attendances].reverse().slice(0, 15)
  if (last15.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
      {last15.map((att, i) => {
        const isPresent = PRESENT_STATUSES.has(att.status)
        const isAbsent  = att.status === 'absent'
        const color     = isPresent ? colors.status.present : isAbsent ? colors.status.absent : colors.text.secondary
        const date      = att.sessions?.scheduled_at
          ? new Date(att.sessions.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
          : ''
        return (
          <div
            key={att.id ?? i}
            title={`${date ? date + ' — ' : ''}${STATUS_LABEL[att.status] ?? att.status}`}
            style={{
              width          : 14,
              height         : 28,
              borderRadius   : 3,
              backgroundColor: color + '33',
              border         : `1px solid ${color}`,
              position       : 'relative',
              cursor         : 'default',
            }}
          >
            <div style={{
              position       : 'absolute',
              bottom         : 0,
              left           : 0,
              right          : 0,
              height         : isPresent ? '100%' : isAbsent ? '30%' : '55%',
              backgroundColor: color,
              borderRadius   : 2,
              opacity        : 0.7,
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Sub-nav ────────────────────────────────────────────────────────────────────
function SubNav({ childId, active }: { childId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Fiche',       href: `/parent/children/${childId}`                   },
    { label: 'Séances',     href: `/parent/children/${childId}/sessions`          },
    { label: 'Progression', href: `/parent/children/${childId}/progress`          },
    { label: 'Football',    href: `/parent/children/${childId}/football-history`  },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.accent.zinc}`, marginBottom: 20 }}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            padding        : '10px 20px',
            background     : 'none',
            border         : 'none',
            cursor         : 'pointer',
            fontWeight     : 600,
            fontSize       : 13,
            color          : active === tab.label ? colors.accent.gold : colors.text.secondary,
            borderBottom   : `2px solid ${active === tab.label ? colors.accent.gold : 'transparent'}`,
            transition     : 'color 0.15s',
          }}
          onClick={() => router.push(tab.href as never)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={P.page}>
      <style>{`@keyframes cp{0%,100%{opacity:.15}50%{opacity:.42}} .cs{background:${colors.background.elevated};border-radius:6px;animation:cp 1.8s ease-in-out infinite}`}</style>
      <div className="cs" style={{ height: 14, width: 120, marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div className="cs" style={{ width: 52, height: 52, borderRadius: 26 }} />
        <div><div className="cs" style={{ height: 26, width: 160, marginBottom: 6 }} /><div className="cs" style={{ height: 13, width: 100 }} /></div>
      </div>
      <div className="cs" style={{ height: 38, borderRadius: 0, marginBottom: 20, width: '100%' }} />
      <div className="cs" style={{ height: 80, borderRadius: 10, marginBottom: 20 }} />
      {[0,1,2,3,4].map(i => <div key={i} className="cs" style={{ height: 64, borderRadius: 10, marginBottom: 8 }} />)}
    </div>
  )
}

export default function ChildFichePage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [attendances, setAttendances] = useState<AttendanceRow[]>([])
  const [evaluations, setEvaluations] = useState<EvalRow[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const [profileRes, childRes] = await Promise.all([
        getChildProfile(childId, { months: 3 }),
        supabase.from('profiles').select('display_name').eq('user_id', childId).single(),
      ])
      setDisplayName((childRes.data as { display_name: string } | null)?.display_name ?? '')
      setAttendances(profileRes.attendances as unknown as AttendanceRow[])
      setEvaluations(profileRes.evaluations as EvalRow[])
      setLoading(false)
    }
    load()
  }, [childId])

  if (loading) return <Skeleton />

  const presentCount = attendances.filter(a => PRESENT_STATUSES.has(a.status)).length
  const rate         = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : null
  const topCount     = evaluations.filter(e => e.top_seance === 'star').length
  const initial      = displayName.charAt(0).toUpperCase() || '?'

  // Build eval map by session id
  const evalMap = new Map(evaluations.map(e => [e.session_id, e]))

  const rateColor = rate === null ? colors.text.secondary
    : rate >= 80 ? colors.status.present
    : rate >= 60 ? colors.status.attention
    : colors.status.absent

  return (
    <div style={P.page}>
      <style>{`.p-back:hover{color:${colors.accent.gold}} .p-nav-btn:hover{opacity:.8}`}</style>

      <button className="p-back" style={P.back} onClick={() => router.push('/parent/dashboard' as never)}>
        ← Dashboard
      </button>

      {/* Child header */}
      <div style={P.childHeader}>
        <div style={P.avatar}>{initial}</div>
        <div>
          <h1 style={P.name}>{displayName || '…'}</h1>
          <div style={{ fontSize: 12, color: colors.text.secondary }}>3 derniers mois</div>
        </div>
      </div>

      <SubNav childId={childId} active="Fiche" />

      {/* KPI row */}
      <div style={P.kpiRow}>
        {[
          { value: attendances.length, label: 'Séances',     color: colors.accent.gold         },
          { value: presentCount,       label: 'Présences',   color: colors.status.present      },
          { value: rate !== null ? `${rate}%` : '–', label: 'Assiduité', color: rateColor     },
          { value: topCount > 0 ? `⭐ ${topCount}` : '0', label: 'Top séance', color: colors.accent.gold },
        ].map((kpi, i) => (
          <div key={i} style={P.kpi}>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={P.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Attendance bar */}
      {attendances.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Assiduité (15 dernières séances)
            </div>
            <div style={{ fontSize: 12, color: rateColor, fontWeight: 700 }}>
              {rate !== null ? `${rate}%` : '–'}
            </div>
          </div>
          <AttMiniChart attendances={attendances} />
          <div style={{ height: 4, backgroundColor: colors.background.elevated, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${rate ?? 0}%`,
              backgroundColor: rateColor,
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Recent attendances */}
      <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Présences récentes
      </div>

      {attendances.length === 0 ? (
        <div style={{ color: colors.text.secondary, fontSize: 14 }}>Aucune présence enregistrée sur cette période.</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attendances.slice(0, 10).map((att, idx) => {
              const ev      = evalMap.get(att.sessions?.scheduled_at ?? '')
              const session = att.sessions
              const color   = STATUS_COLOR[att.status] ?? colors.text.secondary
              return (
                <div key={att.id ?? idx} style={{ ...P.attRow, borderLeft: `3px solid ${color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {session?.scheduled_at
                        ? new Date(session.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
                        : '–'}
                    </div>
                    {session?.groups?.name && (
                      <div style={{ fontSize: 12, color: colors.text.secondary }}>{session.groups.name}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color, padding: '3px 8px', borderRadius: 5, border: `1px solid ${color + '40'}`, backgroundColor: color + '12' }}>
                    {STATUS_LABEL[att.status] ?? att.status}
                  </span>
                  {ev && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {(['receptivite', 'gout_effort', 'attitude'] as const).map(key => (
                        <div
                          key={key}
                          title={key === 'gout_effort' ? 'Effort' : key.charAt(0).toUpperCase() + key.slice(1)}
                          style={{
                            width          : 22,
                            height         : 22,
                            borderRadius   : '50%',
                            backgroundColor: SIGNAL_BG[ev[key]],
                            border         : `1px solid ${SIGNAL_COLOR[ev[key]]}`,
                            display        : 'flex',
                            alignItems     : 'center',
                            justifyContent : 'center',
                            fontSize       : 11,
                            fontWeight     : 700,
                            color          : SIGNAL_COLOR[ev[key]],
                          }}
                        >
                          {SIGNAL_ICON[ev[key]]}
                        </div>
                      ))}
                      {ev.top_seance === 'star' && <span style={{ fontSize: 14 }}>⭐</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {attendances.length > 10 && (
            <button
              className="p-nav-btn"
              style={P.seeAll}
              onClick={() => router.push(`/parent/children/${childId}/sessions` as never)}
            >
              Voir tout l'historique →
            </button>
          )}
        </>
      )}
    </div>
  )
}

const P: Record<string, React.CSSProperties> = {
  page       : { padding: '28px 32px', backgroundColor: colors.background.primary, minHeight: '100vh', color: colors.text.primary, maxWidth: 780 },
  back       : { fontSize: 13, color: colors.text.secondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: 'color 0.15s' },
  childHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar     : { width: 52, height: 52, borderRadius: '50%', backgroundColor: colors.accent.gold, color: colors.text.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 },
  name       : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: 0 },
  kpiRow     : { display: 'flex', backgroundColor: colors.background.surface, borderRadius: 10, border: `1px solid ${colors.accent.zinc}`, overflow: 'hidden', marginBottom: 20 },
  kpi        : { flex: 1, padding: '16px 0', textAlign: 'center', borderRight: `1px solid ${colors.accent.zinc}` },
  kpiLabel   : { fontSize: 10, color: colors.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 },
  attRow     : { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: colors.background.surface, borderRadius: '0 10px 10px 0', padding: '12px 14px', border: `1px solid ${colors.accent.zinc}` },
  seeAll     : { display: 'block', width: '100%', padding: '12px', textAlign: 'center', color: colors.accent.gold, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 },
}
