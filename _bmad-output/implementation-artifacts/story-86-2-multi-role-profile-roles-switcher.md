# Story 86-2 — Multi-rôle : table `profile_roles` + API + composant `RoleSwitcher`

## Metadata

- **Epic** : 86 — Architecture Rôles & Permissions
- **Story** : 86-2
- **Status** : done
- **Priority** : P0 — Fondation (bloque 86-4 et toutes les features multi-rôle)
- **Type** : Feature / Infra
- **Estimated effort** : L (6–8h)
- **Dependencies** : 86-1 (rôles `manager`, `marketeur` en DB)

---

## User Story

**En tant qu'** utilisateur Aureak ayant plusieurs responsabilités (ex : un commercial qui est aussi coach),
**je veux** pouvoir passer d'un rôle à l'autre via un sélecteur "Changer de casquette" dans la sidebar,
**afin de** voir l'interface et les permissions correspondant au contexte dans lequel je travaille à ce moment.

---

## Contexte

### Problème actuel

Le champ `profiles.role` est **single-valued** (une seule valeur de l'enum `user_role`). Un utilisateur qui cumule plusieurs responsabilités (ex : coach + commercial) ne peut avoir qu'un seul rôle actif, ce qui oblige à dupliquer les comptes ou à "élire" un rôle principal.

### Solution retenue

Ajouter une table `profile_roles` (relation N-N entre `profiles` et les valeurs de `user_role`), tout en conservant `profiles.role` comme **rôle principal/par défaut** pour la rétrocompatibilité RLS. Le rôle "actif" à un instant T est stocké côté client (`localStorage`) et exposé via un hook React. Le changement de rôle actif ne nécessite **aucun appel serveur** — simple persistance locale + reload.

### Rétrocompatibilité

- `profiles.role` reste la source de vérité pour toutes les policies RLS existantes (elles interrogent `current_user_role()` qui lit `profiles.role`).
- `profile_roles` ne remplace rien — elle **étend** : un utilisateur a toujours son rôle principal + un ensemble de rôles additionnels.
- À la création d'un profil, `profile_roles` est peuplée automatiquement avec `profiles.role` via un trigger (ou à la première connexion — cf. AC6).

---

## Acceptance Criteria

1. **AC1** — La migration `00149_create_profile_roles.sql` crée la table `profile_roles (profile_id UUID FK profiles, role user_role, granted_at timestamptz, granted_by UUID FK profiles, deleted_at timestamptz)` avec PK composite `(profile_id, role)` et RLS activé.
2. **AC2** — Policies RLS :
   - SELECT : même tenant
   - INSERT/UPDATE/DELETE : `current_user_role() = 'admin'` uniquement
   - L'utilisateur lui-même peut SELECT ses propres entrées (pour le switcher)
3. **AC3** — Un trigger `on_profile_created` peuple `profile_roles` avec `(NEW.id, NEW.role, now(), NEW.id, NULL)` à chaque `INSERT` sur `profiles`. Les profils existants sont backfillés par le même script de migration.
4. **AC4** — Les fonctions API `@aureak/api-client/src/auth/profile-roles.ts` exposent :
   - `listUserRoles(profileId: string): Promise<UserRole[]>` — rôles actifs (non soft-deleted)
   - `assignRoleToUser(profileId: string, role: UserRole): Promise<void>` — admin only
   - `revokeRoleFromUser(profileId: string, role: UserRole): Promise<void>` — soft-delete
5. **AC5** — Le hook `useAvailableRoles()` dans `@aureak/business-logic` (ou `aureak/apps/web/app/(admin)/hooks/`) retourne la liste des rôles de l'utilisateur connecté (via `listUserRoles(auth.uid)`), mise en cache par TanStack Query.
6. **AC6** — Le hook `useCurrentRole()` retourne le rôle actif persisté dans `localStorage['aureak_active_role']`, avec fallback sur `profiles.role` à la première connexion. Setter `setCurrentRole(role)` écrit dans `localStorage` puis `window.location.reload()`.
7. **AC7** — Le composant `RoleSwitcher` dans `@aureak/ui` affiche :
   - Un bouton `[ICON] Casquette : {rôle actuel}` cliquable
   - Au clic, dropdown listant les rôles disponibles de `useAvailableRoles()` avec le rôle actif mis en évidence
   - Sélection → `setCurrentRole(role)` → reload
   - Si `useAvailableRoles().length <= 1`, le switcher **ne s'affiche pas** (dégrade gracieusement)
8. **AC8** — Le switcher est intégré dans `aureak/apps/web/app/(admin)/_layout.tsx` en haut de sidebar (au-dessus du premier `NAV_GROUPS`), mais **l'adaptation réelle de la sidebar selon le rôle actif est faite en story 86-4** (dans cette story, le switcher change juste le `localStorage` et recharge).
9. **AC9** — Aucune régression : un utilisateur mono-rôle (ex : parent seul) ne voit pas le switcher, et la sidebar fonctionne comme avant.

---

## Tasks / Subtasks

- [x] **T1 — Migration SQL** (AC1, AC2, AC3)
  - [x] T1.1 — Créer `supabase/migrations/00149_create_profile_roles.sql` (table + trigger + backfill + RLS)

- [x] **T2 — Types TS** (AC4)
  - [x] T2.1 — Ajouter type `ProfileRole` dans `aureak/packages/types/src/entities.ts`

- [x] **T3 — API client** (AC4)
  - [x] T3.1 — Créer `aureak/packages/api-client/src/auth/profile-roles.ts` avec les 3 fonctions
  - [x] T3.2 — Exporter depuis `aureak/packages/api-client/src/index.ts`

- [x] **T4 — Hooks React** (AC5, AC6)
  - [x] T4.1 — Créer `aureak/apps/web/app/(admin)/hooks/useAvailableRoles.ts` (useState+useEffect wrapping `listUserRoles` — TanStack Query n'est pas installé dans apps/web)
  - [x] T4.2 — Créer `aureak/apps/web/app/(admin)/hooks/useCurrentRole.ts` (lecture localStorage + setter)

- [x] **T5 — Composant RoleSwitcher** (AC7)
  - [x] T5.1 — Créer `aureak/packages/ui/src/RoleSwitcher.tsx` (Pressable + dropdown, tokens @aureak/theme)
  - [x] T5.2 — Exporter depuis `aureak/packages/ui/src/index.ts`

- [x] **T6 — Intégration sidebar** (AC8, AC9)
  - [x] T6.1 — Modifier `aureak/apps/web/app/(admin)/_layout.tsx` : import `RoleSwitcher`, rendu en haut de la sidebar juste en-dessous du logo, au-dessus du premier `NAV_GROUPS[0]`
  - [x] T6.2 — Vérifier que le switcher n'apparaît pas si un seul rôle (via `availableRoles.length > 1`)

- [x] **T7 — QA + validation** (AC tous)
  - [x] T7.1 — Console guards dans `profile-roles.ts` (pattern `if (process.env.NODE_ENV !== 'production') console.error(...)`)
  - [x] T7.2 — Try/finally sur tout setter de loading dans les hooks
  - [ ] T7.3 — Test manuel : créer un profil avec 2 rôles (ex : admin + commercial) → switcher visible → clic → reload → rôle actif persisté (à valider par QA en environnement dev)

---

## Dev Notes

### ⚠️ Contraintes Stack

- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — les hooks lisent `listUserRoles`, jamais de `supabase.from(...)` direct dans apps/
- **Tokens `@aureak/theme` uniquement** pour le `RoleSwitcher`
- **Try/finally obligatoire** sur tout state setter de chargement
- **Pas d'appel serveur pour le switch actif** — uniquement `localStorage` + reload

---

### T1 — Migration

**Fichier : `supabase/migrations/00149_create_profile_roles.sql`**

```sql
-- Story 86-2 — Epic 86 Architecture Rôles & Permissions
-- Table profile_roles : relation N-N profiles × user_role (rôles additionnels)
-- profiles.role reste la source de vérité pour current_user_role() (rétrocompatibilité RLS)

CREATE TABLE IF NOT EXISTS profile_roles (
  profile_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        user_role   NOT NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by  UUID        REFERENCES profiles(id),
  deleted_at  TIMESTAMPTZ,
  PRIMARY KEY (profile_id, role)
);

CREATE INDEX IF NOT EXISTS idx_profile_roles_profile ON profile_roles(profile_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE profile_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_roles_select_self_or_admin
  ON profile_roles FOR SELECT
  USING (
    profile_id = auth.uid()
    OR current_user_role() = 'admin'
  );

CREATE POLICY profile_roles_admin_all
  ON profile_roles FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- Trigger : à chaque création de profil, peupler profile_roles avec le rôle principal
CREATE OR REPLACE FUNCTION sync_profile_role_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profile_roles (profile_id, role, granted_at, granted_by)
  VALUES (NEW.id, NEW.role, now(), NEW.id)
  ON CONFLICT (profile_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON profiles;
CREATE TRIGGER trg_sync_profile_role
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_role_on_insert();

-- Backfill : tous les profils existants reçoivent leur rôle principal dans profile_roles
INSERT INTO profile_roles (profile_id, role, granted_at, granted_by)
SELECT id, role, COALESCE(created_at, now()), id
FROM profiles
ON CONFLICT (profile_id, role) DO NOTHING;
```

Contraintes :
- IF NOT EXISTS partout
- Soft-delete via `deleted_at` nullable
- `ON CONFLICT DO NOTHING` pour idempotence du backfill

---

### T2 — Type TS

**Fichier : `aureak/packages/types/src/entities.ts` (ajouter après les autres types de profil)**

```typescript
/** Rôle additionnel attribué à un profil — Story 86-2 */
export interface ProfileRole {
  profileId  : string
  role       : UserRole
  grantedAt  : string
  grantedBy  : string | null
  deletedAt  : string | null
}
```

---

### T3 — API client

**Fichier : `aureak/packages/api-client/src/auth/profile-roles.ts` (nouveau)**

```typescript
import { supabase } from '../supabase'
import type { UserRole } from '@aureak/types'

export async function listUserRoles(profileId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('role')
    .eq('profile_id', profileId)
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listUserRoles] error:', error)
    throw error
  }
  return (data ?? []).map(r => r.role as UserRole)
}

export async function assignRoleToUser(profileId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profile_roles')
    .upsert({ profile_id: profileId, role, deleted_at: null }, { onConflict: 'profile_id,role' })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[assignRoleToUser] error:', error)
    throw error
  }
}

export async function revokeRoleFromUser(profileId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profile_roles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .eq('role', role)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[revokeRoleFromUser] error:', error)
    throw error
  }
}
```

Puis dans `aureak/packages/api-client/src/index.ts` :

```typescript
export { listUserRoles, assignRoleToUser, revokeRoleFromUser } from './auth/profile-roles'
```

---

### T4 — Hooks

**Fichier : `aureak/apps/web/app/(admin)/hooks/useAvailableRoles.ts` (nouveau)**

```typescript
import { useQuery } from '@tanstack/react-query'
import { listUserRoles } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'

export function useAvailableRoles() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['availableRoles', user?.id],
    queryFn : () => listUserRoles(user!.id),
    enabled : !!user?.id,
    staleTime: 5 * 60 * 1000,
  })
}
```

**Fichier : `aureak/apps/web/app/(admin)/hooks/useCurrentRole.ts` (nouveau)**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@aureak/business-logic'
import type { UserRole } from '@aureak/types'

const KEY = 'aureak_active_role'

export function useCurrentRole() {
  const { role: defaultRole } = useAuthStore()
  const [active, setActive] = useState<UserRole | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(KEY) as UserRole | null
    setActive(stored ?? defaultRole ?? null)
  }, [defaultRole])

  const setCurrentRole = useCallback((role: UserRole) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(KEY, role)
    window.location.reload()
  }, [])

  return { activeRole: active, setCurrentRole }
}
```

---

### T5 — RoleSwitcher

**Fichier : `aureak/packages/ui/src/RoleSwitcher.tsx` (nouveau)**

Pattern : Pressable RN Web + dropdown inline, tokens `@aureak/theme`. Props : `{ availableRoles: UserRole[]; activeRole: UserRole; onChange: (role: UserRole) => void }`. Si `availableRoles.length <= 1` → retourne `null`.

Labels human-readable :
```typescript
const ROLE_LABELS: Record<UserRole, string> = {
  admin     : 'Administrateur',
  coach     : 'Coach',
  parent    : 'Parent',
  child     : 'Joueur',
  club      : 'Club partenaire',
  commercial: 'Commercial',
  manager   : 'Manager',
  marketeur : 'Marketeur',
}
```

Style :
- Bouton : `backgroundColor: colors.surface.neutral`, `padding: space.sm`, `borderRadius: radius.md`, `boxShadow: shadows.sm`
- Dropdown : même tokens, hover `colors.hover.subtle`
- Rôle actif : préfixe `✓ ` + `color: colors.accent.gold`

---

### T6 — Intégration sidebar

**Fichier : `aureak/apps/web/app/(admin)/_layout.tsx`**

Dans `AdminLayoutInner()`, juste avant `NAV_GROUPS.map(...)` (environ après le header logo) :

```tsx
import { RoleSwitcher } from '@aureak/ui'
import { useAvailableRoles } from './hooks/useAvailableRoles'
import { useCurrentRole } from './hooks/useCurrentRole'

