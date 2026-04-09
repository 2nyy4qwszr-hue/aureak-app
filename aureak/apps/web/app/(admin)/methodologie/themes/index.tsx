'use client'
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemes, listThemeGroups, updateThemeOrder } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { Theme, ThemeGroup } from '@aureak/types'
import BlocsManagerModal from '../_components/BlocsManagerModal'
import PremiumThemeCard from '../_components/PremiumThemeCard'

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

const NAV_TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',    active: false },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: false },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: true  },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: false },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: false },
]

export default function ThemesPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const gridColumns = width >= 1024 ? 5 : width >= 640 ? 3 : 2

  const [themes,          setThemes]          = useState<Theme[]>([])
  const [orderedThemes,   setOrderedThemes]   = useState<Theme[]>([])
  const [groups,          setGroups]          = useState<ThemeGroup[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [modalVisible,    setModalVisible]    = useState(false)
  const [themeDropOpen,   setThemeDropOpen]   = useState(false)
  const [dragIndex,       setDragIndex]       = useState<number | null>(null)
  const [hoverIndex,      setHoverIndex]      = useState<number | null>(null)
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null)

  const loadData = async () => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const [t, g] = await Promise.all([listThemes(), listThemeGroups()])
      if (t.error || g.error) {
        setErrorMsg('Impossible de charger les thèmes (erreur base de données). Réessayez ou contactez le support.')
        return
      }
      setThemes(t.data)
      setGroups(g.data)
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

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const reordered = [...visibleThemes]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const previousOrdered = orderedThemes
    setOrderedThemes(prev => {
      const next = [...prev]
      reordered.forEach((t, i) => {
        const idx = next.findIndex(x => x.id === t.id)
        if (idx !== -1) next[idx] = { ...t, orderIndex: i }
      })
      return next
    })
    try {
      await Promise.all(
        reordered
          .map((t, i) => ({ t, i }))
          .filter(({ t, i }) => t.orderIndex !== i)
          .map(({ t, i }) => updateThemeOrder(t.id, i))
      )
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ThemesIndex] handleDrop reorder error:', err)
      setOrderedThemes(previousOrdered)
    }
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const isGlobal = selectedGroupId === null

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header : titre + nav tabs + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <Pressable style={st.manageBtn} onPress={() => setModalVisible(true)}>
              <AureakText style={st.manageBtnLabel}>⚙ Gérer les blocs</AureakText>
            </Pressable>
            <Pressable style={st.newBtn} onPress={() => router.push('/methodologie/themes/new' as never)}>
              <AureakText style={st.newBtnLabel}>+ Nouveau thème</AureakText>
            </Pressable>
          </View>
        </View>

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
                {isGlobal ? 'THÈME ▾' : `${selectedGroup?.name ?? 'THÈME'} ▾`}
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

      {!loading && visibleThemes.length > 0 && (
        <View style={{
          display            : 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap                : 12,
        } as never}>
          {visibleThemes.map((theme, index) => (
            <div
              key={theme.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e: React.DragEvent) => { e.preventDefault(); setHoverIndex(index) }}
              onDrop={() => { handleDrop(index); setHoverIndex(null) }}
              onDragEnd={() => { setDragIndex(null); setHoverIndex(null) }}
              style={{
                opacity     : dragIndex === index ? 0.5 : 1,
                cursor      : dragIndex !== null ? 'grabbing' : 'grab',
                outline     : hoverIndex === index && dragIndex !== index ? `2px solid ${colors.accent.gold}60` : 'none',
                borderRadius: 12,
                transition  : 'opacity 0.15s',
              }}
            >
              <PremiumThemeCard
                theme={theme}
                groupName={groupMap[theme.groupId ?? ''] ?? null}
                category={theme.category ?? null}
                onPress={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
                onManage={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
              />
            </div>
          ))}
        </View>
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
  content    : { padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // Header block
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
  manageBtn    : { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  manageBtnLabel: { color: colors.text.muted, fontWeight: '600', fontSize: 13 },

  // Nav tabs
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
    fontFamily   : 'Montserrat',
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign    : 'center',
  },
  statCardValue: {
    fontSize  : 28,
    fontFamily: 'Montserrat',
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
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
  },
  pillTextInactive: {
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
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
})
