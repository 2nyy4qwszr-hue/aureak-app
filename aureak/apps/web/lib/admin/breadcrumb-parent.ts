// Story 100.4 — Helper pour dériver le chemin parent à partir d'un pathname.
// Utilisé par le breadcrumb mobile compact (flèche retour).

const DEFAULT_ROOT = '/dashboard'

/**
 * Retourne le chemin parent — un niveau de segment en moins.
 * Cas edge :
 *   /              → /dashboard
 *   /activites     → /dashboard (fallback, le root admin est /dashboard)
 *   /activites/seances → /activites
 *   /academie/joueurs/[uuid] → /academie/joueurs
 */
export function getParentPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return DEFAULT_ROOT
  if (segments.length === 1) return DEFAULT_ROOT
  segments.pop()
  return '/' + segments.join('/')
}
