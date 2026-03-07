// Story 11.1 — Mon Grade (coach mobile)
import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { listCoachGradeHistory, getCoachCurrentGrade } from '@aureak/api-client'
import type { CoachGrade, CoachGradeLevel } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const GRADES: Record<CoachGradeLevel, { label: string; color: string; emoji: string }> = {
  bronze  : { label: 'Bronze',  color: colors.accent.gold, emoji: '🥉' },
  silver  : { label: 'Argent',  color: colors.accent.ivory, emoji: '🥈' },
  gold    : { label: 'Or',      color: colors.accent.gold, emoji: '🥇' },
  platinum: { label: 'Platine', color: colors.accent.ivory, emoji: '💎' },
}

export default function CoachGradeScreen() {
  const user = useAuthStore(s => s.user)
  const [current, setCurrent] = useState<CoachGrade | null>(null)
  const [history, setHistory] = useState<CoachGrade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [c, h] = await Promise.all([
        getCoachCurrentGrade(user.id),
        listCoachGradeHistory(user.id),
      ])
      setCurrent(c.data)
      setHistory(h.data)
      setLoading(false)
    }
    load()
  }, [user?.id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  const gradeInfo = current ? GRADES[current.grade_level] : null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Grade</Text>

      {/* Grade courant */}
      {gradeInfo && current ? (
        <View style={[styles.currentCard, { borderColor: gradeInfo.color }]}>
          <Text style={styles.gradeEmoji}>{gradeInfo.emoji}</Text>
          <Text style={[styles.gradeLabel, { color: gradeInfo.color }]}>{gradeInfo.label}</Text>
          <Text style={styles.gradeDate}>
            Obtenu le {new Date(current.awarded_at).toLocaleDateString('fr-FR')}
          </Text>
          {current.notes && <Text style={styles.gradeNotes}>{current.notes}</Text>}
        </View>
      ) : (
        <View style={styles.noGradeCard}>
          <Text style={styles.noGradeText}>Aucun grade attribué pour le moment.</Text>
          <Text style={styles.noGradeHint}>Contactez votre admin pour obtenir votre premier grade.</Text>
        </View>
      )}

      {/* Historique */}
      <Text style={styles.historyTitle}>Historique des grades</Text>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun historique de grade.</Text>
        }
        renderItem={({ item }) => {
          const g = GRADES[item.grade_level]
          return (
            <View style={styles.historyRow}>
              <Text style={styles.historyEmoji}>{g.emoji}</Text>
              <View style={styles.historyInfo}>
                <Text style={[styles.historyGrade, { color: g.color }]}>{g.label}</Text>
                {item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
              </View>
              <Text style={styles.historyDate}>
                {new Date(item.awarded_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary },
  center      : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  list        : { padding: 16 },
  title       : { fontSize: 24, fontWeight: '700', color: colors.text.primary, padding: 20, paddingBottom: 12 },
  currentCard : { margin: 16, borderRadius: 16, borderWidth: 2, padding: 24, alignItems: 'center', backgroundColor: colors.background.surface },
  gradeEmoji  : { fontSize: 56, marginBottom: 8 },
  gradeLabel  : { fontSize: 28, fontWeight: '900', marginBottom: 8 },
  gradeDate   : { fontSize: 14, color: colors.text.secondary },
  gradeNotes  : { fontSize: 13, color: colors.text.secondary, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  noGradeCard : { margin: 16, borderRadius: 12, backgroundColor: colors.background.surface, padding: 24, alignItems: 'center' },
  noGradeText : { fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginBottom: 8 },
  noGradeHint : { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },
  historyTitle: { fontSize: 18, fontWeight: '600', color: colors.accent.gold, paddingHorizontal: 16, marginBottom: 4 },
  empty       : { color: colors.text.secondary, fontSize: 14, textAlign: 'center', paddingTop: 20 },
  historyRow  : { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background.surface, borderRadius: 8, padding: 12, marginBottom: 8 },
  historyEmoji: { fontSize: 22 },
  historyInfo : { flex: 1 },
  historyGrade: { fontSize: 14, fontWeight: '700' },
  historyNotes: { fontSize: 12, color: colors.text.secondary },
  historyDate : { fontSize: 12, color: colors.text.secondary },
})
