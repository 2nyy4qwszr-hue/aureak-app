// Badge RBFA — affiche le statut d'enrichissement RBFA d'un club — Story 28-1

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors } from '@aureak/theme'
import type { RbfaStatus } from '@aureak/types'

type Props = {
  status: RbfaStatus
  score?: number | null
}

const CONFIG: Record<RbfaStatus, { label: string; color: string; bg: string }> = {
  pending : { label: 'RBFA : en attente', color: colors.text.muted,     bg: colors.light.muted   },
  matched : { label: 'RBFA : lié',        color: '#10B981',              bg: '#d1fae5'             },
  rejected: { label: 'RBFA : rejeté',     color: colors.accent.red,      bg: '#fee2e2'             },
  skipped : { label: 'RBFA : aucun',      color: colors.text.subtle,     bg: colors.light.elevated },
}

export default function RbfaStatusBadge({ status, score }: Props) {
  const cfg = CONFIG[status]
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
      <AureakText style={[s.label, { color: cfg.color }] as never}>
        {cfg.label}
        {status === 'matched' && score != null ? ` (${Math.round(score)}%)` : ''}
      </AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    alignSelf        : 'flex-start',
    borderRadius     : 6,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  },
  label: {
    fontFamily   : 'Montserrat-SemiBold',
    fontSize     : 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
})
