// BestSessionBadge.tsx — Badge "Meilleure séance" avec animation spring (Story 55-4)
// Animation scale 0 → 1.2 → 1.0 au montage via Animated.spring (RN) / CSS keyframes (web)
// Accessibilité : accessibilityLabel="Meilleure séance personnelle"

import React, { useEffect, useRef } from 'react'
import { Platform, Animated, View, StyleSheet } from 'react-native'
import { colors, radius, shadows, space } from '@aureak/theme'
import { Text as AureakText } from './components/Text'

// ── Props ─────────────────────────────────────────────────────────────────────

export type BestSessionBadgeProps = {
  /** Taille du badge (défaut: 'md') */
  size?: 'sm' | 'md'
  /** Ne pas jouer l'animation (défaut: false) */
  noAnimation?: boolean
}

// ── Implémentation web — animation CSS keyframes ──────────────────────────────

const WEB_KEYFRAMES = `
@keyframes aureak-best-session-spring {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  80%  { transform: scale(0.95); }
  100% { transform: scale(1.0); opacity: 1; }
}
.aureak-best-badge {
  animation: aureak-best-session-spring 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
`

function injectWebStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('aureak-best-badge-styles')) return
  const style = document.createElement('style')
  style.id = 'aureak-best-badge-styles'
  style.textContent = WEB_KEYFRAMES
  document.head.appendChild(style)
}

// ── Implémentation native — Animated.spring ────────────────────────────────────

function BestSessionBadgeNative({ size = 'md', noAnimation = false }: BestSessionBadgeProps) {
  const scale = useRef(new Animated.Value(noAnimation ? 1 : 0)).current

  useEffect(() => {
    if (noAnimation) return
    Animated.spring(scale, {
      toValue        : 1,
      useNativeDriver: true,
      tension        : 180,
      friction       : 10,
    }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isSmall = size === 'sm'

  return (
    <Animated.View
      style={[
        styles.badge,
        isSmall && styles.badgeSm,
        { transform: [{ scale }] },
      ]}
      accessibilityLabel="Meilleure séance personnelle"
    >
      <AureakText style={[styles.text, isSmall && styles.textSm] as never}>
        Meilleure séance
      </AureakText>
    </Animated.View>
  )
}

// ── Implémentation web ────────────────────────────────────────────────────────

function BestSessionBadgeWeb({ size = 'md', noAnimation = false }: BestSessionBadgeProps) {
  if (!noAnimation) injectWebStyles()

  const isSmall = size === 'sm'

  return (
    <View
      style={[styles.badge, isSmall && styles.badgeSm]}
      // @ts-ignore — className web only
      className={noAnimation ? undefined : 'aureak-best-badge'}
      accessibilityLabel="Meilleure séance personnelle"
    >
      <AureakText style={[styles.text, isSmall && styles.textSm] as never}>
        Meilleure séance
      </AureakText>
    </View>
  )
}

// ── Export principal ──────────────────────────────────────────────────────────

export function BestSessionBadge(props: BestSessionBadgeProps) {
  if (Platform.OS === 'web') return <BestSessionBadgeWeb {...props} />
  return <BestSessionBadgeNative {...props} />
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.sm + 2,
    paddingVertical  : 4,
    borderRadius     : radius.badge,
    alignSelf        : 'flex-start' as never,
  },
  badgeSm: {
    paddingHorizontal: space.xs + 2,
    paddingVertical  : 2,
  },
  text: {
    fontSize    : 11,
    fontWeight  : '800' as never,
    color       : '#3D2E00',
    letterSpacing: 0.4,
  },
  textSm: {
    fontSize: 9,
  },
})
