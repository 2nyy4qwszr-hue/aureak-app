'use client'
// Story 32.3 — Signaux Techniques Coach : créer / résoudre des signaux par enfant
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  listSessionAttendeeRoster, batchResolveAttendeeNames,
  listAttendancesBySession,
  createTechnicalSignal, resolveTechnicalSignal,
  listSessionSignals, getChildSessionContext,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { TechnicalSignal, Attendance } from '@aureak/types'
import type { ChildSessionContext } from '@aureak/api-client'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type AttendeeRow = {
  childId     : string
  displayName : string
  status      : string | null
}

function SignalStatusBadge({ status }: { status: TechnicalSignal['status'] }) {
  const config = {
    active  : { color: colors.status.attention, label: '⚠ Actif' },
    resolved: { color: colors.status.present,   label: '✓ Résolu' },
    archived: { color: colors.text.subtle,       label: '∅ Archivé' },
  }[status]

  return (
    <span style={{
      fontSize    : 10,
      fontWeight  : 700,
      color       : config.color,
      background  : config.color + '18',
      padding     : '2px 6px',
      borderRadius: radius.badge,
    }}>
      {config.label}
    </span>
  )
}

// ── Signal Creation Form ──────────────────────────────────────────────────────

function SignalForm({
  child, sessionId, tenantId, coachId, onDone,
}: {
  child     : AttendeeRow
  sessionId : string
  tenantId  : string
  coachId   : string
  onDone    : () => void
}) {
  const [error,    setError]    = useState('')
  const [criterion, setCriterion] = useState('')
  const [notify,   setNotify]   = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleSave = async () => {
    if (!error.trim() || !criterion.trim()) return
    setSaving(true)
    try {
      const { error: err } = await createTechnicalSignal({
        tenantId, childId: child.childId, coachId,
        sessionId,
        errorObserved    : error.trim(),
        successCriterion : criterion.trim(),
        notifyParent     : notify,
      })
      if (err) {
        setFeedback('Erreur lors de la création du signal.')
      } else {
        setFeedback('Signal créé ✓')
        setTimeout(() => { setFeedback(''); onDone() }, 1000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background   : colors.light.muted,
      borderRadius : radius.xs,
      padding      : 14,
      marginTop    : 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark, marginBottom: 12 }}>
        Nouveau signal — {child.displayName}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={S.label}>Erreur observée *</label>
        <textarea
          value={error}
          onChange={e => setError(e.target.value)}
          placeholder='Ex: Mauvais positionnement des mains lors des plongeons…'
          rows={2}
          style={S.textarea}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={S.label}>Critère de réussite *</label>
        <textarea
          value={criterion}
          onChange={e => setCriterion(e.target.value)}
          placeholder="Ex: Pouces vers l'intérieur, mains en forme de diamant…"
          rows={2}
          style={S.textarea}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input
          type='checkbox'
          id='notify-parent'
          checked={notify}
          onChange={e => setNotify(e.target.checked)}
          style={{ accentColor: colors.accent.gold }}
        />
        <label htmlFor='notify-parent' style={{ fontSize: 12, color: colors.text.muted, cursor: 'pointer' }}>
          Notifier les parents
        </label>
      </div>

      {feedback && (
        <div style={{ fontSize: 12, color: feedback.includes('Erreur') ? colors.status.absent : colors.status.present, marginBottom: 8 }}>
          {feedback}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving || !error.trim() || !criterion.trim()}
          style={{
            padding      : '7px 16px',
            background   : saving ? colors.light.muted : colors.accent.gold,
            border       : 'none',
            borderRadius : radius.xs,
            fontSize     : 12,
            fontWeight   : 600,
            color        : saving ? colors.text.subtle : colors.text.dark,
            cursor       : saving || !error.trim() || !criterion.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Enregistrement…' : 'Créer le signal'}
        </button>
        <button
          onClick={onDone}
          style={{
            padding      : '7px 12px',
            background   : 'transparent',
            border       : `1px solid ${colors.border.divider}`,
            borderRadius : radius.xs,
            fontSize     : 12,
            color        : colors.text.muted,
            cursor       : 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Child Row ─────────────────────────────────────────────────────────────────

function ChildSignalRow({
  attendee, sessionSignals, sessionId, tenantId, coachId, onRefresh,
}: {
  attendee      : AttendeeRow
  sessionSignals: TechnicalSignal[]
  sessionId     : string
  tenantId      : string
  coachId       : string
  onRefresh     : () => void
}) {
  const [showForm,    setShowForm]    = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [context,     setContext]     = useState<ChildSessionContext | null>(null)
  const [contextLoad, setContextLoad] = useState(false)
  const [resolving,   setResolving]   = useState<string | null>(null)

  const childSignals = sessionSignals.filter(s => s.childId === attendee.childId)

  const loadContext = async () => {
    if (context) { setShowContext(!showContext); return }
    setContextLoad(true)
    const { data } = await getChildSessionContext(attendee.childId)
    setContext(data)
    setContextLoad(false)
    setShowContext(true)
  }

  const handleResolve = async (signalId: string) => {
    setResolving(signalId)
    try {
      await resolveTechnicalSignal(signalId)
      onRefresh()
    } finally {
      setResolving(null)
    }
  }

  const isPresent = attendee.status && ['present', 'late', 'trial'].includes(attendee.status)

  return (
    <div style={{
      background   : colors.light.surface,
      borderRadius : radius.card,
      padding      : 12,
      border       : `1px solid ${colors.border.divider}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width        : 8, height: 8, borderRadius: '50%',
            background   : isPresent ? colors.status.present : colors.text.subtle,
          }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.text.dark }}>
            {attendee.displayName}
          </span>
          {childSignals.length > 0 && (
            <span style={{
              fontSize    : 10,
              background  : colors.status.attention + '20',
              color       : colors.status.attention,
              padding     : '1px 6px',
              borderRadius: radius.badge,
              fontWeight  : 700,
            }}>
              {childSignals.length} signal{childSignals.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={loadContext}
            style={{
              padding      : '4px 10px',
              background   : colors.light.muted,
              border       : `1px solid ${colors.border.divider}`,
              borderRadius : radius.xs,
              fontSize     : 11,
              color        : colors.text.muted,
              cursor       : 'pointer',
            }}
          >
            {contextLoad ? '…' : showContext ? '↑ Contexte' : 'Contexte'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding      : '4px 10px',
              background   : colors.accent.gold + '18',
              border       : `1px solid ${colors.accent.gold}40`,
              borderRadius : radius.xs,
              fontSize     : 11,
              fontWeight   : 600,
              color        : colors.accent.gold,
              cursor       : 'pointer',
            }}
          >
            + Signal
          </button>
        </div>
      </div>

      {/* Existing signals for this child */}
      {childSignals.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {childSignals.map(sig => (
            <div
              key={sig.id}
              style={{
                background   : colors.light.muted,
                borderRadius : radius.xs,
                padding      : '8px 10px',
                display      : 'flex',
                justifyContent: 'space-between',
                alignItems   : 'flex-start',
                gap          : 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <SignalStatusBadge status={sig.status} />
                </div>
                <div style={{ fontSize: 12, color: colors.text.dark, marginBottom: 2 }}>
                  <strong>Erreur :</strong> {sig.errorObserved}
                </div>
                <div style={{ fontSize: 12, color: colors.text.muted }}>
                  <strong>Critère :</strong> {sig.successCriterion}
                </div>
              </div>
              {sig.status === 'active' && (
                <button
                  onClick={() => handleResolve(sig.id)}
                  disabled={resolving === sig.id}
                  style={{
                    padding      : '3px 8px',
                    background   : colors.status.present + '18',
                    border       : `1px solid ${colors.status.present}40`,
                    borderRadius : radius.xs,
                    fontSize     : 10,
                    color        : colors.status.present,
                    cursor       : resolving === sig.id ? 'not-allowed' : 'pointer',
                    whiteSpace   : 'nowrap',
                  }}
                >
                  {resolving === sig.id ? '…' : 'Résoudre'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Context drawer */}
      {showContext && context && (
        <div style={{
          marginTop    : 8,
          background   : colors.light.muted,
          borderRadius : radius.xs,
          padding      : 10,
          borderLeft   : `3px solid ${colors.accent.gold}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Profil technique
          </div>
          {context.activeSignals.length === 0 && context.resolvedRecent.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.text.subtle }}>Aucun signal enregistré.</div>
          ) : (
            <>
              {context.activeSignals.map(s => (
                <div key={s.id} style={{ fontSize: 11, color: colors.status.attention, marginBottom: 3 }}>
                  ⚠ {s.errorObserved}
                </div>
              ))}
              {context.resolvedRecent.map(s => (
                <div key={s.id} style={{ fontSize: 11, color: colors.status.present, marginBottom: 3 }}>
                  ✓ {s.errorObserved}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Signal form */}
      {showForm && (
        <SignalForm
          child={attendee}
          sessionId={sessionId}
          tenantId={tenantId}
          coachId={coachId}
          onDone={() => { setShowForm(false); onRefresh() }}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SessionSignauxPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const { user, tenantId } = useAuthStore()

  const [attendees,      setAttendees]      = useState<AttendeeRow[]>([])
  const [sessionSignals, setSessionSignals] = useState<TechnicalSignal[]>([])
  const [loading,        setLoading]        = useState(true)

  const loadData = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const [rosterRes, attRes, signalsRes] = await Promise.all([
        listSessionAttendeeRoster(sessionId),
        listAttendancesBySession(sessionId),
        listSessionSignals(sessionId),
      ])

      const roster   = rosterRes.data ?? []
      const regular  = roster.filter(r => !r.isGuest).map(r => r.childId)
      const guests   = roster.filter(r =>  r.isGuest).map(r => r.childId)
      const { profileMap, dirMap } = await batchResolveAttendeeNames(regular, guests)

      const attendanceMap = new Map(
        ((attRes.data ?? []) as Attendance[]).map(a => [a.childId, a.status as string]),
      )

      setAttendees(
        roster.map(r => ({
          childId    : r.childId,
          displayName: (profileMap.get(r.childId) ?? dirMap.get(r.childId)) ?? r.childId,
          status     : attendanceMap.get(r.childId) ?? null,
        })),
      )
      setSessionSignals(signalsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [sessionId])

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={() => router.push(`/coach/sessions/${sessionId}` as never)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: colors.accent.gold, padding: 0 }}
        >
          ← Séance
        </button>
        <span style={{ color: colors.text.subtle, fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: colors.text.muted }}>Signaux techniques</span>
      </div>

      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: colors.text.dark }}>
        Signaux techniques
      </h1>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: colors.text.muted }}>
        Observations pédagogiques par joueur — visibles par tous les coachs.
      </p>

      {loading ? (
        <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
      ) : attendees.length === 0 ? (
        <div style={{
          textAlign    : 'center',
          padding      : 40,
          background   : colors.light.surface,
          borderRadius : radius.card,
          border       : `1px dashed ${colors.border.divider}`,
          color        : colors.text.muted,
        }}>
          Aucun joueur enregistré pour cette séance.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {attendees.map(a => (
            <ChildSignalRow
              key={a.childId}
              attendee={a}
              sessionSignals={sessionSignals}
              sessionId={sessionId!}
              tenantId={tenantId ?? ''}
              coachId={user?.id ?? ''}
              onRefresh={loadData}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  label: {
    display       : 'block',
    fontSize      : 10,
    fontWeight    : 700,
    color         : colors.text.subtle,
    letterSpacing : 1,
    textTransform : 'uppercase',
    marginBottom  : 4,
  },
  textarea: {
    width        : '100%',
    padding      : '8px 10px',
    fontSize     : 13,
    color        : colors.text.dark,
    background   : colors.light.surface,
    border       : `1px solid ${colors.border.divider}`,
    borderRadius : radius.xs,
    resize       : 'vertical',
    outline      : 'none',
    boxSizing    : 'border-box',
  },
}
