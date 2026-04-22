'use client'
// Story 88.2 — Badge coloré pour ClubProspectStatus
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, radius } from '@aureak/theme'
import type { ClubProspectStatus } from '@aureak/types'
import { CLUB_PROSPECT_STATUS_LABELS } from '@aureak/types'

const COLOR_BY_STATUS: Record<ClubProspectStatus, string> = {
  premier_contact        : colors.text.muted,
  mapping_orga           : colors.status.amberText,
  decisionnaire_identifie: colors.accent.gold,
  rdv_qualifie           : colors.accent.gold,
  closing                : colors.status.present,
  converti               : colors.status.present,
  perdu                  : colors.status.absent,
}

export function ProspectStatusBadge({ status }: { status: ClubProspectStatus }) {
  const color = COLOR_BY_STATUS[status]
  const badgeStyle: ViewStyle = {
    backgroundColor: color + '22',
    borderColor    : color,
  }
  return (
    <View style={[s.badge, badgeStyle] as never}>
      <AureakText style={[s.text, { color }] as never}>
        {CLUB_PROSPECT_STATUS_LABELS[status]}
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    alignSelf        : 'flex-start',
  },
  text: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.3,
  },
})
