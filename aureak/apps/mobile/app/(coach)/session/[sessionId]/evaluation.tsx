// Story 6.2 — Écran évaluation rapide coach (< 10s par enfant)
import { useState, useCallback } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { IndicatorToggle } from '@aureak/ui'
import { StarToggle } from '@aureak/ui'
import { Text } from '@aureak/ui'
import { useRecordEvaluation } from '@aureak/business-logic'
import type { EvaluationSignal } from '@aureak/types'
import { colors } from '@aureak/theme'

type ChildEvalState = {
  childId    : string
  name       : string
  status     : 'present' | 'late' | 'trial' | 'absent' | 'injured'
  receptivite: EvaluationSignal
  goutEffort : EvaluationSignal
  attitude   : EvaluationSignal
  topSeance  : 'star' | 'none'
  note       : string
  evaluated  : boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SIGNAL_CYCLE: EvaluationSignal[] = ['none', 'positive', 'attention']


const onHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// TODO: remplacer par un hook qui charge les présences réelles depuis SQLite
const MOCK_DB = null

export default function EvaluationScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const { record } = useRecordEvaluation(sessionId, MOCK_DB as never)

  // En production : charger depuis listMergedPresences (SQLite ou Supabase)
  const [children, setChildren] = useState<ChildEvalState[]>([])

  const evaluatedCount = children.filter(c => c.evaluated).length
  const presentChildren = children.filter(c => ['present', 'late', 'trial'].includes(c.status))
  const absentChildren  = children.filter(c => ['absent', 'injured'].includes(c.status))

  const updateChild = useCallback(
    (childId: string, patch: Partial<ChildEvalState>) => {
      setChildren(prev => prev.map(c => c.childId === childId ? { ...c, ...patch, evaluated: true } : c))
    },
    []
  )

  const handleSave = useCallback(
    async (child: ChildEvalState) => {
      await record({
        childId    : child.childId,
        receptivite: child.receptivite,
        goutEffort : child.goutEffort,
        attitude   : child.attitude,
        topSeance  : child.topSeance,
        note       : child.note || undefined,
      })
    },
    [record]
  )

  const renderCard = ({ item }: { item: ChildEvalState }) => {
    const dimmed = ['absent', 'injured'].includes(item.status)

    return (
      <View style={[styles.card, dimmed && styles.cardDimmed]}>
        <Text style={styles.childName}>{item.name}</Text>

        <View style={styles.row}>
          <IndicatorToggle
            value={item.receptivite}
            label="Réceptivité"
            onHaptic={onHaptic}
            onChange={(v) => updateChild(item.childId, { receptivite: v as EvaluationSignal })}
          />
          <IndicatorToggle
            value={item.goutEffort}
            label="Goût effort"
            onHaptic={onHaptic}
            onChange={(v) => updateChild(item.childId, { goutEffort: v as EvaluationSignal })}
          />
          <IndicatorToggle
            value={item.attitude}
            label="Attitude"
            onHaptic={onHaptic}
            onChange={(v) => updateChild(item.childId, { attitude: v as EvaluationSignal })}
          />
          <StarToggle
            value={item.topSeance === 'star'}
            onHaptic={onHaptic}
            onChange={(v) => updateChild(item.childId, { topSeance: v ? 'star' : 'none' })}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => handleSave(item)}
        >
          <Text style={styles.saveBtnText}>Valider</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Indicateur de progression */}
      <View style={styles.header}>
        <Text style={styles.progress}>
          {evaluatedCount} / {presentChildren.length} évalués
        </Text>
        <TouchableOpacity onPress={() => router.push(`/(coach)/session/${sessionId}/validation`)}>
          <Text style={styles.nextStep}>Valider la séance →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...presentChildren, ...absentChildren]}
        keyExtractor={item => item.childId}
        renderItem={renderCard}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.background.primary },
  header     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  progress   : { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  nextStep   : { color: colors.accent.gold, fontSize: 14 },
  card       : { width: 360, margin: 16, padding: 24, backgroundColor: colors.background.surface, borderRadius: 16 },
  cardDimmed : { opacity: 0.5 },
  childName  : { color: colors.text.primary, fontSize: 20, fontWeight: '700', marginBottom: 24 },
  row        : { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  saveBtn    : { backgroundColor: colors.accent.gold, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: colors.background.primary, fontSize: 16, fontWeight: '700' },
})
