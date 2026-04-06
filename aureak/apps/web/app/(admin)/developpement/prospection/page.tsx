// Story 63.3 — Page Prospection avec KPIs placeholder
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, space, radius, shadows } from '@aureak/theme'

interface KpiItem {
  label: string
  value: string
}

const KPI_ITEMS: KpiItem[] = [
  { label: 'Contacts prospectés',   value: '—' },
  { label: 'Rendez-vous planifiés', value: '—' },
  { label: 'Taux de conversion',    value: '—' },
]

export default function ProspectionPage() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prospection</Text>
        <Text style={styles.sub}>Suivi des contacts et opportunités de développement</Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          🚀 Cette section est en cours de développement. Les fonctionnalités complètes arrivent prochainement.
        </Text>
      </View>

      <View style={styles.kpiRow}>
        {KPI_ITEMS.map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  header: {
    marginBottom: space.xl,
  },
  title: {
    fontSize    : 24,
    fontWeight  : '900',
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    fontSize: 14,
    color   : colors.text.muted,
  },
  banner: {
    backgroundColor: colors.border.goldBg,
    borderWidth    : 1,
    borderColor    : colors.border.gold,
    borderRadius   : radius.card,
    padding        : space.md,
    marginBottom   : space.xl,
  },
  bannerText: {
    fontSize  : 13,
    color     : colors.accent.gold,
    lineHeight: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  kpiCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    minWidth       : 160,
    alignItems     : 'center',
    // @ts-ignore — web only boxShadow
    boxShadow      : shadows.sm,
  },
  kpiValue: {
    fontSize    : 32,
    fontWeight  : '900',
    color       : colors.text.subtle,
    marginBottom: space.xs,
  },
  kpiLabel: {
    fontSize : 12,
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
