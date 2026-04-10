'use client'
// Dashboard Admin Présences — Story 33.1
// Vue Jour/Semaine/Mois + cartes séances + correction inline + gestion essais
import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  listSessionsWithPresence, getSessionAttendanceDetail,
  correctAttendance, updateCoachPresence,
  addTrialAttendance, listTrialConversionSuggestions, convertTrialToMember,
  listImplantations, listAllGroups, listChildDirectory,
} from '@aureak/api-client'
import type {
  SessionPresenceSummary, AttendanceCorrection,
  CoachPresenceType,
} from '@aureak/types'
import type {
  PresenceCardFilters, SessionAttendanceDetail, AttendeeWithStatus, CoachPresenceRow,
  TrialConversionSuggestion,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, fonts, shadows, radius, space, transitions } from '@aureak/theme'

// ── Types ──────────────────────────────────────────────────────────────────────

type TimeView = 'day' | 'week' | 'month'

const STATUS_LABELS: Record<string, string> = {
  present: 'Présent',
  absent : 'Absent',
  late   : 'Retard',
  injured: 'Blessé',
  trial  : 'Essai',
}

const STATUS_COLORS: Record<string, string> = {
  present: colors.status.present,
  absent : colors.status.absent,
  late   : colors.status.attention,
  injured: colors.accent.gold,
  trial  : colors.status.info,
}

function statusColor(s: string | null): string {
  return s ? (STATUS_COLORS[s] ?? colors.text.subtle) : colors.text.subtle
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

// ── Session Status Badge ───────────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: string }) {
  let badgeColor: string
  let label: string

  if (status === 'en_cours') {
    badgeColor = colors.accent.gold
    label = 'En cours'
  } else if (status === 'terminée' || status === 'réalisée') {
    badgeColor = colors.status.neutral
    label = 'Terminée'
  } else if (status === 'annulée') {
    badgeColor = colors.status.absent
    label = 'Annulée'
  } else {
    badgeColor = colors.text.subtle
    label = status
  }

  return (
    <span style={{
      fontSize       : 10,
      fontWeight     : 700,
      color          : badgeColor,
      background     : badgeColor + '18',
      padding        : '2px 7px',
      borderRadius   : radius.badge,
      textTransform  : 'uppercase' as const,
      letterSpacing  : 0.5,
      fontFamily     : fonts.display,
      whiteSpace     : 'nowrap' as const,
    }}>
      {label}
    </span>
  )
}

// ── Inline Progress Bar ────────────────────────────────────────────────────────

function PresenceProgressBar({ rate }: { rate: number }) {
  const barColor = rate >= 80
    ? colors.status.present
    : rate >= 60
      ? colors.status.attention
      : colors.status.absent

  return (
    <div style={{
      height          : 4,
      borderRadius    : 2,
      background      : colors.border.divider,
      overflow        : 'hidden' as const,
    }}>
      <div style={{
        height          : 4,
        borderRadius    : 2,
        width           : `${Math.min(rate, 100)}%`,
        background      : barColor,
        transition      : `width ${transitions.normal}`,
      }} />
    </div>
  )
}

// ── Presence Card ─────────────────────────────────────────────────────────────

