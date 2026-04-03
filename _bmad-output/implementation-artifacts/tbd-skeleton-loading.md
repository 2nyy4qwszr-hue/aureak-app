# Story: Skeleton loading sur pages lentes

**ID:** tbd-skeleton-loading
**Status:** done
**Source:** new
**Epic:** TBD — UI Performance

## Description
Créer des composants `SkeletonRow.tsx` et `SkeletonCard.tsx` dans `aureak/apps/web/components/`. Les utiliser dans les pages qui ont des listes pendant le chargement initial.

## Acceptance Criteria
- [x] `SkeletonRow.tsx` avec animation pulse CSS
- [x] `SkeletonCard.tsx` avec animation pulse CSS
- [x] `SkeletonTable` helper pour listes tabulaires
- [x] `SkeletonCardGrid` helper pour grilles
- [x] stages/index.tsx utilise `SkeletonCard` au chargement (remplace les views statiques)
- [x] children/index.tsx et clubs/page.tsx avaient déjà des skeletons — conservés

## Tasks
- [x] Créer `components/SkeletonRow.tsx`
- [x] Créer `components/SkeletonCard.tsx`
- [x] Utiliser dans stages/index.tsx
- [x] Commit

## Commit
`feat(admin): skeleton loading listes enfants/clubs/stages`
