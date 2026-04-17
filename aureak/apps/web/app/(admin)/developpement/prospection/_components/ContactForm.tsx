// Epic 85 — Story 85.4 — Formulaire ajout contact commercial
'use client'
import React, { useState } from 'react'
import { View, TextInput, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, transitions } from '@aureak/theme'
import { createCommercialContact } from '@aureak/api-client'
import type { CommercialContactStatus } from '@aureak/types'
import { COMMERCIAL_CONTACT_STATUS_LABELS } from '@aureak/types'

interface ContactFormProps {
  clubDirectoryId: string
  onCreated      : () => void
}

const STATUS_OPTIONS: CommercialContactStatus[] = ['premier_contact', 'en_cours', 'en_attente', 'pas_de_suite']

export function ContactForm({ clubDirectoryId, onCreated }: ContactFormProps) {
  const [contactName, setContactName] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [status, setStatus]           = useState<CommercialContactStatus>('premier_contact')
  const [note, setNote]               = useState('')
  const [saving, setSaving]           = useState(false)
  const [expanded, setExpanded]       = useState(false)

  const handleSubmit = async () => {
    if (!contactName.trim()) return
    setSaving(true)
    try {
      await createCommercialContact({
        clubDirectoryId,
        contactName: contactName.trim(),
        contactRole: contactRole.trim() || undefined,
        status,
        note: note.trim() || undefined,
      })
      setContactName('')
      setContactRole('')
      setStatus('premier_contact')
      setNote('')
      setExpanded(false)
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ContactForm] create error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
      >
        <AureakText variant="label" style={styles.addBtnText}>+ Ajouter un contact</AureakText>
      </Pressable>
    )
  }

  return (
    <View style={styles.form}>
      <AureakText variant="h3" style={styles.formTitle}>Nouveau contact</AureakText>

      <TextInput
        style={styles.input}
        placeholder="Nom du contact *"
        placeholderTextColor={colors.text.muted}
        value={contactName}
        onChangeText={setContactName}
      />

      <TextInput
        style={styles.input}
        placeholder="Rôle au club (ex: président, directeur sportif...)"
        placeholderTextColor={colors.text.muted}
        value={contactRole}
        onChangeText={setContactRole}
      />

      {/* Sélecteur de statut */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map(s => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={[styles.statusPill, status === s && styles.statusPillActive]}
          >
            <AureakText
              variant="caption"
              style={{ color: status === s ? colors.light.surface : colors.text.muted, fontWeight: '600' } as never}
            >
              {COMMERCIAL_CONTACT_STATUS_LABELS[s]}
            </AureakText>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Note libre (optionnel)"
        placeholderTextColor={colors.text.muted}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={() => setExpanded(false)}
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
        >
          <AureakText variant="label" style={styles.cancelText}>Annuler</AureakText>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={saving || !contactName.trim()}
          style={({ pressed }) => [
            styles.submitBtn,
            (saving || !contactName.trim()) && styles.submitBtnDisabled,
            pressed && { opacity: 0.85 },
          ]}
        >
          <AureakText variant="label" style={styles.submitText}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </AureakText>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.card,
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    alignSelf        : 'flex-start',
    // @ts-ignore — web only
    transition       : `opacity ${transitions.fast}`,
  },
  addBtnPressed: {
    opacity: 0.85,
  },
  addBtnText: {
    color     : colors.light.surface,
    fontWeight: '700',
  } as never,
  form: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.gold,
    padding        : space.lg,
    gap            : space.md,
    // @ts-ignore — web only
    boxShadow      : shadows.sm,
  },
  formTitle: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  input: {
    backgroundColor: colors.light.primary,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    fontSize       : 14,
    color          : colors.text.dark,
  },
  noteInput: {
    minHeight    : 60,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  statusPill: {
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.primary,
  },
  statusPillActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  actions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : space.md,
    marginTop     : space.sm,
  },
  cancelBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
  },
  cancelText: {
    color: colors.text.muted,
  },
  submitBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.xs,
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color     : colors.light.surface,
    fontWeight: '700',
  } as never,
})
