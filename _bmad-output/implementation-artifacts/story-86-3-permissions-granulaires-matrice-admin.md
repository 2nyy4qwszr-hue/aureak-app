# Story 86-3 — Permissions granulaires : matrice `section_permissions` + overrides + page admin

## Metadata

- **Epic** : 86 — Architecture Rôles & Permissions
- **Story** : 86-3
- **Status** : ready-for-dev
- **Priority** : P0 — Fondation (bloque 86-4 qui consomme `getEffectivePermissions`)
- **Type** : Feature / Infra
- **Estimated effort** : L (6–8h)
- **Dependencies** : 86-1 (enum user_role étendu)

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** définir dans une matrice visuelle quelles sections de l'app chaque rôle peut voir (avec possibilité d'overrides individuels par utilisateur),
**afin de** contrôler finement l'accès sans toucher au code à chaque ajustement (ex : donner exceptionnellement l'accès Marketing à un coach).

---

## Contexte

### Problème actuel

Dans `aureak/apps/web/app/(admin)/_layout.tsx`, la sidebar affiche les sections via un `NAV_GROUPS` statique : tous les utilisateurs connectés voient les mêmes entrées. Aucun mécanisme ne permet à un admin de décider que "les commerciaux voient Prospection mais pas Méthodologie".

### Solution

1. **Table `section_permissions` (défaut par rôle)** : `(role, section_key, access)` — définit ce que voit chaque rôle par défaut. Seeded avec des valeurs raisonnables pour les 8 rôles × 10 sections.
2. **Table `user_section_overrides` (overrides individuels)** : `(profile_id, section_key, access)` — permet de surcharger le défaut du rôle pour un utilisateur précis. `access` peut être `granted` ou `denied` (override explicite dans les deux sens).
3. **Fonction `getEffectivePermissions(profileId)`** : combine les deux tables pour retourner la liste finale des sections autorisées pour l'utilisateur.
4. **Page admin `/settings/permissions`** : matrice éditable rôles × sections (toggles), + sous-onglet "Overrides" pour éditer les exceptions par utilisateur.

### Sections disponibles (10)

`dashboard`, `activites`, `methodologie`, `academie`, `evenements`, `prospection`, `marketing`, `partenariat`, `performances`, `admin`

Cette liste sera la **source de vérité** pour la sidebar dynamique de 86-4.

---

## Acceptance Criteria

1. **AC1** — La migration `00150_create_permissions_tables.sql` crée :
   - Enum `section_key` = `dashboard | activites | methodologie | academie | evenements | prospection | marketing | partenariat | performances | admin`
   - Enum `permission_access` = `granted | denied`
   - Table `section_permissions (role user_role, section_key section_key, access permission_access, granted boolean DEFAULT true, PK (role, section_key))`
   - Table `user_section_overrides (profile_id UUID, section_key section_key, access permission_access, granted_at, granted_by, deleted_at, PK (profile_id, section_key))`
   - Les deux avec RLS `admin only` pour écriture, SELECT ouvert aux auth users (besoin UI sidebar).
2. **AC2** — La migration seed la matrice par défaut pour les 8 rôles (voir Dev Notes section "Seed").
3. **AC3** — La fonction SQL (ou API client TS) `getEffectivePermissions(profileId)` retourne une `Record<section_key, boolean>` calculé ainsi :
   - Pour chaque `section_key`, prendre l'override utilisateur (si non-null et non-deleted), sinon le défaut du **rôle actif** (pas `profiles.role` — le rôle actif du `useCurrentRole()`).
4. **AC4** — Une page admin `/(admin)/settings/permissions/page.tsx` affiche une matrice **rôles en colonnes × sections en lignes** avec toggles granted/denied. Sauvegarde immédiate par clic (optimistic update + try/finally).
5. **AC5** — Sur la même page, un onglet "Overrides individuels" : sélecteur utilisateur (search by name) → affichage de ses overrides actuels → ajout/suppression via toggle par section.
6. **AC6** — La page est accessible uniquement si `role === 'admin'` (redirect sinon) — pattern existant dans l'app.
7. **AC7** — Les fonctions API dans `@aureak/api-client/src/auth/section-permissions.ts` :
   - `listRolePermissions()` → `{ role: UserRole; sectionKey: string; granted: boolean }[]`
   - `updateRolePermission(role, sectionKey, granted)` → `void`
   - `listUserOverrides(profileId)` → `{ sectionKey: string; granted: boolean }[]`
   - `upsertUserOverride(profileId, sectionKey, granted)` → `void`
   - `deleteUserOverride(profileId, sectionKey)` → `void` (soft-delete)
   - `getEffectivePermissions(profileId, activeRole)` → `Record<SectionKey, boolean>`
