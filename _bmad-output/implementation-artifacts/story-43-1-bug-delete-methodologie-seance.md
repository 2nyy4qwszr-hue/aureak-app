# Story 43.1 : BUG — Impossible de supprimer un entraînement pédagogique

Status: ready-for-dev

## Story

En tant qu'admin,
je veux pouvoir supprimer un entraînement pédagogique que j'ai créé,
afin de nettoyer les entraînements erronés ou obsolètes.

## Acceptance Criteria

1. Un bouton "Supprimer" est présent sur chaque card d'entraînement dans la liste `methodologie/seances/`
2. Le clic déclenche un `ConfirmDialog` : "Supprimer cet entraînement ? Cette action est irréversible."
3. Après confirmation, l'entraînement est supprimé via l'API et retiré de la liste sans rechargement complet (optimistic update)
4. Un toast succès/erreur est affiché
5. Soft-delete : `deleted_at` mis à jour, pas de DELETE physique
6. Le bouton supprimer est absent si l'entraînement est associé à une séance terrain (protection d'intégrité)

## Technical Tasks

- [ ] Lire `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` entièrement
- [ ] Vérifier `aureak/packages/api-client/src/methodology.ts` — fonction `deleteMethodologySession` existe ?
- [ ] Si absente : ajouter `softDeleteMethodologySession(id)` dans `methodology.ts` (UPDATE `deleted_at = NOW()`)
- [ ] Ajouter bouton supprimer sur chaque card avec `ConfirmDialog` (déjà dans `@aureak/ui`)
- [ ] Optimistic update : filtrer l'item supprimé du state local immédiatement
- [ ] Toast : `useToast()` depuis `ToastContext`
- [ ] try/finally obligatoire sur le setter de chargement
- [ ] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (modifier)
- `aureak/packages/api-client/src/methodology.ts` (modifier si fonction manquante)

## Dependencies

- `ConfirmDialog` — ✅ disponible dans `@aureak/ui`
- `useToast` — ✅ disponible dans `ToastContext`
