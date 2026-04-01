'use client'
// Évaluations par enfant — boutons explicites + sauvegarde globale
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getSessionById, listMergedEvaluations, applyEvaluationEvent, listPresentChildIdsForSession, resolveProfileDisplayNames } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import type { Session, EvaluationMerged } from '@aureak/types'
import type { EvaluationSignal } from '@aureak/types'

type ChildEval = {
  childId    : string
  displayName: string
  receptivite: EvaluationSignal
  goutEffort : EvaluationSignal
  attitude   : EvaluationSignal
  topSeance  : 'star' | 'none'
  note       : string
  saved      : boolean
  dirty      : boolean
  ignored    : boolean
}

const SIGNAL_CONFIG: { value: EvaluationSignal; label: string; short: string; color: string; bg: string }[] = [
  { value: 'positive',  label: 'Positif',   short: '✓', color: colors.status.present,  bg: 'rgba(76,175,80,0.14)'  },
  { value: 'none',      label: 'Neutre',    short: '–', color: colors.text.muted,   bg: colors.light.muted },
  { value: 'attention', label: 'Attention', short: '!', color: colors.status.attention, bg: 'rgba(255,193,7,0.14)'  },
]

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  return (
    <div style={E.page}>
      <style>{`@keyframes ep{0%,100%{opacity:.15}50%{opacity:.42}} .es{background:${colors.light.muted};border-radius:6px;animation:ep 1.8s ease-in-out infinite}`}</style>
      <button style={E.back} onClick={() => router.push('/coach/sessions' as never)}>← Mes séances</button>
      <div className="es" style={{ height: 28, width: 300, marginBottom: 8 }} />
      <div className="es" style={{ height: 14, width: 200, marginBottom: 24 }} />
      <div style={E.subNav}>
        {['Présences', 'Évaluations'].map(t => (
          <div key={t} className="es" style={{ height: 24, width: 90 }} />
        ))}
      </div>
      {[0,1,2,3].map(i => (
        <div key={i} className="es" style={{ height: 180, borderRadius: 12, marginBottom: 10 }} />
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
    <div style={E.subNav}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            ...E.subNavBtn,
            color      : active === tab.label ? colors.accent.gold : colors.text.muted,
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

// ── Signal buttons ────────────────────────────────────────────────────────────
function SignalButtons({
  label, value, onChange,
}: { label: string; value: EvaluationSignal; onChange: (v: EvaluationSignal) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: 90 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {SIGNAL_CONFIG.map(sig => {
          const active = value === sig.value
          return (
            <button
              key={sig.value}
              title={sig.label}
              style={{
                width          : 32,
                height         : 32,
                borderRadius   : '50%',
                border         : `2px solid ${active ? sig.color : colors.border.light}`,
                backgroundColor: active ? sig.bg : 'transparent',
                color          : active ? sig.color : colors.text.muted,
                fontSize       : 14,
                fontWeight     : 700,
                cursor         : 'pointer',
                transition     : 'all 0.12s',
                display        : 'flex',
                alignItems     : 'center',
                justifyContent : 'center',
              }}
              onClick={() => onChange(sig.value)}
            >
              {sig.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function EvaluationsPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const user          = useAuthStore(s => s.user)

  const [session,     setSession]     = useState<Session | null>(null)
  const [children,    setChildren]    = useState<ChildEval[]>([])
  const [saving,      setSaving]      = useState<string | null>(null)
  const [savingAll,   setSavingAll]   = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)

  const load = async () => {
    try {
      const [sessionRes, evalsRes] = await Promise.all([
        getSessionById(sessionId),
        listMergedEvaluations(sessionId),
      ])
      setSession(sessionRes.data)

      const { data: childIds } = await listPresentChildIdsForSession(sessionId)
      const { data: profileMap2 } = await resolveProfileDisplayNames(childIds ?? [])
      const evalMap = new Map(
        (evalsRes.data as EvaluationMerged[]).map(e => [e.childId, e])
      )

      setChildren((childIds ?? []).map((childId: string) => {
        const ev = evalMap.get(childId)
        return {
          childId,
          displayName: profileMap2[childId] ?? childId.slice(0, 8),
          receptivite: ev?.receptivite ?? 'none',
          goutEffort : ev?.goutEffort  ?? 'none',
          attitude   : ev?.attitude    ?? 'none',
          topSeance  : ev?.topSeance   ?? 'none',
          note       : '',
          saved      : !!ev,
          dirty      : false,
          ignored    : false,
        }
      }))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coach/evaluations] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  const update = (childId: string, patch: Partial<ChildEval>, meta?: { markDirty?: boolean }) => {
    const markDirty = meta?.markDirty ?? !('ignored' in patch)
    setChildren(prev => prev.map(c =>
      c.childId === childId
        ? { ...c, ...patch, ...(markDirty ? { dirty: true, saved: false } : {}) }
        : c
    ))
  }

  const saveOne = async (child: ChildEval) => {
    if (!user?.id) return
    setSaving(child.childId)
    setSaveError(null)
    try {
      await applyEvaluationEvent({
        operationId: `${sessionId}-${child.childId}-${Date.now()}`,
        sessionId,
        childId    : child.childId,
        receptivite: child.receptivite,
        goutEffort : child.goutEffort,
        attitude   : child.attitude,
        topSeance  : child.topSeance,
        occurredAt : new Date().toISOString(),
      })
      setChildren(prev => prev.map(c => c.childId === child.childId ? { ...c, saved: true, dirty: false } : c))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[EvaluationsPage] saveOne error:', err)
      setSaveError('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setSaving(null)
    }
  }

  const saveAll = async () => {
    if (!user?.id) return
    setSavingAll(true)
    setSaveError(null)
    try {
      await Promise.all(children.map(child =>
        applyEvaluationEvent({
          operationId: `${sessionId}-${child.childId}-${Date.now()}`,
          sessionId,
          childId    : child.childId,
          receptivite: child.receptivite,
          goutEffort : child.goutEffort,
          attitude   : child.attitude,
          topSeance  : child.topSeance,
          occurredAt : new Date().toISOString(),
        })
      ))
      setChildren(prev => prev.map(c => ({ ...c, saved: true, dirty: false })))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[EvaluationsPage] saveAll error:', err)
      setSaveError('Erreur lors de la sauvegarde globale. Réessaie.')
    } finally {
      setSavingAll(false)
    }
  }

  if (loading) return <Skeleton sessionId={sessionId} />

  const savedCount   = children.filter(c => c.saved || c.ignored).length
  const topCount     = children.filter(c => c.topSeance === 'star').length
  const allSaved     = savedCount === children.length && children.length > 0
  const pendingCount = children.filter(c => !c.saved && !c.ignored).length

  return (
    <div style={E.page}>
      <style>{`
        .e-back:hover{color:${colors.accent.gold}}
        .e-btn:hover:not(:disabled){opacity:.85}
        .e-sig:hover{border-color:${colors.accent.gold}!important}
        .e-top:hover{opacity:.8}
        .e-note:focus{outline:none;border-color:${colors.accent.gold}!important}
      `}</style>

      <button className="e-back" style={E.back} onClick={() => router.push('/coach/sessions' as never)}>
        ← Mes séances
      </button>

      {session && (
        <div style={{ marginBottom: 16 }}>
          <h1 style={E.title}>
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h1>
          <div style={E.subtitle}>
            {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {` · ${session.durationMinutes} min`}
          </div>
        </div>
      )}

      <SubNav sessionId={sessionId} active="Évaluations" />

      {/* Warning : joueurs non évalués */}
      {pendingCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 8, marginBottom: 12,
          backgroundColor: 'rgba(255,193,7,0.12)',
          border: `1px solid ${colors.status.attention}`,
          fontSize: 13, color: colors.text.dark,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span>
            <strong>{pendingCount} joueur{pendingCount > 1 ? 's' : ''}</strong> non évalué{pendingCount > 1 ? 's' : ''} — validez ou ignorez avant de clôturer.
          </span>
        </div>
      )}

      {/* Status bar + Tout valider */}
      {children.length > 0 && (
        <div style={E.statusBar}>
          <div style={E.statusInfo}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: allSaved ? colors.status.present : colors.accent.gold }}>
              {savedCount}
            </span>
            <span style={{ fontSize: 13, color: colors.text.muted }}>
              / {children.length} évalués
            </span>
            {topCount > 0 && (
              <span style={{ fontSize: 13, color: colors.accent.gold, fontWeight: 600 }}>
                · ⭐ {topCount} top séance
              </span>
            )}
          </div>
          <button
            className="e-btn"
            style={{ ...E.btnSaveAll, ...(allSaved ? { backgroundColor: colors.status.present } : {}) }}
            onClick={saveAll}
            disabled={savingAll || children.length === 0}
          >
            {savingAll ? 'Sauvegarde…' : allSaved ? '✓ Tout enregistré' : 'Tout valider'}
          </button>
        </div>
      )}
      {saveError && (
        <div style={{ margin: '8px 0', padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(224,82,82,0.12)', color: colors.accent.red, fontSize: 13 }}>
          {saveError}
        </div>
      )}

      {/* Empty state */}
      {children.length === 0 ? (
        <div style={E.empty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div>Aucun enfant présent.</div>
          <div style={{ fontSize: 13, color: colors.text.muted, marginTop: 4 }}>
            Remplissez d'abord la feuille de présence.
          </div>
          <button
            className="e-btn"
            style={{ ...E.btnSaveAll, marginTop: 16 }}
            onClick={() => router.push(`/coach/sessions/${sessionId}/attendance` as never)}
          >
            Feuille de présence →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children.map(child => {
            const isSaving = saving === child.childId
            return (
              <div
                key={child.childId}
                style={{
                  ...E.card,
                  borderColor: child.ignored
                    ? colors.border.light
                    : child.saved
                      ? colors.status.present
                      : child.dirty
                        ? colors.accent.gold
                        : colors.border.light,
                  opacity: child.ignored ? 0.45 : 1,
                  transition: 'opacity 0.2s, border-color 0.2s',
                }}
              >
                {/* Header */}
                <div style={E.cardHead}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{child.displayName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Top séance toggle */}
                    <button
                      className="e-top"
                      style={{
                        background: 'none',
                        border    : 'none',
                        cursor    : 'pointer',
                        fontSize  : 20,
                        opacity   : child.topSeance === 'star' ? 1 : 0.22,
                        transition: 'opacity 0.15s',
                        padding   : 0,
                      }}
                      title="Top séance"
                      onClick={() => update(child.childId, { topSeance: child.topSeance === 'star' ? 'none' : 'star' })}
                    >
                      ⭐
                    </button>
                    {child.saved && !child.dirty && (
                      <span style={{ fontSize: 12, color: colors.status.present, fontWeight: 700 }}>✓ Enregistré</span>
                    )}
                    {child.dirty && (
                      <span style={{ fontSize: 12, color: colors.accent.gold, fontWeight: 600 }}>Modifié</span>
                    )}
                  </div>
                </div>

                {/* Signal buttons */}
                <div style={E.signals}>
                  <SignalButtons
                    label="Réceptivité"
                    value={child.receptivite}
                    onChange={v => update(child.childId, { receptivite: v })}
                  />
                  <SignalButtons
                    label="Effort"
                    value={child.goutEffort}
                    onChange={v => update(child.childId, { goutEffort: v })}
                  />
                  <SignalButtons
                    label="Attitude"
                    value={child.attitude}
                    onChange={v => update(child.childId, { attitude: v })}
                  />
                </div>

                {/* Note */}
                <textarea
                  className="e-note"
                  value={child.note}
                  onChange={e => update(child.childId, { note: e.target.value })}
                  placeholder="Note facultative pour ce joueur…"
                  rows={2}
                  style={E.note}
                />

                {/* Save button */}
                <button
                  className="e-btn"
                  style={{
                    ...E.btnSave,
                    opacity        : isSaving ? 0.5 : 1,
                    backgroundColor: child.saved && !child.dirty ? colors.light.muted : colors.accent.gold,
                    color          : child.saved && !child.dirty ? colors.text.muted : colors.text.dark,
                    border         : child.saved && !child.dirty ? `1px solid ${colors.border.light}` : 'none',
                  }}
                  onClick={() => saveOne(child)}
                  disabled={isSaving}
                >
                  {isSaving ? '…' : child.saved && !child.dirty ? 'Enregistré ✓' : 'Valider'}
                </button>
                {/* Ignorer */}
                <button
                  className="e-btn"
                  style={{
                    ...E.btnSave,
                    backgroundColor: child.ignored ? colors.light.muted : 'transparent',
                    color          : child.ignored ? colors.text.muted : colors.text.muted,
                    border         : `1px solid ${colors.border.light}`,
                    fontSize       : 13,
                  }}
                  onClick={() => update(child.childId, { ignored: !child.ignored })}
                >
                  {child.ignored ? 'Rétablir' : 'Ignorer'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const E: Record<string, React.CSSProperties> = {
  page      : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 780 },
  back      : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: 'color 0.15s' },
  title     : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 4px' },
  subtitle  : { fontSize: 13, color: colors.text.muted },
  subNav    : { display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20 },
  subNavBtn : { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'color 0.15s', paddingBottom: 10 },
  statusBar : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, marginBottom: 16 },
  statusInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  btnSaveAll: { padding: '8px 18px', borderRadius: 7, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' },
  card      : { backgroundColor: colors.light.surface, borderRadius: 12, padding: '16px 18px', border: '1px solid', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.2s' },
  cardHead  : { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  signals   : { display: 'flex', gap: 20, justifyContent: 'center', padding: '4px 0' },
  note      : { padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 13, resize: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' },
  btnSave   : { padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' },
  empty     : { textAlign: 'center', padding: '60px 0', color: colors.text.dark, fontSize: 14 },
}