8. **AC8** — Le changement d'une case de la matrice déclenche une refetch TanStack Query des permissions côté sidebar ; aucune page reload nécessaire pour voir les effets.
9. **AC9** — Aucune modification des autres policies RLS ou des routes existantes dans cette story — scope strictement sur les 2 nouvelles tables, l'API, et la page admin.

---

## Tasks / Subtasks

- [ ] **T1 — Migration SQL** (AC1, AC2)
  - [ ] T1.1 — Créer `supabase/migrations/00150_create_permissions_tables.sql` avec enums + 2 tables + RLS + seed

- [ ] **T2 — Types TS** (AC7)
  - [ ] T2.1 — Ajouter enum `SectionKey`, `PermissionAccess` dans `aureak/packages/types/src/enums.ts`
  - [ ] T2.2 — Ajouter types `RolePermission`, `UserSectionOverride`, `EffectivePermissions` dans `aureak/packages/types/src/entities.ts`

- [ ] **T3 — API client** (AC7)
  - [ ] T3.1 — Créer `aureak/packages/api-client/src/auth/section-permissions.ts` avec les 6 fonctions listées
  - [ ] T3.2 — `getEffectivePermissions` compose les deux tables en un seul `Record<SectionKey, boolean>`
  - [ ] T3.3 — Exporter depuis `@aureak/api-client/index.ts`

- [ ] **T4 — Page admin matrice** (AC4, AC6)
  - [ ] T4.1 — Créer `aureak/apps/web/app/(admin)/settings/permissions/page.tsx`
  - [ ] T4.2 — Créer `aureak/apps/web/app/(admin)/settings/permissions/index.tsx` (re-export de `./page`)
  - [ ] T4.3 — Garde d'accès : redirect `/dashboard` si `role !== 'admin'`
  - [ ] T4.4 — Composant `PermissionMatrix` local : grille 8 rôles × 10 sections avec toggles
  - [ ] T4.5 — Composant `UserOverridesPanel` local : search user + liste overrides éditables

- [ ] **T5 — Intégration nav admin** (AC4)
  - [ ] T5.1 — Ajouter `{ label: 'Permissions', href: '/settings/permissions', Icon: LockIcon }` à `ADMIN_ITEMS` dans `_layout.tsx`

- [ ] **T6 — QA + validation** (AC tous)
  - [ ] T6.1 — Try/finally sur tous les setters de loading (toggle permission)
  - [ ] T6.2 — Console guards partout
  - [ ] T6.3 — Test Playwright : matrice visible, toggle un rôle×section → refetch OK
  - [ ] T6.4 — Test manuel : en tant qu'admin, retirer `prospection` au rôle `commercial` → un commercial ne voit plus la section (à vérifier après 86-4 implémentée, à défaut noter comme TODO post-86-4)

---

## Dev Notes

### ⚠️ Contraintes Stack

- **Accès Supabase UNIQUEMENT via `@aureak/api-client`**
- **Tokens `@aureak/theme` uniquement** — pas de hex hardcodé
- **Try/finally obligatoire** sur setters de chargement
- **Soft-delete uniquement** sur `user_section_overrides` (pas sur `section_permissions` : c'est une table de config, l'UPDATE suffit)

---

### T1 — Migration

**Fichier : `supabase/migrations/00150_create_permissions_tables.sql`**

