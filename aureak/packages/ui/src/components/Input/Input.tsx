import React, { useState } from 'react'
import { TextInput, StyleSheet, View, TextStyle, ViewStyle } from 'react-native'
import { colors, radius, space, typography } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type InputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  secureTextEntry?: boolean
  disabled?: boolean
  error?: string
  style?: ViewStyle
  inputStyle?: TextStyle
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
  },
  inputWrapper: {
    backgroundColor: colors.background.elevated,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputWrapperFocused: {
    borderColor: colors.accent.gold,
  },
  inputWrapperError: {
    borderColor: colors.status.absent,
  },
  input: {
    fontFamily: 'Geist-Regular',
    fontSize: typography.body.size,
    color: colors.text.primary,
    padding: 0,
  },
  errorText: {
    color: colors.status.absent,
  },
})

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry = false,
  disabled = false,
  error,
  style,
  inputStyle,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={[styles.container, style]}>
      {label && <AureakText variant="label">{label}</AureakText>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, inputStyle]}
        />
      </View>
      {error && (
        <AureakText variant="caption" style={styles.errorText}>
          {error}
        </AureakText>
      )}
    </View>
  )
}
