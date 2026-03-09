import React from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, radius } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export type ButtonProps = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const variantConfig: Record<ButtonVariant, { bg: string; border?: string; textColor: string; loadingColor: string }> = {
  primary:   { bg: colors.accent.gold, textColor: colors.text.dark, loadingColor: colors.text.dark },
  secondary: { bg: 'transparent', border: colors.accent.gold, textColor: colors.accent.gold, loadingColor: colors.accent.gold },
  ghost:     { bg: 'transparent', textColor: colors.accent.gold, loadingColor: colors.accent.gold },
  danger:    { bg: colors.accent.red, textColor: '#FFFFFF', loadingColor: '#FFFFFF' },
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
  const config = variantConfig[variant]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.base,
        {
          backgroundColor: config.bg,
          borderWidth: config.border ? 1 : 0,
          borderColor: config.border,
        },
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={config.loadingColor} size="small" />
      ) : (
        <AureakText
          variant="label"
          style={{ color: config.textColor }}
        >
          {label}
        </AureakText>
      )}
    </TouchableOpacity>
  )
}

// Alias export
export const Button = AureakButton
