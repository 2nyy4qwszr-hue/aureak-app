'use client'
// Évaluations pédagogiques — bibliothèque de grilles d'évaluation
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, Pressable, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologyExercises } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologyExercise } from '@aureak/types'

type FilterMethod = MethodologyMethod | 'all'

const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

const NAV_TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',     active: false },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes',  active: false },
  { label: 'THÈMES',        href: '/methodologie/themes',      active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations',  active: false },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations', active: true  },
]

const COL_WIDTHS = { method: 52, num: 90, title: 1, themes: 100, status: 60 }

export default function EvaluationsPage() {
  const router = useRouter()

  const [exercises,      setExercises]      = useState<MethodologyExercise[]>([])
  const [loading,        setLoading]        = useState(true)
  const [methodFilter,   setMethodFilter]   = useState<FilterMethod>('all')
  const [contextFilter,  setContextFilter]  = useState<MethodologyContextType | 'all'>('all')
  const [methodDropOpen, setMethodDropOpen] = useState(false)

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

  const methodCounts = useMemo(() => METHODOLOGY_METHODS.map(m => ({
    method: m,
    count : exercises.filter(e => e.method === m).length,
  })), [exercises])

  const isGlobal = methodFilter === 'all' && contextFilter === 'all'

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header : titre + nav tabs + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <Pressable style={st.newBtn} onPress={() => router.push('/methodologie/evaluations/new' as never)}>
            <AureakText style={st.newBtnLabel}>+ Nouvelle évaluation</AureakText>
          </Pressable>
        </View>

        <View style={st.tabsRow}>
          {NAV_TABS.map(tab => (
            <Pressable key={tab.href} style={st.tabItem} onPress={() => router.push(tab.href as never)}>
              <AureakText style={{ ...st.tabLabel, ...(tab.active ? st.tabLabelActive : {}) } as TextStyle}>
                {tab.label}
              </AureakText>
              {tab.active && <View style={st.tabUnderline} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── StatCards — 7 cards méthodes ── */}
      <View style={st.statCardsRow}>
        {methodCounts.map(({ method, count }) => {
          const color = methodologyMethodColors[method] ?? colors.accent.gold
          return (
            <View key={method} style={st.statCard}>
              <AureakText style={st.statCardPicto}>{METHOD_PICTOS[method]}</AureakText>
              <AureakText style={st.statCardLabel}>{method}</AureakText>
              <AureakText style={{ ...st.statCardValue, color } as TextStyle}>{count}</AureakText>
            </View>
          )
        })}
      </View>

      {/* ── FiltresRow — gauche | droite ── */}
      <View style={st.filtresRow}>
        <View style={st.filtresLeft}>
          <Pressable
            style={isGlobal ? st.pillActive : st.pillInactive}
            onPress={() => { setMethodFilter('all'); setContextFilter('all'); setMethodDropOpen(false) }}
          >
            <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
          </Pressable>

          <View style={st.dropdownWrapper}>
            <Pressable
              style={methodFilter !== 'all' ? st.pillActive : st.pillInactive}
              onPress={() => setMethodDropOpen(o => !o)}
            >
              <AureakText style={methodFilter !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                {methodFilter === 'all' ? 'MÉTHODE ▾' : `${methodFilter} ▾`}
              </AureakText>
            </Pressable>

            {methodDropOpen && (
              <View style={st.methodDropdown}>
                {(['all', ...METHODOLOGY_METHODS] as FilterMethod[]).map(m => (
                  <Pressable
                    key={m}
                    style={[st.methodDropdownItem, methodFilter === m && st.methodDropdownItemActive]}
                    onPress={() => { setMethodFilter(m); setMethodDropOpen(false) }}
                  >
                    <AureakText style={{ fontSize: 12, fontWeight: methodFilter === m ? '700' : '400', color: methodFilter === m ? colors.text.dark : colors.text.muted }}>
                      {m === 'all' ? 'Toutes les méthodes' : `${METHOD_PICTOS[m as MethodologyMethod]} ${m}`}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Droite : Toggle ACADÉMIE / STAGE */}
        <View style={st.filtresRight}>
          <View style={st.toggleRow}>
            <Pressable
              style={[st.toggleBtn, contextFilter === 'academie' && st.toggleBtnActive] as never}
              onPress={() => { setContextFilter(contextFilter === 'academie' ? 'all' : 'academie'); setMethodDropOpen(false) }}
            >
              <AureakText style={[st.toggleLabel, contextFilter === 'academie' && st.toggleLabelActive] as never}>
                ACADÉMIE
              </AureakText>
            </Pressable>
            <Pressable
              style={[st.toggleBtn, contextFilter === 'stage' && st.toggleBtnActive] as never}
              onPress={() => { setContextFilter(contextFilter === 'stage' ? 'all' : 'stage'); setMethodDropOpen(false) }}
            >
              <AureakText style={[st.toggleLabel, contextFilter === 'stage' && st.toggleLabelActive] as never}>
                STAGE
              </AureakText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Tableau ── */}
      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      ) : (
        <EvaluationsTable
          exercises={filteredExercises}
          totalExercises={exercises.length}
          methodColors={methodologyMethodColors}
        />
      )}

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
  if (exercises.length === 0) {
    return (
      <View style={st.empty}>
        <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
          {totalExercises === 0 ? 'Aucune évaluation configurée. Créez la première.' : 'Aucun résultat pour ces filtres.'}
        </AureakText>
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
      {/* Header */}
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

      {/* Rows */}
      {exercises.map((exercise, idx) => {
        const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const methodColor = methodColors[exercise.method] ?? colors.border.light
        const picto       = METHOD_PICTOS[exercise.method] ?? '—'

        return (
          <View key={exercise.id} style={[st.tableRow, { backgroundColor: rowBg }]}>
            {/* MÉTHODE */}
            <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            {/* NUM */}
            <View style={{ width: COL_WIDTHS.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {exercise.trainingRef ? `#${exercise.trainingRef}` : '—'}
              </AureakText>
            </View>

            {/* TITRE */}
            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {exercise.title}
              </AureakText>
            </View>

            {/* THÈMES */}
            <View style={{ width: COL_WIDTHS.themes, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>—</AureakText>
            </View>

            {/* STATUT */}
            <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: exercise.isActive ? colors.status.present : colors.border.light,
              }]} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // Header block
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },

  // Nav tabs
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabItem: {
    position     : 'relative',
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.accent.gold },
  tabUnderline  : {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  // StatCards
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  statCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    minWidth       : 130,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  statCardPicto: {
    fontSize    : 22,
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign    : 'center',
  },
  statCardValue: {
    fontSize  : 28,
    fontFamily: fonts.display,
    fontWeight: '900',
    color     : colors.text.dark,
  },

  // FiltresRow
  filtresRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    flexWrap      : 'wrap',
    gap           : space.sm,
    zIndex        : 9999,
  },
  filtresLeft: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  filtresRight: {
    flexDirection: 'row',
    alignItems   : 'center',
  },

  // Pills
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.accent.gold,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  pillInactive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pillTextActive: {
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  pillTextInactive: {
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },

  dropdownWrapper: {
    position: 'relative',
    zIndex  : 9999,
  },

  // Segmented toggle ACADÉMIE/STAGE
  toggleRow: {
    flexDirection: 'row',
    gap          : 0,
    alignSelf    : 'flex-start',
    borderRadius : radius.xs,
    overflow     : 'hidden',
    borderWidth  : 1,
    borderColor  : colors.border.light,
  },
  toggleBtn: {
    paddingVertical  : 8,
    paddingHorizontal: space.lg,
    backgroundColor  : colors.light.surface,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  toggleLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.muted,
  },
  toggleLabelActive: {
    color: colors.text.dark,
  },

  // Méthode dropdown
  methodDropdown: {
    position       : 'absolute',
    top            : 38,
    left           : 0,
    zIndex         : 9999,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : 6,
    minWidth       : 220,
    // @ts-ignore web
    boxShadow      : shadows.lg,
  },
  methodDropdownItem      : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  methodDropdownItemActive: { backgroundColor: colors.accent.gold + '18' },

  // Table
  empty: { padding: space.lg, alignItems: 'center' },
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

  // Row cells
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
