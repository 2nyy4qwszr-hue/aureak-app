'use client'
// /methodologie/programmes/new — Création programme (Story 34.1)

import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, Pressable, ActivityIndicator, StyleSheet, TextInput, ScrollView } from 'react-native'
import { Text } from 'tamagui'
import { createProgramme, listAcademySeasons } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius } from '@aureak/theme'
import type { ProgrammeType, AcademySeason } from '@aureak/types'

const STAGE_THEMES = [
  'Tir au but', '1v1', 'Centre', 'Relance', 'Ballon profondeur', 'Phase arrêtée',
  'Communication', 'Performance', 'Technique', 'Décisionnel', 'Intégration',
]

export default function NewProgrammePage() {
  const router   = useRouter()
  const { user } = useAuthStore()
  const tenantId = (user?.app_metadata?.tenant_id as string | undefined) ?? ''

  const [programmeType, setProgrammeType] = useState<ProgrammeType>('academie')
  const [name, setName]                   = useState('')
  const [seasonId, setSeasonId]           = useState('')
  const [theme, setTheme]                 = useState('')
  const [description, setDescription]     = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [seasons, setSeasons]             = useState<AcademySeason[]>([])

  useEffect(() => {
    listAcademySeasons().then(({ data }) => { if (data) setSeasons(data) }).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return }
    if (!tenantId)    { setError('Tenant introuvable.'); return }
    setSaving(true)
    try {
      await createProgramme({
        tenantId,
        name          : name.trim(),
        programmeType,
        seasonId      : seasonId || null,
        theme         : programmeType === 'stage' ? (theme.trim() || null) : null,
        description   : description.trim() || null,
      })
      router.push('/methodologie/programmes' as never)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[NewProgramme] save:', err)
      setError('Erreur lors de la création du programme.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.light.primary }}>
      <View style={styles.page}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <Text color={colors.text.muted} fontSize={14}>← Retour</Text>
        </Pressable>
        <Text fontSize={22} fontWeight="700" color={colors.text.primary} style={{ marginBottom: 16 }}>
          Nouveau programme
        </Text>

        <View style={styles.card}>
          {/* Type */}
          <Text style={styles.label}>Type de programme *</Text>
          <View style={styles.typeRow}>
            {(['academie', 'stage'] as ProgrammeType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setProgrammeType(t)}
                style={[
                  styles.typeBtn,
                  programmeType === t && {
                    borderColor    : t === 'academie' ? colors.accent.gold : colors.border.dark,
                    backgroundColor: t === 'academie' ? colors.accent.gold : colors.light.hover,
                  },
                ]}
              >
                <Text fontWeight="600" color={programmeType === t && t === 'academie' ? '#000' : colors.text.primary}>
                  {t === 'academie' ? '🏆 Académie' : '⚡ Stage'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Nom */}
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={programmeType === 'academie' ? 'ex: Académie 2025-2026' : 'ex: Stage Tir au but Mars 2026'}
            style={styles.input}
          />

          {/* Saison */}
          {seasons.length > 0 && (
            <>
              <Text style={styles.label}>Saison</Text>
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                style={webSelectStyle}
              >
                <option value="">— Aucune saison —</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </>
          )}

          {/* Thème Stage */}
          {programmeType === 'stage' && (
            <>
              <Text style={styles.label}>Thème du stage</Text>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={webSelectStyle}
              >
                <option value="">— Choisir un thème —</option>
                {STAGE_THEMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="__custom__">Autre…</option>
              </select>
              {theme === '__custom__' && (
                <TextInput
                  value={theme === '__custom__' ? '' : theme}
                  onChangeText={setTheme}
                  placeholder="Thème libre…"
                  style={[styles.input, { marginTop: 8 }]}
                />
              )}
            </>
          )}

          {/* Description */}
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Objectifs, contexte…"
            multiline
            numberOfLines={3}
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
          />

          {error ? <Text color={colors.accent.red} fontSize={14} style={{ marginTop: 8 }}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable onPress={() => router.back()} style={{ padding: 12 }}>
              <Text color={colors.text.muted}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} disabled={saving} style={[styles.btnPrimary, saving && { opacity: 0.6 }]}>
              {saving
                ? <ActivityIndicator size="small" color="#000" />
                : <Text color="#000" fontWeight="600">Créer le programme</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const webSelectStyle: React.CSSProperties = {
  backgroundColor: colors.light.elevated,
  border         : `1px solid ${colors.border.light}`,
  borderRadius   : radius.button,
  padding        : '10px 14px',
  fontSize       : 15,
  color          : colors.text.primary,
  width          : '100%',
  marginBottom   : 12,
}

const styles = StyleSheet.create({
  page    : { padding: 20, maxWidth: 640 },
  card    : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : 20,
    boxShadow      : shadows.sm,
    gap            : 4,
  } as never,
  label     : { fontSize: 13, fontWeight: '600', color: colors.text.muted, marginTop: 16, marginBottom: 6 },
  typeRow   : { flexDirection: 'row', gap: 12 },
  typeBtn   : {
    flex           : 1, padding: 12, borderRadius: radius.button,
    backgroundColor: colors.light.elevated,
    borderWidth    : 2, borderColor: 'transparent',
    alignItems     : 'center',
  },
  input     : {
    backgroundColor: colors.light.elevated,
    borderWidth    : 1, borderColor: colors.border.light,
    borderRadius   : radius.button,
    padding        : 10, fontSize: 15,
    color          : colors.text.primary,
  },
  actions   : { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  btnPrimary: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius   : radius.button,
  },
})
