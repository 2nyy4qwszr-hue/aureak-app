// Story 87.2 — Labels partagés pour les rôles utilisateur
// Source de vérité unique pour l'affichage "human readable" de UserRole.
// Doit couvrir les 8 rôles de l'enum (Epic 86-1) — un match manquant casse
// Record<UserRole, ...> donc tsc échouera à toute incomplétude.

import type { UserRole } from '@aureak/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin     : 'Administrateur',
  coach     : 'Coach',
  parent    : 'Parent',
  child     : 'Joueur',
  club      : 'Club partenaire',
  commercial: 'Commercial',
  manager   : 'Manager',
  marketeur : 'Marketeur',
}
