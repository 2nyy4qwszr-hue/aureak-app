'use client'
import React, { useContext, useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemes, listThemeGroups, supabase } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, shadows, radius } from '@aureak/theme'
import type { Theme, ThemeGroup } from '@aureak/types'
import BlocsManagerModal from '../_components/BlocsManagerModal'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { MethodologieHeader } from '../../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieCountsContext } from '../_layout'

const BLOC_PICTOS: Record<string, string> = {
  'tir au but'         : '🎯',
  '1 contre 1'         : '⚔️',
  'centre'             : '📐',
  'balle en profondeur': '🚀',
  'relance'            : '🔄',
  'phase arrêtée'      : '⛔',
  'communication'      : '📢',
}

function getBlocPicto(name: string): string {
  return BLOC_PICTOS[name.toLowerCase()] ?? '📋'
}

const COL_WIDTHS = { num: 52, title: 1, bloc: 120, metaphore: 70, video: 60, status: 60 }

export default function ThemesPage() {
  const router = useRouter()
  const counts = useContext(MethodologieCountsContext)

  const [themes,                 setThemes]                 = useState<Theme[]>([])
  const [orderedThemes,          setOrderedThemes]          = useState<Theme[]>([])
  const [groups,                 setGroups]                 = useState<ThemeGroup[]>([])
  const [loading,                setLoading]                = useState(true)
  const [selectedGroupId,        setSelectedGroupId]        = useState<string | null>(null)
  const [modalVisible,           setModalVisible]           = useState(false)
  const [themeDropOpen,          setThemeDropOpen]          = useState(false)
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

  useEffect(() => {
    const sorted = [...themes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    setOrderedThemes(sorted)
  }, [themes])

  const visibleThemes = selectedGroupId
    ? orderedThemes.filter(t => t.groupId === selectedGroupId)
    : orderedThemes

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const isGlobal = selectedGroupId === null

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* Story 97.3 — Header simplifié */}
      <AdminPageHeader title="Thèmes" />

      {/* Story 93.5 — NavBar 5 onglets + counts via Context */}
      <MethodologieHeader
        newLabel="+ Nouveau thème"
        newHref="/methodologie/themes/new"
        counts={counts ?? undefined}
      />

      <View style={st.bodyWrap}>

      {/* Bouton utilitaire spécifique themes : Gérer les blocs (conserve derrière le header) */}
      <View style={st.actionRow}>
        <Pressable style={st.manageBtn} onPress={() => setModalVisible(true)}>
          <AureakText style={st.manageBtnLabel}>⚙ Gérer les blocs</AureakText>
        </Pressable>
      </View>

      {/* ── StatCards — 1 card par ThemeGroup ── */}
      <View style={st.statCardsRow}>
        {groups.map(g => {
          const count = orderedThemes.filter(t => t.groupId === g.id).length
          return (
            <Pressable
              key={g.id}
              style={[st.statCard, selectedGroupId === g.id && st.statCardActive] as never}
              onPress={() => setSelectedGroupId(g.id === selectedGroupId ? null : g.id)}
            >
              <AureakText style={st.statCardPicto}>{getBlocPicto(g.name)}</AureakText>
              <AureakText style={st.statCardLabel}>{g.name}</AureakText>
              <AureakText style={st.statCardValue}>{count}</AureakText>
            </Pressable>
          )
        })}
      </View>

      {/* ── FiltresRow — gauche ── */}
      <View style={st.filtresRow}>
        <View style={st.filtresLeft}>
          <Pressable
            style={isGlobal ? st.pillActive : st.pillInactive}
            onPress={() => { setSelectedGroupId(null); setThemeDropOpen(false) }}
          >
            <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
          </Pressable>

          <View style={st.dropdownWrapper}>
            <Pressable
              style={!isGlobal ? st.pillActive : st.pillInactive}
              onPress={() => setThemeDropOpen(o => !o)}
            >
              <AureakText style={!isGlobal ? st.pillTextActive : st.pillTextInactive}>
                {isGlobal ? 'BLOC ▾' : `${selectedGroup?.name ?? 'BLOC'} ▾`}
              </AureakText>
            </Pressable>

            {themeDropOpen && (
              <View style={st.themeDropdown}>
                {groups.map(g => (
                  <Pressable
                    key={g.id}
                    style={[st.themeDropdownItem, selectedGroupId === g.id && st.themeDropdownItemActive]}
                    onPress={() => { setSelectedGroupId(g.id); setThemeDropOpen(false) }}
                  >
                    <AureakText style={{ fontSize: 12, fontWeight: selectedGroupId === g.id ? '700' : '400', color: selectedGroupId === g.id ? colors.text.dark : colors.text.muted }}>
                      {getBlocPicto(g.name)} {g.name}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Contenu ── */}
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

      {!loading && themes.length > 0 && visibleThemes.length === 0 && (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>
          Aucun thème dans ce bloc.
        </AureakText>
      )}

      {!loading && visibleThemes.length > 0 && (
        <View style={st.tableWrapper}>
          {/* Header */}
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

          {/* Rows */}
          {visibleThemes.map((theme, idx) => {
            const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
            return (
              <Pressable
                key={theme.id}
                onPress={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
                style={({ pressed }) => [
                  st.tableRow,
                  { backgroundColor: rowBg },
                  pressed && { opacity: 0.8 },
                ]}
              >
                {/* NUMÉRO */}
                <View style={{ width: COL_WIDTHS.num, justifyContent: 'center' }}>
                  <AureakText style={st.numText}>
                    {theme.orderIndex != null ? theme.orderIndex : '—'}
                  </AureakText>
                </View>

                {/* TITRE */}
                <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
                  <AureakText style={st.titleText} numberOfLines={2}>
                    {theme.name}
                  </AureakText>
                </View>

                {/* BLOC */}
                <View style={{ width: COL_WIDTHS.bloc, justifyContent: 'center' }}>
                  <AureakText style={st.dashText}>
                    {groupMap[theme.groupId ?? ''] ?? '—'}
                  </AureakText>
                </View>

                {/* MÉTAPHORE */}
                <View style={{ width: COL_WIDTHS.metaphore, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[st.statusDot, {
                    backgroundColor: themeIdsWithMetaphors.has(theme.id) ? colors.status.present : colors.border.light,
                  }]} />
                </View>

                {/* VIDÉO */}
                <View style={{ width: COL_WIDTHS.video, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[st.statusDot, {
                    backgroundColor: themeIdsWithVideo.has(theme.id) ? colors.status.present : colors.border.light,
                  }]} />
                </View>

                {/* STATUT */}
                <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[st.statusDot, {
                    backgroundColor: theme.isCurrent ? colors.status.present : colors.border.light,
                  }]} />
                </View>
              </Pressable>
            )
          })}
        </View>
      )}

      </View>

      <BlocsManagerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onBlocChanged={() => {
          setLoading(true)
          loadData()
        }}
      />
    </ScrollView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { paddingBottom: space.xxl, gap: space.md },
  bodyWrap   : { paddingHorizontal: space.lg, gap: space.md },
  actionRow  : { flexDirection: 'row', justifyContent: 'flex-end' },
  manageBtn  : { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  manageBtnLabel: { color: colors.text.muted, fontWeight: '600', fontSize: 13 },

  // StatCards — 1 card par ThemeGroup
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
  statCardActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.accent.gold + '10',
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

  // Dropdown wrapper
  dropdownWrapper: {
    position: 'relative',
    zIndex  : 9999,
  },
  themeDropdown: {
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
  themeDropdownItem    : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  themeDropdownItemActive: { backgroundColor: colors.accent.gold + '18' },

  // Table
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
  numText   : { fontSize: 13, fontWeight: '700', color: colors.accent.gold },
  titleText : { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  dashText  : { fontSize: 12, color: colors.text.muted },
  statusDot : { width: 8, height: 8, borderRadius: 4 },
})
