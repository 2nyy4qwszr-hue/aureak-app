'use client'
// Story 92.2 — Modale création/édition sponsor
import React, { useEffect } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { createSponsor, updateSponsor } from '@aureak/api-client'
import type { Sponsor, SponsorType } from '@aureak/types'

const SPONSOR_TYPES: { value: SponsorType; label: string }[] = [
  { value: 'entreprise',  label: 'Entreprise'  },
  { value: 'individuel',  label: 'Individuel'  },
  { value: 'association', label: 'Association' },
  { value: 'club',        label: 'Club'        },
]

const schema = z.object({
  name               : z.string().trim().min(2, 'Nom requis (min 2 caractères)'),
  sponsorType        : z.enum(['entreprise', 'individuel', 'association', 'club']),
  annualAmountEuros  : z.string().trim().optional(),
  activeFrom         : z.string().trim().optional(),
  activeUntil        : z.string().trim().optional(),
  contactEmail       : z.string().trim().optional().refine(
    v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: 'Email invalide' },
  ),
  contactPhone       : z.string().trim().optional(),
  notes              : z.string().trim().optional(),
}).refine(
  data => {
    if (!data.activeFrom || !data.activeUntil) return true
    return data.activeUntil >= data.activeFrom
  },
  { message: 'La date de fin doit être ≥ date de début', path: ['activeUntil'] },
)

type FormData = z.infer<typeof schema>

type Props = {
  visible  : boolean
  onClose  : () => void
  onSuccess: () => void
  sponsor? : Sponsor | null   // édition si fourni
}

