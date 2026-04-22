'use client'
// Story 88.5 — Modale admin d'upload/édition d'une ressource commerciale
import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView, Platform } from 'react-native'
import { updateCommercialResource, uploadCommercialResourceFile } from '@aureak/api-client'
import type { CommercialResource } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

type Props = {
  visible    : boolean
  resource   : CommercialResource | null
  onClose    : () => void
  onSuccess? : () => void
}

export function UploadResourceModal({ visible, resource, onClose, onSuccess }: Props) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef                  = useRef<HTMLInputElement | null>(null)

  const isWebpage = resource?.resourceType === 'webpage'

  useEffect(() => {
    if (!visible || !resource) return
    setTitle(resource.title)
    setDescription(resource.description ?? '')
    setExternalUrl(resource.externalUrl ?? '')
    setSelectedFile(null)
    setError(null)
  }, [visible, resource])

  async function handleSave() {
    if (!resource) return
    setSaving(true)
    setError(null)
    try {
      // 1) Metadata (title + description + externalUrl pour webpage)
      await updateCommercialResource({
        id          : resource.id,
        title,
        description : description || null,
        externalUrl : isWebpage ? (externalUrl || null) : undefined,
      })

      // 2) Upload fichier si non-webpage et fichier sélectionné
      if (!isWebpage && selectedFile) {
        await uploadCommercialResourceFile(resource.id, selectedFile)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UploadResourceModal] save error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  function triggerFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setSelectedFile(f)
  }

  if (!resource) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>
              Modifier : {resource.title}
            </AureakText>

            <View style={s.field}>
              <AureakText style={s.label as never}>Titre</AureakText>
              <TextInput style={s.input} value={title} onChangeText={setTitle} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Description</AureakText>
              <TextInput
                style={[s.input, s.textarea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {isWebpage ? (
              <View style={s.field}>
                <AureakText style={s.label as never}>URL du one-pager</AureakText>
                <TextInput
                  style={s.input}
                  value={externalUrl}
                  onChangeText={setExternalUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={s.field}>
                <AureakText style={s.label as never}>Fichier</AureakText>
                {Platform.OS === 'web' ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <Pressable style={s.filePickerBtn} onPress={triggerFilePicker}>
                      <AureakText style={s.filePickerLabel as never}>
                        {selectedFile ? `📎 ${selectedFile.name}` : 'Choisir un fichier…'}
                      </AureakText>
                    </Pressable>
                    {selectedFile && (
                      <AureakText style={s.fileMeta as never}>
                        Taille : {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Type : {selectedFile.type || 'inconnu'}
                      </AureakText>
                    )}
                    {resource.filePath && !selectedFile && (
                      <AureakText style={s.fileMeta as never}>
                        Fichier actuel : {resource.filePath.split('/').pop()} ({resource.fileSize ? (resource.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '—'})
                      </AureakText>
                    )}
                  </>
                ) : (
                  <AureakText style={s.fileMeta as never}>
                    Upload disponible uniquement sur web.
                  </AureakText>
                )}
              </View>
            )}

            {error && <AureakText style={s.error as never}>{error}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={saving}>
                <AureakText style={s.btnCancelLabel as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, saving && s.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <AureakText style={s.btnSubmitLabel as never}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
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
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 600, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
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
  textarea: { minHeight: 60, textAlignVertical: 'top' },

  filePickerBtn: {
    borderWidth      : 1,
    borderStyle      : 'dashed',
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.md,
    backgroundColor  : colors.light.primary,
    alignItems       : 'center',
  },
  filePickerLabel: { color: colors.text.dark, fontSize: 13, fontWeight: '600' },
  fileMeta       : { color: colors.text.subtle, fontSize: 11, marginTop: 4 },

  error   : { color: colors.status.absent, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  btnDisabled: { opacity: 0.5 },
  btnSubmitLabel: { color: colors.light.surface, fontWeight: '700' },
})
