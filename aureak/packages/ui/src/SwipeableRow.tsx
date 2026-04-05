// Story 61.4 — SwipeableRow
// Ligne swipeable pour présences : fond coloré progressif + icônes ✓ / ✗
// Uniquement activé sur viewport < 768px (isMobile guard)
import React from 'react'
import { Platform, View } from 'react-native'
import { useSwipeGesture } from './hooks/useSwipeGesture'

export interface SwipeableRowProps {
  onSwipeLeft      : () => void
  onSwipeRight     : () => void
  leftBackground?  : React.ReactNode
  rightBackground? : React.ReactNode
  children         : React.ReactNode
  /** Activer les gestures uniquement sur mobile */
  isMobile?        : boolean
  /** Threshold en px (default: 80) */
  threshold?       : number
}

/**
 * Conteneur swipeable.
 * - Swipe droite > threshold → onSwipeRight (présent)
 * - Swipe gauche > threshold → onSwipeLeft  (absent)
 * - Retour snap < threshold  → rebond 150ms
 * Sur desktop (isMobile=false), rendu pass-through sans gesture.
 */
export function SwipeableRow({
  onSwipeLeft,
  onSwipeRight,
  children,
  isMobile  = true,
  threshold = 80,
}: SwipeableRowProps) {
  const { deltaX, bind } = useSwipeGesture(onSwipeLeft, onSwipeRight, threshold)

  // AC5 — desktop ou React Native natif non-web : rendu simple
  if (!isMobile || Platform.OS !== 'web') {
    return <View>{children}</View>
  }

  // Opacité des fonds selon deltaX (AC4)
  const rightBgOpacity = Math.min(Math.max(deltaX  / threshold, 0), 1)
  const leftBgOpacity  = Math.min(Math.max(-deltaX / threshold, 0), 1)

  const isSnapping = Math.abs(deltaX) <= threshold

  return (
    <div
      {...bind}
      style={{
        position  : 'relative',
        overflow  : 'hidden',
        userSelect: 'none',
        touchAction: 'pan-y', // laisser le scroll vertical
      }}
    >
      {/* Fond vert droite (présent) */}
      <div style={{
        position       : 'absolute',
        top            : 0, bottom: 0, left: 0, right: 0,
        backgroundColor: '#10B981',
        opacity        : rightBgOpacity,
        display        : 'flex',
        alignItems     : 'center',
        paddingLeft    : 16,
        pointerEvents  : 'none',
        transition     : isSnapping ? 'opacity 0.15s ease' : 'none',
      }}>
        {deltaX >= 40 && (
          <span style={{ fontSize: 20, color: '#fff' }}>✓</span>
        )}
      </div>

      {/* Fond rouge gauche (absent) */}
      <div style={{
        position       : 'absolute',
        top            : 0, bottom: 0, left: 0, right: 0,
        backgroundColor: '#E05252',
        opacity        : leftBgOpacity,
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'flex-end',
        paddingRight   : 16,
        pointerEvents  : 'none',
        transition     : isSnapping ? 'opacity 0.15s ease' : 'none',
      }}>
        {deltaX <= -40 && (
          <span style={{ fontSize: 20, color: '#fff' }}>✗</span>
        )}
      </div>

      {/* Contenu de la ligne */}
      <div style={{
        transform : `translateX(${deltaX}px)`,
        transition: isSnapping && deltaX === 0 ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        position  : 'relative',
        zIndex    : 1,
      }}>
        {children}
      </div>
    </div>
  )
}
