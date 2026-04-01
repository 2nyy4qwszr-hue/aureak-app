// Story 7.4 — Liste tickets support (Admin/Coach)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listAllTickets, updateTicketStatus } from '@aureak/api-client'
import type { Ticket, TicketStatus } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const STATUS_COLORS: Record<TicketStatus, string> = {
  open       : colors.accent.gold,
  in_progress: '#3B82F6',
  resolved   : colors.status.present,
  closed     : colors.text.muted,
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open       : 'Ouvert',
  in_progress: 'En cours',
  resolved   : 'Résolu',
  closed     : 'Fermé',
}

const CATEGORY_LABELS: Record<string, string> = {
  absence   : 'Absence',
  retard    : 'Retard',
  question  : 'Question',
  logistique: 'Logistique',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.md },
  header   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  card     : {
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: space.xs,
  },
  row      : { flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap' },
  badge    : { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  filterRow: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap', marginBottom: space.md },
})

const STATUS_FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Tous' },
  { value: 'open',       label: 'Ouverts' },
  { value: 'in_progress',label: 'En cours' },
  { value: 'resolved',   label: 'Résolus' },
]

export default function TicketsAdminPage() {
  const router   = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<TicketStatus | 'all'>('all')

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const { data } = await listAllTickets(filter !== 'all' ? filter : undefined)
      setTickets(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TicketsAdmin] fetchTickets error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [filter])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Tickets support</AureakText>
      </View>

      {/* Filtres */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[styles.badge, {
              borderColor    : filter === f.value ? colors.accent.gold : colors.border.light,
              backgroundColor: filter === f.value ? colors.accent.gold + '15' : colors.light.surface,
            }]}
          >
            <AureakText variant="caption" style={{ color: filter === f.value ? colors.accent.gold : colors.text.muted }}>
              {f.label}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {loading && <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>}

      {!loading && tickets.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' }}>Aucun ticket.</AureakText>
      )}

      {tickets.map((ticket) => (
        <Pressable
          key={ticket.id}
          onPress={() => router.push(`/(admin)/tickets/${ticket.id}` as never)}
          style={styles.card}
        >
          <View style={styles.row}>
            <View style={[styles.badge, { borderColor: STATUS_COLORS[ticket.status], backgroundColor: STATUS_COLORS[ticket.status] + '15' }]}>
              <AureakText variant="caption" style={{ color: STATUS_COLORS[ticket.status] }}>
                {STATUS_LABELS[ticket.status]}
              </AureakText>
            </View>
            <View style={[styles.badge, { borderColor: colors.border.light }]}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {CATEGORY_LABELS[ticket.category] ?? ticket.category}
              </AureakText>
            </View>
          </View>
          <AureakText variant="body" style={{ fontWeight: '600' }}>{ticket.subject}</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            {new Date(ticket.createdAt).toLocaleDateString('fr-BE')}
          </AureakText>
        </Pressable>
      ))}
    </ScrollView>
  )
}
