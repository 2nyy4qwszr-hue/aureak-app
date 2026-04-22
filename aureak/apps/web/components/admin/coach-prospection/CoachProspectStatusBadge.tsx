'use client'
// Story 90.1 — Badge coloré pour CoachProspectStatus
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, radius } from '@aureak/theme'
import type { CoachProspectStatus } from '@aureak/types'
import { COACH_PROSPECT_STATUS_LABELS } from '@aureak/types'

const COLOR_BY_STATUS: Record<CoachProspectStatus, string> = {
  identifie    : colors.text.muted,
  info_envoyee : colors.status.amberText,
  en_formation : colors.accent.gold,
  actif        : colors.status.present,
  perdu        : colors.status.absent,
}

export function CoachProspectStatusBadge({ status }: { status: CoachProspectStatus }) {
  const color = COLOR_BY_STATUS[status]
  const badgeStyle: ViewStyle = {
    backgroundColor: color + '22',
    borderColor    : color,
  }
  return (
    <View style={[s.badge, badgeStyle] as never}>
      <AureakText style={[s.text, { color }] as never}>
        {COACH_PROSPECT_STATUS_LABELS[status]}
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
