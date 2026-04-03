# Story 35-4 — Skeleton: listes secondaires

**Epic:** 35
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux voir des lignes skeleton animées lors du chargement des listes secondaires afin de remplacer le texte "Chargement…" statique par un retour visuel cohérent.

## Acceptance Criteria
- [ ] AC1: Un composant `ListRowSkeleton` existe dans `@aureak/ui` avec N lignes grises animées (prop `count?: number`, défaut 5).
- [ ] AC2: Chaque ligne skeleton a une hauteur de 48px, un rayon de `radius.sm` et une largeur 100%.
- [ ] AC3: `groups/[groupId]/page.tsx` n'affiche plus "Chargement…" texte mais `<ListRowSkeleton />` pendant le chargement des membres/staff.
- [ ] AC4: `coaches/[coachId]/contact.tsx` n'affiche plus "Chargement…" texte mais `<ListRowSkeleton count={3} />`.
- [ ] AC5: L'animation utilise le même pattern pulse que `DetailSkeleton` (story 35-3) — réutiliser hook si extrait.
- [ ] AC6: Les couleurs utilisent uniquement des tokens `@aureak/theme`.

## Tasks
- [ ] Créer `aureak/packages/ui/src/ListRowSkeleton.tsx` — composant avec prop `count` (défaut 5), map sur N `Animated.View` rectangles (hauteur 48px, gap 8px, `borderRadius: radius.sm`, couleur `colors.border.light`), animation pulse partagée.
- [ ] Exporter `ListRowSkeleton` depuis `aureak/packages/ui/src/index.ts`.
- [ ] Remplacer les textes "Chargement…" dans `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` par `<ListRowSkeleton />`.
- [ ] Remplacer les textes "Chargement…" dans `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx` par `<ListRowSkeleton count={3} />`.
- [ ] QA scan : grep `Chargement` dans les 2 fichiers cibles pour confirmer suppression complète.

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/ListRowSkeleton.tsx` (créer)
  - `aureak/packages/ui/src/index.ts`
  - `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`
  - `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx`
- Dépendances story : story 35-3 (pour cohérence animation — si hook extrait, l'importer)
- Pattern : si story 35-3 a extrait un `usePulseAnimation` hook dans `@aureak/ui`, l'utiliser ici
- Sinon dupliquer le pattern Animated.loop inline dans le composant
