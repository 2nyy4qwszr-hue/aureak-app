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
  updateSituationGradeLevel,
  getMethodologySituation,
  updateMethodologySituation,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Situation, SituationCriterion, SituationThemeLink, Theme, CoachGradeLevel, MethodologySituation, DiagramData } from '@aureak/types'
import TacticalEditor from '../../_components/TacticalEditor'

// Détecte si le param ressemble à un UUID (MethodologySituation) ou une situationKey (ancien système)
function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) || /^[a-z0-9]{20,}$/i.test(s)
}

const GRADE_OPTIONS: { value: CoachGradeLevel; label: string }[] = [
  { value: 'bronze',   label: 'Bronze' },
  { value: 'silver',   label: 'Argent' },
  { value: 'gold',     label: 'Or' },
  { value: 'platinum', label: 'Platine' },
]

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg },
  section: { gap: space.md },
  metaRow: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  metaItem: { gap: space.xs },
  card: {
    backgroundColor: colors.light.surface, borderRadius: 8,
    padding: space.md, borderWidth: 1, borderColor: colors.border.light,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  addRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  errorBanner: {
    backgroundColor: colors.light.muted, borderLeftWidth: 3,
    borderLeftColor: colors.status.absent, borderRadius: 4, padding: space.md,
  },
  successBanner: {
    backgroundColor: colors.light.muted, borderLeftWidth: 3,
    borderLeftColor: colors.status.present, borderRadius: 4, padding: space.md,
  },
  themeChip: {
    paddingHorizontal: space.sm, paddingVertical: space.xs,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border.light,
    cursor: 'pointer' as never,
  },
  themeChipLinked: { borderColor: colors.accent.gold, backgroundColor: colors.light.muted },
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
  const [gradeLevel, setGradeLevel] = useState<CoachGradeLevel>('bronze')
  const [gradeSaving, setGradeSaving] = useState(false)

  // Story 58-2 — Schéma tactique pour MethodologySituation
  const [methodologySituation, setMethodologySituation] = useState<MethodologySituation | null>(null)
  const [diagramData,          setDiagramData]          = useState<DiagramData | null>(null)
  const [savingDiagram,        setSavingDiagram]        = useState(false)

  const fetchData = async () => {
    if (!situationKey) return
    setLoading(true)
    try {
      // Story 58-2 — chargement MethodologySituation si param est un UUID
      if (isUUID(situationKey)) {
        const ms = await getMethodologySituation(situationKey)
        setMethodologySituation(ms)
        setDiagramData(ms?.diagramJson ?? null)
        return
      }
      const { data: s } = await getSituationByKey(situationKey)
      setSituation(s)
      if (s) {
        // required_grade_level is snake_case from Supabase (no mapper in situations.ts)
        setGradeLevel(((s as unknown as Record<string, unknown>).required_grade_level as CoachGradeLevel) ?? 'bronze')
        const [{ data: crit }, { data: links }, { data: themes }] = await Promise.all([
          listSituationCriteria(s.id),
          listThemeLinksForSituation(s.id),
          listThemes(),
        ])
        setCriteria(crit)
        setLinkedThemeIds(new Set((links as SituationThemeLink[]).map((l) => l.themeId)))
        setAllThemes(themes)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDiagram = async (data: DiagramData) => {
    if (!methodologySituation) return
    setSavingDiagram(true)
    try {
      const { error } = await updateMethodologySituation(methodologySituation.id, { diagramJson: data })
      if (error && process.env.NODE_ENV !== 'production')
        console.error('[SituationPage] saveDiagram error:', error)
    } finally {
      setSavingDiagram(false)
    }
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

  const handleSaveGrade = async (newGrade: CoachGradeLevel) => {
    if (!situation) return
    setGradeLevel(newGrade)
    setGradeSaving(true)
    try {
      const { error: err } = await updateSituationGradeLevel(situation.id, newGrade)
      if (err) setError('Erreur lors de la mise à jour du grade.')
    } finally {
      setGradeSaving(false)
    }
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
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      </View>
    )
  }

  // Story 58-2 — Vue MethodologySituation (UUID route)
  if (methodologySituation) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
        <AureakText variant="h2">{methodologySituation.title}</AureakText>
        {methodologySituation.description && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>{methodologySituation.description}</AureakText>
        )}

        {/* Section schéma tactique */}
        <View style={styles.section}>
          <AureakText variant="label">Schéma tactique</AureakText>
          <TacticalEditor
            value={diagramData}
            onChange={d => setDiagramData(d)}
          />
          <AureakButton
            label={savingDiagram ? 'Enregistrement...' : 'Enregistrer le schéma'}
            onPress={() => { if (diagramData) handleSaveDiagram(diagramData) }}
            variant="primary"
          />
        </View>
      </ScrollView>
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
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Clé</AureakText>
            <AureakText variant="body">{situation.situationKey}</AureakText>
          </View>
          <View style={styles.metaItem}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Version</AureakText>
            <AureakText variant="body">v{situation.version}</AureakText>
          </View>
        </View>
        {situation.description && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            {situation.description}
          </AureakText>
        )}
        <AureakButton label="Créer une nouvelle version" onPress={handleNewVersion} variant="secondary" />
      </View>

      {/* Grade minimum requis (Story 11.2) */}
      <View style={styles.section}>
        <AureakText variant="label">Grade minimum requis</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          Les coaches avec un grade inférieur ne verront pas cette situation.
          {gradeSaving ? ' Sauvegarde...' : ''}
        </AureakText>
        <View style={{ flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' }}>
          {GRADE_OPTIONS.map((g) => (
            <View
              key={g.value}
              style={[
                styles.themeChip,
                gradeLevel === g.value && styles.themeChipLinked,
              ]}
              onTouchEnd={() => handleSaveGrade(g.value)}
            >
              <AureakText
                variant="caption"
                style={{ color: gradeLevel === g.value ? colors.accent.gold : colors.text.muted }}
              >
                {g.label}
              </AureakText>
            </View>
          ))}
        </View>
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
          <AureakText variant="body" style={{ color: colors.text.muted }}>Aucun critère.</AureakText>
        )}
      </View>

      {/* Thèmes liés */}
      {allThemes.length > 0 && (
        <View style={styles.section}>
          <AureakText variant="label">Thèmes liés</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
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
                  style={{ color: linkedThemeIds.has(theme.id) ? colors.accent.gold : colors.text.muted }}
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
