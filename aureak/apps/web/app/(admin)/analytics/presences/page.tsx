'use client'
// Story 60.2 — Présences 12 mois — Line chart multi-groupes
import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { listImplantations, getAttendanceByGroupMonth } from '@aureak/api-client'
import type { AttendanceMonthlyData } from '@aureak/types'
import { LineChart, SERIES_COLORS } from '@aureak/ui'
import type { Implantation } from '@aureak/types'
import { colors, radius, space, shadows } from '@aureak/theme'

export default function PresencesAnalyticsPage() {
  const router = useRouter()

  const [implantations, setImplantations]   = useState<Implantation[]>([])
  const [implantationId, setImplantationId] = useState<string>('')
  const [rawData, setRawData]               = useState<AttendanceMonthlyData[]>([])
  const [loading, setLoading]               = useState(true)

  // Charger les implantations au mount
  useEffect(() => {
    listImplantations()
      .then(({ data }) => {
        if (data && data.length > 0) {
          setImplantations(data)
          setImplantationId(data[0].id)
        }
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesAnalytics] listImplantations error:', err)
      })
  }, [])

  // Charger les données de présence quand implantation change
  useEffect(() => {
    if (!implantationId) return
    setLoading(true)
    getAttendanceByGroupMonth(implantationId, 12)
      .then(({ data }) => {
        setRawData(data ?? [])
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesAnalytics] getAttendanceByGroupMonth error:', err)
        setRawData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [implantationId])

  // Transformer rawData en LineChartSeries
  const series = useMemo(() => {
    const groupMap = new Map<string, { id: string; label: string; points: { month: string; value: number; meta: Record<string, unknown> }[] }>()
    for (const d of rawData) {
      if (!groupMap.has(d.groupId)) {
        groupMap.set(d.groupId, { id: d.groupId, label: d.groupName, points: [] })
      }
      groupMap.get(d.groupId)!.points.push({ month: d.month, value: d.rate, meta: { sessionCount: d.sessionCount } })
    }
    return Array.from(groupMap.values()).map((g, idx) => ({
      ...g,
      color: SERIES_COLORS[idx % SERIES_COLORS.length],
    }))
  }, [rawData])

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.push('/analytics' as never)} style={s.backLink}>
          <Text style={s.backText}>← Stats Room</Text>
        </Pressable>
        <Text style={s.title}>Présences — 12 derniers mois</Text>
      </View>

      <View style={s.content}>
        {/* Sélecteur implantation */}
        <View style={s.filterRow}>
          <Text style={s.filterLabel}>Implantation :</Text>
          <View style={s.implantationPicker}>
            {implantations.map(imp => (
              <Pressable
                key={imp.id}
                onPress={() => setImplantationId(imp.id)}
                style={[
                  s.implantationChip,
                  imp.id === implantationId && s.implantationChipActive,
                ]}
              >
                <Text style={[
                  s.implantationChipText,
                  imp.id === implantationId && s.implantationChipTextActive,
                ]}>
                  {imp.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Chart */}
        <View style={s.chartCard}>
          {loading ? (
            <View style={s.skeleton} />
          ) : series.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>Aucune donnée de présence sur cette période</Text>
            </View>
          ) : (
            <LineChart
              data={series}
              width={860}
              height={300}
              showLegend
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
  backLink : { marginBottom: space.md, alignSelf: 'flex-start' },
  backText : { color: colors.text.secondary, fontSize: 13 },
  title    : {
    fontFamily: 'Montserrat',
    fontSize  : 24,
    fontWeight: '800',
    color     : colors.text.primary,
    letterSpacing: 0.5,
  },

  content: { padding: space.xl },

  filterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' as never, gap: 8, marginBottom: space.lg },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.text.muted },

  implantationPicker: { flexDirection: 'row', flexWrap: 'wrap' as never, gap: 6 },
  implantationChip  : {
    paddingVertical  : 5,
    paddingHorizontal: 12,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  implantationChipActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  implantationChipText      : { fontSize: 12, color: colors.text.muted },
  implantationChipTextActive: { color: colors.text.dark, fontWeight: '700' },

  chartCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    boxShadow      : shadows.sm,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'auto' as never,
  } as never,

  skeleton: {
    height         : 300,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
  },

  emptyState: { height: 200, alignItems: 'center', justifyContent: 'center' },
  emptyText : { fontSize: 14, color: colors.text.muted },
})
