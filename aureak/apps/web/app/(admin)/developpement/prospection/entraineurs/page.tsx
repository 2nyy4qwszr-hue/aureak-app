// Story 88.1 — Page placeholder Entraîneurs
'use client'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export default function ProspectionEntraineursPage() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <AureakText variant="h2" style={styles.icon}>🏋️</AureakText>
        <AureakText variant="h2" style={styles.title}>Pipeline Entraîneurs</AureakText>
        <AureakText variant="body" style={styles.sub}>
          Bientôt disponible — prospection et recrutement d'entraîneurs spécialisés.
        </AureakText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
    justifyContent : 'center',
    alignItems     : 'center',
  },
  emptyState: {
    alignItems    : 'center',
    maxWidth      : 400,
  },
  icon: {
    fontSize     : 48,
    marginBottom : space.md,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.sm,
    textAlign   : 'center',
  },
  sub: {
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
