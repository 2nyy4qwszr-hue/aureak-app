// @aureak/theme — ThemeContext (Story 61.1)
// Provider de thème global : détection viewport mobile, toggle manuel, persistance AsyncStorage
// RÈGLE : aucune couleur hardcodée — uniquement via tokens.ts
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { colors } from './tokens'

// ── Types ────────────────────────────────────────────────────────────────────

export type AppTheme = 'light' | 'dark'

const lightColors = colors.light
const darkColors  = colors.dark

interface ThemeContextValue {
  isDark      : boolean
  theme       : AppTheme
  toggleTheme : () => void
  setTheme    : (t: AppTheme) => void
  /** Palette courante : lightColors si theme='light', darkColors si theme='dark' */
  themeColors : typeof lightColors | typeof darkColors
}

// ── Context ──────────────────────────────────────────────────────────────────

const ThemeCtx = createContext<ThemeContextValue | null>(null)

// ── Clé de persistance ────────────────────────────────────────────────────────
const STORAGE_KEY = 'theme_preference'

// ── Initialisation sans FOUC ─────────────────────────────────────────────────
// Lecture synchrone localStorage (pas de SSR dans Expo Router web) → pas de flash.
function getInitialTheme(): AppTheme {
  try {
    // Clé story 61.1 (AsyncStorage / localStorage web)
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
    if (saved === 'light' || saved === 'dark') return saved
    // Fallback clé story 51.8
    const legacy = (typeof localStorage !== 'undefined' ? localStorage.getItem('aureak-theme') : null)
    if (legacy === 'light' || legacy === 'dark') return legacy
  } catch {
    // localStorage inaccessible (private browsing, SSR guard)
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children   : React.ReactNode
  /** autoDetect=true : bascule automatiquement en dark si viewport < 768px */
  autoDetect?: boolean
}

export function ThemeProvider({ children, autoDetect = false }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme)

  // Auto-détection viewport (AC1, AC4) — uniquement si autoDetect prop
  useEffect(() => {
    if (!autoDetect || typeof window === 'undefined' || !window.matchMedia) return

    const mq = window.matchMedia('(max-width: 768px)')

    const applyMobile = (isMobile: boolean) => {
      // N'override que si l'utilisateur n'a pas de préférence explicite
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'light' || saved === 'dark') return
      } catch { /* noop */ }
      setThemeState(isMobile ? 'dark' : 'light')
    }

    applyMobile(mq.matches)

    const handler = (e: MediaQueryListEvent) => applyMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [autoDetect])

  // Synchronisation OS prefers-color-scheme (sans préférence explicite)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'light' || saved === 'dark') return
      } catch { /* noop */ }
      setThemeState(e.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Persistance (AC6) — localStorage synchrone (web) / AsyncStorage si natif
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
      // Rétro-compat story 51.8
      localStorage.setItem('aureak-theme', theme)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ThemeProvider] Failed to persist theme:', err)
      }
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState(t => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t)
  }, [])

  const isDark      = theme === 'dark'
  const themeColors = isDark ? darkColors : lightColors

  return (
    <ThemeCtx.Provider value={{ isDark, theme, toggleTheme, setTheme, themeColors }}>
      {children}
    </ThemeCtx.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx)
  if (!ctx) {
    throw new Error('[useTheme] Must be used inside <ThemeProvider>')
  }
  return ctx
}
