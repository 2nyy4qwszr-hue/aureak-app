'use client'
// Story 90.1 — Badge coloré pour CoachProspectStatus
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, radius, space } from '@aureak/theme'
import type { CoachProspectStatus } from '@aureak/types'
import { COACH_PROSPECT_STATUS_LABELS } from '@aureak/types'

type Tone = { bg: string; text: string; border: string }

const TONE_BY_STATUS: Record<CoachProspectStatus, Tone> = {
  identifie    : { bg: colors.light.muted,      text: colors.text.muted,         border: colors.border.divider    },
  info_envoyee : { bg: colors.status.amberBg,   text: colors.status.amberText,   border: colors.status.amberText  },
  en_formation : { bg: colors.border.goldBg,    text: colors.accent.gold,        border: colors.border.goldSolid  },
  actif        : { bg: colors.status.successBg, text: colors.status.successText, border: colors.status.successText },
  perdu        : { bg: colors.status.redBg,     text: colors.status.redText,     border: colors.status.redText    },
}

export function CoachProspectStatusBadge({ status }: { status: CoachProspectStatus }) {
  const tone = TONE_BY_STATUS[status]
  const badgeStyle: ViewStyle = {
    backgroundColor: tone.bg,
    borderColor    : tone.border,
  }
  return (
    <View style={[s.badge, badgeStyle] as never}>
      <AureakText style={[s.text, { color: tone.text }] as never}>
        {COACH_PROSPECT_STATUS_LABELS[status]}
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: space.sm,
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
