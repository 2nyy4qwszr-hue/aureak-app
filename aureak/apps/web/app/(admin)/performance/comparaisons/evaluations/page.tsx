'use client'
// Story 55-2 — Page comparaison radar 2 joueurs
// Sélecteur joueur A / joueur B → ComparisonRadarChart superposé
// Story 98.3 — Migrée /evaluations/comparison → /performance/comparaisons/evaluations
//              AdminPageHeader v2 ("Comparaison des évaluations")

import { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listChildDirectory, getAverageEvaluationsByPlayer } from '@aureak/api-client'
import { AureakText, ComparisonRadarChart } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { ChildDirectoryEntry } from '@aureak/types'
import type { RadarPlayer } from '@aureak/ui'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

const AXES = ['Technique', 'Placement', 'Relance', 'Agilité', 'Mental', 'Communication']

const PLAYER_A_COLOR = colors.accent.gold
const PLAYER_B_COLOR = colors.status.info

type PlayerSlot = 'A' | 'B'

export default function EvaluationsComparisonPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width <= 640

  // Liste de joueurs disponibles
  const [joueurs, setJoueurs]     = useState<ChildDirectoryEntry[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // Sélection joueur A / B
  const [playerA, setPlayerA]     = useState<ChildDirectoryEntry | null>(null)
  const [playerB, setPlayerB]     = useState<ChildDirectoryEntry | null>(null)

  // Scores moyens par joueur
  const [scoresA, setScoresA]     = useState<Record<string, number>>({})
  const [scoresB, setScoresB]     = useState<Record<string, number>>({})
  const [loadingA, setLoadingA]   = useState(false)
  const [loadingB, setLoadingB]   = useState(false)

  // Recherche joueur
  const [searchA, setSearchA]     = useState('')
  const [searchB, setSearchB]     = useState('')
  const [pickerOpen, setPickerOpen] = useState<PlayerSlot | null>(null)

  // ── Chargement liste joueurs ──────────────────────────────────────────────

  useEffect(() => {
    setLoadingList(true)
    listChildDirectory({ actif: true, pageSize: 200 })
      .then(({ data }) => setJoueurs(data))
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ComparisonPage] listChildDirectory error:', err)
      })
      .finally(() => setLoadingList(false))
  }, [])

  // ── Chargement scores joueur A ────────────────────────────────────────────

  useEffect(() => {
    if (!playerA) { setScoresA({}); return }
    setLoadingA(true)
    getAverageEvaluationsByPlayer(playerA.id, 5)
      .then(({ data }) => setScoresA(data?.axes ?? {}))
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ComparisonPage] scoresA error:', err)
      })
      .finally(() => setLoadingA(false))
  }, [playerA])

  // ── Chargement scores joueur B ────────────────────────────────────────────

  useEffect(() => {
    if (!playerB) { setScoresB({}); return }
    setLoadingB(true)
    getAverageEvaluationsByPlayer(playerB.id, 5)
      .then(({ data }) => setScoresB(data?.axes ?? {}))
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ComparisonPage] scoresB error:', err)
      })
      .finally(() => setLoadingB(false))
  }, [playerB])

  // ── Filtres recherche ─────────────────────────────────────────────────────

  const filteredA = useMemo(
    () => joueurs.filter(j => j.displayName.toLowerCase().includes(searchA.toLowerCase())).slice(0, 8),
    [joueurs, searchA]
  )
  const filteredB = useMemo(
    () => joueurs.filter(j => j.displayName.toLowerCase().includes(searchB.toLowerCase())).slice(0, 8),
    [joueurs, searchB]
  )

  // ── Données radar ─────────────────────────────────────────────────────────

  const radarPlayers: RadarPlayer[] = useMemo(() => {
    const result: RadarPlayer[] = []
    if (playerA) result.push({ name: playerA.displayName, scores: scoresA })
    if (playerB) result.push({ name: playerB.displayName, scores: scoresB })
    return result
  }, [playerA, playerB, scoresA, scoresB])

  // ── Sélecteur joueur ──────────────────────────────────────────────────────

  function PlayerPicker({
    slot,
    selected,
    onSelect,
    search,
    setSearch,
    filtered,
    color,
  }: {
    slot     : PlayerSlot
    selected : ChildDirectoryEntry | null
    onSelect : (j: ChildDirectoryEntry) => void
    search   : string
    setSearch: (v: string) => void
    filtered : ChildDirectoryEntry[]
    color    : string
  }) {
    const isOpen = pickerOpen === slot
    return (
      <View style={picker.container}>
        <View style={[picker.label, { borderLeftColor: color }]}>
          <AureakText style={picker.slotLabel as never}>Joueur {slot}</AureakText>
        </View>

        {/* Bouton sélectionné ou placeholder */}
        <Pressable
          style={[picker.selector, { borderColor: color + '60' }]}
          onPress={() => setPickerOpen(isOpen ? null : slot)}
        >
          <AureakText style={[picker.selectorText, !selected && picker.placeholder] as never}>
            {selected ? selected.displayName : 'Choisir un joueur…'}
          </AureakText>
          <AureakText style={{ color: color, fontSize: 12 }}>▼</AureakText>
        </Pressable>

        {/* Dropdown recherche */}
        {isOpen && (
          <View style={picker.dropdown}>
            <TextInput
              style={picker.searchInput as never}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher…"
              placeholderTextColor={colors.text.muted}
              autoFocus
            />
            {filtered.map(j => (
              <Pressable
                key={j.id}
                style={picker.option}
                onPress={() => {
                  onSelect(j)
                  setSearch('')
                  setPickerOpen(null)
                }}
              >
                <AureakText style={picker.optionText as never}>{j.displayName}</AureakText>
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <AureakText style={picker.noResult as never}>Aucun joueur trouvé</AureakText>
            )}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.page}>
      {/* Story 98.3 — AdminPageHeader v2 */}
      <AdminPageHeader title="Comparaison des évaluations" />

      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: space.md }]}>
      {/* ── Sélecteurs — stack en mobile ── */}
      <View style={[styles.selectors, isMobile && { flexDirection: 'column', gap: space.md }]}>
        <PlayerPicker
          slot="A" selected={playerA} onSelect={setPlayerA}
          search={searchA} setSearch={setSearchA}
          filtered={filteredA} color={PLAYER_A_COLOR}
        />
        <PlayerPicker
          slot="B" selected={playerB} onSelect={setPlayerB}
          search={searchB} setSearch={setSearchB}
          filtered={filteredB} color={PLAYER_B_COLOR}
        />
      </View>

      {/* ── Radar chart ── */}
      {loadingList ? (
        <AureakText style={{ color: colors.text.muted }}>Chargement des joueurs…</AureakText>
      ) : radarPlayers.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText style={styles.emptyText as never}>
            Sélectionnez au moins un joueur pour afficher le radar.
          </AureakText>
        </View>
      ) : (
        <View style={styles.radarContainer}>
          {(loadingA || loadingB) && (
            <AureakText style={{ color: colors.text.muted, marginBottom: space.sm }}>
              Calcul des moyennes…
            </AureakText>
          )}
          <ComparisonRadarChart
            players={radarPlayers}
            axes={AXES}
            size={340}
          />
        </View>
      )}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.lg },
  header       : { gap: space.xs },
  backBtn      : { marginBottom: space.xs },
  backText     : { color: colors.text.muted, fontSize: 13 },
  selectors    : { flexDirection: 'row' as never, gap: space.xl, flexWrap: 'wrap' as never },
  radarContainer: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.xl,
    alignItems     : 'center' as never,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
  } as never,
  emptyState   : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.xl,
    alignItems     : 'center' as never,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyText    : { color: colors.text.muted, fontSize: 14 },
})

