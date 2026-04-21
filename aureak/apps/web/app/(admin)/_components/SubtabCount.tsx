'use client'
// Story 93.2 — SubtabCount : badge de count pour onglets NavBar (Activités, Méthodologie, Académie)
// Story 93.7 — Style aligné template : mono font + bg actif gold-20 + texte goldDarkText
import React from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts } from '@aureak/theme'

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
    backgroundColor  : colors.light.muted, // zinc-100 template
    paddingHorizontal: 7,
    paddingVertical  : 2,
    borderRadius     : 999,
    minWidth         : 20,
    alignItems       : 'center',
    justifyContent   : 'center',
  },
  badgeActive: {
    backgroundColor: colors.border.gold, // rgba(193,172,92,0.20-0.25) ≈ template gold-20
  },
  text: {
    fontFamily   : fonts.mono,
    fontSize     : 10,
    fontWeight   : '500',
    color        : colors.text.subtle,
    letterSpacing: 0,
  },
  textActive: {
    color: colors.accent.goldDarkText, // #6b5d2a template — visible sur fond gold-20
  },
})
