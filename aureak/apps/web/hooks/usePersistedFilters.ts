import { useState, useEffect, useCallback } from 'react'

/**
 * Persists filter state in localStorage between sessions.
 * Falls back gracefully when localStorage is unavailable (SSR, private browsing).
 *
 * @param key           - Unique storage key (e.g. 'admin-children-filters')
 * @param defaultValue  - Initial value if nothing is stored
 */
export function usePersistedFilters<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const readStorage = (): T => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  }

  const [value, setValueRaw] = useState<T>(readStorage)

  // Sync to localStorage whenever value changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Quota exceeded or private browsing — silently ignore
    }
  }, [key, value])

  const setValue = useCallback((update: T | ((prev: T) => T)) => {
    setValueRaw(prev => {
      const next = typeof update === 'function' ? (update as (p: T) => T)(prev) : update
      return next
    })
  }, [])

  return [value, setValue]
}

export default usePersistedFilters
