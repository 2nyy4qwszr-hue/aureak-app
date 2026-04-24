'use client'
// Style segmented toggle aligné sur SeancesPage (timeToggle).
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, radius } from '@aureak/theme'

export type TemporalFilter = 'today' | 'upcoming' | 'past'

const FILTERS: { key: TemporalFilter; label: string }[] = [
  { key: 'today',    label: "Aujourd'hui" },
  { key: 'upcoming', label: 'À venir'     },
  { key: 'past',     label: 'Passées'     },
]

type Props = {
  value   : TemporalFilter
  onChange: (f: TemporalFilter) => void
}

export function PseudoFiltresTemporels({ value, onChange }: Props) {
  return (
    <View style={styles.toggle}>
      {FILTERS.map(f => {
        const active = f.key === value
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[styles.toggleBtn, active && styles.toggleBtnActive]}
          >
            <AureakText
              style={[styles.toggleText, active && styles.toggleTextActive] as never}
            >
              {f.label}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection  : 'row',
    gap            : 4,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : 3,
    alignSelf      : 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : radius.xs - 2,
    borderWidth      : 1,
    borderColor      : 'transparent',
  },
  toggleBtnActive: {
    backgroundColor: colors.light.surface,
    borderColor    : colors.border.divider,
  },
  toggleText: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  toggleTextActive: {
    color     : colors.text.dark,
    fontWeight: '600',
  },
})
