// Story 61.5 — offlineQueue
// File d'attente des actions offline (présences) — sync à la reconnexion
// RÈGLE : accès Supabase UNIQUEMENT via @aureak/api-client — jamais direct

import { getCacheItem, setCacheItem, CACHE_KEYS } from './offlineCache'
import { recordAttendance } from '../sessions/attendances'

/** Simple UUID v4 generator (pas de dépendance uuid) */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OfflineQueueItem {
  id        : string          // UUID v4
  type      : 'update_attendance' | 'create_attendance'
  payload   : Record<string, unknown>
  timestamp : number          // Date.now()
  retryCount: number
}

const QUEUE_TTL_MS  = 24 * 60 * 60 * 1000 // 24h
const MAX_QUEUE_SIZE = 100

// ── Fonctions ─────────────────────────────────────────────────────────────────

/**
 * Récupère la queue offline (items non synchronisés).
 */
export function getQueue(): OfflineQueueItem[] {
  return getCacheItem<OfflineQueueItem[]>(CACHE_KEYS.offlineQueue) ?? []
}

/**
 * Ajoute une action à la queue offline.
 * Limite la queue à MAX_QUEUE_SIZE items (AC6.1).
 */
export function enqueueAction(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): OfflineQueueItem {
  const queue = getQueue()

  // Limite (QA 6.1)
  if (queue.length >= MAX_QUEUE_SIZE) {
    if ((process.env.NODE_ENV as string) !== 'production') {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[offlineQueue] Queue is full — discarding oldest item')
    }
    queue.shift() // retire le plus ancien
  }

  const newItem: OfflineQueueItem = {
    ...item,
    id        : uuidv4(),
    timestamp : Date.now(),
    retryCount: 0,
  }

  queue.push(newItem)
  setCacheItem(CACHE_KEYS.offlineQueue, queue, QUEUE_TTL_MS)
  return newItem
}

/**
 * Retire un item de la queue après synchronisation réussie.
 */
export function dequeueAction(id: string): void {
  const queue = getQueue().filter(item => item.id !== id)
  setCacheItem(CACHE_KEYS.offlineQueue, queue, QUEUE_TTL_MS)
}

/**
 * Traite la queue dans l'ordre chronologique.
 * Retourne le nombre d'items réussis et échoués.
 */
export async function processQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = getQueue()
    .filter(item => item.retryCount < 3)
    .sort((a, b) => a.timestamp - b.timestamp)

  let succeeded = 0
  let failed    = 0

  for (const item of queue) {
    try {
      await processItem(item)
      dequeueAction(item.id)
      succeeded++
    } catch (err) {
      if ((process.env.NODE_ENV as string) !== 'production') {
        if ((process.env.NODE_ENV as string) !== 'production') console.error('[offlineQueue] processItem failed:', item.id, err)
      }
      // Incrémenter retryCount
      const all = getQueue()
      const idx = all.findIndex(q => q.id === item.id)
      if (idx !== -1) {
        all[idx].retryCount++
        setCacheItem(CACHE_KEYS.offlineQueue, all, QUEUE_TTL_MS)
      }
      failed++
    }
  }

  return { succeeded, failed }
}

// ── Exécution d'un item ───────────────────────────────────────────────────────

async function processItem(item: OfflineQueueItem): Promise<void> {
  if (item.type === 'update_attendance' || item.type === 'create_attendance') {
    const { sessionId, childId, tenantId, status } = item.payload as {
      sessionId : string
      childId   : string
      tenantId  : string
      status    : string
    }
    const { error } = await recordAttendance({
      sessionId,
      childId,
      tenantId,
      status    : status as Parameters<typeof recordAttendance>[0]['status'],
      recordedBy: '',
    })
    if (error) throw error
  }
}
