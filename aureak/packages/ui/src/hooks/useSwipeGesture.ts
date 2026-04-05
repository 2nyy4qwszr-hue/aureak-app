// Story 61.4 — useSwipeGesture
// Hook swipe pour présences : touch events web + PanResponder React Native
// RÈGLE : les listeners touch sont nettoyés via le return du useEffect (bind pattern)
import { useRef, useState } from 'react'
import { Platform } from 'react-native'

export interface SwipeGestureBindings {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove : (e: React.TouchEvent) => void
  onTouchEnd  : () => void
}

export interface UseSwipeGestureResult {
  deltaX   : number
  bind     : SwipeGestureBindings
  /** true si le swipe est en cours */
  swiping  : boolean
}

/**
 * Hook de détection swipe horizontal (web uniquement via touch events).
 * Retourne `{ deltaX, bind }` à attacher au conteneur de la ligne.
 * Sur React Native natif, utiliser PanResponder directement.
 */
export function useSwipeGesture(
  onSwipeLeft : () => void,
  onSwipeRight: () => void,
  threshold   = 80,
): UseSwipeGestureResult {
  const startX   = useRef(0)
  const [deltaX, setDeltaX]   = useState(0)
  const [swiping, setSwiping] = useState(false)

  // Sur React Native natif (non-web), le hook retourne des no-ops
  // — SwipeableRow utilisera PanResponder dans ce cas.
  if (Platform.OS !== 'web') {
    const noop = () => {}
    return {
      deltaX : 0,
      swiping: false,
      bind   : { onTouchStart: noop, onTouchMove: noop, onTouchEnd: noop },
    }
  }

  const bind: SwipeGestureBindings = {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX
      setSwiping(true)
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!swiping) return
      const dx = e.touches[0].clientX - startX.current
      setDeltaX(dx)
    },
    onTouchEnd: () => {
      if (deltaX >  threshold) onSwipeRight()
      if (deltaX < -threshold) onSwipeLeft()
      setDeltaX(0)
      setSwiping(false)
    },
  }

  return { deltaX, bind, swiping }
}
