'use client'
import React, { useContext, useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, type TextStyle, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listSituations, listThemeGroups } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, shadows, radius } from '@aureak/theme'
import type { Situation, ThemeGroup } from '@aureak/types'
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

export default function SituationsPage() {
  const router = useRouter()
  const counts = useContext(MethodologieCountsContext)
  const { width } = useWindowDimensions()
  const isMobile = width <= 640

  const [situations,     setSituations]     = useState<Situation[]>([])
  const [groups,         setGroups]         = useState<ThemeGroup[]>([])
  const [loading,        setLoading]        = useState(true)
  const [selectedBlocId, setSelectedBlocId] = useState<string | null>(null)
  const [blocDropOpen,   setBlocDropOpen]   = useState(false)
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

  const isGlobal = selectedBlocId === null
  const selectedGroup = groups.find(g => g.id === selectedBlocId)

  const visibleSituations = selectedBlocId
    ? situations.filter(s => s.blocId === selectedBlocId)
    : situations

  return (
    <ScrollView style={st.container} contentContainerStyle={[st.content, isMobile && { padding: 16 }]}>

      {/* Story 97.3 — Header simplifié */}
      <AdminPageHeader title="Situations" />

      {/* Story 93.5 — NavBar 5 onglets + counts via Context */}
      <MethodologieHeader
        newLabel="+ Nouvelle situation"
        newHref="/methodologie/situations/new"
        counts={counts ?? undefined}
      />

      <View style={st.bodyWrap}>

      {/* ── StatCards — 1 card par ThemeGroup ── */}
      <View style={st.statCardsRow}>
        {groups.map(g => {
          const count = situations.filter(s => s.blocId === g.id).length
          return (
            <Pressable
              key={g.id}
              style={[st.statCard, selectedBlocId === g.id && st.statCardActive] as never}
              onPress={() => setSelectedBlocId(g.id === selectedBlocId ? null : g.id)}
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
            onPress={() => { setSelectedBlocId(null); setBlocDropOpen(false) }}
          >
            <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
          </Pressable>

          <View style={st.dropdownWrapper}>
            <Pressable
              style={!isGlobal ? st.pillActive : st.pillInactive}
              onPress={() => setBlocDropOpen(o => !o)}
            >
              <AureakText style={!isGlobal ? st.pillTextActive : st.pillTextInactive}>
                {isGlobal ? 'BLOC ▾' : `${selectedGroup?.name ?? 'BLOC'} ▾`}
              </AureakText>
            </Pressable>

            {blocDropOpen && (
              <View style={st.blocDropdown}>
                {groups.map(g => (
                  <Pressable
                    key={g.id}
                    style={[st.blocDropdownItem, selectedBlocId === g.id && st.blocDropdownItemActive]}
                    onPress={() => { setSelectedBlocId(g.id); setBlocDropOpen(false) }}
                  >
                    <AureakText style={{ fontSize: 12, fontWeight: selectedBlocId === g.id ? '700' : '400', color: selectedBlocId === g.id ? colors.text.dark : colors.text.muted }}>
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

      {!loading && !errorMsg && situations.length === 0 && (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>
          Aucune situation configurée.
        </AureakText>
      )}

      {!loading && situations.length > 0 && visibleSituations.length === 0 && (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>
          Aucune situation dans ce bloc.
        </AureakText>
      )}

      {!loading && visibleSituations.length > 0 && (
        <View style={st.grid}>
          {visibleSituations.map(sit => (
            <Pressable
              key={sit.id}
              onPress={() => router.push(`/methodologie/situations/${sit.situationKey}` as never)}
              style={({ pressed }) => [st.situationCard, pressed && { opacity: 0.85 }]}
            >
              <AureakText style={st.situationName} numberOfLines={2}>{sit.name}</AureakText>
              <AureakText style={st.situationKey}>{sit.situationKey}</AureakText>
            </Pressable>
          ))}
        </View>
      )}
      </View>
    </ScrollView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { paddingBottom: space.xxl, gap: space.md },
  bodyWrap   : { paddingHorizontal: space.lg, gap: space.md },

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

  // Dropdown
  dropdownWrapper: {
    position: 'relative',
    zIndex  : 9999,
  },
  blocDropdown: {
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
  blocDropdownItem      : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  blocDropdownItemActive: { backgroundColor: colors.accent.gold + '18' },

  // Grid + SituationCard
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  situationCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    minWidth       : 220,
    flexGrow       : 1,
    flexBasis      : 240,
    maxWidth       : 320,
    gap            : 6,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  situationName: {
    fontSize  : 14,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  situationKey: {
    fontSize: 11,
    color   : colors.text.muted,
  },
})
