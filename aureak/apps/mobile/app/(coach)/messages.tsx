// Story 9.5 — Fil messages Admin → Coach
import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { listAdminMessages } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

type AdminMessage = {
  id          : string
  message     : string
  urgency     : 'routine' | 'urgent'
  sent_at     : string
  sender_id   : string
}

export default function MessagesScreen() {
  const user                      = useAuthStore(s => s.user)
  const [messages, setMessages]   = useState<AdminMessage[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const result = await listAdminMessages(user?.id)
    setMessages((result.data as AdminMessage[]) ?? [])
    if (isRefresh) setRefreshing(false)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages de l&apos;Admin</Text>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        onRefresh={() => load(true)}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun message reçu.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.urgency === 'urgent' && styles.cardUrgent]}>
            <View style={styles.cardHeader}>
              <View style={item.urgency === 'urgent' ? styles.badgeUrgent : styles.badgeRoutine}>
                <Text style={item.urgency === 'urgent' ? styles.badgeTextUrgent : styles.badgeTextRoutine}>
                  {item.urgency === 'urgent' ? '🚨 Urgent' : 'Routine'}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(item.sent_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
        contentContainerStyle={messages.length === 0 ? styles.listEmpty : styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.background.primary },
  center       : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  title        : { fontSize: 24, fontWeight: '700', color: colors.text.primary, padding: 20, paddingBottom: 12 },
  list         : { padding: 16 },
  listEmpty    : { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText    : { color: colors.text.secondary, fontSize: 15 },
  card         : { backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardUrgent   : { borderLeftWidth: 4, borderLeftColor: colors.status.absent },
  cardHeader   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeRoutine : { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.accent.zinc },
  badgeUrgent  : { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.15)' },
  badgeTextRoutine: { fontSize: 12, color: colors.text.secondary },
  badgeTextUrgent : { fontSize: 12, color: colors.status.absent },
  dateText     : { fontSize: 12, color: colors.text.secondary },
  messageText  : { fontSize: 15, color: colors.text.secondary, lineHeight: 22 },
})