function PresenceCard({
  session, groupName, onClick,
}: {
  session   : SessionPresenceSummary
  groupName : string
  onClick   : () => void
}) {
  const presents = session.memberPresent + session.trialPresent
  const total    = presents + session.absentCount
  const rate     = total > 0 ? Math.round((presents / total) * 100) : 0
  const hasDebrief = session.closedAt != null

  return (
    <div
      onClick={onClick}
      style={{
        background    : colors.light.surface,
        borderRadius  : radius.card,
        padding       : `${space.sm}px 14px`,
        boxShadow     : shadows.sm,
        border        : `1px solid ${colors.border.divider}`,
        cursor        : 'pointer',
        transition    : `box-shadow ${transitions.fast}`,
        fontFamily    : fonts.body,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = shadows.md)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = shadows.sm)}
    >
      {/* Row 1 : Date + badge statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.text.muted, fontFamily: fonts.body }}>
          {fmtDate(session.scheduledAt)} · {fmtTime(session.scheduledAt)}
        </span>
        <SessionStatusBadge status={session.sessionStatus} />
      </div>

      {/* Row 2 : Nom du groupe */}
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark, marginBottom: 6, fontFamily: fonts.body }}>
        {groupName}
      </div>

      {/* Row 3 : ProgressBar inline */}
      <div style={{ marginBottom: 6 }}>
        <PresenceProgressBar rate={rate} />
      </div>

      {/* Row 4 : KPI compact ligne */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 12, color: colors.status.present, fontFamily: fonts.body }}>
          ✓ {session.memberPresent}
        </span>
        <span style={{ fontSize: 12, color: colors.status.absent, fontFamily: fonts.body }}>
          ✗ {session.absentCount}
        </span>
        {session.trialPresent > 0 && (
          <span style={{ fontSize: 12, color: colors.status.info, fontFamily: fonts.body }}>
            ⊕ {session.trialPresent}
          </span>
        )}
        {session.unconfirmedCount > 0 && (
          <span style={{ fontSize: 12, color: colors.text.subtle, fontFamily: fonts.body }}>
            ? {session.unconfirmedCount}
          </span>
        )}
        <span style={{
          marginLeft   : 'auto',
          fontSize     : 12,
          fontWeight   : 700,
          color        : rate >= 80 ? colors.status.present : rate >= 60 ? colors.status.attention : colors.status.absent,
          fontFamily   : fonts.display,
        }}>
          {total > 0 ? `${rate}%` : '—'}
        </span>
        <span style={{ fontSize: 10, color: hasDebrief ? colors.status.present : colors.text.subtle, fontFamily: fonts.body }}>
          {hasDebrief ? '✓' : '○'}
        </span>
      </div>
    </div>
  )
}

// ── Attendance Detail Drawer ───────────────────────────────────────────────────

