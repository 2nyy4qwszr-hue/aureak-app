# Story 2.3 : Accès Temporaire Cross-Implantation Coach

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux accorder un accès temporaire à un Coach sur une implantation tierce via une table dédiée,
Afin de gérer les remplacements avec traçabilité complète et révocation automatique à expiration.

## Acceptance Criteria

**AC1 — Table `coach_access_grants` créée**
- **Given** un Admin connecté et un Coach assigné à l'implantation A
- **When** l'Admin crée un enregistrement dans `coach_access_grants`
- **Then** la table contient : `id UUID PK`, `coach_id UUID NOT NULL`, `implantation_id UUID NOT NULL`, `granted_by UUID NOT NULL`, `expires_at TIMESTAMPTZ NOT NULL`, `tenant_id UUID NOT NULL`, `revoked_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`

**AC2 — Accès RLS pendant la fenêtre de grant**
- **And** les policies RLS de `sessions` et `attendances` *(ajoutées dans leurs stories respectives via `00010_rls_policies.sql`)* incluront :
  ```sql
  OR EXISTS (
    SELECT 1 FROM coach_access_grants
    WHERE coach_id = auth.uid()
      AND implantation_id = sessions.implantation_id
      AND expires_at > now()
      AND revoked_at IS NULL
  )
  ```
- **And** le Coach voit et opère sur les séances de l'implantation B uniquement pendant la fenêtre active

**AC3 — Expiration automatique**
- **And** à expiration (`expires_at < now()`), l'accès disparaît automatiquement — la condition RLS suffit, aucun job de nettoyage requis

**AC4 — Audit trail**
- **And** chaque grant créé est journalisé dans `audit_logs` avec `entity_type = 'coach_access_grant'`, `entity_id = grant.id`, `action = 'grant_created'`, `metadata = { coach_id, implantation_id, granted_by, expires_at }`

**AC5 — Révocation manuelle**
- **And** l'Admin peut révoquer un grant : `UPDATE coach_access_grants SET revoked_at = now()` — révocation journalisée dans `audit_logs` (`action = 'grant_revoked'`)
- **And** après révocation, le Coach perd immédiatement l'accès (RLS vérifie `revoked_at IS NULL`)

**AC6 — UI Admin : gestion des grants**
- **And** l'Admin peut lister les grants actifs (filtrés `expires_at > now() AND revoked_at IS NULL`) et en révoquer un depuis `apps/web/app/(admin)/access-grants/`

**AC7 — Migration propre**
- **And** `supabase db diff` reste clean après application de la migration

## Tasks / Subtasks

