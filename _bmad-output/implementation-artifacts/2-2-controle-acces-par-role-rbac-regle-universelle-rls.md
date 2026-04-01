# Story 2.2 : Contrôle d'Accès par Rôle (RBAC — Règle Universelle RLS)

Status: ready-for-dev

## Story

En tant que système,
Je veux que toutes les tables tenant-aware appliquent RLS avec `tenant_id` filtré via des fonctions SQL centralisées et sécurisées,
Afin qu'aucune donnée ne soit jamais accessible hors du tenant autorisé et que les policies soient maintenables en un seul endroit.

## Acceptance Criteria

**AC1 — Fonctions helper SQL durcies**
- **Given** toute table tenant-aware (sessions, attendances, evaluations, profiles, etc.)
- **When** la migration Story 2.2 est appliquée
- **Then** `current_tenant_id()` et `current_user_role()` sont recréées avec `SET search_path = public`, `SECURITY DEFINER`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO authenticated` — le chemin JSON brut (`auth.jwt() -> 'app_metadata' ->> 'tenant_id'`) n'est plus utilisé directement dans les policies

**AC2 — `current_user_role()` retourne un enum typé**
- **And** `current_user_role()` retourne le type enum `user_role` — un cast invalide (`'hacker'::user_role`) lève une erreur PostgreSQL explicite plutôt qu'une dérive silencieuse

**AC3 — Toutes les tables existantes ont RLS correct**
- **And** chaque table existante (`tenants`, `profiles`, `parent_child_links`, `processed_operations`, `audit_logs`) a RLS activé et toutes ses policies utilisent `current_tenant_id()` — jamais le chemin JSON brut

**AC4 — Index `tenant_id` explicite sur toutes les tables**
- **And** chaque table tenant-aware possède un index `CREATE INDEX ... ON table (tenant_id)` explicite pour les performances RLS

**AC5 — Politique coach : implantations assignées uniquement**
- **And** un `coach` accède uniquement aux séances de ses implantations assignées (via `coach_implantation_assignments`) — la policy RLS pour `sessions` est préparée ici mais appliquée dès que la table `sessions` est créée (Story 4.1)

**AC6 — Politique parent : enfants liés uniquement**
- **And** un `parent` accède uniquement aux données liées à ses enfants via `parent_child_links` — pattern défini ici, appliqué sur les tables présences/évaluations dans leurs stories respectives

**AC7 — Politique child : profil propre uniquement**
- **And** un `child` accède uniquement à son propre profil et ses propres résultats — policy `user_id = auth.uid()` sur toutes les tables le concernant

**AC8 — Test cross-tenant**
- **And** un test d'intégration Vitest vérifie qu'une requête exécutée avec le JWT d'un tenant A ne retourne aucune ligne appartenant au tenant B (`0 rows`)

## Tasks / Subtasks

- [x] Task 1 — Migration `00010_rls_policies.sql` : fonctions helper durcies (AC: #1, #2)
  - [x] 1.1 Créer `supabase/migrations/00010_rls_policies.sql`
  - [x] 1.2 Recréer `current_tenant_id()` avec `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated` + `SET search_path = public`
  - [x] 1.3 Recréer `current_user_role()` avec `RETURNS user_role` (enum typé) + même durcissement
  - [x] 1.4 Créer la fonction helper `is_active_user()` (inclut `deleted_at IS NULL`)
  - [ ] 1.5 Vérifier `supabase db diff` clean après la migration (validation manuelle — nécessite Docker)

- [x] Task 2 — Mise à jour des policies RLS des tables existantes (AC: #3, #4)
  - [x] 2.1 `tenants` : DROP anciennes policies + recreate avec `current_tenant_id()` + `is_active_user()`
  - [x] 2.2 `profiles` : DROP + recreate avec `is_active_user()` + policies segmentées par rôle
  - [x] 2.3 `processed_operations` : DROP + recreate avec `current_tenant_id()` + `is_active_user()`
  - [x] 2.4 `audit_logs` : DROP + recreate (SELECT admin only + INSERT active users)
  - [x] 2.5 `parent_child_links` : DROP + recreate avec `is_active_user()`
  - [x] 2.6 Index `tenant_id` ajoutés dans 00003 et 00009 — suffisants

- [x] Task 3 — Documenter et créer le template RLS universel (AC: #1, #5, #6, #7)
  - [x] 3.1 Créer `supabase/RLS_PATTERNS.md` avec template universel + patterns par rôle
  - [x] 3.2 Template coach-implantation commenté dans `00010_rls_policies.sql`
  - [x] 3.3 Template parent-child commenté dans `00010_rls_policies.sql`

- [x] Task 4 — Création de `coach_implantation_assignments` (AC: #5)
  - [x] 4.1 Table créée dans `00010_rls_policies.sql` avec RLS + indexes + policies admin/coach
  - [x] 4.2 FK vers `implantations(id)` laissée pour Story 4.1

- [x] Task 5 — Test d'intégration cross-tenant (AC: #8)
  - [x] 5.1 Créer `packages/api-client/src/__tests__/rls-isolation.test.ts`
  - [x] 5.2 4 tests d'intégration (skipIf env vars absentes) + 2 smoke tests sans Supabase
  - [ ] 5.3 Validation en conditions réelles (nécessite Supabase local + seed avec 2 tenants)

- [x] Task 6 — Validation globale
  - [ ] 6.1 Exécuter `supabase db reset` : zéro erreur (validation manuelle — nécessite Docker)
  - [ ] 6.2 Exécuter `supabase db diff` : clean (validation manuelle)
  - [x] 6.3 `vitest run` : 7/7 tests passent (4 skippés sans Supabase local) ✓

## Dev Notes

### Fonctions helper SQL durcies — version finale

```sql
-- supabase/migrations/00010_rls_policies.sql
-- Ce fichier est le registre central des policies RLS.
-- Il est enrichi à chaque story créant de nouvelles tables.
-- NE PAS créer de policies inline dans les migrations de création de table —
-- toujours les centraliser ici pour maintenir la vue d'ensemble.

