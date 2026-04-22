'use client'
// Story 92.1 — Placeholder Sponsors (contenu réel livré par Story 92.2)
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export default function PartenariatSponsorsPage() {
  return (
    <View style={s.container}>
      <AureakText variant="h1" style={s.title}>Sponsors</AureakText>
      <AureakText variant="body" style={s.subtitle}>Bientôt disponible</AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex            : 1,
    alignItems      : 'center',
    justifyContent  : 'center',
    padding         : space.xl,
    backgroundColor : colors.light.primary,
  },
  title: {
    marginBottom: space.sm,
    color       : colors.text.dark,
  },
  subtitle: {
    color: colors.text.muted,
  },
})
