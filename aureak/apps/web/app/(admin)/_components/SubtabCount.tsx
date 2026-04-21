'use client'
// Story 93.2 — SubtabCount : badge de count pour onglets NavBar (Activités, Méthodologie, Académie)
// Affiché à droite du label de tab, style différent selon actif/inactif.
import React from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors } from '@aureak/theme'

export type SubtabCountProps = {
  /** null → badge non rendu (loading / indisponible) */
  value  : number | null
  active?: boolean
}

export function SubtabCount({ value, active = false }: SubtabCountProps) {
  if (value === null) return null

  const textStyle: TextStyle = active ? { ...s.text, ...s.textActive } : s.text

  return (
    <View style={[s.badge, active && s.badgeActive] as never}>
      <AureakText style={textStyle}>
        {value.toLocaleString('fr-FR')}
      </AureakText>
    </View>
  )
}

export default SubtabCount

const s = StyleSheet.create({
  badge: {
    backgroundColor  : colors.light.hover,
    paddingHorizontal: 6,
    paddingVertical  : 2,
    borderRadius     : 4,
    minWidth         : 20,
    alignItems       : 'center',
    justifyContent   : 'center',
  },
  badgeActive: {
    backgroundColor: colors.border.gold, // rgba(193,172,92,0.25) — fond doré subtil cohérent badges
  },
  text: {
    fontSize  : 11,
    fontWeight: '600',
    color     : colors.text.muted,
  },
  textActive: {
    color: colors.accent.gold,
  },
})
