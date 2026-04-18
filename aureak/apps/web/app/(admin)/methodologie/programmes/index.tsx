'use client'
// Programmes pédagogiques — bibliothèque de programmes par méthode et saison
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologyProgrammes } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologyProgramme } from '@aureak/types'

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
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: true  },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: false },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: false },
]

const COL_WIDTHS = { method: 52, title: 1, season: 120, accomplishment: 140, chevron: 40 }

export default function ProgrammesPage() {
  const router = useRouter()

  const [programmes,     setProgrammes]     = useState<MethodologyProgramme[]>([])
  const [loading,        setLoading]        = useState(true)
  const [contextFilter,  setContextFilter]  = useState<MethodologyContextType | 'all'>('all')

  const loadProgrammes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologyProgrammes({ activeOnly: false })
      setProgrammes(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[programmes] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProgrammes()
  }, [loadProgrammes])

  const filtered = programmes.filter(p => {
    if (contextFilter !== 'all' && p.contextType !== contextFilter) return false
    return true
  })

  const methodCounts = METHODOLOGY_METHODS.map(m => ({
    method: m,
    count : programmes.filter(p => p.method === m).length,
  }))

  const isGlobal = contextFilter === 'all'

  return (
    <View style={st.container}>

      {/* ── Header : titre + nav tabs + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <Pressable style={st.cta} onPress={() => router.push('/methodologie/programmes/new' as never)}>
            <AureakText style={st.ctaLabel}>+ Nouveau programme</AureakText>
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
              onPress={() => setContextFilter('all')}
            >
              <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
            </Pressable>
          </View>

          <View style={st.toggleRow}>
            <Pressable
              style={[st.toggleBtn, contextFilter === 'academie' && st.toggleBtnActive] as never}
              onPress={() => setContextFilter(contextFilter === 'academie' ? 'all' : 'academie')}
            >
              <AureakText style={[st.toggleLabel, contextFilter === 'academie' && st.toggleLabelActive] as never}>
                ACADÉMIE
              </AureakText>
            </Pressable>
            <Pressable
              style={[st.toggleBtn, contextFilter === 'stage' && st.toggleBtnActive] as never}
              onPress={() => setContextFilter(contextFilter === 'stage' ? 'all' : 'stage')}
            >
              <AureakText style={[st.toggleLabel, contextFilter === 'stage' && st.toggleLabelActive] as never}>
                STAGE
              </AureakText>
            </Pressable>
          </View>
        </View>

        {/* ── Contenu : table programmes ── */}
        {loading ? (
          <View style={st.loadingWrapper}>
            <AureakText style={st.loadingText}>Chargement…</AureakText>
          </View>
        ) : (
          <ProgrammesTable
            programmes={filtered}
            totalProgrammes={programmes.length}
            methodColors={methodologyMethodColors}
            onPress={(id) => router.push(`/methodologie/programmes/${id}` as never)}
          />
        )}

      </ScrollView>
    </View>
  )
}

// ── Sous-composant table programmes ──────────────────────────────────────────

type ProgrammesTableProps = {
  programmes      : MethodologyProgramme[]
  totalProgrammes : number
  methodColors    : Record<string, string>
  onPress         : (id: string) => void
}

function ProgrammesTable({ programmes, totalProgrammes, methodColors, onPress }: ProgrammesTableProps) {
  if (programmes.length === 0) {
    return (
      <View style={st.empty}>
        <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
          {totalProgrammes === 0
            ? 'Aucun programme. Créez le premier.'
            : 'Aucun résultat pour ces filtres.'}
        </AureakText>
      </View>
    )
  }

  return (
    <View style={st.tableContainer}>
      <View style={st.tableHeaderRow}>
        <View style={{ width: COL_WIDTHS.method }}>
          <AureakText style={st.tableHeaderText}>MÉTHODE</AureakText>
        </View>
        <View style={{ flex: COL_WIDTHS.title }}>
          <AureakText style={st.tableHeaderText}>TITRE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.season }}>
          <AureakText style={st.tableHeaderText}>SAISON</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.accomplishment }}>
          <AureakText style={st.tableHeaderText}>ACCOMPLISSEMENT</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.chevron }} />
      </View>

      {programmes.map((programme, idx) => {
        const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const methodColor = methodColors[programme.method] ?? colors.border.light
        const picto       = METHOD_PICTOS[programme.method] ?? '—'

        return (
          <Pressable
            key={programme.id}
            onPress={() => onPress(programme.id)}
            style={({ pressed }) => [
              st.tableRow,
              { backgroundColor: pressed ? colors.light.hover : rowBg },
            ]}
          >
            <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {programme.title}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.season, justifyContent: 'center' }}>
              <AureakText style={st.titleText}>
                {programme.seasonLabel ?? '—'}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.accomplishment, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {programme.accomplishment.done}/{programme.accomplishment.total}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.chevron, alignItems: 'center', justifyContent: 'center' }}>
              <AureakText style={{ fontSize: 16, color: colors.text.muted }}>›</AureakText>
            </View>
          </Pressable>
        )
      })}
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
    maxWidth       : 1200,
    alignSelf      : 'center',
    width          : '100%',
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
})
