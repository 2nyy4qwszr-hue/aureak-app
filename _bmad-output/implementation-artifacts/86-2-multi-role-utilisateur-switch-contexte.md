# Story 86.2 : Multi-rôle utilisateur + switch de contexte

Status: done

## Story

En tant qu'utilisateur ayant plusieurs rôles (ex: coach + commercial),
je veux pouvoir switcher de rôle depuis l'interface,
afin de voir le dashboard et les sections correspondant au rôle actif.

## Acceptance Criteria

1. Un utilisateur peut avoir plusieurs rôles assignés simultanément
2. Un composant de switch de rôle est visible dans le header/sidebar quand l'utilisateur a plus d'un rôle
3. Le switch change le rôle actif sans recharger la page
4. Le dashboard et la sidebar s'adaptent immédiatement au rôle sélectionné
5. Le rôle actif est persisté (localStorage ou DB) pour la prochaine connexion

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1)
  - [x] Créer table `user_roles` (user_id, role, is_primary, created_at)
  - [x] Migrer les rôles existants depuis `profiles.role` vers `user_roles`
  - [x] RLS policies sur `user_roles`
- [x] Task 2 — Types TypeScript (AC: #1)
  - [x] Créer type `UserRoleAssignment` dans `@aureak/types`
- [x] Task 3 — API client (AC: #1)
  - [x] `listUserRoles(userId)` dans `@aureak/api-client`
  - [x] `setActiveRole(userId, role)` dans `@aureak/api-client`
- [x] Task 4 — UI Switch rôle (AC: #2, #3, #4, #5)
  - [x] Composant `RoleSwitcher` dans `@aureak/ui`
  - [x] Intégrer dans le header de `_layout.tsx`
  - [x] Stocker le rôle actif dans Zustand + localStorage
  - [x] La sidebar et le dashboard réagissent au changement de rôle

## Dev Notes

- Actuellement le rôle est dans `profiles.role` (single value). Cette story crée un système many-to-many.
- La colonne `profiles.role` peut rester comme "rôle principal" pour backward compatibility
- Le switch ne doit pas déclencher de re-auth, juste un changement de contexte UI
- Pattern de référence : les apps Google (switch entre comptes)

### Project Structure Notes

- Migration dans `supabase/migrations/` (racine)
- Composant UI dans `aureak/packages/ui/src/`
- State dans le store Zustand existant (auth store)

### References

- [Source: aureak/packages/api-client/src/auth/ — auth store existant]
- [Brainstorming: idée #7 Architecture — Multi-rôle avec switch]

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Debug Log References

### Completion Notes List
- Migration 00149 crée la table `user_roles` avec contrainte UNIQUE(user_id, role), migration des rôles existants depuis `profiles`, et RLS complète
- Type `UserRoleAssignment` ajouté dans `@aureak/types/entities.ts`
- API client : `listUserRoles`, `setActiveRole`, `addUserRole`, `removeUserRole` dans `@aureak/api-client/src/admin/user-roles.ts`
- Zustand store `useAuthStore` étendu avec `availableRoles`, `switchRole`, et persistance localStorage (`aureak-active-role`)
- Composant `RoleSwitcher` dans `@aureak/ui/src/RoleSwitcher.tsx` — dropdown accessible avec labels et icônes par rôle
- Layout admin étendu pour supporter manager/marketeur en plus de admin/commercial
- `setActiveRole` synchronise aussi `profiles.user_role` pour backward compatibility

### File List
- `supabase/migrations/00149_create_user_roles.sql`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/api-client/src/admin/user-roles.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/packages/business-logic/src/stores/useAuthStore.ts`
- `aureak/packages/ui/src/RoleSwitcher.tsx`
- `aureak/packages/ui/src/index.ts`
- `aureak/apps/web/app/(admin)/_layout.tsx`
