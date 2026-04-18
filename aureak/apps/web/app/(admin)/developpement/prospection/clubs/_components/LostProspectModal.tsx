'use client'
// Story 88.6 — Modale "Perdu" avec raison obligatoire
import React, { useState, useEffect } from 'react'
import { View, Pressable, Modal, TextInput, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { updateClubProspectStatus, updateClubProspect } from '@aureak/api-client'

type Props = {
  visible        : boolean
  clubProspectId : string
  clubName       : string
  onClose        : () => void
  onLost         : () => void
}

export function LostProspectModal({ visible, clubProspectId, clubName, onClose, onLost }: Props) {
  const [reason, setReason] = useState('')
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setReason('')
      setNotes('')
      setError(null)
    }
  }, [visible])

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('La raison de la perte est obligatoire')
      return
    }

    setSaving(true)
    try {
      // Update notes with loss reason + status to perdu
      const fullNotes = `[PERDU] ${reason.trim()}${notes.trim() ? `\n${notes.trim()}` : ''}`
      await updateClubProspect(clubProspectId, { notes: fullNotes })
      await updateClubProspectStatus(clubProspectId, 'perdu')
      onLost()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[LostProspectModal] error:', err)
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.modal} onPress={() => {}}>
          <AureakText variant="h2" style={s.title}>Marquer comme perdu</AureakText>
          <AureakText style={s.subtitle}>{clubName}</AureakText>

          <AureakText style={s.label}>Raison de la perte *</AureakText>
          <TextInput
            style={s.input}
            value={reason}
            onChangeText={t => { setReason(t); setError(null) }}
            placeholder="Ex : Budget insuffisant, timing inadapté..."
            placeholderTextColor={colors.text.subtle}
          />

          <AureakText style={s.label}>Notes supplémentaires</AureakText>
          <TextInput
            style={[s.input, s.inputMultiline] as never}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optionnel..."
            placeholderTextColor={colors.text.subtle}
            multiline
            numberOfLines={3}
          />

          {error && <AureakText style={s.error}>{error}</AureakText>}

          <View style={s.actions}>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <AureakText style={s.cancelBtnText}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[s.lostBtn, saving && s.lostBtnDisabled] as never}
              onPress={handleConfirm}
              disabled={saving}
            >
              <AureakText style={s.lostBtnText}>
                {saving ? 'En cours...' : 'Confirmer la perte'}
              </AureakText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  modal: {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    padding         : space.xl,
    width           : '90%',
    maxWidth        : 480,
    boxShadow       : shadows.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize    : 14,
    fontFamily  : fonts.body,
    color       : colors.text.muted,
    marginBottom: space.lg,
  },
  label: {
    fontSize    : 12,
    fontFamily  : fonts.body,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: space.xs,
    marginTop   : space.md,
  },
  input: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 10,
    fontSize         : 14,
    fontFamily       : fonts.body,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
  inputMultiline: {
    minHeight        : 60,
    textAlignVertical: 'top',
  },
  error: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.status.errorText,
    marginTop : space.sm,
  },
  actions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : space.sm,
    marginTop     : space.xl,
  },
  cancelBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  cancelBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.muted,
  },
  lostBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    backgroundColor  : colors.status.errorText,
  },
  lostBtnDisabled: {
    opacity: 0.5,
  },
  lostBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : '#fff',
  },
})
