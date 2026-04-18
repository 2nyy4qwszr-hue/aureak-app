// Story 88.5 — UploadModal : modale d'upload fichier ou saisie URL (admin)
'use client'
import React, { useState, useRef } from 'react'
import { View, Pressable, Modal, TextInput, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  uploadCommercialResourceFile,
  updateCommercialResource,
} from '@aureak/api-client'
import type { CommercialResource } from '@aureak/types'

type Props = {
  visible  : boolean
  resource : CommercialResource | null
  onClose  : () => void
  onUpdated: (updated: CommercialResource) => void
}

export function UploadModal({ visible, resource, onClose, onUpdated }: Props) {
  const [saving, setSaving]       = useState(false)
  const [urlValue, setUrlValue]   = useState('')
  const [fileName, setFileName]   = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const fileRef                   = useRef<File | null>(null)

  const isWebpage = resource?.resourceType === 'webpage'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      fileRef.current = file
      setFileName(file.name)
      setError(null)
    }
  }

  async function handleSubmit() {
    if (!resource) return
    setError(null)
    setSaving(true)
    try {
      if (isWebpage) {
        if (!urlValue.trim()) {
          setError('Veuillez saisir une URL')
          return
        }
        const updated = await updateCommercialResource(resource.id, {
          externalUrl: urlValue.trim(),
        })
        onUpdated(updated)
      } else {
        const file = fileRef.current
        if (!file) {
          setError('Veuillez sélectionner un fichier')
          return
        }
        const updated = await uploadCommercialResourceFile(resource, file)
        onUpdated(updated)
      }
      handleClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UploadModal] error:', err)
      setError('Erreur lors de la mise à jour. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setUrlValue('')
    setFileName(null)
    setError(null)
    fileRef.current = null
    onClose()
  }

  if (!resource) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.modal} onPress={(e) => e.stopPropagation()}>
          <AureakText variant="label" style={s.modalTitle}>
            Modifier : {resource.title}
          </AureakText>

          {isWebpage ? (
            <View style={s.field}>
              <AureakText variant="caption" style={s.fieldLabel}>URL du lien</AureakText>
              <TextInput
                style={s.input}
                value={urlValue}
                onChangeText={setUrlValue}
                placeholder="https://..."
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : (
            <View style={s.field}>
              <AureakText variant="caption" style={s.fieldLabel}>
                Fichier ({resource.resourceType === 'powerpoint' ? 'PDF, PPTX' : 'PDF'})
              </AureakText>
              <View style={s.fileRow}>
                <Pressable
                  onPress={() => {
                    const input = document.getElementById('resource-file-input') as HTMLInputElement
                    input?.click()
                  }}
                  style={({ pressed }) => [s.filePicker, pressed && s.filePickerPressed] as never}
                >
                  <AureakText variant="body" style={s.filePickerText}>
                    {fileName ?? 'Choisir un fichier...'}
                  </AureakText>
                </Pressable>
              </View>
            </View>
          )}

          {error ? (
            <AureakText variant="caption" style={s.errorText}>{error}</AureakText>
          ) : null}

          <View style={s.btnRow}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [s.cancelBtn, pressed && s.cancelBtnPressed] as never}
            >
              <AureakText variant="label" style={s.cancelBtnText}>Annuler</AureakText>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={saving}
              style={({ pressed }) => [
                s.submitBtn,
                pressed && s.submitBtnPressed,
                saving && s.submitBtnDisabled,
              ] as never}
            >
              <AureakText variant="label" style={s.submitBtnText}>
                {saving ? 'Envoi...' : 'Enregistrer'}
              </AureakText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>

      {/* Hidden file input for web */}
      {!isWebpage ? (
        <input
          id="resource-file-input"
          type="file"
          accept=".pdf,.pptx,.ppt"
          onChange={handleFileChange as unknown as React.ChangeEventHandler<HTMLInputElement>}
          style={{ display: 'none' } as React.CSSProperties}
        />
      ) : null}
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
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : space.xl,
    width          : 440,
    maxWidth       : '90%' as unknown as number,
    boxShadow      : shadows.md,
  },
  modalTitle: {
    fontSize    : 16,
    fontWeight  : '700',
    fontFamily  : fonts.display,
    color       : colors.text.dark,
    marginBottom: space.lg,
  },
  field: {
    marginBottom: space.md,
  },
  fieldLabel: {
    fontSize    : 12,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: space.xs,
  },
  input: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.card,
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    fontSize         : 14,
    fontFamily       : fonts.body,
    color            : colors.text.dark,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  filePicker: {
    flex             : 1,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.card,
    borderStyle      : 'dashed' as never,
    paddingVertical  : space.md,
    paddingHorizontal: space.md,
    alignItems       : 'center',
  },
  filePickerPressed: {
    opacity: 0.7,
  },
  filePickerText: {
    fontSize: 13,
    color   : colors.text.muted,
  },
  errorText: {
    fontSize    : 12,
    color       : colors.accent.red,
    marginBottom: space.sm,
  },
  btnRow: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : space.sm,
    marginTop     : space.lg,
  },
  cancelBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  submitBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    borderRadius     : radius.card,
    backgroundColor  : colors.accent.gold,
  },
  submitBtnPressed: {
    opacity: 0.8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.light.surface,
  },
})
