'use client'
// Story 92.3 — Card partenariat club (vue synthétique)
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import type { ClubPartnership, PartnershipAccessLevel } from '@aureak/api-client'

const ACCESS_LABELS: Record<PartnershipAccessLevel, string> = {
  read_catalogue: 'Catalogue public',
  read_bronze   : 'Grade Bronze',
  read_silver   : 'Grade Argent',
  full_read     : 'Accès complet',
}

const ACCESS_BADGE_BG: Record<PartnershipAccessLevel, string> = {
  read_catalogue: colors.border.light,
  read_bronze   : colors.accent.bronze,
  read_silver   : colors.accent.silver,
  full_read     : colors.accent.gold,
}

const ACCESS_BADGE_TEXT: Record<PartnershipAccessLevel, string> = {
  read_catalogue: colors.text.muted,
  read_bronze   : colors.light.surface,
  read_silver   : colors.text.dark,
  full_read     : colors.text.onGold,
}

export type PartnershipCardProps = {
  partnership    : ClubPartnership
  accessCount30d : number
  onRevoke       : (partnership: ClubPartnership) => void
}

function isActive(p: ClubPartnership): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return p.active_from <= today && (p.active_until === null || p.active_until >= today)
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Sans limite'
  return new Date(iso).toLocaleDateString('fr-FR')
}

export function PartnershipCard({ partnership, accessCount30d, onRevoke }: PartnershipCardProps) {
  const active = isActive(partnership)
  return (
    <View style={[s.card, !active && s.cardInactive]}>
      <View style={s.headerRow}>
        <AureakText style={s.name}>{partnership.partner_name}</AureakText>
        <View style={[s.statusBadge, active ? s.statusActive : s.statusInactive]}>
          <AureakText style={active ? { ...s.statusLabel, ...s.statusLabelActive } : { ...s.statusLabel, ...s.statusLabelInactive }}>
            {active ? 'Actif' : 'Inactif'}
          </AureakText>
        </View>
      </View>

      <View style={s.metaRow}>
        <View
          style={{
            ...s.accessBadge,
            backgroundColor: ACCESS_BADGE_BG[partnership.access_level],
          }}
        >
          <AureakText style={{
            ...s.accessBadgeLabel,
            color: ACCESS_BADGE_TEXT[partnership.access_level],
          }}>
            {ACCESS_LABELS[partnership.access_level]}
          </AureakText>
        </View>
      </View>

      <View style={s.infoRow}>
        <View style={s.infoCell}>
          <AureakText style={s.infoLabel}>Depuis</AureakText>
          <AureakText style={s.infoValue}>{formatDate(partnership.active_from)}</AureakText>
        </View>
        <View style={s.infoCell}>
          <AureakText style={s.infoLabel}>Jusqu'au</AureakText>
          <AureakText style={s.infoValue}>{formatDate(partnership.active_until)}</AureakText>
        </View>
        <View style={s.infoCell}>
          <AureakText style={s.infoLabel}>Accès (30j)</AureakText>
          <AureakText style={s.infoValue}>{accessCount30d}</AureakText>
        </View>
      </View>

      {partnership.notes ? (
        <AureakText style={s.notes}>{partnership.notes}</AureakText>
      ) : null}

      {active ? (
        <View style={s.actions}>
          <Pressable onPress={() => onRevoke(partnership)} style={s.revokeBtn}>
            <AureakText style={s.revokeLabel}>Révoquer</AureakText>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderRadius   : radius.card,
    padding        : space.md,
    gap            : space.sm,
    boxShadow      : shadows.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
  },
  name: {
    flex      : 1,
    fontSize  : 16,
    fontWeight: '700',
    color     : colors.text.dark,
    fontFamily: fonts.heading,
  },
  statusBadge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
  },
  statusActive: {
    backgroundColor: colors.status.successBg,
  },
  statusInactive: {
    backgroundColor: colors.border.light,
  },
  statusLabel: {
    fontSize  : 11,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  statusLabelActive: {
    color: colors.status.successText,
  },
  statusLabelInactive: {
    color: colors.text.muted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  accessBadge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : radius.badge,
  },
  accessBadgeLabel: {
    fontSize  : 11,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  infoRow: {
    flexDirection: 'row',
    gap          : space.md,
    flexWrap     : 'wrap',
  },
  infoCell: {
    gap: 2,
  },
  infoLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color        : colors.text.muted,
    fontFamily   : fonts.body,
  },
  infoValue: {
    fontSize  : 14,
    fontWeight: '600',
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  notes: {
    fontSize  : 13,
    fontStyle : 'italic',
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  actions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
  },
  revokeBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.status.errorBorder,
    backgroundColor  : colors.status.errorBg,
  },
  revokeLabel: {
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.status.errorText,
    fontFamily: fonts.body,
  },
})
