import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, radius, space, shadows } from '@aureak/theme'

export type CardVariant = 'dark' | 'light' | 'gold'

export type CardProps = {
  children: React.ReactNode
  padding?: keyof typeof space
  variant?: CardVariant
  style?: ViewStyle
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  dark: {
    backgroundColor: colors.background.surface,
  },
  light: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  gold: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.border.gold,
  },
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
})

export function Card({ children, padding = 'md', variant = 'dark', style }: CardProps) {
  return (
    <View style={[styles.card, variantStyles[variant], { padding: space[padding] }, style]}>
      {children}
    </View>
  )
}
