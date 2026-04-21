import { methodologyMethodColors } from '@aureak/theme'

/**
 * Mapping type pédagogique → couleur de bord/chip.
 * Source unique partagée entre SessionCard, MonthView et page.tsx.
 */
export const TYPE_COLOR: Record<string, string> = {
  goal_and_player : methodologyMethodColors['Goal and Player'],
  technique       : methodologyMethodColors['Technique'],
  situationnel    : methodologyMethodColors['Situationnel'],
  decisionnel     : methodologyMethodColors['Décisionnel'],
  perfectionnement: methodologyMethodColors['Perfectionnement'],
  integration     : methodologyMethodColors['Intégration'],
  performance     : methodologyMethodColors['Performance'],
  equipe          : '#94A3B8',
}

/** Noms complets des mois en français (0 = Janvier). */
export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/** Formate une Date en 'YYYY-MM-DD'. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Retourne true si la date correspond au jour courant. */
export function isToday(d: Date): boolean {
  return toDateStr(d) === toDateStr(new Date())
}