const picker = StyleSheet.create({
  container  : { flex: 1, minWidth: 240, gap: space.xs, position: 'relative' as never },
  label      : { borderLeftWidth: 3, paddingLeft: space.xs },
  slotLabel  : { fontSize: 11, fontWeight: '700' as never, color: colors.text.dark, textTransform: 'uppercase' as never, letterSpacing: 1 },
  selector   : {
    backgroundColor: colors.light.surface,
    borderWidth    : 1.5,
    borderRadius   : radius.button,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    flexDirection    : 'row' as never,
    justifyContent   : 'space-between' as never,
    alignItems       : 'center' as never,
  },
  selectorText: { fontSize: 14, color: colors.text.dark, flex: 1 },
  placeholder : { color: colors.text.muted },
  dropdown   : {
    position       : 'absolute' as never,
    top            : 72,
    left           : 0,
    right          : 0,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.button,
    zIndex         : 50,
    boxShadow      : shadows.md,
    overflow       : 'hidden' as never,
  } as never,
  searchInput: {
    padding          : space.sm,
    borderBottomWidth: 1,
    borderColor      : colors.border.light,
    fontSize         : 13,
    color            : colors.text.dark,
  },
  option     : { padding: space.sm, borderBottomWidth: 1, borderColor: colors.border.divider },
  optionText : { fontSize: 13, color: colors.text.dark },
  noResult   : { padding: space.sm, color: colors.text.muted, fontSize: 12 },
})
