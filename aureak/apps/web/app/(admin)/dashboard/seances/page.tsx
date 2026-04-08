'use client'
// Dashboard Opérationnel Séances — Story 32.2
// Grille de cartes avec filtres cascade, 3 densités, alertes, métriques
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'expo-router'
import {
  listSessionCards, listAdminAlerts, resolveAlert,
  listImplantations, listAllGroups, getSessionDetail,
} from '@aureak/api-client'
import type {
  SessionAttendanceStats, AdminAlert, SessionCardDensity,
} from '@aureak/types'
import type { SessionCardFilters, SessionDetailRow } from '@aureak/api-client'
import { colors, shadows, radius, transitions, methodologyMethodColors } from '@aureak/theme'

// ── Constantes ─────────────────────────────────────────────────────────────────

const SESSION_STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'planifiée', label: 'Planifiée' },
  { value: 'en_cours',  label: 'En cours' },
  { value: 'réalisée',  label: 'Réalisée' },
  { value: 'annulée',   label: 'Annulée' },
  { value: 'reportée',  label: 'Reportée' },
]

const DENSITY_OPTIONS: { value: SessionCardDensity; label: string }[] = [
  { value: 'compact',   label: 'Compact' },
  { value: 'standard',  label: 'Standard' },
  { value: 'detaille',  label: 'Détaillé' },
]

const ALERT_LABELS: Record<AdminAlert['type'], string> = {
  consecutive_absences    : 'Absences consécutives',
  debrief_missing         : 'Débrief manquant',
  coach_absent_unresolved : 'Coach absent — décision requise',
}

const ALERT_COLORS: Record<AdminAlert['type'], string> = {
  consecutive_absences    : colors.status.absent,
  debrief_missing         : colors.status.attention,
  coach_absent_unresolved : colors.accent.gold,
}

function statusColor(status: string): string {
  if (status === 'réalisée' || status === 'terminée') return colors.status.present
  if (status === 'annulée')   return colors.status.absent
  if (status === 'reportée')  return colors.status.attention
  if (status === 'en_cours')  return colors.accent.goldLight
  return colors.text.muted
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    planifiée : 'Planifiée',
    en_cours  : 'En cours',
    réalisée  : 'Réalisée',
    terminée  : 'Terminée',
    annulée   : 'Annulée',
    reportée  : 'Reportée',
  }
  return map[status] ?? status
}

function methodColor(sessionType: string | null): string {
  if (!sessionType) return colors.text.muted
  const typeMap: Record<string, keyof typeof methodologyMethodColors> = {
    goal_and_player  : 'Goal and Player',
    technique        : 'Technique',
    situationnel     : 'Situationnel',
    performance      : 'Performance',
    decisionnel      : 'Décisionnel',
    perfectionnement : 'Perfectionnement',
    integration      : 'Intégration',
  }
  const key = typeMap[sessionType]
  return key ? methodologyMethodColors[key] : colors.text.muted
}

function methodLabel(sessionType: string | null): string {
  if (!sessionType) return '—'
  const map: Record<string, string> = {
    goal_and_player  : 'Goal & Player',
    technique        : 'Technique',
    situationnel     : 'Situationnel',
    performance      : 'Performance',
    decisionnel      : 'Décisionnel',
    perfectionnement : 'Perfectionnement',
    integration      : 'Intégration',
  }
  return map[sessionType] ?? sessionType
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-BE', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background    : colors.light.surface,
      borderRadius  : radius.card,
      padding       : 16,
      boxShadow     : shadows.sm,
      height        : 120,
      animation     : 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 12, width: '60%', background: colors.light.muted, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 10, width: '40%', background: colors.light.muted, borderRadius: 4 }} />
    </div>
  )
}

// ── Session Card ───────────────────────────────────────────────────────────────

