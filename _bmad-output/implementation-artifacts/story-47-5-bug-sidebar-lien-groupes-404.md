# Story 47.5 : BUG — Sidebar lien "Groupes" → 404

Status: done

## Story

En tant qu'admin Aureak naviguant dans la sidebar,
je veux que le lien "Groupes" navigue vers la bonne route,
afin d'accéder à la liste des groupes sans tomber sur une page 404.

## Acceptance Criteria

1. Le lien "Groupes" dans `(admin)/_layout.tsx` pointe vers `/(admin)/groups` (et non `/(admin)/groupes`)
2. La navigation depuis la sidebar vers la page groupes fonctionne sans 404
3. Aucune autre entrée de navigation ne régresse

## Tasks / Subtasks

- [x] T1 — Corriger le lien dans _layout.tsx
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/_layout.tsx` — identifier le nav item Groupes
  - [x] T1.2 — Remplacer `/(admin)/groupes` par `/(admin)/groups` (ou `href` équivalent)
  - [x] T1.3 — Vérifier que `aureak/apps/web/app/(admin)/groups/` existe bien

- [x] T2 — Validation
  - [x] T2.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T2.2 — Clic sur "Groupes" dans sidebar → navigation OK

## Dev Notes

Fix 1 ligne dans `_layout.tsx` — route `groupes` → `groups`.

## Dev Agent Record

- **Date** : 2026-04-04
- **Agent** : Amelia (Developer Agent BMAD)
- **Constat** : Le bug était déjà corrigé dans `_layout.tsx` — `href: '/groups'` (ligne 49) est correct. La route `aureak/apps/web/app/(admin)/groups/` existe (`index.tsx` + `[groupId]/`).
- **Action** : Aucune modification de code nécessaire. Vérification `tsc --noEmit` → 0 erreur.
- **Fichiers modifiés** : aucun (bug déjà résolu)

## File List

- `aureak/apps/web/app/(admin)/_layout.tsx` — vérifié, lien `/groups` correct (aucune modification)
