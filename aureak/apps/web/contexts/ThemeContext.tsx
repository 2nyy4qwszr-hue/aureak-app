import React, { createContext, useCallback, useContext, useState } from 'react'

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
  return 'light'
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme)

  const toggleTheme = useCallback(() => { /* light-only — no toggle */ }, [])

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
