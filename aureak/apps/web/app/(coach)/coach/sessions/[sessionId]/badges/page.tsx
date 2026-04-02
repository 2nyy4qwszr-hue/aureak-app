'use client'
// Story 33.2 — Swipe Flow Badges (AC6)
// Enfants présents défilent un par un avec chips de badges à cocher
// Swipe / bouton gauche = passer sans badge, valider + suivant = enregistrer

import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import {
  getCoachSessionRoster, listAvailableBadges, awardBadge, removeBadge, listSessionBadgeAwards,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import type { BehavioralBadge } from '@aureak/types'
import type { RosterChild } from '@aureak/api-client'

// ─── Badge chip ───────────────────────────────────────────────────────────────

function BadgeChip({
  badge, selected, onClick,
}: { badge: BehavioralBadge; selected: boolean; onClick: () => void }) {
  return (
    <button
      style={{
        padding         : '8px 14px',
        borderRadius    : 24,
        border          : `2px solid ${selected ? colors.accent.gold : colors.border.light}`,
        backgroundColor : selected ? `${colors.accent.gold}22` : colors.light.surface,
        color           : selected ? colors.accent.gold : colors.text.muted,
        fontSize        : 13,
        fontWeight      : selected ? 700 : 400,
        cursor          : 'pointer',
        display         : 'flex',
        alignItems      : 'center',
        gap             : 6,
        transition      : `all ${transitions.fast}`,
      }}
      onClick={onClick}
    >
      <span style={{ fontSize: 16 }}>{badge.emoji}</span>
      {badge.name}
    </button>
  )
}

// ─── Récap ─────────────────────────────────────────────────────────────────────

type ChildBadgeResult = {
  childId      : string
  displayName  : string
  badgeIds     : string[]
}

function BadgeSummary({
  results, badges, onSend, sending,
}: {
  results  : ChildBadgeResult[]
  badges   : BehavioralBadge[]
  onSend   : () => void
  sending  : boolean
}) {
  const badgeMap = new Map(badges.map(b => [b.id, b]))
  const withBadges = results.filter(r => r.badgeIds.length > 0)
  const without    = results.filter(r => r.badgeIds.length === 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: colors.text.dark, fontFamily: 'Rajdhani, sans-serif' }}>
        Récapitulatif badges
      </div>

      {withBadges.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {withBadges.map(r => (
            <div key={r.childId} style={{
              backgroundColor: colors.light.surface, borderRadius: 10, padding: '12px 14px',
              border: `1px solid ${colors.border.light}`, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark, minWidth: 120 }}>
                {r.displayName}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.badgeIds.map(bid => {
                  const b = badgeMap.get(bid)
                  return b ? (
                    <span key={bid} style={{
                      padding: '3px 10px', borderRadius: 12,
                      backgroundColor: `${colors.accent.gold}22`,
                      color: colors.accent.gold, fontSize: 12, fontWeight: 700,
                    }}>
                      {b.emoji} {b.name}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {without.length > 0 && (
        <div style={{ fontSize: 12, color: colors.text.subtle }}>
          {without.length} enfant{without.length > 1 ? 's' : ''} sans badge : {without.map(r => r.displayName).join(', ')}
        </div>
      )}

      <button
        style={{
          padding: '14px 0', borderRadius: 10, border: 'none',
          backgroundColor: colors.accent.gold, color: colors.text.dark,
          fontSize: 15, fontWeight: 800, cursor: 'pointer',
          opacity: sending ? 0.6 : 1, transition: `all ${transitions.fast}`,
        }}
        onClick={onSend}
        disabled={sending}
      >
        {sending ? 'Enregistrement…' : `✓ Envoyer tout (${withBadges.length} badge${withBadges.length > 1 ? 's' : ''})`}
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SessionBadgesPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const user          = useAuthStore(s => s.user)
  const tenantId      = useAuthStore(s => (s.user as { tenantId?: string } | null)?.tenantId ?? '')

  const [presentChildren, setPresentChildren] = useState<RosterChild[]>([])
  const [badges,          setBadges]          = useState<BehavioralBadge[]>([])
  const [loading,         setLoading]         = useState(true)

  // Swipe state
  const [currentIndex,  setCurrentIndex]  = useState(0)
  const [selectedBadges, setSelectedBadges] = useState<Record<number, Set<string>>>({})
  const [done,           setDone]          = useState(false)
  const [sending,        setSending]       = useState(false)
  const [toast,          setToast]         = useState<string | null>(null)

  // Swipe gesture
  const dragStart = useRef<number | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [rosterRes, badgesRes, existingRes] = await Promise.all([
          getCoachSessionRoster(sessionId),
          listAvailableBadges(tenantId),
          listSessionBadgeAwards(sessionId),
        ])

        // Only present children
        const present = (rosterRes.data ?? []).filter(c => c.status === 'present' || c.status === 'late')
        setPresentChildren(present)
        setBadges(badgesRes.data ?? [])

        // Pre-fill with existing awards
        const existing = existingRes.data ?? []
        const preselect: Record<number, Set<string>> = {}
        present.forEach((c, idx) => {
          const awardedBadges = existing.filter(a => a.childId === c.childId).map(a => a.badgeId)
          if (awardedBadges.length > 0) preselect[idx] = new Set(awardedBadges)
        })
        setSelectedBadges(preselect)
      } finally {
        setLoading(false)
      }
    }
    if (tenantId) load()
  }, [sessionId, tenantId])

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => {
      const current = new Set(prev[currentIndex] ?? [])
      if (current.has(badgeId)) current.delete(badgeId); else current.add(badgeId)
      return { ...prev, [currentIndex]: current }
    })
  }

  const goNext = () => {
    if (currentIndex < presentChildren.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setDone(true)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  const handleSendAll = async () => {
    if (!user?.id) return
    setSending(true)
    try {
      for (let i = 0; i < presentChildren.length; i++) {
        const child   = presentChildren[i]
        const sel     = selectedBadges[i] ?? new Set<string>()
        // Award selected
        for (const badgeId of sel) {
          await awardBadge({ tenantId, sessionId, childId: child.childId, badgeId, coachId: user.id })
        }
      }
      showToast('✓ Badges enregistrés !')
    } finally {
      setSending(false)
    }
  }

  // Drag-to-skip
  const handleDragStart = (e: React.MouseEvent) => { dragStart.current = e.clientX }
  const handleDragEnd   = (e: React.MouseEvent) => {
    if (dragStart.current === null) return
    const delta = e.clientX - dragStart.current
    dragStart.current = null
    if (delta < -60) goNext()        // swipe left = skip
    else if (delta > 60) goPrev()    // swipe right = back
  }

  if (loading) return (
    <div style={S.page}>
      <style>{`@keyframes sk{0%,100%{opacity:.15}50%{opacity:.4}} .sk{background:${colors.light.muted};border-radius:12px;animation:sk 1.8s ease-in-out infinite}`}</style>
      <div className="sk" style={{ height: 300, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="sk" style={{ height: 40, width: 100 }} />)}
      </div>
    </div>
  )

  if (presentChildren.length === 0) return (
    <div style={S.page}>
      <div style={{ fontSize: 14, color: colors.text.muted, textAlign: 'center', marginTop: 40 }}>
        Aucun enfant présent — complétez les présences d'abord.
      </div>
    </div>
  )

  if (done) {
    const results: ChildBadgeResult[] = presentChildren.map((c, i) => ({
      childId    : c.childId,
      displayName: c.displayName,
      badgeIds   : [...(selectedBadges[i] ?? new Set<string>())],
    }))
    return (
      <div style={S.page}>
        <BadgeSummary results={results} badges={badges} onSend={handleSendAll} sending={sending} />
        <button
          style={{ marginTop: 12, fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => { setDone(false); setCurrentIndex(presentChildren.length - 1) }}
        >
          ← Revenir en arrière
        </button>
        {toast && (
          <div style={S.toast}>{toast}</div>
        )}
      </div>
    )
  }

  const child    = presentChildren[currentIndex]
  const selBadges = selectedBadges[currentIndex] ?? new Set<string>()
  const comportementaux = badges.filter(b => b.category === 'comportemental')
  const thematiques     = badges.filter(b => b.category === 'thematique')

  const progress = `${currentIndex + 1} / ${presentChildren.length}`

  return (
    <div style={S.page}>
      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: colors.text.muted }}>Badges — {progress}</div>
          <div style={{ fontSize: 12, color: colors.text.subtle }}>Swipe ← pour passer</div>
        </div>
        <div style={{ height: 4, backgroundColor: colors.light.muted, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, backgroundColor: colors.accent.gold,
            width: `${((currentIndex + 1) / presentChildren.length) * 100}%`,
            transition: `width ${transitions.normal}`,
          }} />
        </div>
      </div>

      {/* Carte enfant */}
      <div
        style={{
          backgroundColor : colors.light.surface,
          borderRadius    : 16,
          padding         : '24px 20px',
          boxShadow       : shadows.md,
          border          : `1px solid ${colors.border.light}`,
          marginBottom    : 20,
          userSelect      : 'none',
          cursor          : 'grab',
        } as React.CSSProperties}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.accent.gold + '33',
            border: `2px solid ${colors.accent.gold}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: colors.accent.gold,
            fontFamily: 'Rajdhani, sans-serif', margin: '0 auto 12px',
          }}>
            {child.displayName.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.text.dark, fontFamily: 'Rajdhani, sans-serif' }}>
            {child.displayName}
          </div>
          {selBadges.size > 0 && (
            <div style={{ fontSize: 12, color: colors.accent.gold, fontWeight: 600, marginTop: 4 }}>
              {selBadges.size} badge{selBadges.size > 1 ? 's' : ''} sélectionné{selBadges.size > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Badges comportementaux */}
        <div style={S.badgeSection}>
          <div style={S.badgeGroupLabel}>Comportementaux</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {comportementaux.map(b => (
              <BadgeChip
                key={b.id}
                badge={b}
                selected={selBadges.has(b.id)}
                onClick={() => toggleBadge(b.id)}
              />
            ))}
          </div>
        </div>

        {thematiques.length > 0 && (
          <div style={S.badgeSection}>
            <div style={S.badgeGroupLabel}>Thématiques</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {thematiques.map(b => (
                <BadgeChip
                  key={b.id}
                  badge={b}
                  selected={selBadges.has(b.id)}
                  onClick={() => toggleBadge(b.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions nav */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          style={{
            ...S.navBtn,
            backgroundColor: colors.light.muted,
            color: colors.text.muted,
            flex: 0, minWidth: 44,
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          ←
        </button>
        <button
          style={{
            ...S.navBtn,
            backgroundColor: colors.light.muted,
            color: colors.text.muted,
            flex: 1,
          }}
          onClick={goNext}
        >
          {currentIndex < presentChildren.length - 1 ? 'Passer →' : 'Terminer →'}
        </button>
        <button
          style={{
            ...S.navBtn,
            backgroundColor: selBadges.size > 0 ? colors.accent.gold : colors.light.muted,
            color: selBadges.size > 0 ? colors.text.dark : colors.text.muted,
            flex: 1,
            fontWeight: 800,
          }}
          onClick={goNext}
        >
          {selBadges.size > 0
            ? `✓ Valider (${selBadges.size})`
            : 'Valider sans badge'
          }
        </button>
      </div>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page           : { padding: '16px 20px', backgroundColor: 'transparent', minHeight: 400 },
  badgeSection   : { marginTop: 16 },
  badgeGroupLabel: { fontSize: 11, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  navBtn         : { padding: '12px 0', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: `all ${transitions.fast}` },
  toast          : { position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', backgroundColor: colors.light.surface, borderRadius: 10, padding: '12px 20px', boxShadow: shadows.lg, fontSize: 13, fontWeight: 600, color: colors.text.dark, border: `1px solid ${colors.border.light}`, whiteSpace: 'nowrap', zIndex: 300 } as React.CSSProperties,
}
