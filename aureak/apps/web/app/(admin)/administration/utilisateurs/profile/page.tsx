'use client'
// Admin Profile — niveau XP + badges + stats d'activité (Story 59-8)

import { useEffect, useState } from 'react'
import { getAdminProfile, getAdminActivityStats } from '@aureak/api-client'
import type { AdminProfile, AdminActivityStats } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius, transitions, gamification, typography, resolveLevel } from '@aureak/theme'
import { BadgeGrid } from '@aureak/ui'
import type { BadgeItem } from '@aureak/types'

// ── Niveaux admin — 5 badges intégrés (Story 59-8, AC5) ─────────────────────

const ADMIN_BADGES: BadgeItem[] = [
  {
    id         : 'ADMIN_VETERAN',
    label      : 'Vétéran',
    description: '100 séances créées',
    icon       : '🏟️',
    unlocked   : false,
  },
  {
    id         : 'ADMIN_COACH_STAR',
    label      : 'Coach Star',
    description: '10 coaches gérés',
    icon       : '⭐',
    unlocked   : false,
  },
  {
    id         : 'ADMIN_BADGE_MASTER',
    label      : 'Badge Master',
    description: '50 badges accordés',
    icon       : '🥇',
    unlocked   : false,
  },
  {
    id         : 'ADMIN_SAISON_COMPLETE',
    label      : 'Saison complète',
    description: 'Saison académique finalisée',
    icon       : '🏆',
    unlocked   : false,
  },
  {
    id         : 'ADMIN_ARCHITECT',
    label      : 'Architecte',
    description: '5 stages créés',
    icon       : '🏗️',
    unlocked   : false,
  },
]

/** Calcule quels badges admin sont débloqués selon les stats */
function computeAdminBadges(stats: AdminActivityStats): BadgeItem[] {
  return ADMIN_BADGES.map(b => {
    let unlocked = false
    switch (b.id) {
      case 'ADMIN_VETERAN':        unlocked = stats.sessionsCreated      >= 100; break
      case 'ADMIN_COACH_STAR':     unlocked = false; break  // coaches non trackés en V1
      case 'ADMIN_BADGE_MASTER':   unlocked = stats.badgesAwarded        >= 50;  break
      case 'ADMIN_SAISON_COMPLETE':unlocked = stats.evaluationsValidated >= 1;   break
      case 'ADMIN_ARCHITECT':      unlocked = false; break  // stages non trackés en V1
    }
    return { ...b, unlocked }
  })
}

// ── Calcul barre XP ──────────────────────────────────────────────────────────

const XP_TIER_THRESHOLDS = [
  { tier: 'bronze',   min: 0,     max: 499    },
  { tier: 'silver',   min: 500,   max: 1499   },
  { tier: 'gold',     min: 1500,  max: 3499   },
  { tier: 'platinum', min: 3500,  max: 6999   },
  { tier: 'diamond',  min: 7000,  max: 9999   },
  { tier: 'legend',   min: 10000, max: 999999 },
]

function resolveXpTier(xp: number) {
  return XP_TIER_THRESHOLDS.find(t => xp >= t.min && xp <= t.max) ?? XP_TIER_THRESHOLDS[0]
}

