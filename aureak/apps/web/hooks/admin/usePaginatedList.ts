// Story 101.4 — Hook générique de pagination (desktop) / infinite scroll (mobile)
//
// Le hook est agnostique du mode (infinite vs paginated) : il expose `data`
// cumulé + `loadMore` + `refresh`. Le consommateur (ex. <InfiniteScrollContainer />)
// choisit comment déclencher `loadMore` (scroll auto mobile vs clic bouton desktop).
//
// API volontairement minimaliste — pas de filter/sort intégré. Le consommateur
// passe une closure `fetchPage` qui capture ses filtres/params courants et
// relance le hook via `refresh()` quand les filtres changent (déclenché par
// un changement de dépendance externe — typiquement un `useMemo` ou un reset).
//
// Contraintes CLAUDE.md :
//   - try/finally obligatoire sur setLoading (règle #3)
//   - console guardé par NODE_ENV (règle #4)

import { useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UsePaginatedListOptions<T> = {
  /**
   * Fetcher paginé. Doit retourner les items ET le total global.
   * Appelé avec `offset` = index du premier item à fetcher, `limit` = taille page.
   * Le hook gère l'append à data (infinite) ou le remplacement (refresh).
   */
  fetchPage   : (offset: number, limit: number) => Promise<{ data: T[]; total: number }>
  /** Taille de page. Default 30 (mobile friendly). Recommandé 50 sur desktop. */
  pageSize?   : number
  /** Si false, pas d'appel au mount — utile pour différer le 1er fetch. Default true. */
  initialLoad?: boolean
}

export type UsePaginatedListReturn<T> = {
  data    : T[]
  loading : boolean
  error   : Error | null
  hasMore : boolean
  /** Charge la page suivante. No-op si `loading` ou `!hasMore`. */
  loadMore: () => void
  /** Reset complet : vide data et refetch depuis offset 0. */
  refresh : () => void
  total   : number
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePaginatedList<T>(
  options: UsePaginatedListOptions<T>,
): UsePaginatedListReturn<T> {
  const { fetchPage, pageSize = 30, initialLoad = true } = options

  const [data,    setData]    = useState<T[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<Error | null>(null)

  // Guard anti-double-fire : `loadMore()` peut être appelé plusieurs fois
  // rapidement (scroll rapide), on ignore si un fetch est déjà en cours.
  const inflightRef = useRef(false)
  // Generation token : `refresh()` invalide tous les fetch en cours.
  // Si un fetch résout APRÈS un refresh, on ignore son résultat pour éviter
  // d'écraser les données fraîches avec de la data obsolète.
  const generationRef = useRef(0)
  // Offset courant — source de vérité pour `loadMore`. Découplé de data.length
  // pour rester cohérent même si `data` change entre le début et la fin du fetch.
  const offsetRef = useRef(0)

  const fetchPageRef = useRef(fetchPage)
  useEffect(() => { fetchPageRef.current = fetchPage }, [fetchPage])

  const doFetch = useCallback(async (offset: number, replace: boolean) => {
    if (inflightRef.current) return
    inflightRef.current = true
    const gen = generationRef.current
    setLoading(true)
    try {
      const res = await fetchPageRef.current(offset, pageSize)
      // Si un refresh() a eu lieu pendant le fetch, on ignore le résultat.
      if (gen !== generationRef.current) return
      setError(null)
      setTotal(res.total)
      if (replace) {
        setData(res.data)
        offsetRef.current = res.data.length
      } else {
        setData(prev => {
          const next = prev.concat(res.data)
          offsetRef.current = next.length
          return next
        })
      }
    } catch (err) {
      if (gen !== generationRef.current) return
      const e = err instanceof Error ? err : new Error(String(err))
      if (process.env.NODE_ENV !== 'production') {
        console.error('[usePaginatedList] fetchPage error:', e)
      }
      setError(e)
    } finally {
      inflightRef.current = false
      setLoading(false)
    }
  }, [pageSize])

  const loadMore = useCallback(() => {
    if (inflightRef.current) return
    // hasMore check : si on a déjà tout chargé, no-op.
    // On se base sur le ref (toujours à jour) + total (state).
    if (total > 0 && offsetRef.current >= total) return
    void doFetch(offsetRef.current, false)
  }, [doFetch, total])

  const refresh = useCallback(() => {
    generationRef.current += 1
    inflightRef.current = false
    offsetRef.current = 0
    setData([])
    setTotal(0)
    setError(null)
    void doFetch(0, true)
  }, [doFetch])

  // Initial load : au mount uniquement.
  // Pas de dépendance sur fetchPage (capturée via ref) pour éviter
  // les double-fires si le parent reconstruit la closure à chaque render.
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    if (initialLoad) {
      void doFetch(0, true)
    }
  }, [initialLoad, doFetch])

  // hasMore : on a encore des items à charger tant que data.length < total.
  // Avant le premier fetch (total=0, data=[]) : false (pas de scroll à déclencher).
  const hasMore = total > 0 && data.length < total

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
  }
}

export default usePaginatedList
