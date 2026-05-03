'use client'
// Liste des stages — vue admin globale
// Story 97.10 — AdminPageHeader v2 "Stages" + EvenementsHeader tabs
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { listStages } from '@aureak/api-client'
import { AureakText, EmptyStateIllustrated } from '@aureak/ui'
import { colors, fonts, radius, space } from '@aureak/theme'
import type { StageWithMeta, StageStatus, StageType } from '@aureak/types'
import { SkeletonCard } from '../../../../components/SkeletonCard'
import { EvenementsHeader } from '../../../../components/admin/evenements/EvenementsHeader'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'

const STATUS_LABELS: Record<StageStatus, string> = {
  planifié : 'Planifié',
  en_cours : 'En cours',
  terminé  : 'Terminé',
  annulé   : 'Annulé',
}

const STATUS_COLORS: Record<StageStatus, string> = {
  planifié : colors.accent.gold,
  en_cours : colors.entity.stage,
  terminé  : colors.text.muted,
  annulé   : colors.accent.red,
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
        {STATUS_LABELS[status].toUpperCase()}
      </AureakText>
    </View>
  )
}

type FilterStatus = StageStatus | 'all'

export default function StagesPage() {
  const router = useRouter()
  const [stages,  setStages]  = useState<StageWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<FilterStatus>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listStages()
      setStages(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/index] load error:', err)
      setError('Impossible de charger les stages.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = stages.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter !== 'all' && s.status !== filter) return false
    return true
  })

  return (
    <View style={s.container}>
      <EvenementsHeader />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
      {/* Story 110.x — Search inline + bouton Filtres aligné droite (pattern uniforme) */}
      <View style={s.controls}>
        <View style={s.searchWrap}>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par nom…"
            placeholderTextColor={colors.text.muted}
          />
        </View>
        <FilterSheet
          activeCount={filter !== 'all' ? 1 : 0}
          onReset={() => setFilter('all')}
          triggerLabel="Filtrer les stages"
        >
          <View style={s.selectField}>
            <AureakText style={s.selectLabel}>Statut</AureakText>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as FilterStatus)}
              style={selectNativeStyle}
            >
              <option value="all">Tous</option>
              <option value="planifié">{STATUS_LABELS['planifié' as StageStatus]}</option>
              <option value="en_cours">{STATUS_LABELS['en_cours' as StageStatus]}</option>
              <option value="terminé">{STATUS_LABELS['terminé' as StageStatus]}</option>
              <option value="annulé">{STATUS_LABELS['annulé' as StageStatus]}</option>
            </select>
          </View>
        </FilterSheet>
      </View>

      {/* Error — affiché seul, sans état vide simultané */}
      {error ? (
        <View style={{ backgroundColor: colors.accent.red + '15', borderRadius: 7, padding: space.md, borderWidth: 1, borderColor: colors.accent.red }}>
          <AureakText variant="caption" style={{ color: colors.accent.red }}>{error}</AureakText>
        </View>
      ) : loading ? (
        /* Skeleton */
        <View style={s.skeletonGrid}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} height={150} />)}
        </View>
      ) : filtered.length === 0 ? (
        /* Story 62.2 — EmptyState illustré */
        <EmptyStateIllustrated
          variant="no-stages"
          subtitle={search ? 'Aucun résultat pour cette recherche.' : undefined}
          ctaLabel="+ Nouveau stage"
          onCta={() => router.push('/evenements/stages/new' as never)}
        />
      ) : (
        /* Story 110.x — Tableau style /activites/seances */
        <View style={s.tableCard}>
          <View style={s.tableHeader}>
            <AureakText style={[s.thText, s.colName] as never}>NOM</AureakText>
            <AureakText style={[s.thText, s.colDates] as never}>DATES</AureakText>
            <AureakText style={[s.thText, s.colInfo] as never}>TYPE</AureakText>
            <AureakText style={[s.thText, s.colCountSm] as never}>JOURS</AureakText>
            <AureakText style={[s.thText, s.colCountSm] as never}>JOUEURS</AureakText>
            <AureakText style={[s.thText, s.colStatus] as never}>STATUT</AureakText>
            <AureakText style={[s.thText, s.colChevron] as never}>{''}</AureakText>
          </View>

          {filtered.map((stage, idx) => (
            <Pressable
              key={stage.id}
              onPress={() => router.push(`/evenements/stages/${stage.id}` as never)}
              style={({ pressed }) => [
                s.tableRow,
                { backgroundColor: idx % 2 === 0 ? colors.light.surface : colors.light.muted },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={s.colName}>
                <AureakText style={s.nameText} numberOfLines={1}>{stage.name}</AureakText>
                {stage.implantationName && (
                  <AureakText style={s.subText} numberOfLines={1}>📍 {stage.implantationName}</AureakText>
                )}
              </View>
              <AureakText style={[s.cellText, s.colDates] as never} numberOfLines={1}>
                {formatDate(stage.startDate)} → {formatDate(stage.endDate)}
              </AureakText>
              <AureakText style={[s.cellTextMuted, s.colInfo] as never} numberOfLines={1}>
                {[stage.type ? TYPE_LABELS[stage.type] : null, stage.seasonLabel].filter(Boolean).join(' · ') || '—'}
              </AureakText>
              <AureakText style={[s.cellNum, s.colCountSm] as never}>{stage.dayCount}</AureakText>
              <AureakText style={[s.cellNum, s.colCountSm] as never}>{stage.participantCount}</AureakText>
              <View style={s.colStatus}>
                <StatusBadge status={stage.status} />
              </View>
              <AureakText style={[s.chevron, s.colChevron] as never}>›</AureakText>
            </Pressable>
          ))}
        </View>
      )}
      </ScrollView>

      <PrimaryAction
        label="Nouveau stage"
        onPress={() => router.push('/evenements/stages/new' as never)}
      />
    </View>
  )
}

const selectNativeStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '7px 10px',
  fontSize     : 13,
  color        : colors.text.dark,
  background   : colors.light.muted,
  border       : `1px solid ${colors.border.divider}`,
  borderRadius : radius.xs,
  outline      : 'none',
  fontFamily   : fonts.body,
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md },

  // Story 110.x — controls row : search inline + bouton Filtres aligné droite
  controls   : {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
    alignItems   : 'center',
  },
  searchWrap : { flex: 1, minWidth: 200 },
  searchInput: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  selectField: {
    flexGrow : 1,
    flexBasis: 160,
    gap      : 4,
  },
  selectLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    fontFamily   : fonts.display,
  },

  // Story 110.x — Tableau style /activites/seances
  tableCard: {
    borderRadius: 10,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
    backgroundColor: colors.light.surface,
  },
  tableHeader: {
    flexDirection    : 'row',
    backgroundColor  : colors.light.muted,
    paddingVertical  : 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase' as never,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    minHeight        : 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  // Cellules
  colName     : { flex: 2, minWidth: 140 },
  colDates    : { flex: 1.4, minWidth: 130 },
  colInfo     : { flex: 1.5, minWidth: 110 },
  colCountSm  : { width: 70, textAlign: 'center' as never },
  colStatus   : { width: 100, alignItems: 'flex-start' },
  colChevron  : { width: 20 },
  nameText: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  subText: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
    marginTop : 1,
  },
  cellText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.dark,
  },
  cellTextMuted: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  cellNum: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  chevron: {
    fontFamily: fonts.body,
    fontSize  : 18,
    color     : colors.text.muted,
    textAlign : 'center' as never,
  },

  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  skeletonCard: { width: 300, height: 150, backgroundColor: colors.light.surface, borderRadius: 10, opacity: 0.5 },
  emptyState  : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
})
