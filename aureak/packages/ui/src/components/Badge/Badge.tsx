import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius, space } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type BadgeVariant = 'gold' | 'present' | 'attention' | 'zinc'

export type BadgeProps = {
  label: string
  variant?: BadgeVariant
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  gold      : { bg: colors.accent.gold,       text: colors.text.dark },
  present   : { bg: colors.status.present,    text: colors.text.dark },
  attention : { bg: colors.status.attention,  text: colors.text.dark },
  zinc      : { bg: colors.accent.zinc,       text: colors.text.primary },
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs / 2,
    alignSelf: 'flex-start',
  },
})

export function Badge({ label, variant = 'zinc' }: BadgeProps) {
  const { bg, text } = variantColors[variant]
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AureakText variant="caption" color={text}>
        {label}
      </AureakText>
    </View>
  )
}
