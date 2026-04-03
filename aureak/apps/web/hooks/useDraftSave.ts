// useDraftSave — Sauvegarde automatique d'un brouillon en localStorage
import { useEffect, useRef } from 'react'

/**
 * Persiste `value` dans localStorage sous `key` toutes les `delay` ms.
 * Utilisation :
 *   useDraftSave('stages-new-draft', form)
 *   const restored = useDraftRestore('stages-new-draft')  // au mount
 */
export function useDraftSave<T>(key: string, value: T, delay = 10_000): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    timerRef.current = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify(valueRef.current))
      } catch { /* quota exceeded ou SSR */ }
    }, delay)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [key, delay])
}

/** Restaure un brouillon depuis localStorage. Retourne null si absent. */
export function useDraftRestore<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Supprime un brouillon après soumission réussie. */
export function clearDraft(key: string): void {
  try { localStorage.removeItem(key) } catch { /* noop */ }
}
