'use client'
// Story 101.5 — <LoadingState /> responsive
//
// Deux variantes :
// - skeleton (défaut) : pile verticale de SkeletonCard (count = 3 mobile / 5 desktop par défaut)
// - spinner           : ActivityIndicator centré
//
// Responsive via useWindowDimensions (breakpoint 640, aligné DataCard / PrimaryAction / AdminTopbar).
// Tokens @aureak/theme uniquement. A11y : `accessibilityLabel` + `accessibilityLiveRegion="polite"`.

import React from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { colors, space } from '@aureak/theme'
import { SkeletonCard } from '../../SkeletonCard'

const MOBILE_MAX = 640

export type LoadingStateVariant = 'skeleton' | 'spinner'

export type LoadingStateProps = {
  /** 'skeleton' (défaut) = pile de SkeletonCard ; 'spinner' = ActivityIndicator centré */
  variant?: LoadingStateVariant
  /** Nombre de skeleton cards — défaut : 3 mobile, 5 desktop. Ignoré si variant='spinner'. */
  count?  : number
}

export function LoadingState({ variant = 'skeleton', count }: LoadingStateProps) {
  const { width } = useWindowDimensions()
  const isMobile = width < MOBILE_MAX

  const a11y = {
    accessibilityLabel     : 'Chargement en cours',
    accessibilityLiveRegion: 'polite' as const,
    accessibilityRole      : 'progressbar' as const,
  }

  if (variant === 'spinner') {
    return (
      <View
        style={[s.spinnerWrap, isMobile ? s.spinnerWrapMobile : s.spinnerWrapDesktop]}
        {...a11y}
      >
        <ActivityIndicator size={isMobile ? 'small' : 'large'} color={colors.accent.gold} />
      </View>
    )
  }

  const resolvedCount = count ?? (isMobile ? 3 : 5)

  return (
    <View
      style={[s.skeletonWrap, isMobile ? s.skeletonWrapMobile : s.skeletonWrapDesktop]}
      {...a11y}
    >
      {Array.from({ length: resolvedCount }).map((_, i) => (
        <View key={i} style={s.skeletonItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  )
}

export default LoadingState

const s = StyleSheet.create({
  // ── Spinner variant ────────────────────────────────────────────────────────
  spinnerWrap: {
    alignItems    : 'center',
    justifyContent: 'center',
  },
  spinnerWrapMobile: {
    paddingVertical  : space.xl,
    paddingHorizontal: space.md,
  },
  spinnerWrapDesktop: {
    paddingVertical  : space.xxl,
    paddingHorizontal: space.lg,
  },

  // ── Skeleton variant ───────────────────────────────────────────────────────
  skeletonWrap: {
    width: '100%',
  },
  skeletonWrapMobile: {
    paddingVertical  : space.md,
    paddingHorizontal: space.md,
    gap              : space.md,
  },
  skeletonWrapDesktop: {
    paddingVertical  : space.lg,
    paddingHorizontal: space.lg,
    gap              : space.md,
  },
  skeletonItem: {
    marginBottom: space.md,
  },
})
