/**
 * is-abort-error.ts — Story 94.1
 *
 * Détecte les `AbortError` émis par le Lock auth de @supabase/gotrue-js.
 *
 * Contexte : en React Strict Mode (dev), `useEffect` se déclenche deux fois au mount
 * (mount → unmount → re-mount). Chaque cycle déclenche une requête Supabase qui acquiert
 * le lock auth via `navigator.locks`. La 2e requête utilise l'option `'steal'` de
 * `navigator.locks`, cancelant la 1re avec :
 *
 *   AbortError: Lock broken by another request with the 'steal' option
 *
 * C'est un faux-positif : la 2e query réussit et le state est correctement mis à jour.
 * Mais l'erreur pollue la console et inquiète à tort. Utiliser ce helper pour filtrer :
 *
 *   if (!isAbortError(err) && process.env.NODE_ENV !== 'production') {
 *     console.error('[module] context:', err)
 *   }
 *
 * À appliquer sur les helpers api-client appelés au mount d'un composant React (layouts,
 * pages, badges). Pas besoin pour les helpers appelés sur action utilisateur.
 */
export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: string }).name
  return name === 'AbortError'
}
