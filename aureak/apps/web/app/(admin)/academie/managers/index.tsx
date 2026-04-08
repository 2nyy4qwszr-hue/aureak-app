'use client'
// Story 75.2 — Stub Managers (nouveau profil — à implémenter dans une story dédiée)
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export default function AcademieManagersPage() {
  return (
    <View style={s.container}>
      <AureakText variant="h2" style={s.title}>Managers</AureakText>
      <AureakText variant="body" style={s.sub}>Bientôt disponible</AureakText>
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
  title: { color: colors.text.dark, marginBottom: space.sm },
  sub  : { color: colors.text.muted },
})
