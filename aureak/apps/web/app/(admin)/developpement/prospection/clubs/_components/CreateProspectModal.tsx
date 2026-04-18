'use client'
// Story 88.2 — Modale ajout prospect (React Hook Form + Zod)
import React, { useEffect, useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { createClubProspect, listImplantations } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { CreateClubProspectParams } from '@aureak/types'

const schema = z.object({
  clubName            : z.string().min(1, 'Nom du club requis'),
  city                : z.string().min(1, 'Ville requise'),
  targetImplantationId: z.string().optional(),
  source              : z.string().optional(),
  notes               : z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

type ImplOption = { id: string; name: string }

export function CreateProspectModal({ visible, onClose, onCreated }: Props) {
  const { tenantId, user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [implantations, setImplantations] = useState<ImplOption[]>([])

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { clubName: '', city: '', targetImplantationId: '', source: '', notes: '' },
  })

  useEffect(() => {
    if (visible) {
      listImplantations().then(({ data: items }) => {
        setImplantations((items ?? []).map(i => ({ id: i.id, name: i.name })))
      }).catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[CreateProspectModal] implantations error:', err)
      })
    }
  }, [visible])

  async function onSubmit(data: FormData) {
    if (!tenantId || !user?.id) return
    setSaving(true)
    try {
      const params: CreateClubProspectParams = {
        clubName            : data.clubName,
        city                : data.city,
        targetImplantationId: data.targetImplantationId || undefined,
        source              : data.source || undefined,
        notes               : data.notes || undefined,
      }
      await createClubProspect(params, tenantId, user.id)
      reset()
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CreateProspectModal] create error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal as object} onPress={e => e.stopPropagation()}>
        <ScrollView>
          <AureakText variant="h2" style={styles.title}>Ajouter un prospect</AureakText>

          {/* Nom du club */}
          <AureakText style={styles.label}>Nom du club *</AureakText>
          <Controller
            control={control}
            name="clubName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.clubName && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: RFC Liège"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.clubName && <AureakText style={styles.errorText}>{errors.clubName.message}</AureakText>}

          {/* Ville */}
          <AureakText style={styles.label}>Ville *</AureakText>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Liège"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.city && <AureakText style={styles.errorText}>{errors.city.message}</AureakText>}

          {/* Implantation cible (select) */}
          <AureakText style={styles.label}>Implantation cible</AureakText>
          <Controller
            control={control}
            name="targetImplantationId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.selectWrapper}>
                <Pressable
                  style={styles.input}
                  onPress={() => {
                    // Simple cycle through options for RN Web
                    const currentIdx = implantations.findIndex(i => i.id === value)
                    const next = currentIdx + 1 >= implantations.length ? -1 : currentIdx + 1
                    onChange(next === -1 ? '' : implantations[next]?.id ?? '')
                  }}
                >
                  <AureakText style={value ? styles.selectText : styles.selectPlaceholder}>
                    {value ? implantations.find(i => i.id === value)?.name ?? 'Sélectionner...' : 'Aucune (cliquer pour changer)'}
                  </AureakText>
                </Pressable>
              </View>
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
                placeholder="Ex: Salon, Réseau, Bouche à oreille..."
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
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    padding          : space.sm,
    fontSize         : 14,
    fontFamily       : fonts.body,
    color            : colors.text.dark,
    backgroundColor  : colors.light.surface,
  },
  inputError: {
    borderColor: colors.status.absent,
  },
  textArea: {
    minHeight    : 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize  : 11,
    color     : colors.status.absent,
    fontFamily: fonts.body,
    marginTop : 2,
  },
  selectWrapper: {
    position: 'relative',
  },
  selectText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  selectPlaceholder: {
    fontSize  : 14,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
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
