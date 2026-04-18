'use client'
// Story 88.2 — Modale ajout contact prospect (React Hook Form + Zod)
import React, { useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput, Switch } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { addProspectContact } from '@aureak/api-client'
import { CLUB_CONTACT_ROLES, CLUB_CONTACT_ROLE_LABELS } from '@aureak/types'
import type { ClubContactRole } from '@aureak/types'

const schema = z.object({
  firstName      : z.string().min(1, 'Prénom requis'),
  lastName       : z.string().min(1, 'Nom requis'),
  role           : z.string().default('autre'),
  email          : z.string().email('Email invalide').optional().or(z.literal('')),
  phone          : z.string().optional(),
  isDecisionnaire: z.boolean().default(false),
  notes          : z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Props = {
  visible: boolean
  clubProspectId: string
  onClose: () => void
  onCreated: () => void
}

export function AddContactModal({ visible, clubProspectId, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', role: 'autre',
      email: '', phone: '', isDecisionnaire: false, notes: '',
    },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      await addProspectContact(clubProspectId, {
        firstName      : data.firstName,
        lastName       : data.lastName,
        role           : data.role as ClubContactRole,
        email          : data.email || undefined,
        phone          : data.phone || undefined,
        isDecisionnaire: data.isDecisionnaire,
        notes          : data.notes || undefined,
      })
      reset()
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AddContactModal] create error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal as object} onPress={e => e.stopPropagation()}>
        <ScrollView>
          <AureakText variant="h2" style={styles.title}>Ajouter un contact</AureakText>

          {/* Prénom */}
          <AureakText style={styles.label}>Prénom *</AureakText>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Prénom"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.firstName && <AureakText style={styles.errorText}>{errors.firstName.message}</AureakText>}

          {/* Nom */}
          <AureakText style={styles.label}>Nom *</AureakText>
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Nom"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.lastName && <AureakText style={styles.errorText}>{errors.lastName.message}</AureakText>}

          {/* Rôle */}
          <AureakText style={styles.label}>Rôle</AureakText>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.pillsRow}>
                {CLUB_CONTACT_ROLES.map(r => (
                  <Pressable
                    key={r}
                    style={[styles.pill, value === r && styles.pillActive]}
                    onPress={() => onChange(r)}
                  >
                    <AureakText style={[styles.pillText, value === r && styles.pillTextActive] as never}>
                      {CLUB_CONTACT_ROLE_LABELS[r]}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          />

          {/* Email */}
          <AureakText style={styles.label}>Email</AureakText>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.text.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <AureakText style={styles.errorText}>{errors.email.message}</AureakText>}

          {/* Téléphone */}
          <AureakText style={styles.label}>Téléphone</AureakText>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="+32 XXX XX XX XX"
                placeholderTextColor={colors.text.subtle}
                keyboardType="phone-pad"
              />
            )}
          />

          {/* Décisionnaire toggle */}
          <View style={styles.switchRow}>
            <AureakText style={styles.switchLabel}>Décisionnaire</AureakText>
            <Controller
              control={control}
              name="isDecisionnaire"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: colors.border.light, true: colors.accent.gold }}
                  thumbColor={colors.light.surface}
                />
              )}
            />
          </View>

          {/* Notes */}
          <AureakText style={styles.label}>Notes</AureakText>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Notes libres..."
                placeholderTextColor={colors.text.subtle}
                multiline
                numberOfLines={3}
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
  inputError: {
    borderColor: colors.status.absent,
  },
  textArea: {
    minHeight        : 80,
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
  switchRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    marginTop     : space.lg,
    paddingVertical: space.sm,
  },
  switchLabel: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.dark,
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
