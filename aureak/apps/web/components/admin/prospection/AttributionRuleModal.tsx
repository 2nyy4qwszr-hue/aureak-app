'use client'
// Story 88.4 — Modale création/édition d'une règle d'attribution (RHF + Zod)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView, Switch } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAttributionRule, updateAttributionRule } from '@aureak/api-client'
import type { AttributionRule } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  ruleName    : z.string().trim().min(2, 'Nom requis'),
  description : z.string().trim().optional(),
  qualifier   : z.coerce.number().int().min(0).max(100),
  closer      : z.coerce.number().int().min(0).max(100),
  isDefault   : z.boolean(),
}).refine(d => d.qualifier + d.closer === 100, {
  message: 'Qualifier + Closer doit = 100',
  path: ['qualifier'],
})

type FormData = z.infer<typeof schema>

type Props = {
  visible    : boolean
  rule?      : AttributionRule | null
  onClose    : () => void
  onSuccess? : () => void
}

export function AttributionRuleModal({ visible, rule, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ruleName    : '',
      description : '',
      qualifier   : 50,
      closer      : 50,
      isDefault   : false,
    },
  })

  useEffect(() => {
    if (!visible) return
    if (rule) {
      reset({
        ruleName    : rule.ruleName,
        description : rule.description ?? '',
        qualifier   : (rule.percentages.qualifier as number | undefined) ?? 50,
        closer      : (rule.percentages.closer as number | undefined) ?? 50,
        isDefault   : rule.isDefault,
      })
    } else {
      reset({ ruleName: '', description: '', qualifier: 50, closer: 50, isDefault: false })
    }
    setServerError(null)
  }, [visible, rule, reset])

  // Auto-complète closer = 100 - qualifier
  const qualifier = watch('qualifier')
  useEffect(() => {
    if (typeof qualifier === 'number' && qualifier >= 0 && qualifier <= 100) {
      setValue('closer', 100 - qualifier)
    }
  }, [qualifier, setValue])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      if (rule) {
        await updateAttributionRule({
          id          : rule.id,
          ruleName    : data.ruleName,
          description : data.description || null,
          percentages : { qualifier: data.qualifier, closer: data.closer },
          isDefault   : data.isDefault,
        })
      } else {
        await createAttributionRule({
          ruleName    : data.ruleName,
          description : data.description || undefined,
          percentages : { qualifier: data.qualifier, closer: data.closer },
          isDefault   : data.isDefault,
        })
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionRuleModal] save error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>
              {rule ? 'Modifier la règle' : 'Nouvelle règle d\'attribution'}
            </AureakText>

            <View style={s.field}>
              <AureakText style={s.label as never}>Nom de la règle *</AureakText>
              <Controller control={control} name="ruleName" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value} onChangeText={onChange} placeholder="Ex : Prime closer x2" />
              )} />
              {errors.ruleName && <AureakText style={s.error as never}>{errors.ruleName.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Description</AureakText>
              <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                <TextInput style={[s.input, s.textarea]} value={value ?? ''} onChangeText={onChange} multiline numberOfLines={3} />
              )} />
            </View>

            <View style={s.row2}>
              <View style={[s.field, { flex: 1 }]}>
                <AureakText style={s.label as never}>Qualifier (%)</AureakText>
                <Controller control={control} name="qualifier" render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={s.input}
                    value={String(value ?? '')}
                    onChangeText={t => onChange(Number(t) || 0)}
                    keyboardType="numeric"
                  />
                )} />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <AureakText style={s.label as never}>Closer (%)</AureakText>
                <Controller control={control} name="closer" render={({ field: { value } }) => (
                  <View style={[s.input, s.inputReadonly] as never}>
                    <AureakText style={s.readonlyText as never}>{value}</AureakText>
                  </View>
                )} />
              </View>
            </View>
            {errors.qualifier && <AureakText style={s.error as never}>{errors.qualifier.message}</AureakText>}

            <View style={[s.field, s.switchRow]}>
              <AureakText style={s.label as never}>Définir comme règle par défaut</AureakText>
              <Controller control={control} name="isDefault" render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )} />
            </View>

            {serverError && <AureakText style={s.error as never}>{serverError}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={isSubmitting}>
                <AureakText style={s.btnCancelLabel as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, isSubmitting && s.btnDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText style={s.btnSubmitLabel as never}>
                  {isSubmitting ? 'Enregistrement…' : (rule ? 'Mettre à jour' : 'Créer la règle')}
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
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 560, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  row2    : { flexDirection: 'row', gap: space.md },
  field   : { gap: space.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  inputReadonly: { backgroundColor: colors.light.muted, justifyContent: 'center' },
  readonlyText : { color: colors.text.dark, fontSize: 14, fontWeight: '700' },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  error   : { color: colors.status.absent, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  btnDisabled: { opacity: 0.5 },
  btnSubmitLabel: { color: colors.light.surface, fontWeight: '700' },
})
