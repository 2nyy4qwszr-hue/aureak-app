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
  if (pathname.startsWith('/methodologie/entrainements')) return [root, 'Méthodologie', 'Entraînements']
  if (pathname.startsWith('/methodologie/programmes'))    return [root, 'Méthodologie', 'Programmes']
  if (pathname.startsWith('/methodologie/themes'))        return [root, 'Méthodologie', 'Thèmes']
  if (pathname.startsWith('/methodologie/situations'))    return [root, 'Méthodologie', 'Situations']
  if (pathname.startsWith('/methodologie/evaluations'))   return [root, 'Méthodologie', 'Évaluations']
  if (pathname.startsWith('/methodologie'))               return [root, 'Méthodologie']
  if (pathname.startsWith('/academie/coachs'))         return [root, 'Académie', 'Coachs']
  if (pathname.startsWith('/academie/joueurs'))        return [root, 'Académie', 'Joueurs']
  if (pathname.startsWith('/academie/groupes'))        return [root, 'Académie', 'Groupes']
  if (pathname.startsWith('/academie/scouts'))         return [root, 'Académie', 'Scouts']
  if (pathname.startsWith('/academie/managers'))       return [root, 'Académie', 'Managers']
  if (pathname.startsWith('/academie/marketeurs'))     return [root, 'Académie', 'Marketeurs']
  if (pathname.startsWith('/academie/commerciaux'))    return [root, 'Académie', 'Commerciaux']
  if (pathname.startsWith('/academie/clubs'))          return [root, 'Académie', 'Clubs']
  if (pathname.startsWith('/academie/implantations'))  return [root, 'Académie', 'Implantations']
  if (pathname.startsWith('/academie'))                return [root, 'Académie']
  if (pathname.startsWith('/evenements/stages'))      return [root, 'Événements', 'Stages']
  if (pathname.startsWith('/evenements/tournois'))     return [root, 'Événements', 'Tournois']
  if (pathname.startsWith('/evenements/fun-days'))     return [root, 'Événements', 'Fun Days']
  if (pathname.startsWith('/evenements/detect-days'))  return [root, 'Événements', 'Detect Days']
  if (pathname.startsWith('/evenements/seminaires'))   return [root, 'Événements', 'Séminaires']
  if (pathname.startsWith('/evenements'))              return [root, 'Événements']
  if (pathname.startsWith('/prospection/clubs'))       return [root, 'Prospection', 'Clubs']
  if (pathname.startsWith('/prospection/gardiens'))    return [root, 'Prospection', 'Gardiens']
  if (pathname.startsWith('/prospection/entraineurs')) return [root, 'Prospection', 'Entraîneurs']
  if (pathname.startsWith('/prospection/attribution')) return [root, 'Prospection', 'Attribution']
  if (pathname.startsWith('/prospection/ressources'))  return [root, 'Prospection', 'Ressources']
  if (pathname.startsWith('/prospection'))             return [root, 'Prospection']
  if (pathname.startsWith('/marketing/mediatheque'))   return [root, 'Marketing', 'Médiathèque']
  if (pathname.startsWith('/marketing/reseaux'))       return [root, 'Marketing', 'Réseaux']
  if (pathname.startsWith('/marketing/campagnes'))     return [root, 'Marketing', 'Campagnes']
  if (pathname.startsWith('/marketing/analytics'))     return [root, 'Marketing', 'Analytics']
  if (pathname.startsWith('/marketing'))               return [root, 'Marketing']
  if (pathname.startsWith('/partenariat/sponsors'))    return [root, 'Partenariat', 'Sponsors']
  if (pathname.startsWith('/partenariat/clubs'))       return [root, 'Partenariat', 'Clubs']
  if (pathname.startsWith('/partenariat'))             return [root, 'Partenariat']
  if (pathname.startsWith('/performance/clubs'))         return [root, 'Performance', 'Clubs']
  if (pathname.startsWith('/performance/charge'))        return [root, 'Performance', 'Charge']
  if (pathname.startsWith('/performance/presences'))     return [root, 'Performance', 'Présences']
  if (pathname.startsWith('/performance/progression'))   return [root, 'Performance', 'Progression']
  if (pathname.startsWith('/performance/implantation'))  return [root, 'Performance', 'Implantations']
  if (pathname.startsWith('/performance/comparaisons'))  return [root, 'Performance', 'Comparaisons']
  if (pathname.startsWith('/performance'))               return [root, 'Performance']
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

  if (pathname.startsWith('/methodologie/entrainements')) {
    return [
      { label: '+ Nouvel entraînement', variant: 'gold', onPress: () => routerPush('/methodologie/entrainements/new') },
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

  if (pathname.startsWith('/academie/managers')) {
    return [
      { label: '+ Nouveau manager', variant: 'gold', onPress: () => routerPush('/academie/managers/new') },
    ]
  }

  if (pathname.startsWith('/academie/marketeurs')) {
    return [
      { label: '+ Nouveau marketeur', variant: 'gold', onPress: () => routerPush('/academie/marketeurs/new') },
    ]
  }

  if (pathname.startsWith('/academie/commerciaux')) {
    return [
      { label: '+ Nouveau commercial', variant: 'gold', onPress: () => routerPush('/academie/commerciaux/new') },
    ]
  }

  if (pathname.startsWith('/academie/joueurs')) {
    return [
      { label: '+ Nouveau joueur', variant: 'gold', onPress: () => routerPush('/children/new') },
    ]
  }

  if (pathname.startsWith('/academie/groupes')) {
    return [
      { label: '+ Nouveau groupe', variant: 'gold', onPress: () => routerPush('/academie/groupes' as never) },
    ]
  }

  if (pathname.startsWith('/academie/implantations')) {
    return [
      { label: '+ Nouvelle implantation', variant: 'gold', onPress: () => routerPush('/implantations' as never) },
    ]
  }

  if (pathname.startsWith('/academie/clubs')) {
    return []
  }

  if (pathname.startsWith('/academie/scouts')) {
    return []
  }

  if (pathname.startsWith('/academie')) {
    return [
      { label: '+ Nouveau joueur', variant: 'gold', onPress: () => routerPush('/children/new') },
    ]
  }

  if (pathname.startsWith('/evenements/tournois')) {
    return [
      { label: '+ Nouveau tournoi', variant: 'gold', onPress: () => routerPush('/evenements/tournois/new') },
    ]
  }

  if (pathname.startsWith('/evenements/fun-days')) {
    return [
      { label: '+ Nouveau fun day', variant: 'gold', onPress: () => routerPush('/evenements/fun-days/new') },
    ]
  }

  if (pathname.startsWith('/evenements/detect-days')) {
    return [
      { label: '+ Nouveau detect day', variant: 'gold', onPress: () => routerPush('/evenements/detect-days/new') },
    ]
  }

  if (pathname.startsWith('/evenements/seminaires')) {
    return [
      { label: '+ Nouveau séminaire', variant: 'gold', onPress: () => routerPush('/evenements/seminaires/new') },
    ]
  }

  if (pathname.startsWith('/evenements')) {
    return [
      { label: 'Exporter',         variant: 'outline', onPress: () => { /* TODO: export events */ } },
      { label: '+ Nouveau stage',  variant: 'gold',    onPress: () => routerPush('/evenements/stages/new') },
    ]
  }

  // Pas d'actions par défaut sur dashboard, settings, etc.
  return []
}
