'use client'
// Story 65-1 — Activités Hub : Pseudo-filtres temporels (AUJOURD'HUI / À VENIR / PASSÉES)
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
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
    <View style={styles.container}>
      {FILTERS.map(f => {
        const isActive = f.key === value
        const pillStyle: ViewStyle = {
          paddingHorizontal: 14,
          paddingVertical  : 5,
          borderRadius     : radius.badge,
          backgroundColor  : isActive ? colors.accent.gold : colors.light.muted,
          borderWidth      : 1,
          borderColor      : isActive ? colors.accent.gold : colors.border.light,
        }
        const textStyle: TextStyle = {
          fontSize     : 11,
          fontWeight   : '700',
          fontFamily   : 'Montserrat',
          letterSpacing: 0.8,
          color        : isActive ? '#FFFFFF' : colors.text.muted,
        }
        return (
          <Pressable key={f.key} style={pillStyle} onPress={() => onChange(f.key)}>
            <AureakText style={textStyle}>{f.label}</AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },
})
