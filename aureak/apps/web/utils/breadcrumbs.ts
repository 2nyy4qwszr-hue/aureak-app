// ── Constantes ───────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Map statique : segment de route → label humain lisible.
 * Couvre toutes les routes actuelles du panneau admin Aureak.
 */
export const ROUTE_LABELS: Record<string, string> = {
  // Opérations
  dashboard           : 'Tableau de bord',
  seances             : 'Séances',
  presences           : 'Présences',
  evaluations         : 'Évaluations',

  // Méthodologie (section)
  methodologie        : 'Méthodologie',
  themes              : 'Thèmes',
  situations          : 'Situations',

  // Gestion
  children            : 'Joueurs',
  coaches             : 'Coachs',
  clubs               : 'Clubs',
  groups              : 'Groupes',
  implantations       : 'Implantations',

  // Événements
  stages              : 'Stages',

  // Analytics
  analytics           : 'Analytics',
  implantation        : 'Par implantation',

  // Administration
  users               : 'Utilisateurs',
  'access-grants'     : 'Accès temporaires',
  tickets             : 'Tickets support',
  audit               : "Journal d'audit",
  anomalies           : 'Anomalies',
  messages            : 'Messages coaches',
  'grade-permissions' : 'Permissions grades',
  settings            : 'Paramètres',
  'school-calendar'   : 'Calendrier scolaire',

  // Sous-routes communes
  new                 : 'Nouveau',
  edit                : 'Édition',
  attendance          : 'Présences séance',
  football            : 'Football',
  history             : 'Historique',
  planning            : 'Planning',
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label   : string
  href    : string
  isActive: boolean
}

// ── Fonction utilitaire ───────────────────────────────────────────────────────

/**
 * Parse un pathname Expo Router et retourne la liste des segments du fil d'Ariane.
 *
 * @param pathname       - pathname courant (ex: "/clubs/abc-123/attendance")
 * @param dynamicLabels  - labels résolus dynamiquement depuis BreadcrumbContext
 * @returns              - tableau de BreadcrumbItem prêt à rendre
 *
 * Règles :
 *   - Segments vides filtrés
 *   - Segment UUID (36 chars, regex) → cherche dans dynamicLabels, fallback "Détail"
 *   - Segment connu → ROUTE_LABELS[segment]
 *   - Segment inconnu → segment brut (jamais undefined)
 */
export function parseBreadcrumbs(
  pathname      : string,
  dynamicLabels : Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items   : BreadcrumbItem[] = []
  let accPath    = ''

  for (let i = 0; i < segments.length; i++) {
    const seg      = segments[i]
    accPath       += '/' + seg
    const isActive  = i === segments.length - 1

    let label: string
    if (UUID_REGEX.test(seg)) {
      label = dynamicLabels[seg] ?? 'Détail'
    } else {
      label = ROUTE_LABELS[seg] ?? seg
    }

    items.push({ label, href: accPath, isActive })
  }

  return items
}
