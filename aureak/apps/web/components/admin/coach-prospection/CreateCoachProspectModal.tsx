'use client'
// Story 90.1 — Modale ajout coach prospect (React Hook Form + Zod)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCoachProspect, listProfilesByRole } from '@aureak/api-client'
import type { CoachProspect } from '@aureak/types'
import type { ProfileListRow } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  firstName            : z.string().trim().min(2, 'Prénom requis (min 2 caractères)'),
  lastName             : z.string().trim().min(2, 'Nom requis (min 2 caractères)'),
  email                : z.string().trim().email('Email invalide').optional().or(z.literal('')),
  phone                : z.string().trim().optional(),
  city                 : z.string().trim().optional(),
  currentClub          : z.string().trim().optional(),
  specialite           : z.string().trim().optional(),
  assignedCommercialId : z.string().uuid().optional().or(z.literal('')),
  source               : z.string().trim().optional(),
  notes                : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible   : boolean
  onClose   : () => void
  onSuccess?: (prospect: CoachProspect) => void
}

export function CreateCoachProspectModal({ visible, onClose, onSuccess }: Props) {
  const role                      = useAuthStore(s => s.role)
  const [commercials, setCommercials] = useState<ProfileListRow[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const isAdmin = role === 'admin'

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '', city: '',
      currentClub: '', specialite: '', assignedCommercialId: '',
      source: '', notes: '',
    },
  })

  useEffect(() => {
    if (!visible) return
    setServerError(null)
    reset({
      firstName: '', lastName: '', email: '', phone: '', city: '',
      currentClub: '', specialite: '', assignedCommercialId: '',
      source: '', notes: '',
    })
    if (!isAdmin) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await listProfilesByRole({ role: 'commercial', page: 1, pageSize: 100 })
        if (!cancelled) setCommercials(res.data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CreateCoachProspectModal] load error:', err)
      }
    })()
    return () => { cancelled = true }
  }, [visible, reset, isAdmin])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const prospect = await createCoachProspect({
        firstName            : data.firstName,
        lastName             : data.lastName,
        email                : data.email || undefined,
        phone                : data.phone || undefined,
        city                 : data.city || undefined,
        currentClub          : data.currentClub || undefined,
        specialite           : data.specialite || undefined,
        assignedCommercialId : data.assignedCommercialId || undefined,
        source               : data.source || undefined,
        notes                : data.notes || undefined,
      })
      onSuccess?.(prospect)
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CreateCoachProspectModal] create error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Ajouter un entraîneur prospect</AureakText>

            <View style={s.row2}>
              <View style={[s.field, { flex: 1 }] as never}>
                <AureakText style={s.label as never}>Prénom *</AureakText>
                <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value} onChangeText={onChange} placeholder="Prénom" />
                )} />
                {errors.firstName && <AureakText style={s.error as never}>{errors.firstName.message}</AureakText>}
              </View>
              <View style={[s.field, { flex: 1 }] as never}>
                <AureakText style={s.label as never}>Nom *</AureakText>
                <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value} onChangeText={onChange} placeholder="Nom" />
                )} />
                {errors.lastName && <AureakText style={s.error as never}>{errors.lastName.message}</AureakText>}
              </View>
            </View>

            <View style={s.row2}>
              <View style={[s.field, { flex: 1 }] as never}>
                <AureakText style={s.label as never}>Email</AureakText>
                <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                    placeholder="email@exemple.com" keyboardType="email-address" autoCapitalize="none" />
                )} />
                {errors.email && <AureakText style={s.error as never}>{errors.email.message}</AureakText>}
              </View>
              <View style={[s.field, { flex: 1 }] as never}>
                <AureakText style={s.label as never}>Téléphone</AureakText>
                <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value ?? ''} onChangeText={onChange} placeholder="+32 …" />
                )} />
              </View>
            </View>

            <View style={s.row2}>
              <View style={[s.field, { flex: 1 }] as never}>
                <AureakText style={s.label as never}>Ville</AureakText>
                <Controller control={control} name="city" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value ?? ''} onChangeText={onChange} placeholder="Liège" />
                )} />
              </View>
              <View style={[s.field, { flex: 1 }] as never}>
                <AureakText style={s.label as never}>Club actuel</AureakText>
                <Controller control={control} name="currentClub" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value ?? ''} onChangeText={onChange} placeholder="Standard de Liège" />
                )} />
              </View>
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Spécialité</AureakText>
              <Controller control={control} name="specialite" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  placeholder="ex : gardiens U13, analyse vidéo" />
              )} />
            </View>

            {isAdmin && commercials.length > 0 && (
              <View style={s.field}>
                <AureakText style={s.label as never}>Commercial assigné</AureakText>
                <Controller control={control} name="assignedCommercialId" render={({ field: { onChange, value } }) => (
                  <View style={s.chipRow}>
                    <Pressable onPress={() => onChange('')} style={[s.chip, !value && s.chipActive]}>
                      <AureakText style={(!value ? s.chipTextActive : s.chipText) as never}>Moi-même</AureakText>
                    </Pressable>
                    {commercials.map(c => (
                      <Pressable key={c.userId} onPress={() => onChange(c.userId)}
                        style={[s.chip, value === c.userId && s.chipActive]}>
                        <AureakText style={(value === c.userId ? s.chipTextActive : s.chipText) as never}>
                          {c.displayName}
                        </AureakText>
                      </Pressable>
                    ))}
                  </View>
                )} />
              </View>
            )}

            <View style={s.field}>
              <AureakText style={s.label as never}>Source</AureakText>
              <Controller control={control} name="source" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  placeholder="Recommandation, RBFA, Salon…" />
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Notes</AureakText>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput style={[s.input, s.textarea]} value={value ?? ''} onChangeText={onChange}
                  multiline numberOfLines={4} />
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
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 640, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  field   : { gap: space.xs },
  row2    : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
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