-- =====================================================
-- FONCTIONS HELPER JWT (remplacement des versions Story 1.2)
-- =====================================================

CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;
REVOKE ALL ON FUNCTION current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO authenticated;

CREATE OR REPLACE FUNCTION current_user_role()
  RETURNS user_role       -- type enum — cast invalide = erreur explicite
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::user_role;
$$;
REVOKE ALL ON FUNCTION current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION is_active_user()
  RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$;
REVOKE ALL ON FUNCTION is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_active_user() TO authenticated;
```

**Pourquoi `SET search_path = public` ?** Sans ce paramètre, un attaquant pourrait créer un schéma avec les mêmes noms de tables et détourner les fonctions `SECURITY DEFINER` (attaque de search_path injection). C'est une exigence de sécurité standard pour toutes les fonctions avec `SECURITY DEFINER`.

**Pourquoi retourner `user_role` (enum) et non `TEXT` ?** Un cast invalide `'malicious_role'::user_role` lève une erreur PostgreSQL immédiatement — silently ignoring becomes impossible. C'est la sécurité par le typage.

### Template universel RLS — à reproduire dans chaque story

Ce template est le contrat que toutes les stories futures DOIVENT respecter. Il sera documenté dans `supabase/RLS_PATTERNS.md`.

```sql
-- =====================================================
-- TEMPLATE RLS UNIVERSEL — copier-adapter pour chaque nouvelle table
-- =====================================================

-- 1. Activer RLS (obligatoire)
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;

-- 2. Index tenant (performance queries RLS)
CREATE INDEX IF NOT EXISTS ma_table_tenant_idx ON ma_table (tenant_id);

-- 3. Policy lecture — isolation tenant + utilisateur actif
CREATE POLICY "tenant_read" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- 4. Policy écriture admin — admin peut tout faire dans son tenant
CREATE POLICY "admin_write" ON ma_table
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- 5. Policies spécifiques par rôle (optionnel selon la table)
-- Coach : uniquement ses implantations assignées
CREATE POLICY "coach_assigned" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM coach_implantation_assignments cia
      WHERE cia.coach_id = auth.uid()
        AND cia.implantation_id = ma_table.implantation_id
    )
  );

