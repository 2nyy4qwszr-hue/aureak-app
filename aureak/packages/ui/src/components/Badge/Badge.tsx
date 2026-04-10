import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, radius, space } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type BadgeVariant = 'gold' | 'present' | 'attention' | 'zinc' | 'danger' | 'goldOutline' | 'light'

export type BadgeProps = {
  label: string
  variant?: BadgeVariant
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  gold        : { bg: colors.accent.gold,      text: colors.text.dark },
  present     : { bg: colors.status.present,   text: colors.text.dark },
  attention   : { bg: colors.status.attention,  text: colors.text.dark },
  zinc        : { bg: colors.accent.zinc,       text: colors.text.primary },
  danger      : { bg: colors.status.errorStrong,        text: '#FFFFFF' },
  goldOutline : { bg: 'transparent',            text: colors.accent.gold, border: colors.border.goldSolid },
  light       : { bg: colors.light.muted,       text: colors.text.dark,   border: colors.border.light },
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
  const { bg, text, border } = variantColors[variant]
  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg },
      border ? { borderWidth: 1, borderColor: border } : null,
    ]}>
      <AureakText variant="caption" color={text}>
        {label}
      </AureakText>
    </View>
  )
}
