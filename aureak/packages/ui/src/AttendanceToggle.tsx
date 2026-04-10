// Story 54-2 — Toggle neumorphique présent/absent
// Story 62.1 — Micro-interaction bounce au toggle (web uniquement)
import React, { useState, useRef } from 'react'
import { Pressable, StyleSheet, View, Platform } from 'react-native'
import { AureakText } from './components/Text'
import { colors, space, radius } from '@aureak/theme'

export type AttendanceToggleProps = {
  status   : 'present' | 'absent' | null
  onToggle : () => void
  disabled?: boolean
  size    ?: 'sm' | 'md'
}

export function AttendanceToggle({
  status,
  onToggle,
  disabled = false,
  size = 'md',
}: AttendanceToggleProps) {
  const [pressed, setPressed] = useState(false)
  // Story 62.1 — ref DOM pour bounce animation (web uniquement)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const isPresent = status === 'present'
  const bg        = isPresent ? colors.status.success : (colors.status.errorStrong ?? '#E05252')
  const label     = isPresent ? '✓ Présent' : '✗ Absent'

  const triggerBounce = () => {
    if (Platform.OS !== 'web') return
    const el = containerRef.current
    if (!el) return
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    el.classList.remove('mi-bounce')
    void el.offsetHeight // force reflow
    el.classList.add('mi-bounce')
    setTimeout(() => el.classList.remove('mi-bounce'), 150)
  }

  const handlePressIn = () => {
    if (!disabled) setPressed(true)
  }
  const handlePressOut = () => {
    setPressed(false)
  }
  const handlePress = () => {
    if (!disabled) {
      triggerBounce()
      onToggle()
    }
  }

  const toggle = (
    <Pressable
      ref={containerRef as never}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        st.base,
        size === 'sm' ? st.sm : st.md,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        pressed ? (st.pressed as never) : (st.normal as never),
      ]}
    >
      <View style={st.inner}>
        <AureakText style={st.label}>{label}</AureakText>
      </View>
    </Pressable>
  )

  return toggle
}

const st = StyleSheet.create({
  base: {
    borderRadius: radius.xs ?? 6,
    alignItems: 'center' as never,
    justifyContent: 'center' as never,
  },
  md: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    minWidth         : 90,
  },
  sm: {
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    minWidth         : 70,
  },
  inner: {
    alignItems    : 'center' as never,
    justifyContent: 'center' as never,
  },
  label: {
    fontSize  : 12,
    fontWeight: '700' as never,
    color     : '#FFFFFF',
  },
  // Ombres neumorphiques via style dynamique (boxShadow non supporté dans StyleSheet RN standard)
  normal : {},
  pressed: {
    transform: [{ scale: 0.96 }],
  },
})

// Ombres web injectées en style inline (non supporté par StyleSheet RN)
export const attendanceToggleShadow = {
  normal : {
    boxShadow: '3px 3px 6px rgba(0,0,0,0.18), -2px -2px 5px rgba(255,255,255,0.4)',
  } as never,
  pressed: {
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.22), inset -2px -2px 4px rgba(255,255,255,0.25)',
    transform: [{ scale: 0.96 }],
  } as never,
}
