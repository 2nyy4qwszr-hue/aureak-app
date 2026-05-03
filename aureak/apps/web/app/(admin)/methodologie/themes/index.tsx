'use client'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemes, listThemeGroups, supabase } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import type { Theme, ThemeGroup } from '@aureak/types'
import { MethodologieHeader } from '../../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieCountsContext } from '../_layout'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
import {
  MetFiltersRow, MetSelect, MetPagination, usePagination, PAGE_SIZE,
} from '../../../../components/admin/methodologie/methodologieFilters'

const COL_WIDTHS = { num: 52, title: 1, bloc: 120, metaphore: 70, video: 60, status: 60 }

export default function ThemesPage() {
  const router = useRouter()
  const counts = useContext(MethodologieCountsContext)

  const [themes,                 setThemes]                 = useState<Theme[]>([])
  const [groups,                 setGroups]                 = useState<ThemeGroup[]>([])
  const [loading,                setLoading]                = useState(true)
  const [selectedGroupId,        setSelectedGroupId]        = useState<string>('all')
  const [errorMsg,               setErrorMsg]               = useState<string | null>(null)
  const [themeIdsWithMetaphors,  setThemeIdsWithMetaphors]  = useState<Set<string>>(new Set())
  const [themeIdsWithVideo,      setThemeIdsWithVideo]      = useState<Set<string>>(new Set())

  const loadData = async () => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const [t, g, meta, vids] = await Promise.all([
        listThemes(),
        listThemeGroups(),
        supabase.from('theme_metaphors').select('theme_id').is('deleted_at', null),
        supabase.from('theme_sequences').select('theme_id').not('coach_video_url', 'is', null),
      ])
      if (t.error || g.error) {
        setErrorMsg('Impossible de charger les thèmes (erreur base de données). Réessayez ou contactez le support.')
        return
      }
      setThemes(t.data)
      setGroups(g.data)
      setThemeIdsWithMetaphors(new Set((meta.data ?? []).map((r: { theme_id: string }) => r.theme_id)))
      setThemeIdsWithVideo(new Set((vids.data ?? []).map((r: { theme_id: string }) => r.theme_id)))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ThemesIndex] loadData error:', err)
      setErrorMsg('Impossible de charger les thèmes. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const orderedThemes = useMemo(
    () => [...themes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    [themes],
  )

  const visibleThemes = selectedGroupId === 'all'
    ? orderedThemes
    : orderedThemes.filter(t => t.groupId === selectedGroupId)

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      <MethodologieHeader
        newLabel="+ Nouveau thème"
        newHref="/methodologie/themes/new"
        counts={counts ?? undefined}
      />

      <View style={st.bodyWrap}>
        <MetFiltersRow>
          <FilterSheet
            activeCount={selectedGroupId !== 'all' ? 1 : 0}
            onReset={() => setSelectedGroupId('all')}
            triggerLabel="Filtrer les thèmes"
          >
            <MetSelect
              label="Bloc"
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              options={[
                { value: 'all', label: 'Tous' },
                ...groups.map(g => ({ value: g.id, label: g.name })),
              ]}
            />
          </FilterSheet>
        </MetFiltersRow>

        {loading && (
          <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
        )}

        {errorMsg && (
          <AureakText style={{ color: colors.accent.red, fontSize: 13 }}>{errorMsg}</AureakText>
        )}

        {!loading && !errorMsg && themes.length === 0 && (
          <View>
            <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>
              Aucun thème configuré.
            </AureakText>
            <Pressable
              onPress={() => router.push('/methodologie/themes/new' as never)}
              style={{ backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8, marginTop: space.sm, alignSelf: 'flex-start' }}
            >
              <AureakText style={{ color: colors.text.dark, fontWeight: '700', fontSize: 13 } as never}>
                → Créer un thème
              </AureakText>
            </Pressable>
          </View>
        )}

        {!loading && !errorMsg && themes.length > 0 && (
          <ThemesTable
            themes={visibleThemes}
            totalThemes={orderedThemes.length}
            groupMap={groupMap}
            themeIdsWithMetaphors={themeIdsWithMetaphors}
            themeIdsWithVideo={themeIdsWithVideo}
            onPress={(themeKey) => router.push(`/methodologie/themes/${themeKey}` as never)}
          />
        )}

      </View>

    </ScrollView>

      <PrimaryAction
        label="Nouveau thème"
        onPress={() => router.push('/methodologie/themes/new' as never)}
      />
    </View>
  )
}

