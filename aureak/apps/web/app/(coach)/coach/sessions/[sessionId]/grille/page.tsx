'use client'
// Story 33.2 — Grille Photos Présences Coach
// AC1: grille photos + tap, AC2: popup retard, AC3: double check-in,
// AC4: flip card, AC5: ajout essai, AC7: photo souvenir, AC8: draft localStorage

import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import {
  getCoachSessionRoster, markAttendance, addTrialByCoach, uploadSessionPhoto,
  getChildSessionCard, listSessionPhotos,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import type { AttendanceStatus, LateType } from '@aureak/types'
import type { RosterChild, ChildSessionCard } from '@aureak/api-client'

// ─── Draft localStorage ───────────────────────────────────────────────────────

function getDraftKey(sessionId: string) { return `aureak_attendance_draft_${sessionId}` }

function loadDraft(sessionId: string): Record<string, { status: AttendanceStatus; lateType: LateType | null }> {
  try {
    const raw = localStorage.getItem(getDraftKey(sessionId))
    if (!raw) return {}
    const { data, savedAt } = JSON.parse(raw) as { data: Record<string, { status: AttendanceStatus; lateType: LateType | null }>; savedAt: number }
    // Draft valide 6h
    if (Date.now() - savedAt > 6 * 60 * 60 * 1000) { localStorage.removeItem(getDraftKey(sessionId)); return {} }
    return data
  } catch { return {} }
}

function saveDraft(sessionId: string, data: Record<string, { status: AttendanceStatus; lateType: LateType | null }>) {
  try { localStorage.setItem(getDraftKey(sessionId), JSON.stringify({ data, savedAt: Date.now() })) } catch {}
}

function clearDraft(sessionId: string) {
  try { localStorage.removeItem(getDraftKey(sessionId)) } catch {}
}

// ─── Status colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AttendanceStatus | 'null', { bg: string; border: string; label: string; text: string }> = {
  null         : { bg: colors.light.muted,                        border: colors.border.light,  label: '—',         text: colors.text.subtle },
  present      : { bg: 'rgba(16,185,129,0.15)',                   border: '#10B981',             label: '✓ Présent', text: '#10B981' },
  late         : { bg: 'rgba(251,191,36,0.15)',                   border: '#FBBF24',             label: '⏱ Retard',  text: '#FBBF24' },
  absent       : { bg: 'rgba(239,68,68,0.12)',                    border: colors.status.absent,  label: '✗ Absent',  text: colors.status.absent },
  injured      : { bg: 'rgba(239,68,68,0.08)',                    border: colors.status.absent,  label: '🩹 Blessé', text: colors.status.absent },
  trial        : { bg: `${colors.accent.gold}22`,                 border: colors.accent.gold,    label: '🔵 Essai',  text: colors.accent.gold },
  unconfirmed  : { bg: colors.light.muted,                        border: colors.border.divider, label: '? Non conf.', text: colors.text.subtle },
}

// ─── Composant Flip Card ─────────────────────────────────────────────────────

