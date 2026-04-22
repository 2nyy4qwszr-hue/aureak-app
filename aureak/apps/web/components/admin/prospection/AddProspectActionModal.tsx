'use client'
// Story 88.3 — Modale ajout manuel d'une action (RHF + Zod)
import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addProspectAction } from '@aureak/api-client'
import type { ProspectAction, ProspectActionType } from '@aureak/types'
import { MANUAL_PROSPECT_ACTION_TYPES, PROSPECT_ACTION_TYPE_LABELS, PROSPECT_ACTION_TYPE_ICONS } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  actionType  : z.enum(['premier_contact', 'relance', 'identification_contact', 'obtention_rdv', 'presentation', 'closing', 'note']),
  description : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible        : boolean
  clubProspectId : string
  onClose        : () => void
  onSuccess?     : (action: ProspectAction) => void
}

export function AddProspectActionModal({ visible, clubProspectId, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { actionType: 'premier_contact', description: '' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const action = await addProspectAction({
        clubProspectId,
        actionType  : data.actionType as ProspectActionType,
        description : data.description || undefined,
      })
      onSuccess?.(action)
      reset()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AddProspectActionModal] add error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Ajouter une action</AureakText>

            <View style={s.field}>
              <AureakText style={s.label as never}>Type d'action</AureakText>
              <Controller control={control} name="actionType" render={({ field: { onChange, value } }) => (
                <View style={s.chipRow}>
                  {MANUAL_PROSPECT_ACTION_TYPES.map(t => (
                    <Pressable key={t} onPress={() => onChange(t)} style={[s.chip, value === t && s.chipActive]}>
                      <AureakText style={(value === t ? s.chipTextActive : s.chipText) as never}>
                        {PROSPECT_ACTION_TYPE_ICONS[t]} {PROSPECT_ACTION_TYPE_LABELS[t]}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              )} />
              {errors.actionType && <AureakText style={s.error as never}>{errors.actionType.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Description</AureakText>
              <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, s.textarea]}
                  value={value ?? ''}
                  onChangeText={onChange}
                  placeholder="Contexte, personnes rencontrées, prochaine étape…"
                  multiline
                  numberOfLines={4}
                />
              )} />
            </View>

            {serverError && <AureakText style={s.error as never}>{serverError}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={() => { reset(); onClose() }} disabled={isSubmitting}>
                <AureakText style={s.btnCancelLabel as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, isSubmitting && s.btnDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText style={s.btnSubmitLabel as never}>
                  {isSubmitting ? 'Ajout…' : 'Enregistrer l\'action'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: space.md },
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 580, maxHeight: '90%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  field   : { gap: space.xs },
  label   : { color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 },
  input   : {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip    : {
    paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border.divider, backgroundColor: colors.light.primary,
  },
  chipActive    : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  chipText      : { color: colors.text.muted, fontSize: 12 },
  chipTextActive: { color: colors.light.surface, fontWeight: '700', fontSize: 12 },
  error   : { color: colors.status.absent, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  btnDisabled: { opacity: 0.5 },
  btnSubmitLabel: { color: colors.light.surface, fontWeight: '700' },
})
