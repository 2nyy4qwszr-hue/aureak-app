// Story 7.4 — Liste des tickets côté Coach/Admin
import { useEffect, useState } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { listMyTickets, updateTicketStatus } from '@aureak/api-client'
import { Text } from '@aureak/ui'
import type { Ticket, TicketStatus } from '@aureak/api-client'
import { colors } from '@aureak/theme'

const STATUS_COLORS: Record<TicketStatus, string> = {
  open       : colors.accent.gold,
  in_progress: colors.accent.gold,
  resolved   : colors.status.present,
  closed     : colors.text.secondary,
}

export default function CoachTicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await listMyTickets()
    setTickets(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusUpdate = async (ticketId: string, status: TicketStatus) => {
    await updateTicketStatus(ticketId, status)
    await load()
  }

  if (loading) return <ActivityIndicator style={styles.loader} color={colors.accent.gold} />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets parents</Text>
      <FlatList
        data={tickets}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(parent)/tickets/${item.id}` as never)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </Text>
            {item.status === 'open' && (
              <TouchableOpacity
                style={styles.inProgressBtn}
                onPress={() => handleStatusUpdate(item.id, 'in_progress')}
              >
                <Text style={styles.inProgressText}>Prendre en charge</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.background.primary },
  loader       : { flex: 1 },
  title        : { color: colors.text.primary, fontSize: 24, fontWeight: '700', padding: 16 },
  list         : { padding: 16, gap: 12 },
  card         : { backgroundColor: colors.background.surface, borderRadius: 12, padding: 16 },
  cardHeader   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subject      : { color: colors.text.primary, fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge  : { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  statusText   : { color: colors.background.primary, fontSize: 11, fontWeight: '700' },
  category     : { color: colors.text.secondary, fontSize: 12 },
  date         : { color: colors.text.secondary, fontSize: 11, marginTop: 4 },
  inProgressBtn: { backgroundColor: colors.accent.gold, borderRadius: 6, padding: 8, marginTop: 8, alignItems: 'center' },
  inProgressText: { color: colors.text.primary, fontSize: 13, fontWeight: '600' },
})
