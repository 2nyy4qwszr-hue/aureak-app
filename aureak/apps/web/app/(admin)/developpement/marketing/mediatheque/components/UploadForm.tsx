'use client'
// Story 91-2 — Formulaire upload média (coach / admin)
import React, { useState, useRef } from 'react'
import { View, StyleSheet, Pressable, Image } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import { uploadMediaItem } from '@aureak/api-client'

type Props = {
  onUploaded: () => void
}

export function UploadForm({ onUploaded }: Props) {
  const [file, setFile]             = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    // Preview for images
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit() {
    if (!file) { setError('Sélectionnez un fichier'); return }
    if (!title.trim()) { setError('Le titre est requis'); return }

    setUploading(true)
    try {
      await uploadMediaItem({ file, title, description })
      // Reset
      setFile(null)
      setPreview(null)
      setTitle('')
      setDescription('')
      if (inputRef.current) inputRef.current.value = ''
      onUploaded()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UploadForm] upload error:', err)
      setError('Erreur lors de l\'upload. Réessayez.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <AureakText style={styles.heading}>Ajouter un média</AureakText>

      {/* File picker */}
      <Pressable
        style={({ pressed }) => [styles.dropZone, pressed && { opacity: 0.7 }]}
        onPress={() => inputRef.current?.click()}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={styles.previewImg} resizeMode="cover" />
        ) : (
          <View style={styles.dropZoneInner}>
            <AureakText style={styles.dropIcon}>📷</AureakText>
            <AureakText style={styles.dropText}>
              {file ? file.name : 'Cliquez pour sélectionner une image ou vidéo'}
            </AureakText>
          </View>
        )}
      </Pressable>
      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Title */}
      <View style={styles.fieldGroup}>
        <AureakText style={styles.label}>Titre *</AureakText>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du média"
          style={inputStyle}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <AureakText style={styles.label}>Description</AureakText>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description optionnelle"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as never, minHeight: 64 }}
        />
      </View>

      {error && (
        <AureakText style={styles.errorText}>{error}</AureakText>
      )}

      <Pressable
        style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.7 }, uploading && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        <AureakText style={styles.submitText}>
          {uploading ? 'Upload en cours...' : 'Soumettre pour validation'}
        </AureakText>
      </Pressable>
    </View>
  )
}

const inputStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '8px 12px',
  borderRadius : 8,
  border       : `1px solid ${colors.border.light}`,
  fontFamily   : 'inherit',
  fontSize     : 14,
  outline      : 'none',
  boxSizing    : 'border-box',
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    // @ts-ignore — web only
    boxShadow      : shadows.sm,
  },
  heading: {
    fontSize    : 16,
    fontWeight  : '700',
    fontFamily  : fonts.display,
    color       : colors.text.dark,
    marginBottom: space.md,
  },
  dropZone: {
    borderWidth    : 2,
    borderStyle    : 'dashed',
    borderColor    : colors.border.gold,
    borderRadius   : radius.card,
    padding        : space.lg,
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : space.md,
    minHeight      : 120,
    overflow       : 'hidden',
  },
  dropZoneInner: {
    alignItems: 'center',
  },
  dropIcon: {
    fontSize    : 32,
    marginBottom: space.xs,
  },
  dropText: {
    color    : colors.text.muted,
    fontSize : 13,
    textAlign: 'center',
  },
  previewImg: {
    width       : '100%',
    height      : 160,
    borderRadius: radius.xs,
  },
  fieldGroup: {
    marginBottom: space.md,
  },
  label: {
    fontSize    : 12,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: 4,
    fontFamily  : fonts.body,
  },
  errorText: {
    color       : colors.accent.red,
    fontSize    : 13,
    marginBottom: space.sm,
  },
  submitBtn: {
    backgroundColor: colors.accent.gold,
    borderRadius   : radius.button,
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    alignItems     : 'center',
    marginTop      : space.sm,
  },
  submitText: {
    color     : colors.text.primary,
    fontWeight: '700',
    fontSize  : 14,
    fontFamily: fonts.display,
  },
})
