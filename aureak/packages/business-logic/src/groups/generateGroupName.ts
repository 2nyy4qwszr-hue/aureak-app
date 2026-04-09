// Génération automatique du nom de groupe standardisé
// Format : [Lieu] - [Jour] - [HHhMM] - [Méthode]
// Gère automatiquement les doublons avec suffixe - 1 / - 2 / etc.

export type GroupMethod = 'Goal and Player' | 'Technique' | 'Situationnel' | 'Performance' | 'Décisionnel'

export const GROUP_METHODS: GroupMethod[] = [
  'Goal and Player',
  'Technique',
  'Situationnel',
  'Performance',
  'Décisionnel',
]

export const DAYS_OF_WEEK = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche',
] as const
export type DayOfWeek = typeof DAYS_OF_WEEK[number]

export const GROUP_DURATIONS = [45, 60, 75, 90, 120] as const

// Mapping anciennes catégories → méthodes
export const AGE_CATEGORY_TO_METHOD: Record<string, GroupMethod> = {
  'Foot à 5' : 'Goal and Player',
  'Foot à 8' : 'Technique',
  'Foot à 11': 'Situationnel',
  'Senior'   : 'Décisionnel',
  'U5'       : 'Goal and Player',
  'U8'       : 'Technique',
  'U11'      : 'Situationnel',
}

// Couleurs associées à chaque méthode (design system Dark Manga Premium)
export const METHOD_COLOR: Record<GroupMethod, string> = {
  'Goal and Player': '#FFB800',
  'Technique'      : '#4FC3F7',
  'Situationnel'   : '#66BB6A',
  'Performance'    : '#26A69A',
  'Décisionnel'    : '#CE93D8',
}

/**
 * Formate une heure en "17h00", "09h30", etc.
 */
export function formatGroupTime(hour: number, minute: number): string {
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return `${hh}h${mm}`
}

/**
 * Construit le nom de base d'un groupe (sans gestion de doublons).
 * Format : "[Lieu] - [Jour] - [HHhMM] - [Méthode]"
 */
export function buildGroupBaseName(
  place : string,
  day   : DayOfWeek | string,
  hour  : number,
  minute: number,
  method: GroupMethod,
): string {
  return `${place.trim()} - ${day} - ${formatGroupTime(hour, minute)} - ${method}`
}

/**
 * Génère un nom de groupe unique parmi les noms existants.
 * Si le nom de base existe déjà, ajoute - 1, - 2, etc.
 *
 * @param place         Nom du lieu / implantation
 * @param day           Jour de la semaine
 * @param hour          Heure de début (0-23)
 * @param minute        Minute de début (0, 15, 30, 45)
 * @param method        Méthode pédagogique
 * @param existingNames Noms déjà utilisés dans cette implantation
 * @param currentName   Nom actuel (pour exclure lors d'une édition)
 */
export function generateGroupName(
  place        : string,
  day          : DayOfWeek | string,
  hour         : number,
  minute       : number,
  method       : GroupMethod,
  existingNames: string[],
  currentName? : string,
): string {
  const base    = buildGroupBaseName(place, day, hour, minute, method)
  const others  = existingNames.filter(n => n !== currentName)

  if (!others.includes(base)) return base

  let i = 1
  while (others.includes(`${base} - ${i}`)) i++
  return `${base} - ${i}`
}
