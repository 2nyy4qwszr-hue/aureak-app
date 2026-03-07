// Story 12.4 — Écran quêtes (enfant)
import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { listActiveQuests } from '@aureak/api-client'
import type { PlayerQuest } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

function daysLeft(periodEnd: string): number {
  const end  = new Date(periodEnd).getTime()
  const now  = Date.now()
  return Math.max(0, Math.ceil((end - now) / 86400000))
}

export default function QuestsScreen() {
  const user = useAuthStore(s => s.user)
  const [quests, setQuests]   = useState<PlayerQuest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listActiveQuests(user.id).then(r => {
      setQuests(r.data)
      setLoading(false)
    })
  }, [user?.id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Quêtes</Text>

      <FlatList
        data={quests}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune quête active cette semaine.</Text>
            <Text style={styles.emptyHint}>Les quêtes sont attribuées chaque lundi.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const def     = item.quest_definitions
          const progress = item.current_value / item.target_value
          const pct     = Math.min(1, progress)
          const remaining = daysLeft(item.period_end)

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.questIcon}>{def?.icon_url ?? '🎯'}</Text>
                <View style={styles.questInfo}>
                  <Text style={styles.questName}>{def?.name ?? 'Quête'}</Text>
                  {def?.description && (
                    <Text style={styles.questDesc}>{def.description}</Text>
                  )}
                </View>
              </View>

              {/* Barre de progression */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct * 100}%` as `${number}%` }]} />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  {item.current_value} / {item.target_value}
                </Text>
                <Text style={styles.timeLeft}>
                  {remaining > 0 ? `${remaining}j restant${remaining > 1 ? 's' : ''}` : 'Expire aujourd\'hui'}
                </Text>
              </View>
            </View>
          )
        }}
        contentContainerStyle={quests.length === 0 ? styles.listEmpty : styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.background.primary },
  center       : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  list         : { padding: 16 },
  listEmpty    : { flex: 1, padding: 16 },
  title        : { fontSize: 24, fontWeight: '700', color: colors.text.primary, padding: 20, paddingBottom: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText    : { fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginBottom: 8 },
  emptyHint    : { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },
  card         : { backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader   : { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'center' },
  questIcon    : { fontSize: 32 },
  questInfo    : { flex: 1 },
  questName    : { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  questDesc    : { fontSize: 13, color: colors.text.secondary },
  progressBar  : { height: 10, backgroundColor: colors.accent.zinc, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill : { height: '100%', backgroundColor: colors.accent.gold, borderRadius: 5 },
  progressRow  : { flexDirection: 'row', justifyContent: 'space-between' },
  progressText : { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
  timeLeft     : { fontSize: 12, color: colors.text.secondary },
})
