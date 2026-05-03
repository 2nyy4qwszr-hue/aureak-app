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
        <View style={s.grid}>
          {filtered.map(stage => (
            <Pressable
              key={stage.id}
              style={s.card}
              onPress={() => router.push(`/evenements/stages/${stage.id}` as never)}
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
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {[stage.type ? TYPE_LABELS[stage.type] : null, stage.seasonLabel].filter(Boolean).join(' · ')}
                  </AureakText>
                )}

                {/* Implantation */}
                {stage.implantationName && (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
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
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                      {stage.dayCount} jour{stage.dayCount !== 1 ? 's' : ''}
                    </AureakText>
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
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

  grid        : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card        : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    width          : '100%' as never,
    maxWidth       : 360,
    minWidth       : 280,
  },
  cardAccent  : { height: 3 },
  chip        : {
    backgroundColor  : colors.light.muted,
    borderRadius     : 12,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    alignSelf        : 'flex-start',
    borderWidth      : 1,
    borderColor      : colors.border.light,
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
