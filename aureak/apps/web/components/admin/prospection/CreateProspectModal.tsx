'use client'
// Story 88.2 — Modale ajout d'un club prospect (RHF + Zod)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClubProspect, listImplantations } from '@aureak/api-client'
import type { Implantation, ClubProspect } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  clubName             : z.string().trim().min(2, 'Nom du club requis'),
  city                 : z.string().trim().optional(),
  targetImplantationId : z.string().uuid().optional().or(z.literal('')),
  source               : z.string().trim().optional(),
  notes                : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible   : boolean
  onClose   : () => void
  onSuccess?: (prospect: ClubProspect) => void
}

export function CreateProspectModal({ visible, onClose, onSuccess }: Props) {
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clubName: '', city: '', targetImplantationId: '', source: '', notes: '',
    },
  })

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await listImplantations()
        if (!cancelled) setImplantations(res.data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CreateProspectModal] load error:', err)
      }
    })()
    return () => { cancelled = true }
  }, [visible])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const prospect = await createClubProspect({
        clubName             : data.clubName,
        city                 : data.city || undefined,
        targetImplantationId : data.targetImplantationId || undefined,
        source               : data.source || undefined,
        notes                : data.notes || undefined,
      })
      onSuccess?.(prospect)
      reset()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CreateProspectModal] create error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Ajouter un club prospect</AureakText>

            <View style={s.field}>
              <AureakText style={s.label as never}>Nom du club *</AureakText>
              <Controller control={control} name="clubName" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value} onChangeText={onChange} placeholder="Ex : RFC Liège" />
              )} />
              {errors.clubName && <AureakText style={s.error as never}>{errors.clubName.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Ville</AureakText>
              <Controller control={control} name="city" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange} placeholder="Ex : Liège" />
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Implantation cible</AureakText>
              <Controller control={control} name="targetImplantationId" render={({ field: { onChange, value } }) => (
                <View style={s.chipRow}>
                  <Pressable onPress={() => onChange('')} style={[s.chip, !value && s.chipActive]}>
                    <AureakText style={(!value ? s.chipTextActive : s.chipText) as never}>Non défini</AureakText>
                  </Pressable>
                  {implantations.map(imp => (
                    <Pressable key={imp.id} onPress={() => onChange(imp.id)} style={[s.chip, value === imp.id && s.chipActive]}>
                      <AureakText style={(value === imp.id ? s.chipTextActive : s.chipText) as never}>{imp.name}</AureakText>
                    </Pressable>
                  ))}
                </View>
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Source</AureakText>
              <Controller control={control} name="source" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange} placeholder="Ex : Recommandation, RBFA, Événement" />
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Notes</AureakText>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput style={[s.input, s.textarea]} value={value ?? ''} onChangeText={onChange} multiline numberOfLines={4} />
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
                  {isSubmitting ? 'Création…' : 'Créer le prospect'}
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
  textarea: { minHeight: 70, textAlignVertical: 'top' },
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
