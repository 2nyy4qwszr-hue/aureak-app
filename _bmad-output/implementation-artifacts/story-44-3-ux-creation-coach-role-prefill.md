# Story 44.3 : UX — Création coach : rôle pré-sélectionné, étape skippée

Status: done

## Story

En tant qu'admin,
je veux que le formulaire de création d'utilisateur pré-sélectionne le rôle "coach" quand je viens de la page coachs,
afin d'éviter une étape inutile et de créer un coach en moins de clics.

## Acceptance Criteria

1. Le bouton "Nouveau coach" sur `/coaches` navigue vers `/users/new?role=coach`
2. Sur `/users/new`, si le param URL `role=coach` est présent, l'étape 1 (sélecteur de rôle) est skippée — on arrive directement à l'étape 2 (identité)
3. Le rôle est pré-sélectionné à "coach" et non modifiable dans ce cas (ou le sélecteur reste visible mais pré-coché)
4. Le comportement sans param URL reste identique (sélecteur de rôle visible, défaut = child)
5. Même logique applicable depuis `/children` → `?role=child` (bonus, si trivial)

## Technical Tasks

- [x] Lire `aureak/apps/web/app/(admin)/coaches/index.tsx` — trouver le bouton "Nouveau coach" ou "Créer"
- [x] Modifier le `router.push('/users/new')` → `router.push('/users/new?role=coach')`
- [x] Lire `aureau/apps/web/app/(admin)/users/new.tsx` lignes 70–100
- [x] Ajouter `useLocalSearchParams` pour lire `role` depuis l'URL
- [x] Si `role` fourni : `useState<ProfileRole>(params.role as ProfileRole ?? 'child')` et `const skipRoleStep = !!params.role`
- [x] Conditionner le rendu de l'étape 2 (rôle) sur `!skipRoleStep`
- [x] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/coaches/index.tsx` (modifier — URL avec ?role=coach)
- `aureak/apps/web/app/(admin)/users/new.tsx` (modifier — lire param + skip étape)

## Dependencies

Aucune.
