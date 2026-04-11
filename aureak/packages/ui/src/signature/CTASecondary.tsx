import React, { useState } from 'react'
import { Pressable, View, Text, StyleSheet, Platform, type PressableStateCallbackType } from 'react-native'

export type CTASecondaryProps = {
  label   : string
  onPress?: () => void
  size?   : 'desktop' | 'mobile'
}

export function CTASecondary({ label, onPress, size = 'desktop' }: CTASecondaryProps) {
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
            { transform: [{ scale: pressed ? 0.97 : hovered ? 1.03 : 1 }] },
            Platform.OS === 'web' && webTransition as never,
          ]}
        >
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

const webTransition = {
  transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1)',
}

// Story 83-5 signature — valeurs zinc imposées par DS site homepage (§5)
const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'transparent',
    borderRadius   : 9999,
    borderWidth    : 1.5,
    borderColor    : '#d4d4d8',
    alignSelf      : 'flex-start',
  },
  label: {
    color        : '#3f3f46',
    fontFamily   : 'Poppins-SemiBold',
    fontWeight   : '600',
    fontSize     : 14,
    letterSpacing: 0.1,
  },
})
