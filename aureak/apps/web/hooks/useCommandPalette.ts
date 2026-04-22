// Story 51.3 — Hook useCommandPalette
// Gère l'état de la command palette ⌘K : ouverture, recherche, navigation clavier.

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { searchUnified } from '@aureak/api-client'
import type { CommandResult } from '@aureak/types'
import { filterNavCommands } from '../constants/navCommands'

// ── State ─────────────────────────────────────────────────────────────────────

export interface CommandPaletteState {
  isOpen       : boolean
  query        : string
  results      : CommandResult[]
  selectedIndex: number
  isLoading    : boolean
}

export interface CommandPaletteActions {
  open           : () => void
  close          : () => void
  toggle         : () => void
  setQuery       : (q: string) => void
  selectNext     : () => void
  selectPrev     : () => void
  executeSelected: () => void
  executeResult  : (result: CommandResult) => void
}

export type UseCommandPaletteReturn = CommandPaletteState & CommandPaletteActions

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildResultsFromSearch(
  data: Awaited<ReturnType<typeof searchUnified>>,
  query: string,
): CommandResult[] {
  const results: CommandResult[] = []

  // Navigation filtrée
  const navResults = filterNavCommands(query)
  results.push(...navResults)

  // Joueurs
  data.players.forEach(p => {
    results.push({
      id      : `player-${p.id}`,
      type    : 'player',
      label   : p.displayName,
      sublabel: [p.statut, p.currentClub].filter(Boolean).join(' · ') || 'Joueur',
      href    : `/children/${p.id}`,
      icon    : '⚽',
    })
  })

  // Clubs
  data.clubs.forEach(c => {
    results.push({
      id      : `club-${c.id}`,
      type    : 'club',
      label   : c.name,
      sublabel: c.province ?? 'Club',
      href    : `/clubs/${c.id}`,
      icon    : '🏟',
    })
  })

  // Séances
  data.sessions.forEach(s => {
    const date = s.scheduledAt
      ? new Date(s.scheduledAt).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''
    results.push({
      id      : `session-${s.id}`,
      type    : 'session',
      label   : s.groupName ?? 'Séance',
      sublabel: [date, s.status].filter(Boolean).join(' · '),
      href    : `/activites/seances/${s.id}`,
      icon    : '📅',
    })
  })

  return results
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCommandPalette(): UseCommandPaletteReturn {
  const router = useRouter()

  const [isOpen,        setIsOpen]        = useState(false)
  const [query,         setQueryState]    = useState('')
  const [results,       setResults]       = useState<CommandResult[]>(() => filterNavCommands(''))
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading,     setIsLoading]     = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true)
    setQueryState('')
    setResults(filterNavCommands(''))
    setSelectedIndex(0)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQueryState('')
    setSelectedIndex(0)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (prev) {
        // fermeture — reset état
        setQueryState('')
        setSelectedIndex(0)
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        return false
      }
      // ouverture — reset résultats
      setResults(filterNavCommands(''))
      return true
    })
  }, [])

  const selectNext = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1))
  }, [results.length])

  const selectPrev = useCallback(() => {
    setSelectedIndex(prev => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1))
  }, [results.length])

  const executeResult = useCallback((result: CommandResult) => {
    if (result.action) {
      result.action()
    } else if (result.href) {
      router.push(result.href as never)
    }
    close()
  }, [router, close])

  const executeSelected = useCallback(() => {
    const result = results[selectedIndex]
    if (!result) return
    executeResult(result)
  }, [results, selectedIndex, executeResult])

  // ── Query change with debounce ─────────────────────────────────────────────

  const setQuery = useCallback((q: string) => {
    setQueryState(q)
    setSelectedIndex(0)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.length < 2) {
      setResults(filterNavCommands(q))
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await searchUnified(q)
        setResults(buildResultsFromSearch(data, q))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CommandPalette] search error:', err)
        // Fallback : au moins les commandes de navigation filtrées
        setResults(filterNavCommands(q))
      } finally {
        setIsLoading(false)
      }
    }, 150)
  }, [])

  // ── Global keyboard listener ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac    = navigator.platform.toUpperCase().includes('MAC')
      const triggerKey = isMac ? e.metaKey : e.ctrlKey

      // ⌘K / Ctrl+K — ouvre/ferme la palette (prioritaire sur useKeyboardShortcuts)
      if (triggerKey && e.key === 'k') {
        e.preventDefault()
        e.stopImmediatePropagation()
        toggle()
        return
      }

      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const result = results[selectedIndex]
        if (result) executeResult(result)
      }
    }

    if (typeof window !== 'undefined') {
      // Capture phase pour être prioritaire sur useKeyboardShortcuts
      window.addEventListener('keydown', handler, true)
      return () => window.removeEventListener('keydown', handler, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, results, selectedIndex, toggle, close, executeResult])

  // ── Cleanup au unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    isOpen,
    query,
    results,
    selectedIndex,
    isLoading,
    open,
    close,
    toggle,
    setQuery,
    selectNext,
    selectPrev,
    executeSelected,
    executeResult,
  }
}
