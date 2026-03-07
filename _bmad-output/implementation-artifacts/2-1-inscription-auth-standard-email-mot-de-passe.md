# Story 2.1 : Inscription & Auth Standard (Email/Mot de Passe)

Status: review

## Story

En tant qu'Admin,
Je veux créer des comptes utilisateurs et qu'ils puissent se connecter par email/mot de passe,
Afin que chaque utilisateur accède à son espace personnel avec ses données isolées par tenant.

## Acceptance Criteria

**AC1 — Création de compte par l'Admin**
- **Given** un Admin connecté sur l'interface web
- **When** il crée un compte avec email, `user_role` et `tenant_id`
- **Then** une ligne est insérée dans `profiles` avec `status = 'pending'` et l'utilisateur reçoit un email d'invitation Supabase

**AC2 — Activation du compte**
- **And** à l'activation du lien d'invitation, `profiles.status` passe à `'active'` (via webhook ou database trigger)

**AC3 — JWT avec custom claims**
- **And** le JWT retourné contient dans `app_metadata` : `{ role, tenant_id }` via Custom Access Token Hook (Supabase Edge Function)
- **And** le token d'accès expire après 24h, le refresh token après 30 jours

**AC4 — Réponses HTTP correctes**
- **And** une requête sans JWT valide retourne `401 Unauthorized`
- **And** une requête avec JWT valide mais rôle/tenant insuffisant retourne `403 Forbidden` (enforcement RLS PostgreSQL)

**AC5 — Désactivation de compte**
- **And** un Admin désactive un compte → `profiles.status = 'disabled'` ET toutes les sessions actives + refresh tokens sont révoqués via Supabase Auth Admin API
- **And** à la prochaine tentative d'accès avec un token encore valide, le client est forcé à la déconnexion (`signOut()` déclenché côté app)

**AC6 — RLS vérifie le statut actif**
- **And** les policies RLS tenant-aware incluent la vérification :
  ```sql
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND status = 'active'
  )
  ```
  — un utilisateur désactivé ne peut accéder à aucune ressource protégée même avec un token encore valide

**AC7 — Écrans de login opérationnels**
- **And** `apps/mobile/app/(auth)/login.tsx` et `apps/web/app/(auth)/login.tsx` permettent la connexion email/mot de passe via `supabase.auth.signInWithPassword()`
- **And** après connexion réussie, l'utilisateur est redirigé vers son espace de rôle (`/coach`, `/admin`, `/parent`, `/child`)

**AC8 — `useAuthStore` disponible**
- **And** `packages/business-logic/src/stores/useAuthStore.ts` expose le store Zustand avec `{ session, user, role, tenantId, signOut }`, utilisable depuis toutes les apps

## Tasks / Subtasks

