'use client'
// Story tbd-recherche-globale — Recherche globale dans la sidebar admin
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { listChildDirectory, listClubDirectory, listCoaches } from '@aureak/api-client'
import { colors, space } from '@aureak/theme'

type SearchResult = {
  id      : string
  label   : string
  subLabel: string
  href    : string
  type    : 'joueur' | 'club' | 'coach'
}

const TYPE_ICON: Record<SearchResult['type'], string> = {
  joueur: '⚽',
  club  : '🏟',
  coach : '👤',
}
const TYPE_COLOR: Record<SearchResult['type'], string> = {
  joueur: colors.status.present,
  club  : '#3B82F6',
  coach : colors.accent.gold,
}

export function GlobalSearch() {
  const router  = useRouter()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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
      if (process.env.NODE_ENV !== 'production') console.error('[GlobalSearch] search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.href as never)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', marginHorizontal: 12, marginBottom: 8 } as React.CSSProperties}
    >
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          placeholder="Rechercher…"
          style={{
            width          : '100%',
            boxSizing      : 'border-box',
            padding        : '7px 10px 7px 28px',
            border         : `1px solid ${colors.border.light}`,
            borderRadius   : 6,
            backgroundColor: colors.light.muted,
            color          : colors.text.dark,
            fontSize       : 12,
            outline        : 'none',
            fontFamily     : 'inherit',
          }}
        />
        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: colors.text.muted }}>
          🔍
        </span>
        {loading && (
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: colors.text.muted }}>
            …
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position       : 'absolute',
          top            : '100%',
          left           : 0,
          right          : 0,
          marginTop      : 4,
          backgroundColor: colors.light.surface,
          border         : `1px solid ${colors.border.light}`,
          borderRadius   : 8,
          boxShadow      : '0 4px 16px rgba(0,0,0,0.12)',
          zIndex         : 200,
          overflow       : 'hidden',
        }}>
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              style={{
                display        : 'flex',
                alignItems     : 'center',
                gap            : 8,
                width          : '100%',
                padding        : '8px 12px',
                background     : 'none',
                border         : 'none',
                borderBottom   : `1px solid ${colors.border.divider}`,
                cursor         : 'pointer',
                textAlign      : 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.light.muted }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ fontSize: 14 }}>{TYPE_ICON[r.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 10, color: colors.text.muted }}>
                  <span style={{ color: TYPE_COLOR[r.type], fontWeight: 700 }}>{r.type}</span>
                  {' · '}{r.subLabel}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && !loading && results.length === 0 && (
        <div style={{
          position       : 'absolute',
          top            : '100%',
          left           : 0,
          right          : 0,
          marginTop      : 4,
          backgroundColor: colors.light.surface,
          border         : `1px solid ${colors.border.light}`,
          borderRadius   : 8,
          padding        : '10px 12px',
          fontSize       : 12,
          color          : colors.text.muted,
          zIndex         : 200,
        }}>
          Aucun résultat pour "{query}"
        </div>
      )}
    </div>
  )
}
