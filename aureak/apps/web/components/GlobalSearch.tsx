'use client'
// Story tbd-recherche-globale — Recherche globale dans la sidebar admin
import React, { useRef, useEffect } from 'react'
import { colors } from '@aureak/theme'
import { useSearch, SEARCH_TYPE_ICON, SEARCH_TYPE_COLOR } from './SearchContext'

export function GlobalSearch() {
  const { query, results, loading, open, setOpen, handleChange, handleSelect } = useSearch()
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Ferme la dropdown sur clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setOpen])

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
            border         : `1px solid ${colors.border.dark}`,
            borderRadius   : 6,
            backgroundColor: 'rgba(255,255,255,0.08)',
            color          : colors.text.primary,
            fontSize       : 12,
            outline        : 'none',
            fontFamily     : 'inherit',
          }}
        />
        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: colors.text.secondary }}>
          🔍
        </span>
        {loading && (
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: colors.text.secondary }}>
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
              <span style={{ fontSize: 14 }}>{SEARCH_TYPE_ICON[r.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 10, color: colors.text.muted }}>
                  <span style={{ color: SEARCH_TYPE_COLOR[r.type], fontWeight: 700 }}>{r.type}</span>
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
