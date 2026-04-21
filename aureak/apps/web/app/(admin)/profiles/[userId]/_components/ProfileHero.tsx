'use client'
// Story 87.2 — Hero fiche personne : avatar + nom + badges rôle/statut + retour.
// Emails et rôles additionnels rendus ici — l'avatar image n'est pas exposé par
// getUserProfile (UserRow) donc on retombe sur les initiales.

import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText, ROLE_LABELS } from '@aureak/ui'
import type { UserRow } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { colors, fonts, space, radius } from '@aureak/theme'

const STATUS_LABELS: Record<string, string> = {
  active   : 'Actif',
  suspended: 'Suspendu',
  pending  : 'En attente',
  deleted  : 'Supprimé',
}

const STATUS_COLORS: Record<string, string> = {
  active   : colors.status.present,
  suspended: colors.status.attention,
  pending  : colors.text.muted,
  deleted  : colors.status.absent,
}

function getInitials(displayName: string | null): string {
  if (!displayName) return '?'
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

type ProfileHeroProps = {
  profile     : UserRow
  extraRoles  : UserRole[]
  canReadEmail: boolean
}

export function ProfileHero({ profile, extraRoles, canReadEmail }: ProfileHeroProps) {
  const router = useRouter()

  const statusLabel = STATUS_LABELS[profile.status] ?? profile.status
  const statusColor = STATUS_COLORS[profile.status] ?? colors.text.muted
  const roleLabel   = ROLE_LABELS[profile.userRole as UserRole] ?? profile.userRole
  const initials    = getInitials(profile.displayName)

  const extraRolesLabel = extraRoles.length > 0
    ? extraRoles.map(r => ROLE_LABELS[r]).join(', ')
    : undefined

  return (
    <View style={s.wrapper}>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && s.backBtnPressed] as never}>
        <AureakText style={s.backLabel as TextStyle}>← Retour</AureakText>
      </Pressable>

      <View style={s.row}>
        <View style={s.avatar}>
          <AureakText style={s.avatarInitials as TextStyle}>{initials}</AureakText>
        </View>

        <View style={s.content}>
          <View style={s.titleRow}>
            <AureakText style={s.title as TextStyle}>{profile.displayName || '—'}</AureakText>
            <View style={[s.badge, { backgroundColor: colors.accent.gold + '1F', borderColor: colors.accent.gold + '66' }]}>
              <AureakText style={[s.badgeLabel, { color: colors.text.dark }] as never}>{roleLabel}</AureakText>
            </View>
            {extraRoles.length > 0 ? (
              <View
                style={[s.badge, { backgroundColor: colors.light.muted, borderColor: colors.border.light }]}
                // @ts-ignore web title tooltip
                title={extraRolesLabel}
              >
                <AureakText style={[s.badgeLabel, { color: colors.text.muted }] as never}>
                  + {extraRoles.length} rôle{extraRoles.length > 1 ? 's' : ''}
                </AureakText>
              </View>
            ) : null}
            <View style={[s.badge, { backgroundColor: statusColor + '1F', borderColor: statusColor + '66' }]}>
              <AureakText style={[s.badgeLabel, { color: statusColor }] as never}>{statusLabel}</AureakText>
            </View>
          </View>
          <AureakText style={s.email as TextStyle}>
            {canReadEmail ? (profile.email ?? '—') : '—'}
          </AureakText>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : space.lg,
    gap            : space.md,
  },

  backBtn       : { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: radius.xs },
  backBtnPressed: { opacity: 0.7 },
  backLabel     : { color: colors.text.muted, fontSize: 13 },

  row    : { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar : {
    width          : 72,
    height         : 72,
    borderRadius   : 36,
    backgroundColor: colors.light.muted,
    borderWidth    : 2,
    borderColor    : colors.accent.gold + '66',
    alignItems     : 'center',
    justifyContent : 'center',
    flexShrink     : 0,
  },
  avatarInitials: {
    fontSize  : 22,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
    letterSpacing: 1,
  },

  content : { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  title   : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark },

  badge: {
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderRadius     : radius.badge,
    borderWidth      : 1,
  },
  badgeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  email: { fontSize: 13, color: colors.text.muted },
})
