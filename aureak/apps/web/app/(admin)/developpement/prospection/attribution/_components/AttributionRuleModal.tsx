'use client'
// Story 88.4 — Modale création / édition d'une règle d'attribution
import React, { useState, useEffect } from 'react'
import { View, Pressable, Modal, ScrollView, TextInput, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import type { AttributionRule, CreateAttributionRuleParams, UpdateAttributionRuleParams } from '@aureak/types'

type Props = {
  visible   : boolean
  rule?     : AttributionRule | null
  onClose   : () => void
  onSave    : (params: CreateAttributionRuleParams | UpdateAttributionRuleParams) => Promise<void>
}

export function AttributionRuleModal({ visible, rule, onClose, onSave }: Props) {
  const [ruleName, setRuleName]       = useState('')
  const [description, setDescription] = useState('')
  const [qualifier, setQualifier]     = useState(50)
  const [isDefault, setIsDefault]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const closer = 100 - qualifier
  const isEdit = !!rule

  useEffect(() => {
    if (rule) {
      setRuleName(rule.ruleName)
      setDescription(rule.description)
      setQualifier(rule.percentages.qualifier ?? 50)
      setIsDefault(rule.isDefault)
    } else {
      setRuleName('')
      setDescription('')
      setQualifier(50)
      setIsDefault(false)
    }
    setError(null)
  }, [rule, visible])

  const handleSave = async () => {
    if (!ruleName.trim()) {
      setError('Le nom de la règle est obligatoire')
      return
    }
    if (qualifier < 0 || qualifier > 100) {
      setError('Le pourcentage doit être entre 0 et 100')
      return
    }

    setSaving(true)
    try {
      await onSave({
        ruleName    : ruleName.trim(),
        description : description.trim(),
        percentages : { qualifier, closer },
        isDefault,
      })
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionRuleModal] save error:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.modal} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <AureakText variant="h2" style={s.title}>
              {isEdit ? 'Modifier la règle' : 'Nouvelle règle d\'attribution'}
            </AureakText>

            {/* Nom */}
            <AureakText style={s.label}>Nom de la règle *</AureakText>
            <TextInput
              style={s.input}
              value={ruleName}
              onChangeText={setRuleName}
              placeholder="Ex : Standard 50/50"
              placeholderTextColor={colors.text.subtle}
            />

            {/* Description */}
            <AureakText style={s.label}>Description</AureakText>
            <TextInput
              style={[s.input, s.inputMultiline] as never}
              value={description}
              onChangeText={setDescription}
              placeholder="Description de la règle..."
              placeholderTextColor={colors.text.subtle}
              multiline
              numberOfLines={3}
            />

            {/* Pourcentages */}
            <AureakText style={s.label}>Répartition (%)</AureakText>
            <View style={s.percentageRow}>
              <View style={s.percentageCol}>
                <AureakText style={s.percentageLabel}>Qualificateur</AureakText>
                <TextInput
                  style={s.percentageInput}
                  value={String(qualifier)}
                  onChangeText={t => {
                    const v = parseInt(t, 10)
                    if (!isNaN(v) && v >= 0 && v <= 100) setQualifier(v)
                    else if (t === '') setQualifier(0)
                  }}
                  keyboardType="numeric"
                />
              </View>
              <View style={s.percentageSeparator}>
                <AureakText style={s.percentageSepText}>/</AureakText>
              </View>
              <View style={s.percentageCol}>
                <AureakText style={s.percentageLabel}>Closer</AureakText>
                <View style={s.percentageReadonly}>
                  <AureakText style={s.percentageReadonlyText}>{closer}%</AureakText>
                </View>
              </View>
            </View>

            {/* Bar visuelle */}
            <View style={s.barContainer}>
              <View style={[s.barQualifier, { flex: qualifier || 1 }] as never} />
              <View style={[s.barCloser, { flex: closer || 1 }] as never} />
            </View>
            <View style={s.barLabels}>
              <AureakText style={s.barLabelText}>Qualif. {qualifier}%</AureakText>
              <AureakText style={s.barLabelText}>Closer {closer}%</AureakText>
            </View>

            {/* Défaut */}
            <Pressable style={s.defaultRow} onPress={() => setIsDefault(!isDefault)}>
              <View style={[s.checkbox, isDefault && s.checkboxActive] as never}>
                {isDefault && <AureakText style={s.checkmark}>✓</AureakText>}
              </View>
              <AureakText style={s.defaultLabel}>Définir comme règle par défaut</AureakText>
            </Pressable>

            {error && (
              <AureakText style={s.error}>{error}</AureakText>
            )}

            {/* Actions */}
            <View style={s.actions}>
              <Pressable style={s.cancelBtn} onPress={onClose}>
                <AureakText style={s.cancelBtnText}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.saveBtn, saving && s.saveBtnDisabled] as never}
                onPress={handleSave}
                disabled={saving}
              >
                <AureakText style={s.saveBtnText}>
                  {saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
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
    maxWidth        : 500,
    maxHeight       : '85%',
    boxShadow       : shadows.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.lg,
  },
  label: {
    fontSize    : 12,
    fontFamily  : fonts.body,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: space.xs,
    marginTop   : space.md,
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
    minHeight    : 70,
    textAlignVertical: 'top',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  percentageCol: {
    flex: 1,
  },
  percentageLabel: {
    fontSize    : 11,
    fontFamily  : fonts.body,
    color       : colors.text.muted,
    marginBottom: 4,
  },
  percentageInput: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 8,
    fontSize         : 16,
    fontFamily       : fonts.body,
    fontWeight       : '700',
    color            : colors.text.dark,
    textAlign        : 'center',
    backgroundColor  : colors.light.primary,
  },
  percentageSeparator: {
    paddingTop: 16,
  },
  percentageSepText: {
    fontSize  : 20,
    fontWeight: '300',
    color     : colors.text.subtle,
  },
  percentageReadonly: {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 8,
    backgroundColor  : colors.light.muted,
    alignItems       : 'center',
  },
  percentageReadonlyText: {
    fontSize  : 16,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.muted,
  },
  barContainer: {
    flexDirection: 'row',
    height       : 8,
    borderRadius : 4,
    overflow     : 'hidden',
    marginTop    : space.md,
  },
  barQualifier: {
    backgroundColor: colors.accent.gold,
  },
  barCloser: {
    backgroundColor: colors.status.infoText,
  },
  barLabels: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    marginTop     : 4,
  },
  barLabelText: {
    fontSize  : 10,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    marginTop    : space.lg,
  },
  checkbox: {
    width          : 20,
    height         : 20,
    borderWidth    : 2,
    borderColor    : colors.border.light,
    borderRadius   : 4,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  checkmark: {
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.text.primary,
  },
  defaultLabel: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.dark,
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
  saveBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
})
