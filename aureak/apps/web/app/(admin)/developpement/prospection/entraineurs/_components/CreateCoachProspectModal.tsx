'use client'
// Story 90.1 — Modale ajout coach prospect (React Hook Form + Zod)
import React, { useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { createCoachProspect } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'

const schema = z.object({
  name           : z.string().min(1, 'Nom requis'),
  email          : z.string().email('Email invalide').optional().or(z.literal('')),
  phone          : z.string().optional(),
  experienceYears: z.string().optional(),
  diplomas       : z.string().optional(),
  source         : z.string().optional(),
  notes          : z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateCoachProspectModal({ visible, onClose, onCreated }: Props) {
  const { tenantId } = useAuthStore()
  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', experienceYears: '',
      diplomas: '', source: '', notes: '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!tenantId) return
    setSaving(true)
    try {
      await createCoachProspect({
        name           : data.name,
        email          : data.email || undefined,
        phone          : data.phone || undefined,
        experienceYears: data.experienceYears ? parseInt(data.experienceYears, 10) : undefined,
        diplomas       : data.diplomas ? data.diplomas.split(',').map(d => d.trim()).filter(Boolean) : undefined,
        source         : data.source || undefined,
        notes          : data.notes || undefined,
      }, tenantId)
      reset()
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CreateCoachProspectModal] create error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal as object} onPress={e => e.stopPropagation()}>
        <ScrollView>
          <AureakText variant="h2" style={styles.title}>Ajouter un prospect entraîneur</AureakText>

          {/* Nom */}
          <AureakText style={styles.label}>Nom *</AureakText>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.name && <AureakText style={styles.errorText}>{errors.name.message}</AureakText>}

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
                placeholder="jean@exemple.com"
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
                placeholder="+32 xxx xx xx xx"
                placeholderTextColor={colors.text.subtle}
                keyboardType="phone-pad"
              />
            )}
          />

          {/* Expérience */}
          <AureakText style={styles.label}>Années d'expérience</AureakText>
          <Controller
            control={control}
            name="experienceYears"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: 5"
                placeholderTextColor={colors.text.subtle}
                keyboardType="numeric"
              />
            )}
          />

          {/* Diplômes */}
          <AureakText style={styles.label}>Diplômes (séparés par virgule)</AureakText>
          <Controller
            control={control}
            name="diplomas"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: UEFA B, Brevet d'entraîneur"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />

          {/* Source */}
          <AureakText style={styles.label}>Source</AureakText>
          <Controller
            control={control}
            name="source"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Réseau, Recommandation, LinkedIn..."
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />

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
