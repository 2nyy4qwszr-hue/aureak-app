'use client'
// Liste des stages — vue admin globale
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { listStages } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { StageWithMeta, StageStatus, StageType } from '@aureak/types'

const STATUS_COLORS: Record<StageStatus, string> = {
  planifié : colors.accent.gold,
  en_cours : '#4ade80',
  terminé  : colors.text.secondary,
  annulé   : '#f87171',
}

const TYPE_LABELS: Record<StageType, string> = {
  été       : 'Été',
  toussaint : 'Toussaint',
  hiver     : 'Hiver',
  pâques    : 'Pâques',
  custom    : 'Personnalisé',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: StageStatus }) {
  const color = STATUS_COLORS[status]
  return (
    <View style={{ backgroundColor: color + '20', borderColor: color, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 }}>
      <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 10 }}>
        {status.toUpperCase()}
      </AureakText>
    </View>
  )
}

type FilterStatus = StageStatus | 'all'

export default function StagesPage() {
  const router = useRouter()
  const [stages,  setStages]  = useState<StageWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<FilterStatus>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listStages()
    setStages(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = stages.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter !== 'all' && s.status !== filter) return false
    return true
  })

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2">Stages</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
              {filtered.length} stage{filtered.length !== 1 ? 's' : ''}
            </AureakText>
          )}
        </View>
        <Pressable
          style={s.newBtn}
          onPress={() => router.push('/stages/new' as never)}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Nouveau stage
          </AureakText>
        </Pressable>
      </View>

      {/* Search */}
      <TextInput
        style={s.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par nom…"
        placeholderTextColor={colors.text.secondary}
      />

      {/* Status filter tabs */}
      <View style={s.filterRow}>
        {(['all', 'planifié', 'en_cours', 'terminé', 'annulé'] as FilterStatus[]).map(st => (
          <Pressable
            key={st}
            style={[s.tab, filter === st && s.tabActive]}
            onPress={() => setFilter(st)}
          >
            <AureakText
              variant="caption"
              style={{
                color     : filter === st
                  ? (st === 'all' ? colors.accent.gold : STATUS_COLORS[st as StageStatus])
                  : colors.text.secondary,
                fontWeight: filter === st ? '700' : '400',
              }}
            >
              {st === 'all' ? 'Tous' : st.charAt(0).toUpperCase() + st.slice(1)}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={s.skeletonGrid}>
          {[0,1,2].map(i => <View key={i} style={s.skeletonCard} />)}
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.secondary }}>Aucun stage</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 4 }}>
            {search ? 'Aucun résultat.' : 'Créez votre premier stage.'}
          </AureakText>
        </View>
      ) : (
        <View style={s.grid}>
          {filtered.map(stage => (
            <Pressable
              key={stage.id}
              style={s.card}
              onPress={() => router.push(`/stages/${stage.id}` as never)}
            >
              {/* Top accent by status */}
              <View style={[s.cardAccent, { backgroundColor: STATUS_COLORS[stage.status] }]} />

              <View style={{ padding: space.md, gap: space.xs }}>
                {/* Name + status */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.xs }}>
                  <AureakText variant="body" style={{ fontWeight: '700', flex: 1, fontSize: 14 }}>
                    {stage.name}
                  </AureakText>
                  <StatusBadge status={stage.status} />
                </View>

                {/* Type + season */}
                {(stage.type || stage.seasonLabel) && (
                  <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                    {[stage.type ? TYPE_LABELS[stage.type] : null, stage.seasonLabel].filter(Boolean).join(' · ')}
                  </AureakText>
                )}

                {/* Implantation */}
                {stage.implantationName && (
                  <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                    📍 {stage.implantationName}
                  </AureakText>
                )}

                {/* Dates */}
                <View style={s.chip}>
                  <AureakText variant="caption" style={{ fontSize: 11 }}>
                    {formatDate(stage.startDate)} → {formatDate(stage.endDate)}
                  </AureakText>
                </View>

                {/* Footer stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xs }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11 }}>
                      {stage.dayCount} jour{stage.dayCount !== 1 ? 's' : ''}
                    </AureakText>
                    <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11 }}>
                      · {stage.participantCount} joueur{stage.participantCount !== 1 ? 's' : ''}
                    </AureakText>
                  </View>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
                    Planifier →
                  </AureakText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.background.primary },
  content    : { padding: space.xl, gap: space.md },
  header     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  newBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },

  searchInput: {
    backgroundColor  : colors.background.surface,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.primary,
    fontSize         : 13,
  },

  filterRow : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' as never },
  tab       : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  tabActive : { backgroundColor: colors.background.elevated },

  grid        : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card        : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    overflow       : 'hidden',
    width          : '100%' as never,
    maxWidth       : 360,
    minWidth       : 280,
  },
  cardAccent  : { height: 3 },
  chip        : {
    backgroundColor  : colors.background.elevated,
    borderRadius     : 12,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    alignSelf        : 'flex-start',
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
  },

  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  skeletonCard: { width: 300, height: 150, backgroundColor: colors.background.surface, borderRadius: 10, opacity: 0.5 },
  emptyState  : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
})
