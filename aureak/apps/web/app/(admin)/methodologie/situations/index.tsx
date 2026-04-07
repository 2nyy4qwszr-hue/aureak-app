// Story 58-1 — Grille SituationCard style Hearthstone
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySituations } from '@aureak/api-client'
import { AureakButton, AureakText, SituationCard } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { MethodologySituation, MethodologyMethod } from '@aureak/types'
import { DIFFICULTY_LABELS } from '@aureak/types'

// Méthodes disponibles pour les filtres
const METHODS: MethodologyMethod[] = [
  'Goal and Player',
  'Technique',
  'Situationnel',
  'Décisionnel',
  'Intégration',
  'Perfectionnement',
]

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: colors.light.primary },
  content        : { padding: space.xl, gap: space.lg },
  header         : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterRow      : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip     : { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  filterChipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  grid           : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  emptyText      : { color: colors.text.muted, paddingVertical: space.lg },
})

export default function SituationsPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const [situations,       setSituations]       = useState<MethodologySituation[]>([])
  const [loading,          setLoading]          = useState(true)
  const [selectedMethod,   setSelectedMethod]   = useState<MethodologyMethod | null>(null)
  // Story 58-6 — Filtre difficulté multi-select (client-side)
  const [filterDifficulty, setFilterDifficulty] = useState<number[]>([])

  // Grille responsive : 3 cols >900px, 2 cols sinon
  const numCols = width > 900 ? 3 : 2

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologySituations({ activeOnly: false })
      setSituations(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production')
        console.error('[SituationsPage] loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const toggleDifficultyFilter = (level: number) => {
    setFilterDifficulty(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  const filtered = situations.filter(s => {
    const methodMatch     = !selectedMethod || s.method === selectedMethod
    const difficultyMatch = filterDifficulty.length === 0 || filterDifficulty.includes(s.difficultyLevel ?? 3)
    return methodMatch && difficultyMatch
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête */}
      <View style={styles.header}>
        <AureakText variant="h2">Situations</AureakText>
        <AureakButton
          label="Nouvelle situation"
          onPress={() => router.push('/methodologie/situations/new' as never)}
          variant="primary"
        />
      </View>

      {/* Filtres par méthode */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, !selectedMethod && styles.filterChipActive]}
          onPress={() => setSelectedMethod(null)}
        >
          <AureakText style={{ fontSize: 12, color: !selectedMethod ? colors.text.dark : colors.text.muted, fontWeight: !selectedMethod ? '700' : '400' } as never}>
            Toutes
          </AureakText>
        </Pressable>
        {METHODS.map(m => (
          <Pressable
            key={m}
            style={[styles.filterChip, selectedMethod === m && styles.filterChipActive]}
            onPress={() => setSelectedMethod(m)}
          >
            <AureakText style={{ fontSize: 12, color: selectedMethod === m ? colors.text.dark : colors.text.muted, fontWeight: selectedMethod === m ? '700' : '400' } as never}>
              {m}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* Story 58-6 — Filtres par difficulté (multi-select, client-side) */}
      <View style={styles.filterRow}>
        <AureakText variant="caption" style={{ color: colors.text.muted, alignSelf: 'center', marginRight: space.xs }}>
          Difficulté :
        </AureakText>
        {[1, 2, 3, 4, 5].map(level => {
          const isActive = filterDifficulty.includes(level)
          return (
            <Pressable
              key={level}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => toggleDifficultyFilter(level)}
            >
              <AureakText style={{ fontSize: 12, color: isActive ? colors.text.dark : colors.text.muted, fontWeight: isActive ? '700' : '400' } as never}>
                {'★'.repeat(level)} {DIFFICULTY_LABELS[level]}
              </AureakText>
            </Pressable>
          )
        })}
        {filterDifficulty.length > 0 && (
          <Pressable style={styles.filterChip} onPress={() => setFilterDifficulty([])}>
            <AureakText style={{ fontSize: 12, color: colors.text.muted } as never}>✕ Réinitialiser</AureakText>
          </Pressable>
        )}
      </View>

      {/* État chargement */}
      {loading && (
        <AureakText variant="body" style={styles.emptyText}>Chargement...</AureakText>
      )}

      {/* Grille de cards */}
      {!loading && filtered.length > 0 && (
        <View style={[styles.grid, { gap: space.md }]}>
          {filtered.map(situation => (
            <View
              key={situation.id}
              style={{ width: `${Math.floor(100 / numCols) - 2}%` as unknown as number }}
            >
              <SituationCard
                situation={situation}
                difficulty={situation.difficultyLevel ?? 3}
                onPress={() => router.push(`/methodologie/situations/${situation.id}` as never)}
                draggable
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type       : 'situation',
                    situationId: situation.id,
                  }))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
              />
            </View>
          ))}
        </View>
      )}

      {/* État vide */}
      {!loading && filtered.length === 0 && selectedMethod && (
        <AureakText variant="body" style={styles.emptyText}>
          {`Aucune situation pour la méthode "${selectedMethod}".`}
        </AureakText>
      )}
      {!loading && situations.length === 0 && (
        <View>
          <AureakText variant="body" style={styles.emptyText}>
            Aucune situation configurée.
          </AureakText>
          <Pressable
            onPress={() => router.push('/methodologie/situations/new' as never)}
            style={{ backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8, marginTop: space.sm, alignSelf: 'flex-start' }}
          >
            <AureakText style={{ color: colors.text.dark, fontWeight: '700', fontSize: 13 } as never}>
              → Créer la première situation
            </AureakText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}
