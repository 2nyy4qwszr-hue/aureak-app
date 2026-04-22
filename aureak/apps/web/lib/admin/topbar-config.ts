// Story 93.7 — Configuration Topbar admin par route
// Helpers retournant breadcrumbs + actions selon pathname.

export type TopbarAction = {
  label  : string
  variant: 'gold' | 'outline'
  onPress: () => void
}

/** Retourne les breadcrumbs pour la route admin courante.
 *  Pattern: ['Aureak Admin', '<Section>', '<Page>'] */
export function getBreadcrumbs(pathname: string): string[] {
  const root = 'Aureak Admin'

  if (pathname.startsWith('/dashboard')) {
    return [root, 'Pilotage', 'Dashboard']
  }
  if (pathname.startsWith('/activites')) {
    return [root, 'Pilotage', 'Activités']
  }
  if (pathname.startsWith('/methodologie')) {
    return [root, 'Pédagogie', 'Méthodologie']
  }
  if (pathname.startsWith('/academie')) {
    return [root, 'Académie', 'Annuaire']
  }
  if (pathname.startsWith('/activites/seances')) {
    return [root, 'Pilotage', 'Séances']
  }
  if (pathname.startsWith('/academie/coachs')) {
    return [root, 'Académie', 'Coachs']
  }
  if (pathname.startsWith('/academie/joueurs')) {
    return [root, 'Académie', 'Joueurs']
  }
  if (pathname.startsWith('/academie/groupes')) {
    return [root, 'Académie', 'Groupes']
  }
  if (pathname.startsWith('/evenements/stages')) {
    return [root, 'Événements', 'Stages']
  }
  if (pathname.startsWith('/children')) {
    return [root, 'Académie', 'Joueurs']
  }
  if (pathname.startsWith('/users')) {
    return [root, 'Système', 'Utilisateurs']
  }
  if (pathname.startsWith('/profiles')) {
    return [root, 'Académie', 'Profil']
  }
  if (pathname.startsWith('/settings')) {
    return [root, 'Système', 'Paramètres']
  }

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
