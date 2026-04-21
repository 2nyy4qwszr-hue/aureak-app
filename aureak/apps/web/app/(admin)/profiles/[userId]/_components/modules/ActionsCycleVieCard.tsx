'use client'
// Story 87.2 — Card "Actions cycle de vie" (suspend / reactivate / delete)
// Masquée silencieusement si l'admin actif n'a pas la permission lifecycle.
// Reprend le comportement 1:1 de (admin)/users/[userId] avec pattern RN + tokens.

import { useState } from 'react'
import { View, Pressable, Modal, TextInput, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { suspendUser, reactivateUser, requestUserDeletion } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import { colors, fonts, space, radius } from '@aureak/theme'
import { cardStyles } from '../_card'

type Action = 'suspend' | 'reactivate' | 'delete'

type ActionsCycleVieCardProps = {
  profile           : UserRow
  canManageLifecycle: boolean
  onChange          : () => Promise<void>
}

export function ActionsCycleVieCard({ profile, canManageLifecycle, onChange }: ActionsCycleVieCardProps) {
  const [confirm,  setConfirm]  = useState<Action | null>(null)
  const [reason,   setReason]   = useState('')
  const [working,  setWorking]  = useState(false)
  const [feedback, setFeedback] = useState<string>('')

  if (!canManageLifecycle) return null

  const showSuspend    = profile.status === 'active' || profile.status === 'pending'
  const showReactivate = profile.status === 'suspended'
  const showDelete     = profile.status !== 'deleted'

  const execute = async (action: Action) => {
    setWorking(true)
    setFeedback('')
    try {
      let error: unknown
      if (action === 'suspend')         ({ error } = await suspendUser(profile.userId, reason || undefined))
      else if (action === 'reactivate') ({ error } = await reactivateUser(profile.userId))
      else                              ({ error } = await requestUserDeletion(profile.userId))

      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[ActionsCycleVieCard] action error:', error)
        setFeedback(`Erreur : ${(error as Error)?.message ?? 'inconnue'}`)
      } else {
        setFeedback(
          action === 'suspend'    ? 'Utilisateur suspendu.' :
          action === 'reactivate' ? 'Utilisateur réactivé.' :
                                    'Suppression demandée (anonymisation après 30 jours).',
        )
        setConfirm(null)
        setReason('')
        await onChange()
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Actions cycle de vie</AureakText>

      <View style={s.actions}>
        {showSuspend ? (
          <Pressable onPress={() => setConfirm('suspend')} style={({ pressed }) => [s.btn, s.btnWarn, pressed && s.btnPressed] as never}>
            <AureakText style={s.btnLabel as TextStyle}>Suspendre</AureakText>
          </Pressable>
        ) : null}
        {showReactivate ? (
          <Pressable onPress={() => setConfirm('reactivate')} style={({ pressed }) => [s.btn, s.btnOk, pressed && s.btnPressed] as never}>
            <AureakText style={s.btnLabel as TextStyle}>Réactiver</AureakText>
          </Pressable>
        ) : null}
        {showDelete ? (
          <Pressable onPress={() => setConfirm('delete')} style={({ pressed }) => [s.btn, s.btnDanger, pressed && s.btnPressed] as never}>
            <AureakText style={s.btnLabel as TextStyle}>Demander suppression</AureakText>
          </Pressable>
        ) : null}
      </View>

      {feedback ? (
        <AureakText style={s.feedback as TextStyle}>{feedback}</AureakText>
      ) : null}

      <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <AureakText style={s.modalTitle as TextStyle}>
              {confirm === 'suspend'    ? 'Suspendre le compte ?' :
               confirm === 'reactivate' ? 'Réactiver le compte ?' :
                                          'Demander la suppression ?'}
            </AureakText>
            {confirm === 'suspend' ? (
              <View style={s.modalField}>
                <AureakText style={cardStyles.fieldLabel as TextStyle}>Raison (optionnel)</AureakText>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Ex : non-respect du règlement"
                  placeholderTextColor={colors.text.muted}
                  style={s.input as never}
                />
              </View>
            ) : null}
            {confirm === 'delete' ? (
              <AureakText style={s.warn as TextStyle}>
                Le compte sera anonymisé après 30 jours. Cette action est enregistrée
                dans l'historique du profil.
              </AureakText>
            ) : null}

            <View style={s.modalActions}>
              <Pressable
                onPress={() => { setConfirm(null); setReason('') }}
                disabled={working}
                style={({ pressed }) => [s.btn, s.btnSecondary, pressed && s.btnPressed] as never}
              >
                <AureakText style={s.btnSecondaryLabel as TextStyle}>Annuler</AureakText>
              </Pressable>
              <Pressable
                onPress={() => confirm ? execute(confirm) : undefined}
                disabled={working}
                style={({ pressed }) => [
                  s.btn,
                  confirm === 'delete' ? s.btnDanger : confirm === 'reactivate' ? s.btnOk : s.btnWarn,
                  pressed && s.btnPressed,
                ] as never}
              >
                <AureakText style={s.btnLabel as TextStyle}>
                  {working ? 'En cours…' : 'Confirmer'}
                </AureakText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },

  btn           : { paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.xs, borderWidth: 1, borderColor: 'transparent' },
  btnPressed    : { opacity: 0.8 },
  btnWarn       : { backgroundColor: colors.accent.gold },
  btnOk         : { backgroundColor: colors.status.present },
  btnDanger     : { backgroundColor: colors.status.absent },
  btnSecondary  : { backgroundColor: 'transparent', borderColor: colors.border.light },
  btnLabel      : { color: colors.text.dark,  fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  btnSecondaryLabel: { color: colors.text.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  feedback: { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modalCard   : { backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.lg, width: '100%', maxWidth: 440, gap: space.md },
  modalTitle  : { fontSize: 18, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark },
  modalField  : { gap: 4 },
  warn        : { fontSize: 13, color: colors.status.attention, lineHeight: 20 },

  input: {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
    color            : colors.text.dark,
    fontSize         : 13,
    fontFamily       : fonts.body,
  },

  modalActions: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
})
