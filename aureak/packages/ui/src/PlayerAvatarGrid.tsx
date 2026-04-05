// Story 56-3 — Grille compacte d'avatars initiaux colorés sur la card groupe
// RÈGLE : styles uniquement via @aureak/theme tokens
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { AureakText } from './components/Text'

// ── Types ──────────────────────────────────────────────────────────────────────

export type AvatarMember = {
  childId    : string
  displayName: string
  avgScore?  : number   // note moyenne (optionnel — pas de colonne DB supplémentaire)
}

export interface PlayerAvatarGridProps {
  members    : AvatarMember[]
  maxVisible?: number   // défaut 8
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

type AvatarTier = 'gold' | 'silver' | 'normal'

function getAvatarTier(avgScore?: number): AvatarTier {
  if (avgScore === undefined || avgScore === null) return 'normal'
  if (avgScore >= 8)   return 'gold'
  if (avgScore >= 6)   return 'silver'
  return 'normal'
}

function getAvatarBg(tier: AvatarTier): string {
  switch (tier) {
    case 'gold'  : return colors.accent.gold
    case 'silver': return '#C0C0C0'
    default      : return colors.light.elevated
  }
}

function getAvatarTextColor(tier: AvatarTier): string {
  switch (tier) {
    case 'gold'  : return colors.text.dark
    case 'silver': return colors.text.dark
    default      : return colors.text.dark
  }
}

// ── PlayerAvatarGrid ───────────────────────────────────────────────────────────

export function PlayerAvatarGrid({
  members,
  maxVisible = 8,
}: PlayerAvatarGridProps) {
  if (!members || members.length === 0) return null

  const visible  = members.slice(0, maxVisible)
  const overflow = members.length - maxVisible

  return (
    <View style={s.row}>
      {visible.map(member => {
        const tier      = getAvatarTier(member.avgScore)
        const bg        = getAvatarBg(tier)
        const textColor = getAvatarTextColor(tier)
        const initials  = getInitials(member.displayName)

        return (
          <View
            key={member.childId}
            style={[s.avatar, { backgroundColor: bg }]}
            accessibilityLabel={member.displayName}
          >
            <AureakText
              variant="caption"
              style={{ color: textColor, fontWeight: '800', fontSize: 9, lineHeight: 11 }}
            >
              {initials}
            </AureakText>
          </View>
        )
      })}

      {overflow > 0 && (
        <View
          style={[s.avatar, s.avatarOverflow]}
          accessibilityLabel={`${overflow} joueurs supplémentaires`}
        >
          <AureakText
            variant="caption"
            style={{ color: colors.text.muted, fontWeight: '700', fontSize: 8, lineHeight: 10 }}
          >
            +{overflow}
          </AureakText>
        </View>
      )}
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 28

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : 4,
    alignItems   : 'center',
  },
  avatar: {
    width          : AVATAR_SIZE,
    height         : AVATAR_SIZE,
    borderRadius   : AVATAR_SIZE / 2,
    alignItems     : 'center',
    justifyContent : 'center',
    borderWidth    : 1,
    borderColor    : 'rgba(0,0,0,0.08)',
  },
  avatarOverflow: {
    backgroundColor: colors.light.muted,
    borderColor    : colors.border.light,
  },
})
