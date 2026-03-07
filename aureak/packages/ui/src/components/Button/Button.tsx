import React from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, radius } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonProps = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: radius.button,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.accent.gold,
  },
  secondary: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
  fullWidth: {
    width: '100%',
  },
})

export function AureakButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.dark : colors.accent.gold}
          size="small"
        />
      ) : (
        <AureakText
          variant="label"
          style={{
            color: variant === 'primary' ? colors.text.dark : colors.accent.gold,
          }}
        >
          {label}
        </AureakText>
      )}
    </TouchableOpacity>
  )
}

// Alias export
export const Button = AureakButton
