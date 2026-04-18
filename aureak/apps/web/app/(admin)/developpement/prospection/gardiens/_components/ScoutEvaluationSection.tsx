// Story 89.3 — Section évaluations scout dans la fiche gardien prospect
'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { View, Pressable, StyleSheet, TextInput } from 'react-native'
import { AureakText } from '@aureak/ui'
import { StarRating } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import {
  listScoutEvaluations,
  createScoutEvaluation,
} from '@aureak/api-client'
import type { ScoutEvaluationWithScout, ScoutEvaluationCriteria } from '@aureak/types'

const CRITERIA_LABELS: Record<keyof ScoutEvaluationCriteria, string> = {
  reflexes       : 'Réflexes',
  positionnement : 'Positionnement',
  jeuAuPied      : 'Jeu au pied',
  communication  : 'Communication',
  mental         : 'Mental',
}

const CRITERIA_KEYS = Object.keys(CRITERIA_LABELS) as (keyof ScoutEvaluationCriteria)[]

const DEFAULT_CRITERIA: ScoutEvaluationCriteria = {
  reflexes       : 3,
  positionnement : 3,
  jeuAuPied      : 3,
  communication  : 3,
  mental         : 3,
}

type Props = {
  childId  : string
  tenantId : string
}

export function ScoutEvaluationSection({ childId, tenantId }: Props) {
  const [evaluations, setEvaluations] = useState<ScoutEvaluationWithScout[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)

  // Form state
  const [rating, setRating]       = useState(3)
  const [criteria, setCriteria]   = useState<ScoutEvaluationCriteria>({ ...DEFAULT_CRITERIA })
  const [notes, setNotes]         = useState('')

  const fetchEvals = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listScoutEvaluations(childId)
      setEvaluations(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluationSection] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { fetchEvals() }, [fetchEvals])

  const handleSubmit = useCallback(async () => {
    setSaving(true)
    try {
      await createScoutEvaluation({
        childId,
        rating,
        notes: notes.trim() || undefined,
        criteria,
      }, tenantId)
      // Reset form
      setRating(3)
      setCriteria({ ...DEFAULT_CRITERIA })
      setNotes('')
      setShowForm(false)
      await fetchEvals()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluationSection] create error:', err)
    } finally {
      setSaving(false)
    }
  }, [childId, tenantId, rating, notes, criteria, fetchEvals])

  const updateCriterion = useCallback((key: keyof ScoutEvaluationCriteria, value: number) => {
    setCriteria(prev => ({ ...prev, [key]: value }))
  }, [])

  const averageCriteria = (c: ScoutEvaluationCriteria): string => {
    const vals = CRITERIA_KEYS.map(k => c[k])
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return avg.toFixed(1)
  }

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <AureakText variant="h3" style={styles.sectionTitle}>Évaluations scout</AureakText>
        <Pressable style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <AureakText style={styles.addBtnText}>
            {showForm ? 'Annuler' : '+ Ajouter une évaluation'}
          </AureakText>
        </Pressable>
      </View>

      {/* Add form */}
      {showForm && (
        <View style={styles.formCard}>
          {/* Note globale */}
          <View style={styles.formRow}>
            <AureakText variant="body" style={styles.formLabel}>Note globale</AureakText>
            <StarRating value={rating} onChange={setRating} size={28} />
          </View>

          {/* Critères */}
          <AureakText variant="body" style={[styles.formLabel, { marginTop: space.md }] as never}>
            Critères détaillés
          </AureakText>
          {CRITERIA_KEYS.map(key => (
            <View key={key} style={styles.criterionRow}>
              <AureakText style={styles.criterionLabel}>{CRITERIA_LABELS[key]}</AureakText>
              <StarRating
                value={criteria[key]}
                onChange={(v) => updateCriterion(key, v)}
                size={20}
              />
            </View>
          ))}

          {/* Notes texte */}
          <AureakText variant="body" style={[styles.formLabel, { marginTop: space.md }] as never}>
            Notes
          </AureakText>
          <TextInput
            style={styles.textArea as never}
            placeholder="Observations, points forts, axes d'amélioration..."
            placeholderTextColor={colors.text.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, saving && styles.submitBtnDisabled] as never}
            onPress={handleSubmit}
            disabled={saving}
          >
            <AureakText style={styles.submitBtnText}>
              {saving ? 'Enregistrement...' : 'Enregistrer l\'évaluation'}
            </AureakText>
          </Pressable>
        </View>
      )}

      {/* List */}
      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted } as never}>
          Chargement...
        </AureakText>
      ) : evaluations.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="body" style={{ color: colors.text.muted } as never}>
            Aucune évaluation pour ce gardien.
          </AureakText>
        </View>
      ) : (
        evaluations.map(ev => (
          <View key={ev.id} style={styles.evalCard}>
            {/* Header: scout + date + note */}
            <View style={styles.evalHeader}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={styles.scoutName}>
                  {ev.scoutDisplayName}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted } as never}>
                  {new Date(ev.createdAt).toLocaleDateString('fr-BE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </AureakText>
              </View>
              <View style={styles.evalRating}>
                <StarRating value={ev.rating} size={18} />
                <AureakText style={styles.avgText}>
                  Moy. {averageCriteria(ev.criteria)}
                </AureakText>
              </View>
            </View>

            {/* Criteria bars */}
            <View style={styles.criteriaGrid}>
              {CRITERIA_KEYS.map(key => (
                <View key={key} style={styles.criteriaItem}>
                  <AureakText variant="caption" style={styles.criteriaLabel}>
                    {CRITERIA_LABELS[key]}
                  </AureakText>
                  <View style={styles.criteriaBarBg}>
                    <View
                      style={[
                        styles.criteriaBarFill,
                        { width: `${(ev.criteria[key] / 5) * 100}%` },
                      ] as never}
                    />
                  </View>
                  <AureakText variant="caption" style={styles.criteriaValue}>
                    {ev.criteria[key]}/5
                  </AureakText>
                </View>
              ))}
            </View>

            {/* Notes */}
            {ev.notes && (
              <View style={styles.evalNotes}>
                <AureakText variant="body" style={{ color: colors.text.dark, fontSize: 13 } as never}>
                  {ev.notes}
                </AureakText>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginTop: space.xl,
  },
  sectionHeader: {
    flexDirection : 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems    : 'center' as const,
    marginBottom  : space.md,
  },
  sectionTitle: {
    color: colors.text.dark,
  },
  addBtn: {
    backgroundColor  : colors.accent.gold,
    paddingVertical  : space.xs,
    paddingHorizontal: space.md,
    borderRadius     : radius.button,
  },
  addBtnText: {
    color     : colors.text.primary,
    fontSize  : 13,
    fontWeight: '700' as const,
  },

  // Form
  formCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    boxShadow      : shadows.sm,
    padding        : space.lg,
    marginBottom   : space.lg,
  },
  formRow: {
    flexDirection: 'row' as const,
    alignItems   : 'center' as const,
    gap          : space.md,
  },
  formLabel: {
    color     : colors.text.dark,
    fontWeight: '600' as const,
    marginBottom: space.xs,
  },
  criterionRow: {
    flexDirection : 'row' as const,
    alignItems    : 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  criterionLabel: {
    color   : colors.text.dark,
    fontSize: 14,
    flex    : 1,
  },
  textArea: {
    backgroundColor  : colors.light.primary,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    fontSize         : 14,
    color            : colors.text.dark,
    minHeight        : 80,
    textAlignVertical: 'top' as const,
  },
  submitBtn: {
    backgroundColor  : colors.accent.gold,
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.button,
    alignSelf        : 'flex-end' as const,
    marginTop        : space.md,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color     : colors.text.primary,
    fontSize  : 14,
    fontWeight: '700' as const,
  },

  // Empty
  emptyState: {
    paddingVertical: space.lg,
    alignItems     : 'center' as const,
  },

  // Eval card
  evalCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    boxShadow      : shadows.sm,
    padding        : space.md,
    marginBottom   : space.sm,
  },
  evalHeader: {
    flexDirection: 'row' as const,
    alignItems   : 'flex-start' as const,
    marginBottom : space.sm,
  },
  scoutName: {
    color     : colors.text.dark,
    fontWeight: '600' as const,
    fontSize  : 14,
  },
  evalRating: {
    alignItems: 'flex-end' as const,
    gap       : 4,
  },
  avgText: {
    color   : colors.text.muted,
    fontSize: 12,
  },

  // Criteria grid
  criteriaGrid: {
    gap: space.xs,
  },
  criteriaItem: {
    flexDirection: 'row' as const,
    alignItems   : 'center' as const,
    gap          : space.sm,
  },
  criteriaLabel: {
    color   : colors.text.muted,
    fontSize: 12,
    width   : 100,
  },
  criteriaBarBg: {
    flex           : 1,
    height         : 6,
    backgroundColor: colors.light.muted,
    borderRadius   : 3,
    overflow       : 'hidden' as const,
  },
  criteriaBarFill: {
    height         : 6,
    backgroundColor: colors.accent.gold,
    borderRadius   : 3,
  },
  criteriaValue: {
    color   : colors.text.dark,
    fontSize: 12,
    width   : 28,
    textAlign: 'right' as const,
  },

  // Notes
  evalNotes: {
    marginTop       : space.sm,
    paddingTop      : space.sm,
    borderTopWidth  : 1,
    borderTopColor  : colors.border.light,
  },
})
