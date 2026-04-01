# Story 10.4 : Audit Trail Admin — Policies Complètes, Indexes & Rétention

Status: done

## Story

En tant qu'Admin,
Je veux que le journal d'audit soit pleinement opérationnel avec des policies RLS strictes, des indexes performants, une durée de conservation configurable et une interface de consultation,
Afin de démontrer la conformité RGPD et de retracer tout incident de sécurité.

## Acceptance Criteria

**AC1 — Policies RLS complètes sur `audit_logs`**
- **When** la migration Story 10.4 est exécutée
- **Then** policies `admin_read`, `insert_only`, `no_update`, `no_delete` remplacent la policy de base Story 1.2

**AC2 — Indexes performants**
- **And** `audit_logs_tenant_user ON (tenant_id, user_id, created_at DESC)`
- **And** `audit_logs_entity ON (tenant_id, entity_type, entity_id)`

**AC3 — Table `tenant_retention_settings`**
- **And** durée de conservation configurable par tenant (défaut 5 ans, minimum 5 ans)

**AC4 — Edge Function `purge-expired-audit-logs`**
- **And** cron mensuel : supprime entrées dont `created_at < now() - retention_years`

**AC5 — UI "Journal d'Audit"**
- **And** filtres : utilisateur, action, type d'entité, plage de dates
- **And** export CSV via Edge Function `export-audit-logs` (tracé dans audit_logs lui-même)

**AC6 — Insertion obligatoire par RPCs sensibles**
- **And** `suspend_user`, `revoke_consent`, `submit_gdpr_request`, `bulk_assign_group_members`, `admin_message_sent`, `anomaly_resolved` insèrent dans `audit_logs`

**AC7 — Couverture FRs**
- **And** FR99–FR100 couverts : audit trail complet filtrable, conservation ≥ 5 ans
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00026_audit_policies.sql` (AC: #1, #2, #3)
  - [ ] 1.1 DROP policy de base + CREATE 4 policies strictes
  - [ ] 1.2 CREATE 2 indexes
  - [ ] 1.3 Créer `tenant_retention_settings`

- [ ] Task 2 — Edge Function `purge-expired-audit-logs` (AC: #4)
  - [ ] 2.1 Cron mensuel via pg_cron
  - [ ] 2.2 DELETE WHERE `created_at < now() - (retention_years || ' years')::INTERVAL`

- [ ] Task 3 — Edge Function `export-audit-logs` (AC: #5)
  - [ ] 3.1 Admin uniquement, paramètres filtres, CSV, Storage, lien signé
  - [ ] 3.2 Tracer l'export lui-même dans `audit_logs`

- [ ] Task 4 — UI Admin Journal d'Audit (AC: #5)
  - [ ] 4.1 `apps/web/app/(admin)/audit/index.tsx` avec filtres

- [ ] Task 5 — Vérification insertions (AC: #6)
  - [ ] 5.1 Audit-checker : vérifier que toutes RPCs sensibles insèrent dans `audit_logs`

## Dev Notes

### Migration `00026_audit_policies.sql`

```sql
-- Remplace la policy de base Story 1.2
DROP POLICY IF EXISTS "insert_only_base" ON audit_logs;

CREATE POLICY "admin_read" ON audit_logs
  FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "insert_only" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "no_update" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON audit_logs FOR DELETE USING (false);

-- Indexes performants
CREATE INDEX IF NOT EXISTS audit_logs_tenant_user
  ON audit_logs (tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity
  ON audit_logs (tenant_id, entity_type, entity_id);

-- Rétention configurable
CREATE TABLE tenant_retention_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id),
  retention_years INTEGER NOT NULL DEFAULT 5 CHECK (retention_years >= 5),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenant_retention_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_retention_settings
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON tenant_retention_settings
  FOR ALL USING (current_user_role() = 'admin');
```

### Edge Function `purge-expired-audit-logs`

```typescript
// supabase/functions/purge-expired-audit-logs/index.ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Pour chaque tenant, récupérer sa durée de rétention
  const { data: settings } = await supabase
    .from('tenant_retention_settings')
    .select('tenant_id, retention_years')

  for (const s of settings ?? []) {
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - s.retention_years)

    await supabase
      .from('audit_logs')
      .delete()
      .eq('tenant_id', s.tenant_id)
      .lt('created_at', cutoff.toISOString())
  }

  return new Response(JSON.stringify({ ok: true }))
})
```

**Note** : La purge est la seule exception à l'immuabilité de `audit_logs`. Elle est exécutée avec `service_role` (contourne les policies RLS `no_delete`).

### Dépendances

- **Prérequis** : Story 1.2 (audit_logs créée) + Story 10.1–10.3 (RPCs sensibles qui alimentent audit_logs)

### References
- [Source: epics.md#Story-10.4] — lignes 3326–3374

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
