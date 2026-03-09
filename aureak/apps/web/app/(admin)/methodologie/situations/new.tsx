'use client'
// Nouvelle situation pédagogique — formulaire de création
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { createMethodologySituation, listMethodologyThemes } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, transitions, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod,
} from '@aureak/types'
import type { MethodologyTheme } from '@aureak/types'

function Label({ children }: { children: string }) {
  return (
    <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', letterSpacing: 0.8, fontSize: 10, marginBottom: 6, textTransform: 'uppercase' as never }}>
      {children}
    </AureakText>
  )
}

export default function NewSituationPage() {
  const router   = useRouter()
  const tenantId = useAuthStore(s => s.tenantId) ?? ''

  const [title,          setTitle]          = useState('')
  const [method,         setMethod]         = useState<MethodologyMethod | null>(null)
  const [description,    setDescription]    = useState('')
  const [corrections,    setCorrections]    = useState('')
  const [commonMistakes, setCommonMistakes] = useState('')
  const [themeId,        setThemeId]        = useState<string | null>(null)
  const [themes,         setThemes]         = useState<MethodologyTheme[]>([])
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    listMethodologyThemes({ activeOnly: false }).then(setThemes)
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError(null)
    const { data, error: err } = await createMethodologySituation({
      tenantId,
      title         : title.trim(),
      method        : method ?? null,
      description   : description.trim()    || null,
      corrections   : corrections.trim()    || null,
      commonMistakes: commonMistakes.trim() || null,
      themeId       : themeId ?? null,
    })
    setSaving(false)
    if (err || !data) { setError('Erreur lors de la création.'); return }
    router.replace('/methodologie/situations' as never)
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <Pressable onPress={() => router.back()}>
        <AureakText variant="caption" style={{ color: '#66BB6A' }}>← Situations</AureakText>
      </Pressable>

      <AureakText variant="h2">Nouvelle situation</AureakText>

      <View style={s.section}>

        <Label>Titre *</Label>
        <TextInput
          style={[s.input, !title && error ? s.inputError : null]}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex : 1 contre 1, Centre 2e poteau, Relance sous pression…"
          placeholderTextColor={colors.text.muted}
        />

        <Label>Méthode associée</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {METHODOLOGY_METHODS.map(m => {
            const active = method === m
            const color  = methodologyMethodColors[m]
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(active ? null : m)}
                style={{ borderWidth: 1, borderColor: active ? color : colors.border.light, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: active ? color + '20' : 'transparent' }}
              >
                <AureakText variant="caption" style={{ color: active ? color : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>{m}</AureakText>
              </Pressable>
            )
          })}
        </View>

        {/* Thème lié (optionnel) */}
        {themes.length > 0 && (
          <>
            <Label>Thème associé (optionnel)</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {themes.map(t => {
                const active = themeId === t.id
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setThemeId(active ? null : t.id)}
                    style={{ borderWidth: 1, borderColor: active ? '#4FC3F7' : colors.border.light, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: active ? '#4FC3F7' + '20' : 'transparent' }}
                  >
                    <AureakText variant="caption" style={{ color: active ? '#4FC3F7' : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>{t.title}</AureakText>
                  </Pressable>
                )
              })}
            </View>
          </>
        )}

        <Label>Description</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description de la situation de jeu…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
        />

        <Label>Points de correction</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={corrections}
          onChangeText={setCorrections}
          placeholder="Ex : Sortie rapide des appuis, orientation du corps…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
        />

        <Label>Erreurs fréquentes</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={commonMistakes}
          onChangeText={setCommonMistakes}
          placeholder="Ex : Trop de poids sur le pied arrière, mauvaise lecture…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={3}
        />
      </View>

      {error && (
        <AureakText variant="caption" style={{ color: colors.status.attention }}>{error}</AureakText>
      )}

      <View style={s.actions}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
        </Pressable>
        <Pressable
          style={[s.saveBtn, { backgroundColor: '#66BB6A' }, (!title.trim() || saving) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!title.trim() || saving}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Création…' : 'Créer la situation'}
          </AureakText>
        </Pressable>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.md, maxWidth: 700, alignSelf: 'center', width: '100%' },
  section   : { backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, padding: space.lg, gap: space.sm },
  input     : { backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: 10, color: colors.text.dark, fontSize: 13 },
  inputError: { borderColor: colors.status.attention },
  textarea  : { minHeight: 90, textAlignVertical: 'top' as never, paddingTop: 10 },
  actions   : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  cancelBtn : { paddingHorizontal: space.md, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light },
  saveBtn   : { paddingHorizontal: space.lg, paddingVertical: 10, borderRadius: 8 },
})
