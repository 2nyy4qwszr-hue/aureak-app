'use client'
// Story 87.3 — Section "Rôles assignés" de l'onglet Accès.
// Chips des rôles actifs (union profiles.user_role + profile_roles), badge
// PRINCIPAL sur le rôle primaire, modal d'ajout d'un rôle secondaire.

import { useCallback, useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { AureakText, ROLE_LABELS } from '@aureak/ui'
import {
  listUserRoles, assignRoleToUser, revokeRoleFromUser,
} from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { colors, fonts, space, radius } from '@aureak/theme'
import { cardStyles } from '../card'

const ALL_ROLES: UserRole[] = [
  'admin', 'coach', 'parent', 'child', 'club', 'commercial', 'manager', 'marketeur',
]

type RolesSectionProps = {
  profile  : UserRow
  canMutate: boolean
}

export function RolesSection({ profile, canMutate }: RolesSectionProps) {
  const [secondaryRoles, setSecondaryRoles] = useState<UserRole[]>([])
  const [loading,        setLoading]        = useState(true)
  const [working,        setWorking]        = useState(false)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [confirmRemove,  setConfirmRemove]  = useState<UserRole | null>(null)

  const principal = profile.userRole as UserRole

  const reload = useCallback(async () => {
    try {
      const roles = await listUserRoles(profile.userId)
      setSecondaryRoles(roles.filter(r => r !== principal))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RolesSection] reload error:', err)
      setSecondaryRoles([])
    }
  }, [profile.userId, principal])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        await reload()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [reload])

  const handleAdd = async (role: UserRole) => {
    setWorking(true)
    try {
      await assignRoleToUser(profile.userId, role)
      await reload()
      setModalOpen(false)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RolesSection] assign error:', err)
    } finally {
      setWorking(false)
    }
  }

  const handleRemove = async (role: UserRole) => {
    setWorking(true)
    try {
      await revokeRoleFromUser(profile.userId, role)
      await reload()
      setConfirmRemove(null)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[RolesSection] revoke error:', err)
    } finally {
      setWorking(false)
    }
  }

  const availableRoles = ALL_ROLES.filter(
    r => r !== principal && !secondaryRoles.includes(r),
  )

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Rôles assignés</AureakText>

      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : (
        <>
          <View style={s.chipsRow}>
            <RoleChip role={principal} isPrincipal onRemove={null} />
            {secondaryRoles.map(role => (
              <RoleChip
                key={role}
                role={role}
                isPrincipal={false}
                onRemove={canMutate ? () => setConfirmRemove(role) : null}
              />
            ))}
            {canMutate && availableRoles.length > 0 ? (
              <Pressable
                onPress={() => setModalOpen(true)}
                style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed] as never}
              >
                <AureakText style={s.addBtnLabel as TextStyle}>+ Ajouter un rôle</AureakText>
              </Pressable>
            ) : null}
          </View>

          {secondaryRoles.length === 0 ? (
            <AureakText style={cardStyles.subLabel as TextStyle}>
              Aucun rôle secondaire — ajouter un rôle pour autoriser cette personne à basculer de contexte.
            </AureakText>
          ) : null}
        </>
      )}

      {/* Modal ajout rôle */}
      {modalOpen ? (
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <AureakText style={s.modalTitle as TextStyle}>Ajouter un rôle secondaire</AureakText>
            <View style={s.modalList}>
              {availableRoles.map(role => (
                <Pressable
                  key={role}
                  disabled={working}
                  onPress={() => handleAdd(role)}
                  style={({ pressed }) => [s.modalItem, pressed && s.modalItemPressed] as never}
                >
                  <AureakText style={s.modalItemLabel as TextStyle}>{ROLE_LABELS[role]}</AureakText>
                </Pressable>
              ))}
            </View>
            <Pressable
              disabled={working}
              onPress={() => setModalOpen(false)}
              style={({ pressed }) => [s.modalCancel, pressed && s.modalCancelPressed] as never}
            >
              <AureakText style={s.modalCancelLabel as TextStyle}>
                {working ? 'En cours…' : 'Annuler'}
              </AureakText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Confirmation inline retrait */}
      {confirmRemove ? (
        <View style={s.confirmBar}>
          <AureakText style={s.confirmText as TextStyle}>
            Retirer le rôle « {ROLE_LABELS[confirmRemove]} » ?
          </AureakText>
          <View style={s.confirmActions}>
            <Pressable
              disabled={working}
              onPress={() => setConfirmRemove(null)}
              style={({ pressed }) => [s.secondaryBtn, pressed && s.btnPressed] as never}
            >
              <AureakText style={s.secondaryBtnLabel as TextStyle}>Annuler</AureakText>
            </Pressable>
            <Pressable
              disabled={working}
              onPress={() => handleRemove(confirmRemove)}
              style={({ pressed }) => [s.dangerBtn, pressed && s.btnPressed] as never}
            >
              <AureakText style={s.dangerBtnLabel as TextStyle}>
                {working ? 'En cours…' : 'Retirer'}
              </AureakText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

// ── RoleChip ────────────────────────────────────────────────────────────────
function RoleChip({
  role, isPrincipal, onRemove,
}: {
  role       : UserRole
  isPrincipal: boolean
  onRemove   : (() => void) | null
}) {
  return (
    <View style={s.chip}>
      <AureakText style={s.chipLabel as TextStyle}>{ROLE_LABELS[role]}</AureakText>
      {isPrincipal ? (
        <View style={s.principalBadge}>
          <AureakText style={s.principalBadgeLabel as TextStyle}>PRINCIPAL</AureakText>
        </View>
      ) : null}
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => [s.chipClose, pressed && s.chipClosePressed] as never}
          accessibilityLabel={`Retirer le rôle ${ROLE_LABELS[role]}`}
        >
          <AureakText style={s.chipCloseLabel as TextStyle}>×</AureakText>
        </Pressable>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  chipsRow: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap', alignItems: 'center' },

  chip: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : space.xs,
    paddingHorizontal: 10,
    paddingVertical  : 6,
    backgroundColor  : colors.light.hover,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  chipLabel: { fontSize: 12, fontWeight: '700', color: colors.text.dark, letterSpacing: 0.3 },

  principalBadge: {
    paddingHorizontal: 6,
    paddingVertical  : 2,
    backgroundColor  : colors.accent.gold + '1F',
    borderRadius     : 4,
  },
  principalBadgeLabel: { fontSize: 9, fontWeight: '700', color: colors.accent.gold, letterSpacing: 0.5 },

  chipClose       : { paddingHorizontal: 4, paddingVertical: 2 },
  chipClosePressed: { opacity: 0.6 },
  chipCloseLabel  : { fontSize: 14, fontWeight: '700', color: colors.text.muted },

  addBtn       : { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.badge, borderWidth: 1, borderColor: colors.accent.gold, borderStyle: 'dashed' },
  addBtnPressed: { opacity: 0.7 },
  addBtnLabel  : { fontSize: 12, fontWeight: '700', color: colors.accent.gold, letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    position       : 'absolute',
    top            : 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.text.dark + '80',
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.lg,
  },
  modalCard : { backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.lg, width: '100%', maxWidth: 420, gap: space.sm },
  modalTitle: { fontSize: 16, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark },
  modalList : { gap: 4 },
  modalItem : {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  modalItemPressed: { backgroundColor: colors.light.hover },
  modalItemLabel  : { fontSize: 13, color: colors.text.dark, fontWeight: '600' },

  modalCancel       : { alignSelf: 'flex-end', paddingHorizontal: space.md, paddingVertical: 8 },
  modalCancelPressed: { opacity: 0.7 },
  modalCancelLabel  : { fontSize: 12, color: colors.text.muted, fontWeight: '700' },

  // Confirm retrait inline
  confirmBar: {
    marginTop        : space.sm,
    padding          : space.md,
    backgroundColor  : colors.status.attention + '20',
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.status.attention + '66',
    gap              : space.sm,
  },
  confirmText   : { fontSize: 13, color: colors.text.dark },
  confirmActions: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },

  secondaryBtn       : { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  secondaryBtnLabel  : { fontSize: 12, color: colors.text.muted, fontWeight: '700' },

  dangerBtn          : { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.xs, backgroundColor: colors.status.absent },
  dangerBtnLabel     : { fontSize: 12, color: colors.text.dark, fontWeight: '700' },

  btnPressed: { opacity: 0.8 },
})
