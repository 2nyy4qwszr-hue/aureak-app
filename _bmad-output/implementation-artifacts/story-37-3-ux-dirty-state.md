# Story 37-3 — UX: indicateur dirty state

**Epic:** 37
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir un indicateur visuel "Modifications non sauvegardées" dans le header quand j'ai modifié un formulaire mais pas encore sauvegardé, afin d'éviter de perdre mes modifications par inadvertance.

## Acceptance Criteria
- [ ] AC1: Dans `clubs/[clubId]/page.tsx` mode édition, un badge "• Modifications non sauvegardées" est visible dans le header dès qu'un champ est modifié.
- [ ] AC2: Dans `children/[childId]/page.tsx` mode édition, le même badge apparaît dès qu'un champ est modifié.
- [ ] AC3: Le badge disparaît après une sauvegarde réussie ou après un "Annuler".
- [ ] AC4: Si l'utilisateur tente de naviguer (clic sur un lien sidebar) avec des modifications non sauvegardées, une alerte navigateur `window.confirm` s'affiche (ou `useBeforeUnload`).
- [ ] AC5: Le badge utilise `colors.accent.gold` ou `colors.status.warning` — aucune couleur hardcodée.

## Tasks
- [ ] Créer un hook `useDirtyState(initialValues: T, currentValues: T): boolean` dans `aureak/packages/business-logic/src/hooks/useDirtyState.ts` qui retourne `true` si les valeurs ont changé (comparaison JSON.stringify).
- [ ] Exporter `useDirtyState` depuis `@aureak/business-logic`.
- [ ] Dans `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` : utiliser `useDirtyState` avec les valeurs initiales du club et les valeurs courantes du form. Afficher badge "• Modifications non sauvegardées" dans le header si `isDirty && isEditing`.
- [ ] Dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` : même pattern.
- [ ] Ajouter `useBeforeUnload` (event listener `beforeunload`) dans chaque page quand `isDirty && isEditing` : `event.preventDefault(); event.returnValue = ''`.
- [ ] Retirer le `beforeunload` listener dans le cleanup (useEffect return) et après sauvegarde réussie.
- [ ] QA scan : vérifier que le badge est conditionnel (rendu nul si `!isDirty || !isEditing`).

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/business-logic/src/hooks/useDirtyState.ts` (créer)
  - `aureak/packages/business-logic/src/index.ts` (ajouter export)
  - `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- Implémentation `useDirtyState` simple :
  ```typescript
  export function useDirtyState<T>(initial: T, current: T): boolean {
    return JSON.stringify(initial) !== JSON.stringify(current)
  }
  ```
- Style du badge : `{ color: colors.status.warning, fontSize: 12, fontWeight: '500' }` — intégré dans le header existant, pas de composant séparé nécessaire
- `useBeforeUnload` ne fonctionne que sur web (Expo Router web) — wrapper dans `Platform.OS === 'web'` guard
- Pas de migration Supabase — feature purement frontend
