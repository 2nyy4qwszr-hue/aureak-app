// Story 61.5 — offlineCache
// Utilitaires cache AsyncStorage/localStorage pour mode offline
// RÈGLE : console guards obligatoires

const CACHE_KEYS = {
  todaySessions : 'cache:sessions:today',
  groupMembers  : (groupId: string) => `cache:members:${groupId}`,
  offlineQueue  : 'offline:queue',
  cacheTimestamp: 'cache:timestamp',
} as const

export { CACHE_KEYS }

interface CacheEntry<T> {
  data     : T
  timestamp: number
  ttlMs    : number
}

function getStorage(): Storage | null {
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

/**
 * Stocke une entrée dans le cache avec TTL.
 */
export function setCacheItem<T>(key: string, data: T, ttlMs: number): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttlMs }
    storage.setItem(key, JSON.stringify(entry))
    storage.setItem(CACHE_KEYS.cacheTimestamp, String(Date.now()))
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[offlineCache] setCacheItem error:', err)
    }
  }
}

/**
 * Récupère une entrée du cache. Retourne null si expirée ou absente.
 */
export function getCacheItem<T>(key: string): T | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    const age   = Date.now() - entry.timestamp
    if (age > entry.ttlMs) {
      storage.removeItem(key)
      return null
    }
    return entry.data
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[offlineCache] getCacheItem error:', err)
    }
    return null
  }
}

/**
 * Invalide une entrée du cache.
 */
export function invalidateCache(key: string): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[offlineCache] invalidateCache error:', err)
    }
  }
}

/**
 * Retourne le timestamp du dernier cache (ou null).
 */
export function getCacheTimestamp(): Date | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(CACHE_KEYS.cacheTimestamp)
    if (!raw) return null
    return new Date(parseInt(raw, 10))
  } catch {
    return null
  }
}

/**
 * Vérifie si le cache doit être invalidé (> 4h ou différent jour).
 */
export function isCacheStale(): boolean {
  const ts = getCacheTimestamp()
  if (!ts) return true
  const now     = new Date()
  const agMs    = now.getTime() - ts.getTime()
  const staleMs = 4 * 60 * 60 * 1000 // 4h
  // Invalidé si > 4h ou si le jour a changé (AC6)
  const differentDay = ts.toDateString() !== now.toDateString()
  return agMs > staleMs || differentDay
}
