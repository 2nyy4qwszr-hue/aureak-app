'use client'
// /methodologie/programmes — Hub programmes pédagogiques (Story 34.1)

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { listProgrammes } from '@aureak/api-client'
import { colors, shadows, radius } from '@aureak/theme'
import type { Programme } from '@aureak/types'

export default function ProgrammesPage() {
  const router = useRouter()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listProgrammes()
      setProgrammes(data)
      setError(null)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProgrammesPage] load:', err)
      setError('Impossible de charger les programmes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text fontSize={24} fontWeight="700" color={colors.text.primary}>Programmes</Text>
          <Text fontSize={14} color={colors.text.muted}>{programmes.length} programme(s)</Text>
        </View>
        <Pressable
          onPress={() => router.push('/methodologie/programmes/new' as never)}
          style={styles.btnPrimary}
        >
          <Text color="#000" fontWeight="600">+ Nouveau programme</Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.gold} />
        </View>
      )}

      {error && (
        <View style={[styles.card, { borderColor: colors.accent.red }]}>
          <Text color={colors.accent.red}>{error}</Text>
        </View>
      )}

      {!loading && programmes.length === 0 && !error && (
        <View style={[styles.card, styles.emptyState]}>
          <Text fontSize={18} fontWeight="600" color={colors.text.primary}>Aucun programme</Text>
          <Text color={colors.text.muted} style={{ textAlign: 'center', marginTop: 8 }}>
            Créez votre premier programme pour organiser vos entraînements.
          </Text>
          <Pressable
            onPress={() => router.push('/methodologie/programmes/new' as never)}
            style={[styles.btnPrimary, { marginTop: 16 }]}
          >
            <Text color="#000" fontWeight="600">Créer un programme</Text>
          </Pressable>
        </View>
      )}

      {programmes.map((p) => (
        <ProgrammeCard
          key={p.id}
          programme={p}
          onPress={() => router.push(`/methodologie/programmes/${p.id}` as never)}
        />
      ))}
    </View>
  )
}

function ProgrammeCard({ programme, onPress }: { programme: Programme; onPress: () => void }) {
  const isAcademie = programme.programmeType === 'academie'
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, { borderColor: isAcademie ? colors.border.gold : colors.border.light }]}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: isAcademie ? colors.accent.gold : colors.light.elevated }]}>
                <Text fontSize={11} fontWeight="600" color={isAcademie ? '#000' : colors.text.muted}>
                  {isAcademie ? 'Académie' : 'Stage'}
                </Text>
              </View>
              {programme.theme ? <Text fontSize={12} color={colors.text.muted}>• {programme.theme}</Text> : null}
            </View>
            <Text fontSize={16} fontWeight="700" color={colors.text.primary}>{programme.name}</Text>
            {programme.seasonLabel ? (
              <Text fontSize={13} color={colors.text.muted}>Saison {programme.seasonLabel}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text fontSize={22} fontWeight="700" color={isAcademie ? colors.accent.gold : colors.text.primary}>
              {programme.trainingCount}
            </Text>
            <Text fontSize={11} color={colors.text.muted}>entraînement(s)</Text>
          </View>
        </View>
        {programme.description ? (
          <Text fontSize={13} color={colors.text.subtle} numberOfLines={2} style={{ marginTop: 4 }}>
            {programme.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  page      : { flex: 1, backgroundColor: colors.light.primary, padding: 20, gap: 12 },
  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  center    : { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  card      : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : 16,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
  } as never,
  cardRow   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge     : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  btnPrimary: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 16,
    paddingVertical  : 10,
    borderRadius     : radius.button,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
})
