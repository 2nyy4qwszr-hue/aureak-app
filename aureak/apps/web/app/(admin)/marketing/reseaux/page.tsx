// Story 91.1 — Page placeholder Réseaux sociaux (hub Marketing)
// Story 97.12 — AdminPageHeader v2 ("Réseaux sociaux") + MarketingNavBar
'use client'
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { MarketingNavBar } from '../../../../components/admin/marketing/MarketingNavBar'

export default function MarketingReseauxPage() {
  return (
    <View style={s.page}>
      <MarketingNavBar />

      <View style={s.stateWrapper}>
        <View style={s.emptyState}>
          <AureakText style={s.emoji as never}>📱</AureakText>
          <AureakText style={s.sub as never}>Bientôt disponible</AureakText>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  page: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  stateWrapper: {
    flex           : 1,
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
  sub: {
    fontSize : 13,
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
