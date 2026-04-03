'use client'
// Story 9.5 — Messagerie reçue coach
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { listAdminMessages } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'

type AdminMessage = {
  id          : string
  sender_id   : string
  recipient_id: string
  message     : string
  urgency     : 'routine' | 'urgent'
  sent_at     : string
}

const URGENCY_COLOR = { routine: colors.text.muted, urgent: colors.accent.red }
const URGENCY_LABEL = { routine: 'Routine', urgent: '🚨 Urgent' }

export default function CoachMessagesPage() {
  const user = useAuthStore(s => s.user)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data } = await listAdminMessages(user.id)
      setMessages((data as AdminMessage[]) ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachMessages] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const unread = messages.filter(m => m.urgency === 'urgent').length

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View>
          <AureakText variant="h2">Messages</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''} reçu{messages.length !== 1 ? 's' : ''}
            {unread > 0 && ` · ${unread} urgent${unread > 1 ? 's' : ''}`}
          </AureakText>
        </View>
      </View>

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : messages.length === 0 ? (
        <View style={s.empty}>
          <AureakText variant="body" style={{ fontSize: 32 }}>💬</AureakText>
          <AureakText variant="body" style={{ color: colors.text.muted }}>Aucun message reçu.</AureakText>
        </View>
      ) : (
        messages.map(m => {
          const color = URGENCY_COLOR[m.urgency]
          return (
            <View key={m.id} style={[s.card, m.urgency === 'urgent' && s.cardUrgent]}>
              <View style={s.cardHeader}>
                <View style={[s.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                  <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 10 }}>
                    {URGENCY_LABEL[m.urgency]}
                  </AureakText>
                </View>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  {new Date(m.sent_at).toLocaleDateString('fr-BE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </AureakText>
              </View>
              <AureakText variant="body" style={{ color: colors.text.dark, lineHeight: 22 }}>
                {m.message}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                De : Administration
              </AureakText>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md },
  header     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  card       : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.sm,
  },
  cardUrgent : { borderColor: colors.accent.red + '40', borderLeftWidth: 4, borderLeftColor: colors.accent.red },
  cardHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge      : {
    paddingHorizontal: 6,
    paddingVertical  : 2,
    borderRadius     : 4,
    borderWidth      : 1,
  },
  empty      : { alignItems: 'center', gap: space.md, paddingVertical: space.xl * 2 },
})
