import React from 'react'
import { Text as RNText, StyleSheet, TextStyle } from 'react-native'
import { colors, typography } from '@aureak/theme'

export type TextVariant = keyof typeof typography

export type AureakTextProps = {
  variant?: TextVariant
  children: React.ReactNode
  color?: string
  style?: TextStyle
  numberOfLines?: number
  accessibilityLabel?: string
}

const styles = StyleSheet.create({
  display: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: typography.display.size,
    fontWeight: typography.display.weight,
    color: colors.text.primary,
    letterSpacing: typography.display.letterSpacing,
  },
  h1: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: typography.h1.size,
    fontWeight: typography.h1.weight,
    color: colors.text.primary,
    letterSpacing: typography.h1.letterSpacing,
  },
  h2: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: typography.h2.size,
    fontWeight: typography.h2.weight,
    color: colors.text.primary,
    letterSpacing: typography.h2.letterSpacing,
  },
  h3: {
    fontFamily: 'Rajdhani-SemiBold',
    fontSize: typography.h3.size,
    fontWeight: typography.h3.weight,
    color: colors.text.primary,
    letterSpacing: typography.h3.letterSpacing,
  },
  bodyLg: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.bodyLg.size,
    fontWeight: typography.bodyLg.weight,
    color: colors.text.primary,
    lineHeight: typography.bodyLg.lineHeight,
  },
  body: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.body.size,
    fontWeight: typography.body.weight,
    color: colors.text.primary,
    lineHeight: typography.body.lineHeight,
  },
  bodySm: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.bodySm.size,
    fontWeight: typography.bodySm.weight,
    color: colors.text.secondary,
    lineHeight: typography.bodySm.lineHeight,
  },
  caption: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.caption.size,
    fontWeight: typography.caption.weight,
    color: colors.text.secondary,
    lineHeight: typography.caption.lineHeight,
  },
  label: {
    fontFamily: 'Geist-SemiBold',
    fontSize: typography.label.size,
    fontWeight: typography.label.weight,
    color: colors.text.secondary,
    letterSpacing: typography.label.letterSpacing,
    textTransform: typography.label.textTransform,
  },
  stat: {
    fontFamily: 'GeistMono-Regular',
    fontSize: typography.stat.size,
    fontWeight: typography.stat.weight,
    color: colors.text.primary,
  },
})

export function AureakText({
  variant = 'body',
  children,
  color,
  style,
  numberOfLines,
  accessibilityLabel,
}: AureakTextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
      style={[styles[variant], color ? { color } : null, style]}
    >
      {children}
    </RNText>
  )
}

export const Text = AureakText