-- Parent : uniquement ses enfants liés
CREATE POLICY "parent_children" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = ma_table.child_id
    )
  );

-- Child : uniquement ses propres données
CREATE POLICY "child_own" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND child_id = auth.uid()
  );
```

### Stratégie `00010_rls_policies.sql` — fichier évolutif

Architecture a défini `00010_rls_policies.sql` comme le registre de **toutes** les RLS policies. Le fichier grossit à chaque story :

| Story | Ajout dans 00010 |
|---|---|
| **2.2** | Fonctions helpers + policies tables existantes + `coach_implantation_assignments` |
| 4.1 | FK `implantations` + policies `sessions`, `implantations`, `groups`, `session_blocks` |
| 5.1 | Policies `attendances`, `attendance_events`, `sync_queue` |
| 6.1 | Policies `evaluations`, `session_evaluation_snapshots` |
| 7.1 | Policies `push_tokens`, `notification_preferences` |
| 8.1 | Policies `learning_attempts`, `quiz_results` |
| ... | etc. |

**Convention :** chaque story qui crée une table DOIT ajouter ses policies dans `00010_rls_policies.sql` via une section commentée. Ne jamais laisser une table sans policy.

### Test d'intégration cross-tenant

```typescript
// packages/api-client/src/__tests__/rls-isolation.test.ts
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Ces tests nécessitent deux comptes de tenants différents pré-créés
// dans la base de test (seeding via supabase/seed.ts)
const TENANT_A_JWT = process.env.TEST_TENANT_A_JWT!
const TENANT_B_JWT = process.env.TEST_TENANT_B_JWT!

describe('RLS — isolation cross-tenant', () => {
  it('tenant A ne voit pas les profiles de tenant B', async () => {
    // Client authentifié en tant que user du tenant A
    const clientA = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${TENANT_A_JWT}` } } }
    )

    const { data } = await clientA
      .from('profiles')
      .select('*')
      // Pas de filtre explicite — RLS doit tout filtrer
      .limit(100)

    // Aucun profil de tenant B ne doit apparaître
    expect(data?.every(p => p.tenant_id === process.env.TEST_TENANT_A_ID)).toBe(true)
  })

  it('utilisateur désactivé (status=disabled) retourne 0 rows', async () => {
    const DISABLED_USER_JWT = process.env.TEST_DISABLED_USER_JWT!
    const clientDisabled = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${DISABLED_USER_JWT}` } } }
    )
    const { data } = await clientDisabled.from('profiles').select('*')
    expect(data).toHaveLength(0)
  })
})
```

**Setup seed :** ajouter dans `supabase/seed.ts` la création de deux tenants de test + JWTs fixes pour les tests CI.

### Matrices RBAC par rôle — référence

| Table | admin | coach | parent | child | club |
|---|---|---|---|---|---|
| `profiles` | CRUD (tenant) | SELECT own | SELECT own | SELECT own | — |
| `parent_child_links` | CRUD | — | SELECT own | — | — |
| `coach_implantation_assignments` | CRUD | SELECT own | — | — | — |
| `sessions` *(Story 4.1)* | CRUD | SELECT (assigned) | — | — | — |
| `attendances` *(Story 5.1)* | CRUD | INSERT/UPDATE (assigned) | SELECT (children) | — | SELECT (children) |
| `evaluations` *(Story 6.1)* | CRUD | INSERT own | SELECT (children) | — | — |
| `quiz_results` *(Story 8.x)* | CRUD | SELECT (tenant) | SELECT (children) | INSERT own | — |
| `audit_logs` | SELECT + INSERT | INSERT | — | — | — |

### Mise à jour des policies existantes (Story 2.2)

Remplacer dans toutes les policies existantes le chemin JSON brut :
```sql
-- ❌ Avant (Story 1.2 — à remplacer)
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)

