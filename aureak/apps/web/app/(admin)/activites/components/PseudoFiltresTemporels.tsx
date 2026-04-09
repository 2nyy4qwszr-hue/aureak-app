'use client'
// Story 80-1 — SegmentedToggle exact (pattern toggleRow de academie/joueurs/index.tsx)
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

export type TemporalFilter = 'today' | 'upcoming' | 'past'

const FILTERS: { key: TemporalFilter; label: string }[] = [
  { key: 'today',    label: "AUJOURD'HUI" },
  { key: 'upcoming', label: 'À VENIR'     },
  { key: 'past',     label: 'PASSÉES'     },
]

type Props = {
  value   : TemporalFilter
  onChange: (f: TemporalFilter) => void
}

export function PseudoFiltresTemporels({ value, onChange }: Props) {
  return (
    <View style={styles.toggleRow}>
      {FILTERS.map(f => {
        const isActive = f.key === value
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[styles.toggleBtn, isActive && styles.toggleBtnActive] as never}
          >
            <AureakText variant="label" style={[styles.toggleLabel, isActive && styles.toggleLabelActive] as never}>
              {f.label}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection  : 'row',
    gap            : 0,
    alignSelf      : 'flex-start',
    borderRadius   : radius.xs,
    overflow       : 'hidden',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  toggleBtn: {
    paddingVertical  : 8,
    paddingHorizontal: space.lg,
    backgroundColor  : colors.light.surface,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  toggleLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.muted,
  },
  toggleLabelActive: {
    color: colors.text.dark,
  },
})
