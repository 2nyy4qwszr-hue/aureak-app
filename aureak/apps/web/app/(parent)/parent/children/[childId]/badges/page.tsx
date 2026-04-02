'use client'
// Story 33.3 — Vue Parent : Historique Badges & Streak
// AC4: historique badges, AC5: photo souvenir, AC7: streak Epic 12

import { useEffect, useState, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getChildBadgeHistory, getProfileDisplayName,
} from '@aureak/api-client'
import { colors, shadows, transitions } from '@aureak/theme'
import type { ChildBadgeHistory } from '@aureak/types'

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

function SubNav({ childId, active }: { childId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Fiche',      href: `/parent/children/${childId}`                   },
    { label: 'Séances',    href: `/parent/children/${childId}/sessions`          },
    { label: 'Présences',  href: `/parent/children/${childId}/presences`         },
    { label: 'Badges',     href: `/parent/children/${childId}/badges`            },
    { label: 'Progression',href: `/parent/children/${childId}/progress`          },
    { label: 'Football',   href: `/parent/children/${childId}/football-history`  },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20, overflowX: 'auto' }}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13,
            color: active === tab.label ? colors.accent.gold : colors.text.muted,
            borderBottom: `2px solid ${active === tab.label ? colors.accent.gold : 'transparent'}`,
            whiteSpace: 'nowrap',
          }}
          onClick={() => router.push(tab.href as never)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChildBadgesPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [history,     setHistory]     = useState<ChildBadgeHistory[]>([])
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [badgesRes, nameRes] = await Promise.all([
        getChildBadgeHistory(childId),
        getProfileDisplayName(childId),
      ])
      setDisplayName(nameRes.data ?? '')
      setHistory(badgesRes.data)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={S.page}>
      <style>{`@keyframes sk{0%,100%{opacity:.15}50%{opacity:.4}} .sk{background:${colors.light.muted};border-radius:8px;animation:sk 1.8s ease-in-out infinite}`}</style>
      <div className="sk" style={{ height: 36, marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="sk" style={{ width: 100, height: 80 }} />)}
      </div>
      {[...Array(5)].map((_, i) => <div key={i} className="sk" style={{ height: 56, marginBottom: 8 }} />)}
    </div>
  )

  // Badge frequency counts
  const badgeCounts = new Map<string, { name: string; emoji: string; count: number }>()
  for (const h of history) {
    const existing = badgeCounts.get(h.badgeId)
    if (existing) existing.count++
    else badgeCounts.set(h.badgeId, { name: h.badgeName, emoji: h.emoji, count: 1 })
  }
  const sortedBadges = [...badgeCounts.values()].sort((a, b) => b.count - a.count)

  return (
    <div style={S.page}>
      <button style={S.back} onClick={() => router.push('/parent' as never)}>← Mes enfants</button>
      <h1 style={S.title}>{displayName}</h1>

      <SubNav childId={childId} active="Badges" />

      {history.length === 0 ? (
        <div style={{ fontSize: 14, color: colors.text.muted, textAlign: 'center', padding: '40px 0' }}>
          Aucun badge reçu pour le moment.<br />
          <span style={{ fontSize: 12, color: colors.text.subtle }}>Les badges sont attribués par le coach après chaque séance.</span>
        </div>
      ) : (
        <>
          {/* Badge frequency counters */}
          <div style={S.card}>
            <div style={S.cardTitle}>Badges reçus cette saison</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {sortedBadges.map(b => (
                <div key={b.name} style={{
                  backgroundColor: `${colors.accent.gold}18`,
                  border: `1px solid ${colors.accent.gold}55`,
                  borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 80,
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{b.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
                    ×{b.count} fois
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historique détaillé */}
          <div style={S.card}>
            <div style={S.cardTitle}>Historique détaillé</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 10px', borderRadius: 8,
                  backgroundColor: colors.light.primary,
                  border: `1px solid ${colors.border.light}`,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{h.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.text.dark }}>{h.badgeName}</div>
                    <div style={{ fontSize: 11, color: colors.text.muted }}>
                      Par {h.awardedByName} ·{' '}
                      {new Date(h.sessionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 8,
                    backgroundColor: `${colors.accent.gold}22`, color: colors.accent.gold, fontWeight: 700,
                  }}>
                    {new Date(h.sessionDate).toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page     : { padding: '24px 28px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  back     : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 },
  title    : { fontSize: 22, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 16px' },
  card     : { backgroundColor: colors.light.surface, borderRadius: 12, padding: '16px 18px', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 },
}
