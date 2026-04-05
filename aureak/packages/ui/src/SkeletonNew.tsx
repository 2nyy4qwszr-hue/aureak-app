// Story 62.3 — Skeleton uniforme partout avec shimmer CSS
// Web : shimmer via CSS linear-gradient animé
// React Native : fallback opacity animée (Animated API)
'use client'
import React, { useEffect, useRef } from 'react'
import { Platform, View, Animated, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

// ─────────────────────────────────────────────────────────────────────────────
// CSS shimmer injection (web uniquement, 1 fois)
// ─────────────────────────────────────────────────────────────────────────────

let shimmerCssInjected = false
function injectShimmerCSS() {
  if (shimmerCssInjected || typeof document === 'undefined') return
  shimmerCssInjected = true
  const style = document.createElement('style')
  style.textContent = `
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: calc(400px + 100%) 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #EBEBEB 25%, #F5F5F5 50%, #EBEBEB 75%);
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
}
.skeleton-shimmer-dark {
  background: linear-gradient(90deg, #2A2A2A 25%, #333333 50%, #2A2A2A 75%);
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer, .skeleton-shimmer-dark { animation: none; }
}
`
  document.head.appendChild(style)
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonBaseProps {
  width?       : number | string
  height       : number | string
  borderRadius?: number
  style?       : React.CSSProperties | object
  dark?        : boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant de base
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonBase({ width = '100%', height, borderRadius = 8, style, dark = false }: SkeletonBaseProps) {
  if (Platform.OS === 'web') {
    injectShimmerCSS()
    return (
      <div
        className={dark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'}
        style={{
          width,
          height,
          borderRadius,
          display     : 'block',
          flexShrink  : 0,
          ...(style as React.CSSProperties),
        }}
      />
    )
  }

  // React Native — opacity pulse (Animated)
  return <RnSkeletonPulse width={width} height={height} borderRadius={borderRadius} dark={dark} />
}

// ─────────────────────────────────────────────────────────────────────────────
// React Native fallback — opacity pulse
// ─────────────────────────────────────────────────────────────────────────────

function RnSkeletonPulse({
  width, height, borderRadius, dark,
}: { width: number | string; height: number | string; borderRadius: number; dark: boolean }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width : width as number,
          height: height as number,
          borderRadius,
          backgroundColor: dark ? '#2A2A2A' : colors.light.muted,
          opacity,
        },
      ]}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-composants
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonText({ lines = 1, dark }: { lines?: number; dark?: boolean }) {
  if (Platform.OS === 'web') {
    injectShimmerCSS()
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={dark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'}
            style={{
              width       : i === lines - 1 && lines > 1 ? '60%' : '100%',
              height      : 14,
              borderRadius: 6,
            }}
          />
        ))}
      </div>
    )
  }
  return (
    <View style={{ gap: 6 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <RnSkeletonPulse key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} height={14} borderRadius={6} dark={dark ?? false} />
      ))}
    </View>
  )
}

function SkeletonCard({ dark }: { dark?: boolean }) {
  if (Platform.OS === 'web') {
    injectShimmerCSS()
    return (
      <div
        className={dark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'}
        style={{ width: '100%', height: 120, borderRadius: 12 }}
      />
    )
  }
  return <RnSkeletonPulse width="100%" height={120} borderRadius={12} dark={dark ?? false} />
}

function SkeletonAvatar({ size = 40, dark }: { size?: number; dark?: boolean }) {
  if (Platform.OS === 'web') {
    injectShimmerCSS()
    return (
      <div
        className={dark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'}
        style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0 }}
      />
    )
  }
  return <RnSkeletonPulse width={size} height={size} borderRadius={size / 2} dark={dark ?? false} />
}

function SkeletonRow({ height = 48, dark }: { height?: number; dark?: boolean }) {
  if (Platform.OS === 'web') {
    injectShimmerCSS()
    return (
      <div
        className={dark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'}
        style={{ width: '100%', height, borderRadius: 8 }}
      />
    )
  }
  return <RnSkeletonPulse width="100%" height={height} borderRadius={8} dark={dark ?? false} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Export avec sous-composants attachés
// ─────────────────────────────────────────────────────────────────────────────

export const SkeletonNew = Object.assign(SkeletonBase, {
  Text  : SkeletonText,
  Card  : SkeletonCard,
  Avatar: SkeletonAvatar,
  Row   : SkeletonRow,
})
