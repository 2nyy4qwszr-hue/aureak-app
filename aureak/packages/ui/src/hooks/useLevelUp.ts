// Story 59-2 — Hook de détection level-up
// Détecte le changement de tier XP et expose isLevelUp pour déclencher l'animation.
import { useState, useEffect, useRef } from 'react'
import { resolveLevel, gamification } from '@aureak/theme'

export type LevelTier = keyof typeof gamification.levels

/**
 * useLevelUp — détecte les changements de tier de niveau à partir du XP courant.
 *
 * @param currentXp - score XP actuel du joueur
 * @returns { level, prevLevel, isLevelUp, clearLevelUp }
 *
 * Usage minimal :
 * ```tsx
 * const { level, isLevelUp, clearLevelUp } = useLevelUp(playerXp)
 * return <LevelUpAnimation visible={isLevelUp} level={level} onDismiss={clearLevelUp} />
 * ```
 */
export function useLevelUp(currentXp: number) {
  const [level,      setLevel]      = useState<LevelTier>(() => resolveLevel(currentXp))
  const [prevLevel,  setPrevLevel]  = useState<LevelTier>(() => resolveLevel(currentXp))
  const [isLevelUp,  setIsLevelUp]  = useState(false)

  // ref pour stocker le level précédent sans déclencher de re-render
  const prevLevelRef = useRef<LevelTier>(resolveLevel(currentXp))

  useEffect(() => {
    const newTier = resolveLevel(currentXp)

    if (newTier !== prevLevelRef.current) {
      // Déterminer si c'est une montée (pas une descente)
      const TIER_ORDER: LevelTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend']
      const prevIdx = TIER_ORDER.indexOf(prevLevelRef.current)
      const newIdx  = TIER_ORDER.indexOf(newTier)

      if (newIdx > prevIdx) {
        // Montée de tier — déclencher l'animation
        setPrevLevel(prevLevelRef.current)
        setIsLevelUp(true)
      }

      prevLevelRef.current = newTier
      setLevel(newTier)
    }
  }, [currentXp])

  function clearLevelUp() {
    setIsLevelUp(false)
  }

  return { level, prevLevel, isLevelUp, clearLevelUp }
}
