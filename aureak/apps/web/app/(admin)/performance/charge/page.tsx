'use client'
// Story 60.3 — Heatmap jours/heures séances
// Story 98.2 — AdminPageHeader v2 ("Charge coaches")
import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { listImplantations, getSessionHeatmap } from '@aureak/api-client'
import type { HeatmapPeriod } from '@aureak/types'
import type { Implantation } from '@aureak/types'
import { HeatmapGrid } from '@aureak/ui'
import { colors, fonts, radius, space, shadows } from '@aureak/theme'
import type { HeatmapCell } from '@aureak/types'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'

const PERIOD_OPTIONS: { value: HeatmapPeriod; label: string }[] = [
  { value: 'month',   label: 'Ce mois' },
  { value: '3months', label: '3 derniers mois' },
  { value: '6months', label: '6 derniers mois' },
  { value: 'year',    label: 'Cette année' },
]

export default function ChargeAnalyticsPage() {
  const router = useRouter()

  const [implantations,  setImplantations]  = useState<Implantation[]>([])
  const [implantationId, setImplantationId] = useState<string | undefined>(undefined)
  const [period, setPeriod]                 = useState<HeatmapPeriod>('3months')
  const [heatmapData, setHeatmapData]       = useState<HeatmapCell[][] | null>(null)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    listImplantations()
      .then(({ data }) => {
        if (data) setImplantations(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ChargeAnalytics] listImplantations error:', err)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    getSessionHeatmap(period, implantationId)
      .then(({ data }) => {
        setHeatmapData(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ChargeAnalytics] getSessionHeatmap error:', err)
        setHeatmapData(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [period, implantationId])

  return (
    <View style={s.page}>
      {/* Story 98.2 — AdminPageHeader v2 */}
      <AdminPageHeader title="Charge coaches" />

      <ScrollView style={s.container}>
      <View style={s.content}>
        {/* Filtres */}
        <View style={s.filterRow}>
          {/* Période */}
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

          {/* Implantation */}
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Implantation :</Text>
            <View style={s.chipRow}>
              <Pressable
                onPress={() => setImplantationId(undefined)}
                style={[s.chip, implantationId === undefined && s.chipActive]}
              >
                <Text style={[s.chipText, implantationId === undefined && s.chipTextActive]}>Toutes</Text>
              </Pressable>
              {implantations.map(imp => (
                <Pressable
                  key={imp.id}
                  onPress={() => setImplantationId(imp.id)}
                  style={[s.chip, imp.id === implantationId && s.chipActive]}
                >
                  <Text style={[s.chipText, imp.id === implantationId && s.chipTextActive]}>{imp.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Heatmap */}
        <View style={s.card}>
          {loading ? (
            <View style={s.skeleton} />
          ) : heatmapData ? (
            <HeatmapGrid data={heatmapData} />
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>Aucune donnée disponible pour cette période</Text>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page     : { flex: 1, backgroundColor: colors.light.primary },
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
    fontFamily: fonts.display,
    fontSize  : 24,
    fontWeight: '800',
    color     : colors.text.primary,
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 4 },

  content: { padding: space.xl },

  filterRow : { gap: 12, marginBottom: space.lg },
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
    overflow       : 'auto' as never,
  } as never,

  skeleton: {
    height         : 400,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
  },

  emptyState: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText : { fontSize: 14, color: colors.text.muted },
})