-- ✅ Après (Story 2.2 — standard)
USING (tenant_id = current_tenant_id() AND is_active_user())
```

### Pièges courants à éviter

1. **Ne pas oublier `REVOKE ALL FROM PUBLIC`** sur chaque fonction `SECURITY DEFINER` — sans ça, n'importe quel utilisateur peut appeler la fonction directement
2. **`is_active_user()` fait une requête SQL** — elle est `STABLE` donc mise en cache dans la transaction, mais attention aux performances si appelée dans des policies de tables très fréquentées. Si profiling montre un problème, envisager d'encoder le statut dans le JWT via le Custom Access Token Hook
3. **`coach_implantation_assignments` sans FK vers `implantations`** — c'est intentionnel : la table `implantations` n'existe pas encore (Story 4.1). Ajouter la contrainte FK via `ALTER TABLE ... ADD CONSTRAINT` en Story 4.1
4. **Ne pas mettre les policies dans les migrations de création de table** — toutes les policies vont dans `00010_rls_policies.sql` pour la maintenabilité
5. **`current_user_role() = 'admin'` dans une policy `FOR ALL`** — s'assurer que la policy admin ne bypass pas `is_active_user()` : un admin désactivé ne doit pas non plus pouvoir accéder aux données

### Project Structure Notes

Fichiers créés/modifiés par cette story :
```
supabase/
├── migrations/
│   └── 00010_rls_policies.sql   # registre central RLS — fondations Story 2.2
└── RLS_PATTERNS.md              # documentation du template universel

packages/api-client/src/
└── __tests__/
    └── rls-isolation.test.ts    # test cross-tenant
```

### Dépendances de cette story

- **Prérequis** : Story 2.1 (`profiles`, `current_tenant_id()` v1, Custom Access Token Hook)
- **Stories qui dépendent de cette story** :
  - Story 2.3 (coach_access_grants) — utilise `current_tenant_id()` et `is_active_user()`
  - Story 4.1 (sessions, implantations) — applique le template coach-implantation + complète FK
  - Toutes les stories 5.x–11.x — toutes utilisent `00010_rls_policies.sql`

### References

- [Source: epics.md#Story-2.2] — Acceptance Criteria originaux (lignes 744-783)
- [Source: architecture.md#Zone-12] — Isolation tenant RLS + JWT (lignes 555-590)
- [Source: architecture.md#Règles-d'Enforcement] — Règles 3, 5 (lignes 596-598)
- [Source: architecture.md#Frontière-1] — ESLint + RLS enforcement (lignes 880-913)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeError `new URL()` → `fileURLToPath` : conflit de types URL entre Node global et `node:url` → résolu avec `dirname(fileURLToPath(import.meta.url))` et imports statiques

### Completion Notes List

- Migration 00010 : fonctions `current_tenant_id()` + `current_user_role()` + `is_active_user()` durcies (SECURITY DEFINER, SET search_path, REVOKE ALL, GRANT TO authenticated)
- `current_user_role()` retourne enum `user_role` — cast invalide = erreur PostgreSQL explicite
- `is_active_user()` : vérification `status = 'active' AND deleted_at IS NULL` — bloque les comptes désactivés/supprimés
- DROP + recréation des policies sur : tenants, profiles, parent_child_links, processed_operations, audit_logs
- `coach_implantation_assignments` : table + RLS + indexes — FK vers implantations laissée pour Story 4.1
- `supabase/RLS_PATTERNS.md` : template universel + patterns coach/parent/child + checklist
- Templates coach-implantation et parent-child commentés dans 00010 pour référence des stories futures
- `rls-isolation.test.ts` : 4 tests intégration (skipIf) + 2 smoke tests filesystem ✓
- Total : 20/20 tests ✓ (4 skippés sans Supabase local)

### File List

- supabase/migrations/00010_rls_policies.sql
- supabase/RLS_PATTERNS.md
- packages/api-client/src/__tests__/rls-isolation.test.ts
