// Story 8.3 — Écran principal enfant : points, streak, badges, thèmes acquis
import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '@aureak/api-client'
import { getPlayerProgress } from '@aureak/api-client'
import { Text } from '@aureak/ui'
import type { PlayerProgress, LearningAttempt } from '@aureak/types'
import { colors } from '@aureak/theme'

export default function ChildHomeScreen() {
  const [progress, setProgress] = useState<PlayerProgress | null>(null)
  const [acquiredThemes, setAcquired] = useState<(LearningAttempt & { themes?: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id) return

      const [progressResult, attemptsResult] = await Promise.all([
        getPlayerProgress(user.user.id),
        supabase
          .from('learning_attempts')
          .select('id, theme_id, mastery_status, ended_at, themes(name)')
          .eq('child_id', user.user.id)
          .eq('mastery_status', 'acquired')
          .order('ended_at', { ascending: false }),
      ])

      setProgress(progressResult.data)
      setAcquired((attemptsResult.data ?? []) as unknown as (LearningAttempt & { themes?: { name: string } | null })[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <ActivityIndicator style={styles.loader} color={colors.accent.gold} />

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon Espace</Text>

      {/* ─── Points & Streak ──────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progress?.totalPoints ?? 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {progress?.currentStreak ?? 0}</Text>
          <Text style={styles.statLabel}>Jours de suite</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progress?.themesAcquiredCount ?? 0}</Text>
          <Text style={styles.statLabel}>Thèmes acquis</Text>
        </View>
      </View>

      {/* ─── Thèmes acquis ───────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Thèmes maîtrisés</Text>
      {acquiredThemes.length === 0 ? (
        <Text style={styles.emptyText}>Pas encore de thème acquis — continuons !</Text>
      ) : (
        acquiredThemes.map(att => (
          <View key={att.id} style={styles.themeRow}>
            <Text style={styles.themeCheck}>✅</Text>
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{(att.themes as { name?: string } | null)?.name ?? '—'}</Text>
              <Text style={styles.themeDate}>
                {att.endedAt ? new Date(att.endedAt).toLocaleDateString('fr-FR') : ''}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* ─── Badges (skeleton — Epic 12) ────────────────────────────── */}
      <Text style={styles.sectionTitle}>Badges</Text>
      <Text style={styles.emptyText}>Tes badges apparaîtront ici bientôt…</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary, padding: 16 },
  loader      : { flex: 1 },
  title       : { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  statsRow    : { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard    : { flex: 1, backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue   : { color: colors.accent.gold, fontSize: 22, fontWeight: '900' },
  statLabel   : { color: colors.text.secondary, fontSize: 11, marginTop: 4 },
  sectionTitle: { color: colors.accent.gold, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyText   : { color: colors.text.secondary, fontSize: 14, fontStyle: 'italic' },
  themeRow    : { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.background.surface },
  themeCheck  : { fontSize: 20, marginRight: 12 },
  themeInfo   : { flex: 1 },
  themeName   : { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  themeDate   : { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
})
