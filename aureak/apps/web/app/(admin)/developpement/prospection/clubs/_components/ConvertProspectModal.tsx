'use client'
// Story 88.4 + 88.6 — Modale de conversion prospect avec attribution
import React, { useEffect, useState } from 'react'
import { View, Pressable, Modal, ScrollView, TextInput, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  suggestAttribution,
  updateClubProspectStatus,
  saveAttributionResult,
} from '@aureak/api-client'
import type { AttributionSuggestion } from '@aureak/types'

type Props = {
  visible         : boolean
  clubProspectId  : string
  clubName        : string
  onClose         : () => void
  onConverted     : () => void
}

export function ConvertProspectModal({ visible, clubProspectId, clubName, onClose, onConverted }: Props) {
  const [suggestion, setSuggestion] = useState<AttributionSuggestion | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [percentages, setPercentages] = useState<Record<string, number>>({})
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!visible || !clubProspectId) return
    setLoadingSuggestion(true)
    suggestAttribution(clubProspectId)
      .then(s => {
        setSuggestion(s)
        if (s && s.commercials.length > 0) {
          const pct: Record<string, number> = {}
          for (const c of s.commercials) {
            pct[c.commercialId] = c.suggestedPercentage
          }
          setPercentages(pct)
        }
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[ConvertProspectModal] suggest error:', err)
      })
      .finally(() => setLoadingSuggestion(false))

    setNotes('')
    setError(null)
  }, [visible, clubProspectId])

  const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0)

  const handleConvert = async () => {
    if (Object.keys(percentages).length > 0 && totalPercentage !== 100) {
      setError('Le total des pourcentages doit être égal à 100%')
      return
    }

    setSaving(true)
    try {
      await updateClubProspectStatus(clubProspectId, 'converti')

      // Save attribution result if we have percentages
      if (Object.keys(percentages).length > 0) {
        const result: Record<string, unknown> = {
          ruleId : suggestion?.ruleApplied?.id ?? null,
          ruleName: suggestion?.ruleApplied?.ruleName ?? null,
          commercials: suggestion?.commercials.map(c => ({
            commercialId: c.commercialId,
            displayName : c.displayName,
            percentage  : percentages[c.commercialId] ?? 0,
            actionCount : c.actionCount,
          })) ?? [],
          notes,
          convertedAt: new Date().toISOString(),
        }
        await saveAttributionResult(clubProspectId, result)
      }

      onConverted()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ConvertProspectModal] convert error:', err)
      setError('Erreur lors de la conversion')
    } finally {
      setSaving(false)
    }
  }

  const updatePercentage = (commercialId: string, value: number) => {
    setPercentages(prev => ({ ...prev, [commercialId]: value }))
    setError(null)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.modal} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <AureakText variant="h2" style={s.title}>Convertir le prospect</AureakText>
            <AureakText style={s.subtitle}>{clubName}</AureakText>

            {/* Attribution section */}
            {loadingSuggestion ? (
              <AureakText style={s.loadingText}>Calcul de la suggestion...</AureakText>
            ) : suggestion && suggestion.commercials.length > 0 ? (
              <View style={s.attributionSection}>
                <AureakText style={s.sectionLabel}>
                  Répartition du crédit commercial
                </AureakText>
                {suggestion.ruleApplied && (
                  <AureakText style={s.ruleInfo}>
                    Règle appliquée : {suggestion.ruleApplied.ruleName}
                  </AureakText>
                )}

                {suggestion.commercials.map(c => (
                  <View key={c.commercialId} style={s.commercialRow}>
                    <View style={s.commercialInfo}>
                      <AureakText style={s.commercialName}>{c.displayName}</AureakText>
                      <AureakText style={s.commercialActions}>
                        {c.actionCount} action{c.actionCount > 1 ? 's' : ''}
                      </AureakText>
                    </View>
                    <View style={s.percentageInput}>
                      <TextInput
                        style={s.percentageField}
                        value={String(percentages[c.commercialId] ?? 0)}
                        onChangeText={t => {
                          const v = parseInt(t, 10)
                          if (!isNaN(v) && v >= 0 && v <= 100) updatePercentage(c.commercialId, v)
                          else if (t === '') updatePercentage(c.commercialId, 0)
                        }}
                        keyboardType="numeric"
                      />
                      <AureakText style={s.percentageSymbol}>%</AureakText>
                    </View>
                  </View>
                ))}

                <View style={s.totalRow}>
                  <AureakText style={s.totalLabel}>Total</AureakText>
                  <AureakText style={[s.totalValue, totalPercentage !== 100 && s.totalValueError] as never}>
                    {totalPercentage}%
                  </AureakText>
                </View>
              </View>
            ) : (
              <AureakText style={s.noAttribution}>
                Aucune action enregistrée — conversion sans attribution.
              </AureakText>
            )}

            {/* Notes */}
            <AureakText style={s.label}>Notes de conversion</AureakText>
            <TextInput
              style={[s.input, s.inputMultiline] as never}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes optionnelles..."
              placeholderTextColor={colors.text.subtle}
              multiline
              numberOfLines={3}
            />

            {error && <AureakText style={s.error}>{error}</AureakText>}

            {/* Actions */}
            <View style={s.actions}>
              <Pressable style={s.cancelBtn} onPress={onClose}>
                <AureakText style={s.cancelBtnText}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.convertBtn, saving && s.convertBtnDisabled] as never}
                onPress={handleConvert}
                disabled={saving}
              >
                <AureakText style={s.convertBtnText}>
                  {saving ? 'Conversion...' : 'Valider la conversion'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  modal: {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    padding         : space.xl,
    width           : '90%',
    maxWidth        : 520,
    maxHeight       : '85%',
    boxShadow       : shadows.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize    : 14,
    fontFamily  : fonts.body,
    color       : colors.text.muted,
    marginBottom: space.lg,
  },
  loadingText: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
    marginBottom: space.md,
  },
  attributionSection: {
    marginBottom: space.lg,
  },
  sectionLabel: {
    fontSize    : 13,
    fontFamily  : fonts.body,
    fontWeight  : '700',
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  ruleInfo: {
    fontSize    : 11,
    fontFamily  : fonts.body,
    color       : colors.text.subtle,
    marginBottom: space.md,
  },
  commercialRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  commercialInfo: {
    flex: 1,
  },
  commercialName: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  commercialActions: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
  },
  percentageInput: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 4,
  },
  percentageField: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: 8,
    paddingVertical  : 6,
    fontSize         : 14,
    fontFamily       : fonts.body,
    fontWeight       : '700',
    color            : colors.text.dark,
    width            : 60,
    textAlign        : 'center',
    backgroundColor  : colors.light.primary,
  },
  percentageSymbol: {
    fontSize  : 14,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  totalRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    paddingTop    : space.sm,
    marginTop     : space.xs,
  },
  totalLabel: {
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  totalValue: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.status.successText,
  },
  totalValueError: {
    color: colors.status.errorText,
  },
  noAttribution: {
    fontSize    : 13,
    fontFamily  : fonts.body,
    color       : colors.text.subtle,
    fontStyle   : 'italic',
    marginBottom: space.md,
  },
  label: {
    fontSize    : 12,
    fontFamily  : fonts.body,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: space.xs,
  },
  input: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 10,
    fontSize         : 14,
    fontFamily       : fonts.body,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
  inputMultiline: {
    minHeight        : 60,
    textAlignVertical: 'top',
  },
  error: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.status.errorText,
    marginTop : space.sm,
  },
  actions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : space.sm,
    marginTop     : space.xl,
  },
  cancelBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  cancelBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.muted,
  },
  convertBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    backgroundColor  : colors.status.successText,
  },
  convertBtnDisabled: {
    opacity: 0.5,
  },
  convertBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : '#fff',
  },
})
