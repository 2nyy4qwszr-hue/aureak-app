'use client'
// Feuille de présence terrain — saisie rapide + actions globales
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById, recordAttendance, listAttendancesBySession,
  prefillSessionAttendees, supabase,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import type { Session, Attendance } from '@aureak/types'
import type { AttendanceStatus } from '@aureak/types'

type ChildRow = { childId: string; displayName: string; status: AttendanceStatus | null }

const STATUS_OPTIONS: {
  value  : AttendanceStatus
  label  : string
  color  : string
  bg     : string
}[] = [
  { value: 'present', label: 'Présent',    color: colors.status.present,   bg: 'rgba(76,175,80,0.14)'   },
  { value: 'late',    label: 'En retard',  color: colors.status.attention,  bg: 'rgba(255,193,7,0.14)'   },
  { value: 'trial',   label: 'Essai',      color: colors.accent.gold,       bg: 'rgba(193,172,92,0.14)'  },
  { value: 'absent',  label: 'Absent',     color: colors.text.secondary,    bg: colors.background.elevated },
  { value: 'injured', label: 'Blessé',     color: colors.status.absent,     bg: 'rgba(244,67,54,0.10)'   },
]

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  return (
    <div style={A.page}>
      <style>{`@keyframes ap{0%,100%{opacity:.15}50%{opacity:.42}} .as{background:${colors.background.elevated};border-radius:6px;animation:ap 1.8s ease-in-out infinite}`}</style>
      <button style={A.back} onClick={() => router.push('/coach/sessions' as never)}>← Mes séances</button>
      <div className="as" style={{ height: 28, width: 280, marginBottom: 8 }} />
      <div className="as" style={{ height: 14, width: 180, marginBottom: 24 }} />
      <div style={A.subNav}>
        {['Présences', 'Évaluations'].map(t => (
          <div key={t} className="as" style={{ height: 24, width: 80 }} />
        ))}
      </div>
      {[0,1,2,3,4,5].map(i => (
        <div key={i} className="as" style={{ height: 64, borderRadius: 10, marginBottom: 8 }} />
      ))}
    </div>
  )
}

