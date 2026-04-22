'use client'
// Story 60.6 — Analytics Progression — Top 10 joueurs classements multiples
// Story 98.2 — AdminPageHeader v2 ("Progression")
import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { listImplantations, getPlayerRankings } from '@aureak/api-client'
import type { Implantation } from '@aureak/types'
import type { PlayerRankingItem, RankingMetric } from '@aureak/types'
import { colors, fonts, radius, space, shadows, getStatColor, STAT_THRESHOLDS } from '@aureak/theme'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'

// ── Constantes ────────────────────────────────────────────────────────────────

const PODIUM_COLORS: Record<number, string> = {
  1: colors.accent.gold,
  2: colors.accent.silverPodium,
  3: colors.accent.bronze,
}

const PODIUM_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

const METRIC_OPTIONS: { value: RankingMetric; label: string; unit: string }[] = [
  { value: 'attendance',  label: 'Présence',    unit: '%' },
  { value: 'progression', label: 'Progression', unit: '%' },
  { value: 'xp',          label: 'XP',          unit: 'pts' },
]

// ── Composant RankingTable ────────────────────────────────────────────────────

function RankingTable({
  items,
  metric,
  onPress,
}: {
  items  : PlayerRankingItem[]
  metric : RankingMetric
  onPress: (childId: string) => void
}) {
  if (items.length === 0) {
    const opt = METRIC_OPTIONS.find(o => o.value === metric)
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyText}>Aucune donnée de {opt?.label ?? metric} disponible</Text>
      </View>
    )
  }

  return (
    <View style={s.table}>
      {items.map((item) => {
        const isPodium  = item.rank <= 3
        const podiumBg  = PODIUM_COLORS[item.rank]
        const medal     = PODIUM_MEDALS[item.rank]
        const opt       = METRIC_OPTIONS.find(o => o.value === metric)

        const deltaIcon  = item.weeklyDelta > 0 ? '▲' : item.weeklyDelta < 0 ? '▼' : '='
        const deltaColor = item.weeklyDelta > 0 ? colors.status.success : item.weeklyDelta < 0 ? colors.accent.red : colors.text.muted
        const deltaText  = item.weeklyDelta !== 0 ? `${deltaIcon}${Math.abs(item.weeklyDelta)}` : deltaIcon

        // Couleur valeur selon métrique
        const valueColor = metric === 'attendance'
          ? getStatColor(item.value, STAT_THRESHOLDS.attendance.high, STAT_THRESHOLDS.attendance.low)
          : metric === 'progression'
            ? getStatColor(item.value, STAT_THRESHOLDS.progression.high, STAT_THRESHOLDS.progression.low)
            : getStatColor(item.value, STAT_THRESHOLDS.xp.high, STAT_THRESHOLDS.xp.low)

        return (
          <Pressable
            key={item.childId}
            onPress={() => onPress(item.childId)}
            style={[
              s.row,
              isPodium && { backgroundColor: `${podiumBg}18` },
            ]}
          >
            {/* Rang + médaille */}
            <View style={s.rankCell}>
              {medal ? (
                <Text style={s.medal}>{medal}</Text>
              ) : (
                <Text style={s.rankText}>{item.rank}</Text>
              )}
              <Text style={[s.deltaText, { color: deltaColor }]}>{deltaText}</Text>
            </View>

            {/* Nom + groupe */}
            <View style={s.nameCell}>
              <Text style={s.playerName} numberOfLines={1}>{item.displayName}</Text>
              <Text style={s.groupName}  numberOfLines={1}>{item.groupName}</Text>
            </View>

            {/* Valeur colorée */}
            <Text style={[s.valueText, { color: valueColor }]}>
              {item.value}{opt?.unit ?? ''}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── SkeletonRows ──────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <View style={s.table}>
      {Array.from({ length: 10 }).map((_, i) => (
        <View key={i} style={[s.row, s.skeletonRow]}>
          <View style={[s.skeletonBlock, { width: 32 }]} />
          <View style={s.nameCell}>
            <View style={[s.skeletonBlock, { width: 80 + (i * 11) % 80 }]} />
            <View style={[s.skeletonBlock, { width: 50, height: 10, marginTop: 4 }]} />
          </View>
          <View style={[s.skeletonBlock, { width: 40 }]} />
        </View>
      ))}
    </View>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ProgressionPage() {
  const router = useRouter()

  const [implantations,    setImplantations]    = useState<Implantation[]>([])
  const [implantationId,   setImplantationId]   = useState<string>('')
  const [activeMetric,     setActiveMetric]     = useState<RankingMetric>('attendance')
  const [rankings,         setRankings]         = useState<PlayerRankingItem[]>([])
  const [loading,          setLoading]          = useState(true)

  // Charger implantations au mount
  useEffect(() => {
    listImplantations()
      .then(({ data }) => {
        if (data && data.length > 0) setImplantations(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ProgressionPage] listImplantations error:', err)
      })
  }, [])

  // Charger classements quand métrique ou implantation change
  useEffect(() => {
    setLoading(true)
    getPlayerRankings(activeMetric, 10, implantationId || undefined)
      .then(({ data }) => {
        setRankings(data ?? [])
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ProgressionPage] getPlayerRankings error:', err)
        setRankings([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [activeMetric, implantationId])

  return (
    <View style={s.page}>
      {/* Story 98.2 — AdminPageHeader v2 */}
      <AdminPageHeader title="Progression" />

      <ScrollView style={s.container}>
      <View style={s.content}>
        {/* Sélecteur implantation */}
        <View style={s.filterRow}>
          <Text style={s.filterLabel}>Implantation :</Text>
          <View style={s.chipRow}>
            <Pressable
              onPress={() => setImplantationId('')}
              style={[s.chip, implantationId === '' && s.chipActive]}
            >
              <Text style={[s.chipText, implantationId === '' && s.chipTextActive]}>Toutes</Text>
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

        {/* Onglets métriques */}
        <View style={s.tabRow}>
          {METRIC_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => setActiveMetric(opt.value)}
              style={[s.tab, opt.value === activeMetric && s.tabActive]}
            >
              <Text style={[s.tabText, opt.value === activeMetric && s.tabTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Card classement */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            Top 10 — {METRIC_OPTIONS.find(o => o.value === activeMetric)?.label}
          </Text>
          {loading ? <SkeletonRows /> : (
            <RankingTable
              items={rankings}
              metric={activeMetric}
              onPress={(childId) => router.push(`/children/${childId}` as never)}
            />
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page     : { flex: 1, backgroundColor: colors.light.primary },
  container: { flex: 1, backgroundColor: colors.light.primary },

  header: {
    backgroundColor  : colors.background.primary,
    paddingHorizontal: space.xl,
    paddingTop       : space.xl,
    paddingBottom    : space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  backLink: { marginBottom: space.md, alignSelf: 'flex-start' },
  backText: { color: colors.text.secondary, fontSize: 13 },
  title   : {
    fontFamily   : fonts.display,
    fontSize     : 24,
    fontWeight   : '800',
    color        : colors.text.primary,
    letterSpacing: 0.5,
  },

  content: { padding: space.xl },

  filterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' as never, gap: 8, marginBottom: space.lg },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipRow  : { flexDirection: 'row', flexWrap: 'wrap' as never, gap: 6 },

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

  // Onglets métriques
  tabRow: {
    flexDirection: 'row',
    borderRadius : radius.card,
    backgroundColor: colors.light.muted,
    padding      : 3,
    marginBottom : space.lg,
    alignSelf    : 'flex-start' as never,
  },
  tab: {
    paddingVertical  : 8,
    paddingHorizontal: 20,
    borderRadius     : radius.xs,
  },
  tabActive: {
    backgroundColor: colors.light.surface,
    boxShadow      : '0 1px 4px rgba(0,0,0,0.08)',
  } as never,
  tabText      : { fontSize: 13, color: colors.text.muted, fontWeight: '600' },
  tabTextActive: { color: colors.text.dark },

  // Card
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    boxShadow      : shadows.sm,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  } as never,
  cardTitle: {
    fontSize      : 13,
    fontWeight    : '700',
    color         : colors.text.muted,
    textTransform : 'uppercase' as never,
    letterSpacing : 0.8,
    marginBottom  : space.md,
    fontFamily    : fonts.display,
  },

  // Tableau
  table: { gap: 2 } as never,
  row: {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius   : radius.xs,
    gap            : 12,
  },

  // Rang
  rankCell: { width: 52, alignItems: 'center' },
  medal   : { fontSize: 20, lineHeight: 24 },
  rankText: { fontSize: 16, fontWeight: '700', color: colors.text.muted },
  deltaText: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  // Nom + groupe
  nameCell  : { flex: 1 },
  playerName: { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  groupName : { fontSize: 11, color: colors.text.muted, marginTop: 2 },

  // Valeur
  valueText: { fontSize: 16, fontWeight: '800', fontFamily: fonts.display, minWidth: 56, textAlign: 'right' as never },

  // Empty state
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText : { fontSize: 14, color: colors.text.muted, textAlign: 'center' as never },

  // Skeleton
  skeletonRow  : { backgroundColor: 'transparent' },
  skeletonBlock: {
    height         : 14,
    backgroundColor: colors.light.muted,
    borderRadius   : 4,
  },
})
