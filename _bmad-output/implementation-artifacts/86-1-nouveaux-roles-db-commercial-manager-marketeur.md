# Story 86.1 : Nouveaux rôles DB — commercial, manager, marketeur

Status: done

## Story

En tant qu'admin,
je veux que les rôles `commercial`, `manager` et `marketeur` existent dans la base de données,
afin de pouvoir assigner ces rôles aux membres de l'équipe et contrôler leurs accès.

## Acceptance Criteria

1. L'enum `user_role` contient les valeurs `commercial`, `manager`, `marketeur` en plus des valeurs existantes (`admin`, `coach`, `parent`, `child`, `club`)
2. Les RLS policies existantes continuent de fonctionner sans régression
3. Les types TypeScript dans `@aureak/types` reflètent les nouveaux rôles
4. Le profil utilisateur peut être créé avec l'un des nouveaux rôles

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #2)
  - [x] Créer migration `ALTER TYPE user_role ADD VALUE 'commercial'` — déjà fait en 00147
  - [x] Ajouter `'manager'` et `'marketeur'` à l'enum — migration 00148
  - [x] Vérifier que les RLS policies existantes ne sont pas cassées par les nouveaux rôles — OK, aucune whitelist fermée
- [x] Task 2 — Types TypeScript (AC: #3)
  - [x] Mettre à jour `UserRole` dans `@aureak/types/enums.ts` avec les 3 nouveaux rôles
  - [x] Mettre à jour les types associés si nécessaire — ROLE_LABELS UI mis à jour
- [x] Task 3 — API client (AC: #4)
  - [x] Vérifier que `createProfile` / `updateProfile` dans `@aureak/api-client` acceptent les nouveaux rôles — OK, role typé `string`
  - [x] Ajouter les nouveaux rôles dans les constantes/mappings existants — ROLE_LABELS + ROLE_VARIANTS + RoleFilter

## Dev Notes

- L'enum `user_role` actuel contient : `admin`, `coach`, `parent`, `child`, `club` (migration 00055)
- `ALTER TYPE ... ADD VALUE` n'est pas réversible dans PostgreSQL — c'est OK, ces rôles sont définitifs
- Les RLS policies existantes utilisent `auth.jwt()->>'role'` — vérifier qu'aucune policy ne fait de whitelist fermée

### Project Structure Notes

- Migration dans `supabase/migrations/` (racine, PAS `aureak/supabase/`)
- Types dans `aureak/packages/types/src/enums.ts`
- API dans `aureak/packages/api-client/src/`

### References

- [Source: supabase/migrations/ — enum user_role existant]
- [Source: aureak/packages/types/src/enums.ts — UserRole type]
- [Brainstorming: idée #6 Architecture — Nouveaux rôles DB]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
N/A

### Completion Notes List
- `commercial` already added in migration 00147 — only `manager` and `marketeur` needed in new migration
- RLS policies verified: no closed whitelist, all use equality checks (`= 'admin'`, `IN ('admin','coach')`) — new roles safely ignored
- API client `inviteUser` uses `role: string` — no type change needed
- UI ROLE_LABELS/ROLE_VARIANTS updated in users list + user detail pages

### File List
- `supabase/migrations/00148_add_roles_manager_marketeur.sql` (created)
- `aureak/packages/types/src/enums.ts` (modified — UserRole union)
- `aureak/apps/web/app/(admin)/users/index.tsx` (modified — RoleFilter, ROLE_LABELS, ROLE_VARIANTS)
- `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (modified — ROLE_LABELS)