function AttendanceDetailDrawer({
  sessionId, groupName, tenantId, adminId, onClose,
}: {
  sessionId  : string
  groupName  : string
  tenantId   : string
  adminId    : string
  onClose    : () => void
}) {
  const [detail,   setDetail]   = useState<SessionAttendanceDetail | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState<string | null>(null)
  const [showTrial, setShowTrial] = useState(false)
  const [trialSearch, setTrialSearch] = useState('')
  const [trialResults, setTrialResults] = useState<{ id: string; displayName: string }[]>([])
  const [addingTrial, setAddingTrial] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getSessionAttendanceDetail(sessionId)
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { loadDetail() }, [loadDetail])

  const handleCorrect = async (attendee: AttendeeWithStatus, newStatus: string) => {
    setSaving(attendee.childId)
    try {
      await correctAttendance({
        tenantId,
        sessionId,
        childId   : attendee.childId,
        newStatus,
        adminId,
        oldStatus : attendee.status ?? undefined,
      })
      await loadDetail()
    } finally {
      setSaving(null)
    }
  }

  const handleCoachPresence = async (coach: CoachPresenceRow, type: CoachPresenceType) => {
    setSaving(`coach-${coach.coachId}`)
    try {
      await updateCoachPresence({ tenantId, sessionId, coachId: coach.coachId, presenceType: type })
      await loadDetail()
    } finally {
      setSaving(null)
    }
  }

  const handleTrialSearch = async (query: string) => {
    setTrialSearch(query)
    if (query.length < 2) { setTrialResults([]); return }
    const { data } = await listChildDirectory({ search: query, pageSize: 8 })
    setTrialResults((data ?? []).map(d => ({
      id          : d.id,
      displayName : d.displayName,
    })))
  }

  const handleAddTrial = async (childId: string) => {
    setAddingTrial(childId)
    try {
      await addTrialAttendance({ tenantId, sessionId, childId })
      setShowTrial(false)
      setTrialSearch('')
      setTrialResults([])
      await loadDetail()
    } finally {
      setAddingTrial(null)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: colors.overlay.dark,
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background  : colors.light.surface,
          width       : '100%',
          maxWidth    : 560,
          height      : '100%',
          overflowY   : 'auto',
          boxShadow   : shadows.lg,
          padding     : 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text.dark }}>
            {groupName} — Présences
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: colors.text.muted }}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
        ) : !detail ? (
          <div style={{ color: colors.status.absent, fontSize: 13 }}>Erreur de chargement.</div>
        ) : (
          <>
            {/* ── Enfants ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Joueurs ({detail.attendees.length})
              </div>

              {detail.attendees.map(a => (
                <div
                  key={a.childId}
                  style={{
                    display       : 'flex',
                    alignItems    : 'center',
                    gap           : 10,
                    padding       : '8px 0',
                    borderBottom  : `1px solid ${colors.border.divider}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: colors.text.dark }}>
                      {a.displayName}
                    </span>
                    {a.attendanceType === 'trial' && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: colors.status.info, background: colors.status.info + '18', padding: '1px 5px', borderRadius: radius.badge }}>
                        🔵 Essai
                      </span>
                    )}
                    {a.correctedByAdmin && (
                      <span style={{ marginLeft: 4, fontSize: 10, color: colors.accent.gold }}>
                        ✎
                      </span>
                    )}
                  </div>

                  {/* Status selector */}
                  <select
                    value={a.status ?? ''}
                    disabled={saving === a.childId}
                    onChange={e => handleCorrect(a, e.target.value)}
                    style={{
                      padding      : '4px 8px',
                      fontSize     : 12,
                      color        : statusColor(a.status),
                      background   : statusColor(a.status) + '12',
                      border       : `1px solid ${statusColor(a.status)}40`,
                      borderRadius : radius.xs,
                      outline      : 'none',
                      cursor       : 'pointer',
                    }}
                  >
                    <option value=''>— Non renseigné</option>
                    {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* ── Coachs ── */}
            {detail.coaches.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Coachs
                </div>
                {detail.coaches.map(c => (
                  <div key={c.coachId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${colors.border.divider}` }}>
                    <span style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>{c.displayName}</span>
                    {(['full', 'partial', 'absent'] as CoachPresenceType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => handleCoachPresence(c, type)}
                        disabled={saving === `coach-${c.coachId}`}
                        style={{
                          padding      : '3px 8px',
                          fontSize     : 10,
                          fontWeight   : c.presenceType === type ? 700 : 400,
                          background   : c.presenceType === type ? colors.accent.gold + '20' : 'transparent',
                          border       : `1px solid ${c.presenceType === type ? colors.accent.gold : colors.border.divider}`,
                          borderRadius : radius.xs,
                          color        : c.presenceType === type ? colors.accent.gold : colors.text.muted,
                          cursor       : 'pointer',
                        }}
                      >
                        {type === 'full' ? 'Complet' : type === 'partial' ? 'Partiel' : 'Absent'}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* ── Ajout essai ── */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowTrial(!showTrial)}
                style={{
                  padding      : '7px 14px',
                  background   : colors.status.info + '18',
                  border       : `1px solid ${colors.status.info}40`,
                  borderRadius : radius.xs,
                  fontSize     : 12,
                  color        : colors.status.info,
                  cursor       : 'pointer',
                }}
              >
                🔵 Ajouter enfant essai
              </button>

              {showTrial && (
                <div style={{ marginTop: 10 }}>
                  <input
                    type='text'
                    value={trialSearch}
                    onChange={e => handleTrialSearch(e.target.value)}
                    placeholder="Rechercher dans l'annuaire…"
                    style={{
                      width        : '100%',
                      padding      : '7px 10px',
                      fontSize     : 13,
                      border       : `1px solid ${colors.border.divider}`,
                      borderRadius : radius.xs,
                      outline      : 'none',
                      boxSizing    : 'border-box',
                    }}
                  />
                  {trialResults.map(r => (
                    <div
                      key={r.id}
                      style={{
                        padding       : '8px 10px',
                        cursor        : 'pointer',
                        borderBottom  : `1px solid ${colors.border.divider}`,
                        display       : 'flex',
                        justifyContent: 'space-between',
                        alignItems    : 'center',
                      }}
                    >
                      <span style={{ fontSize: 13, color: colors.text.dark }}>{r.displayName}</span>
                      <button
                        onClick={() => handleAddTrial(r.id)}
                        disabled={addingTrial === r.id}
                        style={{
                          padding      : '3px 8px',
                          background   : colors.accent.gold,
                          border       : 'none',
                          borderRadius : radius.xs,
                          fontSize     : 11,
                          fontWeight   : 600,
                          color        : colors.text.dark,
                          cursor       : addingTrial === r.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {addingTrial === r.id ? '…' : 'Ajouter'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Corrections history ── */}
            {detail.corrections.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Corrections admin ({detail.corrections.length})
                </div>
                {detail.corrections.slice(0, 5).map(c => (
                  <div key={c.id} style={{ fontSize: 11, color: colors.text.muted, marginBottom: 4 }}>
                    {new Date(c.correctedAt).toLocaleString('fr-BE')} ·{' '}
                    <span style={{ color: colors.status.absent }}>{c.oldStatus ?? '—'}</span>{' '}
                    → <span style={{ color: colors.status.present }}>{c.newStatus}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Implantation = { id: string; name: string }
type Group        = { id: string; name: string; implantationId: string }

export default function DashboardPresencesPage() {
  const { user, tenantId } = useAuthStore()

  const [sessions,      setSessions]      = useState<SessionPresenceSummary[]>([])
  const [suggestions,   setSuggestions]   = useState<TrialConversionSuggestion[]>([])
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups,        setGroups]        = useState<Group[]>([])
  const [loading,       setLoading]       = useState(true)
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null)
  const [converting,    setConverting]    = useState<string | null>(null)
  const [pendingConversion, setPendingConversion] = useState<TrialConversionSuggestion | null>(null)
  const [modalGroupId,  setModalGroupId]  = useState('')
  const [modalError,    setModalError]    = useState<string | null>(null)

  const [timeView,       setTimeView]       = useState<TimeView>('week')
  const [implantationId, setImplantationId] = useState('')
  const [groupId,        setGroupId]        = useState('')

  // Load implantations + groups
  useEffect(() => {
    Promise.all([listImplantations(), listAllGroups()]).then(([implRes, grpRes]) => {
      setImplantations((implRes.data ?? []).map((i: Record<string, unknown>) => ({ id: i['id'] as string, name: i['name'] as string })))
      setGroups((grpRes ?? []).map((g: Record<string, unknown>) => ({ id: g['id'] as string, name: g['name'] as string, implantationId: g['implantation_id'] as string })))
    })
    listTrialConversionSuggestions().then(({ data }) => setSuggestions(data))
  }, [])

  const dateRange = useMemo(() => {
    const now   = new Date()
    const start = new Date(now)
    const end   = new Date(now)

    if (timeView === 'day') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (timeView === 'week') {
      const day = now.getDay()
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
    }

    return { fromDate: start.toISOString(), toDate: end.toISOString() }
  }, [timeView])

  const loadSessions = useCallback(() => {
    setLoading(true)
    const filters: PresenceCardFilters = {
      ...dateRange,
      ...(implantationId ? { implantationId } : {}),
      ...(groupId        ? { groupId }        : {}),
    }
    listSessionsWithPresence(filters).then(({ data }) => setSessions(data)).finally(() => setLoading(false))
  }, [dateRange, implantationId, groupId])

  useEffect(() => { loadSessions() }, [loadSessions])
  useEffect(() => { setGroupId('') }, [implantationId])

  const filteredGroups = useMemo(() =>
    implantationId ? groups.filter(g => g.implantationId === implantationId) : groups,
  [groups, implantationId])

  const groupMap        = useMemo(() => new Map(groups.map(g => [g.id, g.name])), [groups])
  const implantationMap = useMemo(() => new Map(implantations.map(i => [i.id, i.name])), [implantations])

  // Ouvre la modale — pas d'appel API
  const handleOpenConvertModal = (s: TrialConversionSuggestion) => {
    setPendingConversion(s)
    setModalGroupId('')
    setModalError(null)
  }

  // Exécuté depuis la modale — après confirmation explicite
  const handleConfirmConvert = async () => {
    if (!pendingConversion || !modalGroupId || !tenantId) return
    setConverting(pendingConversion.childId)
    try {
      const { error } = await convertTrialToMember({
        tenantId,
        childId : pendingConversion.childId,
        groupId : modalGroupId,
      })
      if (error) {
        setModalError('Erreur lors de la conversion. Réessayez.')
        return
      }
      setSuggestions(prev => prev.filter(x => x.childId !== pendingConversion.childId))
      setPendingConversion(null)
    } finally {
      setConverting(null)
    }
  }

  const detailSession = sessions.find(s => s.sessionId === detailSessionId)

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        select { appearance: auto; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: colors.text.dark }}>
            Dashboard Présences
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.text.muted }}>
            {sessions.length} séance{sessions.length !== 1 ? 's' : ''} · {timeView === 'day' ? "Aujourd'hui" : timeView === 'week' ? 'Cette semaine' : 'Ce mois'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const header = 'sessionId,date,groupId,status,roster,presents,absents,essais'
              const rows = sessions.map(s => [
                s.sessionId,
                new Date(s.scheduledAt).toLocaleDateString('fr-BE'),
                s.groupId,
                s.sessionStatus,
                s.totalRoster,
                s.memberPresent + s.trialPresent,
                s.absentCount,
                s.trialPresent,
              ].join(','))
              const csv  = [header, ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url  = URL.createObjectURL(blob)
              const a    = document.createElement('a')
              a.href = url
              a.download = `presences-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${colors.border.light}`, background: colors.light.surface, cursor: 'pointer', fontSize: 12, color: colors.text.muted, fontWeight: 600 }}
          >
            Exporter CSV
          </button>
          <button
            onClick={() => { if (typeof window !== 'undefined') window.print() }}
            style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${colors.border.light}`, background: colors.light.surface, cursor: 'pointer', fontSize: 12, color: colors.text.muted, fontWeight: 600 }}
          >
            Imprimer
          </button>
        </div>
      </div>

      {/* ── Suggestions conversion essai → membre ── */}
      {suggestions.length > 0 && (
        <div style={{
          background   : colors.light.surface,
          borderRadius : radius.card,
          padding      : 16,
          marginBottom : 24,
          border       : `1px solid ${colors.status.info}30`,
          boxShadow    : shadows.sm,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.status.info, marginBottom: 10 }}>
            🔵 Suggestions conversion essai → membre
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map(s => (
              <div key={s.childId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>
                  {s.childName} — {s.trialCount} séances d&apos;essai
                </span>
                <button
                  onClick={() => handleOpenConvertModal(s)}
                  disabled={converting === s.childId}
                  style={{
                    padding      : '5px 12px',
                    background   : converting === s.childId ? colors.light.muted : colors.accent.gold,
                    border       : 'none',
                    borderRadius : radius.xs,
                    fontSize     : 11,
                    fontWeight   : 600,
                    color        : converting === s.childId ? colors.text.subtle : colors.text.dark,
                    cursor       : converting === s.childId ? 'not-allowed' : 'pointer',
                  }}
                >
                  {converting === s.childId ? '…' : 'Ajouter au groupe'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{
        background   : colors.light.surface,
        borderRadius : radius.card,
        padding      : 16,
        marginBottom : 24,
        boxShadow    : shadows.sm,
        display      : 'flex',
        gap          : 12,
        flexWrap     : 'wrap',
        alignItems   : 'flex-end',
      }}>
        {/* Time view toggle */}
        <div style={{ display: 'flex', gap: 4, background: colors.light.muted, borderRadius: radius.xs, padding: 3 }}>
          {(['day', 'week', 'month'] as TimeView[]).map(v => (
            <button
              key={v}
              onClick={() => setTimeView(v)}
              style={{
                padding      : '5px 14px',
                background   : timeView === v ? colors.light.surface : 'transparent',
                border       : timeView === v ? `1px solid ${colors.border.divider}` : '1px solid transparent',
                borderRadius : radius.xs - 2,
                fontSize     : 12,
                fontWeight   : timeView === v ? 600 : 400,
                color        : timeView === v ? colors.text.dark : colors.text.muted,
                cursor       : 'pointer',
              }}
            >
              {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>

        {/* Implantation */}
        <div style={{ flex: '1 1 140px' }}>
          <label style={S.filterLabel}>Implantation</label>
          <select value={implantationId} onChange={e => setImplantationId(e.target.value)} style={S.select}>
            <option value=''>Toutes</option>
            {implantations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        {/* Groupe */}
        <div style={{ flex: '1 1 140px' }}>
          <label style={S.filterLabel}>Groupe</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} style={S.select}>
            <option value=''>Tous</option>
            {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 130, background: colors.light.surface, borderRadius: radius.card, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: colors.text.muted, background: colors.light.surface, borderRadius: radius.card, border: `1px dashed ${colors.border.divider}` }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14 }}>Aucune séance sur cette période.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {sessions.map(s => (
            <PresenceCard
              key={s.sessionId}
              session={s}
              groupName={groupMap.get(s.groupId) ?? s.groupId}
              onClick={() => setDetailSessionId(s.sessionId)}
            />
          ))}
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {detailSessionId && detailSession && (
        <AttendanceDetailDrawer
          sessionId={detailSessionId}
          groupName={groupMap.get(detailSession.groupId) ?? detailSession.groupId}
          tenantId={tenantId ?? ''}
          adminId={user?.id ?? ''}
          onClose={() => setDetailSessionId(null)}
        />
      )}

      {/* ── Modale confirmation conversion essai → membre ── */}
      {pendingConversion && (
        <div style={{
          position       : 'fixed',
          inset          : 0,
          background     : colors.overlay.dark,
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'center',
          zIndex         : 1000,
        }}>
          <div style={{
            background   : colors.light.surface,
            borderRadius : radius.card,
            padding      : space.xl,
            width        : 380,
            maxWidth     : '90vw',
            // @ts-ignore — web only
            boxShadow    : shadows.lg,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text.dark, marginBottom: space.sm }}>
              Convertir en membre
            </div>
            <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: space.md }}>
              {pendingConversion.childName} — {pendingConversion.trialCount} séance{pendingConversion.trialCount !== 1 ? 's' : ''} d&apos;essai
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: colors.text.muted, display: 'block', marginBottom: space.xs }}>
              Groupe de destination *
            </label>
            <select
              value={modalGroupId}
              onChange={e => { setModalGroupId(e.target.value); setModalError(null) }}
              style={{
                width        : '100%',
                padding      : '8px 10px',
                borderRadius : radius.xs,
                border       : `1px solid ${colors.border.light}`,
                background   : colors.light.primary,
                fontSize     : 13,
                color        : colors.text.dark,
                marginBottom : space.sm,
              }}
            >
              <option value='' disabled>— Choisir un groupe —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            {modalError && (
              <div style={{ fontSize: 12, color: colors.accent.red, marginBottom: space.sm }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'flex', gap: space.sm, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPendingConversion(null)}
                style={{
                  padding      : '7px 16px',
                  background   : colors.light.hover,
                  border       : `1px solid ${colors.border.light}`,
                  borderRadius : radius.xs,
                  fontSize     : 13,
                  fontWeight   : 600,
                  color        : colors.text.muted,
                  cursor       : 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmConvert}
                disabled={!modalGroupId || converting === pendingConversion.childId}
                style={{
                  padding      : '7px 16px',
                  background   : (!modalGroupId || converting === pendingConversion.childId)
                    ? colors.light.muted
                    : colors.accent.gold,
                  border       : 'none',
                  borderRadius : radius.xs,
                  fontSize     : 13,
                  fontWeight   : 600,
                  color        : (!modalGroupId || converting === pendingConversion.childId)
                    ? colors.text.subtle
                    : colors.text.dark,
                  cursor       : (!modalGroupId || converting === pendingConversion.childId)
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                {converting === pendingConversion.childId ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  filterLabel: {
    display       : 'block',
    fontSize      : 10,
    fontWeight    : 700,
    color         : colors.text.subtle,
    letterSpacing : 1,
    textTransform : 'uppercase',
    marginBottom  : 4,
  },
  select: {
    width        : '100%',
    padding      : '7px 10px',
    fontSize     : 13,
    color        : colors.text.dark,
    background   : colors.light.muted,
    border       : `1px solid ${colors.border.divider}`,
    borderRadius : radius.xs,
    outline      : 'none',
  },
}
