// Story 7.4 — Formulaire de création de ticket parent
import { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { createTicket } from '@aureak/api-client'
import { TICKET_SUBJECT_TEMPLATES } from '@aureak/business-logic'
import { Text } from '@aureak/ui'
import type { TicketCategory } from '@aureak/api-client'
import { colors } from '@aureak/theme'

const CATEGORIES: { key: TicketCategory; label: string }[] = [
  { key: 'absence',    label: 'Absence' },
  { key: 'retard',     label: 'Retard' },
  { key: 'question',   label: 'Question' },
  { key: 'logistique', label: 'Logistique' },
]

export default function NewTicketScreen() {
  const [category, setCategory] = useState<TicketCategory>('question')
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleCategoryChange = (cat: TicketCategory) => {
    setCategory(cat)
    const template = TICKET_SUBJECT_TEMPLATES[cat]?.('', '') ?? ''
    if (template) setSubject(template)
  }

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Sujet et message sont obligatoires')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await createTicket({ category, subject, body })
    setLoading(false)
    if (err) {
      setError('Erreur lors de la création du ticket')
    } else {
      router.back()
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Contacter le staff</Text>

      {/* Catégorie */}
      <Text style={styles.label}>Catégorie *</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryBtn, category === cat.key && styles.categoryBtnActive]}
            onPress={() => handleCategoryChange(cat.key)}
          >
            <Text style={category === cat.key ? styles.categoryTextActive : styles.categoryText}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sujet */}
      <Text style={styles.label}>Sujet * (max 120)</Text>
      <TextInput
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
        maxLength={120}
        placeholderTextColor={colors.text.secondary}
        placeholder="Sujet de votre demande"
      />

      {/* Message */}
      <Text style={styles.label}>Message * (max 2000)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={body}
        onChangeText={setBody}
        maxLength={2000}
        multiline
        numberOfLines={6}
        placeholderTextColor={colors.text.secondary}
        placeholder="Décrivez votre demande..."
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitBtnText}>{loading ? 'Envoi…' : 'Envoyer'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container         : { flex: 1, backgroundColor: colors.background.primary, padding: 16 },
  title             : { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  label             : { color: colors.text.secondary, fontSize: 12, marginBottom: 6, marginTop: 16 },
  categoryRow       : { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn       : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.accent.zinc },
  categoryBtnActive : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  categoryText      : { color: colors.text.secondary, fontSize: 14 },
  categoryTextActive: { color: colors.background.primary, fontWeight: '600' },
  input             : { backgroundColor: colors.background.surface, color: colors.text.primary, borderRadius: 8, padding: 12, fontSize: 14 },
  textarea          : { height: 120, textAlignVertical: 'top' },
  errorText         : { color: colors.status.absent, fontSize: 14, marginTop: 8 },
  submitBtn         : { backgroundColor: colors.accent.gold, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 32 },
  submitBtnDisabled : { opacity: 0.5 },
  submitBtnText     : { color: colors.background.primary, fontSize: 16, fontWeight: '700' },
})