- [x] Task 1 — Migration `00003_create_profiles.sql` (AC: #1, #6)
  - [x] 1.1 Créer `supabase/migrations/00003_create_profiles.sql`
  - [x] 1.2 Créer la table `profiles` avec schéma complet (voir Dev Notes)
  - [x] 1.3 Créer la table `parent_child_links` (voir Dev Notes)
  - [x] 1.4 Ajouter les soft-delete columns (`deleted_at`, `deleted_by`) sur `profiles`
  - [x] 1.5 Activer RLS sur `profiles` et `parent_child_links`
  - [x] 1.6 Créer les policies RLS initiales (voir Dev Notes) — policies complètes ajoutées en Story 2.2
  - [ ] 1.7 Vérifier `supabase db diff` clean après la migration (validation manuelle — nécessite Docker)

- [x] Task 2 — Custom Access Token Hook (AC: #3)
  - [x] 2.1 Créer `supabase/functions/custom-access-token-hook/index.ts`
  - [x] 2.2 Implémenter la logique : lire `profiles` pour l'utilisateur → injecter `{ role, tenant_id }` dans `app_metadata` du JWT
  - [ ] 2.3 Configurer le hook dans Supabase Dashboard : Authentication → Hooks → Custom Access Token → pointer vers la fonction (validation manuelle)
  - [x] 2.4 Configurer `supabase/config.toml` pour déclarer le hook en local dev
  - [ ] 2.5 Tester : connexion → vérifier que `supabase.auth.getSession()` retourne un JWT avec `app_metadata.role` et `app_metadata.tenant_id` (validation manuelle)

- [x] Task 3 — Trigger activation compte (AC: #2)
  - [x] 3.1 Créer un trigger PostgreSQL `on_auth_user_confirmed` sur `auth.users` (event `AFTER UPDATE` sur `email_confirmed_at IS NOT NULL`) → met à jour `profiles.status = 'active'`
  - [x] 3.2 Alternative documentée : webhook Supabase `auth.user.updated` si trigger `auth.users` non applicable en prod
  - [ ] 3.3 Tester le flow complet : invitation → clic lien → `profiles.status` devient `'active'` (validation manuelle)

- [x] Task 4 — Admin UI : création de compte (web) (AC: #1)
  - [x] 4.1 Créer `apps/web/app/(admin)/users/new.tsx` — formulaire : email, `user_role` (select), tenant auto-injecté depuis le JWT Admin
  - [x] 4.2 Dans `packages/api-client/src/auth.ts`, exporter `inviteUser({ email, role, tenantId })` appelant `supabase.auth.admin.inviteUserByEmail(email, { data: { role, tenant_id: tenantId } })`
  - [x] 4.3 Après invitation réussie : créer la ligne `profiles` manuellement
  - [x] 4.4 Valider le formulaire avec React Hook Form + Zod (email valide, rôle parmi `user_role`)
  - [x] 4.5 Afficher un message de confirmation après envoi de l'invitation

- [x] Task 5 — Écrans de login (mobile + web) (AC: #7)
  - [x] 5.1 Implémenter `apps/mobile/app/(auth)/login.tsx` — formulaire email/mot de passe, `supabase.auth.signInWithPassword()`, redirection post-login selon `role` du JWT
  - [x] 5.2 Implémenter `apps/web/app/(auth)/login.tsx` — même logique, layout web
  - [x] 5.3 Dans `packages/api-client/src/auth.ts`, exporter `signIn({ email, password })` et `signOut()`
  - [x] 5.4 Validation React Hook Form + Zod : email requis + valide, password requis min 8 caractères
  - [x] 5.5 Afficher les erreurs Supabase Auth (`Invalid credentials`, `Email not confirmed`) de façon lisible

- [x] Task 6 — `useAuthStore` (Zustand) (AC: #8)
  - [x] 6.1 Créer `packages/business-logic/src/stores/useAuthStore.ts`
  - [x] 6.2 État : `{ session, user, role, tenantId, isLoading }` — initialisé depuis `supabase.auth.getSession()`
  - [x] 6.3 Action `signOut()` : appelle `supabase.auth.signOut()` puis reset du store
  - [x] 6.4 Listener `supabase.auth.onAuthStateChange()` : met à jour le store en temps réel (connexion / déconnexion / token refresh)
  - [x] 6.5 Exporter depuis `packages/business-logic/src/index.ts`

- [x] Task 7 — AuthGuard & routage par rôle (AC: #7)
  - [x] 7.1 Créer `packages/business-logic/src/auth/roles.ts` — helpers : `isAdmin()`, `isCoach()`, `isParent()`, `isChild()` lisant `useAuthStore` (UI guards uniquement — jamais source d'autorité)
  - [x] 7.2 Implémenter l'`AuthGuard` dans les `_layout.tsx` des routes protégées (coach, parent, child mobile + admin web)
  - [x] 7.3 Initialiser `useAuthStore` dans `apps/mobile/app/_layout.tsx` et `apps/web/app/_layout.tsx`

- [x] Task 8 — Désactivation de compte (AC: #5, #6)
  - [x] 8.1 Dans `packages/api-client/src/auth.ts`, exporter `disableUser(userId: string)` via Edge Function `admin-disable-user`
  - [x] 8.2 Dans `useAuthStore`, listener sur `onAuthStateChange` : si session active sans role → `signOut()` automatique
  - [x] 8.3 Créer l'UI Admin pour désactiver un compte : `apps/web/app/(admin)/users/[id].tsx`

- [x] Task 9 — Validation et smoke test (AC: #4, #6)
  - [ ] 9.1 Exécuter `supabase db reset` : zéro erreur (validation manuelle — nécessite Docker)
  - [ ] 9.2 Exécuter `supabase db diff` : clean (validation manuelle — nécessite Docker)
  - [x] 9.3 Smoke test Vitest : `packages/api-client/src/auth.test.ts` — 5 tests passent ✓
  - [ ] 9.4 Test RLS manuel : créer un utilisateur de tenant A, vérifier isolation tenant B (validation manuelle)

## Dev Notes

### Schéma `profiles` — migration `00003_create_profiles.sql`

```sql
-- Migration 00003 — profiles + parent_child_links
-- Dépend de : 00001 (tenants, current_tenant_id), 00002 (user_role enum)

CREATE TABLE profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  user_role    user_role NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'active', 'disabled')),
  display_name TEXT,
  -- Soft-delete convention (Zone 11)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES auth.users(id)
);

-- Index de performance
CREATE INDEX profiles_tenant_idx ON profiles (tenant_id);
CREATE INDEX profiles_role_idx   ON profiles (tenant_id, user_role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateur lui-même OU admin du même tenant
CREATE POLICY "own_profile_read" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR current_user_role() = 'admin'
  );

-- Un utilisateur peut modifier son propre profil (display_name)
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seul l'admin peut insérer (création de compte)
CREATE POLICY "admin_insert" ON profiles
  FOR INSERT WITH CHECK (current_user_role() = 'admin'
    AND tenant_id = current_tenant_id());

-- Table de liaison parent ↔ enfant
CREATE TABLE parent_child_links (
  parent_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, child_id)
);

ALTER TABLE parent_child_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_sees_own_links" ON parent_child_links
  FOR SELECT USING (parent_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "admin_manage_links" ON parent_child_links
  FOR ALL USING (current_user_role() = 'admin'
    AND tenant_id = current_tenant_id());
```

> **Note** : `parent_child_links` n'a pas de `tenant_id` propre — l'isolation est garantie indirectement par les FK vers `profiles(user_id)`, elles-mêmes isolées par tenant via RLS. Si nécessaire en Story 2.2, ajouter une colonne dénormalisée.

### Custom Access Token Hook — implémentation complète

Le hook s'exécute à chaque émission de JWT (connexion + refresh). Il enrichit `app_metadata` avec `role` et `tenant_id` depuis `profiles`.

```typescript
// supabase/functions/custom-access-token-hook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { user_id, claims } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, tenant_id, status')
    .eq('user_id', user_id)
    .single()

  if (!profile || profile.status === 'disabled') {
    // Token révoqué — retourner sans enrichir (auth échouera via RLS)
    return new Response(JSON.stringify({ claims }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const enrichedClaims = {
    ...claims,
    app_metadata: {
      ...claims.app_metadata,
      role      : profile.user_role,
      tenant_id : profile.tenant_id,
    },
  }

  return new Response(JSON.stringify({ claims: enrichedClaims }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Configuration `supabase/config.toml` (dev local) :**
```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
# Ou si Edge Function :
# uri = "http://host.docker.internal:54321/functions/v1/custom-access-token-hook"
```

**Configuration Dashboard Supabase (remote) :**
Authentication → Hooks → Custom Access Token → URL de la fonction déployée.

### `useAuthStore` — pattern Zustand

```typescript
// packages/business-logic/src/stores/useAuthStore.ts
import { create } from 'zustand'
import { supabase } from '@aureak/api-client'
import type { Session, User } from '@supabase/supabase-js'
import type { UserRole } from '@aureak/types'

type AuthState = {
  session   : Session | null
  user      : User | null
  role      : UserRole | null
  tenantId  : string | null
  isLoading : boolean
  signOut   : () => Promise<void>
  _init     : () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session  : null,
  user     : null,
  role     : null,
  tenantId : null,
  isLoading: true,

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, role: null, tenantId: null })
  },

  _init: () => {
    // Initialisation depuis la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user     : session?.user ?? null,
        role     : session?.user?.app_metadata?.role ?? null,
        tenantId : session?.user?.app_metadata?.tenant_id ?? null,
        isLoading: false,
      })
    })

    // Listener temps réel (connexion / déconnexion / refresh token)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user     : session?.user ?? null,
        role     : session?.user?.app_metadata?.role ?? null,
        tenantId : session?.user?.app_metadata?.tenant_id ?? null,
        isLoading: false,
      })
    })
  },
}))
```

Appeler `useAuthStore.getState()._init()` une seule fois dans `apps/mobile/app/_layout.tsx` et `apps/web/app/_layout.tsx` au démarrage.

### RLS avec vérification `status = 'active'`

Toutes les policies tenant-aware des stories futures DOIVENT inclure la vérification du statut actif pour respecter l'AC6. Pattern à reproduire systématiquement :

```sql
-- Template RLS pour tables tenant-aware (toutes les stories Epic 3+)
CREATE POLICY "tenant_active_users_only" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
```

> **Note Story 2.2** : Story 2.2 harmonise et finalise les policies RLS sur toutes les tables. Story 2.1 pose les fondations (`profiles`, `current_tenant_id()`, Custom Access Token Hook) et crée les policies minimales.

### Routage post-login par rôle

```typescript
// Logique de redirection dans apps/mobile/app/(auth)/login.tsx
// et apps/web/app/(auth)/login.tsx

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) { /* afficher erreur */ return }

  const role = data.session?.user?.app_metadata?.role as UserRole | undefined
  switch (role) {
    case 'admin'  : router.replace('/(admin)');  break
    case 'coach'  : router.replace('/(coach)');  break
    case 'parent' : router.replace('/(parent)'); break
    case 'child'  : router.replace('/(child)');  break
    default       : router.replace('/(auth)/login') // rôle inconnu
  }
}
```

### Désactivation de compte — flow complet

```typescript
// packages/api-client/src/auth.ts
export async function disableUser(userId: string): Promise<void> {
  // 1. Marquer comme désactivé dans profiles
  await supabase
    .from('profiles')
    .update({ status: 'disabled' })
    .eq('user_id', userId)

  // 2. Révoquer toutes les sessions actives (requiert service_role)
  // Appeler depuis une Edge Function avec service_role — pas depuis le client public
  await supabase.functions.invoke('admin-disable-user', { body: { userId } })
}
```

La révocation des sessions (`supabase.auth.admin.deleteUser()` ou invalidation des refresh tokens) doit se faire via une Edge Function avec `SUPABASE_SERVICE_ROLE_KEY` — jamais depuis le client public (`anon` key).

### Pièges courants à éviter

1. **`inviteUserByEmail` ne crée pas la ligne `profiles`** — créer la ligne `profiles` manuellement après l'invitation (le hook JWT ne s'exécute qu'à la première connexion, pas à l'invitation)
2. **Le Custom Access Token Hook utilise `service_role`** — ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client ; la fonction Edge tourne côté serveur uniquement
3. **Ne pas lire `role` depuis le store côté client pour des décisions de sécurité** — `useAuthStore.role` est pour l'UI uniquement. La vraie autorisation est dans la RLS PostgreSQL
4. **`onAuthStateChange` peut s'exécuter plusieurs fois** — l'abonnement dans `_init()` doit être appelé une seule fois dans la racine de l'app, pas dans chaque composant
5. **Token refresh** : si `profiles.status = 'disabled'`, le Custom Access Token Hook retourne un JWT sans `role`/`tenant_id` → toutes les queries RLS retourneront 0 résultats → l'app doit détecter ce cas et déclencher `signOut()` proprement
6. **`parent_child_links.tenant_id`** : si les stories futures ont besoin de filtrer les enfants d'un parent par tenant directement dans `parent_child_links`, ajouter une colonne dénormalisée en Story 2.2 — ne pas l'anticiper maintenant

### Project Structure Notes

Fichiers créés par cette story :
```
supabase/
├── migrations/
│   └── 00003_create_profiles.sql       # profiles + parent_child_links
└── functions/
    ├── custom-access-token-hook/
    │   └── index.ts                    # Custom Access Token Hook
    └── admin-disable-user/
        └── index.ts                    # révocation sessions (service_role)

