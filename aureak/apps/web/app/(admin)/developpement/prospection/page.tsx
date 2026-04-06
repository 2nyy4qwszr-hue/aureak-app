// Story 63.3 — Page Prospection avec KPIs placeholder
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
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
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.push('/(admin)/developpement' as never)}>
        <AureakText style={styles.backText}>← Développement</AureakText>
      </Pressable>

      <View style={styles.header}>
        <AureakText variant="h1" style={styles.title}>Prospection</AureakText>
        <AureakText variant="body" style={styles.sub}>Suivi des contacts et opportunités de développement</AureakText>
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
  backBtn: {
    flexDirection: 'row',
    alignItems   : 'center',
    marginBottom : space.md,
    alignSelf    : 'flex-start',
    padding      : 0,
  },
  backText: {
    color     : colors.text.muted,
    fontSize  : 13,
    fontWeight: '600',
    fontFamily: 'Geist, sans-serif',
  } as never,
})
