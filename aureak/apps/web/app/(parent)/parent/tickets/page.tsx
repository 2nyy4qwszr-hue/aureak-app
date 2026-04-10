// Story 7.4 — Tickets support parent (liste + création)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { createTicket, listMyTickets } from '@aureak/api-client'
import type { Ticket, TicketCategory } from '@aureak/api-client'
import { TICKET_SUBJECT_TEMPLATES } from '@aureak/business-logic'
import { AureakButton, Input, AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'absence',    label: 'Absence' },
  { value: 'retard',     label: 'Retard' },
  { value: 'question',   label: 'Question' },
  { value: 'logistique', label: 'Logistique' },
]

const STATUS_LABELS: Record<string, string> = {
  open       : 'Ouvert',
  in_progress: 'En cours',
  resolved   : 'Résolu',
  closed     : 'Fermé',
}

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.lg },
  card       : {
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: space.xs,
  },
  chipRow    : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  chip       : {
    paddingHorizontal: space.sm, paddingVertical: 4,
    borderRadius: 16, borderWidth: 1,
  },
  section    : { gap: space.md },
  sectionTitle: { marginBottom: space.xs },
  textarea   : {
    backgroundColor: colors.light.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: space.sm,
    color: colors.text.dark,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: fonts.body,
    fontSize: 14,
  },
})

export default function ParentTicketsPage() {
  const router = useRouter()
  const [tickets,  setTickets]  = useState<Ticket[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  // Formulaire
  const [category, setCategory] = useState<TicketCategory>('question')
  const [subject,  setSubject]  = useState('')
  const [body,     setBody]     = useState('')

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const { data } = await listMyTickets()
      setTickets(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ParentTickets] fetchTickets error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const handleCategoryChange = (cat: TicketCategory) => {
    setCategory(cat)
    const template = TICKET_SUBJECT_TEMPLATES[cat]
    if (template) {
      setSubject(template('', new Date().toLocaleDateString('fr-BE')))
    }
  }

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) { setError('Sujet et message sont requis.'); return }
    setCreating(true)
    setError(null)
    try {
      const { error: err } = await createTicket({
        category,
        subject: subject.trim(),
        body   : body.trim(),
      })
      if (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ParentTickets] createTicket error:', err)
        setError('Erreur lors de la création du ticket.')
        return
      }
      setSuccess(true)
      setShowForm(false)
      setSubject('')
      setBody('')
      await fetchTickets()
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setCreating(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AureakText variant="h2">Mes demandes</AureakText>
        <AureakButton
          label={showForm ? 'Annuler' : 'Nouveau ticket'}
          onPress={() => setShowForm(!showForm)}
          variant={showForm ? 'secondary' : 'primary'}
        />
      </View>

      {success && (
        <View style={{ backgroundColor: colors.light.muted, borderLeftWidth: 3, borderLeftColor: colors.status.present, padding: space.md, borderRadius: 4 }}>
          <AureakText variant="body" style={{ color: colors.status.present }}>Ticket créé. Le staff vous répondra bientôt.</AureakText>
        </View>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <View style={styles.section}>
          <AureakText variant="label" style={styles.sectionTitle}>Catégorie</AureakText>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <View
                key={c.value}
                style={[styles.chip, {
                  borderColor    : category === c.value ? colors.accent.gold : colors.border.light,
                  backgroundColor: category === c.value ? colors.accent.gold + '15' : colors.light.surface,
                }]}
                onTouchEnd={() => handleCategoryChange(c.value)}
              >
                <AureakText
                  variant="caption"
                  style={{ color: category === c.value ? colors.accent.gold : colors.text.muted }}
                >
                  {c.label}
                </AureakText>
              </View>
            ))}
          </View>

          <Input
            label="Sujet (max 120 caractères)"
            value={subject}
            onChangeText={setSubject}
            placeholder="Objet de votre demande"
            variant="light"
          />

          <View style={{ gap: space.xs }}>
            <AureakText variant="label" style={{ color: colors.text.muted }}>Message (max 2000 caractères)</AureakText>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Décrivez votre demande..."
              multiline
              maxLength={2000}
              style={styles.textarea}
            />
          </View>

          {error && (
            <AureakText variant="caption" style={{ color: colors.status.absent }}>{error}</AureakText>
          )}

          <AureakButton
            label={creating ? 'Envoi...' : 'Envoyer la demande'}
            onPress={handleCreate}
            loading={creating}
            variant="primary"
          />
        </View>
      )}

      {/* Liste des tickets */}
      {loading && <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>}

      {!loading && tickets.length === 0 && !showForm && (
        <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' }}>
          Aucune demande en cours.
        </AureakText>
      )}

      {tickets.map((ticket) => (
        <Pressable
          key={ticket.id}
          onPress={() => router.push(`/parent/tickets/${ticket.id}` as never)}
          style={styles.card}
        >
          <View style={{ flexDirection: 'row', gap: space.xs, alignItems: 'center' }}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>·</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {new Date(ticket.createdAt).toLocaleDateString('fr-BE')}
            </AureakText>
          </View>
          <AureakText variant="body" style={{ fontWeight: '600' }}>{ticket.subject}</AureakText>
        </Pressable>
      ))}
    </ScrollView>
  )
}
