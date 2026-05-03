'use client'
// Story 89.4 — Modale d'invitation à une séance gratuite
// Formulaire (RHF + Zod) pour envoyer une invitation au parent d'un gardien prospect.
// L'API client déclenche l'Edge Function `send-trial-invitation` qui :
//   - persiste l'email parent sur la fiche si vide
//   - envoie l'email via Resend
//   - trace dans `prospect_invitations`
//   - passe `prospect_status` → 'invite'

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  sendTrialInvitation,
  listImplantations,
} from '@aureak/api-client'
import type { Implantation, ProspectInvitation } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

// ── Schema Zod ────────────────────────────────────────────────────────────────

const schema = z.object({
  parentEmail   : z.string().trim().email('Email invalide'),
  parentName    : z.string().trim().optional(),
  implantationId: z.string().optional(),    // UUID ou '' (= non spécifié)
  message       : z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  visible            : boolean
  onClose            : () => void
  childId            : string
  gardienDisplayName : string
  defaultParentEmail?: string | null
  defaultParentName? : string | null
  onSuccess?         : (invitation: ProspectInvitation) => void
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function TrialInvitationModal({
  visible, onClose, childId, gardienDisplayName,
  defaultParentEmail, defaultParentName, onSuccess,
}: Props) {
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [successMsg,    setSuccessMsg]    = useState<string | null>(null)

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      parentEmail   : defaultParentEmail ?? '',
      parentName    : defaultParentName ?? '',
      implantationId: '',
      message       : '',
    },
  })

  // Charger les implantations à l'ouverture
  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await listImplantations()
        if (!cancelled) setImplantations(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[TrialInvitationModal] listImplantations error:', err)
      }
    })()
    return () => { cancelled = true }
  }, [visible])

  // Reset à chaque ouverture
  useEffect(() => {
    if (visible) {
      reset({
        parentEmail   : defaultParentEmail ?? '',
        parentName    : defaultParentName ?? '',
        implantationId: '',
        message       : '',
      })
      setServerError(null)
      setSuccessMsg(null)
    }
  }, [visible, defaultParentEmail, defaultParentName, reset])

  const onSubmit = async (values: FormData) => {
    setServerError(null)
    setSuccessMsg(null)
    try {
      const result = await sendTrialInvitation({
        childId,
        parentEmail   : values.parentEmail,
        parentName    : values.parentName?.trim() || null,
        implantationId: values.implantationId && values.implantationId.length > 0 ? values.implantationId : null,
        message       : values.message?.trim() || null,
      })
      if (result.error || !result.invitation) {
        setServerError(result.error ?? 'Erreur inconnue')
        return
      }
      setSuccessMsg(`Invitation envoyée à ${values.parentEmail}`)
      onSuccess?.(result.invitation)
      // Fermer après 1.5s pour laisser lire le message
      setTimeout(() => { onClose() }, 1500)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TrialInvitationModal] sendTrialInvitation error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <View style={s.dialog} onStartShouldSetResponder={() => true}>
          <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md }}>
            <View>
              <AureakText variant="h3" style={{ color: colors.text.dark }}>
                Inviter à une séance gratuite
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
                Pour {gardienDisplayName} — envoi d'un email professionnel au parent
              </AureakText>
            </View>

            {/* Parent email — obligatoire */}
            <Controller
              control={control}
              name="parentEmail"
              render={({ field: { value, onChange, onBlur } }) => (
                <View style={s.field}>
                  <AureakText variant="caption" style={s.label}>Email parent *</AureakText>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="parent@exemple.be"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={[s.input, errors.parentEmail && s.inputError]}
                  />
                  {errors.parentEmail && (
                    <AureakText variant="caption" style={s.errorText}>
                      {errors.parentEmail.message}
                    </AureakText>
                  )}
                </View>
              )}
            />

            {/* Parent prénom */}
            <Controller
              control={control}
              name="parentName"
              render={({ field: { value, onChange, onBlur } }) => (
                <View style={s.field}>
                  <AureakText variant="caption" style={s.label}>Prénom du parent (optionnel)</AureakText>
                  <TextInput
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Marie"
                    placeholderTextColor={colors.text.muted}
                    style={s.input}
                  />
                </View>
              )}
            />

            {/* Implantation */}
            <Controller
              control={control}
              name="implantationId"
              render={({ field: { value, onChange } }) => (
                <View style={s.field}>
                  <AureakText variant="caption" style={s.label}>Implantation souhaitée (optionnel)</AureakText>
                  <View style={s.pickerWrap}>
                    {/* Web-only <select> pour un vrai picker — RN <Picker> nécessite un package additionnel */}
                    <select
                      value={value ?? ''}
                      onChange={(e) => onChange(e.target.value)}
                      style={{
                        width           : '100%',
                        padding         : '8px 10px',
                        borderRadius    : 6,
                        border          : `1px solid ${colors.border.light}`,
                        backgroundColor : colors.light.muted,
                        fontSize        : 13,
                        color           : colors.text.dark,
                        fontFamily      : 'inherit',
                      }}
                    >
                      <option value="">— Aucune préférence —</option>
                      {implantations.map((impl) => (
                        <option key={impl.id} value={impl.id}>{impl.name}</option>
                      ))}
                    </select>
                  </View>
                </View>
              )}
            />

            {/* Message personnalisé */}
            <Controller
              control={control}
              name="message"
              render={({ field: { value, onChange, onBlur } }) => (
                <View style={s.field}>
                  <AureakText variant="caption" style={s.label}>Message personnalisé (optionnel)</AureakText>
                  <TextInput
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Un mot personnel qui sera intégré à l'email…"
                    placeholderTextColor={colors.text.muted}
                    multiline
                    style={[s.input, { minHeight: 80, textAlignVertical: 'top' as never, paddingTop: 8 }]}
                  />
                </View>
              )}
            />

            {/* Feedback */}
            {serverError && (
              <View style={s.errorBanner}>
                <AureakText variant="caption" style={{ color: colors.status.absent }}>
                  {serverError}
                </AureakText>
              </View>
            )}
            {successMsg && (
              <View style={s.successBanner}>
                <AureakText variant="caption" style={{ color: colors.status.present }}>
                  {successMsg}
                </AureakText>
              </View>
            )}

            {/* Actions */}
            <View style={s.actions}>
              <Pressable
                style={s.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.submitBtn, isSubmitting && { opacity: 0.55 }]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' as never }}>
                  {isSubmitting ? 'Envoi en cours…' : 'Envoyer l\'invitation'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay       : {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.xl,
  },
  dialog        : {
    width          : '100%',
    maxWidth       : 520,
    maxHeight      : '85%' as never,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    overflow       : 'hidden',
    elevation      : 5,
    // Story 110.10 — boxShadow web
    // @ts-ignore web-only
    boxShadow      : '0 2px 10px rgba(0,0,0,0.10)',
  },
  field         : { gap: 4 },
  label         : { color: colors.text.muted, fontSize: 11, fontWeight: '700' as never, letterSpacing: 0.5, textTransform: 'uppercase' as never },
  input         : {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 8,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  inputError    : { borderColor: colors.status.absent },
  pickerWrap    : {},
  errorText     : { color: colors.status.absent, fontSize: 11, marginTop: 2 },
  errorBanner   : { backgroundColor: colors.status.absent + '15', borderRadius: radius.xs, padding: space.sm, borderLeftWidth: 3, borderLeftColor: colors.status.absent },
  successBanner : { backgroundColor: colors.status.present + '15', borderRadius: radius.xs, padding: space.sm, borderLeftWidth: 3, borderLeftColor: colors.status.present },
  actions       : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, marginTop: space.xs },
  cancelBtn     : {
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  submitBtn     : {
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
})
