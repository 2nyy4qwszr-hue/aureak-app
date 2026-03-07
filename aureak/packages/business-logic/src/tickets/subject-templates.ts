// Story 7.4 — Templates de sujet pré-remplis par catégorie (constantes front-end)
export const TICKET_SUBJECT_TEMPLATES: Record<string, (childName: string, date: string) => string> = {
  absence   : (name, date) => `Absence de ${name} le ${date}`,
  retard    : (name, date) => `Retard prévu pour ${name} le ${date}`,
  question  : () => '',
  logistique: () => 'Question logistique — ',
}
