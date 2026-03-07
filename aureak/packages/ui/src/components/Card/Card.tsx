import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, radius, space } from '@aureak/theme'

export type CardProps = {
  children: React.ReactNode
  padding?: keyof typeof space
  style?: ViewStyle
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
})

export function Card({ children, padding = 'md', style }: CardProps) {
  return (
    <View style={[styles.card, { padding: space[padding] }, style]}>
      {children}
    </View>
  )
}
