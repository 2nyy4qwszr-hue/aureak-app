'use client'
// Story 92.3 — Modale création partenariat club
import React, { useEffect } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { createPartnership } from '@aureak/api-client'
import type { PartnershipAccessLevel } from '@aureak/api-client'

const ACCESS_LEVELS: { value: PartnershipAccessLevel; label: string }[] = [
  { value: 'read_catalogue', label: 'Catalogue public' },
  { value: 'read_bronze',    label: 'Grade Bronze'     },
  { value: 'read_silver',    label: 'Grade Argent'     },
  { value: 'full_read',      label: 'Accès complet'    },
]

const schema = z.object({
  partnerName: z.string().trim().min(2, 'Nom requis (min 2 caractères)'),
  accessLevel: z.enum(['read_catalogue', 'read_bronze', 'read_silver', 'full_read']),
  activeUntil: z.string().trim().optional(),
  notes      : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible   : boolean
  onClose   : () => void
  onSuccess : () => void
}

export function PartnershipFormModal({ visible, onClose, onSuccess }: Props) {
  const {
    control, handleSubmit, reset, setError, clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver     : zodResolver(schema),
    defaultValues: { partnerName: '', accessLevel: 'read_catalogue', activeUntil: '', notes: '' },
  })

  useEffect(() => {
    if (!visible) return
    reset({ partnerName: '', accessLevel: 'read_catalogue', activeUntil: '', notes: '' })
    clearErrors()
  }, [visible, reset, clearErrors])

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await createPartnership({
        partnerName: data.partnerName,
        accessLevel: data.accessLevel,
        activeUntil: data.activeUntil || undefined,
        notes      : data.notes       || undefined,
      })
      if (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        setError('root', { type: 'server', message })
        if (process.env.NODE_ENV !== 'production') console.error('[PartnershipFormModal] create error:', error)
        return
      }
      onSuccess()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[PartnershipFormModal] create exception:', err)
      setError('root', { type: 'server', message: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title}>Nouveau partenariat</AureakText>

            <View style={s.field}>
              <AureakText style={s.label}>Nom du club *</AureakText>
              <Controller
                control={control}
                name="partnerName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={s.input}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Ex : RFC Liège"
                    placeholderTextColor={colors.text.muted}
                  />
                )}
              />
              {errors.partnerName && <AureakText style={s.error}>{errors.partnerName.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Niveau d'accès *</AureakText>
              <Controller
                control={control}
                name="accessLevel"
                render={({ field: { onChange, value } }) => (
                  <View style={s.chipRow}>
                    {ACCESS_LEVELS.map(opt => {
                      const selected = value === opt.value
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          style={[s.chip, selected && s.chipActive]}
                        >
                          <AureakText style={selected ? s.chipTextActive : s.chipText}>
                            {opt.label}
                          </AureakText>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              />
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Date de fin (optionnel)</AureakText>
              <Controller
                control={control}
                name="activeUntil"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={s.input}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text.muted}
                  />
                )}
              />
              <AureakText style={s.helper}>Laisser vide pour un partenariat sans limite.</AureakText>
            </View>

            <View style={s.field}>
              <AureakText style={s.label}>Notes (optionnel)</AureakText>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[s.input, s.textarea]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.text.muted}
                  />
                )}
              />
            </View>

            {errors.root?.message && <AureakText style={s.error}>{errors.root.message}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={isSubmitting}>
                <AureakText style={s.btnCancelLabel}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, isSubmitting && s.btnDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText style={s.btnSubmitLabel}>
                  {isSubmitting ? 'Création…' : 'Créer le partenariat'}
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
    maxWidth       : 560,
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
    minHeight       : 70,
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