// dans le render, au-dessus de <nav>
const { data: availableRoles = [] } = useAvailableRoles()
const { activeRole, setCurrentRole } = useCurrentRole()

{activeRole && availableRoles.length > 1 && (
  <RoleSwitcher
    availableRoles={availableRoles}
    activeRole={activeRole}
    onChange={setCurrentRole}
  />
)}
```

---

### Design / Tokens

**Type design** : `polish` (composant nouveau mais sans mockup PNG — design guidé par tokens)

```typescript
import { colors, space, shadows, radius, transitions } from '@aureak/theme'

// Bouton switcher (fermé)
backgroundColor : colors.surface.neutral
borderRadius    : radius.md
boxShadow       : shadows.sm
padding         : space.sm

// Dropdown item actif
color           : colors.accent.gold
fontWeight      : '600'

// Transition d'ouverture
transition      : transitions.default
```

Principes :
- Discret par défaut (neutral), se révèle au hover
- Pas de carte "lourde" : uniquement un chip de menu
- Icône picto "chapeau" ou "casquette" si disponible, sinon "UserIcon" de `@aureak/ui`

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00149_create_profile_roles.sql` | Créer | Table + trigger + backfill + RLS |
| `aureak/packages/types/src/entities.ts` | Modifier | Ajouter type `ProfileRole` |
| `aureak/packages/api-client/src/auth/profile-roles.ts` | Créer | 3 fonctions CRUD |
| `aureak/packages/api-client/src/index.ts` | Modifier | Exporter les 3 fonctions |
| `aureak/apps/web/app/(admin)/hooks/useAvailableRoles.ts` | Créer | Hook TanStack Query |
| `aureak/apps/web/app/(admin)/hooks/useCurrentRole.ts` | Créer | Hook localStorage |
| `aureak/packages/ui/src/RoleSwitcher.tsx` | Créer | Composant dropdown |
| `aureak/packages/ui/src/index.ts` | Modifier | Exporter `RoleSwitcher` |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | Intégrer switcher en haut de sidebar |

