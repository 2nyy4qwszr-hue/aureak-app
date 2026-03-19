/**
 * Cache mémoire pour les signed URLs Supabase Storage (Story 25.4).
 *
 * Les signed URLs expirent après 1h. Ce cache évite de re-générer des URLs
 * encore valides lors des changements de filtre sur la page joueurs.
 *
 * Implémentation : Map module singleton (pas de state React, pas de base locale).
 * TTL : 50 min (marge 10 min avant expiration 1h Supabase).
 */

type CacheEntry = { url: string; expiresAt: number }

const cache = new Map<string, CacheEntry>()

const TTL_MS = 50 * 60 * 1000 // 50 min

/** Retourne l'URL cached si elle existe et n'est pas expirée, sinon null. */
export function getCachedUrl(path: string): string | null {
  const entry = cache.get(path)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(path); return null }
  return entry.url
}

/** Stocke une URL avec TTL de 50 min. */
export function setCachedUrl(path: string, url: string): void {
  cache.set(path, { url, expiresAt: Date.now() + TTL_MS })
}

/** Vide entièrement le cache — à appeler au logout pour éviter que les URLs
 *  d'une session soient réutilisées dans une session suivante (multi-utilisateur SPA). */
export function clearSignedUrlCache(): void {
  cache.clear()
}
