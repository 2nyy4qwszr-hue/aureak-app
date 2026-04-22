'use client'
// Story 9.5 — Messagerie admin → coach
// Story 99.6 — AdminPageHeader v2 ("Messages")
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native'
import { sendAdminMessage, listAdminMessages, listCoaches } from '@aureak/api-client'
import type { CoachListRow } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

type AdminMessage = {
  id          : string
  recipient_id: string
  message     : string
  urgency     : 'routine' | 'urgent'
  sent_at     : string
}

const URGENCY_COLOR = { routine: colors.text.muted, urgent: colors.accent.red }
const URGENCY_LABEL = { routine: 'Routine', urgent: '🚨 Urgent' }

export default function AdminMessagesPage() {
  const [coaches,    setCoaches]    = useState<CoachListRow[]>([])
  const [messages,   setMessages]   = useState<AdminMessage[]>([])
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [recipient,  setRecipient]  = useState('')
  const [message,    setMessage]    = useState('')
  const [urgency,    setUrgency]    = useState<'routine' | 'urgent'>('routine')
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [search,     setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: msgs }, { data: coachData }] = await Promise.all([
        listAdminMessages(),
        listCoaches({ page: 1, pageSize: 200 }),
      ])
      setMessages((msgs as AdminMessage[]) ?? [])
      setCoaches(coachData ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AdminMessages] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSend = async () => {
    if (!recipient || !message.trim()) {
      setError('Veuillez sélectionner un destinataire et saisir un message.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const { error } = await sendAdminMessage(recipient, message.trim(), urgency)
      if (error) throw error
      setMessage('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AdminMessages] send error:', err)
      setError('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  const coachName = (id: string) => coaches.find(c => c.userId === id)?.displayName ?? id

  // ── Client-side search ────────────────────────────────────────────────────────
  const filteredMessages = search.trim()
    ? messages.filter(m => {
        const q = search.toLowerCase()
        return (
          m.message.toLowerCase().includes(q) ||
          coachName(m.recipient_id).toLowerCase().includes(q)
        )
      })
    : messages

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
      {/* Story 99.6 — AdminPageHeader v2 */}
      <AdminPageHeader title="Messages" />

      <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* ── Formulaire envoi ── */}
      <View style={s.card}>
        <AureakText variant="label" style={s.sectionLabel}>NOUVEAU MESSAGE</AureakText>

        <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 4 }}>Destinataire</AureakText>
        <View style={s.select}>
          {coaches.length === 0 ? (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun coach disponible</AureakText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: space.xs }}>
                {coaches.map(c => (
                  <Pressable
                    key={c.userId}
                    style={[s.chip, recipient === c.userId && s.chipActive]}
                    onPress={() => setRecipient(c.userId)}
                  >
                    <AureakText
                      variant="caption"
                      style={{ color: recipient === c.userId ? colors.light.primary : colors.text.dark, fontWeight: '600' }}
                    >
                      {c.displayName ?? c.userId}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 4, marginTop: space.sm }}>Urgence</AureakText>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(['routine', 'urgent'] as const).map(u => (
            <Pressable
              key={u}
              style={[s.chip, urgency === u && s.chipActive, urgency === u && u === 'urgent' && { backgroundColor: colors.accent.red }]}
              onPress={() => setUrgency(u)}
            >
              <AureakText variant="caption" style={{ color: urgency === u ? colors.light.primary : colors.text.dark, fontWeight: '600' }}>
                {URGENCY_LABEL[u]}
              </AureakText>
            </Pressable>
          ))}
        </View>

        <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 4, marginTop: space.sm }}>Message</AureakText>
        <TextInput
          style={s.textarea}
          value={message}
          onChangeText={setMessage}
          placeholder="Votre message…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />
        <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'right' }}>
          {message.length}/2000
        </AureakText>

        {error && (
          <AureakText variant="caption" style={{ color: colors.accent.red }}>{error}</AureakText>
        )}
        {success && (
          <AureakText variant="caption" style={{ color: colors.status.present }}>✓ Message envoyé.</AureakText>
        )}

        <Pressable style={[s.sendBtn, sending && s.sendBtnDisabled]} onPress={handleSend} disabled={sending}>
          <AureakText variant="body" style={{ color: colors.light.primary, fontWeight: '700' }}>
            {sending ? 'Envoi…' : 'Envoyer le message'}
          </AureakText>
        </Pressable>
      </View>

      {/* ── Historique ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.md }}>
        <AureakText variant="label" style={s.sectionLabel as never}>
          HISTORIQUE {filteredMessages.length !== messages.length ? `(${filteredMessages.length}/${messages.length})` : `(${messages.length})`}
        </AureakText>
      </View>

      {/* Recherche */}
      {messages.length > 0 && (
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par expéditeur ou contenu…"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search !== '' && (
            <Pressable style={s.clearBtn} onPress={() => setSearch('')}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
            </Pressable>
          )}
        </View>
      )}

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : filteredMessages.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          {search ? 'Aucun résultat pour cette recherche.' : 'Aucun message envoyé.'}
        </AureakText>
      ) : (
        filteredMessages.map(m => (
          <View key={m.id} style={[s.msgCard, { borderLeftColor: URGENCY_COLOR[m.urgency] }]}>
            <View style={s.msgHeader}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                → {coachName(m.recipient_id)}
              </AureakText>
              <View style={[s.urgencyBadge, { borderColor: URGENCY_COLOR[m.urgency] + '40', backgroundColor: URGENCY_COLOR[m.urgency] + '12' }]}>
                <AureakText variant="caption" style={{ color: URGENCY_COLOR[m.urgency], fontSize: 10, fontWeight: '700' }}>
                  {URGENCY_LABEL[m.urgency]}
                </AureakText>
              </View>
            </View>
            <AureakText variant="body" style={{ color: colors.text.dark }}>{m.message}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {new Date(m.sent_at).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </AureakText>
          </View>
        ))
      )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container     : { flex: 1, backgroundColor: colors.light.primary },
  content       : { padding: space.xl, gap: space.md },
  searchRow     : { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, backgroundColor: colors.light.surface, paddingHorizontal: 12, gap: 8 },
  searchInput   : { flex: 1, paddingVertical: 9, color: colors.text.dark, fontSize: 13 },
  clearBtn      : { padding: 4 },
  card          : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.sm,
  },
  sectionLabel  : {
    fontSize  : 10,
    fontWeight: '700',
    color     : colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as never,
    marginBottom: space.sm,
  },
  select        : { minHeight: 36 },
  chip          : {
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    borderRadius     : 16,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
  },
  chipActive    : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  textarea      : {
    backgroundColor  : colors.light.muted,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    padding          : space.sm,
    color            : colors.text.dark,
    minHeight        : 100,
    textAlignVertical: 'top',
    fontFamily       : fonts.body,
    fontSize         : 14,
  },
  sendBtn       : {
    backgroundColor: colors.accent.gold,
    borderRadius   : 8,
    padding        : space.md,
    alignItems     : 'center',
    marginTop      : space.xs,
  },
  sendBtnDisabled: { opacity: 0.5 },
  msgCard       : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderLeftWidth: 4,
    gap            : space.xs,
  },
  msgHeader     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  urgencyBadge  : {
    paddingHorizontal: 6,
    paddingVertical  : 2,
    borderRadius     : 4,
    borderWidth      : 1,
  },
})
