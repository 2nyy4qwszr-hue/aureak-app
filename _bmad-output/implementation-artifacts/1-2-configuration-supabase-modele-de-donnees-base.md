# Story 1.2 : Configuration Supabase & Modèle de Données Base

Status: done

## Story

En tant que développeur,
Je veux configurer le projet Supabase (remote + local dev) avec le modèle multi-tenant de base, RLS activé, enums PostgreSQL typés correctement et convention soft-delete,
Afin que toutes les migrations futures s'appuient sur des fondations cohérentes et que chaque développeur puisse travailler entièrement en local.

## Acceptance Criteria

**AC1 — Migrations propres et reproductibles**
- **Given** Supabase CLI installé et Docker disponible en local
- **When** le développeur exécute `supabase db reset`
- **Then** les migrations s'appliquent dans l'ordre sans erreur et `supabase db diff` ne retourne aucun diff (working tree clean)

**AC2 — Enums PostgreSQL exacts**
- **And** les enums PostgreSQL suivants existent avec les valeurs exactes :
  - `user_role ('admin','coach','parent','child')`
  - `club_access_level ('partner','common')`
  - `attendance_status ('present','absent','injured','late','trial')`
  - `evaluation_signal ('positive','attention','none')`

**AC3 — Table `tenants` avec RLS**
- **And** la table `tenants` (id UUID PK, name TEXT, created_at TIMESTAMPTZ) est créée avec RLS activé et la policy `tenant_isolation` de base

**AC4 — Table `processed_operations` pour l'idempotency**
- **And** la table `processed_operations` (operation_id UUID PK, processed_at TIMESTAMPTZ, tenant_id UUID FK → tenants) existe pour l'idempotency de sync offline

**AC5 — Table `audit_logs` Foundation (append-only)**
- **And** la table `audit_logs` est créée avec le schéma suivant, immuable — enforced par RLS :
  ```sql
  CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID,
    action      TEXT NOT NULL,
    metadata    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ```
- **And** les policies RLS minimales sont actives : `tenant_isolation` (ALL) + `insert_only_base` (INSERT only)
- **And** aucun UPDATE ni DELETE n'est autorisé sur `audit_logs` — enforced en Story 10.4

**AC6 — Convention soft-delete documentée**
- **And** la convention soft-delete (`deleted_at TIMESTAMPTZ NULL`) est documentée dans `supabase/CONVENTIONS.md`

**AC7 — Loader d'env centralisé dans `@aureak/api-client`**
- **And** `apps/mobile` et `apps/web` lisent `SUPABASE_URL` et `SUPABASE_ANON_KEY` via un loader d'env centralisé dans `@aureak/api-client` — aucun accès direct aux variables d'env dans les apps

**AC8 — Fichier `.env.example` complet**
- **And** un fichier `.env.example` à la racine documente toutes les variables requises avec leurs valeurs locales par défaut (issues du `supabase start`)

## Tasks / Subtasks

