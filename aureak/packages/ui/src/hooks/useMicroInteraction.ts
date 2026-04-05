// Story 62.1 — Hook micro-interactions système check/save/error
// CSS class-toggle approach (web-only) avec guard prefers-reduced-motion
// React Native : no-op (animations RN à implémenter via Animated API si besoin mobile)
import { useRef, useCallback } from 'react'

export interface UseMicroInteractionResult {
  ref          : React.RefObject<HTMLDivElement>
  triggerBounce: () => void
  triggerFlash : () => void
  triggerShake : () => void
}

/**
 * useMicroInteraction
 * Attache des animations CSS temporaires à un élément DOM via class-toggle.
 * - triggerBounce : scale 1→1.3→1 en 150ms (feedback présence cochée)
 * - triggerFlash  : flash vert 200ms (sauvegarde réussie)
 * - triggerShake  : shake horizontal ±8px 300ms (erreur)
 *
 * Guard prefers-reduced-motion : retourne des no-ops si activé.
 */
export function useMicroInteraction(): UseMicroInteractionResult {
  const ref = useRef<HTMLDivElement>(null)

  // Evalué une seule fois — la préférence ne change pas en cours de session
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const trigger = useCallback((className: string, durationMs: number) => {
    if (prefersReduced || !ref.current) return
    const el = ref.current
    // Retirer la classe si déjà présente (permet re-trigger immédiat)
    el.classList.remove(className)
    // Force reflow pour que le retrait soit pris en compte avant l'ajout
    void el.offsetHeight // eslint-disable-line @typescript-eslint/no-unused-expressions
    el.classList.add(className)
    const timer = setTimeout(() => {
      el.classList.remove(className)
    }, durationMs)
    // Le cleanup du timer est géré ici — le composant parent est responsable de ne pas
    // déclencher après démontage (la ref sera null donc trigger() devient no-op).
    return timer
  }, [prefersReduced])

  const triggerBounce = useCallback(() => { trigger('mi-bounce', 150) }, [trigger])
  const triggerFlash  = useCallback(() => { trigger('mi-flash',  200) }, [trigger])
  const triggerShake  = useCallback(() => { trigger('mi-shake',  300) }, [trigger])

  return { ref, triggerBounce, triggerFlash, triggerShake }
}
