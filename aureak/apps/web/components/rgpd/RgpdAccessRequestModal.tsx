// Story 89.3 — Modal de demande d'accès RGPD aux coordonnées parent.
// Textarea obligatoire (1-500 chars) avec compteur + submit → requestRgpdAccess.
'use client'

import React, { useState, useCallback } from 'react'
import { View, Modal, Pressable, TextInput, StyleSheet, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { requestRgpdAccess } from '@aureak/api-client'
import { useToast } from '../ToastContext'

type Props = {
  visible      : boolean
  onClose      : () => void
  childId      : string
  childName    : string
  onSubmitted ?: () => void
}

const MAX_REASON_LENGTH = 500

export function RgpdAccessRequestModal({ visible, onClose, childId, childName, onSubmitted }: Props) {
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const toast                 = useToast()

  const trimmed = reason.trim()
  const isValid = trimmed.length >= 1 && trimmed.length <= MAX_REASON_LENGTH

  const handleClose = useCallback(() => {
    if (saving) return
    setReason('')
    setError(null)
    onClose()
  }, [onClose, saving])

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      setError('Le motif est obligatoire (1-500 caractères).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await requestRgpdAccess({ childId, reason: trimmed })
      toast.success('Demande envoyée — un administrateur vous répondra bientôt.')
      setReason('')
      onSubmitted?.()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[RgpdAccessRequestModal] submit error:', err)
      }
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }, [childId, trimmed, isValid, toast, onClose, onSubmitted])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={st.backdrop}>
        <View style={st.card}>
          <View style={st.header}>
            <AureakText style={st.title as never}>Demander l'accès aux coordonnées</AureakText>
            <AureakText style={st.subtitle as never}>
              Prospect : <AureakText style={{ fontWeight: '700' }}>{childName}</AureakText>
            </AureakText>
          </View>

          <ScrollView style={st.body} contentContainerStyle={{ gap: space.md }}>
            <View>
              <AureakText style={st.label as never}>
                Motif de la demande (RGPD — conservé pour audit)
              </AureakText>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Expliquez pourquoi vous avez besoin d'accéder à ces coordonnées…"
                multiline
                maxLength={MAX_REASON_LENGTH}
                style={st.textarea as never}
                editable={!saving}
              />
              <AureakText style={st.counter as never}>
                {trimmed.length} / {MAX_REASON_LENGTH}
              </AureakText>
            </View>

            {error && (
              <View style={st.errorBanner}>
                <AureakText style={{ color: colors.accent.red, fontSize: 12 }}>{error}</AureakText>
              </View>
            )}
          </ScrollView>

          <View style={st.footer}>
            <Pressable
              style={st.btnCancel}
              onPress={handleClose}
              disabled={saving}
            >
              <AureakText style={st.btnCancelText as never}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[st.btnSubmit, (!isValid || saving) && st.btnSubmitDisabled] as never}
              onPress={handleSubmit}
              disabled={!isValid || saving}
            >
              <AureakText style={st.btnSubmitText as never}>
                {saving ? 'Envoi…' : 'Envoyer la demande'}
              </AureakText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const st = StyleSheet.create({
  backdrop: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.lg,
  },
  card: {
    width          : '100%',
    maxWidth       : 520,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    // @ts-ignore RN Web
    boxShadow      : shadows.lg,
    overflow       : 'hidden',
  },
  header: {
    padding          : space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : 4,
  },
  title   : { fontSize: 18, fontWeight: '700', color: colors.text.dark },
  subtitle: { fontSize: 13, color: colors.text.muted },

  body: { padding: space.lg, maxHeight: 400 },

  label: {
    fontSize     : 11,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom : space.xs,
  },
  textarea: {
    minHeight        : 120,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    backgroundColor  : '#FFFFFF',
    padding          : space.sm,
    fontSize         : 14,
    color            : colors.text.dark,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize   : 11,
    color      : colors.text.subtle,
    marginTop  : space.xs,
    textAlign  : 'right',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.red,
    padding        : space.sm,
    borderRadius   : radius.xs,
  },

  footer: {
    flexDirection    : 'row',
    justifyContent   : 'flex-end',
    gap              : space.sm,
    padding          : space.lg,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
    backgroundColor  : colors.light.muted,
  },
  btnCancel: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  btnCancelText: { fontSize: 13, color: colors.text.dark, fontWeight: '600' },
  btnSubmit: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
  },
  btnSubmitDisabled: {
    opacity: 0.5,
  },
  btnSubmitText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
})
