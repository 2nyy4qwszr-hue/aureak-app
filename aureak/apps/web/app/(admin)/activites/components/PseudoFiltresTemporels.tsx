'use client'
// Story 80-1 — TierPills exact (copie du pattern TIER_PILLS_CONFIG de children/index.tsx)
// Actif = même bg, borderWidth 2, opacity 1 — Inactif = borderWidth 1, opacity 0.75
import React from 'react'
import { ScrollView, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors } from '@aureak/theme'

export type TemporalFilter = 'today' | 'upcoming' | 'past'

const FILTERS_CONFIG: { key: TemporalFilter; label: string; bg: string; textColor: string; borderColor: string }[] = [
  { key: 'today',    label: "AUJOURD'HUI", bg: colors.accent.gold,   textColor: colors.text.dark,  borderColor: colors.border.goldSolid },
  { key: 'upcoming', label: 'À VENIR',     bg: colors.light.surface, textColor: colors.text.dark,  borderColor: colors.border.light     },
  { key: 'past',     label: 'PASSÉES',     bg: colors.light.muted,   textColor: colors.text.muted, borderColor: colors.border.light     },
]

type Props = {
  value   : TemporalFilter
  onChange: (f: TemporalFilter) => void
}

export function PseudoFiltresTemporels({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tp.row}
    >
      {FILTERS_CONFIG.map(cfg => {
        const isActive = cfg.key === value
        return (
          <Pressable
            key={cfg.key}
            style={[
              tp.pill,
              {
                backgroundColor: cfg.bg,
                borderColor    : cfg.borderColor,
                borderWidth    : isActive ? 2 : 1,
                opacity        : isActive ? 1 : 0.75,
              },
            ]}
            onPress={() => onChange(cfg.key)}
          >
            <AureakText style={[tp.label, { color: cfg.textColor, fontWeight: isActive ? '700' : '500' }] as never}>
              {cfg.label}
            </AureakText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const tp = StyleSheet.create({
  row  : { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  pill : { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, letterSpacing: 0.2 },
})
