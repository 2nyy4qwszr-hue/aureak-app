'use client'
// /methodologie/bibliotheque — Recherche globale bibliothèque entraînements (Story 34.2)

import { useState, useEffect, useCallback } from 'react'
import { View, Pressable, ActivityIndicator, StyleSheet, TextInput, ScrollView } from 'react-native'
import { Text } from 'tamagui'
import { searchTrainings, listProgrammes, linkTrainingToProgramme } from '@aureak/api-client'
import { colors, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import { METHODOLOGY_METHODS, TRAINING_TYPE_LABELS } from '@aureak/types'
import type { MethodologySession, Programme } from '@aureak/types'
import type { MethodologyMethod, TrainingType } from '@aureak/types'

export default function BibliothequeePage() {
  const [query, setQuery]                     = useState('')
  const [filterMethod, setFilterMethod]       = useState<MethodologyMethod | null>(null)
  const [filterType, setFilterType]           = useState<TrainingType | null>(null)
  const [results, setResults]                 = useState<MethodologySession[]>([])
  const [loading, setLoading]                 = useState(false)
  const [programmes, setProgrammes]           = useState<Programme[]>([])
  const [linkTarget, setLinkTarget]           = useState<string | null>(null) // trainingId being linked
  const [linkSaving, setLinkSaving]           = useState<string | null>(null) // programmeId being saved
  const [linkDone, setLinkDone]               = useState<Set<string>>(new Set())

  useEffect(() => {
    listProgrammes().then(setProgrammes).catch(() => {})
  }, [])

  const runSearch = useCallback(async (q: string, m: MethodologyMethod | null, t: TrainingType | null) => {
    setLoading(true)
    try {
      const res = await searchTrainings(q, {
        method      : m ?? undefined,
        trainingType: t ?? undefined,
      })
      setResults(res)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Bibliotheque] search:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => runSearch(query, filterMethod, filterType), 300)
    return () => clearTimeout(t)
  }, [query, filterMethod, filterType, runSearch])

  async function handleLink(trainingId: string, programmeId: string) {
    setLinkSaving(programmeId)
    try {
      await linkTrainingToProgramme(trainingId, programmeId)
      setLinkDone((prev) => new Set(prev).add(`${trainingId}:${programmeId}`))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Bibliotheque] link:', err)
    } finally {
      setLinkSaving(null)
      setLinkTarget(null)
    }
  }

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text fontSize={24} fontWeight="700" color={colors.text.primary}>Bibliothèque</Text>
        <Text fontSize={14} color={colors.text.muted}>{results.length} résultat(s)</Text>
      </View>

      {/* Search bar */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher par titre…"
        style={styles.searchInput}
      />

      {/* Method filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        <Pressable
          onPress={() => setFilterMethod(null)}
          style={[styles.filterChip, filterMethod == null && styles.filterChipActive]}
        >
          <Text fontSize={12} fontWeight="600" color={filterMethod == null ? '#000' : colors.text.muted}>Toutes</Text>
        </Pressable>
        {METHODOLOGY_METHODS.map((m) => {
          const color    = (methodologyMethodColors as Record<string, string>)[m] ?? colors.text.muted
          const isActive = filterMethod === m
          return (
            <Pressable
              key={m}
              onPress={() => setFilterMethod(isActive ? null : m)}
              style={[styles.filterChip, isActive && { backgroundColor: color, borderColor: color }]}
            >
              <Text fontSize={12} fontWeight="600" color={isActive ? '#fff' : colors.text.muted}>{m}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Type filter */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[null, 'decouverte', 'consolidation'].map((t) => {
          const isActive  = filterType === t
          const typeColor = t === 'decouverte' ? '#3B82F6' : t === 'consolidation' ? '#F97316' : null
          return (
            <Pressable
              key={t ?? 'all'}
              onPress={() => setFilterType(t as TrainingType | null)}
              style={[
                styles.filterChip,
                isActive && typeColor ? { backgroundColor: typeColor, borderColor: typeColor } : isActive ? styles.filterChipActive : {},
              ]}
            >
              <Text fontSize={12} fontWeight="600" color={isActive ? '#fff' : colors.text.muted}>
                {t == null ? 'Tous types' : t === 'decouverte' ? '🔵 Découverte' : '🟠 Consolidation'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Results */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 40 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent.gold} />
          </View>
        ) : results.length === 0 ? (
          <View style={[styles.card, styles.center, { paddingVertical: 40 }]}>
            <Text color={colors.text.muted}>Aucun résultat.</Text>
          </View>
        ) : (
          results.map((t) => (
            <SearchResultCard
              key={t.id}
              training={t}
              programmes={programmes}
              linkTarget={linkTarget}
              linkSaving={linkSaving}
              linkDone={linkDone}
              onStartLink={() => setLinkTarget(linkTarget === t.id ? null : t.id)}
              onLink={(progId) => handleLink(t.id, progId)}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

// ── SearchResultCard ──────────────────────────────────────────────────────────

function SearchResultCard({
  training, programmes, linkTarget, linkSaving, linkDone, onStartLink, onLink,
}: {
  training  : MethodologySession
  programmes: Programme[]
  linkTarget: string | null
  linkSaving: string | null
  linkDone  : Set<string>
  onStartLink: () => void
  onLink     : (programmeId: string) => void
}) {
  const methodColor = training.method
    ? ((methodologyMethodColors as Record<string, string>)[training.method] ?? colors.text.muted)
    : colors.text.muted
  const typeColor = training.trainingType === 'decouverte' ? '#3B82F6'
    : training.trainingType === 'consolidation'            ? '#F97316'
    : null
  const isLinking = linkTarget === training.id

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {training.trainingNumber != null ? (
          <View style={[styles.numBadge, { backgroundColor: methodColor + '22', borderColor: methodColor }]}>
            <Text fontWeight="700" fontSize={14} color={methodColor as never}>{training.trainingNumber}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 6 }}>
          <Text fontWeight="700" fontSize={14} color={colors.text.primary}>{training.title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {training.method ? (
              <View style={[styles.chip, { backgroundColor: methodColor + '22', borderColor: methodColor + '44' }]}>
                <Text fontSize={11} fontWeight="600" color={methodColor as never}>{training.method}</Text>
              </View>
            ) : null}
            {training.moduleNumber != null
              ? <View style={styles.chip}><Text fontSize={11} color={colors.text.muted}>M{training.moduleNumber}</Text></View>
              : null}
            {training.blocName
              ? <View style={styles.chip}><Text fontSize={11} color={colors.text.muted}>{training.blocName}</Text></View>
              : null}
            {typeColor && training.trainingType
              ? <View style={[styles.chip, { backgroundColor: typeColor }]}><Text fontSize={11} fontWeight="600" color="#fff">{TRAINING_TYPE_LABELS[training.trainingType]}</Text></View>
              : null}
          </View>
          {training.description
            ? <Text fontSize={12} color={colors.text.subtle} numberOfLines={2}>{training.description}</Text>
            : null}
        </View>
        <Pressable onPress={onStartLink} style={[styles.linkBtn, isLinking && { backgroundColor: colors.accent.gold }]}>
          <Text fontSize={12} fontWeight="600" color={isLinking ? '#000' : colors.text.muted}>🔗</Text>
        </Pressable>
      </View>

      {/* Programme selector */}
      {isLinking && programmes.length > 0 && (
        <View style={[styles.programmeSelector, { marginTop: 12 }]}>
          <Text fontSize={12} fontWeight="600" color={colors.text.muted} style={{ marginBottom: 8 }}>
            Lier à un programme :
          </Text>
          {programmes.map((p) => {
            const key       = `${training.id}:${p.id}`
            const isDone    = linkDone.has(key)
            const isSaving  = linkSaving === p.id
            return (
              <Pressable
                key={p.id}
                onPress={() => !isDone && onLink(p.id)}
                style={[styles.progOption, isDone && { backgroundColor: colors.status.success + '22' }]}
                disabled={isSaving}
              >
                <Text fontSize={13} color={isDone ? colors.status.success as never : colors.text.primary} style={{ flex: 1 }}>
                  {p.name}
                </Text>
                {isSaving
                  ? <ActivityIndicator size="small" color={colors.accent.gold} />
                  : isDone
                    ? <Text fontSize={12} color={colors.status.success as never}>✓ Lié</Text>
                    : <Text fontSize={12} color={colors.accent.gold}>+ Lier</Text>
                }
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page          : { flex: 1, backgroundColor: colors.light.primary, padding: 20 },
  header        : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  center        : { justifyContent: 'center', alignItems: 'center' },
  searchInput   : {
    backgroundColor: colors.light.surface,
    borderWidth    : 1, borderColor: colors.border.light,
    borderRadius   : radius.button,
    padding        : 12, fontSize: 15,
    color          : colors.text.primary,
    marginBottom   : 12,
    boxShadow      : shadows.sm,
  } as never,
  card          : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : 16,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
  } as never,
  numBadge      : { width: 38, height: 38, borderRadius: radius.xs, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  chip          : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs, backgroundColor: colors.light.elevated, borderWidth: 1, borderColor: colors.border.light },
  filterChip    : { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.button, backgroundColor: colors.light.elevated, borderWidth: 1, borderColor: colors.border.light },
  filterChipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  linkBtn       : { padding: 8, borderRadius: radius.xs, backgroundColor: colors.light.elevated, borderWidth: 1, borderColor: colors.border.light },
  programmeSelector: { backgroundColor: colors.light.elevated, borderRadius: radius.button, padding: 12, gap: 6 },
  progOption    : { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.xs, backgroundColor: colors.light.surface },
})
