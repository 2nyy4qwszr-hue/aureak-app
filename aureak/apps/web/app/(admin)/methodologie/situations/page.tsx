'use client'
import React, { useContext, useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listSituations, listThemeGroups } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import type { Situation, ThemeGroup } from '@aureak/types'
import { MethodologieHeader } from '../../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieCountsContext } from '../_layout'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import {
  MetFiltersRow, MetSelect, MetPagination, usePagination, PAGE_SIZE,
} from '../../../../components/admin/methodologie/methodologieFilters'

const COL_WIDTHS = { name: 1, key: 200, bloc: 160, chevron: 40 }

export default function SituationsPage() {
  const router = useRouter()
  const counts = useContext(MethodologieCountsContext)

  const [situations,     setSituations]     = useState<Situation[]>([])
  const [groups,         setGroups]         = useState<ThemeGroup[]>([])
  const [loading,        setLoading]        = useState(true)
  const [selectedBlocId, setSelectedBlocId] = useState<string>('all')
  const [errorMsg,       setErrorMsg]       = useState<string | null>(null)

  const loadData = async () => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const [s, g] = await Promise.all([listSituations(), listThemeGroups()])
      if (s.error || g.error) {
        setErrorMsg('Impossible de charger les situations. Réessayez ou contactez le support.')
        return
      }
      setSituations(s.data)
      setGroups(g.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SituationsPage] loadData error:', err)
      setErrorMsg('Impossible de charger les situations. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  const visibleSituations = selectedBlocId === 'all'
    ? situations
    : situations.filter(s => s.blocId === selectedBlocId)

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      <MethodologieHeader
        newLabel="+ Nouvelle situation"
        newHref="/methodologie/situations/new"
        counts={counts ?? undefined}
      />

      <View style={st.bodyWrap}>
        <MetFiltersRow>
          <MetSelect
            label="Bloc"
            value={selectedBlocId}
            onChange={setSelectedBlocId}
            options={[
              { value: 'all', label: 'Tous' },
              ...groups.map(g => ({ value: g.id, label: g.name })),
            ]}
          />
        </MetFiltersRow>

        {loading && (
          <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
        )}

        {errorMsg && (
          <AureakText style={{ color: colors.accent.red, fontSize: 13 }}>{errorMsg}</AureakText>
        )}

        {!loading && !errorMsg && (
          <SituationsTable
            situations={visibleSituations}
            totalSituations={situations.length}
            groupMap={groupMap}
            onPress={(situationKey) => router.push(`/methodologie/situations/${situationKey}` as never)}
          />
        )}
      </View>
    </ScrollView>

      <PrimaryAction
        label="Nouvelle situation"
        onPress={() => router.push('/methodologie/situations/new' as never)}
      />
    </View>
  )
}

// ── Sous-composant table situations ──────────────────────────────────────────

type SituationsTableProps = {
  situations      : Situation[]
  totalSituations : number
  groupMap        : Record<string, string>
  onPress         : (situationKey: string) => void
}

function SituationsTable({ situations, totalSituations, groupMap, onPress }: SituationsTableProps) {
  const { page, setPage, pageCount, paginated } = usePagination(situations, PAGE_SIZE)

  if (situations.length === 0) {
    return (
      <View style={st.tableWrapper}>
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {totalSituations === 0 ? 'Aucune situation configurée.' : 'Aucune situation pour ce filtre.'}
          </AureakText>
        </View>
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
      <View style={st.tableHeader}>
        <View style={{ flex: COL_WIDTHS.name }}>
          <AureakText style={st.thText}>NOM</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.key }}>
          <AureakText style={st.thText}>CLÉ</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.bloc }}>
          <AureakText style={st.thText}>BLOC</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.chevron }} />
      </View>

      {paginated.map((sit, idx) => {
        const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        return (
          <Pressable
            key={sit.id}
            onPress={() => onPress(sit.situationKey)}
            style={({ pressed }) => [
              st.tableRow,
              { backgroundColor: rowBg },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flex: COL_WIDTHS.name, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>{sit.name}</AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.key, justifyContent: 'center' }}>
              <AureakText style={st.keyText}>{sit.situationKey}</AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.bloc, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>
                {groupMap[sit.blocId ?? ''] ?? '—'}
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
        total={situations.length}
        pageSize={PAGE_SIZE}
        itemLabelPlural="situations"
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

  titleText: { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  keyText  : { fontSize: 11, fontFamily: fonts.mono, color: colors.text.muted },
  dashText : { fontSize: 12, color: colors.text.muted },
})