function eurosToCents(input: string | undefined): number | null {
  if (!input) return null
  const cleaned = input.replace(',', '.').replace(/\s/g, '')
  const parsed  = Number(cleaned)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

function centsToEuros(cents: number | null): string {
  if (cents === null) return ''
  return (cents / 100).toString()
}

export function SponsorFormModal({ visible, onClose, onSuccess, sponsor }: Props) {
  const isEdit = Boolean(sponsor)
  const {
    control, handleSubmit, reset, setError, clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver     : zodResolver(schema),
    defaultValues: {
      name              : '',
      sponsorType       : 'entreprise',
      annualAmountEuros : '',
      activeFrom        : '',
      activeUntil       : '',
      contactEmail      : '',
      contactPhone      : '',
      notes             : '',
    },
  })

  useEffect(() => {
    if (!visible) return
    clearErrors()
    reset(sponsor
      ? {
          name              : sponsor.name,
          sponsorType       : sponsor.sponsorType,
          annualAmountEuros : centsToEuros(sponsor.annualAmountCents),
          activeFrom        : sponsor.activeFrom,
          activeUntil       : sponsor.activeUntil ?? '',
          contactEmail      : sponsor.contactEmail ?? '',
          contactPhone      : sponsor.contactPhone ?? '',
          notes             : sponsor.notes ?? '',
        }
      : {
          name: '', sponsorType: 'entreprise', annualAmountEuros: '',
          activeFrom: '', activeUntil: '', contactEmail: '', contactPhone: '', notes: '',
        })
  }, [visible, sponsor, reset, clearErrors])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name              : data.name,
        sponsorType       : data.sponsorType,
        annualAmountCents : eurosToCents(data.annualAmountEuros),
        activeFrom        : data.activeFrom || undefined,
        activeUntil       : data.activeUntil || null,
        contactEmail      : data.contactEmail || null,
        contactPhone      : data.contactPhone || null,
        notes             : data.notes || null,
      }
      const res = isEdit && sponsor
        ? await updateSponsor(sponsor.id, payload)
        : await createSponsor(payload)
      if (res.error) {
        const message = res.error instanceof Error ? res.error.message : 'Erreur inconnue'
        setError('root', { type: 'server', message })
        return
      }
      onSuccess()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SponsorFormModal] submit exception:', err)
      setError('root', { type: 'server', message: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title}>
              {isEdit ? 'Modifier le sponsor' : 'Nouveau sponsor'}
            </AureakText>

            <View style={s.field}>
              <AureakText style={s.label}>Nom *</AureakText>
              <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  placeholder="Ex : Entreprise ACME"
                  placeholderTextColor={colors.text.muted} />
              )} />
              {errors.name && <AureakText style={s.error}>{errors.name.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Type *</AureakText>
              <Controller control={control} name="sponsorType" render={({ field: { onChange, value } }) => (
                <View style={s.chipRow}>
                  {SPONSOR_TYPES.map(opt => {
                    const selected = value === opt.value
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={selected ? { ...s.chip, ...s.chipActive } : s.chip}
                      >
                        <AureakText style={selected ? s.chipTextActive : s.chipText}>
                          {opt.label}
                        </AureakText>
                      </Pressable>
                    )
                  })}
                </View>
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Montant annuel (€)</AureakText>
              <Controller control={control} name="annualAmountEuros" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  placeholder="Ex : 2500"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad" />
              )} />
            </View>

            <View style={s.row}>
              <View style={s.fieldFlex}>
                <AureakText style={s.label}>Date de début</AureakText>
                <Controller control={control} name="activeFrom" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text.muted} />
                )} />
                <AureakText style={s.helper}>Laisser vide = aujourd'hui</AureakText>
              </View>
              <View style={s.fieldFlex}>
                <AureakText style={s.label}>Date de fin</AureakText>
                <Controller control={control} name="activeUntil" render={({ field: { onChange, value } }) => (
                  <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text.muted} />
                )} />
                {errors.activeUntil && <AureakText style={s.error}>{errors.activeUntil.message}</AureakText>}
                <AureakText style={s.helper}>Laisser vide = sans limite</AureakText>
              </View>
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Email de contact</AureakText>
              <Controller control={control} name="contactEmail" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  placeholder="contact@acme.com"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none" />
              )} />
              {errors.contactEmail && <AureakText style={s.error}>{errors.contactEmail.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Téléphone</AureakText>
              <Controller control={control} name="contactPhone" render={({ field: { onChange, value } }) => (
                <TextInput style={s.input} value={value ?? ''} onChangeText={onChange}
                  placeholder="+32 4 23 45 67 89"
                  placeholderTextColor={colors.text.muted} />
              )} />
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Notes</AureakText>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput style={{ ...s.input, ...s.textarea }} value={value ?? ''} onChangeText={onChange}
                  multiline numberOfLines={3}
                  placeholderTextColor={colors.text.muted} />
              )} />
            </View>

            {errors.root?.message && <AureakText style={s.error}>{errors.root.message}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={isSubmitting}>
                <AureakText style={s.btnCancelLabel}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={isSubmitting ? { ...s.btnSubmit, ...s.btnDisabled } : s.btnSubmit}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText style={s.btnSubmitLabel}>
                  {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le sponsor'}
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
  backdrop: {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.md,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    width          : '100%',
    maxWidth       : 600,
    maxHeight      : '92%',
  },
  body: {
    padding: space.lg,
    gap    : space.md,
  },
  title: {
    color     : colors.text.dark,
    fontWeight: '700',
  },
  field: {
    gap: space.xs,
  },
  fieldFlex: {
    flex: 1,
    gap : space.xs,
  },
  row: {
    flexDirection: 'row',
    gap          : space.md,
  },
  label: {
    color        : colors.text.muted,
    fontWeight   : '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize     : 10,
    fontFamily   : fonts.body,
  },
  input: {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
    fontFamily       : fonts.body,
  },
  textarea: {
    minHeight        : 70,
    textAlignVertical: 'top',
  },
  helper: {
    color     : colors.text.muted,
    fontSize  : 11,
    fontFamily: fonts.body,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.primary,
  },
  chipActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  chipText: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  chipTextActive: {
    color     : colors.text.onGold,
    fontWeight: '700',
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  error: {
    color     : colors.status.errorText,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  actions: {
    flexDirection : 'row',
    gap           : space.sm,
    justifyContent: 'flex-end',
    marginTop     : space.md,
  },
  btnCancel: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  btnCancelLabel: {
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  btnSubmit: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnSubmitLabel: {
    color     : colors.text.onGold,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
})
