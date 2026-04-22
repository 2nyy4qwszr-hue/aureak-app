// useKeyboardShortcuts — Raccourcis clavier chord style Linear (Story 51.6)
// + Cmd+N contextuel + Escape GlobalSearch (comportements précédents conservés)
// Note : Cmd+K est géré par useCommandPalette (Story 51.3, capture phase avec stopImmediatePropagation).
// AC7 : quand CommandPalette est ouverte, son TextInput est focalisé → isInputFocused() = true → chords bloqués.

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'expo-router'
import { useSearch } from '../components/SearchContext'

// ── Constantes ────────────────────────────────────────────────────────────────

const NEW_ROUTES: Record<string, string> = {
  '/clubs'                      : '/clubs/new',
  '/children'                   : '/children/new',
  '/evenements/stages'          : '/evenements/stages/new',
  '/activites/seances'          : '/activites/seances/new',
  '/academie/groupes'           : '/academie/groupes/new',
  '/users'                      : '/users/new',
  '/methodologie/themes'        : '/methodologie/themes/new',
  '/methodologie/situations'    : '/methodologie/situations/new',
}

// Map chord : G X → route, N X → route (exportée pour ShortcutsHelp)
export const CHORD_MAP: Record<string, Record<string, string>> = {
  'G': {
    'J': '/children',
    'S': '/activites/seances',
    'C': '/clubs',
    'P': '/presences',
    'E': '/evaluations',
    'M': '/methodologie',
    'T': '/evenements/stages',
    'D': '/dashboard',
  },
  'N': {
    'S': '/activites/seances/new',
    'J': '/children/new',
    'C': '/clubs/new',
  },
}

const PREFIX_KEYS = new Set(['G', 'N'])
const CHORD_TIMEOUT_MS = 1000

// Touches de navigation navigateur — jamais interceptées (scroll, sélection de texte)
const BROWSER_NAV_KEYS = new Set(['END', 'HOME', 'PAGEUP', 'PAGEDOWN', 'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB'])

// ── Helpers ───────────────────────────────────────────────────────────────────

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toUpperCase()
  // Inputs standards + éléments scrollables focalisés (tabIndex > -1 + overflow scroll/auto)
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((el as HTMLElement).isContentEditable) return true
  const style = window.getComputedStyle(el)
  const overflow = style.overflow + style.overflowY + style.overflowX
  return overflow.includes('scroll') || overflow.includes('auto')
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface KeyboardShortcutsReturn {
  prefixActive         : boolean
  prefixKey            : string | null
  shortcutsHelpOpen    : boolean
  setShortcutsHelpOpen : (open: boolean) => void
}

export function useKeyboardShortcuts(): KeyboardShortcutsReturn {
  const router   = useRouter()
  const pathname = usePathname()
  const { setOpen: setSearchOpen } = useSearch()

  const [prefixKey,         setPrefixKey]         = useState<string | null>(null)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)

  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset du chord timer
  const clearChordTimer = useCallback(() => {
    if (chordTimerRef.current) {
      clearTimeout(chordTimerRef.current)
      chordTimerRef.current = null
    }
  }, [])

  const resetPrefix = useCallback(() => {
    clearChordTimer()
    setPrefixKey(null)
  }, [clearChordTimer])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Guard : input / textarea / select / contentEditable (inclut CommandPalette TextInput — AC3 + AC7)
      if (isInputFocused()) return

      const isMac  = navigator.platform.toUpperCase().includes('MAC')
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+N — route "nouveau" contextuelle (comportement historique)
      if (modKey && e.key === 'n') {
        const newRoute = Object.entries(NEW_ROUTES).find(([base]) =>
          pathname === base || pathname.startsWith(base + '/'),
        )?.[1]
        if (newRoute) {
          e.preventDefault()
          router.push(newRoute as never)
        }
        return
      }

      // Escape — ferme la GlobalSearch sidebar + reset préfixe chord
      if (e.key === 'Escape') {
        setSearchOpen(false)
        if (prefixKey) resetPrefix()
        return
      }

      // ? — overlay aide raccourcis (AC5) — hors modificateurs
      if (e.key === '?' && !modKey) {
        e.preventDefault()
        setShortcutsHelpOpen(true)
        resetPrefix()
        return
      }

      const key = e.key.toUpperCase()

      // Touches de navigation navigateur → toujours passer (scroll, Home/End)
      if (BROWSER_NAV_KEYS.has(key)) return

      // Pas de chord avec modificateurs (Ctrl, Meta, Alt) → reset préfixe
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (prefixKey) resetPrefix()
        return
      }

      // Phase 1 : enregistrement premier préfixe G ou N
      if (!prefixKey && PREFIX_KEYS.has(key)) {
        clearChordTimer()
        setPrefixKey(key)
        // Timer reset automatique 1s sans 2ème touche (AC4)
        chordTimerRef.current = setTimeout(() => {
          setPrefixKey(null)
          chordTimerRef.current = null
        }, CHORD_TIMEOUT_MS)
        return
      }

      // Phase 2 : seconde touche après préfixe → navigation
      if (prefixKey) {
        const route = CHORD_MAP[prefixKey]?.[key]
        if (route) {
          e.preventDefault()
          clearChordTimer()
          router.push(route as never)
          setPrefixKey(null)
        } else {
          // Touche non reconnue → reset silencieux
          resetPrefix()
        }
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pathname, router, setSearchOpen, prefixKey, resetPrefix, clearChordTimer])

  // Cleanup timer au démontage
  useEffect(() => {
    return () => clearChordTimer()
  }, [clearChordTimer])

  return {
    prefixActive        : prefixKey !== null,
    prefixKey,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
  }
}
