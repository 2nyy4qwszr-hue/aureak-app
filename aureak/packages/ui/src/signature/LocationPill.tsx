import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export type LocationPillProps = {
  children: string
}

export function LocationPill({ children }: LocationPillProps) {
  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.label}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 8,
    backgroundColor: 'rgba(193,172,92,0.07)',
    borderWidth    : 1,
    borderColor    : 'rgba(193,172,92,0.3)',
    borderRadius   : 9999,
    paddingHorizontal: 12,
    paddingVertical : 6,
    alignSelf      : 'flex-start',
  },
  dot: {
    width          : 6,
    height         : 6,
    borderRadius   : 3,
    backgroundColor: colors.accent.gold,
  },
  label: {
    color        : colors.accent.gold,
    fontFamily   : 'Poppins-SemiBold',
    fontWeight   : '600',
    fontSize     : 11,
    letterSpacing: 0.88, // 0.08em × 11px
    textTransform: 'uppercase',
  },
})
