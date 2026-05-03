'use client'
// Programmes pédagogiques — bibliothèque de programmes par méthode et saison
import React, { useContext, useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologyProgrammes } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologyProgramme } from '@aureak/types'
import { MethodologieHeader } from '../../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieCountsContext } from '../_layout'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
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

const COL_WIDTHS = { method: 52, title: 1, season: 120, accomplishment: 140, chevron: 40 }

export default function ProgrammesPage() {
  const router = useRouter()
  const counts = useContext(MethodologieCountsContext)

  const [programmes,    setProgrammes]    = useState<MethodologyProgramme[]>([])
  const [loading,       setLoading]       = useState(true)
  const [methodFilter,  setMethodFilter]  = useState<FilterMethod>('all')
  const [contextFilter, setContextFilter] = useState<ContextValue>('all')

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
    if (methodFilter  !== 'all' && p.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && p.contextType !== contextFilter) return false
    return true
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      <MethodologieHeader
        newLabel="+ Nouveau programme"
        newHref="/methodologie/programmes/new"
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
          <ProgrammesTable
            programmes={filtered}
            totalProgrammes={programmes.length}
            methodColors={methodologyMethodColors}
            onPress={(id) => router.push(`/methodologie/programmes/${id}` as never)}
          />
        )}
      </View>
    </ScrollView>

      <PrimaryAction
        label="Nouveau programme"
        onPress={() => router.push('/methodologie/programmes/new' as never)}
      />
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
  const { page, setPage, pageCount, paginated } = usePagination(programmes, PAGE_SIZE)

  if (programmes.length === 0) {
    return (
      <View style={st.tableWrapper}>
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {totalProgrammes === 0
              ? 'Aucun programme. Créez le premier.'
              : 'Aucun résultat pour ces filtres.'}
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

      {paginated.map((programme, idx) => {
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

      <MetPagination
        page={page}
        pageCount={pageCount}
        total={programmes.length}
        pageSize={PAGE_SIZE}
        itemLabelPlural="programmes"
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
