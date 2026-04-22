'use client'
// Story 91.2 — Modale de rejet avec raison obligatoire (min 5 chars)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import type { MediaItem } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

type Props = {
  visible : boolean
  item    : MediaItem | null
  onClose : () => void
  onSubmit: (reason: string) => Promise<void>
}

export function RejectModal({ visible, item, onClose, onSubmit }: Props) {
  const [reason, setReason]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setReason('')
      setError(null)
    }
  }, [visible])

  async function handleSubmit() {
    const trimmed = reason.trim()
    if (trimmed.length < 5) {
      setError('Raison trop courte (5 caractères minimum)')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RejectModal] submit error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet')
    } finally {
      setSubmitting(false)
    }
  }

  if (!item) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Rejeter ce média</AureakText>
            <AureakText style={s.sub as never}>
              « {item.title} » — merci d'indiquer la raison (affichée au coach).
            </AureakText>

            <View style={s.field}>
              <AureakText style={s.label as never}>Raison du rejet *</AureakText>
              <TextInput
                style={[s.input, s.textarea]}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                placeholder="Ex. photo floue, visage d'enfant non autorisé…"
                editable={!submitting}
              />
            </View>

            {error && <AureakText style={s.error as never}>{error}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={submitting}>
                <AureakText style={s.btnCancelLabel as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, submitting && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <AureakText style={s.btnSubmitLabel as never}>
                  {submitting ? 'Envoi…' : 'Rejeter'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: space.md },
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 500, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  sub     : { color: colors.text.muted, fontSize: 13 },
  field   : { gap: space.xs },
  label   : { color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 },
  input   : {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  error   : { color: colors.status.errorText, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.sm },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.status.absent },
  btnDisabled: { opacity: 0.5 },
  btnSubmitLabel: { color: colors.light.surface, fontWeight: '700' },
})
