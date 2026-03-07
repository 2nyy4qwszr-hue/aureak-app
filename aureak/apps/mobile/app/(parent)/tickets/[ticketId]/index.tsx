// Story 7.4 — Fil de réponses d'un ticket parent
import { useEffect, useState } from 'react'
import { View, ScrollView, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { getTicketWithReplies, replyToTicket } from '@aureak/api-client'
import { Text } from '@aureak/ui'
import type { Ticket, TicketReply } from '@aureak/api-client'
import { colors } from '@aureak/theme'

export default function TicketDetailScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>()
  const [ticket, setTicket]   = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [replyText, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => {
    const { ticket: t, replies: r } = await getTicketWithReplies(ticketId)
    setTicket(t)
    setReplies(r)
    setLoading(false)
  }

  useEffect(() => { load() }, [ticketId])

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    await replyToTicket(ticketId, replyText)
    setReply('')
    setSending(false)
    await load()
  }

  if (loading) return <ActivityIndicator style={styles.loader} color={colors.accent.gold} />

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* En-tête ticket */}
        <Text style={styles.subject}>{ticket?.subject}</Text>
        <Text style={styles.meta}>{ticket?.category} · {ticket?.status}</Text>
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{ticket?.body}</Text>
        </View>

        {/* Fil de réponses */}
        {replies.map(reply => (
          <View key={reply.id} style={styles.replyBubble}>
            <Text style={styles.replyText}>{reply.body}</Text>
            <Text style={styles.replyDate}>
              {new Date(reply.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Zone de réponse */}
      <View style={styles.replyBox}>
        <TextInput
          style={styles.replyInput}
          value={replyText}
          onChangeText={setReply}
          placeholder="Votre message..."
          placeholderTextColor={colors.text.secondary}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={handleReply}
          disabled={sending}
        >
          <Text style={styles.sendBtnText}>{sending ? '…' : 'Envoyer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container     : { flex: 1, backgroundColor: colors.background.primary },
  loader        : { flex: 1 },
  scroll        : { flex: 1, padding: 16 },
  subject       : { color: colors.text.primary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  meta          : { color: colors.text.secondary, fontSize: 12, marginBottom: 16 },
  messageBubble : { backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  messageText   : { color: colors.text.primary, fontSize: 14 },
  replyBubble   : { backgroundColor: colors.background.elevated, borderRadius: 12, padding: 12, marginBottom: 8 },
  replyText     : { color: colors.text.primary, fontSize: 14 },
  replyDate     : { color: colors.text.secondary, fontSize: 11, marginTop: 4 },
  replyBox      : { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: colors.background.surface },
  replyInput    : { flex: 1, backgroundColor: colors.background.surface, color: colors.text.primary, borderRadius: 8, padding: 10, fontSize: 14, maxHeight: 100 },
  sendBtn       : { backgroundColor: colors.accent.gold, borderRadius: 8, padding: 12, marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText   : { color: colors.background.primary, fontWeight: '700' },
})
