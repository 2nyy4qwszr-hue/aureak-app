# Epic 100 — Mobile navigation (fondations)

Status: ready-for-dev

## Metadata

- **Epic ID** : 100
- **Nom** : Mobile navigation (fondations)
- **Scope** : Transformer la navigation admin (sidebar + nav secondaires + topbar + breadcrumbs) en expérience mobile-first — drawer, tabs scrollables horizontaux, topbar compact, breadcrumb minimal.
- **Prédécesseurs** : Epics 97/98/99 (template + structure nav admin). Le composant `<AdminPageHeader />` v2 est en place ainsi que les nav secondaires par zone.
- **Source** : Décision produit 2026-04-22 — mobile-first admin. Épic 100 = fondations de nav qui débloquent Epic 101-104.
- **Durée estimée** : ~5-7 jours dev (4 stories).
- **Out of scope** : refonte UI intra-pages (Epic 103), formulaires (Epic 102), data cards (Epic 101), perf/a11y (Epic 104).

## Objectif produit

1. **Sidebar accessible sur mobile** via un drawer slide-in avec overlay, déclenché par un burger icon topbar.
2. **Nav secondaires** (ActivitesHeader, MethodologieHeader, AcademieNavBar, etc.) deviennent **tabs scrollables horizontaux** sur mobile — plus d'overflow qui casse le layout.
3. **Topbar mobile** compact — logo Aureak + burger + search icon + profil avatar. Pas de breadcrumbs longs ni actions multiples.
4. **Breadcrumbs mobile** : afficher uniquement le dernier niveau + flèche retour (vers parent), pas toute la chaîne.

## Décisions par défaut (ajustables)

- **Breakpoints** : `< 640px` = mobile / `640-1024px` = tablette / `> 1024px` = desktop. Hérités du code existant.
- **Tablette** : comportement intermédiaire — sidebar collapsée en bande d'icônes (64px), nav secondaire pleine largeur scrollable, topbar desktop.
- **Pas de bundle natif mobile** dans cet epic — web uniquement (Expo Router web).

## Stories

- **[100.1](story-100-1-sidebar-drawer-mobile.md)** — Sidebar → drawer slide-in mobile + overlay (L)
- **[100.2](story-100-2-nav-secondaire-tabs-scrollables.md)** — Nav secondaires en tabs scrollables horizontaux (M)
- **[100.3](story-100-3-topbar-mobile-compact.md)** — Topbar mobile (burger + logo + search icon + profil) (M)
- **[100.4](story-100-4-breadcrumbs-mobile-compact.md)** — Breadcrumbs mobile compacts (dernier niveau + retour) (S)

## Ordre d'implémentation

1. **100.3** (topbar mobile — contient le burger qui déclenche le drawer)
2. **100.1** (drawer — le topbar appelle son open/close)
3. **100.2** (nav secondaires — dépend de layout topbar mobile pour le header)
4. **100.4** (breadcrumbs — dernier touch)

## Risques

| Risque | Mitigation |
|---|---|
| Expo Router ne supporte pas nativement un drawer slide-in | Utiliser `react-native-drawer-layout` ou implémentation custom RN (`Animated.View` + `Modal`) |
| Conflit z-index drawer ↔ modals existants | Définir une échelle z-index cohérente : drawer = 100, modal = 1000, tooltip = 2000 |
| Performance drawer 60 FPS mobile | Utiliser `useNativeDriver: true` pour toutes les animations + lazy content dans drawer |

## Références

- Sidebar actuelle : `aureak/apps/web/lib/admin/nav-config.ts` + layout rendu probablement dans `(admin)/_layout.tsx`
- Header actuel : `aureak/apps/web/components/admin/AdminTopbar.tsx`
- Nav secondaires : `components/admin/activites/ActivitesHeader.tsx`, `components/admin/methodologie/MethodologieHeader.tsx`, `components/admin/academie/AcademieNavBar.tsx`, `components/admin/prospection/ProspectionNavBar.tsx`, `components/admin/evenements/EvenementsHeader.tsx`
