import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistedFilters } from './usePersistedFilters'

// ── Helpers ──────────────────────────────────────────────────────────────────

const KEY = 'test-filters'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePersistedFilters', () => {
  it('retourne la valeur par défaut quand localStorage est vide', () => {
    const { result } = renderHook(() =>
      usePersistedFilters(KEY, { statut: 'all', actif: true })
    )
    expect(result.current[0]).toEqual({ statut: 'all', actif: true })
  })

  it('lit la valeur déjà présente dans localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify({ statut: 'Académicien', actif: false }))
    const { result } = renderHook(() =>
      usePersistedFilters(KEY, { statut: 'all', actif: true })
    )
    expect(result.current[0]).toEqual({ statut: 'Académicien', actif: false })
  })

  it('écrit dans localStorage quand la valeur change', () => {
    const { result } = renderHook(() =>
      usePersistedFilters(KEY, { statut: 'all', actif: true })
    )
    act(() => {
      result.current[1]({ statut: 'Ancien', actif: false })
    })
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    expect(stored).toEqual({ statut: 'Ancien', actif: false })
  })

  it('supporte la mise à jour fonctionnelle (prev => next)', () => {
    const { result } = renderHook(() =>
      usePersistedFilters(KEY, { count: 0 })
    )
    act(() => {
      result.current[1](prev => ({ count: prev.count + 1 }))
    })
    expect(result.current[0]).toEqual({ count: 1 })
    act(() => {
      result.current[1](prev => ({ count: prev.count + 1 }))
    })
    expect(result.current[0]).toEqual({ count: 2 })
  })

  it('retourne la valeur par défaut si localStorage contient du JSON invalide', () => {
    localStorage.setItem(KEY, 'not-valid-json{{{')
    const { result } = renderHook(() =>
      usePersistedFilters(KEY, { statut: 'default' })
    )
    expect(result.current[0]).toEqual({ statut: 'default' })
  })

  it('continue de fonctionner si localStorage lance une erreur (quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    const { result } = renderHook(() =>
      usePersistedFilters(KEY, { statut: 'all' })
    )
    // Ne pas crasher — juste ignorer silencieusement
    expect(() => {
      act(() => { result.current[1]({ statut: 'Nouveau' }) })
    }).not.toThrow()
    expect(result.current[0]).toEqual({ statut: 'Nouveau' })
  })

  it('utilise des clés distinctes pour éviter les collisions entre pages', () => {
    const { result: resultA } = renderHook(() =>
      usePersistedFilters('children-filters', { statut: 'A' })
    )
    const { result: resultB } = renderHook(() =>
      usePersistedFilters('clubs-filters', { statut: 'B' })
    )
    act(() => { resultA.current[1]({ statut: 'Académicien' }) })
    // La clé B ne doit pas être affectée par la mise à jour de A
    expect(resultB.current[0]).toEqual({ statut: 'B' })
    expect(localStorage.getItem('children-filters')).toContain('Académicien')
    // clubs-filters contient toujours B (pas Académicien) → isolation OK
    expect(localStorage.getItem('clubs-filters')).toContain('B')
    expect(localStorage.getItem('clubs-filters')).not.toContain('Académicien')
  })
})
