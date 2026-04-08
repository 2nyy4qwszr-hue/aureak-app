// Story 78.2 — Fil de réponses ticket (côté parent)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getTicketWithReplies, replyToTicket, softDeleteTicket } from '@aureak/api-client'
import type { Ticket, TicketReply, TicketStatus } from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'

const STATUS_LABELS: Record<TicketStatus, string> = {
  open       : 'Ouvert',
  in_progress: 'En cours',
  resolved   : 'Résolu',
  closed     : 'Fermé',
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  open       : colors.accent.gold,
  in_progress: colors.status.info,
  resolved   : colors.status.present,
  closed     : colors.text.muted,
}

const CATEGORY_LABELS: Record<string, string> = {
  absence   : 'Absence',
  retard    : 'Retard',
  question  : 'Question',
  logistique: 'Logistique',
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.xl, gap: space.lg },
  card      : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.xs,
    // @ts-ignore web only
    boxShadow      : shadows.sm,
  },
  replyCard : {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : space.sm,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.xs,
  },
  myReplyCard: {
    backgroundColor: colors.light.elevated,
    borderRadius   : radius.xs,
    padding        : space.sm,
    borderWidth    : 1,
    borderColor    : colors.border.gold,
    gap            : space.xs,
  },
  input     : {
    backgroundColor   : colors.light.surface,
    borderRadius      : radius.xs,
    padding           : space.sm,
    borderWidth       : 1,
    borderColor       : colors.border.light,
    color             : colors.text.dark,
    minHeight         : 80,
    textAlignVertical : 'top',
    fontFamily        : 'Montserrat',
    fontSize          : 14,
  },
  statusBadge: {
    alignSelf    : 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    borderRadius     : radius.xs,
    borderWidth      : 1,
  },
  dangerZone : {
    borderWidth  : 1,
    borderColor  : colors.accent.red,
    borderRadius : radius.card,
    padding      : space.md,
    gap          : space.sm,
  },
})

export default function ParentTicketDetailPage() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>()
  const router = useRouter()

  const [ticket,    setTicket]    = useState<Ticket | null>(null)
  const [replies,   setReplies]   = useState<TicketReply[]>([])
  const [loading,   setLoading]   = useState(true)
  const [replyBody, setReplyBody] = useState('')
  const [replying,  setReplying]  = useState(false)
  const [closing,   setClosing]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchData = async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const { ticket: t, replies: r } = await getTicketWithReplies(ticketId)
      setTicket(t)
      setReplies(r)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ParentTicketDetail] fetchData error:', err)
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
        if (process.env.NODE_ENV !== 'production') console.error('[ParentTicketDetail] replyToTicket error:', err)
        setError("Erreur lors de l'envoi.")
        return
      }
      setReplyBody('')
      await fetchData()
    } finally {
      setReplying(false)
    }
  }

  const handleClose = async () => {
    if (!ticketId) return
    setClosing(true)
    try {
      const { error: err } = await softDeleteTicket(ticketId)
      if (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ParentTicketDetail] softDeleteTicket error:', err)
        return
      }
      router.replace('/parent/tickets')
    } finally {
      setClosing(false)
    }
  }

  const canReply = ticket?.status === 'open' || ticket?.status === 'in_progress'

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
      <AureakButton label="← Mes demandes" onPress={() => router.back()} variant="ghost" />

      {/* En-tête ticket */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          <View style={[styles.statusBadge, {
            borderColor    : STATUS_COLORS[ticket.status],
            backgroundColor: STATUS_COLORS[ticket.status] + '18',
          }]}>
            <AureakText variant="caption" style={{ color: STATUS_COLORS[ticket.status], fontWeight: '600' }}>
              {STATUS_LABELS[ticket.status]}
            </AureakText>
          </View>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            {CATEGORY_LABELS[ticket.category] ?? ticket.category}
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>·</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            {new Date(ticket.createdAt).toLocaleDateString('fr-BE')}
          </AureakText>
        </View>
        <AureakText variant="h3">{ticket.subject}</AureakText>
        <AureakText variant="body" style={{ color: colors.text.dark }}>{ticket.body}</AureakText>
      </View>

      {/* Fil de réponses */}
      <View style={{ gap: space.sm }}>
        <AureakText variant="label">Fil de réponses ({replies.length})</AureakText>
        {replies.length === 0 && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            Aucune réponse pour l'instant. Le staff vous répondra bientôt.
          </AureakText>
        )}
        {replies.map((reply) => (
          <View key={reply.id} style={reply.authorId === ticket.parentId ? styles.myReplyCard : styles.replyCard}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {reply.authorId === ticket.parentId ? 'Vous' : 'Staff Aureak'} · {new Date(reply.createdAt).toLocaleString('fr-BE')}
            </AureakText>
            <AureakText variant="body">{reply.body}</AureakText>
          </View>
        ))}
      </View>

      {/* Formulaire réponse parent */}
      {canReply && (
        <View style={{ gap: space.sm }}>
          <AureakText variant="label">Ajouter un message</AureakText>
          {error && (
            <AureakText variant="caption" style={{ color: colors.status.absent }}>{error}</AureakText>
          )}
          <TextInput
            value={replyBody}
            onChangeText={setReplyBody}
            placeholder="Votre message..."
            multiline
            style={styles.input}
            maxLength={2000}
          />
          <AureakButton
            label={replying ? 'Envoi...' : 'Envoyer'}
            onPress={handleReply}
            loading={replying}
            variant="primary"
          />
        </View>
      )}

      {/* Fermer la demande */}
      {ticket.status !== 'closed' && (
        <View style={styles.dangerZone}>
          <AureakText variant="label" style={{ color: colors.accent.red }}>Fermer ma demande</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            Si votre problème est résolu, vous pouvez clore cette demande. Elle ne sera plus visible dans votre liste.
          </AureakText>
          <AureakButton
            label={closing ? 'Fermeture...' : 'Fermer ma demande'}
            onPress={handleClose}
            loading={closing}
            variant="danger"
          />
        </View>
      )}
    </ScrollView>
  )
}
