import React, { useState } from 'react'
import { TextInput, View, TextStyle, ViewStyle } from 'react-native'
import { colors, radius, space, typography } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type InputVariant = 'dark' | 'light'

export type InputType = 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'date' | 'password'

type RNKeyboardType = 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad'
type RNAutoCapitalize = 'none' | 'sentences' | 'words' | 'characters'
type RNTextContentType =
  | 'none'
  | 'emailAddress'
  | 'telephoneNumber'
  | 'name'
  | 'givenName'
  | 'familyName'
  | 'postalCode'
  | 'password'
  | 'newPassword'

export type InputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  /** Sémantique du champ — dérive keyboardType, autoComplete, autoCapitalize, textContentType, secureTextEntry */
  type?: InputType
  /** Texte d'aide sous le champ (masqué si `error` est présent) */
  helper?: string
  /** Marque le champ comme requis — ajoute un astérisque au label */
  required?: boolean
  secureTextEntry?: boolean
  disabled?: boolean
  error?: string
  variant?: InputVariant
  style?: ViewStyle
  inputStyle?: TextStyle
  autoCapitalize?: RNAutoCapitalize
  keyboardType?: RNKeyboardType
  autoComplete?: string
  autoCorrect?: boolean
  spellCheck?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

const KEYBOARD_BY_TYPE: Record<InputType, RNKeyboardType> = {
  text    : 'default',
  email   : 'email-address',
  tel     : 'phone-pad',
  numeric : 'number-pad',
  decimal : 'decimal-pad',
  date    : 'default',
  password: 'default',
}

const AUTO_CAPITALIZE_BY_TYPE: Record<InputType, RNAutoCapitalize> = {
  text    : 'sentences',
  email   : 'none',
  tel     : 'none',
  numeric : 'none',
  decimal : 'none',
  date    : 'none',
  password: 'none',
}

const AUTO_COMPLETE_BY_TYPE: Record<InputType, string | undefined> = {
  text    : undefined,
  email   : 'email',
  tel     : 'tel',
  numeric : undefined,
  decimal : undefined,
  date    : 'birthdate-full',
  password: 'current-password',
}

const TEXT_CONTENT_TYPE_BY_TYPE: Record<InputType, RNTextContentType> = {
  text    : 'none',
  email   : 'emailAddress',
  tel     : 'telephoneNumber',
  numeric : 'none',
  decimal : 'none',
  date    : 'none',
  password: 'password',
}

// Touch target WCAG 2.5.5 (≥ 44×44) — on cale à 48 (cohérent Material) via minHeight.
// Font-size 16 minimum sur iOS pour éviter le zoom auto au focus (bodyLg token = 16).
const MIN_TOUCH_HEIGHT = 48
const INPUT_FONT_SIZE = typography.bodyLg.size

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  type = 'text',
  helper,
  required = false,
  secureTextEntry,
  disabled = false,
  error,
  variant = 'dark',
  style,
  inputStyle,
  autoCapitalize,
  keyboardType,
  autoComplete,
  autoCorrect,
  spellCheck,
  accessibilityLabel,
  accessibilityHint,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const isLight = variant === 'light'

  const effectiveSecure = secureTextEntry ?? type === 'password'
  const effectiveKeyboardType = keyboardType ?? KEYBOARD_BY_TYPE[type]
  const effectiveAutoCapitalize = autoCapitalize ?? AUTO_CAPITALIZE_BY_TYPE[type]
  const effectiveAutoComplete = autoComplete ?? AUTO_COMPLETE_BY_TYPE[type]
  const effectiveTextContentType = TEXT_CONTENT_TYPE_BY_TYPE[type]

  const hasError = !!error
  const borderColor = hasError
    ? colors.status.absent
    : isFocused
      ? colors.accent.gold
      : isLight
        ? colors.border.light
        : colors.accent.zinc

  const wrapperStyle: ViewStyle = {
    backgroundColor: disabled
      ? (isLight ? colors.light.muted : colors.background.surface)
      : (isLight ? colors.light.surface : colors.background.elevated),
    borderRadius: radius.xs,
    borderWidth: isFocused || hasError ? 2 : 1,
    borderColor,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    minHeight: MIN_TOUCH_HEIGHT,
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
  }

  const inputTextStyle: TextStyle = {
    fontFamily: 'Geist-Regular',
    fontSize: INPUT_FONT_SIZE,
    color: isLight ? colors.text.dark : colors.text.primary,
    padding: 0,
  }

  const helperText = hasError ? error : helper

  return (
    <View style={[{ gap: space.xs }, style]}>
      {label && (
        <AureakText
          variant="label"
          color={isLight ? colors.text.muted : colors.text.secondary}
        >
          {label}
          {required ? ' *' : ''}
        </AureakText>
      )}
      <View style={wrapperStyle}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isLight ? colors.text.subtle : colors.text.secondary}
          secureTextEntry={effectiveSecure}
          editable={!disabled}
          autoCapitalize={effectiveAutoCapitalize}
          keyboardType={effectiveKeyboardType}
          autoComplete={effectiveAutoComplete as never}
          textContentType={effectiveTextContentType}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[inputTextStyle, inputStyle]}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint ?? helper ?? error}
          accessibilityState={{ disabled, selected: isFocused }}
        />
      </View>
      {helperText && (
        <AureakText
          variant="caption"
          color={hasError ? colors.status.absent : colors.text.muted}
        >
          {helperText}
        </AureakText>
      )}
    </View>
  )
}
