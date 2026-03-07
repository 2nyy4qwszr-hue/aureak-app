import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSituationByKey,
  createNewSituationVersion,
  createSituationCriterion,
  listSituationCriteria,
  listThemeLinksForSituation,
  linkSituationToTheme,
  unlinkSituationFromTheme,
  listThemes,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Situation, SituationCriterion, SituationThemeLink, Theme } from '@aureak/types'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: space.xl, gap: space.lg },
  section: { gap: space.md },
  metaRow: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  metaItem: { gap: space.xs },
  card: {
    backgroundColor: colors.background.surface, borderRadius: 8,
    padding: space.md, borderWidth: 1, borderColor: colors.accent.zinc,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  addRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  errorBanner: {
    backgroundColor: colors.background.elevated, borderLeftWidth: 3,
    borderLeftColor: colors.status.absent, borderRadius: 4, padding: space.md,
  },
  successBanner: {
    backgroundColor: colors.background.elevated, borderLeftWidth: 3,
    borderLeftColor: colors.status.present, borderRadius: 4, padding: space.md,
  },
  themeChip: {
    paddingHorizontal: space.sm, paddingVertical: space.xs,
    borderRadius: 16, borderWidth: 1, borderColor: colors.accent.zinc,
    cursor: 'pointer' as never,
  },
  themeChipLinked: { borderColor: colors.accent.gold, backgroundColor: colors.background.elevated },
  chipsRow: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
})

export default function SituationDetailPage() {
  const { situationKey } = useLocalSearchParams<{ situationKey: string }>()
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [situation, setSituation] = useState<Situation | null>(null)
  const [criteria, setCriteria] = useState<SituationCriterion[]>([])
  const [linkedThemeIds, setLinkedThemeIds] = useState<Set<string>>(new Set())
  const [allThemes, setAllThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [newCriterionLabel, setNewCriterionLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    if (!situationKey) return
    setLoading(true)
    const { data: s } = await getSituationByKey(situationKey)
    setSituation(s)
    if (s) {
      const [{ data: crit }, { data: links }, { data: themes }] = await Promise.all([
        listSituationCriteria(s.id),
        listThemeLinksForSituation(s.id),
        listThemes(),
      ])
      setCriteria(crit)
      setLinkedThemeIds(new Set((links as SituationThemeLink[]).map((l) => l.themeId)))
      setAllThemes(themes)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [situationKey])

  const handleAddCriterion = async () => {
    if (!newCriterionLabel.trim() || !situation || !tenantId) return
    setError(null)
    const { error: err } = await createSituationCriterion({
      tenantId,
      situationId: situation.id,
      label      : newCriterionLabel.trim(),
      sortOrder  : criteria.length,
    })
    if (err) { setError("Erreur lors de l'ajout du critère."); return }
    setNewCriterionLabel('')
    await fetchData()
  }

  const handleToggleTheme = async (themeId: string) => {
    if (!situation || !tenantId) return
    setError(null)
    if (linkedThemeIds.has(themeId)) {
      await unlinkSituationFromTheme({ situationId: situation.id, themeId })
    } else {
      await linkSituationToTheme({ situationId: situation.id, themeId, tenantId })
    }
    await fetchData()
  }

  const handleNewVersion = async () => {
    if (!situation || !tenantId) return
    setError(null)
    setSuccess(null)
    const { error: err } = await createNewSituationVersion({
      situationKey: situation.situationKey,
      tenantId,
    })
    if (err) { setError('Erreur lors de la création de la nouvelle version.'); return }
    setSuccess(`Version ${situation.version + 1} créée.`)
    await fetchData()
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      </View>
    )
  }

  if (!situation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AureakText variant="body" style={{ color: colors.status.absent }}>Situation introuvable.</AureakText>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      <AureakText variant="h2">{situation.name}</AureakText>

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
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Clé</AureakText>
            <AureakText variant="body">{situation.situationKey}</AureakText>
          </View>
          <View style={styles.metaItem}>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Version</AureakText>
            <AureakText variant="body">v{situation.version}</AureakText>
          </View>
        </View>
        {situation.description && (
          <AureakText variant="body" style={{ color: colors.text.secondary }}>
            {situation.description}
          </AureakText>
        )}
        <AureakButton label="Créer une nouvelle version" onPress={handleNewVersion} variant="secondary" />
      </View>

      {/* Critères d'analyse */}
      <View style={styles.section}>
        <AureakText variant="label">Critères d'analyse ({criteria.length})</AureakText>
        <View style={styles.addRow}>
          <Input
            value={newCriterionLabel}
            onChangeText={setNewCriterionLabel}
            placeholder="Libellé du critère"
            autoCapitalize="sentences"
            style={{ flex: 1 }}
          />
          <AureakButton label="Ajouter" onPress={handleAddCriterion} variant="primary" />
        </View>
        {criteria.map((c) => (
          <View key={c.id} style={styles.card}>
            <AureakText variant="body">{c.label}</AureakText>
          </View>
        ))}
        {criteria.length === 0 && (
          <AureakText variant="body" style={{ color: colors.text.secondary }}>Aucun critère.</AureakText>
        )}
      </View>

      {/* Thèmes liés */}
      {allThemes.length > 0 && (
        <View style={styles.section}>
          <AureakText variant="label">Thèmes liés</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary }}>
            Toucher pour lier / délier
          </AureakText>
          <View style={styles.chipsRow}>
            {allThemes.map((theme) => (
              <View
                key={theme.id}
                style={[styles.themeChip, linkedThemeIds.has(theme.id) && styles.themeChipLinked]}
                onTouchEnd={() => handleToggleTheme(theme.id)}
              >
                <AureakText
                  variant="caption"
                  style={{ color: linkedThemeIds.has(theme.id) ? colors.accent.gold : colors.text.secondary }}
                >
                  {theme.name}
                </AureakText>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}