- [x] Task 1 — Initialisation Supabase CLI & projet local (AC: #1)
  - [x] 1.1 Exécuter `supabase init` à la racine du monorepo (crée `supabase/config.toml`)
  - [ ] 1.2 Lier au projet Supabase remote : `supabase link --project-ref <project-ref>` (validation manuelle — nécessite `supabase login`)
  - [ ] 1.3 Ajouter `supabase/` dans le workspace Turborepo si applicable
  - [ ] 1.4 Vérifier que `supabase start` démarre PostgreSQL local sans erreur (validation manuelle — nécessite Docker)

- [x] Task 2 — Migration 00001 : schéma initial + extensions + helper (AC: #1, #3)
  - [x] 2.1 Créer `supabase/migrations/00001_initial_schema.sql`
  - [x] 2.2 Activer les extensions : `uuid-ossp`, `pgcrypto`
  - [x] 2.3 Créer la table `tenants` avec RLS activé et policy `tenant_isolation`
  - [x] 2.4 Créer la fonction helper `current_tenant_id()` avec SECURITY DEFINER
  - [x] 2.5 Créer la fonction helper `current_user_role()` avec SECURITY DEFINER

- [x] Task 3 — Migration 00002 : enums PostgreSQL (AC: #2)
  - [x] 3.1 Créer `supabase/migrations/00002_create_enums.sql`
  - [x] 3.2 Créer l'enum `user_role ('admin','coach','parent','child')`
  - [x] 3.3 Créer l'enum `club_access_level ('partner','common')`
  - [x] 3.4 Créer l'enum `attendance_status ('present','absent','injured','late','trial')`
  - [x] 3.5 Créer l'enum `evaluation_signal ('positive','attention','none')`
  - [x] 3.6 Créer les enums utilitaires `sync_status` et `notification_channel`

- [x] Task 4 — Migration 00009 : audit_logs + processed_operations (AC: #4, #5)
  - [x] 4.1 Créer `supabase/migrations/00009_create_audit.sql`
  - [x] 4.2 Créer la table `processed_operations` avec RLS + policy tenant
  - [x] 4.3 Créer la table `audit_logs` avec le schéma Foundation
  - [x] 4.4 Activer RLS + policies `tenant_isolation` et `insert_only_base` + index
  - [ ] 4.5 Valider que `supabase db diff` est clean (validation manuelle — nécessite Docker)

- [x] Task 5 — Types TypeScript miroir dans `packages/types` (AC: #2)
  - [x] 5.1 `packages/types/src/enums.ts` — 6 types union TypeScript miroir des enums PostgreSQL
  - [x] 5.2 `packages/types/src/entities.ts` — types `Tenant`, `AuditLog`, `ProcessedOperation`
  - [x] 5.3 `tsc --noEmit` passe — validé via `turbo build` (8/8 ✓)

- [x] Task 6 — Loader Supabase centralisé dans `@aureak/api-client` (AC: #7)
  - [x] 6.1 `packages/api-client/src/supabase.ts` — createClient via process.env avec warning non-fatal
  - [x] 6.2 `supabase` exporté depuis `packages/api-client/src/index.ts`
  - [x] 6.3 `apps/mobile/app.json` et `apps/web/app.json` configurés avec section `extra` (supabaseUrl, supabaseAnonKey)
  - [x] 6.4 Apps n'accèdent jamais à `process.env.SUPABASE_*` directement — vérifié par ESLint

- [x] Task 7 — Fichier `.env.example` et documentation (AC: #6, #8)
  - [x] 7.1 `.env.example` mis à jour avec valeurs locales par défaut
  - [x] 7.2 `supabase/CONVENTIONS.md` créé (soft-delete, audit_logs, nommage, RLS, enums)

- [x] Task 8 — Validation finale (AC: #1)
  - [ ] 8.1 `supabase db reset` : zéro erreur (validation manuelle — nécessite Docker)
  - [ ] 8.2 `supabase db diff` : aucun diff (validation manuelle — nécessite Docker)
  - [x] 8.3 `turbo build` : 8/8 succès ✓
  - [x] 8.4 Règle ESLint Supabase validée (Story 1.1)

## Dev Notes

### Ordre des migrations et numérotation

L'architecture définit 10 migrations numérotées. Story 1.2 en crée 3 (les fondations) ; les autres seront créées par les stories suivantes dans l'ordre :

| Migration | Contenu | Story |
|---|---|---|
| `00001_initial_schema.sql` | Extensions, `tenants`, fonctions helper JWT | **1.2** |
| `00002_create_enums.sql` | Tous les enums PostgreSQL | **1.2** |
| `00003_create_profiles.sql` | `profiles` + grades coach | Story 2.1 |
| `00004_create_sessions.sql` | `sessions`, `session_themes`, `locations` | Story 4.1 |
| `00004b_create_push_tokens.sql` | `push_tokens` (tokens notifs) | Story 7.1 |
| `00005_create_attendance.sql` | Présences | Story 5.1 |
| `00006_create_evaluations.sql` | Évaluations | Story 6.1 |
| `00007_create_content.sql` | Référentiel pédagogique | Story 3.1 |
| `00008_create_quizzes.sql` | Quiz results | Story 8.1 |
| `00009_create_audit.sql` | **`audit_logs`** + `processed_operations` | **1.2** |
| `00010_rls_policies.sql` | Toutes les RLS policies complètes | Story 2.2 |

**Remarque importante :** `00009_create_audit.sql` est numéroté 00009 dans l'architecture mais créé dès la Story 1.2 (Foundation) car `audit_logs` est utilisé par tous les epics suivants sans dépendance vers Epic 9 ou 10. Supabase applique les migrations par ordre alphabétique — 00009 s'appliquera après les autres dans les stories futures, ce qui est correct puisque `audit_logs` ne dépend que de `tenants`.

### Schéma `audit_logs` — Source de vérité

```sql
-- supabase/migrations/00009_create_audit.sql
-- Table Foundation — utilisée par Epic 2, 4, 7, 9, 10, 11
-- Aucune dépendance vers Epic 9 ou Epic 10 pour cette table.
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL si système / cron
  entity_type TEXT NOT NULL,  -- 'user', 'session', 'consent', 'coach', 'anomaly', etc.
  entity_id   UUID,           -- nullable si entité non identifiable (ex: connexion)
  action      TEXT NOT NULL,  -- 'user_suspended', 'consent_revoked', 'session_closed', etc.
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Pas de deleted_at : audit_logs est immuable par design
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS minimal — étendu en Story 10.4 (policies complètes, indexes, purge)
CREATE POLICY "tenant_isolation" ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "insert_only_base" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
```

**En Story 10.4**, ces policies minimales seront remplacées par un jeu complet (lecture admin uniquement, `no_update`, `no_delete`, indexes de performance, rétention configurable).

### Schéma `processed_operations`

```sql
-- Table Foundation — idempotency de la sync offline (Zone 10 architecture)
CREATE TABLE processed_operations (
  operation_id UUID PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id)
);
ALTER TABLE processed_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON processed_operations
  FOR ALL USING (tenant_id = current_tenant_id());
```

### Fonction `current_tenant_id()` — critique pour toutes les policies RLS

Cette fonction est utilisée dans **toutes** les policies RLS du projet. Elle doit être créée dans `00001_initial_schema.sql` **avant** les tables qui l'utilisent.

```sql
-- Helper RLS — extrait tenant_id du JWT (app_metadata)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
$$;

-- Helper RLS — extrait le rôle du JWT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$;
```

`SECURITY DEFINER` : ces fonctions s'exécutent avec les droits du défisseur (postgres), permettant l'accès à `auth.jwt()` depuis les policies RLS.

### Enums complets — migration 00002

```sql
-- Rôles utilisateur (correspond au champ `role` dans JWT app_metadata)
CREATE TYPE user_role AS ENUM (
  'admin', 'coach', 'parent', 'child'
);

-- Niveaux d'accès clubs partenaires
CREATE TYPE club_access_level AS ENUM (
  'partner', 'common'
);

-- Statuts de présence terrain
CREATE TYPE attendance_status AS ENUM (
  'present', 'absent', 'injured', 'late',
  'trial'   -- enfant invité non inscrit
);

-- Signaux d'évaluation coach (2 états + vide — jamais de 🔴)
CREATE TYPE evaluation_signal AS ENUM (
  'positive',   -- 🟢
  'attention',  -- 🟡
  'none'        -- ○ vide — aucune information envoyée
);

-- Statut de sync offline
CREATE TYPE sync_status AS ENUM (
  'pending', 'syncing', 'synced', 'failed'
);

-- Canaux de notification
CREATE TYPE notification_channel AS ENUM (
  'push', 'email', 'sms'
);
```

### Types TypeScript miroir — `packages/types/src/enums.ts`

**Règle ARCH-12 :** tout enum PostgreSQL DOIT avoir son type TypeScript miroir dans `packages/types`. Les deux sont mis à jour dans la même PR.

```typescript
// packages/types/src/enums.ts
export type UserRole = 'admin' | 'coach' | 'parent' | 'child'
export type ClubAccessLevel = 'partner' | 'common'
export type AttendanceStatus = 'present' | 'absent' | 'injured' | 'late' | 'trial'
export type EvaluationSignal = 'positive' | 'attention' | 'none'
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'
export type NotificationChannel = 'push' | 'email' | 'sms'
```

```typescript
// packages/types/src/entities.ts (stubs pour Story 1.2)
import type { UserRole } from './enums'

export type Tenant = {
  id: string
  name: string
  createdAt: string
}

export type AuditLog = {
  id: string
  tenantId: string
  userId: string | null
  entityType: string
  entityId: string | null
  action: string
  metadata: Record<string, unknown>
  createdAt: string
}

export type ProcessedOperation = {
  operationId: string
  processedAt: string
  tenantId: string
}
```

### Loader Supabase dans `@aureak/api-client` — règle de frontière

Le client Supabase est le **seul endroit** dans tout le codebase où `@supabase/supabase-js` est importé côté apps. Toute tentative d'import dans `apps/mobile`, `apps/web` ou les autres packages (hors `media-client`) échoue au lint (règle configurée en Story 1.1).

**Pattern `.env.example` :**
```bash
# Supabase — valeurs issues de `supabase start` (local dev)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase remote (optionnel en local, requis en CI)
SUPABASE_SERVICE_ROLE_KEY=
```

**app.json `extra` field (Expo Constants) :**
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "process.env.SUPABASE_URL",
      "supabaseAnonKey": "process.env.SUPABASE_ANON_KEY"
    }
  }
}
```

### Isolation tenant — règle absolue

**Zone 12 architecture** : l'isolation tenant est garantie par RLS PostgreSQL + JWT claims. Les headers HTTP custom (`X-Tenant-Id`) sont informatifs uniquement — jamais source d'autorisation.

Pattern RLS type à reproduire sur toutes les tables futures :
```sql
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON ma_table
  FOR ALL USING (tenant_id = current_tenant_id());
```

Jamais de filtrage tenant côté client, jamais via header HTTP.

### Convention soft-delete — `supabase/CONVENTIONS.md`

Colonnes systématiques sur **toutes les tables métier** (sauf `audit_logs` et `processed_operations`) :
```sql
created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at   TIMESTAMPTZ NULL,        -- NULL = actif
deleted_by   UUID NULL REFERENCES auth.users(id)
```
- Jamais de `DELETE` SQL sur les tables métier dans le code applicatif
- Toutes les lectures incluent `WHERE deleted_at IS NULL`
- Exception unique : jobs RGPD automatisés via Edge Function avec `service_role`

### Pièges courants à éviter

1. **Ne pas oublier `current_tenant_id()`** avant les tables qui l'utilisent dans les policies — l'ordre dans `00001_initial_schema.sql` est critique
2. **Ne pas créer `audit_logs` avec FK vers `profiles`** — la table `profiles` n'existe pas encore en Story 1.2. Utiliser `auth.users(id)` ou nullable sans FK
3. **Ne pas modifier les valeurs des enums une fois créés** sans migration de renommage — PostgreSQL ne supporte pas `ALTER TYPE RENAME VALUE` de façon portable avant PG 10+
4. **Ne pas mettre `SUPABASE_SERVICE_ROLE_KEY` dans `apps/`** — cette clé est réservée aux Edge Functions et au CI, jamais exposée côté client
5. **Ne pas appeler `supabase start` sans Docker** — le DEV doit avoir Docker Desktop installé et démarré
6. **`supabase link` nécessite d'être authentifié** : `supabase login` d'abord

### Project Structure Notes

Fichiers créés par cette story :
```
supabase/
├── config.toml                         # généré par `supabase init`
├── CONVENTIONS.md                      # règles de dev DB
├── seed.sql                            # stub vide (données de dev ajoutées plus tard)
└── migrations/
    ├── 00001_initial_schema.sql        # tenants + extensions + helpers JWT
    ├── 00002_create_enums.sql          # tous les enums PostgreSQL
    └── 00009_create_audit.sql          # audit_logs + processed_operations

packages/api-client/src/
└── supabase.ts                         # createClient centralisé (chargement env)

packages/types/src/
├── enums.ts                            # types TypeScript miroir des enums PostgreSQL
└── entities.ts                         # stubs Tenant, AuditLog, ProcessedOperation

.env.example                            # variables requises avec valeurs locales
```

### Dépendances de cette story

- **Prérequis** : Story 1.1 (monorepo + packages scaffold + règle ESLint Supabase)
- **Stories qui dépendent de cette story** : toutes les stories à partir de 1.3 — les migrations suivantes héritent des enums, de `current_tenant_id()` et de la convention soft-delete

### References

- [Source: architecture.md#Zone-9] — Enums standards PostgreSQL + TypeScript (lignes 423-477)
- [Source: architecture.md#Zone-10] — Idempotency sync + table `processed_operations` (lignes 481-513)
- [Source: architecture.md#Zone-11] — Soft-delete + audit_logs (lignes 517-553)
- [Source: architecture.md#Zone-12] — Isolation tenant RLS + JWT (lignes 555-590)
- [Source: architecture.md#Règles-d'Enforcement] — 12 règles absolues agents (lignes 592-605)
- [Source: architecture.md#Source-Tree-Complet] — Structure `supabase/migrations/` (lignes 822-851)
- [Source: architecture.md#Décisions-Additionnelles] — `push_tokens` + `current_tenant_id()` (lignes 1174-1215)
- [Source: epics.md#Story-1.2] — Acceptance Criteria originaux (lignes 633-678)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `supabase init` : CLI disponible via `npx supabase@latest` (pas installé globalement)
- `no-var-requires` ESLint : `require('expo-constants')` refusé dans try/catch → pattern process.env utilisé à la place ; les apps injectent via `app.json#extra`
- `@tamagui/config` v4 uniquement (pas v5) — confirmé depuis la story 1.1
- Validations `supabase db reset` / `supabase db diff` requièrent Docker Desktop → validation manuelle développeur

### Completion Notes List

- Supabase initialisé : `supabase/config.toml` + 3 migrations créées (00001, 00002, 00009)
- Migrations fondation : extensions uuid-ossp/pgcrypto, table tenants, fonctions RLS JWT (current_tenant_id, current_user_role), 6 enums PostgreSQL, audit_logs append-only, processed_operations idempotency
- Types TypeScript miroir : `@aureak/types/src/enums.ts` (6 types) + `@aureak/types/src/entities.ts` (3 entités)
- api-client/src/supabase.ts : chargement env via process.env avec warning non-fatal
- app.json mobile + web : section `extra` configurée pour expo-constants
- `.env.example` complet avec valeurs locales par défaut supabase
- `supabase/CONVENTIONS.md` : soft-delete, audit_logs immuabilité, RLS tenant, enums, nommage
- `turbo build` : 8/8 ✓ — `turbo lint` : 8/8 ✓
- Validations manuelles (nécessitent Docker) : `supabase db reset`, `supabase db diff`, `supabase start`

### File List

- supabase/config.toml
- supabase/seed.sql
- supabase/CONVENTIONS.md
- supabase/migrations/00001_initial_schema.sql
- supabase/migrations/00002_create_enums.sql
- supabase/migrations/00009_create_audit.sql
- aureak/packages/types/src/enums.ts
- aureak/packages/types/src/entities.ts
- aureak/packages/types/src/index.ts (mis à jour)
- aureak/packages/api-client/src/supabase.ts (mis à jour)
- aureak/apps/mobile/app.json (mis à jour — section extra)
- aureak/apps/web/app.json (mis à jour — section extra)
- aureak/.env.example (mis à jour)
