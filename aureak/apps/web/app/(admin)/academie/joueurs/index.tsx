'use client'
// Story 75.2 — Placeholder joueurs dans le hub Académie
// Ce fichier sera remplacé par le contenu complet de story 75-1
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export default function AcademieJoueursPage() {
  return (
    <View style={s.container}>
      <AureakText variant="h2" style={s.title}>Joueurs</AureakText>
      <AureakText variant="body" style={s.sub}>
        Refonte en cours — story 75-1
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.sm,
  },
  sub: {
    color: colors.text.muted,
  },
})
