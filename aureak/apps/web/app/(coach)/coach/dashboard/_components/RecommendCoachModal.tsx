'use client'
// Story 90.2 — Modale recommandation entraîneur par un coach
import React, { useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  createCoachRecommendation,
  createInAppNotification,
  listAdminUserIds,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'

const schema = z.object({
  name    : z.string().min(1, 'Nom requis'),
  contact : z.string().min(1, 'Email ou téléphone requis'),
  relation: z.string().min(1, 'Relation requise'),
  comment : z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Props = {
  visible  : boolean
  onClose  : () => void
  onCreated: () => void
}

export function RecommendCoachModal({ visible, onClose, onCreated }: Props) {
  const { tenantId, user } = useAuthStore()
  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', contact: '', relation: '', comment: '' },
  })

  async function onSubmit(data: FormData) {
    if (!tenantId || !user?.id) return
    setSaving(true)
    try {
      // 1. Créer le prospect
      await createCoachRecommendation({
        name   : data.name,
        contact: data.contact,
        relation: data.relation,
        comment: data.comment || undefined,
      }, tenantId, user.id)

      // 2. Envoyer notification aux admins/managers
      const coachName = user.email?.split('@')[0] ?? 'Un coach'
      const adminIds = await listAdminUserIds(tenantId)
      for (const adminId of adminIds) {
        await createInAppNotification({
          tenantId,
          userId: adminId,
          title : 'Recommandation entraîneur',
          body  : `${coachName} recommande ${data.name} comme entraîneur potentiel`,
          type  : 'info',
        })
      }

      reset()
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RecommendCoachModal] error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal as object} onPress={e => e.stopPropagation()}>
        <ScrollView>
          <AureakText variant="h2" style={styles.title}>Recommander un entraîneur</AureakText>
          <AureakText style={styles.intro}>
            Vous connaissez un entraîneur qui pourrait rejoindre l'académie ? Partagez ses coordonnées et nous le contacterons.
          </AureakText>

          {/* Nom */}
          <AureakText style={styles.label}>Nom complet *</AureakText>
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

          {/* Contact */}
          <AureakText style={styles.label}>Email ou téléphone *</AureakText>
          <Controller
            control={control}
            name="contact"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.contact && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="jean@exemple.com ou +32 xxx xx xx xx"
                placeholderTextColor={colors.text.subtle}
                autoCapitalize="none"
              />
            )}
          />
          {errors.contact && <AureakText style={styles.errorText}>{errors.contact.message}</AureakText>}

          {/* Relation */}
          <AureakText style={styles.label}>Votre relation *</AureakText>
          <Controller
            control={control}
            name="relation"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.relation && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Ancien collègue, ami, formation commune..."
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.relation && <AureakText style={styles.errorText}>{errors.relation.message}</AureakText>}

          {/* Commentaire */}
          <AureakText style={styles.label}>Commentaire (optionnel)</AureakText>
          <Controller
            control={control}
            name="comment"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Pourquoi le recommandez-vous ?"
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
                {saving ? 'Envoi...' : 'Recommander'}
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
    maxWidth       : 480,
    maxHeight      : '90%',
    boxShadow      : shadows.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  intro: {
    fontSize    : 13,
    fontFamily  : fonts.body,
    color       : colors.text.muted,
    marginBottom: space.lg,
    lineHeight  : 18,
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
