// Story 86-4 — Config de la sidebar dynamique pilotée par permissions
// RÈGLE : cette config ne touche pas à la DB. Elle mappe `SectionKey` → item UI.
// Les permissions effectives (combinaison rôle + overrides) sont calculées par
// `getEffectivePermissions` (Story 86-3) et consommées ici pour filtrer.

import type { ComponentType } from 'react'
import type { SectionKey, UserRole, EffectivePermissions } from '@aureak/types'
import { SECTION_KEYS } from '@aureak/types'
import {
  LayoutGridIcon,
  ActivityIcon,
  BookOpenIcon,
  UsersIcon,
  CalendarIcon,
  CompassIcon,
  MegaphoneIcon,
  HandshakeIcon,
  TrendingUpIcon,
  UserIcon,
} from '@aureak/ui'
import type { NavIconProps } from '@aureak/ui'

// =============================================================================
// Types
// =============================================================================

type NavIconComponent = ComponentType<NavIconProps>

export type NavItem = {
  label      : string
  href       : string
  Icon       : NavIconComponent
  sectionKey : SectionKey
}

export type NavGroup = {
  label : string
  items : NavItem[]
}

// =============================================================================
// 1. Mapping section → item nav (route + icône + label par défaut)
// =============================================================================

/**
 * SECTION_TO_NAV — une entrée par `SectionKey`.
 * Les routes pour `prospection` / `marketing` / `partenariat` sont des stubs
 * (pages "À venir" ou 404 acceptable jusqu'aux Epics 88/91/92).
 */
export const SECTION_TO_NAV: Record<SectionKey, Omit<NavItem, 'sectionKey'>> = {
  dashboard   : { label: 'Dashboard',      href: '/dashboard',                 Icon: LayoutGridIcon },
  activites   : { label: 'Activités',      href: '/activites',                 Icon: ActivityIcon },
  methodologie: { label: 'Méthodologie',   href: '/methodologie/seances',      Icon: BookOpenIcon },
  academie    : { label: 'Académie',       href: '/academie',                  Icon: UsersIcon },
  evenements  : { label: 'Événements',     href: '/evenements',                Icon: CalendarIcon },
  prospection : { label: 'Prospection',    href: '/prospection',               Icon: CompassIcon },
  marketing   : { label: 'Marketing',      href: '/marketing',                 Icon: MegaphoneIcon },
  partenariat : { label: 'Partenariat',    href: '/partenariat',               Icon: HandshakeIcon },
  performances: { label: 'Performance',    href: '/performance',               Icon: TrendingUpIcon },
  admin       : { label: 'Administration', href: '/administration',            Icon: UserIcon },
}

// =============================================================================
// 2. Surcharges de labels selon le rôle actif
// =============================================================================

/**
 * ROLE_LABEL_OVERRIDES — labels contextualisés.
 * Exemple : un commercial voit "Annuaire clubs" au lieu de "Académie",
 * un coach voit "Mes joueurs" au lieu de "Académie".
 * Clés absentes → label par défaut de SECTION_TO_NAV.
 */
export const ROLE_LABEL_OVERRIDES: Partial<Record<UserRole, Partial<Record<SectionKey, string>>>> = {
  commercial: {
    academie   : 'Annuaire clubs',
    prospection: 'Mon pipeline',
  },
  coach: {
    academie   : 'Mes joueurs',
    prospection: 'Mes contacts',
  },
  marketeur: {
    academie : 'Annuaire équipes',
    marketing: 'Mon studio',
  },
  manager: {
    academie    : 'Gestion équipe',
    performances: 'Indicateurs',
  },
}

// =============================================================================
// 3. buildNavGroups — composition finale
// =============================================================================

/**
 * buildNavGroups — construit la liste des groupes de navigation pour la sidebar.
 * Retourne un groupe par item (visuel identique à l'ancien NAV_GROUPS statique,
 * où chaque groupe avait `label: ''` et un seul item).
 *
 * - `admin` est exclu de la sidebar principale (accessible uniquement via ⚙️).
 * - Ordre garanti stable par `SECTION_KEYS`.
 * - Les labels sont surchargés selon `activeRole` via `ROLE_LABEL_OVERRIDES`.
 */
export function buildNavGroups(
  activeRole : UserRole | null,
  permissions: EffectivePermissions | null,
): NavGroup[] {
  if (!activeRole || !permissions) return []

  const overrides = ROLE_LABEL_OVERRIDES[activeRole] ?? {}

  // Ordre stable : on itère sur SECTION_KEYS, on exclut `admin`, on filtre sur granted
  const sectionsToShow = SECTION_KEYS.filter(k => k !== 'admin' && permissions[k] === true)

  const items: NavItem[] = sectionsToShow.map(k => ({
    ...SECTION_TO_NAV[k],
    label      : overrides[k] ?? SECTION_TO_NAV[k].label,
    sectionKey : k,
  }))

  // Un groupe par item pour conserver les espaces visuels de l'ancien layout.
  return items.map(item => ({ label: '', items: [item] }))
}
