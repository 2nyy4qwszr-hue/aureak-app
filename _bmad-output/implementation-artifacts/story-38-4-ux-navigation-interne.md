# Story 38-4 — UX: historique navigation interne

**Epic:** 38
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux que les boutons "Retour" me ramènent toujours dans l'application admin contextualisée afin de ne jamais être redirigé hors de l'espace admin (browser back ou page externe).

## Acceptance Criteria
- [ ] AC1: Tous les appels `router.back()` dans les pages détail admin sont remplacés par `router.push(contextRoute)`
- [ ] AC2: Le mapping de routes contextuelles est centralisé (pas de strings dispersées)
- [ ] AC3: Mapping minimal couvert: clubs→/clubs, children→/children, seances→/seances, stages→/stages, methodologie→/methodologie
- [ ] AC4: Le bouton "Retour" reste visuellement identique (pas de changement UI)
- [ ] AC5: Si aucun mapping ne correspond au pathname courant, fallback sur `/` (dashboard admin)
- [ ] AC6: La fonction utilitaire est testable unitairement (pure function)

## Tasks
- [ ] Créer `aureak/apps/web/lib/navigation.ts` — exporter `getBackRoute(pathname: string): string` avec le mapping centralisé
- [ ] Remplacer `router.back()` par `router.push(getBackRoute(pathname))` dans `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
- [ ] Remplacer `router.back()` par `router.push(getBackRoute(pathname))` dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- [ ] Remplacer `router.back()` par `router.push(getBackRoute(pathname))` dans `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
- [ ] Remplacer `router.back()` par `router.push(getBackRoute(pathname))` dans `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`
- [ ] Grep sur `router.back()` dans `apps/web/` pour identifier tous les cas restants et les traiter
- [ ] Vérifier QA: aucun `router.back()` résiduel dans les pages admin détail

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/lib/navigation.ts` (nouveau)
  - `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
  - `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
  - `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`
- Utiliser `usePathname()` d'Expo Router pour obtenir le pathname courant
- Mapping à implémenter dans `getBackRoute`:
  ```
  /clubs/*       → /clubs
  /children/*    → /children
  /seances/*     → /seances
  /stages/*      → /stages
  /methodologie/* → /methodologie
  default        → /
  ```
- Pas de migration Supabase nécessaire
- Pas de nouveaux composants UI nécessaires
