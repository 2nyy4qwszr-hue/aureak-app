'use client'
// Story 88.6 — Modale confirmation "Perdu" avec raison obligatoire (RHF + Zod)
import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateClubProspect, addProspectAction } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const schema = z.object({
  reason : z.string().trim().min(3, 'Raison requise (min 3 caractères)'),
  notes  : z.string().trim().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  visible        : boolean
  clubProspectId : string
  clubName       : string
  onClose        : () => void
  onSuccess?     : () => void
}

export function LostProspectModal({ visible, clubProspectId, clubName, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '', notes: '' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      // 1) Log d'abord une note avec la raison (trace avant le trigger statut)
      await addProspectAction({
        clubProspectId,
        actionType  : 'note',
        description : `Raison de la perte : ${data.reason}${data.notes ? ` — ${data.notes}` : ''}`,
      })
      // 2) Changement statut → le trigger auto-log `changement_statut`
      await updateClubProspect({ id: clubProspectId, status: 'perdu' })
      onSuccess?.()
      reset()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[LostProspectModal] error:', err)
      setServerError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Marquer comme perdu</AureakText>
            <AureakText style={s.sub as never}>
              Prospect : <AureakText style={s.clubName as never}>{clubName}</AureakText>
            </AureakText>
            <AureakText style={s.warning as never}>
              Cette action fait sortir le prospect du pipeline actif. La raison est conservée dans l'historique.
            </AureakText>

            <View style={s.field}>
              <AureakText style={s.label as never}>Raison de la perte *</AureakText>
              <Controller control={control} name="reason" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={s.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex : Budget insuffisant, concurrent choisi, projet repoussé…"
                />
              )} />
              {errors.reason && <AureakText style={s.error as never}>{errors.reason.message}</AureakText>}
            </View>

            <View style={s.field}>
              <AureakText style={s.label as never}>Notes complémentaires</AureakText>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, s.textarea]}
                  value={value ?? ''}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  placeholder="Contexte supplémentaire, prochaines étapes éventuelles…"
                />
              )} />
            </View>

            {serverError && <AureakText style={s.error as never}>{serverError}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={isSubmitting}>
                <AureakText style={s.btnCancelLabel as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, isSubmitting && s.btnDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                <AureakText style={s.btnSubmitLabel as never}>
                  {isSubmitting ? 'Enregistrement…' : 'Marquer comme perdu'}
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
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 540, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  sub     : { color: colors.text.muted, fontSize: 13 },
  clubName: { color: colors.text.dark, fontWeight: '700' },
  warning : {
    color          : colors.status.amberText,
    fontSize       : 12,
    backgroundColor: colors.status.amberText + '15',
    padding        : space.sm,
    borderRadius   : radius.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.amberText,
  },
  field   : { gap: space.xs },
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
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  error   : { color: colors.status.absent, fontSize: 12 },
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.status.absent },
  btnDisabled: { opacity: 0.5 },
  btnSubmitLabel: { color: '#fff', fontWeight: '700' },
})
