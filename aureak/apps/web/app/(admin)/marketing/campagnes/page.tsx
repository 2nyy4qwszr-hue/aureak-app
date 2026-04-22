// Story 91.1 — Page placeholder Campagnes (hub Marketing)
'use client'
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

export default function MarketingCampagnesPage() {
  return (
    <View style={s.container}>
      <View style={s.emptyState}>
        <AureakText style={s.emoji as never}>🚀</AureakText>
        <AureakText style={s.title as never}>Campagnes</AureakText>
        <AureakText style={s.sub as never}>Bientôt disponible</AureakText>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  emptyState: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xxl,
    alignItems     : 'center',
    gap            : space.sm,
    maxWidth       : 420,
  },
  emoji: {
    fontSize    : 48,
    marginBottom: space.xs,
  },
  title: {
    fontSize  : 20,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  sub: {
    fontSize : 13,
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
