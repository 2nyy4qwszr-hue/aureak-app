'use client'
// Évaluations pédagogiques — bibliothèque de grilles d'évaluation
import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { listMethodologyExercises } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologyExercise } from '@aureak/types'
import { MethodologieHeader } from '../../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieCountsContext } from '../_layout'
import {
  MetFiltersRow, MetSelect, MetPagination, usePagination, PAGE_SIZE,
} from '../../../../components/admin/methodologie/methodologieFilters'

type FilterMethod = MethodologyMethod | 'all'
type ContextValue = MethodologyContextType | 'all'

const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

const COL_WIDTHS = { method: 52, num: 90, title: 1, themes: 100, status: 60 }

// Route /methodologie/evaluations/new n'existe pas encore — hideNewButton={true}

export default function EvaluationsPage() {
  const counts = useContext(MethodologieCountsContext)

  const [exercises,     setExercises]     = useState<MethodologyExercise[]>([])
  const [loading,       setLoading]       = useState(true)
  const [methodFilter,  setMethodFilter]  = useState<FilterMethod>('all')
  const [contextFilter, setContextFilter] = useState<ContextValue>('all')

  const loadExercises = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologyExercises({ activeOnly: false })
      setExercises(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[evaluations] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadExercises() }, [loadExercises])

  const filteredExercises = useMemo(() => exercises.filter(e => {
    if (methodFilter  !== 'all' && e.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && e.contextType !== contextFilter) return false
    return true
  }), [exercises, methodFilter, contextFilter])

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      <MethodologieHeader
        newLabel="+ Nouvelle évaluation"
        newHref="/methodologie/evaluations/new"
        hideNewButton
        counts={counts ?? undefined}
      />

      <View style={st.bodyWrap}>
        <MetFiltersRow>
          <MetSelect
            label="Méthode"
            value={methodFilter}
            onChange={(v) => setMethodFilter(v as FilterMethod)}
            options={[
              { value: 'all', label: 'Toutes' },
              ...METHODOLOGY_METHODS.map(m => ({ value: m, label: `${METHOD_PICTOS[m]} ${m}` })),
            ]}
          />
          <MetSelect
            label="Contexte"
            value={contextFilter}
            onChange={(v) => setContextFilter(v as ContextValue)}
            options={[
              { value: 'all',      label: 'Tous' },
              { value: 'academie', label: 'Académie' },
              { value: 'stage',    label: 'Stage' },
            ]}
          />
        </MetFiltersRow>

        {loading ? (
          <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
        ) : (
          <EvaluationsTable
            exercises={filteredExercises}
            totalExercises={exercises.length}
            methodColors={methodologyMethodColors}
          />
        )}
      </View>
    </ScrollView>
  )
}

// ── Sous-composant table évaluations ─────────────────────────────────────────

type EvaluationsTableProps = {
  exercises     : MethodologyExercise[]
  totalExercises: number
  methodColors  : Record<string, string>
}

function EvaluationsTable({ exercises, totalExercises, methodColors }: EvaluationsTableProps) {
  const { page, setPage, pageCount, paginated } = usePagination(exercises, PAGE_SIZE)

  if (exercises.length === 0) {
    return (
      <View style={st.tableWrapper}>
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {totalExercises === 0 ? 'Aucune évaluation configurée. Créez la première.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
      <View style={st.tableHeader}>
        <View style={{ width: COL_WIDTHS.method }}>
          <AureakText style={st.thText}>MÉTHODE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.num }}>
          <AureakText style={st.thText}>NUM</AureakText>
        </View>
        <View style={{ flex: COL_WIDTHS.title }}>
          <AureakText style={st.thText}>TITRE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.themes }}>
          <AureakText style={st.thText}>THÈMES</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.status }}>
          <AureakText style={st.thText}>STATUT</AureakText>
        </View>
      </View>

      {paginated.map((exercise, idx) => {
        const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const methodColor = methodColors[exercise.method] ?? colors.border.light
        const picto       = METHOD_PICTOS[exercise.method] ?? '—'

        return (
          <View key={exercise.id} style={[st.tableRow, { backgroundColor: rowBg }]}>
            <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            <View style={{ width: COL_WIDTHS.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {exercise.trainingRef ? `#${exercise.trainingRef}` : '—'}
              </AureakText>
            </View>

            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {exercise.title}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.themes, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>—</AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: exercise.isActive ? colors.status.present : colors.border.light,
              }]} />
            </View>
          </View>
        )
      })}

      <MetPagination
        page={page}
        pageCount={pageCount}
        total={exercises.length}
        pageSize={PAGE_SIZE}
        itemLabelPlural="évaluations"
        onPageChange={setPage}
      />
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { paddingBottom: space.xxl, gap: space.md },
  bodyWrap : { paddingHorizontal: space.lg, gap: space.md },

  empty: { padding: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },

  tableWrapper: {
    borderRadius: 10,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    gap              : 12,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 12,
    gap              : 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },

  methodCircle: {
    width         : 32,
    height        : 32,
    borderRadius  : 16,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  methodPicto: { fontSize: 16 },
  numText    : { fontSize: 13, fontWeight: '700', color: colors.accent.gold },
  titleText  : { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  dashText   : { fontSize: 12, color: colors.text.muted },
  statusDot  : { width: 8, height: 8, borderRadius: 4 },
})
