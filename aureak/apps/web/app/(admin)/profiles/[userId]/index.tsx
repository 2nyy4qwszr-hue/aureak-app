'use client'
// Story 87.1 — Stub fiche profil universelle
// Sera remplacé entièrement par Story 87.2 (fiche personne universelle).

import { View, StyleSheet, type TextStyle } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export default function ProfileStubPage() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  return (
    <View style={s.container}>
      <AureakText variant="h2" style={s.title as TextStyle}>Fiche profil</AureakText>
      <AureakText variant="body" style={s.mono  as TextStyle}>userId : {userId ?? '—'}</AureakText>
      <AureakText variant="body" style={s.sub   as TextStyle}>
        Fiche universelle en cours de conception (story 87.2).
      </AureakText>
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
    gap            : space.sm,
  },
  title: { color: colors.text.dark },
  mono : { color: colors.text.muted, fontSize: 13 },
  sub  : { color: colors.text.muted, textAlign: 'center' },
})
