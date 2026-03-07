// Story 8.5 — Rapport quiz coach : résultats par enfant + vue agrégée groupe
import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { getSessionLearningReport } from '@aureak/api-client'
import { Text } from '@aureak/ui'
import { colors } from '@aureak/theme'

type ThemeStat = { name: string; total: number; acquired: number }

export default function SessionReportScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const [attempts, setAttempts]     = useState<unknown[]>([])
  const [themeStats, setThemeStats] = useState<Record<string, ThemeStat>>({})
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    getSessionLearningReport(sessionId).then(({ attempts: a, themeStats: ts }) => {
      setAttempts(a ?? [])
      setThemeStats(ts)
      setLoading(false)
    })
  }, [sessionId])

  if (loading) return <ActivityIndicator style={styles.loader} color={colors.accent.gold} />

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rapport Quiz</Text>

      {/* ─── Vue agrégée groupe ───────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Par thème</Text>
      {Object.entries(themeStats).map(([themeId, stat]) => (
        <View key={themeId} style={styles.themeCard}>
          <Text style={styles.themeName}>{stat.name}</Text>
          <Text style={styles.themeAcquired}>
            {stat.acquired}/{stat.total} acquis (
            {stat.total > 0 ? Math.round(stat.acquired / stat.total * 100) : 0}%)
          </Text>
        </View>
      ))}

      {/* ─── Détail par enfant ────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Par enfant</Text>
      {(attempts as Record<string, unknown>[]).map((a, i) => (
        <View key={String(a.id ?? i)} style={styles.attemptCard}>
          <Text style={styles.masteryStatus}>
            {a.mastery_status === 'acquired' ? '✅ ACQUIS' : '❌ NON ACQUIS'}
          </Text>
          <Text style={styles.detail}>
            {String(a.correct_count ?? 0)}/{String(a.questions_answered ?? 0)} bonnes réponses
            · {String(a.mastery_percent ?? 0)}%
          </Text>
          <Text style={styles.stopReason}>Arrêt : {String(a.stop_reason ?? '—')}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.background.primary, padding: 16 },
  loader       : { flex: 1 },
  title        : { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  sectionTitle : { color: colors.accent.gold, fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  themeCard    : { backgroundColor: colors.background.surface, borderRadius: 8, padding: 12, marginBottom: 8 },
  themeName    : { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  themeAcquired: { color: colors.text.secondary, fontSize: 13, marginTop: 4 },
  attemptCard  : { backgroundColor: colors.background.surface, borderRadius: 8, padding: 12, marginBottom: 8 },
  masteryStatus: { color: colors.text.primary, fontSize: 15, fontWeight: '700' },
  detail       : { color: colors.text.secondary, fontSize: 13, marginTop: 4 },
  stopReason   : { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
})