```sql
-- Story 86-3 — Epic 86 Architecture Rôles & Permissions
-- Tables permissions : section_permissions (défaut par rôle) + user_section_overrides (individuel)

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE section_key AS ENUM (
    'dashboard','activites','methodologie','academie',
    'evenements','prospection','marketing','partenariat',
    'performances','admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE permission_access AS ENUM ('granted','denied');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Table defaults par rôle
CREATE TABLE IF NOT EXISTS section_permissions (
  role         user_role   NOT NULL,
  section_key  section_key NOT NULL,
  granted      BOOLEAN     NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID        REFERENCES profiles(id),
  PRIMARY KEY (role, section_key)
);

ALTER TABLE section_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY section_permissions_read_all
  ON section_permissions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY section_permissions_admin_write
  ON section_permissions FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- 3. Table overrides individuels
CREATE TABLE IF NOT EXISTS user_section_overrides (
  profile_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_key  section_key NOT NULL,
  granted      BOOLEAN     NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by   UUID        REFERENCES profiles(id),
  deleted_at   TIMESTAMPTZ,
  PRIMARY KEY (profile_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_user_overrides_profile
  ON user_section_overrides(profile_id)
  WHERE deleted_at IS NULL;

ALTER TABLE user_section_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_overrides_self_or_admin_read
  ON user_section_overrides FOR SELECT
  USING (profile_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY user_overrides_admin_write
  ON user_section_overrides FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- 4. Seed défaut par rôle (matrice initiale)
INSERT INTO section_permissions (role, section_key, granted) VALUES
  -- admin : tout
  ('admin','dashboard',true),('admin','activites',true),('admin','methodologie',true),
  ('admin','academie',true),('admin','evenements',true),('admin','prospection',true),
  ('admin','marketing',true),('admin','partenariat',true),('admin','performances',true),
  ('admin','admin',true),
  -- coach : opérationnel
  ('coach','dashboard',true),('coach','activites',true),('coach','methodologie',true),
  ('coach','academie',true),('coach','evenements',true),('coach','prospection',false),
  ('coach','marketing',false),('coach','partenariat',false),('coach','performances',true),
  ('coach','admin',false),
  -- parent : lecture enfant (rien de l'admin panel)
  ('parent','dashboard',true),('parent','activites',false),('parent','methodologie',false),
  ('parent','academie',false),('parent','evenements',false),('parent','prospection',false),
  ('parent','marketing',false),('parent','partenariat',false),('parent','performances',false),
  ('parent','admin',false),
  -- child : rien dans l'admin panel
  ('child','dashboard',false),('child','activites',false),('child','methodologie',false),
  ('child','academie',false),('child','evenements',false),('child','prospection',false),
  ('child','marketing',false),('child','partenariat',false),('child','performances',false),
  ('child','admin',false),
  -- club : portail dédié, rien de l'admin panel
  ('club','dashboard',true),('club','activites',false),('club','methodologie',false),
  ('club','academie',false),('club','evenements',false),('club','prospection',false),
  ('club','marketing',false),('club','partenariat',true),('club','performances',true),
  ('club','admin',false),
  -- commercial : prospection + académie (fiches clubs)
  ('commercial','dashboard',true),('commercial','activites',false),('commercial','methodologie',false),
  ('commercial','academie',true),('commercial','evenements',false),('commercial','prospection',true),
  ('commercial','marketing',false),('commercial','partenariat',true),('commercial','performances',false),
  ('commercial','admin',false),
  -- manager : vue opérationnelle étendue
  ('manager','dashboard',true),('manager','activites',true),('manager','methodologie',false),
  ('manager','academie',true),('manager','evenements',true),('manager','prospection',false),
  ('manager','marketing',false),('manager','partenariat',true),('manager','performances',true),
  ('manager','admin',false),
  -- marketeur : marketing + médiathèque
  ('marketeur','dashboard',true),('marketeur','activites',false),('marketeur','methodologie',false),
  ('marketeur','academie',true),('marketeur','evenements',false),('marketeur','prospection',false),
  ('marketeur','marketing',true),('marketeur','partenariat',false),('marketeur','performances',false),
  ('marketeur','admin',false)
ON CONFLICT (role, section_key) DO NOTHING;
```

---

### T2 — Types TS

**Fichier : `aureak/packages/types/src/enums.ts` (ajout en fin de fichier)**

```typescript
/** Sections de navigation — miroir de l'enum `section_key` (Story 86-3) */
export type SectionKey =
  | 'dashboard' | 'activites' | 'methodologie' | 'academie'
  | 'evenements' | 'prospection' | 'marketing' | 'partenariat'
  | 'performances' | 'admin'

export const SECTION_KEYS: SectionKey[] = [
  'dashboard', 'activites', 'methodologie', 'academie',
  'evenements', 'prospection', 'marketing', 'partenariat',
  'performances', 'admin',
]
```

**Fichier : `aureak/packages/types/src/entities.ts` (ajout)**

```typescript
export interface RolePermission {
  role        : UserRole
  sectionKey  : SectionKey
  granted     : boolean
  updatedAt   : string
  updatedBy   : string | null
}

export interface UserSectionOverride {
  profileId   : string
  sectionKey  : SectionKey
  granted     : boolean
  grantedAt   : string
  grantedBy   : string | null
  deletedAt   : string | null
}

export type EffectivePermissions = Record<SectionKey, boolean>
```

---

### T3 — API client

**Fichier : `aureak/packages/api-client/src/auth/section-permissions.ts`**