function SessionCard({
  session, density, groupName, implantationName, onClick,
}: {
  session          : SessionAttendanceStats
  density          : SessionCardDensity
  groupName        : string
  implantationName : string
  onClick          : () => void
}) {
  const isCompact   = density === 'compact'
  const isDetaille  = density === 'detaille'
  const mColor      = methodColor(session.sessionType)
  const sColor      = statusColor(session.status)
  const debrief     = session.closedAt ? 'rempli' : (
    session.status === 'réalisée' || session.status === 'terminée' ? 'manquant' : null
  )

  return (
    <div
      onClick={onClick}
      style={{
        background     : colors.light.surface,
        borderRadius   : radius.card,
        padding        : 14,
        boxShadow      : shadows.sm,
        cursor         : 'pointer',
        border         : `1px solid ${colors.border.divider}`,
        transition     : `box-shadow ${transitions.fast}`,
        position       : 'relative',
        overflow       : 'hidden',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = shadows.md)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = shadows.sm)}
    >
      {/* Left accent stripe */}
      <div style={{
        position      : 'absolute',
        left          : 0, top: 0, bottom: 0,
        width         : 3,
        background    : mColor,
        borderRadius  : '4px 0 0 4px',
      }} />

      <div style={{ paddingLeft: 10 }}>
        {/* Row 1 — date + statut */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.text.dark }}>
            {formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}
          </span>
          <span style={{
            fontSize      : 10,
            fontWeight    : 700,
            color         : sColor,
            background    : sColor + '18',
            padding       : '2px 6px',
            borderRadius  : radius.badge,
            letterSpacing : 0.5,
            textTransform : 'uppercase',
          }}>
            {statusLabel(session.status)}
          </span>
        </div>

        {/* Row 2 — groupe */}
        <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: isCompact ? 0 : 6 }}>
          {groupName} · <span style={{ color: colors.text.subtle }}>{implantationName}</span>
        </div>

        {!isCompact && (
          <>
            {/* Row 3 — méthode + présences */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {session.sessionType && (
                <span style={{
                  fontSize    : 10,
                  fontWeight  : 600,
                  color       : mColor,
                  background  : mColor + '18',
                  padding     : '2px 6px',
                  borderRadius: radius.badge,
                }}>
                  {methodLabel(session.sessionType)}
                </span>
              )}
              {session.totalAttendees > 0 && (
                <>
                  <span style={{ fontSize: 11, color: colors.status.present }}>
                    ✓ {session.presentCount}
                  </span>
                  {session.absentCount > 0 && (
                    <span style={{ fontSize: 11, color: colors.status.absent }}>
                      ✗ {session.absentCount}
                    </span>
                  )}
                </>
              )}
              {session.label && (
                <span style={{ fontSize: 11, color: colors.text.subtle, fontStyle: 'italic' }}>
                  {session.label}
                </span>
              )}
            </div>

            {isDetaille && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Débrief indicator */}
                {debrief === 'rempli' && (
                  <span style={{ fontSize: 10, color: colors.status.present, background: colors.status.present + '18', padding: '2px 6px', borderRadius: radius.badge }}>
                    ✓ Débrief
                  </span>
                )}
                {debrief === 'manquant' && (
                  <span style={{ fontSize: 10, color: colors.status.absent, background: colors.status.absent + '18', padding: '2px 6px', borderRadius: radius.badge }}>
                    ! Débrief manquant
                  </span>
                )}
                <span style={{ fontSize: 10, color: colors.text.subtle }}>
                  {session.durationMinutes} min
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Alert Row ──────────────────────────────────────────────────────────────────

function AlertRow({
  alert, onResolve, resolving,
}: {
  alert     : AdminAlert
  onResolve : (id: string) => void
  resolving : boolean
}) {
  const color = ALERT_COLORS[alert.type]
  const meta  = alert.metadata as Record<string, unknown>

  return (
    <div style={{
      display       : 'flex',
      alignItems    : 'center',
      gap           : 12,
      padding       : '10px 14px',
      background    : colors.light.surface,
      borderRadius  : radius.xs,
      border        : `1px solid ${color}30`,
      borderLeft    : `3px solid ${color}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.dark }}>
          {ALERT_LABELS[alert.type]}
        </div>
        {meta['childName'] && (
          <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
            {String(meta['childName'])}
            {meta['consecutiveAbsences'] != null && ` — ${meta['consecutiveAbsences']} absences consécutives`}
          </div>
        )}
        {meta['coachName'] && (
          <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
            Coach {String(meta['coachName'])}
            {meta['sessionDate'] && ` · séance du ${String(meta['sessionDate'])}`}
          </div>
        )}
        <div style={{ fontSize: 10, color: colors.text.subtle, marginTop: 2 }}>
          {formatDate(alert.createdAt)}
        </div>
      </div>

      <button
        onClick={() => onResolve(alert.id)}
        disabled={resolving}
        style={{
          padding       : '5px 10px',
          background    : resolving ? colors.light.muted : color + '18',
          border        : `1px solid ${color}40`,
          borderRadius  : radius.xs,
          fontSize      : 11,
          color         : resolving ? colors.text.subtle : color,
          cursor        : resolving ? 'not-allowed' : 'pointer',
          fontWeight    : 600,
          transition    : `all ${transitions.fast}`,
          whiteSpace    : 'nowrap',
        }}
      >
        {resolving ? '…' : 'Résoudre'}
      </button>
    </div>
  )
}

// ── Session Detail Modal ───────────────────────────────────────────────────────

function SessionDetailModal({
  sessionId, groupName, onClose,
}: {
  sessionId : string
  groupName : string
  onClose   : () => void
}) {
  const [detail, setDetail]   = useState<SessionDetailRow | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getSessionDetail(sessionId).then(({ data }) => {
      setDetail(data)
      setLoading(false)
    })
  }, [sessionId])

  return (
    <div
      onClick={onClose}
      style={{
        position  : 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display   : 'flex', alignItems: 'center', justifyContent: 'center',
        padding   : 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background   : colors.light.surface,
          borderRadius : radius.card,
          padding      : 24,
          width        : '100%',
          maxWidth     : 560,
          boxShadow    : shadows.lg,
          maxHeight    : '85vh',
          overflowY    : 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text.dark }}>
            Fiche séance
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: colors.text.muted }}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
        ) : detail ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Date', formatDate(detail.scheduledAt)],
                ['Heure', formatTime(detail.scheduledAt)],
                ['Durée', `${detail.durationMinutes} min`],
                ['Statut', statusLabel(detail.status)],
                ['Groupe', groupName],
                ['Méthode', methodLabel(detail.sessionType)],
                ['Débrief', detail.closedAt ? '✓ Rempli' : '✗ Manquant'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: colors.text.dark, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            {detail.coaches.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Coachs</div>
                {detail.coaches.map(c => (
                  <div key={c.coachId} style={{ fontSize: 12, color: colors.text.muted }}>
                    {c.displayName} · <span style={{ color: colors.accent.gold }}>{c.role}</span>
                  </div>
                ))}
              </div>
            )}

            {detail.attendees.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Présences ({detail.attendees.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.attendees.map(a => (
                    <span
                      key={a.childId}
                      style={{
                        fontSize    : 11,
                        padding     : '2px 8px',
                        borderRadius: radius.badge,
                        background  : (a.status === 'present' || a.status === 'late' || a.status === 'trial')
                          ? colors.status.present + '18'
                          : colors.status.absent + '18',
                        color: (a.status === 'present' || a.status === 'late' || a.status === 'trial')
                          ? colors.status.present
                          : colors.status.absent,
                      }}
                    >
                      {a.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push(`/seances/${detail.id}` as never)}
              style={{
                marginTop    : 8,
                padding      : '8px 16px',
                background   : colors.accent.gold,
                border       : 'none',
                borderRadius : radius.xs,
                fontSize     : 13,
                fontWeight   : 600,
                color        : colors.text.dark,
                cursor       : 'pointer',
              }}
            >
              Ouvrir la séance complète →
            </button>
          </>
        ) : (
          <div style={{ color: colors.status.absent, fontSize: 13 }}>Séance introuvable.</div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Implantation = { id: string; name: string }
type Group        = { id: string; name: string; implantationId: string }

const DENSITY_KEY = 'aureak_session_card_density'

export default function DashboardSeancesPage() {
  // Data state
  const [sessions,      setSessions]      = useState<SessionAttendanceStats[]>([])
  const [alerts,        setAlerts]        = useState<AdminAlert[]>([])
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups,        setGroups]        = useState<Group[]>([])
  const [loading,       setLoading]       = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [resolving,     setResolving]     = useState<string | null>(null)
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null)

  // Filters
  const [implantationId, setImplantationId] = useState('')
  const [groupId,        setGroupId]        = useState('')
  const [sessionType,    setSessionType]    = useState('')
  const [status,         setStatus]         = useState('')

  // Density — persisted in localStorage
  const [density, setDensity] = useState<SessionCardDensity>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DENSITY_KEY)
      if (stored === 'compact' || stored === 'standard' || stored === 'detaille') return stored
    }
    return 'standard'
  })

  const handleDensity = (d: SessionCardDensity) => {
    setDensity(d)
    if (typeof window !== 'undefined') localStorage.setItem(DENSITY_KEY, d)
  }

  // Load implantations + groups once
  useEffect(() => {
    Promise.all([
      listImplantations(),
      listAllGroups(),
    ]).then(([implRes, grpRes]) => {
      setImplantations(
        (implRes.data ?? []).map((i: Record<string, unknown>) => ({
          id: i['id'] as string, name: i['name'] as string,
        })),
      )
      setGroups(
        (grpRes ?? []).map((g: Record<string, unknown>) => ({
          id: g['id'] as string, name: g['name'] as string,
          implantationId: g['implantation_id'] as string,
        })),
      )
    })
  }, [])

  // Load alerts
  useEffect(() => {
    setAlertsLoading(true)
    listAdminAlerts('active')
      .then(({ data }) => { setAlerts(data) })
      .finally(() => setAlertsLoading(false))
  }, [])

  // Load session cards based on filters
  const loadSessions = useCallback(() => {
    setLoading(true)
    const filters: SessionCardFilters = {}
    if (implantationId) filters.implantationId = implantationId
    if (groupId)        filters.groupId        = groupId
    if (sessionType)    filters.sessionType    = sessionType
    if (status)         filters.status         = status

    listSessionCards(filters).then(({ data }) => {
      setSessions(data)
    }).finally(() => setLoading(false))
  }, [implantationId, groupId, sessionType, status])

  useEffect(() => { loadSessions() }, [loadSessions])

  // Reset group when implantation changes
  useEffect(() => { setGroupId('') }, [implantationId])

  // Filtered groups based on selected implantation
  const filteredGroups = useMemo(() =>
    implantationId
      ? groups.filter(g => g.implantationId === implantationId)
      : groups,
  [groups, implantationId])

  // Available session types from loaded sessions
  const availableTypes = useMemo(() => {
    const types = [...new Set(sessions.map(s => s.sessionType).filter(Boolean))] as string[]
    return types
  }, [sessions])

  // Lookup maps for display names
  const groupMap        = useMemo(() => new Map(groups.map(g => [g.id, g.name])), [groups])
  const implantationMap = useMemo(() => new Map(implantations.map(i => [i.id, i.name])), [implantations])

  const handleResolve = async (alertId: string) => {
    setResolving(alertId)
    try {
      const { error } = await resolveAlert(alertId)
      if (!error) setAlerts(prev => prev.filter(a => a.id !== alertId))
    } finally {
      setResolving(null)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        select { appearance: auto; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: colors.text.dark, letterSpacing: 0.5 }}>
            Dashboard Séances
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.text.muted }}>
            Vue opérationnelle — {sessions.length} séance{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Density toggle */}
        <div style={{ display: 'flex', gap: 4, background: colors.light.muted, borderRadius: radius.xs, padding: 3 }}>
          {DENSITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleDensity(opt.value)}
              style={{
                padding      : '5px 12px',
                background   : density === opt.value ? colors.light.surface : 'transparent',
                border       : density === opt.value ? `1px solid ${colors.border.divider}` : '1px solid transparent',
                borderRadius : radius.xs - 2,
                fontSize     : 12,
                fontWeight   : density === opt.value ? 600 : 400,
                color        : density === opt.value ? colors.text.dark : colors.text.muted,
                cursor       : 'pointer',
                transition   : `all ${transitions.fast}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Actions Requises ── */}
      {(alertsLoading || alerts.length > 0) && (
        <div style={{
          background   : colors.light.surface,
          borderRadius : radius.card,
          padding      : 16,
          marginBottom : 24,
          border       : `1px solid ${colors.status.absent}25`,
          boxShadow    : shadows.sm,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              background   : colors.status.absent,
              color        : '#fff',
              fontSize     : 10,
              fontWeight   : 700,
              padding      : '2px 6px',
              borderRadius : radius.badge,
            }}>
              {alerts.length}
            </span>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.text.dark }}>
              Actions Requises
            </h2>
          </div>

          {alertsLoading ? (
            <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement des alertes…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map(alert => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onResolve={handleResolve}
                  resolving={resolving === alert.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
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
        {/* Implantation */}
        <div style={{ flex: '1 1 150px' }}>
          <label style={S.filterLabel}>Implantation</label>
          <select
            value={implantationId}
            onChange={e => setImplantationId(e.target.value)}
            style={S.select}
          >
            <option value=''>Toutes</option>
            {implantations.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        {/* Groupe */}
        <div style={{ flex: '1 1 150px' }}>
          <label style={S.filterLabel}>Groupe</label>
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            style={S.select}
          >
            <option value=''>Tous</option>
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Méthode */}
        <div style={{ flex: '1 1 150px' }}>
          <label style={S.filterLabel}>Méthode</label>
          <select
            value={sessionType}
            onChange={e => setSessionType(e.target.value)}
            style={S.select}
          >
            <option value=''>Toutes</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{methodLabel(t)}</option>
            ))}
          </select>
        </div>

        {/* Statut */}
        <div style={{ flex: '1 1 150px' }}>
          <label style={S.filterLabel}>Statut</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={S.select}
          >
            {SESSION_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {(implantationId || groupId || sessionType || status) && (
          <button
            onClick={() => { setImplantationId(''); setGroupId(''); setSessionType(''); setStatus('') }}
            style={{
              padding      : '7px 12px',
              background   : 'transparent',
              border       : `1px solid ${colors.border.divider}`,
              borderRadius : radius.xs,
              fontSize     : 12,
              color        : colors.text.muted,
              cursor       : 'pointer',
              alignSelf    : 'flex-end',
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div style={{
          display             : 'grid',
          gridTemplateColumns : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap                 : 12,
        }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign    : 'center',
          padding      : 48,
          color        : colors.text.muted,
          background   : colors.light.surface,
          borderRadius : radius.card,
          border       : `1px dashed ${colors.border.divider}`,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 14 }}>Aucune séance trouvée avec ces filtres.</div>
        </div>
      ) : (
        <div style={{
          display             : 'grid',
          gridTemplateColumns : density === 'compact'
            ? 'repeat(auto-fill, minmax(220px, 1fr))'
            : density === 'detaille'
              ? 'repeat(auto-fill, minmax(320px, 1fr))'
              : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap                 : 10,
        }}>
          {sessions.map(session => (
            <SessionCard
              key={session.sessionId}
              session={session}
              density={density}
              groupName={groupMap.get(session.groupId) ?? session.groupId}
              implantationName={implantationMap.get(session.implantationId) ?? ''}
              onClick={() => setDetailSessionId(session.sessionId)}
            />
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailSessionId && (
        <SessionDetailModal
          sessionId={detailSessionId}
          groupName={groupMap.get(
            sessions.find(s => s.sessionId === detailSessionId)?.groupId ?? '',
          ) ?? ''}
          onClose={() => setDetailSessionId(null)}
        />
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container: {
    padding   : 32,
    maxWidth  : 1200,
    margin    : '0 auto',
  },
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
