import React, { useEffect, useRef } from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { colors, radius } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export type ButtonProps = {
  label       : string
  onPress     : () => void
  variant?    : ButtonVariant
  disabled?   : boolean
  loading?    : boolean
  fullWidth?  : boolean
  /** Story 62.1 — flash vert quand passe à true */
  success?    : boolean
  /** Story 62.1 — shake quand passe à true */
  error?      : boolean
}

const variantConfig: Record<ButtonVariant, { bg: string; border?: string; textColor: string; loadingColor: string }> = {
  primary:   { bg: colors.accent.gold, textColor: colors.text.dark, loadingColor: colors.text.dark },
  secondary: { bg: 'transparent', border: colors.accent.gold, textColor: colors.accent.gold, loadingColor: colors.accent.gold },
  ghost:     { bg: 'transparent', textColor: colors.accent.gold, loadingColor: colors.accent.gold },
  danger:    { bg: colors.status.errorStrong, textColor: '#FFFFFF', loadingColor: '#FFFFFF' },
}

const styles = StyleSheet.create({
  base: {
    minHeight       : 44,
    minWidth        : 44,
    borderRadius    : radius.button,
    paddingHorizontal: 20,
    paddingVertical : 12,
    alignItems      : 'center',
    justifyContent  : 'center',
    flexDirection   : 'row',
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
  variant   = 'primary',
  disabled  = false,
  loading   = false,
  fullWidth = false,
  success   = false,
  error     = false,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const config     = variantConfig[variant]

  // Story 62.1 — micro-interactions web uniquement (CSS class toggle)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (!success) return
    const el = buttonRef.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    el.classList.remove('mi-flash')
    void el.offsetHeight // force reflow
    el.classList.add('mi-flash')
    const timer = setTimeout(() => el.classList.remove('mi-flash'), 200)
    return () => clearTimeout(timer)
  }, [success])

  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (!error) return
    const el = buttonRef.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    el.classList.remove('mi-shake')
    void el.offsetHeight // force reflow
    el.classList.add('mi-shake')
    const timer = setTimeout(() => el.classList.remove('mi-shake'), 300)
    return () => clearTimeout(timer)
  }, [error])

  return (
    <TouchableOpacity
      ref={buttonRef as never}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.base,
        {
          backgroundColor: config.bg,
          borderWidth    : config.border ? 1 : 0,
          borderColor    : config.border,
        },
        isDisabled  && styles.disabled,
        fullWidth   && styles.fullWidth,
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