```typescript
import { supabase } from '../supabase'
import type { SectionKey, UserRole, EffectivePermissions, RolePermission, UserSectionOverride } from '@aureak/types'
import { SECTION_KEYS } from '@aureak/types'

export async function listRolePermissions(): Promise<RolePermission[]> { /* select all */ }
export async function updateRolePermission(role: UserRole, sectionKey: SectionKey, granted: boolean): Promise<void> { /* upsert */ }
export async function listUserOverrides(profileId: string): Promise<UserSectionOverride[]> { /* filter deleted_at is null */ }
export async function upsertUserOverride(profileId: string, sectionKey: SectionKey, granted: boolean): Promise<void> { /* upsert with onConflict */ }
export async function deleteUserOverride(profileId: string, sectionKey: SectionKey): Promise<void> { /* soft-delete */ }

export async function getEffectivePermissions(
  profileId: string,
  activeRole: UserRole,
): Promise<EffectivePermissions> {
  // 1. fetch defaults du rôle actif
  const { data: defaults } = await supabase
    .from('section_permissions')
    .select('section_key, granted')
    .eq('role', activeRole)
  // 2. fetch overrides de l'utilisateur
  const { data: overrides } = await supabase
    .from('user_section_overrides')
    .select('section_key, granted')
    .eq('profile_id', profileId)
    .is('deleted_at', null)

  const result = Object.fromEntries(SECTION_KEYS.map(k => [k, false])) as EffectivePermissions
  ;(defaults ?? []).forEach(r => { result[r.section_key as SectionKey] = r.granted })
  ;(overrides ?? []).forEach(r => { result[r.section_key as SectionKey] = r.granted })
  return result
}
```

Chaque fonction : console guard, pas de `catch(() => {})`.

---

### T4 — Page admin

**Fichier : `aureak/apps/web/app/(admin)/settings/permissions/page.tsx`**

Structure :
- Hook d'auth : redirect si `role !== 'admin'`
- Tabs : "Matrice par rôle" | "Overrides individuels"
- Matrice : `View` avec flexDirection row, une colonne par rôle (8), scrollable horizontal. Une ligne par section (10). Case = `Pressable` avec `backgroundColor` conditionnel (`colors.status.present` si granted, `colors.status.absent` sinon).
- Overrides panel : `Input` search user → liste des résultats → sélection → liste des 10 sections avec toggle + état actuel (default du rôle vs. override).

**Fichier : `aureak/apps/web/app/(admin)/settings/permissions/index.tsx`**

```tsx
export { default } from './page'
```

---

### T5 — Intégration nav admin

**Fichier : `aureak/apps/web/app/(admin)/_layout.tsx` ligne 137 (ADMIN_ITEMS)**

Ajouter après `{ label: 'Permissions grades', ... }` :

```typescript
{ label: 'Permissions', href: '/settings/permissions', Icon: LockIcon },
```

---

### Design / Tokens

**Type design** : `polish` (pas de PNG — matrice simple, guidée par tokens)

```typescript
// Case granted
backgroundColor : colors.status.present  // vert doux
color           : colors.text.onPresent

// Case denied
backgroundColor : colors.status.absent
color           : colors.text.onAbsent

// En-tête rôle
fontFamily      : 'Montserrat'
fontWeight      : '600'
fontSize        : 12
textTransform   : 'uppercase'
color           : colors.text.secondary
```

Principes :
- Compact, scannable en un coup d'œil
- Feedback immédiat au clic (optimistic + spinner discret)
- Pas de confirmation modal — un toggle se défait d'un clic

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00150_create_permissions_tables.sql` | Créer | 2 enums + 2 tables + RLS + seed |
| `aureak/packages/types/src/enums.ts` | Modifier | Ajouter `SectionKey`, `SECTION_KEYS` |
| `aureak/packages/types/src/entities.ts` | Modifier | Ajouter 3 types |
| `aureak/packages/api-client/src/auth/section-permissions.ts` | Créer | 6 fonctions |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exporter les 6 fonctions |
| `aureak/apps/web/app/(admin)/settings/permissions/page.tsx` | Créer | Matrice + overrides panel |
| `aureak/apps/web/app/(admin)/settings/permissions/index.tsx` | Créer | Re-export `./page` |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | Ajouter entrée ADMIN_ITEMS |

---

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/_layout.tsx` NAV_GROUPS — pas de sidebar dynamique ici (story 86-4)
- Toute policy RLS existante
- Les tables `profiles`, `profile_roles`

---

### Dépendances à protéger

- `getEffectivePermissions` est la fonction que la story 86-4 va appeler depuis `_layout.tsx` — ne pas modifier sa signature
- `SECTION_KEYS` est utilisée par 86-4 pour générer la sidebar — ordre stable obligatoire

---

### Références

- Pattern table + enum + RLS : `supabase/migrations/00147_create_commercial_contacts.sql`
- Pattern page admin gated : `aureak/apps/web/app/(admin)/grade-permissions/page.tsx` (page existante similaire)
- Tokens couleur status : `aureak/packages/theme/src/tokens.ts` (`colors.status.*`)

---

### Multi-tenant

`section_permissions` est **globale** (config plateforme, pas par tenant). `user_section_overrides` est implicitement multi-tenant via `profiles.tenant_id`. Les policies RLS s'appuient sur `auth.uid()` et `current_user_role()` — pas de `tenantId` en paramètre.

---

## Commit

```
feat(epic-86): story 86-3 — matrice permissions rôles × sections + overrides
```

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
