import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type AppTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme      : AppTheme
  toggleTheme: () => void
  setTheme   : (t: AppTheme) => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ── Initialisation sans FOUC ─────────────────────────────────────────────────
// La lecture localStorage est synchrone côté client (pas de SSR dans Expo Router web).
// L'initialisation dans useState() s'exécute avant le premier render → pas de flash.

function getInitialTheme(): AppTheme {
  try {
    const saved = localStorage.getItem('aureak-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage inaccessible (SSR, private browsing avec restrictions) — continuer
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme)

  // Persistance localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('aureak-theme', theme)
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ThemeProvider] Failed to persist theme to localStorage')
      }
    }
  }, [theme])

  // Synchronisation prefers-color-scheme : si l'utilisateur change son OS preference
  // ET qu'il n'a pas de valeur sauvegardée, on suit le changement OS.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Respecter uniquement si aucune préférence explicitement sauvegardée
      try {
        const saved = localStorage.getItem('aureak-theme')
        if (saved === 'light' || saved === 'dark') return
      } catch {
        // localStorage inaccessible — on applique quand même le changement OS
      }
      setThemeState(e.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(t => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('[useTheme] Must be used inside <ThemeProvider>')
  }
  return ctx
}
