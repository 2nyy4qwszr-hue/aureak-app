'use client'
// Nouveau thème pédagogique — formulaire de création
import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { createMethodologyTheme } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, METHODOLOGY_METHOD_COLOR,
  type MethodologyMethod,
} from '@aureak/types'

function Label({ children }: { children: string }) {
  return (
    <AureakText variant="caption" style={{ color: colors.text.secondary, fontWeight: '700', letterSpacing: 0.8, fontSize: 10, marginBottom: 6, textTransform: 'uppercase' as never }}>
      {children}
    </AureakText>
  )
}

export default function NewThemePage() {
  const router   = useRouter()
  const tenantId = useAuthStore(s => s.tenantId) ?? ''

  const [title,          setTitle]          = useState('')
  const [bloc,           setBloc]           = useState('')
  const [method,         setMethod]         = useState<MethodologyMethod | null>(null)
  const [description,    setDescription]    = useState('')
  const [corrections,    setCorrections]    = useState('')
  const [coachingPoints, setCoachingPoints] = useState('')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const handleSave = async () => {
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError(null)
    const { data, error: err } = await createMethodologyTheme({
      tenantId,
      title         : title.trim(),
      bloc          : bloc.trim()           || null,
      method        : method ?? null,
      description   : description.trim()    || null,
      corrections   : corrections.trim()    || null,
      coachingPoints: coachingPoints.trim() || null,
    })
    setSaving(false)
    if (err || !data) { setError('Erreur lors de la création.'); return }
    router.replace('/methodologie/themes' as never)
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <Pressable onPress={() => router.back()}>
        <AureakText variant="caption" style={{ color: '#4FC3F7' }}>← Thèmes</AureakText>
      </Pressable>

      <AureakText variant="h2">Nouveau thème</AureakText>

      <View style={s.section}>

        <Label>Titre *</Label>
        <TextInput
          style={[s.input, !title && error ? s.inputError : null]}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex : Prise de balle, Relance, Centres…"
          placeholderTextColor={colors.text.secondary}
        />

        <Label>Bloc pédagogique</Label>
        <TextInput
          style={s.input}
          value={bloc}
          onChangeText={setBloc}
          placeholder="Ex : Tir au but, 1vs1, Relance, Profondeur…"
          placeholderTextColor={colors.text.secondary}
        />
        <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11, marginTop: -4 }}>
          Regroupe les thèmes par bloc dans le sélecteur de séance. Laisser vide si non applicable.
        </AureakText>

        <Label>Méthode associée</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {METHODOLOGY_METHODS.map(m => {
            const active = method === m
            const color  = METHODOLOGY_METHOD_COLOR[m]
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(active ? null : m)}
                style={{ borderWidth: 1, borderColor: active ? color : colors.accent.zinc, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: active ? color + '20' : 'transparent' }}
              >
                <AureakText variant="caption" style={{ color: active ? color : colors.text.secondary, fontWeight: active ? '700' : '400', fontSize: 12 }}>{m}</AureakText>
              </Pressable>
            )
          })}
        </View>
        <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11, marginTop: -4 }}>Laisser vide = applicable à toutes les méthodes</AureakText>

        <Label>Description</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description du thème, contexte pédagogique…"
          placeholderTextColor={colors.text.secondary}
          multiline
          numberOfLines={4}
        />

        <Label>Points de correction clés</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={corrections}
          onChangeText={setCorrections}
          placeholder="Ex : Regarder dans la direction de relance avant la réception…"
          placeholderTextColor={colors.text.secondary}
          multiline
          numberOfLines={4}
        />

        <Label>Points d'attention coach</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={coachingPoints}
          onChangeText={setCoachingPoints}
          placeholder="Ex : Observer la posture du gardien au moment du contact…"
          placeholderTextColor={colors.text.secondary}
          multiline
          numberOfLines={3}
        />
      </View>

      {error && (
        <AureakText variant="caption" style={{ color: colors.status.attention }}>{error}</AureakText>
      )}

      <View style={s.actions}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()}>
          <AureakText variant="caption" style={{ color: colors.text.secondary }}>Annuler</AureakText>
        </Pressable>
        <Pressable
          style={[s.saveBtn, { backgroundColor: '#4FC3F7' }, (!title.trim() || saving) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!title.trim() || saving}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Création…' : 'Créer le thème'}
          </AureakText>
        </Pressable>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.background.primary },
  content   : { padding: space.lg, gap: space.md, maxWidth: 700, alignSelf: 'center', width: '100%' },
  section   : { backgroundColor: colors.background.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.accent.zinc, padding: space.lg, gap: space.sm },
  input     : { backgroundColor: colors.background.elevated, borderWidth: 1, borderColor: colors.accent.zinc, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: 10, color: colors.text.primary, fontSize: 13 },
  inputError: { borderColor: colors.status.attention },
  textarea  : { minHeight: 90, textAlignVertical: 'top' as never, paddingTop: 10 },
  actions   : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  cancelBtn : { paddingHorizontal: space.md, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.accent.zinc },
  saveBtn   : { paddingHorizontal: space.lg, paddingVertical: 10, borderRadius: 8 },
})