- [x] Task 1 — Migration : table `coach_access_grants` (AC: #1, #3)
  - [x] 1.1 Ajout dans `supabase/migrations/00010_rls_policies.sql` (section Story 2.3)
  - [x] 1.2 RLS activé + policies : `cag_tenant_read`, `cag_admin_write`, `cag_coach_own_read`
  - [x] 1.3 Index partiels `WHERE revoked_at IS NULL` sur `(coach_id, expires_at)` et `(implantation_id, expires_at)`
  - [ ] 1.4 Vérifier `supabase db reset` et `supabase db diff` clean (validation manuelle — nécessite Docker)

- [x] Task 2 — Documenter le pattern dans `00010_rls_policies.sql` (AC: #2)
  - [x] 2.1 Pattern `coach_assigned_or_granted` commenté dans `00010_rls_policies.sql` — prêt pour Story 4.1 et 5.1

- [x] Task 3 — `@aureak/api-client` : CRUD grants (AC: #4, #5, #6)
  - [x] 3.1 `packages/api-client/src/access-grants.ts` : `createGrant` (+ audit trail), `listActiveGrants`, `revokeGrant` (+ audit trail, idempotent)
  - [x] 3.2 Exporté depuis `packages/api-client/src/index.ts`

- [x] Task 4 — UI Admin (web) (AC: #6)
  - [x] 4.1 `apps/web/app/(admin)/access-grants/page.tsx` — liste grants actifs + révocation
  - [x] 4.2 `apps/web/app/(admin)/access-grants/new.tsx` — formulaire UUID coach/implantation + date expiration
  - [x] 4.3 Validation Zod : `expires_at` > `new Date()` ✓

- [x] Task 5 — Types TypeScript (AC: #1)
  - [x] 5.1 `CoachAccessGrant` ajouté dans `packages/types/src/entities.ts`

## Dev Notes

### Schéma `coach_access_grants`

```sql
-- Section Story 2.3 dans supabase/migrations/00010_rls_policies.sql

CREATE TABLE coach_access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  coach_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  implantation_id UUID NOT NULL,  -- FK vers implantations ajoutée en Story 4.1
  granted_by      UUID NOT NULL REFERENCES profiles(user_id),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,    -- NULL = actif, non-NULL = révoqué manuellement
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cag_tenant_idx    ON coach_access_grants (tenant_id);
CREATE INDEX cag_coach_exp_idx ON coach_access_grants (coach_id, expires_at)
  WHERE revoked_at IS NULL;  -- index partiel : uniquement les grants non révoqués
CREATE INDEX cag_impl_exp_idx  ON coach_access_grants (implantation_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE coach_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON coach_access_grants
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "admin_full" ON coach_access_grants
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "coach_own_read" ON coach_access_grants
  FOR SELECT USING (coach_id = auth.uid());
```

**Index partiel** `WHERE revoked_at IS NULL` : optimise les requêtes RLS qui vérifient les grants actifs — PostgreSQL n'indexe que les lignes non révoquées, réduisant la taille de l'index au fil du temps.

### Pattern RLS pour `sessions` et `attendances` — à intégrer en Stories 4.1 / 5.1

```sql
-- À ajouter dans la policy SELECT coach sur sessions (Story 4.1) :
CREATE POLICY "coach_assigned_or_granted" ON sessions
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND (
      -- Coach de l'implantation permanente
      EXISTS (
        SELECT 1 FROM coach_implantation_assignments cia
        WHERE cia.coach_id = auth.uid()
          AND cia.implantation_id = sessions.implantation_id
      )
      OR
      -- Grant temporaire actif
      EXISTS (
        SELECT 1 FROM coach_access_grants cag
        WHERE cag.coach_id = auth.uid()
          AND cag.implantation_id = sessions.implantation_id
          AND cag.expires_at > now()
          AND cag.revoked_at IS NULL
      )
    )
  );
```

### Audit trail dans `createGrant()`

```typescript
// packages/api-client/src/access-grants.ts
export async function createGrant(params: {
  coachId: string
  implantationId: string
  expiresAt: string  // ISO 8601
  tenantId: string
  grantedBy: string
}): Promise<CoachAccessGrant> {
  const { data: grant, error } = await supabase
    .from('coach_access_grants')
    .insert({
      coach_id       : params.coachId,
      implantation_id: params.implantationId,
      expires_at     : params.expiresAt,
      tenant_id      : params.tenantId,
      granted_by     : params.grantedBy,
    })
    .select()
    .single()

  if (error) throw error

  // Audit trail obligatoire (AC4)
  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.grantedBy,
    entity_type: 'coach_access_grant',
    entity_id  : grant.id,
    action     : 'grant_created',
    metadata   : {
      coach_id        : params.coachId,
      implantation_id : params.implantationId,
      granted_by      : params.grantedBy,
      expires_at      : params.expiresAt,
    },
  })

  return grant
}
```

### Type TypeScript

```typescript
// packages/types/src/entities.ts — ajout
export type CoachAccessGrant = {
  id            : string
  tenantId      : string
  coachId       : string
  implantationId: string
  grantedBy     : string
  expiresAt     : string   // ISO 8601
  revokedAt     : string | null
  createdAt     : string
}
```

### Pièges courants à éviter

1. **La FK vers `implantations(id)` n'existe pas encore** — `implantations` est créée en Story 4.1. Laisser sans contrainte FK pour l'instant ; l'ajouter via `ALTER TABLE coach_access_grants ADD CONSTRAINT fk_implantation FOREIGN KEY (implantation_id) REFERENCES implantations(id)` en Story 4.1
2. **Ne pas créer un job cron pour l'expiration** — la condition `expires_at > now()` dans RLS suffit pour l'expiration automatique. Un job de purge des vieux grants peut être ajouté en Epic 10 si nécessaire
3. **`revoked_at` vs suppression physique** — soft-revoke uniquement (convention projet) ; jamais de `DELETE` sur `coach_access_grants`
4. **L'audit trail écrit dans `audit_logs`** via `supabase.from('audit_logs').insert(...)` depuis le client avec `anon key` — vérifier que la policy `insert_only_base` de `audit_logs` autorise cet insert (tenant_id correct dans le JWT)

### Dépendances de cette story

- **Prérequis** : Story 2.2 (`coach_implantation_assignments`, `is_active_user()`, `current_tenant_id()`)
- **À compléter en Story 4.1** : FK `implantations` + ajout de la clause grant dans les policies `sessions`
- **À compléter en Story 5.1** : ajout de la clause grant dans les policies `attendances`

### References

- [Source: epics.md#Story-2.3] — Acceptance Criteria originaux (lignes 787-811)
- [Source: architecture.md#Zone-12] — Isolation tenant RLS (lignes 555-590)
- [Source: epics.md#Story-2.2-AC5] — Coach accède uniquement aux implantations assignées (ligne 780)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Table `coach_access_grants` ajoutée à 00010_rls_policies.sql (section Story 2.3)
- Index partiels `WHERE revoked_at IS NULL` : optimisent les requêtes RLS (seuls les grants actifs sont indexés)
- `createGrant` et `revokeGrant` : audit trail systématique dans `audit_logs`
- `revokeGrant` : idempotent (`.is('revoked_at', null)` empêche double révocation)
- Pattern `coach_assigned_or_granted` commenté pour référence Stories 4.1/5.1
- FK vers `implantations(id)` laissée pour Story 4.1 (table non existante)
- Typechecks ✓ — lint ✓ — 7/11 tests (4 skippés sans Supabase local)

### File List

- supabase/migrations/00010_rls_policies.sql (modifié — section Story 2.3 ajoutée)
- packages/types/src/entities.ts (modifié — CoachAccessGrant)
- packages/api-client/src/access-grants.ts
- packages/api-client/src/index.ts (modifié)
- apps/web/app/(admin)/access-grants/page.tsx
- apps/web/app/(admin)/access-grants/new.tsx
- apps/web/app/(admin)/_layout.tsx (modifié)