---

### Fichiers à NE PAS modifier

- `aureak/packages/business-logic/src/authStore.ts` (ou équivalent) — ne pas changer la signature de `useAuthStore`. Le rôle actif est un concept client-only dans cette story.
- Toute policy RLS existante — `profiles.role` reste la source de vérité pour `current_user_role()`
- La table `profiles` — pas de nouvelle colonne
- `aureak/apps/web/app/(admin)/_layout.tsx` NAV_GROUPS — pas de refactor dynamique ici (c'est la story 86-4)

---

### Dépendances à protéger

- Story 86-1 doit être `done` (enum contient `manager`, `marketeur`) avant cette story
- Story 86-4 réutilise `useCurrentRole()` et `useAvailableRoles()` — ne pas modifier leur signature sans coordonner
- Story 86-3 réutilise `useCurrentRole()` pour calculer `getEffectivePermissions()` — idem

---

### Références

- Pattern API + RLS : `supabase/migrations/00147_create_commercial_contacts.sql` (même stack)
- Pattern hook TanStack : `aureak/packages/api-client/src/admin/sessions.ts` ~ligne 972 (`listSessionsAdminView`)
- Pattern composant UI : `aureak/packages/ui/src/NavBadge.tsx` ou `NavTooltip.tsx` (dans `apps/web/components/`)
- Sidebar cible : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 100-133

---

### Multi-tenant

RLS gère l'isolation via jointure implicite sur `profiles` (un profil appartient à un tenant). Aucun `tenantId` à passer en paramètre des fonctions API — les policies filtrent automatiquement.

---

## Commit

```
feat(epic-86): story 86-2 — profile_roles + RoleSwitcher + hooks multi-rôle
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — pipeline-dev autonome, 2026-04-18.

### Debug Log References

- `tsc --noEmit` (monorepo aureak) → 0 erreurs après implémentation.

### Completion Notes List

- **Schéma profiles** : la PK de `profiles` est `user_id` (pas `id`) et la colonne role est `user_role` de type TEXT (pas l'enum). Migration 00149 corrigée : FK `profile_roles.profile_id` → `profiles(user_id)`, trigger caste `NEW.user_role::user_role`, backfill idem.
- **TanStack Query indisponible** : `@tanstack/react-query` n'est pas installé dans `aureak/apps/web`. `useAvailableRoles` implémenté avec `useState` + `useEffect` + try/finally (pattern existant dans `_layout.tsx` pour `listStages`, `getActiveSession`, etc.).
- **Fallback offline / merge défensif** : `useAvailableRoles` ajoute toujours le rôle principal au résultat si absent, pour gérer le cas edge où le backfill n'aurait pas tourné. Sur erreur réseau, fallback silencieux sur `[defaultRole]`.
- **Tokens theme** : `radius.md` et `transitions.default` n'existent pas dans `@aureak/theme` — utilisés `radius.xs` + `transitions.fast`.
- **Composant `AureakText`** ne supporte pas de prop `weight` → `RoleSwitcher` utilise `Text` de react-native directement (style inline avec `fontWeight`).
- **Dépendances débloquées** : Stories 86-3 (permissions effectives) et 86-4 (sidebar adaptative) peuvent consommer `useCurrentRole()` et `useAvailableRoles()`.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00149_create_profile_roles.sql` | Créé |
| `aureak/packages/types/src/entities.ts` | Modifié (ajout type `ProfileRole`) |
| `aureak/packages/api-client/src/auth/profile-roles.ts` | Créé |
| `aureak/packages/api-client/src/index.ts` | Modifié (exports `listUserRoles`, `assignRoleToUser`, `revokeRoleFromUser`) |
| `aureak/apps/web/app/(admin)/hooks/useAvailableRoles.ts` | Créé |
| `aureak/apps/web/app/(admin)/hooks/useCurrentRole.ts` | Créé |
| `aureak/packages/ui/src/RoleSwitcher.tsx` | Créé |
| `aureak/packages/ui/src/index.ts` | Modifié (export `RoleSwitcher`) |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié (import + rendu switcher en sidebar) |
