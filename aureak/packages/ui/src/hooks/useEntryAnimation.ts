// Story 83.6 — hook d'entrée signature (fade + slide) avec ease site
// Utilise RN Animated API (cross-platform, zéro dépendance supplémentaire)
import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { motion } from '@aureak/theme'

type EntryAnimationOptions = {
  trigger? : boolean     // default true : anime sur mount
  delay?   : number      // ms
  duration?: number      // default motion.duration.entry
  distance?: number      // translateY initial, default 16
}

export type UseEntryAnimationResult = {
  opacity  : Animated.Value
  translateY: Animated.Value
  style    : {
    opacity  : Animated.Value
    transform: [{ translateY: Animated.Value }]
  }
}

/**
 * useEntryAnimation
 * Anime un composant en fade + slide-up avec l'ease signature du site.
 * Règle d'or : n'anime que `opacity` et `transform`, jamais width/height/top/margin.
 *
 * Usage :
 * ```tsx
 * const entry = useEntryAnimation({ delay: 120 })
 * return <Animated.View style={entry.style}>…</Animated.View>
 * ```
 */
export function useEntryAnimation({
  trigger  = true,
  delay    = 0,
  duration = motion.duration.entry,
  distance = 16,
}: EntryAnimationOptions = {}): UseEntryAnimationResult {
  const opacity    = useRef(new Animated.Value(trigger ? 0 : 1)).current
  const translateY = useRef(new Animated.Value(trigger ? distance : 0)).current

  useEffect(() => {
    if (!trigger) return
    const [x1, y1, x2, y2] = motion.ease.site
    const easeFn = (t: number) => cubicBezier(x1, y1, x2, y2, t)

    Animated.parallel([
      Animated.timing(opacity, {
        toValue        : 1,
        duration,
        delay,
        easing         : easeFn,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue        : 0,
        duration,
        delay,
        easing         : easeFn,
        useNativeDriver: true,
      }),
    ]).start()
  }, [trigger, delay, duration, opacity, translateY])

  return {
    opacity,
    translateY,
    style: {
      opacity,
      transform: [{ translateY }],
    },
  }
}

// Cubic-bezier solver — identique à GoldHairline, local pour éviter un import circulaire
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
