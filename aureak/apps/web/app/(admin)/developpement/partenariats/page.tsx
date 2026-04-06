// Story 63.3 — Page Partenariats avec KPIs placeholder
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'

interface KpiItem {
  label: string
  value: string
}

const KPI_ITEMS: KpiItem[] = [
  { label: 'Partenariats actifs',        value: '—' },
  { label: 'Clubs partenaires',          value: '—' },
  { label: 'Valeur totale partenariats', value: '—' },
]

export default function PartenariatsPage() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AureakText variant="h1" style={styles.title}>Partenariats</AureakText>
        <AureakText variant="body" style={styles.sub}>Clubs partenaires, conventions et valeur des collaborations actives</AureakText>
      </View>

      <View style={styles.banner}>
        <AureakText variant="body" style={styles.bannerText}>
          🚀 Cette section est en cours de développement. Les fonctionnalités complètes arrivent prochainement.
        </AureakText>
      </View>

      <View style={styles.kpiRow}>
        {KPI_ITEMS.map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <AureakText variant="h1" style={styles.kpiValue}>{k.value}</AureakText>
            <AureakText variant="caption" style={styles.kpiLabel}>{k.label}</AureakText>
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
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
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
    color       : colors.text.subtle,
    marginBottom: space.xs,
  },
  kpiLabel: {
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
