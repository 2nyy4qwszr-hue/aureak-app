// Story 63.1 — Page Évènements (stub — sera complété en story 63.2)
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'

export default function EvenementsPage() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.title}>Évènements</Text>
        <Text style={styles.subtitle}>En cours de développement</Text>
        <Text style={styles.description}>
          Retrouvez ici tous les évènements de l&apos;académie : stages, matchs, portes ouvertes et autres rassemblements.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    justifyContent : 'center',
    alignItems     : 'center',
    backgroundColor: colors.light.primary,
    padding        : space[8],
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : space[8],
    alignItems     : 'center',
    maxWidth       : 420,
    shadowColor    : '#000',
    shadowOffset   : { width: 0, height: 1 },
    shadowOpacity  : 0.06,
    shadowRadius   : 4,
  },
  icon: {
    fontSize     : 48,
    marginBottom : space[4],
  },
  title: {
    fontSize     : 22,
    fontWeight   : '700',
    color        : colors.text.primary,
    marginBottom : space[2],
  },
  subtitle: {
    fontSize     : 13,
    fontWeight   : '600',
    color        : colors.accent.gold,
    marginBottom : space[4],
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  description: {
    fontSize  : 14,
    color     : colors.text.muted,
    textAlign : 'center',
    lineHeight: 22,
  },
})
