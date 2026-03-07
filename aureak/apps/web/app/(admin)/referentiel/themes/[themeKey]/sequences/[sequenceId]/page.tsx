import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  listCriteriaBySequence,
  listFaultsByCriterion,
  listCuesByFault,
  createCriterion,
  createFault,
  createCue,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Criterion, Fault, Cue } from '@aureak/types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  section: {
    gap: space.md,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    gap: space.sm,
  },
  nestedCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 6,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    gap: space.xs,
    marginLeft: space.md,
  },
  deepCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 4,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    marginLeft: space.lg,
  },
  addRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-end',
  },
  errorBanner: {
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
})

type CriterionWithTree = Criterion & {
  faults: (Fault & { cues: Cue[] })[]
}

export default function SequenceDetailPage() {
  const { sequenceId } = useLocalSearchParams<{ themeKey: string; sequenceId: string }>()
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [tree, setTree] = useState<CriterionWithTree[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add inputs
  const [newCriterionLabel, setNewCriterionLabel] = useState('')
  const [newFaultLabels, setNewFaultLabels] = useState<Record<string, string>>({})
  const [newCueLabels, setNewCueLabels] = useState<Record<string, string>>({})

  const fetchTree = async () => {
    if (!sequenceId) return
    setLoading(true)
    const { data: criteria } = await listCriteriaBySequence(sequenceId)
    const withFaults: CriterionWithTree[] = await Promise.all(
      criteria.map(async (criterion) => {
        const { data: faults } = await listFaultsByCriterion(criterion.id)
        const faultsWithCues = await Promise.all(
          faults.map(async (fault) => {
            const { data: cues } = await listCuesByFault(fault.id)
            return { ...fault, cues }
          })
        )
        return { ...criterion, faults: faultsWithCues }
      })
    )
    setTree(withFaults)
    setLoading(false)
  }

  useEffect(() => { fetchTree() }, [sequenceId])

  const handleAddCriterion = async () => {
    if (!newCriterionLabel.trim() || !sequenceId || !tenantId) return
    setError(null)
    const { error: err } = await createCriterion({
      tenantId,
      sequenceId,
      label    : newCriterionLabel.trim(),
      sortOrder: tree.length,
    })
    if (err) { setError('Erreur lors de l\'ajout du critère.'); return }
    setNewCriterionLabel('')
    await fetchTree()
  }

  const handleAddFault = async (criterionId: string) => {
    const label = newFaultLabels[criterionId]?.trim()
    if (!label || !tenantId) return
    setError(null)
    const { error: err } = await createFault({ tenantId, criterionId, label })
    if (err) { setError('Erreur lors de l\'ajout de la faute.'); return }
    setNewFaultLabels((prev) => ({ ...prev, [criterionId]: '' }))
    await fetchTree()
  }

  const handleAddCue = async (faultId: string) => {
    const label = newCueLabels[faultId]?.trim()
    if (!label || !tenantId) return
    setError(null)
    const { error: err } = await createCue({ tenantId, faultId, label })
    if (err) { setError('Erreur lors de l\'ajout du cue.'); return }
    setNewCueLabels((prev) => ({ ...prev, [faultId]: '' }))
    await fetchTree()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      <AureakText variant="h2">Critères de la séquence</AureakText>

      {error && (
        <View style={styles.errorBanner}>
          <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
        </View>
      )}

      {/* Ajouter un critère */}
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

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      )}

      {/* Arbre critères → fautes → cues */}
      {tree.map((criterion) => (
        <View key={criterion.id} style={styles.card}>
          <AureakText variant="label">{criterion.label}</AureakText>

          {/* Fautes du critère */}
          {criterion.faults.map((fault) => (
            <View key={fault.id} style={styles.nestedCard}>
              <AureakText variant="body" style={{ color: colors.text.secondary }}>
                ⚠ {fault.label}
              </AureakText>

              {/* Cues de la faute */}
              {fault.cues.map((cue) => (
                <View key={cue.id} style={styles.deepCard}>
                  <AureakText variant="caption">→ {cue.label}</AureakText>
                </View>
              ))}

              {/* Ajouter un cue */}
              <View style={styles.addRow}>
                <Input
                  value={newCueLabels[fault.id] ?? ''}
                  onChangeText={(val) => setNewCueLabels((prev) => ({ ...prev, [fault.id]: val }))}
                  placeholder="Nouveau cue..."
                  autoCapitalize="sentences"
                  style={{ flex: 1 }}
                />
                <AureakButton label="+" onPress={() => handleAddCue(fault.id)} variant="ghost" />
              </View>
            </View>
          ))}

          {/* Ajouter une faute */}
          <View style={styles.addRow}>
            <Input
              value={newFaultLabels[criterion.id] ?? ''}
              onChangeText={(val) =>
                setNewFaultLabels((prev) => ({ ...prev, [criterion.id]: val }))
              }
              placeholder="Nouvelle faute..."
              autoCapitalize="sentences"
              style={{ flex: 1 }}
            />
            <AureakButton label="+ Faute" onPress={() => handleAddFault(criterion.id)} variant="secondary" />
          </View>
        </View>
      ))}

      {!loading && tree.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>
          Aucun critère défini.
        </AureakText>
      )}
    </ScrollView>
  )
}
