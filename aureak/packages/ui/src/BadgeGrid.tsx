// BadgeGrid.tsx — Grille de badges gamifiés (Story 52-9)
// Affiche 10 badges : débloqués en couleur, verrouillés en gris transparent.
// Props : badges (BadgeItem[]), size ('sm'|'md' optionnel)
// RÈGLE : aucune valeur hardcodée — via @aureak/theme

import React from 'react'
import { View, Platform, StyleSheet } from 'react-native'
import type { BadgeItem } from '@aureak/types'
import { gamification, colors, space, fonts } from '@aureak/theme'
import { Text as AureakText } from './components/Text'

// ── Types ──────────────────────────────────────────────────────────────────────

export type { BadgeItem }

export type BadgeGridProps = {
  badges: BadgeItem[]
  size? : 'sm' | 'md'
}

// ── BadgeCell — cellule individuelle ──────────────────────────────────────────

function BadgeCell({ badge, cellWidth }: { badge: BadgeItem; cellWidth: number }) {
  const iconSize = badge.unlocked
    ? gamification.badge.size.md   // 48px débloqué
    : gamification.badge.size.md   // 48px verrouillé

  // Sur web : title attribute pour tooltip natif HTML
  const webProps = Platform.OS === 'web'
    ? ({ title: `${badge.label} — ${badge.description}` } as Record<string, unknown>)
    : {}

  return (
    <View
      style={[bc.cell, { width: cellWidth }]}
      {...webProps}
      accessibilityLabel={`${badge.label}${badge.unlocked ? '' : ' (verrouillé)'}`}
      accessibilityHint={badge.description}
    >
      {/* Icône emoji */}
      <View
        style={[
          bc.iconWrap,
          badge.unlocked
            ? (Platform.OS === 'web'
                ? { boxShadow: gamification.badge.unlockedShadow } as never
                : { shadowColor: 'rgba(193,172,92,0.5)', shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, elevation: 4 }
              )
            : { opacity: gamification.badge.lockedOpacity },
        ]}
      >
        {Platform.OS === 'web' && !badge.unlocked ? (
          <AureakText
            style={[
              bc.icon,
              { fontSize: iconSize },
              { filter: gamification.badge.lockedFilter } as never,
            ] as never}
          >
            {badge.icon}
          </AureakText>
        ) : (
          <AureakText style={[bc.icon, { fontSize: iconSize }] as never}>
            {badge.icon}
          </AureakText>
        )}
      </View>

      {/* Label */}
      <AureakText
        style={[
          bc.label,
          !badge.unlocked && bc.labelLocked,
        ] as never}
        numberOfLines={2}
      >
        {badge.label}
      </AureakText>
    </View>
  )
}

const bc = StyleSheet.create({
  cell: {
    alignItems    : 'center',
    paddingVertical: space.xs,
    paddingHorizontal: 2,
    gap           : 4,
  },
  iconWrap: {
    width         : gamification.badge.size.lg,  // 64px
    height        : gamification.badge.size.lg,
    alignItems    : 'center',
    justifyContent: 'center',
    borderRadius  : gamification.badge.size.lg / 2,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    fontSize   : 11,
    textAlign  : 'center',
    color      : colors.text.dark,
    fontFamily : fonts.body,
    lineHeight : 14,
  },
  labelLocked: {
    color     : colors.text.subtle,
    fontStyle : 'italic',
  },
})

// ── BadgeGrid — grille principale ─────────────────────────────────────────────

export function BadgeGrid({ badges, size = 'md' }: BadgeGridProps) {
  // Largeur cellule selon taille
  const cellWidth = size === 'sm'
    ? gamification.badge.size.md + 12   // ~60px
    : gamification.badge.size.lg + 16   // ~80px

  return (
    <View style={bg.grid}>
      {badges.map(badge => (
        <BadgeCell key={badge.id} badge={badge} cellWidth={cellWidth} />
      ))}
    </View>
  )
}

const bg = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
})
