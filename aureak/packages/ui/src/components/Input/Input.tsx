import React, { useState } from 'react'
import { TextInput, StyleSheet, View, TextStyle, ViewStyle } from 'react-native'
import { colors, radius, space, typography } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type InputVariant = 'dark' | 'light'

export type InputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  secureTextEntry?: boolean
  disabled?: boolean
  error?: string
  variant?: InputVariant
  style?: ViewStyle
  inputStyle?: TextStyle
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  // Contrôle autofill / Safari iCloud suggestions
  autoComplete?: string
  autoCorrect?: boolean
  spellCheck?: boolean
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry = false,
  disabled = false,
  error,
  variant = 'dark',
  style,
  inputStyle,
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoComplete,
  autoCorrect,
  spellCheck,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const isLight = variant === 'light'

  const wrapperStyle: ViewStyle = {
    backgroundColor: isLight ? colors.light.surface : colors.background.elevated,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: error
      ? colors.status.absent
      : isFocused
        ? colors.accent.gold
        : isLight
          ? colors.border.light
          : colors.accent.zinc,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center' as const,
  }

  const inputTextStyle: TextStyle = {
    fontFamily: 'Geist-Regular',
    fontSize: typography.body.size,
    color: isLight ? colors.text.dark : colors.text.primary,
    padding: 0,
  }

  return (
    <View style={[{ gap: space.xs }, style]}>
      {label && (
        <AureakText
          variant="label"
          color={isLight ? colors.text.muted : colors.text.secondary}
        >
          {label}
        </AureakText>
      )}
      <View style={wrapperStyle}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isLight ? colors.text.subtle : colors.text.secondary}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete as never}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[inputTextStyle, inputStyle]}
        />
      </View>
      {error && (
        <AureakText variant="caption" style={{ color: colors.status.absent }}>
          {error}
        </AureakText>
      )}
    </View>
  )
}
