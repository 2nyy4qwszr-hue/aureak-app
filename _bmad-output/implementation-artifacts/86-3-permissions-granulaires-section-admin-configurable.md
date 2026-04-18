# Story 86.3 : Permissions granulaires par section — admin-configurable

Status: done

## Story

En tant qu'admin,
je veux pouvoir configurer les sections accessibles par chaque utilisateur (au-delà du rôle par défaut),
afin de personnaliser les accès sans créer de nouveaux rôles.

## Acceptance Criteria

1. Chaque rôle a des sections par défaut :
   - Coach : Dashboard, Activités, Méthodologie
   - Commercial : Dashboard, Prospection
   - Scout : Dashboard, Prospection (gardiens)
   - Marketeur : Dashboard, Marketing
   - Manager : Dashboard, Prospection (entraîneurs), Académie
   - Admin : tout
2. L'admin peut ajouter/retirer des sections par utilisateur depuis sa fiche Académie
3. Les overrides individuels sont persistés en DB
4. Un toggle par section est disponible dans l'onglet "Accès" de la fiche utilisateur

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #3)
  - [x] Créer table `role_default_sections` (role, section_key, enabled)
  - [x] Créer table `user_section_overrides` (user_id, section_key, enabled, granted_by, created_at)
  - [x] Seed les sections par défaut par rôle
  - [x] RLS policies
- [x] Task 2 — Types TypeScript (AC: #1, #2)
  - [x] Créer enum `AppSection` dans `@aureak/types` (dashboard, activites, methodologie, academie, evenements, prospection, marketing, partenariat, performances)
  - [x] Créer type `UserSectionPermission`
- [x] Task 3 — API client (AC: #2, #3)
  - [x] `getUserPermissions(userId)` — retourne sections autorisées (défauts + overrides)
  - [x] `setUserSectionOverride(userId, sectionKey, enabled)` — admin uniquement
- [x] Task 4 — UI onglet Accès (AC: #4)
  - [x] Onglet "Accès" dans la fiche utilisateur (Académie > Coachs/Commerciaux/etc.)
  - [x] Toggle par section avec indicateur "par défaut" vs "personnalisé"
  - [x] Bouton "Réinitialiser aux défauts du rôle"

## Dev Notes

- Les sections par défaut sont le niveau 1, les overrides sont le niveau 2
- `getUserPermissions` = sections du rôle + overrides individuels appliqués
- La sidebar utilisera cette fonction pour se construire dynamiquement (story 86-4)

### Project Structure Notes

- Migration dans `supabase/migrations/` (racine)
- Types dans `aureak/packages/types/src/`
- API dans `aureak/packages/api-client/src/admin/`

### References

- [Brainstorming: idées #34, #35, #36 Architecture — Permissions granulaires]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List
- Migration 00150 : enum `app_section` + tables `role_default_sections` / `user_section_overrides` + seed + RLS
- Types : `AppSection`, `APP_SECTIONS`, `APP_SECTION_LABELS`, `RoleDefaultSection`, `UserSectionOverride`, `UserSectionPermission`
- API : `getUserPermissions`, `setUserSectionOverride`, `removeUserSectionOverride`, `resetUserSectionOverrides`
- UI : `SectionPermissionsPanel` composant reutilisable, integre dans fiche coach (onglet Acces) et fiche utilisateur generique

### File List
- `supabase/migrations/00150_create_section_permissions.sql`
- `aureak/packages/types/src/enums.ts`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/api-client/src/admin/section-permissions.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/apps/web/app/(admin)/_components/SectionPermissionsPanel.tsx`
- `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx`
- `aureak/apps/web/app/(admin)/users/[userId]/index.tsx`
