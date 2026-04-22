// Story 51.3 — Liste statique des commandes de navigation
// Affichée en priorité (query vide) ou filtrée sur la query.

import type { CommandResult } from '@aureak/types'

/**
 * Top-6 actions affichées quand la query est vide.
 * Couvre les routes principales et les actions fréquentes de l'admin.
 */
export const NAV_COMMANDS: CommandResult[] = [
  // ── Opérations ──────────────────────────────────────────────────────────────
  {
    id     : 'nav-dashboard',
    type   : 'navigation',
    label  : 'Tableau de bord',
    sublabel: 'Vue d\'ensemble',
    href   : '/dashboard',
    icon   : '🏠',
  },
  {
    id     : 'nav-seances',
    type   : 'navigation',
    label  : 'Séances',
    sublabel: 'Calendrier des séances',
    href   : '/activites/seances',
    icon   : '📅',
  },
  {
    id     : 'nav-seances-new',
    type   : 'navigation',
    label  : 'Nouvelle séance',
    sublabel: 'Créer une séance terrain',
    href   : '/activites/seances/new',
    icon   : '➕',
  },
  {
    id     : 'nav-presences',
    type   : 'navigation',
    label  : 'Présences',
    sublabel: 'Gestion des présences',
    href   : '/presences',
    icon   : '✅',
  },
  {
    id     : 'nav-evaluations',
    type   : 'navigation',
    label  : 'Évaluations',
    sublabel: 'Évaluations techniques',
    href   : '/evaluations',
    icon   : '⭐',
  },
  // ── Gestion ──────────────────────────────────────────────────────────────────
  {
    id     : 'nav-children',
    type   : 'navigation',
    label  : 'Joueurs',
    sublabel: 'Annuaire des joueurs',
    href   : '/children',
    icon   : '⚽',
  },
  {
    id     : 'nav-clubs',
    type   : 'navigation',
    label  : 'Clubs',
    sublabel: 'Annuaire des clubs belges',
    href   : '/clubs',
    icon   : '🏟',
  },
  {
    id     : 'nav-coaches',
    type   : 'navigation',
    label  : 'Coachs',
    sublabel: 'Liste des coachs',
    href   : '/academie/coachs',
    icon   : '👤',
  },
  {
    id     : 'nav-groups',
    type   : 'navigation',
    label  : 'Groupes',
    sublabel: 'Groupes d\'entraînement',
    href   : '/academie/groupes',
    icon   : '👥',
  },
  {
    id     : 'nav-implantations',
    type   : 'navigation',
    label  : 'Implantations',
    sublabel: 'Sites d\'entraînement',
    href   : '/implantations',
    icon   : '📍',
  },
  // ── Événements ───────────────────────────────────────────────────────────────
  {
    id     : 'nav-stages',
    type   : 'navigation',
    label  : 'Stages',
    sublabel: 'Gestion des stages',
    href   : '/evenements/stages',
    icon   : '🎯',
  },
  // ── Méthodologie ─────────────────────────────────────────────────────────────
  {
    id     : 'nav-methodologie',
    type   : 'navigation',
    label  : 'Méthodologie',
    sublabel: 'Séances pédagogiques',
    href   : '/methodologie/seances',
    icon   : '📖',
  },
  // ── Administration ───────────────────────────────────────────────────────────
  {
    id     : 'nav-users',
    type   : 'navigation',
    label  : 'Utilisateurs',
    sublabel: 'Gestion des comptes',
    href   : '/users',
    icon   : '🔑',
  },
  {
    id     : 'nav-audit',
    type   : 'navigation',
    label  : 'Journal d\'audit',
    sublabel: 'Traçabilité des actions',
    href   : '/audit',
    icon   : '🔍',
  },
]

/** Top-6 commandes affichées quand la palette s'ouvre (query vide). */
export const DEFAULT_COMMANDS: CommandResult[] = NAV_COMMANDS.slice(0, 6)

/**
 * Filtre les commandes de navigation en fonction de la query.
 * Insensible à la casse, accent-insensible via normalize + replace.
 */
export function filterNavCommands(query: string): CommandResult[] {
  if (!query.trim()) return DEFAULT_COMMANDS
  const q = query.toLowerCase()
  return NAV_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    (cmd.sublabel?.toLowerCase().includes(q) ?? false),
  )
}
