'use client'
// SearchContext — état et logique de la recherche globale admin
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useRouter } from 'expo-router'
import { listChildDirectory, listClubDirectory, listCoaches } from '@aureak/api-client'
import { colors } from '@aureak/theme'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SearchResult = {
  id      : string
  label   : string
  subLabel: string
  href    : string
  type    : 'joueur' | 'club' | 'coach'
}

export const SEARCH_TYPE_ICON: Record<SearchResult['type'], string> = {
  joueur: '⚽',
  club  : '🏟',
  coach : '👤',
}

export const SEARCH_TYPE_COLOR: Record<SearchResult['type'], string> = {
  joueur: colors.status.present,
  club  : '#3B82F6',
  coach : colors.accent.gold,
}

interface SearchContextValue {
  query       : string
  results     : SearchResult[]
  loading     : boolean
  open        : boolean
  setOpen     : (open: boolean) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSelect: (result: SearchResult) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const SearchContext = createContext<SearchContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const [childRes, clubRes, coachRes] = await Promise.allSettled([
        listChildDirectory({ search: q, page: 1, pageSize: 5 }),
        listClubDirectory({ search: q }),
        listCoaches({ page: 1, pageSize: 5 }),
      ])

      const items: SearchResult[] = []

      if (childRes.status === 'fulfilled') {
        const children = childRes.value
        const arr = Array.isArray(children) ? children : (children as { data?: unknown[] }).data ?? []
        ;(arr as { id: string; displayName?: string; currentClub?: string | null }[]).forEach(c => {
          if (c.displayName?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id      : c.id,
              label   : c.displayName ?? c.id,
              subLabel: c.currentClub ?? 'Joueur',
              href    : `/children/${c.id}`,
              type    : 'joueur',
            })
          }
        })
      }

      if (clubRes.status === 'fulfilled') {
        const clubs = clubRes.value
        const arr = Array.isArray(clubs) ? clubs : (clubs as { data?: unknown[] }).data ?? []
        ;(arr as { id: string; name?: string; city?: string | null }[]).slice(0, 5).forEach(c => {
          if (c.name?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id      : c.id,
              label   : c.name ?? c.id,
              subLabel: c.city ?? 'Club',
              href    : `/clubs/${c.id}`,
              type    : 'club',
            })
          }
        })
      }

      if (coachRes.status === 'fulfilled') {
        const coaches = coachRes.value
        const arr = Array.isArray(coaches) ? coaches : (coaches as { data?: unknown[] }).data ?? []
        ;(arr as { userId: string; displayName?: string | null }[]).forEach(c => {
          if (c.displayName?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id      : c.userId,
              label   : c.displayName ?? c.userId,
              subLabel: 'Coach',
              href    : `/coaches/${c.userId}`,
              type    : 'coach',
            })
          }
        })
      }

      setResults(items.slice(0, 10))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SearchProvider] search:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }, [search])

  const handleSelect = useCallback((result: SearchResult) => {
    router.push(result.href as never)
    setQuery('')
    setResults([])
    setOpen(false)
  }, [router])

  return (
    <SearchContext.Provider value={{ query, results, loading, open, setOpen, handleChange, handleSelect }}>
      {children}
    </SearchContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider')
  return ctx
}
