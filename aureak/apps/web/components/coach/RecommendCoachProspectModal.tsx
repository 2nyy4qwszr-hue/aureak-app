'use client'
// Epic 90 — Story 90.2 : Modale de recommandation d'un coach prospect par un coach actif.
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { recommendCoachProspect } from '@aureak/api-client'
import type { CoachProspect } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  firstName    : z.string().trim().min(2, 'Prénom requis (min 2 caractères)'),
  lastName     : z.string().trim().min(2, 'Nom requis (min 2 caractères)'),
  email        : z.string().trim().email('Email invalide').optional().or(z.literal('')),
  phone        : z.string().trim().optional(),
  city         : z.string().trim().min(2, 'Ville requise'),
  specialite   : z.string().trim().min(2, 'Spécialité requise (ex. "gardiens U13")'),
  contextNote  : z.string().trim().min(20, 'Contexte requis (min 20 caractères)').max(500, 'Contexte trop long (max 500)'),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible   : boolean
  onClose   : () => void
  onSuccess?: (prospect: CoachProspect) => void
}

export function RecommendCoachProspectModal({ visible, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      city: '', specialite: '', contextNote: '',
    },
  })

  useEffect(() => {
    if (!visible) return
    setServerError(null)
    reset({
      firstName: '', lastName: '', email: '', phone: '',
      city: '', specialite: '', contextNote: '',
    })
  }, [visible, reset])

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const prospect = await recommendCoachProspect({
        firstName  : data.firstName,
        lastName   : data.lastName,
        email      : data.email || undefined,
        phone      : data.phone || undefined,
        city       : data.city,
        specialite : data.specialite,
        contextNote: data.contextNote,
      })
      onSuccess?.(prospect)
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RecommendCoachProspectModal] error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Recommander un entraîneur</AureakText>
            <AureakText style={s.intro as never}>
              Présente un coach que tu connais et qui pourrait rejoindre l'académie. L'admin prendra contact ensuite.
            </AureakText>

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

            <View style={s.field}>
              <AureakText style={s.label as never}>Ville *</AureakText>
              <Controller control={control} name="city" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value} onChangeText={onChange} placeholder="Liège" />
              )} />
              {errors.city && <AureakText style={s.error as never}>{errors.city.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Spécialité estimée *</AureakText>
              <Controller control={control} name="specialite" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value} onChangeText={onChange}
                  placeholder="ex. gardiens U13, analyse vidéo" />
              )} />
              {errors.specialite && <AureakText style={s.error as never}>{errors.specialite.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Contexte / Relation *</AureakText>
              <AureakText style={s.hint as never}>
                Pourquoi le recommandes-tu ? Comment le connais-tu ? (20 à 500 caractères)
              </AureakText>
              <Controller control={control} name="contextNote" render={({ field: { onChange, value } }) => (
                <TextInput style={[s.input, s.textarea] as never} value={value} onChangeText={onChange}
                  multiline numberOfLines={5} placeholder="J'ai joué avec lui à…" />
              )} />
              {errors.contextNote && <AureakText style={s.error as never}>{errors.contextNote.message}</AureakText>}
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
                  {isSubmitting ? 'Envoi…' : 'Envoyer la recommandation'}
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
  backdrop: { flex: 1, backgroundColor: colors.overlay.dark, justifyContent: 'center', alignItems: 'center', padding: space.md },
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 640, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  intro   : { color: colors.text.muted, fontSize: 13 },
  field   : { gap: space.xs },
  row2    : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  label   : { color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 },
  hint    : { color: colors.text.subtle, fontSize: 11, fontStyle: 'italic' },
  input   : {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  error   : { color: colors.status.absent, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  btnDisabled: { opacity: 0.5 },
  btnSubmitLabel: { color: colors.light.surface, fontWeight: '700' },
})
