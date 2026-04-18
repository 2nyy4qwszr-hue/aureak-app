'use client'
// Situations pédagogiques — bibliothèque par méthode et difficulté
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySituations } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, DIFFICULTY_LABELS,
  type MethodologyMethod,
} from '@aureak/types'
import type { MethodologySituation } from '@aureak/types'

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
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',    active: false },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: false },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: true  },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: false },
]

const COL_WIDTHS = { method: 52, title: 1, difficulty: 110, diagram: 70, status: 60 }

export default function SituationsPage() {
  const router = useRouter()

  const [situations,      setSituations]      = useState<MethodologySituation[]>([])
  const [loading,         setLoading]         = useState(true)
  const [methodFilter,    setMethodFilter]    = useState<FilterMethod>('all')
  const [diffFilter,      setDiffFilter]      = useState<number | 'all'>('all')
  const [methodDropOpen,  setMethodDropOpen]  = useState(false)
  const [diffDropOpen,    setDiffDropOpen]    = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologySituations({ activeOnly: false })
      setSituations(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SituationsPage] loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = situations.filter(s => {
    if (methodFilter !== 'all' && s.method !== methodFilter) return false
    if (diffFilter   !== 'all' && (s.difficultyLevel ?? 3) !== diffFilter) return false
    return true
  })

  const methodCounts = METHODOLOGY_METHODS.map(m => ({
    method: m,
    count : situations.filter(s => s.method === m).length,
  }))

  const isGlobal = methodFilter === 'all' && diffFilter === 'all'

  return (
    <View style={st.container}>

      {/* ── Header : titre + nav tabs + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <Pressable style={st.cta} onPress={() => router.push('/methodologie/situations/new' as never)}>
            <AureakText style={st.ctaLabel}>+ Nouvelle situation</AureakText>
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

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent}>

        {/* ── StatCards — 7 cards méthodes horizontales ── */}
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
              onPress={() => { setMethodFilter('all'); setDiffFilter('all'); setMethodDropOpen(false); setDiffDropOpen(false) }}
            >
              <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
            </Pressable>

            {/* Méthode dropdown */}
            <View style={st.dropdownWrapper}>
              <Pressable
                style={methodFilter !== 'all' ? st.pillActive : st.pillInactive}
                onPress={() => { setMethodDropOpen(o => !o); setDiffDropOpen(false) }}
              >
                <AureakText style={methodFilter !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                  {methodFilter === 'all' ? 'MÉTHODE ▾' : `${methodFilter} ▾`}
                </AureakText>
              </Pressable>

              {methodDropOpen && (
                <View style={st.dropdown}>
                  {(['all', ...METHODOLOGY_METHODS] as FilterMethod[]).map(m => (
                    <Pressable
                      key={m}
                      style={[st.dropdownItem, methodFilter === m && st.dropdownItemActive]}
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

            {/* Difficulté dropdown */}
            <View style={st.dropdownWrapper}>
              <Pressable
                style={diffFilter !== 'all' ? st.pillActive : st.pillInactive}
                onPress={() => { setDiffDropOpen(o => !o); setMethodDropOpen(false) }}
              >
                <AureakText style={diffFilter !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                  {diffFilter === 'all' ? 'DIFFICULTÉ ▾' : `${'★'.repeat(diffFilter as number)} ▾`}
                </AureakText>
              </Pressable>

              {diffDropOpen && (
                <View style={st.dropdown}>
                  <Pressable
                    style={[st.dropdownItem, diffFilter === 'all' && st.dropdownItemActive]}
                    onPress={() => { setDiffFilter('all'); setDiffDropOpen(false) }}
                  >
                    <AureakText style={{ fontSize: 12, fontWeight: diffFilter === 'all' ? '700' : '400', color: diffFilter === 'all' ? colors.text.dark : colors.text.muted }}>
                      Toutes les difficultés
                    </AureakText>
                  </Pressable>
                  {[1, 2, 3, 4, 5].map(level => (
                    <Pressable
                      key={level}
                      style={[st.dropdownItem, diffFilter === level && st.dropdownItemActive]}
                      onPress={() => { setDiffFilter(level); setDiffDropOpen(false) }}
                    >
                      <AureakText style={{ fontSize: 12, fontWeight: diffFilter === level ? '700' : '400', color: diffFilter === level ? colors.text.dark : colors.text.muted }}>
                        {'★'.repeat(level)} {DIFFICULTY_LABELS[level]}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Tableau ── */}
        {loading ? (
          <View style={st.loadingWrapper}>
            <AureakText style={st.loadingText}>Chargement…</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={st.empty}>
            <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
              {situations.length === 0 ? 'Aucune situation configurée. Créez la première.' : 'Aucun résultat pour ces filtres.'}
            </AureakText>
          </View>
        ) : (
          <View style={st.tableContainer}>
            <View style={st.tableHeaderRow}>
              <View style={{ width: COL_WIDTHS.method }}>
                <AureakText style={st.tableHeaderText}>MÉTHODE</AureakText>
              </View>
              <View style={{ flex: COL_WIDTHS.title }}>
                <AureakText style={st.tableHeaderText}>TITRE</AureakText>
              </View>
              <View style={{ width: COL_WIDTHS.difficulty }}>
                <AureakText style={st.tableHeaderText}>DIFFICULTÉ</AureakText>
              </View>
              <View style={{ width: COL_WIDTHS.diagram }}>
                <AureakText style={st.tableHeaderText}>DIAGRAMME</AureakText>
              </View>
              <View style={{ width: COL_WIDTHS.status }}>
                <AureakText style={st.tableHeaderText}>STATUT</AureakText>
              </View>
            </View>

            {filtered.map((situation, idx) => {
              const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              const methodColor = situation.method
                ? methodologyMethodColors[situation.method] ?? colors.border.light
                : colors.border.light
              const picto = situation.method ? METHOD_PICTOS[situation.method] : '—'
              const diff  = situation.difficultyLevel ?? 3

              return (
                <Pressable
                  key={situation.id}
                  onPress={() => router.push(`/methodologie/situations/${situation.id}` as never)}
                  style={({ pressed }) => [
                    st.tableRow,
                    { backgroundColor: pressed ? colors.light.hover : rowBg },
                  ]}
                  // @ts-ignore — web-only drag-drop for session builder
                  draggable
                  onDragStart={(e: unknown) => {
                    const de = e as React.DragEvent<HTMLDivElement>
                    de.dataTransfer.setData('application/json', JSON.stringify({
                      type       : 'situation',
                      situationId: situation.id,
                    }))
                    de.dataTransfer.effectAllowed = 'copy'
                  }}
                >
                  <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
                    <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                      <AureakText style={st.methodPicto}>{picto}</AureakText>
                    </View>
                  </View>

                  <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
                    <AureakText style={st.titleText} numberOfLines={2}>
                      {situation.title}
                    </AureakText>
                  </View>

                  <View style={{ width: COL_WIDTHS.difficulty, justifyContent: 'center' }}>
                    <AureakText style={{ fontSize: 12, color: colors.text.muted }}>
                      {'★'.repeat(diff)}{'☆'.repeat(5 - diff)} {DIFFICULTY_LABELS[diff] ?? ''}
                    </AureakText>
                  </View>

                  <View style={{ width: COL_WIDTHS.diagram, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[st.statusDot, {
                      backgroundColor: situation.diagramJson ? colors.status.present : colors.border.light,
                    }]} />
                  </View>

                  <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[st.statusDot, {
                      backgroundColor: situation.isActive ? colors.status.present : colors.border.light,
                    }]} />
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}

      </ScrollView>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scroll: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scrollContent: {
    paddingTop     : space.md,
    paddingBottom  : space.xxl,
    backgroundColor: colors.light.primary,
  },

  headerBlock: {
    backgroundColor: colors.light.primary,
    gap            : 12,
  },
  headerTopRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingTop       : space.lg,
  },
  pageTitle: {
    fontSize     : 24,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: 0.5,
  },
  cta: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : 8,
  },
  ctaLabel: {
    color     : colors.text.dark,
    fontWeight: '700',
    fontSize  : 13,
  },

  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: space.lg,
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
  tabUnderline: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  statCard: {
    flex           : 1,
    minWidth       : 120,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
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

  filtresRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    zIndex           : 9999,
    flexWrap         : 'wrap',
    gap              : space.sm,
  },
  filtresLeft: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },

  pillActive: {
    paddingHorizontal: 14,
    paddingVertical  : 6,
    borderRadius     : radius.badge,
    backgroundColor  : colors.accent.gold,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  pillInactive: {
    paddingHorizontal: 14,
    paddingVertical  : 6,
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
  dropdown: {
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
  dropdownItem      : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  dropdownItemActive: { backgroundColor: colors.accent.gold + '18' },

  loadingWrapper: {
    padding   : space.xl,
    alignItems: 'center',
  },
  loadingText: {
    color     : colors.text.muted,
    fontSize  : 14,
    fontFamily: fonts.body,
  },

  empty: {
    marginHorizontal: space.lg,
    padding         : space.lg,
    alignItems      : 'center',
  },
  tableContainer: {
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    borderRadius    : 10,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    overflow        : 'hidden',
  },
  tableHeaderRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    gap              : 12,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tableHeaderText: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
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
  titleText  : { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  statusDot  : { width: 8, height: 8, borderRadius: 4 },
})
