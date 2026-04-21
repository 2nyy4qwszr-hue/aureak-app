'use client'
// Story 89.5 — Modale d'ajout à la liste d'attente d'un groupe
// Formulaire (RHF + Zod) pour ajouter un gardien prospect à la trial_waitlist
// d'un groupe. Quand une absence sera enregistrée dans ce groupe, le système
// notifiera automatiquement le parent par email (Edge Function notify-waitlist).

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  addToWaitlist,
  listAllGroups,
  listImplantations,
} from '@aureak/api-client'
import type { Implantation, GroupWithMeta, TrialWaitlistEntry } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  implantationId: z.string().uuid('Implantation requise'),
  groupId       : z.string().uuid('Groupe requis'),
  parentEmail   : z.string().trim().email('Email invalide'),
  parentPhone   : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible            : boolean
  onClose            : () => void
  childId            : string
  gardienDisplayName : string
  defaultParentEmail?: string | null
  onSuccess?         : (entry: TrialWaitlistEntry) => void
}

export function WaitlistModal({
  visible, onClose, childId, gardienDisplayName,
  defaultParentEmail, onSuccess,
}: Props) {
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups,        setGroups]        = useState<GroupWithMeta[]>([])
  const [serverError,   setServerError]   = useState<string | null>(null)
  const [successMsg,    setSuccessMsg]    = useState<string | null>(null)

  const {
    control, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      implantationId: '',
      groupId       : '',
      parentEmail   : defaultParentEmail ?? '',
      parentPhone   : '',
    },
  })

  const selectedImplantationId = watch('implantationId')

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      try {
        const [implRes, groupsRes] = await Promise.all([
          listImplantations(),
          listAllGroups(),
        ])
        if (cancelled) return
        setImplantations(implRes.data)
        setGroups(groupsRes)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[WaitlistModal] load error:', err)
      }
    })()
    return () => { cancelled = true }
  }, [visible])

  const filteredGroups = selectedImplantationId
    ? groups.filter(g => g.implantationId === selectedImplantationId)
    : []

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setSuccessMsg(null)
    try {
      const entry = await addToWaitlist({
        childId,
        groupId       : data.groupId,
        implantationId: data.implantationId,
        parentEmail   : data.parentEmail,
        parentPhone   : data.parentPhone || null,
      })
      setSuccessMsg('Ajouté à la liste d\'attente')
      onSuccess?.(entry)
      setTimeout(() => {
        reset()
        onClose()
        setSuccessMsg(null)
      }, 1200)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[WaitlistModal] addToWaitlist error:', err)
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setServerError(msg.includes('unique') ? 'Ce gardien est déjà en liste d\'attente pour ce groupe.' : msg)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <View style={s.header}>
              <AureakText variant="h2" style={s.title}>Ajouter en liste d'attente</AureakText>
              <AureakText variant="caption" style={s.subtitle}>
                {gardienDisplayName}
              </AureakText>
            </View>

            {/* Implantation */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Implantation</AureakText>
              <Controller
                control={control}
                name="implantationId"
                render={({ field: { onChange, value } }) => (
                  <View style={s.chipRow}>
                    {implantations.map(imp => (
                      <Pressable
                        key={imp.id}
                        onPress={() => { onChange(imp.id); setValue('groupId', '') }}
                        style={[s.chip, value === imp.id && s.chipActive]}
                      >
                        <AureakText variant="caption" style={value === imp.id ? s.chipTextActive : s.chipText}>
                          {imp.name}
                        </AureakText>
                      </Pressable>
                    ))}
                  </View>
                )}
              />
              {errors.implantationId && <AureakText style={s.error}>{errors.implantationId.message}</AureakText>}
            </View>

            {/* Groupe */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Groupe cible</AureakText>
              {!selectedImplantationId ? (
                <AureakText variant="caption" style={s.hint}>Sélectionnez d'abord une implantation.</AureakText>
              ) : filteredGroups.length === 0 ? (
                <AureakText variant="caption" style={s.hint}>Aucun groupe pour cette implantation.</AureakText>
              ) : (
                <Controller
                  control={control}
                  name="groupId"
                  render={({ field: { onChange, value } }) => (
                    <View style={s.chipRow}>
                      {filteredGroups.map(g => (
                        <Pressable
                          key={g.id}
                          onPress={() => onChange(g.id)}
                          style={[s.chip, value === g.id && s.chipActive]}
                        >
                          <AureakText variant="caption" style={value === g.id ? s.chipTextActive : s.chipText}>
                            {g.name}
                          </AureakText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                />
              )}
              {errors.groupId && <AureakText style={s.error}>{errors.groupId.message}</AureakText>}
            </View>

            {/* Email parent */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Email parent</AureakText>
              <Controller
                control={control}
                name="parentEmail"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={s.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="parent@exemple.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.parentEmail && <AureakText style={s.error}>{errors.parentEmail.message}</AureakText>}
            </View>

            {/* Téléphone parent (optionnel) */}
            <View style={s.field}>
              <AureakText variant="caption" style={s.label}>Téléphone parent (optionnel)</AureakText>
              <Controller
                control={control}
                name="parentPhone"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={s.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="+32 …"
                    keyboardType="phone-pad"
                  />
                )}
              />
            </View>

            {serverError && <AureakText style={s.error}>{serverError}</AureakText>}
            {successMsg  && <AureakText style={s.success}>{successMsg}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={isSubmitting}>
                <AureakText variant="caption" style={s.btnCancelLabel}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, isSubmitting && s.btnSubmitDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText variant="caption" style={s.btnSubmitLabel}>
                  {isSubmitting ? 'Ajout…' : 'Ajouter'}
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
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 520, maxHeight: '90%' },
  body    : { padding: space.lg, gap: space.md },
  header  : { gap: 4, marginBottom: space.sm },
  title   : { color: colors.text.dark, fontWeight: '700' },
  subtitle: { color: colors.text.muted },
  field   : { gap: space.xs },
  label   : { color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 },
  hint    : { color: colors.text.subtle, fontStyle: 'italic' },
  input   : {
    borderWidth: 1, borderColor: colors.border.divider, borderRadius: radius.xs,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    color: colors.text.dark, backgroundColor: colors.light.primary,
  },
  chipRow : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip    : {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border.divider,
    backgroundColor: colors.light.primary,
  },
  chipActive    : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  chipText      : { color: colors.text.muted },
  chipTextActive: { color: colors.light.surface, fontWeight: '700' },
  error   : { color: colors.status.absent, fontSize: 12 },
  success : { color: colors.status.present, fontSize: 12, fontWeight: '700' },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel      : { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel : { color: colors.text.muted },
  btnSubmit      : { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  btnSubmitDisabled: { opacity: 0.5 },
  btnSubmitLabel : { color: colors.light.surface, fontWeight: '700' },
})