// ── Sub-nav ───────────────────────────────────────────────────────────────────
function SubNav({ sessionId, active }: { sessionId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Présences',   href: `/coach/sessions/${sessionId}/attendance`  },
    { label: 'Évaluations', href: `/coach/sessions/${sessionId}/evaluations` },
  ]
  return (
    <div style={A.subNav}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            ...A.subNavBtn,
            color      : active === tab.label ? colors.accent.gold : colors.text.secondary,
            borderBottom: `2px solid ${active === tab.label ? colors.accent.gold : 'transparent'}`,
          }}
          onClick={() => router.push(tab.href as never)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default function AttendancePage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const user          = useAuthStore(s => s.user)
  const tenantId      = useAuthStore(s => s.tenantId)

  const [session,  setSession]  = useState<Session | null>(null)
  const [children, setChildren] = useState<ChildRow[]>([])
  const [saving,   setSaving]   = useState<string | null>(null)
  const [allSaving, setAllSaving] = useState(false)
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    const [sessionRes, attendanceRes] = await Promise.all([
      getSessionById(sessionId),
      listAttendancesBySession(sessionId),
    ])
    setSession(sessionRes.data)

    let { data: attendees } = await supabase
      .from('session_attendees').select('child_id').eq('session_id', sessionId)

    if (!attendees || attendees.length === 0) {
      await prefillSessionAttendees(sessionId)
      const refilled = await supabase.from('session_attendees').select('child_id').eq('session_id', sessionId)
      attendees = refilled.data ?? []
    }

    const childIds = (attendees ?? []).map((a: { child_id: string }) => a.child_id)
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name').in('user_id', childIds)

    const profileMap = new Map((profiles ?? []).map((p: { user_id: string; display_name: string }) => [p.user_id, p.display_name]))
    const statusMap  = new Map((attendanceRes.data as Attendance[]).map(a => [a.childId, a.status]))

    setChildren(childIds.map((childId: string) => ({
      childId,
      displayName: profileMap.get(childId) ?? childId.slice(0, 8),
      status     : statusMap.get(childId) ?? null,
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [sessionId])

  const handleStatus = async (childId: string, status: AttendanceStatus) => {
    if (!user?.id || !tenantId) return
    setSaving(childId)
    setChildren(prev => prev.map(c => c.childId === childId ? { ...c, status } : c))
    await recordAttendance({ sessionId, childId, tenantId, status, recordedBy: user.id })
    setSaving(null)
  }

  const handleAllPresent = async () => {
    if (!user?.id || !tenantId || allSaving) return
    setAllSaving(true)
    setChildren(prev => prev.map(c => ({ ...c, status: 'present' })))
    await Promise.all(
      children.map(c =>
        recordAttendance({ sessionId, childId: c.childId, tenantId, status: 'present', recordedBy: user.id })
      )
    )
    setAllSaving(false)
  }

  if (loading) return <Skeleton sessionId={sessionId} />

  const presentCount = children.filter(c =>
    c.status === 'present' || c.status === 'late' || c.status === 'trial'
  ).length

  return (
    <div style={A.page}>
      <style>{`
        .a-back:hover{color:${colors.accent.gold}}
        .a-sbtn:hover{opacity:.8}
        .a-allp:hover:not(:disabled){opacity:.88}
      `}</style>

      <button className="a-back" style={A.back} onClick={() => router.push('/coach/sessions' as never)}>
        ← Mes séances
      </button>

      {session && (
        <div style={{ marginBottom: 16 }}>
          <h1 style={A.title}>
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h1>
          <div style={A.subtitle}>
            {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {` · ${session.durationMinutes} min`}
            {session.location ? ` · ${session.location}` : ''}
          </div>
        </div>
      )}

      <SubNav sessionId={sessionId} active="Présences" />

      {/* KPI + Quick action */}
      {children.length > 0 && (
        <div style={A.kpiBar}>
          <div style={A.kpiGroup}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: colors.status.present }}>{presentCount}</span>
            <span style={{ fontSize: 13, color: colors.text.secondary }}>/ {children.length} présents</span>
            <span style={{ fontSize: 13, color: colors.text.secondary }}>·</span>
            <span style={{ fontSize: 13, color: colors.accent.gold, fontWeight: 600 }}>
              {children.length > 0 ? Math.round((presentCount / children.length) * 100) : 0}%
            </span>
          </div>
          <button
            className="a-allp"
            style={A.btnAllPresent}
            onClick={handleAllPresent}
            disabled={allSaving}
          >
            {allSaving ? 'Sauvegarde…' : '✓ Tous présents'}
          </button>
        </div>
      )}

      {/* Children list */}
      {children.length === 0 ? (
        <div style={A.empty}>Aucun joueur inscrit à cette séance.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children.map(child => {
            const isSaving = saving === child.childId
            return (
              <div key={child.childId} style={A.childCard}>
                <div style={A.childName}>{child.displayName}</div>
                <div style={A.statusBtns}>
                  {STATUS_OPTIONS.map(opt => {
                    const isSelected = child.status === opt.value
                    return (
                      <button
                        key={opt.value}
                        className="a-sbtn"
                        style={{
                          ...A.statusBtn,
                          color          : isSelected ? opt.color : colors.text.secondary,
                          borderColor    : isSelected ? opt.color : colors.accent.zinc,
                          backgroundColor: isSelected ? opt.bg : 'transparent',
                          fontWeight     : isSelected ? 700 : 500,
                          opacity        : isSaving ? 0.5 : 1,
                        }}
                        onClick={() => handleStatus(child.childId, opt.value)}
                        disabled={isSaving}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const A: Record<string, React.CSSProperties> = {
  page       : { padding: '28px 32px', backgroundColor: colors.background.primary, minHeight: '100vh', color: colors.text.primary, maxWidth: 780 },
  back       : { fontSize: 13, color: colors.text.secondary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: 'color 0.15s' },
  title      : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 4px' },
  subtitle   : { fontSize: 13, color: colors.text.secondary },
  subNav     : { display: 'flex', gap: 0, borderBottom: `1px solid ${colors.accent.zinc}`, marginBottom: 20 },
  subNavBtn  : { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'color 0.15s', paddingBottom: 10 },
  kpiBar     : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: colors.background.surface, borderRadius: 10, border: `1px solid ${colors.accent.zinc}`, marginBottom: 16 },
  kpiGroup   : { display: 'flex', alignItems: 'center', gap: 8 },
  btnAllPresent: { padding: '8px 18px', borderRadius: 7, border: 'none', backgroundColor: colors.status.present, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'opacity 0.15s' },
  childCard  : { backgroundColor: colors.background.surface, borderRadius: 10, padding: '12px 16px', border: `1px solid ${colors.accent.zinc}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  childName  : { fontSize: 14, fontWeight: 600, minWidth: 120, flexShrink: 0 },
  statusBtns : { display: 'flex', gap: 6, flexWrap: 'wrap' },
  statusBtn  : { padding: '5px 12px', borderRadius: 6, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.12s' },
  empty      : { color: colors.text.secondary, fontSize: 14, padding: '40px 0', textAlign: 'center' },
}
