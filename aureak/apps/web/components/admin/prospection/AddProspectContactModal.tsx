'use client'
// Story 88.2 — Modale ajout d'un contact sur un club prospect (RHF + Zod)
import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView, Switch } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addProspectContact } from '@aureak/api-client'
import type { ProspectContact, ClubContactRole } from '@aureak/types'
import { CLUB_CONTACT_ROLES, CLUB_CONTACT_ROLE_LABELS } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  firstName       : z.string().trim().min(1, 'Prénom requis'),
  lastName        : z.string().trim().min(1, 'Nom requis'),
  role            : z.enum(['entraineur', 'directeur_sportif', 'president', 'secretaire', 'autre']),
  email           : z.string().trim().email('Email invalide').optional().or(z.literal('')),
  phone           : z.string().trim().optional(),
  isDecisionnaire : z.boolean(),
  notes           : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible        : boolean
  clubProspectId : string
  onClose        : () => void
  onSuccess?     : (contact: ProspectContact) => void
}

export function AddProspectContactModal({ visible, clubProspectId, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', role: 'autre',
      email: '', phone: '', isDecisionnaire: false, notes: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const contact = await addProspectContact({
        clubProspectId,
        firstName       : data.firstName,
        lastName        : data.lastName,
        role            : data.role as ClubContactRole,
        email           : data.email || undefined,
        phone           : data.phone || undefined,
        isDecisionnaire : data.isDecisionnaire,
        notes           : data.notes || undefined,
      })
      onSuccess?.(contact)
      reset()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AddProspectContactModal] add error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Ajouter un contact</AureakText>

            <View style={s.row2}>
              <View style={[s.field, { flex: 1 }]}>
                <AureakText style={s.label as never}>Prénom *</AureakText>
                <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value} onChangeText={onChange} />
                )} />
                {errors.firstName && <AureakText style={s.error as never}>{errors.firstName.message}</AureakText>}
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <AureakText style={s.label as never}>Nom *</AureakText>
                <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value} onChangeText={onChange} />
                )} />
                {errors.lastName && <AureakText style={s.error as never}>{errors.lastName.message}</AureakText>}
              </View>
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Rôle</AureakText>
              <Controller control={control} name="role" render={({ field: { onChange, value } }) => (
                <View style={s.chipRow}>
                  {CLUB_CONTACT_ROLES.map(r => (
                    <Pressable key={r} onPress={() => onChange(r)} style={[s.chip, value === r && s.chipActive]}>
                      <AureakText style={(value === r ? s.chipTextActive : s.chipText) as never}>
                        {CLUB_CONTACT_ROLE_LABELS[r]}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Email</AureakText>
              <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  keyboardType="email-address" autoCapitalize="none" />
              )} />
              {errors.email && <AureakText style={s.error as never}>{errors.email.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Téléphone</AureakText>
              <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange} keyboardType="phone-pad" />
              )} />
            </View>

            <View style={[s.field, s.switchRow]}>
              <AureakText style={s.label as never}>Décisionnaire identifié</AureakText>
              <Controller control={control} name="isDecisionnaire" render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Notes</AureakText>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput style={[s.input, s.textarea]} value={value ?? ''} onChangeText={onChange} multiline numberOfLines={3} />
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
                  {isSubmitting ? 'Ajout…' : 'Ajouter le contact'}
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
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 600, maxHeight: '92%' },
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
  textarea: { minHeight: 60, textAlignVertical: 'top' },
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
