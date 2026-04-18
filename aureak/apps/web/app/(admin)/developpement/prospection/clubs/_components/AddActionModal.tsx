'use client'
// Story 88.3 — Modale ajout action commerciale (React Hook Form + Zod)
import React, { useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { addProspectAction } from '@aureak/api-client'
import {
  PROSPECT_ACTION_TYPES,
  PROSPECT_ACTION_TYPE_LABELS,
  PROSPECT_ACTION_TYPE_ICONS,
} from '@aureak/types'
import type { ProspectActionType } from '@aureak/types'

const schema = z.object({
  actionType : z.string().min(1, 'Type requis'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

/** Types manuels (on exclut changement_statut qui est automatique) */
const MANUAL_ACTION_TYPES = PROSPECT_ACTION_TYPES.filter(t => t !== 'changement_statut')

type Props = {
  visible: boolean
  clubProspectId: string
  onClose: () => void
  onCreated: () => void
}

export function AddActionModal({ visible, clubProspectId, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { actionType: 'premier_contact', description: '' },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      await addProspectAction({
        clubProspectId,
        actionType : data.actionType as ProspectActionType,
        description: data.description || undefined,
      })
      reset()
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AddActionModal] create error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal as object} onPress={e => e.stopPropagation()}>
        <ScrollView>
          <AureakText variant="h2" style={styles.title}>Ajouter une action</AureakText>

          {/* Type d'action */}
          <AureakText style={styles.label}>Type d'action *</AureakText>
          <Controller
            control={control}
            name="actionType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.pillsRow}>
                {MANUAL_ACTION_TYPES.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.pill, value === t && styles.pillActive]}
                    onPress={() => onChange(t)}
                  >
                    <AureakText style={[styles.pillText, value === t && styles.pillTextActive] as never}>
                      {PROSPECT_ACTION_TYPE_ICONS[t]} {PROSPECT_ACTION_TYPE_LABELS[t]}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          />
          {errors.actionType && <AureakText style={styles.errorText}>{errors.actionType.message}</AureakText>}

          {/* Description */}
          <AureakText style={styles.label}>Description</AureakText>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Details de l'action..."
                placeholderTextColor={colors.text.subtle}
                multiline
                numberOfLines={4}
              />
            )}
          />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => { reset(); onClose() }}>
              <AureakText style={styles.cancelBtnText}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
            >
              <AureakText style={styles.submitBtnText}>
                {saving ? 'Ajout...' : 'Ajouter'}
              </AureakText>
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    right          : 0,
    bottom         : 0,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    zIndex         : 1000,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.xl,
    width          : '100%',
    maxWidth       : 520,
    maxHeight      : '90%',
    boxShadow      : shadows.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.lg,
  },
  label: {
    fontSize    : 12,
    fontFamily  : fonts.body,
    fontWeight  : '600',
    color       : colors.text.dark,
    marginBottom: space.xs,
    marginTop   : space.md,
  },
  input: {
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.xs,
    padding        : space.sm,
    fontSize       : 14,
    fontFamily     : fonts.body,
    color          : colors.text.dark,
    backgroundColor: colors.light.surface,
  },
  textArea: {
    minHeight        : 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize  : 11,
    color     : colors.status.absent,
    fontFamily: fonts.body,
    marginTop : 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical  : 6,
    borderRadius     : 16,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  pillActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  pillText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  pillTextActive: {
    color     : colors.text.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection  : 'row',
    justifyContent : 'flex-end',
    gap            : space.sm,
    marginTop      : space.xl,
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
  submitBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
})
