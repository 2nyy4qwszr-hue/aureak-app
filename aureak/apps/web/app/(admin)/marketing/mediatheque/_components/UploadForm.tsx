'use client'
// Story 91.2 — Formulaire upload coach (titre + description + fichier image/vidéo)
import React, { useRef, useState } from 'react'
import { View, StyleSheet, Pressable, TextInput, Platform, Image } from 'react-native'
import { uploadMediaItem } from '@aureak/api-client'
import type { MediaFileType } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const MAX_IMAGE_BYTES = 50  * 1024 * 1024   // 50 MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024   // 500 MB

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm']

function detectFileType(file: File): MediaFileType | null {
  if (IMAGE_MIMES.includes(file.type)) return 'image'
  if (VIDEO_MIMES.includes(file.type)) return 'video'
  return null
}

type Props = {
  onSuccess?: () => void
}

export function UploadForm({ onSuccess }: Props) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef                  = useRef<HTMLInputElement | null>(null)

  function triggerFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setError(null)
    if (!f) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }
    const ft = detectFileType(f)
    if (!ft) {
      setError('Format non supporté. Images : JPG, PNG, WebP, GIF. Vidéos : MP4, MOV, WebM.')
      return
    }
    const max = ft === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
    if (f.size > max) {
      setError(`Fichier trop lourd (max ${ft === 'image' ? '50' : '500'} MB)`)
      return
    }
    setSelectedFile(f)
    setPreviewUrl(ft === 'image' ? URL.createObjectURL(f) : null)
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit() {
    setError(null)
    if (!title.trim()) { setError('Le titre est requis'); return }
    if (!selectedFile) { setError('Sélectionne un fichier'); return }
    const ft = detectFileType(selectedFile)
    if (!ft) { setError('Type de fichier non supporté'); return }

    setUploading(true)
    try {
      await uploadMediaItem(selectedFile, {
        title      : title.trim(),
        description: description.trim() || null,
        fileType   : ft,
      })
      resetForm()
      onSuccess?.()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UploadForm] submit error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  if (Platform.OS !== 'web') {
    return (
      <View style={s.card}>
        <AureakText style={s.note as never}>Upload disponible uniquement sur web.</AureakText>
      </View>
    )
  }

  return (
    <View style={s.card}>
      <AureakText variant="h3" style={s.cardTitle as never}>Ajouter un média</AureakText>

      <View style={s.field}>
        <AureakText style={s.label as never}>Titre *</AureakText>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex. Séance U13 — 22 avril"
          editable={!uploading}
        />
      </View>

      <View style={s.field}>
        <AureakText style={s.label as never}>Description</AureakText>
        <TextInput
          style={[s.input, s.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          editable={!uploading}
          placeholder="Optionnelle"
        />
      </View>

      <View style={s.field}>
        <AureakText style={s.label as never}>Fichier * (image ou vidéo)</AureakText>
        <input
          ref={fileInputRef}
          type="file"
          accept={[...IMAGE_MIMES, ...VIDEO_MIMES].join(',')}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        <Pressable style={s.filePickerBtn} onPress={triggerFilePicker} disabled={uploading}>
          <AureakText style={s.filePickerLabel as never}>
            {selectedFile ? `📎 ${selectedFile.name}` : 'Choisir un fichier…'}
          </AureakText>
        </Pressable>
        {selectedFile && (
          <AureakText style={s.fileMeta as never}>
            Taille : {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Type : {selectedFile.type || '—'}
          </AureakText>
        )}
        {previewUrl && (
          <Image source={{ uri: previewUrl }} style={s.preview} resizeMode="cover" />
        )}
      </View>

      {uploading && (
        <View style={s.progressWrap}>
          <View style={s.progressBar}>
            <View style={s.progressFill} />
          </View>
          <AureakText style={s.progressLabel as never}>Upload en cours…</AureakText>
        </View>
      )}

      {error && <AureakText style={s.error as never}>{error}</AureakText>}

      <View style={s.actions}>
        <Pressable
          style={[s.btnSubmit, (uploading || !selectedFile || !title.trim()) && s.btnDisabled]}
          onPress={handleSubmit}
          disabled={uploading || !selectedFile || !title.trim()}
        >
          <AureakText style={s.btnSubmitLabel as never}>
            {uploading ? 'Envoi…' : 'Soumettre pour validation'}
          </AureakText>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.md,
  },
  cardTitle: { color: colors.text.dark, fontWeight: '700' },
  note     : { color: colors.text.muted },
  field    : { gap: space.xs },
  label    : { color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 },
  input    : {
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
  preview: {
    marginTop   : space.sm,
    width       : '100%',
    height      : 200,
    borderRadius: radius.xs,
    backgroundColor: colors.light.hover,
  },
  progressWrap: { gap: space.xs },
  progressBar: {
    height         : 4,
    backgroundColor: colors.border.light,
    borderRadius   : 2,
    overflow       : 'hidden',
  },
  progressFill: {
    height         : '100%',
    width          : '60%',
    backgroundColor: colors.accent.gold,
  },
  progressLabel: { color: colors.text.muted, fontSize: 11 },
  error   : { color: colors.status.errorText, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  btnSubmit: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  btnDisabled   : { opacity: 0.5 },
  btnSubmitLabel: { color: colors.light.surface, fontWeight: '700' },
})
