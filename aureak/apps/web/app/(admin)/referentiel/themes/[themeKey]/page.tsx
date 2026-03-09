import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getThemeByKey,
  createNewThemeVersion,
  createThemeSequence,
  listSequencesByTheme,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Theme, ThemeSequence } from '@aureak/types'

const LEVEL_LABEL: Record<string, string> = {
  debutant     : 'Débutant',
  intermediaire: 'Intermédiaire',
  avance       : 'Avancé',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  section: {
    gap: space.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: space.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    gap: space.xs,
  },
  seqCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: space.sm,
  },
  errorBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
  successBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.present,
    borderRadius: 4,
    padding: space.md,
  },
})

export default function ThemeDetailPage() {
  const { themeKey } = useLocalSearchParams<{ themeKey: string }>()
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [theme, setTheme] = useState<Theme | null>(null)
  const [sequences, setSequences] = useState<ThemeSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [newSeqName, setNewSeqName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    if (!themeKey) return
    setLoading(true)
    const { data: t } = await getThemeByKey(themeKey)
    setTheme(t)
    if (t) {
      const { data: seqs } = await listSequencesByTheme(t.id)
      setSequences(seqs)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [themeKey])

  const handleAddSequence = async () => {
    if (!newSeqName.trim() || !theme || !tenantId) return
    setError(null)
    const { error: err } = await createThemeSequence({
      tenantId,
      themeId  : theme.id,
      name     : newSeqName.trim(),
      sortOrder: sequences.length,
    })
    if (err) { setError("Erreur lors de l'ajout de la séquence."); return }
    setNewSeqName('')
    await fetchData()
  }

  const handleNewVersion = async () => {
    if (!theme || !tenantId) return
    setError(null)
    setSuccess(null)
    const { error: err } = await createNewThemeVersion({
      themeKey: theme.themeKey,
      tenantId,
    })
    if (err) { setError('Erreur lors de la création de la nouvelle version.'); return }
    setSuccess(`Version ${theme.version + 1} créée.`)
    await fetchData()
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      </View>
    )
  }

  if (!theme) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AureakText variant="body" style={{ color: colors.status.absent }}>Thème introuvable.</AureakText>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      <AureakText variant="h2">{theme.name}</AureakText>

      {error && (
        <View style={styles.errorBanner}>
          <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
        </View>
      )}

      {success && (
        <View style={styles.successBanner}>
          <AureakText variant="body" style={{ color: colors.status.present }}>{success}</AureakText>
        </View>
      )}

      {/* Métadonnées */}
      <View style={styles.section}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Clé</AureakText>
            <AureakText variant="body">{theme.themeKey}</AureakText>
          </View>
          <View style={styles.metaItem}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Version</AureakText>
            <AureakText variant="body">v{theme.version}</AureakText>
          </View>
          {theme.level && (
            <View style={styles.metaItem}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Niveau</AureakText>
              <AureakText variant="body">{LEVEL_LABEL[theme.level] ?? theme.level}</AureakText>
            </View>
          )}
          {theme.ageGroup && (
            <View style={styles.metaItem}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Âge</AureakText>
              <AureakText variant="body">{theme.ageGroup}</AureakText>
            </View>
          )}
        </View>
        {theme.description && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            {theme.description}
          </AureakText>
        )}
        <AureakButton
          label="Créer une nouvelle version"
          onPress={handleNewVersion}
          variant="secondary"
        />
      </View>

      {/* Séquences */}
      <View style={styles.section}>
        <AureakText variant="label">Séquences ({sequences.length})</AureakText>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Input
            value={newSeqName}
            onChangeText={setNewSeqName}
            placeholder="Nom de la séquence"
            autoCapitalize="sentences"
            style={{ flex: 1 }}
          />
          <AureakButton label="Ajouter" onPress={handleAddSequence} variant="primary" />
        </View>
        {sequences.map((seq) => (
          <View key={seq.id} style={styles.seqCard}>
            <View style={{ flex: 1, gap: space.xs }}>
              <AureakText variant="body">{seq.name}</AureakText>
              {seq.description && (
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  {seq.description}
                </AureakText>
              )}
            </View>
            <AureakButton
              label="Critères"
              onPress={() =>
                router.push(
                  `/(admin)/referentiel/themes/${themeKey}/sequences/${seq.id}` as never
                )
              }
              variant="secondary"
            />
          </View>
        ))}
        {sequences.length === 0 && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            Aucune séquence.
          </AureakText>
        )}
      </View>
    </ScrollView>
  )
}