function ChildFlipCard({
  child, isFlipped, onFlip, onStatusChange, saving,
}: {
  child       : RosterChild
  isFlipped   : boolean
  onFlip      : () => void
  onStatusChange : (status: AttendanceStatus) => void
  saving      : boolean
}) {
  const sc = STATUS_COLORS[child.status ?? 'null']
  const [cardBack, setCardBack] = useState<ChildSessionCard | null>(null)
  const [loadingBack, setLoadingBack] = useState(false)
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()

  const loadBack = useCallback(async () => {
    if (cardBack || loadingBack) return
    setLoadingBack(true)
    try {
      const { data } = await getChildSessionCard(child.childId, sessionId)
      setCardBack(data)
    } finally {
      setLoadingBack(false)
    }
  }, [child.childId, sessionId, cardBack, loadingBack])

  useEffect(() => { if (isFlipped) loadBack() }, [isFlipped])

  const initials = child.displayName
    .split(' ')
    .map(p => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      style={{
        width: 120, height: 150, perspective: 800, cursor: 'pointer', flexShrink: 0,
      }}
      onClick={onFlip}
    >
      <div style={{
        position       : 'relative',
        width          : '100%',
        height         : '100%',
        transformStyle : 'preserve-3d',
        transition     : `transform 0.4s ease`,
        transform      : isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* FACE */}
        <div style={{
          position        : 'absolute',
          inset           : 0,
          backfaceVisibility: 'hidden',
          backgroundColor : sc.bg,
          border          : `2px solid ${sc.border}`,
          borderRadius    : 12,
          display         : 'flex',
          flexDirection   : 'column',
          alignItems      : 'center',
          justifyContent  : 'space-between',
          padding         : '10px 8px',
          boxShadow       : shadows.sm,
        } as React.CSSProperties}>
          {/* Avatar */}
          {child.avatarUrl ? (
            <img
              src={child.avatarUrl}
              alt={child.displayName}
              style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover', border: `2px solid ${sc.border}` }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: sc.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#fff',
              fontFamily: 'Rajdhani, sans-serif',
            }}>
              {initials}
            </div>
          )}
          {/* Prénom */}
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.dark, textAlign: 'center', lineHeight: 1.3 }}>
            {child.displayName.split(' ')[0]}
          </div>
          {/* Statut */}
          <div style={{ fontSize: 10, color: sc.text, fontWeight: 700 }}>{sc.label}</div>
          {saving && (
            <div style={{ fontSize: 9, color: colors.text.subtle, position: 'absolute', bottom: 3, right: 6 }}>…</div>
          )}
          {child.attendanceType === 'trial' && (
            <div style={{
              position: 'absolute', top: 4, right: 4,
              fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 4,
              backgroundColor: colors.accent.gold, color: colors.text.dark,
            }}>ESSAI</div>
          )}
        </div>

        {/* DOS */}
        <div style={{
          position        : 'absolute',
          inset           : 0,
          backfaceVisibility: 'hidden',
          transform       : 'rotateY(180deg)',
          backgroundColor : colors.light.surface,
          border          : `2px solid ${colors.accent.gold}`,
          borderRadius    : 12,
          display         : 'flex',
          flexDirection   : 'column',
          padding         : '8px',
          boxShadow       : shadows.md,
          gap             : 4,
          overflow        : 'hidden',
        } as React.CSSProperties}>
          <div style={{ fontSize: 13, fontWeight: 800, color: colors.text.dark, fontFamily: 'Rajdhani, sans-serif' }}>
            {child.displayName.split(' ')[0]}
          </div>
          {loadingBack ? (
            <div style={{ fontSize: 10, color: colors.text.subtle }}>Chargement…</div>
          ) : cardBack ? (
            <>
              <div style={{ fontSize: 10, color: colors.text.muted }}>
                📅 {cardBack.presentThisMonth} présence{cardBack.presentThisMonth > 1 ? 's' : ''} ce mois
              </div>
              <div style={{ fontSize: 10, color: cardBack.evalDone ? '#10B981' : colors.status.absent }}>
                {cardBack.evalDone ? '✅ Éval. faite' : '🔴 Éval. manquante'}
              </div>
              {cardBack.activeTechSignal && (
                <div style={{ fontSize: 9, color: '#FBBF24', fontWeight: 600, lineHeight: 1.3 }}>
                  ⚡ {cardBack.activeTechSignal.errorObserved.slice(0, 40)}
                </div>
              )}
              {cardBack.recentBadges.length > 0 && (
                <div style={{ fontSize: 10, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {cardBack.recentBadges.slice(0, 3).map((b, i) => (
                    <span key={i} style={{
                      padding: '1px 5px', borderRadius: 4,
                      backgroundColor: `${colors.accent.gold}22`,
                      color: colors.accent.gold, fontWeight: 700,
                    }}>
                      {b.emoji}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : null}
          {/* Quick actions sur le dos */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
            {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => (
              <button
                key={s}
                style={{
                  flex: 1, padding: '3px 0', borderRadius: 4, border: 'none',
                  fontSize: 9, fontWeight: 700, cursor: 'pointer',
                  backgroundColor: child.status === s ? STATUS_COLORS[s].border : colors.light.muted,
                  color: child.status === s ? '#fff' : colors.text.muted,
                }}
                onClick={e => { e.stopPropagation(); onStatusChange(s) }}
              >
                {s === 'present' ? '✓' : s === 'absent' ? '✗' : '⏱'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal retard ─────────────────────────────────────────────────────────────

function LatePopup({ onSelect }: { onSelect: (t: LateType) => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    } as React.CSSProperties}>
      <div style={{
        backgroundColor: colors.light.surface, borderRadius: 14, padding: 24,
        boxShadow: shadows.lg, minWidth: 240, textAlign: 'center',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text.dark, marginBottom: 16 }}>
          Retard — durée ?
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: `2px solid ${colors.accent.gold}`,
              backgroundColor: `${colors.accent.gold}22`, color: colors.accent.gold,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
            onClick={() => onSelect('under_15')}
          >
            &lt; 15 min
          </button>
          <button
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '2px solid #FBBF24',
              backgroundColor: 'rgba(251,191,36,0.15)', color: '#D97706',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
            onClick={() => onSelect('over_15')}
          >
            &gt; 15 min
          </button>
        </div>
        <button
          style={{
            marginTop: 12, fontSize: 12, color: colors.text.muted,
            background: 'none', border: 'none', cursor: 'pointer',
          }}
          onClick={() => onSelect('under_15')}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── Modal ajout essai ────────────────────────────────────────────────────────

function TrialModal({
  tenantId, sessionId, coachId,
  onClose, onAdded,
}: {
  tenantId  : string
  sessionId : string
  coachId   : string
  onClose   : () => void
  onAdded   : () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [birthYear, setBirthYear] = useState(String(new Date().getFullYear() - 12))
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError('Prénom et nom requis'); return }
    const year = parseInt(birthYear, 10)
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
      setError('Année de naissance invalide')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const { error: apiErr } = await addTrialByCoach({
        firstName, lastName, birthYear: year,
        tenantId, sessionId, coachId,
      })
      if (apiErr) { setError('Erreur lors de l\'ajout. Réessayez.'); return }
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    } as React.CSSProperties}>
      <div style={{
        backgroundColor: colors.light.surface, borderRadius: 14, padding: 28,
        boxShadow: shadows.lg, width: 340,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.text.dark, marginBottom: 20 }}>
          ➕ Ajouter un enfant essai
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={I.input}
            placeholder="Prénom"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
          <input
            style={I.input}
            placeholder="Nom de famille"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
          <input
            style={I.input}
            placeholder="Année de naissance (ex: 2013)"
            value={birthYear}
            onChange={e => setBirthYear(e.target.value)}
            type="number"
            min={2000}
            max={new Date().getFullYear()}
          />
        </div>
        {error && <div style={{ fontSize: 12, color: colors.status.absent, marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button style={I.btnSecondary} onClick={onClose} disabled={saving}>Annuler</button>
          <button style={{ ...I.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: colors.text.subtle, marginTop: 10 }}>
          L'admin sera notifié pour validation.
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SessionGrillePage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const user          = useAuthStore(s => s.user)
  const tenantId      = useAuthStore(s => (s.user as { tenantId?: string } | null)?.tenantId ?? '')

  const [children,       setChildren]      = useState<RosterChild[]>([])
  const [loading,        setLoading]       = useState(true)
  const [flipped,        setFlipped]       = useState<Set<string>>(new Set())
  const [savingIds,      setSavingIds]     = useState<Set<string>>(new Set())
  const [lateChild,      setLateChild]     = useState<string | null>(null)
  const [showTrialModal, setTrialModal]    = useState(false)
  const [hasDraft,       setHasDraft]      = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoCount,     setPhotoCount]    = useState(0)
  const [toast,          setToast]         = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tap double-click state
  const tapTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const tapCounts = useRef<Record<string, number>>({})

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const loadRoster = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getCoachSessionRoster(sessionId)
      // Apply draft on top of server state
      const draft = loadDraft(sessionId)
      setHasDraft(Object.keys(draft).length > 0)
      setChildren(data.map(c => {
        const d = draft[c.childId]
        return d ? { ...c, status: d.status, lateType: d.lateType } : c
      }))
      const { data: photos } = await listSessionPhotos(sessionId)
      setPhotoCount(photos?.length ?? 0)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { loadRoster() }, [loadRoster])

  const applyStatus = useCallback(async (childId: string, status: AttendanceStatus, lateType?: LateType) => {
    if (!user?.id) return

    // Optimistic update
    setChildren(prev => prev.map(c => c.childId === childId ? { ...c, status, lateType: lateType ?? null } : c))

    // Save draft
    const current = children.reduce((acc, c) => {
      acc[c.childId] = { status: c.status ?? 'unconfirmed', lateType: c.lateType }
      return acc
    }, {} as Record<string, { status: AttendanceStatus; lateType: LateType | null }>)
    current[childId] = { status, lateType: lateType ?? null }
    saveDraft(sessionId, current)
    setHasDraft(true)

    setSavingIds(prev => new Set([...prev, childId]))
    try {
      await markAttendance({
        tenantId, sessionId, childId,
        coachId : user.id,
        status,
        lateType,
      })
      // Clear draft for this child on success
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(childId); return s })
    }
  }, [user?.id, tenantId, sessionId, children])

  // Tap → présent / double tap → absent / card click → flip
  const handleCardTap = useCallback((childId: string) => {
    const count = (tapCounts.current[childId] ?? 0) + 1
    tapCounts.current[childId] = count

    if (tapTimers.current[childId]) clearTimeout(tapTimers.current[childId])

    tapTimers.current[childId] = setTimeout(() => {
      const c = tapCounts.current[childId] ?? 1
      tapCounts.current[childId] = 0

      if (c >= 2) {
        // Double tap = absent
        applyStatus(childId, 'absent')
      } else {
        // Single tap = toggle présent / flip if already présent
        const child = children.find(x => x.childId === childId)
        if (child?.status === 'present') {
          // Flip card
          setFlipped(prev => {
            const s = new Set(prev)
            if (s.has(childId)) s.delete(childId); else s.add(childId)
            return s
          })
        } else {
          applyStatus(childId, 'present')
        }
      }
    }, 280)
  }, [children, applyStatus])

  const handleLongPress = useCallback((childId: string) => {
    const child = children.find(c => c.childId === childId)
    if (child?.status === 'present') {
      // Long press on présent = retard popup
      setLateChild(childId)
    }
  }, [children])

  const handleLateSelect = async (t: LateType) => {
    if (!lateChild) return
    setLateChild(null)
    await applyStatus(lateChild, 'late', t)
  }

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id || !tenantId) return
    setPhotoUploading(true)
    try {
      const { error } = await uploadSessionPhoto({ tenantId, sessionId, coachId: user.id, file })
      if (error) { showToast('Erreur lors de l\'upload'); return }
      setPhotoCount(p => p + 1)
      showToast('📸 Photo souvenir enregistrée !')
    } finally {
      setPhotoUploading(false)
    }
  }

  const unconfirmedCount = children.filter(c => !c.status || c.status === 'unconfirmed').length

  if (loading) {
    return (
      <div style={S.page}>
        <style>{`@keyframes sk{0%,100%{opacity:.15}50%{opacity:.4}} .sk{background:${colors.light.muted};border-radius:12px;animation:sk 1.8s ease-in-out infinite}`}</style>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="sk" style={{ width: 120, height: 150 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <style>{`
        .card-wrap:hover { transform: translateY(-2px); transition: transform 0.15s ease; }
        .status-btn:hover { opacity: 0.85 !important; }
      `}</style>

      {/* ── Draft banner ── */}
      {hasDraft && (
        <div style={S.draftBanner}>
          💾 Brouillon en cours —{' '}
          <button
            style={{ background: 'none', border: 'none', color: colors.accent.gold, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
            onClick={() => { clearDraft(sessionId); loadRoster() }}
          >
            Effacer le brouillon
          </button>
        </div>
      )}

      {/* ── Header stats ── */}
      <div style={S.statsRow}>
        <div style={S.statPill}>
          <span style={{ color: '#10B981', fontWeight: 700 }}>{children.filter(c => c.status === 'present').length}</span> présents
        </div>
        <div style={S.statPill}>
          <span style={{ color: '#FBBF24', fontWeight: 700 }}>{children.filter(c => c.status === 'late').length}</span> retards
        </div>
        <div style={S.statPill}>
          <span style={{ color: colors.status.absent, fontWeight: 700 }}>{children.filter(c => c.status === 'absent').length}</span> absents
        </div>
        {unconfirmedCount > 0 && (
          <div style={{ ...S.statPill, backgroundColor: 'rgba(251,191,36,0.15)', borderColor: '#FBBF24' }}>
            <span style={{ color: '#D97706', fontWeight: 700 }}>⚠ {unconfirmedCount}</span> non conf.
          </div>
        )}
      </div>

      {/* ── Grille photos ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {children.map(child => {
          let pressTimer: ReturnType<typeof setTimeout>
          return (
            <div
              key={child.childId}
              className="card-wrap"
              onMouseDown={() => {
                pressTimer = setTimeout(() => handleLongPress(child.childId), 500)
              }}
              onMouseUp={() => clearTimeout(pressTimer)}
              onMouseLeave={() => clearTimeout(pressTimer)}
              onClick={() => handleCardTap(child.childId)}
            >
              <ChildFlipCard
                child={child}
                isFlipped={flipped.has(child.childId)}
                onFlip={() => {
                  setFlipped(prev => {
                    const s = new Set(prev)
                    if (s.has(child.childId)) s.delete(child.childId); else s.add(child.childId)
                    return s
                  })
                }}
                onStatusChange={status => applyStatus(child.childId, status)}
                saving={savingIds.has(child.childId)}
              />
            </div>
          )
        })}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          style={S.actionBtn}
          onClick={() => setTrialModal(true)}
        >
          ➕ Ajouter essai
        </button>

        {/* Photo souvenir */}
        <button
          style={{ ...S.actionBtn, opacity: photoUploading ? 0.6 : 1 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={photoUploading}
        >
          {photoUploading ? '⏳ Upload…' : `📸 Photo souvenir${photoCount > 0 ? ` (${photoCount})` : ''}`}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handlePhotoUpload(f)
          }}
        />
      </div>

      {/* ── Légende ── */}
      <div style={{ fontSize: 11, color: colors.text.subtle, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <span>1 clic = ✓ Présent</span>
        <span>2 clics rapides = ✗ Absent</span>
        <span>Long appui sur présent = ⏱ Retard</span>
        <span>Clic sur présent = Retourner carte</span>
      </div>

      {/* ── Modals ── */}
      {lateChild && <LatePopup onSelect={handleLateSelect} />}
      {showTrialModal && user?.id && (
        <TrialModal
          tenantId={tenantId}
          sessionId={sessionId}
          coachId={user.id}
          onClose={() => setTrialModal(false)}
          onAdded={() => { setTrialModal(false); loadRoster() }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: colors.light.surface, borderRadius: 10, padding: '12px 20px',
          boxShadow: shadows.lg, fontSize: 13, fontWeight: 600, color: colors.text.dark,
          border: `1px solid ${colors.border.light}`, whiteSpace: 'nowrap', zIndex: 300,
        } as React.CSSProperties}>
          {toast}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page      : { padding: '16px 20px', backgroundColor: 'transparent', minHeight: 400 },
  draftBanner: { backgroundColor: `${colors.accent.gold}18`, border: `1px solid ${colors.accent.gold}55`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: colors.text.dark, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  statsRow  : { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statPill  : { backgroundColor: colors.light.surface, border: `1px solid ${colors.border.light}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: colors.text.muted },
  actionBtn : { padding: '8px 16px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: shadows.sm },
}

const I: Record<string, React.CSSProperties> = {
  input       : { padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, fontSize: 14, color: colors.text.dark, width: '100%', boxSizing: 'border-box' },
  btnPrimary  : { flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
