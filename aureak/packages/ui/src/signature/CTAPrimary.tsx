import React, { useState } from 'react'
import { Pressable, View, Text, StyleSheet, Platform, type PressableStateCallbackType } from 'react-native'
import { colors } from '@aureak/theme'

export type CTAPrimaryProps = {
  label   : string
  onPress?: () => void
  size?   : 'desktop' | 'mobile'
}

export function CTAPrimary({ label, onPress, size = 'desktop' }: CTAPrimaryProps) {
  const [hovered, setHovered] = useState(false)
  const padding = size === 'desktop'
    ? { paddingVertical: 20, paddingHorizontal: 28 }
    : { paddingVertical: 14, paddingHorizontal: 20 }

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {({ pressed }: PressableStateCallbackType) => (
        <View
          style={[
            styles.pill,
            padding,
            {
              transform: [{ scale: pressed ? 0.97 : hovered ? 1.03 : 1 }],
            },
            Platform.OS === 'web' && webShadow as never,
          ]}
        >
          <Text style={styles.label}>{label}</Text>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}

const webShadow = {
  boxShadow : '0 4px 24px rgba(0,0,0,0.13)',
  transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1)',
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.background.primary,
    borderRadius   : 9999,
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 12,
    alignSelf      : 'flex-start',
  },
  label: {
    color       : colors.text.primary,
    fontFamily  : 'Poppins-SemiBold',
    fontWeight  : '600',
    fontSize    : 14,
    letterSpacing: 0.1,
  },
  arrowCircle: {
    width          : 24,
    height         : 24,
    borderRadius   : 12,
    backgroundColor: 'rgba(255,255,255,0.12)',  // Story 83-5 signature — voile translucide sur CTA noir
    alignItems     : 'center',
    justifyContent : 'center',
  },
  arrow: {
    color     : colors.text.primary,
    fontSize  : 14,
    lineHeight: 14,
    fontFamily: 'Poppins-SemiBold',
  },
})

