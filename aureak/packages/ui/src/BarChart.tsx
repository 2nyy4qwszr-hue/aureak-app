'use client'
// @aureak/ui — BarChart (Story 60.4)
// Bar chart horizontal générique — zéro librairie externe
// RÈGLE : zéro logique métier, purement présentationnel
// RÈGLE : couleurs via @aureak/theme tokens — pas de valeurs hex hardcodées dans ce composant

import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors, radius, transitions } from '@aureak/theme'
import type { BarChartItem } from '@aureak/types'

// ── Props ─────────────────────────────────────────────────────────────────────
export interface BarChartProps {
  data         : BarChartItem[]
  maxValue?    : number
  unit?        : string                    // ex. '%' ou '/5'
  onItemClick? : (id: string) => void
  colorFn?     : (value: number) => string
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function BarChart({ data, maxValue, unit = '%', onItemClick, colorFn }: BarChartProps) {
  const max = maxValue ?? Math.max(1, ...data.map(d => d.value))

  if (data.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>Aucune implantation avec données</Text>
      </View>
    )
  }

  return (
    <View style={{ gap: 8 }}>
      {data.map(item => {
        const barColor = colorFn ? colorFn(item.value) : colors.accent.gold
        const pct      = Math.min(100, (item.value / max) * 100)

        return (
          <Pressable
            key={item.id}
            onPress={() => onItemClick?.(item.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 } as never}
          >
            {/* Rang */}
            <Text style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.text.muted }}>
              #{item.rank}
            </Text>

            {/* Nom */}
            <Text
              numberOfLines={1}
              style={{ width: 130, fontSize: 13, color: colors.text.dark, flexShrink: 0 } as never}
            >
              {item.label}
            </Text>

            {/* Barre + valeur */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  flex           : 1,
                  height         : 32,
                  backgroundColor: colors.light.muted,
                  borderRadius   : radius.xs,
                  overflow       : 'hidden' as never,
                }}
              >
                <View
                  style={{
                    height         : 32,
                    width          : `${pct}%` as never,
                    backgroundColor: barColor,
                    borderRadius   : radius.xs,
                    transition     : `width ${transitions.normal}`,
                  } as never}
                />
              </View>
              <Text style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.text.dark }}>
                {typeof item.value === 'number' && !Number.isInteger(item.value)
                  ? item.value.toFixed(1)
                  : item.value}
                {unit}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
