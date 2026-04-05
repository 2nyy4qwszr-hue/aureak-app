'use client'
// Story 60.4 — Classement implantations bar chart
import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { getImplantationRankings } from '@aureak/api-client'
import type { ImplantationRankingItem, BarChartPeriod } from '@aureak/types'
import { BarChart } from '@aureak/ui'
import type { BarChartItem } from '@aureak/types'
import { colors, radius, space, shadows } from '@aureak/theme'

// ── Couleur selon performance ─────────────────────────────────────────────────
function getStatColor(value: number, metric: 'attendance' | 'mastery'): string {
  if (metric === 'attendance') {
    if (value >= 80) return colors.status.success
    if (value >= 60) return colors.accent.gold
    return colors.accent.red
  }
  // mastery sur 5
  if (value >= 4)   return colors.status.success
  if (value >= 3)   return colors.accent.gold
  return colors.accent.red
}

const PERIOD_OPTIONS: { value: BarChartPeriod; label: string }[] = [
  { value: 'month',   label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year',    label: 'Cette année' },
]

const METRIC_OPTIONS: { value: 'attendance' | 'mastery'; label: string; unit: string }[] = [
  { value: 'attendance', label: 'Taux de présence',  unit: '%' },
  { value: 'mastery',    label: 'Maîtrise moyenne',  unit: '/5' },
]

export default function ClubsAnalyticsPage() {
  const router = useRouter()

  const [metric, setMetric]   = useState<'attendance' | 'mastery'>('attendance')
  const [period, setPeriod]   = useState<BarChartPeriod>('quarter')
  const [rankings, setRankings] = useState<ImplantationRankingItem[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    getImplantationRankings(metric, period)
      .then(({ data }) => {
        setRankings(data ?? [])
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ClubsAnalytics] getImplantationRankings error:', err)
        setRankings([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [metric, period])

  const currentMetricOpt = METRIC_OPTIONS.find(m => m.value === metric)!

  // Convertir en BarChartItem
  const barItems: BarChartItem[] = rankings.map(r => ({
    id   : r.id,
    label: r.name,
    value: r.value,
    rank : r.rank,
    meta : { sessionCount: r.sessionCount },
  }))

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label ?? ''

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.push('/analytics' as never)} style={s.backLink}>
          <Text style={s.backText}>← Stats Room</Text>
        </Pressable>
        <Text style={s.title}>Clubs — Classement implantations</Text>
        <Text style={s.subtitle}>{currentMetricOpt.label} · {periodLabel}</Text>
      </View>

      <View style={s.content}>
        {/* Filtres métriques */}
        <View style={s.filterRow}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Métrique :</Text>
            <View style={s.chipRow}>
              {METRIC_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => setMetric(opt.value)}
                  style={[s.chip, opt.value === metric && s.chipActive]}
                >
                  <Text style={[s.chipText, opt.value === metric && s.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Période :</Text>
            <View style={s.chipRow}>
              {PERIOD_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => setPeriod(opt.value)}
                  style={[s.chip, opt.value === period && s.chipActive]}
                >
                  <Text style={[s.chipText, opt.value === period && s.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{currentMetricOpt.label} · {periodLabel}</Text>
          {loading ? (
            <View style={s.skeleton} />
          ) : (
            <BarChart
              data={barItems}
              maxValue={metric === 'mastery' ? 5 : 100}
              unit={currentMetricOpt.unit}
              colorFn={(v) => getStatColor(v, metric)}
              onItemClick={(id) => router.push(`/analytics/clubs/${id}` as never)}
            />
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },

  header: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: space.xl,
    paddingTop     : space.xl,
    paddingBottom  : space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  backLink: { marginBottom: space.md, alignSelf: 'flex-start' },
  backText: { color: colors.text.secondary, fontSize: 13 },
  title   : {
    fontFamily: 'Montserrat',
    fontSize  : 24,
    fontWeight: '800',
    color     : colors.text.primary,
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 4 },

  content: { padding: space.xl },

  filterRow  : { gap: 12, marginBottom: space.lg },
  filterGroup: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' as never, gap: 8 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipRow    : { flexDirection: 'row', flexWrap: 'wrap' as never, gap: 6 },

  chip: {
    paddingVertical  : 5,
    paddingHorizontal: 12,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  chipActive    : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  chipText      : { fontSize: 12, color: colors.text.muted },
  chipTextActive: { color: colors.text.dark, fontWeight: '700' },

  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    boxShadow      : shadows.sm,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  } as never,
  cardTitle: {
    fontSize    : 14,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: space.md,
    textTransform: 'uppercase' as never,
    letterSpacing: 0.8,
  },

  skeleton: {
    height         : 300,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
  },
})
