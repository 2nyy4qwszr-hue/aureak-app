// Story 93.7 — Configuration Topbar admin par route
// Helpers retournant breadcrumbs + actions selon pathname.

export type TopbarAction = {
  label  : string
  variant: 'gold' | 'outline'
  onPress: () => void
}

/** Retourne les breadcrumbs pour la route admin courante.
 *  Pattern: ['Aureak Admin', '<Page>'] — niveau catégorie intermédiaire supprimé. */
export function getBreadcrumbs(pathname: string): string[] {
  const root = 'Aureak Admin'

  if (pathname.startsWith('/dashboard'))            return [root, 'Dashboard']
  if (pathname.startsWith('/activites/seances'))    return [root, 'Activités', 'Séances']
  if (pathname.startsWith('/activites/presences'))  return [root, 'Activités', 'Présences']
  if (pathname.startsWith('/activites/evaluations')) return [root, 'Activités', 'Évaluations']
  if (pathname.startsWith('/activites'))            return [root, 'Activités']
  if (pathname.startsWith('/methodologie'))     return [root, 'Méthodologie']
  if (pathname.startsWith('/academie/coachs'))  return [root, 'Coachs']
  if (pathname.startsWith('/academie/joueurs')) return [root, 'Joueurs']
  if (pathname.startsWith('/academie/groupes')) return [root, 'Groupes']
  if (pathname.startsWith('/academie'))         return [root, 'Annuaire']
  if (pathname.startsWith('/evenements/stages')) return [root, 'Stages']
  if (pathname.startsWith('/children'))         return [root, 'Joueurs']
  if (pathname.startsWith('/users'))            return [root, 'Utilisateurs']
  if (pathname.startsWith('/profiles'))         return [root, 'Profil']
  if (pathname.startsWith('/settings'))         return [root, 'Paramètres']

  // Fallback générique : juste "Aureak Admin"
  return [root]
}

/** Retourne les actions Topbar (boutons en haut droit) pour la route courante.
 *  `routerPush` est passé pour découpler la dépendance expo-router. */
export function getTopbarActions(
  pathname  : string,
  routerPush: (href: string) => void,
): TopbarAction[] {
  if (pathname.startsWith('/activites')) {
    return [
      { label: 'Exporter',          variant: 'outline', onPress: () => { /* TODO: export sessions */ } },
      { label: '+ Nouvelle séance', variant: 'gold',    onPress: () => routerPush('/activites/seances/new') },
    ]
  }

  if (pathname.startsWith('/methodologie/seances')) {
    return [
      { label: '+ Nouvel entraînement', variant: 'gold', onPress: () => routerPush('/methodologie/seances/new') },
    ]
  }

  if (pathname.startsWith('/methodologie/programmes')) {
    return [
      { label: '+ Nouveau programme', variant: 'gold', onPress: () => routerPush('/methodologie/programmes/new') },
    ]
  }

  if (pathname.startsWith('/methodologie/themes')) {
    return [
      { label: '+ Nouveau thème', variant: 'gold', onPress: () => routerPush('/methodologie/themes/new') },
    ]
  }

  if (pathname.startsWith('/methodologie/situations')) {
    return [
      { label: '+ Nouvelle situation', variant: 'gold', onPress: () => routerPush('/methodologie/situations/new') },
    ]
  }

  if (pathname.startsWith('/academie/coachs')) {
    return [
      { label: '+ Nouveau coach', variant: 'gold', onPress: () => routerPush('/academie/coachs/new') },
    ]
  }

  // Pas d'actions par défaut sur dashboard, settings, etc.
  return []
}
