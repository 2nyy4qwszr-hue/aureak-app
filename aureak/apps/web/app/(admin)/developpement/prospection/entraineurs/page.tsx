// Story 88.1 — Page placeholder Entraîneurs (pipeline prospection entraîneurs)
// Contenu implémenté dans Epic 90 (prospection entraîneurs)
'use client'
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

export default function ProspectionEntraineursPage() {
  return (
    <View style={s.container}>
      <View style={s.emptyState}>
        <AureakText style={s.emoji as never}>🎯</AureakText>
        <AureakText style={s.title as never}>Pipeline Entraîneurs</AureakText>
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