function SkeletonBlock({ h, w = '100%' }: { h: number; w?: string }) {
  return (
    <div style={{
      height         : h,
      width          : w,
      borderRadius   : radius.xs,
      backgroundColor: colors.light.muted,
      animation      : 'admin-pulse 1.8s ease-in-out infinite',
    }} />
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const { user } = useAuthStore()

  const [profile,       setProfile]       = useState<AdminProfile | null>(null)
  const [stats,         setStats]         = useState<AdminActivityStats | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [loadingStats,  setLoadingStats]  = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await getAdminProfile(user.id)
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] load error:', error)
        }
        setProfile(data ?? null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    const loadStats = async () => {
      setLoadingStats(true)
      try {
        const { data, error } = await getAdminActivityStats(user.id)
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[admin-profile] loadStats error:', error)
        }
        setStats(data ?? null)
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [user?.id])

  const tier        = profile ? resolveLevel(profile.totalXp) : 'bronze'
  const tierInfo    = gamification.levels[tier]
  const xpTier      = profile ? resolveXpTier(profile.totalXp) : XP_TIER_THRESHOLDS[0]
  const xpPct       = xpTier
    ? Math.round(((profile?.totalXp ?? 0) - xpTier.min) / Math.max(1, xpTier.max - xpTier.min) * 100)
    : 0
  const isLegend    = tier === 'legend'
  const memberSince = profile
    ? new Date(profile.memberSince).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' })
    : '—'

  const adminBadges = stats ? computeAdminBadges(stats) : ADMIN_BADGES

  const initials = profile?.displayName
    ? profile.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <style>{`
        @keyframes admin-pulse {
          0%,100% { opacity:.12 }
          50%     { opacity:.25 }
        }
        @keyframes xp-fill-admin {
          from { width: 0% }
          to   { width: ${xpPct}% }
        }
        .xp-bar-admin {
          animation: xp-fill-admin ${gamification.animations.xpFill} forwards;
        }
      `}</style>

      {/* ── Header profil ── */}
      <div style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        border         : `1px solid ${colors.border.light}`,
        boxShadow      : shadows.sm,
        padding        : 28,
        marginBottom   : 20,
        display        : 'flex',
        alignItems     : 'center',
        gap            : 24,
      }}>
        {loading ? (
          <>
            <SkeletonBlock h={72} w="72px" />
            <div style={{ flex: 1 }}>
              <SkeletonBlock h={24} w="200px" />
              <div style={{ height: 8 }} />
              <SkeletonBlock h={16} w="140px" />
            </div>
          </>
        ) : (
          <>
            {/* Avatar */}
            <div style={{
              width          : 72,
              height         : 72,
              borderRadius   : '50%',
              backgroundColor: tierInfo.color,
              display        : 'flex',
              alignItems     : 'center',
              justifyContent : 'center',
              flexShrink     : 0,
              fontSize       : 28,
              fontWeight     : 900,
              fontFamily     : 'Montserrat, sans-serif',
              color          : colors.text.primary,
            }}>
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                : initials}
            </div>

            {/* Infos */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize  : typography.h1.size,
                  color     : colors.text.dark,
                }}>
                  {profile?.displayName ?? 'Administrateur'}
                </div>
                {/* Badge niveau */}
                <div style={{
                  backgroundColor: tierInfo.color,
                  borderRadius   : radius.badge,
                  padding        : '3px 12px',
                  fontSize       : 12,
                  fontWeight     : 700,
                  color          : colors.text.primary,
                  fontFamily     : 'Montserrat, sans-serif',
                }}>
                  {tierInfo.label}
                </div>
              </div>
              <div style={{ fontSize: 13, color: colors.text.muted, fontFamily: 'Montserrat, sans-serif', marginTop: 4 }}>
                Administrateur · Membre depuis {memberSince}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Barre XP ── */}
      <div style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        border         : `1px solid ${colors.border.light}`,
        boxShadow      : shadows.sm,
        padding        : 24,
        marginBottom   : 20,
      }}>
        <div style={{
          fontSize    : 12,
          fontWeight  : 700,
          color       : colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 12,
          fontFamily  : 'Montserrat, sans-serif',
        }}>
          Progression XP
        </div>

        {loading ? <SkeletonBlock h={20} /> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{
                fontFamily: 'Geist Mono, monospace',
                fontWeight: 700,
                fontSize  : typography.stat.size,
                color     : tierInfo.color,
              }}>
                {profile?.totalXp ?? 0} XP
              </div>
              {isLegend ? (
                <div style={{ fontSize: 13, color: colors.text.muted, fontFamily: 'Montserrat, sans-serif', alignSelf: 'center' }}>
                  Niveau maximum atteint 🏆
                </div>
              ) : (
                <div style={{ fontSize: 12, color: colors.text.subtle, fontFamily: 'Montserrat, sans-serif', alignSelf: 'center' }}>
                  {xpTier.max - (profile?.totalXp ?? 0)} XP pour {gamification.levels[XP_TIER_THRESHOLDS[XP_TIER_THRESHOLDS.findIndex(t => t.tier === tier) + 1]?.tier as keyof typeof gamification.levels]?.label ?? '?'}
                </div>
              )}
            </div>
            <div style={{
              height         : gamification.xp.barHeight,
              backgroundColor: gamification.xp.trackColor,
              borderRadius   : gamification.xp.barRadius,
              overflow       : 'hidden',
            }}>
              <div
                className="xp-bar-admin"
                style={{
                  height         : '100%',
                  backgroundColor: gamification.xp.fillColor,
                  borderRadius   : gamification.xp.barRadius,
                  width          : `${xpPct}%`,
                  boxShadow      : `0 0 8px ${gamification.xp.glowColor}`,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Stats d'activité ── */}
      <div style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        border         : `1px solid ${colors.border.light}`,
        boxShadow      : shadows.sm,
        padding        : 24,
        marginBottom   : 20,
      }}>
        <div style={{
          fontSize    : 12,
          fontWeight  : 700,
          color       : colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 16,
          fontFamily  : 'Montserrat, sans-serif',
        }}>
          Activité
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {loadingStats ? (
            [0,1,2,3].map(i => <SkeletonBlock key={i} h={80} />)
          ) : (
            [
              { label: 'Séances créées',       value: stats?.sessionsCreated      ?? 0, icon: '📅' },
              { label: 'Joueurs gérés',         value: stats?.playersManaged       ?? 0, icon: '👥' },
              { label: 'Badges accordés',        value: stats?.badgesAwarded        ?? 0, icon: '🏅' },
              { label: 'Évaluations validées',   value: stats?.evaluationsValidated ?? 0, icon: '✅' },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  backgroundColor: colors.light.surface,
                  border         : `1px solid ${colors.border.light}`,
                  borderRadius   : radius.xs,
                  padding        : '16px 20px',
                  boxShadow      : shadows.sm,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{
                  fontFamily: 'Geist Mono, monospace',
                  fontWeight: typography.stat.weight,
                  fontSize  : typography.stat.size,
                  color     : colors.text.dark,
                }}>
                  {value}
                </div>
                <div style={{
                  fontSize  : typography.caption.size,
                  color     : colors.text.muted,
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight : `${typography.caption.lineHeight}px`,
                  marginTop  : 2,
                }}>
                  {label}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Badges admin ── */}
      <div style={{
        backgroundColor: colors.light.surface,
        borderRadius   : radius.card,
        border         : `1px solid ${colors.border.light}`,
        boxShadow      : shadows.sm,
        padding        : 24,
      }}>
        <div style={{
          fontSize    : 12,
          fontWeight  : 700,
          color       : colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 16,
          fontFamily  : 'Montserrat, sans-serif',
        }}>
          Mes badges
        </div>
        <BadgeGrid badges={adminBadges} size="md" />
      </div>
    </div>
  )
}
