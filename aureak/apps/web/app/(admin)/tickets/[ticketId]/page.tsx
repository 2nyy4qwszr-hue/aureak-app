// Story 7.4 — Détail ticket + fil de réponses (Admin/Coach)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getTicketWithReplies, replyToTicket, updateTicketStatus } from '@aureak/api-client'
import type { Ticket, TicketReply, TicketStatus } from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const STATUS_LABELS: Record<TicketStatus, string> = {
  open       : 'Ouvert',
  in_progress: 'En cours',
  resolved   : 'Résolu',
  closed     : 'Fermé',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.lg },
  card     : {
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: space.xs,
  },
  replyCard: {
    backgroundColor: colors.light.muted,
    borderRadius: 6,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  input    : {
    backgroundColor: colors.light.surface,
    borderRadius: 6,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    color: colors.text.dark,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
})

export default function TicketDetailPage() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>()
  const router       = useRouter()

  const [ticket,  setTicket]  = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyBody, setReplyBody] = useState('')
  const [replying,  setReplying]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchData = async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const { ticket: t, replies: r } = await getTicketWithReplies(ticketId)
      setTicket(t)
      setReplies(r)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [ticketId])

  const handleReply = async () => {
    if (!replyBody.trim() || !ticketId) return
    setReplying(true)
    setError(null)
    try {
      const { error: err } = await replyToTicket(ticketId, replyBody.trim())
      if (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[TicketDetail] replyToTicket error:', err)
        setError('Erreur lors de la réponse.')
        return
      }
      setReplyBody('')
      await fetchData()
    } finally {
      setReplying(false)
    }
  }

  const handleStatus = async (newStatus: TicketStatus) => {
    if (!ticketId) return
    const { error: err } = await updateTicketStatus(ticketId, newStatus)
    if (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TicketDetail] updateStatus error:', err)
      return
    }
    await fetchData()
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light.primary }}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      </View>
    )
  }

  if (!ticket) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light.primary }}>
        <AureakText variant="body" style={{ color: colors.status.absent }}>Ticket introuvable.</AureakText>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />

      {/* En-tête ticket */}
      <View style={styles.card}>
        <AureakText variant="h3">{ticket.subject}</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString('fr-BE')} · {STATUS_LABELS[ticket.status]}
        </AureakText>
        <AureakText variant="body" style={{ color: colors.text.dark }}>{ticket.body}</AureakText>
      </View>

      {/* Changement de statut */}
      <View>
        <AureakText variant="label" style={{ marginBottom: space.xs }}>Statut</AureakText>
        <View style={styles.row}>
          {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map((s) => (
            <AureakButton
              key={s}
              label={STATUS_LABELS[s]}
              onPress={() => handleStatus(s)}
              variant={ticket.status === s ? 'primary' : 'secondary'}
            />
          ))}
        </View>
      </View>

      {/* Fil de réponses */}
      <View style={{ gap: space.sm }}>
        <AureakText variant="label">Réponses ({replies.length})</AureakText>
        {replies.length === 0 && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>Aucune réponse.</AureakText>
        )}
        {replies.map((reply) => (
          <View key={reply.id} style={styles.replyCard}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {new Date(reply.createdAt).toLocaleString('fr-BE')}
            </AureakText>
            <AureakText variant="body">{reply.body}</AureakText>
          </View>
        ))}
      </View>

      {/* Répondre */}
      {ticket.status !== 'closed' && (
        <View style={{ gap: space.sm }}>
          <AureakText variant="label">Répondre</AureakText>
          {error && (
            <AureakText variant="caption" style={{ color: colors.status.absent }}>{error}</AureakText>
          )}
          <TextInput
            value={replyBody}
            onChangeText={setReplyBody}
            placeholder="Votre réponse..."
            multiline
            style={styles.input}
            maxLength={2000}
          />
          <AureakButton
            label={replying ? 'Envoi...' : 'Envoyer la réponse'}
            onPress={handleReply}
            loading={replying}
            variant="primary"
          />
        </View>
      )}
    </ScrollView>
  )
}