packages/api-client/src/
└── auth.ts                             # signIn, signOut, inviteUser, disableUser

packages/business-logic/src/
├── stores/
│   └── useAuthStore.ts                 # Zustand store auth
└── auth/
    └── roles.ts                        # helpers UI : isAdmin(), isCoach()...

apps/mobile/app/
└── (auth)/
    └── login.tsx                       # formulaire connexion mobile

apps/web/app/
├── (auth)/
│   └── login.tsx                       # formulaire connexion web
└── (admin)/
    └── users/
        ├── new.tsx                     # création compte Admin
        └── [id].tsx                    # désactivation compte
```

### Dépendances de cette story

- **Prérequis** : Story 1.2 (`tenants`, `current_tenant_id()`, enums `user_role`) + Story 1.3 (composants UI `Button`, `Input`, `Text` pour les formulaires) + Story 1.4 (CI pour valider les tests)
- **Stories qui dépendent de cette story** :
  - Story 2.2 (RBAC RLS universel) — construit sur `profiles` et `current_user_role()`
  - Story 2.4 (auth rapide PIN) — construit sur la session Supabase
  - Toutes les stories des Epics 3–11 — dépendent de `auth.uid()` + `current_tenant_id()` dans les policies

### References

- [Source: epics.md#Story-2.1] — Acceptance Criteria originaux (lignes 723-741)
- [Source: architecture.md#Authentification-Sécurité] — Décisions Supabase Auth + Custom Claims (lignes 214-224)
- [Source: architecture.md#Zone-12] — Isolation tenant RLS + JWT (lignes 555-590)
- [Source: architecture.md#Zone-11] — Soft-delete convention (lignes 517-534)
- [Source: architecture.md#Zone-7] — State management Zustand patterns (lignes 395-410)
- [Source: architecture.md#Source-Tree-Complet] — `packages/api-client/src/auth.ts`, `useAuthStore.ts` (lignes 767-812)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `colors.background.base` n'existe pas dans tokens.ts → renommé `colors.background.primary`
- `useAuthStore` importe `Session`/`User` depuis `@supabase/supabase-js` → interdit par ESLint rule → re-exporté depuis `@aureak/api-client`
- Migrations 00001/00002/00009 absentes du git (Story 1.2 n'avait pas commité `supabase/`) → recréées dans cette story
- turbo run ne fonctionne pas sans yarn v4 (corepack non activé sans sudo) → tests exécutés directement via `node node_modules/.bin/vitest run`

### Completion Notes List

- Migration 00003 créée : `profiles` (user_id, tenant_id, user_role, status, display_name, soft-delete) + `parent_child_links` + trigger `on_auth_user_confirmed`
- Migrations fondation recréées : 00001 (tenants + helpers JWT), 00002 (6 enums), 00009 (audit_logs + processed_operations)
- Custom Access Token Hook : `supabase/functions/custom-access-token-hook/index.ts` — enrichit JWT avec `role`/`tenant_id` depuis `profiles`
- Edge Function `admin-disable-user` : révoque sessions avec `service_role`, sécurisé par vérification JWT admin
- `packages/api-client/src/auth.ts` : `signIn`, `signOut`, `getSession`, `inviteUser` (crée profil manuellement), `disableUser`
- `packages/api-client/src/index.ts` : re-exporte `Session`/`User` de Supabase pour respecter la règle ESLint no-direct-supabase
- `packages/business-logic/src/stores/useAuthStore.ts` : Zustand store avec `_init()`, auto-signOut si profil désactivé
- `packages/business-logic/src/auth/roles.ts` : helpers UI `isAdmin/isCoach/isParent/isChild`
- Écrans login mobile et web : React Hook Form + Zod + redirection par rôle
- Admin web : `users/new.tsx` (invitation) + `users/[id].tsx` (désactivation avec confirmation)
- AuthGuard layouts : `(coach)`, `(parent)`, `(child)` mobile + `(admin)` web
- Root `_layout.tsx` mobile + web mis à jour : `useAuthStore.getState()._init()` au démarrage
- Smoke tests : 5/5 dans `auth.test.ts` ✓ — Total 18/18 tests tous packages ✓
- Typechecks : 4 packages ✓ (api-client, business-logic, mobile, web)

### File List

- supabase/config.toml
- supabase/migrations/00001_initial_schema.sql (recréé — absent du git Story 1.2)
- supabase/migrations/00002_create_enums.sql (recréé — absent du git Story 1.2)
- supabase/migrations/00009_create_audit.sql (recréé — absent du git Story 1.2)
- supabase/migrations/00003_create_profiles.sql
- supabase/functions/custom-access-token-hook/index.ts
- supabase/functions/admin-disable-user/index.ts
- packages/api-client/src/auth.ts
- packages/api-client/src/auth.test.ts
- packages/api-client/src/index.ts (modifié)
- packages/api-client/vitest.config.ts
- packages/api-client/package.json (modifié — test script + vitest)
- packages/business-logic/src/stores/useAuthStore.ts
- packages/business-logic/src/auth/roles.ts
- packages/business-logic/src/index.ts (modifié)
- packages/business-logic/package.json (modifié — zustand + @aureak/api-client)
- apps/mobile/app/(auth)/login.tsx
- apps/mobile/app/(coach)/_layout.tsx
- apps/mobile/app/(parent)/_layout.tsx
- apps/mobile/app/(child)/_layout.tsx
- apps/mobile/app/_layout.tsx (modifié — _init() + nouvelles routes)
- apps/mobile/package.json (modifié — @hookform/resolvers + react-hook-form + zod)
- apps/web/app/(auth)/login.tsx
- apps/web/app/(admin)/_layout.tsx
- apps/web/app/(admin)/users/new.tsx
- apps/web/app/(admin)/users/[id].tsx
- apps/web/app/_layout.tsx (modifié — _init() + nouvelles routes)
- apps/web/package.json (modifié — @hookform/resolvers + react-hook-form + zod)