// ── Sous-composant table thèmes ──────────────────────────────────────────────

type ThemesTableProps = {
  themes                : Theme[]
  totalThemes           : number
  groupMap              : Record<string, string>
  themeIdsWithMetaphors : Set<string>
  themeIdsWithVideo     : Set<string>
  onPress               : (themeKey: string) => void
}

function ThemesTable({ themes, totalThemes, groupMap, themeIdsWithMetaphors, themeIdsWithVideo, onPress }: ThemesTableProps) {
  const { page, setPage, pageCount, paginated } = usePagination(themes, PAGE_SIZE)
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  if (themes.length === 0) {
    return (
      <View style={st.tableWrapper}>
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {totalThemes === 0 ? 'Aucun thème configuré.' : 'Aucun thème pour ce filtre.'}
          </AureakText>
        </View>
      </View>
    )
  }

  // Story 103.9.d — rendu mobile en stack de cards
  if (isMobile) {
    return (
      <View style={st.tableWrapper}>
        {paginated.map((theme) => (
          <Pressable
            key={theme.id}
            onPress={() => onPress(theme.themeKey)}
            style={({ pressed }) => [st.mobileCard, pressed && { opacity: 0.8 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AureakText style={st.titleText} numberOfLines={2}>{theme.name}</AureakText>
              <AureakText style={st.numText}>
                {theme.orderIndex != null ? `#${theme.orderIndex} · ` : ''}{groupMap[theme.groupId ?? ''] ?? '—'}
              </AureakText>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={[st.statusDot, { backgroundColor: themeIdsWithMetaphors.has(theme.id) ? colors.status.present : colors.border.light }]} />
              <View style={[st.statusDot, { backgroundColor: themeIdsWithVideo.has(theme.id) ? colors.status.present : colors.border.light }]} />
              <View style={[st.statusDot, { backgroundColor: theme.isCurrent ? colors.status.present : colors.border.light }]} />
            </View>
          </Pressable>
        ))}
        <MetPagination
          page={page}
          pageCount={pageCount}
          total={themes.length}
          pageSize={PAGE_SIZE}
          itemLabelPlural="thèmes"
          onPageChange={setPage}
        />
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
      <View style={st.tableHeader}>
        <View style={{ width: COL_WIDTHS.num }}>
          <AureakText style={st.thText}>NUMÉRO</AureakText>
        </View>
        <View style={{ flex: COL_WIDTHS.title }}>
          <AureakText style={st.thText}>TITRE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.bloc }}>
          <AureakText style={st.thText}>BLOC</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.metaphore }}>
          <AureakText style={st.thText}>MÉTAPHORE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.video }}>
          <AureakText style={st.thText}>VIDÉO</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.status }}>
          <AureakText style={st.thText}>STATUT</AureakText>
        </View>
      </View>

      {paginated.map((theme, idx) => {
        const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        return (
          <Pressable
            key={theme.id}
            onPress={() => onPress(theme.themeKey)}
            style={({ pressed }) => [
              st.tableRow,
              { backgroundColor: rowBg },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ width: COL_WIDTHS.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {theme.orderIndex != null ? theme.orderIndex : '—'}
              </AureakText>
            </View>

            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {theme.name}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.bloc, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>
                {groupMap[theme.groupId ?? ''] ?? '—'}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.metaphore, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: themeIdsWithMetaphors.has(theme.id) ? colors.status.present : colors.border.light,
              }]} />
            </View>

            <View style={{ width: COL_WIDTHS.video, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: themeIdsWithVideo.has(theme.id) ? colors.status.present : colors.border.light,
              }]} />
            </View>

            <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: theme.isCurrent ? colors.status.present : colors.border.light,
              }]} />
            </View>
          </Pressable>
        )
      })}

      <MetPagination
        page={page}
        pageCount={pageCount}
        total={themes.length}
        pageSize={PAGE_SIZE}
        itemLabelPlural="thèmes"
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
  // Story 103.9.d — card mobile
  mobileCard: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : space.md,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm + 2,
    backgroundColor  : colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
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

  numText  : { fontSize: 13, fontWeight: '700', color: colors.accent.gold },
  titleText: { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  dashText : { fontSize: 12, color: colors.text.muted },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
})
