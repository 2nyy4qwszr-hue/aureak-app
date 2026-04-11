import React, { useEffect, useRef } from 'react'
import { Animated, View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export type GoldHairlineProps = {
  width?: number
  animated?: boolean
  marginBottom?: number
}

export function GoldHairline({
  width = 80,
  animated = false,
  marginBottom = 28,
}: GoldHairlineProps) {
  const scaleX = useRef(new Animated.Value(animated ? 0 : 1)).current

  useEffect(() => {
    if (!animated) return
    Animated.timing(scaleX, {
      toValue        : 1,
      duration       : 700,
      easing         : (t: number) => {
        const x1 = 0.16, y1 = 1, x2 = 0.3, y2 = 1
        return cubicBezier(x1, y1, x2, y2, t)
      },
      useNativeDriver: true,
    }).start()
  }, [animated, scaleX])

  return (
    <View style={[styles.wrapper, { marginBottom }]}>
      <Animated.View
        style={[
          styles.line,
          { width, transform: [{ scaleX }] },
        ]}
      />
    </View>
  )
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleCurveX = (tt: number) => ((ax * tt + bx) * tt + cx) * tt
  const sampleCurveY = (tt: number) => ((ay * tt + by) * tt + cy) * tt
  let t2 = t
  for (let i = 0; i < 6; i++) {
    const x = sampleCurveX(t2) - t
    const d = (3 * ax * t2 + 2 * bx) * t2 + cx
    if (Math.abs(x) < 1e-6) break
    t2 -= x / d
  }
  return sampleCurveY(t2)
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    transformOrigin: 'left center' as never,
  },
  line: {
    height         : 1,
    backgroundColor: colors.accent.gold,
  },
})
