'use client'
// Programmes pédagogiques — bibliothèque de programmes par méthode et saison
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologyProgrammes } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologyProgramme } from '@aureak/types'

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
  const [search,         setSearch]         = useState('')
  const [methodFilter,   setMethodFilter]   = useState<FilterMethod>('all')
  const [contextFilter,  setContextFilter]  = useState<MethodologyContextType | 'all'>('all')
  const [methodDropOpen, setMethodDropOpen] = useState(false)

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
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter  !== 'all' && p.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && p.contextType !== contextFilter) return false
    return true
  })

  // Stats row — count par méthode
  const methodCounts = METHODOLOGY_METHODS.map(m => ({
    method: m,
    count : programmes.filter(p => p.method === m).length,
  }))

  const isGlobal = methodFilter === 'all' && contextFilter === 'all'

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header : titre + nav tabs + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <Pressable style={st.newBtn} onPress={() => router.push('/methodologie/programmes/new' as never)}>
            <AureakText style={st.newBtnLabel}>+ Nouveau programme</AureakText>
          </Pressable>
        </View>

        {/* Nav tabs : 5 onglets */}
        <View style={st.tabsRow}>
          {NAV_TABS.map(tab => (
            <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
              <AureakText style={{ ...st.tabLabel, ...(tab.active ? st.tabLabelActive : {}) } as TextStyle}>
                {tab.label}
              </AureakText>
              {tab.active && <View style={st.tabUnderline} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Stats row compact — 7 blocs côte à côte ── */}
      <View style={st.statsRow}>
        {methodCounts.map(({ method, count }) => {
          const color = methodologyMethodColors[method] ?? colors.accent.gold
          return (
            <View key={method} style={st.statBlock}>
              <AureakText style={{ ...st.statCount, color } as TextStyle}>{count}</AureakText>
              <AureakText style={st.statLabel}>{METHOD_PICTOS[method]} {method}</AureakText>
            </View>
          )
        })}
      </View>

      {/* ── Filter bar — tabs underline style ── */}
      <View style={st.filterBar}>
        {/* Global */}
        <Pressable
          onPress={() => { setMethodFilter('all'); setContextFilter('all'); setMethodDropOpen(false) }}
          style={st.filterTabWrap}
        >
          <AureakText style={{ ...st.filterTab, ...(isGlobal ? st.filterTabActive : {}) } as TextStyle}>
            GLOBAL
          </AureakText>
          {isGlobal && <View style={st.filterTabUnderline} />}
        </Pressable>

        {/* MÉTHODE dropdown */}
        <View>
          <Pressable
            onPress={() => setMethodDropOpen(o => !o)}
            style={st.filterTabWrap}
          >
            <AureakText style={{ ...st.filterTab, ...(methodFilter !== 'all' ? st.filterTabActive : {}) } as TextStyle}>
              {methodFilter === 'all' ? 'MÉTHODE ▾' : `${methodFilter} ▾`}
            </AureakText>
            {methodFilter !== 'all' && <View style={st.filterTabUnderline} />}
          </Pressable>
        </View>

        {/* ACADÉMIQUE */}
        <Pressable
          onPress={() => { setContextFilter(contextFilter === 'academie' ? 'all' : 'academie'); setMethodDropOpen(false) }}
          style={st.filterTabWrap}
        >
          <AureakText style={{ ...st.filterTab, ...(contextFilter === 'academie' ? st.filterTabActive : {}) } as TextStyle}>
            ACADÉMIQUE
          </AureakText>
          {contextFilter === 'academie' && <View style={st.filterTabUnderline} />}
        </Pressable>

        {/* STAGE */}
        <Pressable
          onPress={() => { setContextFilter(contextFilter === 'stage' ? 'all' : 'stage'); setMethodDropOpen(false) }}
          style={st.filterTabWrap}
        >
          <AureakText style={{ ...st.filterTab, ...(contextFilter === 'stage' ? st.filterTabActive : {}) } as TextStyle}>
            STAGE
          </AureakText>
          {contextFilter === 'stage' && <View style={st.filterTabUnderline} />}
        </Pressable>

        {/* Recherche */}
        <TextInput
          style={st.searchCompact}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher…"
          placeholderTextColor={colors.text.subtle}
        />
      </View>

      {/* Dropdown méthodes */}
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

      {/* ── Contenu : table programmes ── */}
      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      ) : (
        <ProgrammesTable
          programmes={filtered}
          totalProgrammes={programmes.length}
          methodColors={methodologyMethodColors}
          onPress={(id) => router.push(`/methodologie/programmes/${id}` as never)}
        />
      )}

    </ScrollView>
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
    <View style={st.tableWrapper}>
      {/* Header */}
      <View style={st.tableHeader}>
        <View style={{ width: COL_WIDTHS.method }}>
          <AureakText style={st.thText}>MÉTHODE</AureakText>
        </View>
        <View style={{ flex: COL_WIDTHS.title }}>
          <AureakText style={st.thText}>TITRE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.season }}>
          <AureakText style={st.thText}>SAISON</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.accomplishment }}>
          <AureakText style={st.thText}>ACCOMPLISSEMENT</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.chevron }} />
      </View>

      {/* Rows */}
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
              { backgroundColor: rowBg },
              pressed && { opacity: 0.8 },
            ]}
          >
            {/* MÉTHODE */}
            <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            {/* TITRE */}
            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {programme.title}
              </AureakText>
            </View>

            {/* SAISON */}
            <View style={{ width: COL_WIDTHS.season, justifyContent: 'center' }}>
              <AureakText style={st.titleText}>
                {programme.seasonLabel ?? '—'}
              </AureakText>
            </View>

            {/* ACCOMPLISSEMENT */}
            <View style={{ width: COL_WIDTHS.accomplishment, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {programme.accomplishment.done}/{programme.accomplishment.total}
              </AureakText>
            </View>

            {/* CHEVRON */}
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
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // Header block
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },

  // Nav tabs (5 onglets navigation)
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    paddingBottom: 10,
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

  // Stats row compact
  statsRow: {
    flexDirection   : 'row',
    gap             : space.sm,
    paddingVertical : 8,
  },
  statBlock: {
    flex         : 1,
    alignItems   : 'center',
    gap          : 2,
  },
  statCount: {
    fontSize  : 22,
    fontWeight: '900',
    fontFamily: 'Montserrat',
  },
  statLabel: {
    fontSize     : 9,
    fontWeight   : '600',
    color        : colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign    : 'center',
  },

  // Filter bar — tabs underline style
  filterBar: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingBottom    : 0,
    flexWrap         : 'wrap',
  },
  filterTabWrap: {
    position    : 'relative',
    paddingBottom: 8,
  },
  filterTab: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.subtle,
    paddingHorizontal: 10,
    textTransform: 'uppercase',
  },
  filterTabActive: {
    color: colors.accent.gold,
  },
  filterTabUnderline: {
    position       : 'absolute',
    bottom         : 0,
    left           : 10,
    right          : 10,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  // Méthode dropdown
  methodDropdown: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : 6,
    // @ts-ignore web
    boxShadow      : shadows.lg,
    minWidth       : 220,
  },
  methodDropdownItem    : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  methodDropdownItemActive: { backgroundColor: colors.accent.gold + '18' },

  // Recherche compacte
  searchCompact: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 20,
    paddingHorizontal: 12,
    paddingVertical  : 5,
    color            : colors.text.dark,
    fontSize         : 12,
    minWidth         : 120,
    maxWidth         : 200,
    marginLeft       : 'auto',
    marginBottom     : 8,
  },

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
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : 'Montserrat',
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
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
})
