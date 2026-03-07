import React from 'react'
import { TouchableOpacity, StyleSheet, Text } from 'react-native'
import { colors } from '@aureak/theme'

export type StarToggleProps = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Callback haptique — injecter `() => Haptics.impactAsync(Light)` depuis l'app mobile */
  onHaptic?: () => void
}

const styles = StyleSheet.create({
  touchable: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 24,
  },
  disabled: {
    opacity: 0.4,
  },
})

export function StarToggle({ value, onChange, disabled = false, onHaptic }: StarToggleProps) {
  const handlePress = () => {
    if (disabled) return
    if (value) {
      // Pas de haptic en désactivant
    } else {
      onHaptic?.()
    }
    onChange(!value)
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[styles.touchable, disabled && styles.disabled]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={value ? 'Retirer le top séance' : 'Marquer top séance'}
      accessibilityState={{ checked: value, disabled }}
    >
      <Text
        style={[
          styles.star,
          { color: value ? colors.accent.gold : colors.accent.zinc },
        ]}
      >
        {value ? '★' : '☆'}
      </Text>
    </TouchableOpacity>
  )
}
