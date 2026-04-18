'use client'
// Story 92-2 — Carte sponsor avec badge type + capsule status
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import type { Sponsor, CapsuleStatus, SponsorshipType } from '@aureak/types'
import { SPONSORSHIP_TYPE_LABELS, CAPSULE_STATUS_LABELS } from '@aureak/types'

const CAPSULE_BADGE: Record<CapsuleStatus, { bg: string; color: string }> = {
  not_started: { bg: colors.light.muted,      color: colors.text.muted },
  filming    : { bg: colors.status.warningBg,  color: colors.status.warning },
  editing    : { bg: colors.border.goldBg,     color: colors.accent.gold },
  published  : { bg: colors.status.successBg,  color: colors.status.success },
}

const TYPE_ICONS: Record<SponsorshipType, string> = {
  individual: '👤',
  club      : '🏟️',
  corporate : '🏢',
  media     : '📺',
}

type Props = {
  sponsor   : Sponsor
  childName?: string | null
  onEdit    : () => void
  onDelete  : () => void
}

export function SponsorCard({ sponsor, childName, onEdit, onDelete }: Props) {
  const capsule = sponsor.capsuleStatus ? CAPSULE_BADGE[sponsor.capsuleStatus] : null
  const capsuleLabel = sponsor.capsuleStatus ? CAPSULE_STATUS_LABELS[sponsor.capsuleStatus] : null

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AureakText style={styles.icon}>{TYPE_ICONS[sponsor.sponsorshipType]}</AureakText>
        <View style={{ flex: 1 }}>
          <AureakText style={styles.name} numberOfLines={1}>{sponsor.name}</AureakText>
          <AureakText style={styles.type}>{SPONSORSHIP_TYPE_LABELS[sponsor.sponsorshipType]}</AureakText>
        </View>
        {sponsor.amount != null && (
          <AureakText style={styles.amount}>
            {sponsor.amount.toLocaleString('fr-BE')} {sponsor.currency}
          </AureakText>
        )}
      </View>

      {/* Contact */}
      <AureakText style={styles.contact} numberOfLines={1}>
        {sponsor.contactName}{sponsor.contactEmail ? ` — ${sponsor.contactEmail}` : ''}
      </AureakText>

      {/* Child + Capsule */}
      <View style={styles.metaRow}>
        {childName && (
          <View style={styles.childBadge}>
            <AureakText style={styles.childBadgeText}>⚽ {childName}</AureakText>
          </View>
        )}
        {capsule && capsuleLabel && (
          <View style={[styles.capsuleBadge, { backgroundColor: capsule.bg }]}>
            <AureakText style={[styles.capsuleBadgeText, { color: capsule.color }] as never}>
              🎬 {capsuleLabel}
            </AureakText>
          </View>
        )}
      </View>

      {/* Dates */}
      <AureakText style={styles.dates}>
        Début : {new Date(sponsor.startDate).toLocaleDateString('fr-BE')}
        {sponsor.endDate ? ` — Fin : ${new Date(sponsor.endDate).toLocaleDateString('fr-BE')}` : ''}
      </AureakText>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
          onPress={onEdit}
        >
          <AureakText style={styles.editBtnText}>Modifier</AureakText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
          onPress={onDelete}
        >
          <AureakText style={styles.deleteBtnText}>Supprimer</AureakText>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    marginBottom : space.xs,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize  : 15,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  type: {
    fontSize  : 11,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  amount: {
    fontSize  : 16,
    fontWeight: '800',
    fontFamily: fonts.display,
    color     : colors.accent.gold,
  },
  contact: {
    fontSize    : 12,
    color       : colors.text.subtle,
    marginBottom: space.sm,
    fontFamily  : fonts.body,
  },
  metaRow: {
    flexDirection: 'row',
    gap          : space.xs,
    flexWrap     : 'wrap',
    marginBottom : space.xs,
  },
  childBadge: {
    backgroundColor  : colors.border.goldBg,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
  },
  childBadgeText: {
    fontSize  : 11,
    fontWeight: '600',
    color     : colors.accent.gold,
    fontFamily: fonts.body,
  },
  capsuleBadge: {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
  },
  capsuleBadgeText: {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  dates: {
    fontSize    : 11,
    color       : colors.text.muted,
    marginBottom: space.sm,
    fontFamily  : fonts.body,
  },
  actions: {
    flexDirection  : 'row',
    borderTopWidth : 1,
    borderTopColor : colors.border.divider,
    paddingTop     : space.xs,
    gap            : space.xs,
  },
  editBtn: {
    flex           : 1,
    backgroundColor: colors.border.goldBg,
    borderRadius   : radius.button,
    paddingVertical: 6,
    alignItems     : 'center',
  },
  editBtnText: {
    color     : colors.accent.gold,
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  deleteBtn: {
    backgroundColor: colors.status.errorBg,
    borderRadius   : radius.button,
    paddingVertical: 6,
    paddingHorizontal: space.md,
    alignItems     : 'center',
  },
  deleteBtnText: {
    color     : colors.status.absent,
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
})
