# Story 97.1 — Sidebar : adopter les 7 icônes Lucide du template design

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.1
- **Story key** : `97-1-sidebar-icones-lucide`
- **Priorité** : P1 (fondation visuelle partagée sidebar admin)
- **Dépendances** : aucune
- **Source** : Audit UI 2026-04-22, template design `_bmad-output/design-references/_template_extracted/icons.jsx`
- **Effort estimé** : S (~3-4h — 5 composants SVG à créer + 7 imports à remplacer + 1 config à mettre à jour)

## Story

As an admin,
I want que la sidebar utilise les 7 icônes Lucide métiers du template design (dashboard grille, activity pulse, compass, megaphone, handshake, trending up) au lieu des icônes génériques actuelles (home, calendrier, loupe, bulle, bouclier, bar-chart),
So that la sidebar reflète visuellement la nature de chaque zone métier et reste cohérente avec la charte design du template approuvé.

## Contexte

La sidebar admin est configurée dans `aureak/apps/web/lib/admin/nav-config.ts` (cf. Epic 95.1 qui l'a déplacée hors de `app/`). Les icônes actuelles sont des pictos génériques de `@aureak/ui` :

| Section | Actuelle | Template cible |
|---|---|---|
| Dashboard | `HomeIcon` (maison) | grille 4 carrés (LayoutGrid) |
| Activités | `CalendarDaysIcon` | pulse/activity |
| Méthodologie | `BookOpenIcon` | book | ✅ déjà bon |
| Académie | `UsersIcon` | users | ✅ déjà bon |
| Événements | `TargetIcon` (cible) | calendar |
| Prospection | `SearchIcon` (loupe) | compass |
| Marketing | `MessageSquareIcon` (bulle) | megaphone |
| Partenariat | `ShieldIcon` (bouclier) | handshake |
| Performance | `BarChartIcon` | trending (courbe ↗) |
| Administration | `UserIcon` | user | ✅ acceptable |

**5 nouveaux composants `@aureak/ui` à créer** : `ActivityIcon`, `CompassIcon`, `MegaphoneIcon`, `HandshakeIcon`, `TrendingUpIcon`, `LayoutGridIcon`.
**2 composants existants à réutiliser** : `CalendarIcon`, `BookOpenIcon`, `UsersIcon`, `UserIcon` restent.

Les SVG paths sont fournis par `_bmad-output/design-references/_template_extracted/icons.jsx` (Lucide stroke 1.7).

## Acceptance Criteria

1. **6 nouveaux composants icônes** créés dans `aureak/packages/ui/src/icons/` :
   - `ActivityIcon.tsx` — path `M3 12h3l3-9 4 18 3-9h5`
   - `CompassIcon.tsx` — circle cx="12" cy="12" r="10" + path `m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z`
   - `MegaphoneIcon.tsx` — path `m3 11 18-5v12L3 13v-2Z` + `M11.6 16.8a3 3 0 1 1-5.8-1.6`
   - `HandshakeIcon.tsx` — paths du template
   - `TrendingUpIcon.tsx` — path `M22 7 13.5 15.5 8.5 10.5 2 17` + `M16 7h6v6`
   - `LayoutGridIcon.tsx` — 4 rects inégaux du template (3,3,7,9) (14,3,7,5) (14,12,7,9) (3,16,7,5)

2. **Signature conforme** aux icônes existantes : props `NavIconProps` (`color`, `size = 16`, `strokeWidth = 1.5` par défaut côté package ; le template montre 1.7 — aligner la stroke par défaut à **1.5** pour cohérence package, laisser le consommateur override si besoin).

3. **Export dans `aureak/packages/ui/src/icons/index.ts`** : ajouter les 6 exports à la liste existante.

4. **Mise à jour `aureak/apps/web/lib/admin/nav-config.ts`** : remplacer les imports et les Icon selon le mapping ci-dessus. Résultat attendu :
   ```typescript
   import {
     LayoutGridIcon, ActivityIcon, BookOpenIcon,
     UsersIcon, CalendarIcon, CompassIcon,
     MegaphoneIcon, HandshakeIcon, TrendingUpIcon, UserIcon,
   } from '@aureak/ui'

   export const SECTION_TO_NAV: Record<SectionKey, Omit<NavItem, 'sectionKey'>> = {
     dashboard   : { label: 'Dashboard',      href: '/dashboard',            Icon: LayoutGridIcon },
     activites   : { label: 'Activités',      href: '/activites',            Icon: ActivityIcon },
     methodologie: { label: 'Méthodologie',   href: '/methodologie/seances', Icon: BookOpenIcon },
     academie    : { label: 'Académie',       href: '/academie',             Icon: UsersIcon },
     evenements  : { label: 'Événements',     href: '/evenements',           Icon: CalendarIcon },
     prospection : { label: 'Prospection',    href: '/prospection',          Icon: CompassIcon },
     marketing   : { label: 'Marketing',      href: '/marketing',            Icon: MegaphoneIcon },
     partenariat : { label: 'Partenariat',    href: '/partenariat',          Icon: HandshakeIcon },
     performances: { label: 'Performance',    href: '/performance',          Icon: TrendingUpIcon },
     admin       : { label: 'Administration', href: '/administration',       Icon: UserIcon },
   }
   ```
   ⚠️ Les `href` de `prospection`, `performances`, `admin` changent aussi mais ces migrations sont traitées par 97.4/98.1/99.2 — dans 97.1, **uniquement changer les Icon**, laisser les href actuels (`/developpement/prospection`, `/analytics`, `/users`).

5. **Visuel conforme** : les SVG rendus respectent le template (taille 18-20px en sidebar, strokeWidth 1.7 visible, currentColor hérité pour état actif/hover).

6. **Conformité CLAUDE.md** :
   - Tokens `@aureak/theme` uniquement (pas de hex hardcodé dans les SVG — stroke = `currentColor`).
   - `cd aureak && npx tsc --noEmit` EXIT 0.
   - Ne pas toucher aux tests existants (les icônes sont du rendu pur SVG).

7. **Non-goals explicites** :
   - **Pas de migration URL** dans cette story (97.4, 98.1, 99.2 s'en chargent).
   - **Pas de changement palette sidebar** (97.2 s'en charge).
   - **Pas de modification du composant `NavItem`** ni de la structure de la sidebar.

8. **Test Playwright** : reload `/dashboard`, screenshot sidebar, vérifier visuellement que les 10 icônes ont été mises à jour. Console sans erreur.

## Tasks / Subtasks

- [ ] **T1 — Créer les 6 nouveaux composants icônes** (AC #1, #2)
  - [ ] `ActivityIcon.tsx`
  - [ ] `CompassIcon.tsx`
  - [ ] `MegaphoneIcon.tsx`
  - [ ] `HandshakeIcon.tsx`
  - [ ] `TrendingUpIcon.tsx`
  - [ ] `LayoutGridIcon.tsx`
  - [ ] Utiliser `LockIcon.tsx` ou `TargetIcon.tsx` comme template de structure

- [ ] **T2 — Exports barrel** (AC #3)
  - [ ] Ajouter les 6 exports dans `aureak/packages/ui/src/icons/index.ts`

- [ ] **T3 — Remplacer les imports/Icon dans nav-config** (AC #4)
  - [ ] Modifier imports et mapping `SECTION_TO_NAV`
  - [ ] **Ne pas toucher** aux `href`

- [ ] **T4 — QA visuel** (AC #5, #8)
  - [ ] `npx tsc --noEmit` EXIT 0
  - [ ] Dev server + Playwright : navigate `/dashboard`, screenshot sidebar complète
  - [ ] Vérifier console zéro erreur

## Dev Notes

### Source des paths SVG

Les paths exacts sont dans `_bmad-output/design-references/_template_extracted/icons.jsx` lignes 8-16. Structure de chaque icône :
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
  {paths}
</svg>
```

Note : le template utilise `strokeWidth=1.7`, mais `@aureak/ui` utilise `1.5` par défaut pour cohérence. Garder `1.5` en default prop.

### Structure d'un fichier icône

Pattern existant (ex. `TargetIcon.tsx`) :
```tsx
import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import type { NavIconProps } from './types'

export function ActivityIcon({ color, size = 16, strokeWidth = 1.5 }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12h3l3-9 4 18 3-9h5"
        stroke={color ?? 'currentColor'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
```

### Pourquoi ne pas réutiliser GridIcon pour Dashboard

`GridIcon` actuel (`packages/ui/src/icons/GridIcon.tsx`) est probablement un motif "grille régulière" (9 carrés) — à vérifier. Le template Dashboard utilise un motif **asymétrique** (4 rectangles inégaux) de Lucide `LayoutGrid`. Créer un nouveau composant `LayoutGridIcon` plutôt que risquer un visuel incorrect.

### References

- Template icônes source : `_bmad-output/design-references/_template_extracted/icons.jsx`
- Config sidebar : `aureak/apps/web/lib/admin/nav-config.ts:50-61`
- Package icônes : `aureak/packages/ui/src/icons/`
- Types : `aureak/packages/ui/src/icons/types.ts` (NavIconProps)
