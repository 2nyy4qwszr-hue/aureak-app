'use client'
// Story 87.2 — Card "Informations compte" — toujours affichée.
// Grille 2 colonnes : email, téléphone, rôle, statut, invitation, création,
// dernière connexion, ID technique.

import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText, ROLE_LABELS } from '@aureak/ui'
import type { UserRow } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { colors, fonts, space } from '@aureak/theme'
import { cardStyles } from '../_card'

const STATUS_LABELS: Record<string, string> = {
  active   : 'Actif',
  suspended: 'Suspendu',
  pending  : 'En attente',
  deleted  : 'Supprimé',
}

const INVITE_LABELS: Record<string, string> = {
  not_invited: 'Non invité',
  invited    : 'Invité',
  active     : 'Actif',
}

const INVITE_COLORS: Record<string, string> = {
  not_invited: colors.text.muted,
  invited    : colors.status.attention,
  active     : colors.status.present,
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type InformationsCompteCardProps = {
  profile     : UserRow
  canReadEmail: boolean
}

export function InformationsCompteCard({ profile, canReadEmail }: InformationsCompteCardProps) {
  const roleLabel   = ROLE_LABELS[profile.userRole as UserRole] ?? profile.userRole
  const statusLabel = STATUS_LABELS[profile.status] ?? profile.status
  const inviteLabel = INVITE_LABELS[profile.inviteStatus] ?? profile.inviteStatus
  const inviteColor = INVITE_COLORS[profile.inviteStatus] ?? colors.text.muted

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Informations compte</AureakText>
      <View style={s.grid}>
        <Field label={'Email'}     value={canReadEmail ? (profile.email ?? '—') : '—'} />
        <Field label={'Téléphone'} value={profile.phone ?? '—'} />
        <Field label={'Rôle'}      value={roleLabel} />
        <Field label={'Statut'}    value={statusLabel} />
        <Field label={'Invitation'} value={inviteLabel} color={inviteColor} />
        <Field label={"Date de création"}     value={fmtDate(profile.createdAt)} />
        <Field label={'Dernière connexion'}   value={fmtDateTime(profile.lastSignInAt)} />
        <Field label={'ID technique'}         value={profile.userId} mono />
      </View>
    </View>
  )
}

function Field({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <View style={s.field}>
      <AureakText style={cardStyles.fieldLabel as TextStyle}>{label}</AureakText>
      <AureakText
        style={[
          cardStyles.fieldValue,
          color ? { color } : null,
          mono ? s.mono : null,
        ] as never}
      >
        {value}
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  grid : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  field: { flexGrow: 1, flexBasis: '45%', minWidth: 200, gap: 4 },
  mono : { fontFamily: fonts.body, fontSize: 11, color: colors.text.muted },
})
