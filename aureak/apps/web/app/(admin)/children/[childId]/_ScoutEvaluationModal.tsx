'use client'
// Story 89.2 — Modale d'évaluation scout sur un gardien prospect
// Formulaire rapide : 1-5 étoiles + commentaire + contexte d'observation + date.
// Création (initialValue undefined) OU édition (initialValue défini, fenêtre 24h).
// Les règles 24h + auteur sont gardées côté RLS DB (double garde-fou).

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { AureakText, StarRating } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import {
  createScoutEvaluation,
  updateScoutEvaluation,
} from '@aureak/api-client'
import type {
  ScoutObservationContext,
  ProspectScoutEvaluation,
} from '@aureak/types'

// ── Options contexte d'observation ─────────────────────────────────────────────

const CONTEXTS: { value: ScoutObservationContext; label: string }[] = [
  { value: 'match',             label: 'Match'              },
  { value: 'tournoi',           label: 'Tournoi'            },
  { value: 'entrainement_club', label: 'Entraînement club'  },
  { value: 'autre',             label: 'Autre'              },
]

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  visible      : boolean
  onClose      : () => void
  onSaved      : () => void
  childId      : string
  tenantId     : string
  childName    : string
  initialValue?: ProspectScoutEvaluation   // undefined = création ; défini = édition
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ScoutEvaluationModal({
  visible, onClose, onSaved, childId, tenantId, childName, initialValue,
}: Props) {
  const [rating,  setRating]  = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [ctx,     setCtx]     = useState<ScoutObservationContext | null>(null)
  const [date,    setDate]    = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [saving,  setSaving]  = useState<boolean>(false)
  const [error,   setError]   = useState<string | null>(null)

  // Reset à chaque ouverture — pré-remplissage si édition
  useEffect(() => {
    if (!visible) return
    setRating (initialValue?.ratingStars        ?? 0)
    setComment(initialValue?.comment            ?? '')
    setCtx    (initialValue?.observationContext ?? null)
    setDate   (initialValue?.observationDate    ?? new Date().toISOString().slice(0, 10))
    setError(null)
  }, [visible, initialValue])

  const today = new Date().toISOString().slice(0, 10)

  async function handleSave() {
    setError(null)
    if (rating === 0) {
      setError('Sélectionne une note de 1 à 5 étoiles.')
      return
    }
    if (date && date > today) {
      setError("La date d'observation ne peut pas être future.")
      return
    }

    setSaving(true)
    try {
      if (initialValue) {
        await updateScoutEvaluation(initialValue.id, {
          ratingStars       : rating,
          comment           : comment.trim() ? comment.trim() : null,
          observationContext: ctx,
          observationDate   : date || null,
        })
      } else {
        await createScoutEvaluation({
          tenantId,
          childId,
          ratingStars       : rating,
          comment           : comment.trim() ? comment.trim() : null,
          observationContext: ctx,
          observationDate   : date || null,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluationModal] save error:', err)
      setError("Échec de l'enregistrement — réessayez")
    } finally {
      setSaving(false)
    }
  }

  const charCount = comment.length
  const isEdit    = !!initialValue

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <View style={s.dialog} onStartShouldSetResponder={() => true}>
          <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md }}>
            {/* En-tête */}
            <View>
              <AureakText variant="h3" style={{ color: colors.text.dark }}>
                {isEdit ? 'Modifier l\'évaluation' : 'Évaluation scout'}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
                {childName}
              </AureakText>
            </View>

            {/* Étoiles — obligatoire */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Note (1–5) *</AureakText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 }}>
                <StarRating value={rating} onChange={setRating} size={32} />
                {rating > 0 && (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {rating} / 5
                  </AureakText>
                )}
              </View>
            </View>

            {/* Commentaire */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Commentaire (optionnel)</AureakText>
              <TextInput
                value={comment}
                onChangeText={(v) => setComment(v.slice(0, 1000))}
                placeholder="Observations, points forts, axes de travail…"
                placeholderTextColor={colors.text.muted}
                multiline
                maxLength={1000}
                style={[s.input, { minHeight: 72, textAlignVertical: 'top' as never, paddingTop: 8 }]}
              />
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, textAlign: 'right' as never }}>
                {charCount}/1000
              </AureakText>
            </View>

            {/* Contexte d'observation — radio-pills */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Contexte d'observation (optionnel)</AureakText>
              <View style={s.pillsWrap}>
                {CONTEXTS.map((c) => {
                  const active = ctx === c.value
                  return (
                    <Pressable
                      key={c.value}
                      onPress={() => setCtx(active ? null : c.value)}
                      style={[s.pill, active ? s.pillActive : s.pillInactive]}
                    >
                      <AureakText
                        variant="caption"
                        style={{
                          color     : active ? '#fff' : colors.text.dark,
                          fontWeight: '600' as never,
                        }}
                      >
                        {c.label}
                      </AureakText>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Date d'observation — web-only <input type="date"> */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Date d'observation (optionnel)</AureakText>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width           : '100%',
                  padding         : '8px 10px',
                  borderRadius    : 6,
                  border          : `1px solid ${colors.border.light}`,
                  backgroundColor : colors.light.muted,
                  fontSize        : 13,
                  color           : colors.text.dark,
                  fontFamily      : 'inherit',
                }}
              />
            </View>

            {/* Erreur inline */}
            {error && (
              <View style={s.errorBanner}>
                <AureakText variant="caption" style={{ color: colors.status.errorText }}>
                  {error}
                </AureakText>
              </View>
            )}

            {/* Actions */}
            <View style={s.actions}>
              <Pressable
                style={s.cancelBtn}
                onPress={onClose}
                disabled={saving}
              >
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.submitBtn, (saving || rating === 0) && { opacity: 0.55 }]}
                onPress={handleSave}
                disabled={saving || rating === 0}
              >
                <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' as never }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay       : {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.xl,
  },
  dialog        : {
    width          : '100%',
    maxWidth       : 520,
    maxHeight      : '90%' as never,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    overflow       : 'hidden',
    shadowColor    : '#000',
    shadowOffset   : { width: 0, height: 2 },
    shadowOpacity  : 0.10,
    shadowRadius   : 10,
    elevation      : 5,
  },
  field         : { gap: 4 },
  label         : { color: colors.text.muted, fontSize: 11, fontWeight: '700' as never, letterSpacing: 0.5, textTransform: 'uppercase' as never },
  input         : {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 8,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  pillsWrap     : {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
    marginTop    : 4,
  },
  pill          : {
    paddingHorizontal: space.sm,
    paddingVertical  : 6,
    borderRadius     : radius.badge,
    borderWidth      : 1,
  },
  pillActive    : {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  pillInactive  : {
    backgroundColor: colors.light.muted,
    borderColor    : colors.border.light,
  },
  errorBanner   : {
    backgroundColor: colors.status.errorBg,
    borderRadius   : radius.xs,
    padding        : space.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.errorText,
  },
  actions       : {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : space.sm,
    marginTop     : space.xs,
  },
  cancelBtn     : {
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  submitBtn     : {
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
})
