// Story 61.5 — useOfflineCache
// Hook React : détection online/offline, prefetch cache, sync queue
// RÈGLE : removeEventListener online/offline OBLIGATOIRE — BLOCKER
import { useCallback, useEffect, useRef, useState } from 'react'
import { setCacheItem, getCacheTimestamp, isCacheStale, CACHE_KEYS } from './offlineCache'
import { processQueue } from './offlineQueue'

interface UseOfflineCacheResult {
  isOnline       : boolean
  cacheTimestamp : Date | null
  isSyncing      : boolean
  syncResult     : { succeeded: number; failed: number } | null
}

/**
 * Hook de gestion cache offline :
 * - Détecte online/offline via navigator.onLine + events
 * - Prefetch des données du jour au montage (si online + cache périmé)
 * - Déclenche la sync queue à la reconnexion
 */
export function useOfflineCache(): UseOfflineCacheResult {
  const [isOnline,        setIsOnline]        = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [cacheTimestamp,  setCacheTimestamp]  = useState<Date | null>(getCacheTimestamp)
  const [isSyncing,       setIsSyncing]       = useState(false)
  const [syncResult,      setSyncResult]      = useState<{ succeeded: number; failed: number } | null>(null)
  const syncResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSync = useCallback(async () => {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await processQueue()
      setSyncResult(result)
      // Effacer le résultat après 5s
      if (syncResultTimerRef.current) clearTimeout(syncResultTimerRef.current)
      syncResultTimerRef.current = setTimeout(() => setSyncResult(null), 5000)
    } catch (err) {
      if ((process.env.NODE_ENV as string) !== 'production') {
        if ((process.env.NODE_ENV as string) !== 'production') console.error('[useOfflineCache] processQueue error:', err)
      }
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // Prefetch données du jour au montage
  const prefetch = useCallback(async () => {
    if (!isOnline) return
    if (!isCacheStale()) return

    try {
      // Import dynamique pour éviter le cycle — getActiveSession donne les séances du jour
      const { getActiveSession } = await import('../sessions/sessions')
      const sessions = await getActiveSession()
      setCacheItem(CACHE_KEYS.todaySessions, sessions, 4 * 60 * 60 * 1000)
      setCacheTimestamp(new Date())
    } catch (err) {
      if ((process.env.NODE_ENV as string) !== 'production') {
        if ((process.env.NODE_ENV as string) !== 'production') console.error('[useOfflineCache] prefetch error:', err)
      }
    }
  }, [isOnline])

  // Listeners online/offline (BLOCKER cleanup)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onOnline = () => {
      setIsOnline(true)
      triggerSync()
    }
    const onOffline = () => setIsOnline(false)

    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online',  onOnline)  // BLOCKER
      window.removeEventListener('offline', onOffline) // BLOCKER
    }
  }, [triggerSync])

  // Prefetch au montage
  useEffect(() => {
    prefetch()
  }, [prefetch])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (syncResultTimerRef.current) clearTimeout(syncResultTimerRef.current)
    }
  }, [])

  return { isOnline, cacheTimestamp, isSyncing, syncResult }
}
