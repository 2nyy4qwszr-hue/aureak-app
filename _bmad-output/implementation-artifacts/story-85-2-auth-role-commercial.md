# Story 85.2 : Auth — Rôle commercial + accès layout admin

Status: done

## Story

En tant que commercial,
je veux pouvoir me connecter et accéder à la section Développement/Prospection dans le layout admin,
afin de consulter l'annuaire clubs et logger mes contacts.

## Context

Le rôle `commercial` a été ajouté à l'enum `user_role` en Story 85.1. Cette story connecte ce rôle au layout admin existant pour que les commerciaux accèdent à `/developpement/prospection`.

Les commerciaux n'ont pas besoin de voir toute la sidebar admin — seulement l'item "Développement".

## Dependencies

- Story 85.1 (migration + types)

## Acceptance Criteria

1. `UserRole` dans `@aureak/types/enums.ts` inclut `'commercial'`
2. Le layout admin `(admin)/_layout.tsx` autorise le rôle `commercial` à accéder
3. Quand `role === 'commercial'`, la sidebar affiche UNIQUEMENT l'item "Développement" (pas Dashboard, Activités, Méthodologie, etc.)
4. Le commercial est redirigé vers `/developpement/prospection` après login (pas vers `/dashboard`)
5. Les routes admin autres que `/developpement/*` retournent une redirection ou un 403 pour le rôle `commercial`
6. L'admin continue de tout voir comme avant — aucune régression

## Tasks / Subtasks

- [ ] T1 — Ajouter `'commercial'` au type `UserRole` dans `enums.ts` si pas déjà fait
- [ ] T2 — Modifier `(admin)/_layout.tsx` : autoriser `commercial` dans le guard de rôle
- [ ] T3 — Filtrer la sidebar : si `role === 'commercial'` → afficher uniquement l'item Développement
- [ ] T4 — Redirection post-login : `commercial` → `/developpement/prospection`
- [ ] T5 — Guard sur les routes admin non-développement pour le rôle commercial
- [ ] T6 — Vérifier aucune régression admin/coach/parent

## Files to Modify

| Fichier | Action |
|---------|--------|
| `aureak/packages/types/src/enums.ts` | Vérifier `commercial` dans `UserRole` |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Guard rôle + sidebar filtrée + redirection |
| `aureak/apps/web/app/(auth)/login/page.tsx` (ou équivalent) | Redirection post-login commercial |

## Commit

`feat(epic-85): story 85.2 — auth rôle commercial + accès layout admin`
