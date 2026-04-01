# Registre des Patterns RLS — Aureak

Ce fichier est la référence normative pour implémenter Row Level Security dans ce projet.
Toute nouvelle table doit suivre ces patterns sans exception.

## Fonctions helper disponibles

| Fonction | Retour | Usage |
|---|---|---|
| `current_tenant_id()` | `UUID` | `tenant_id = current_tenant_id()` dans toutes les policies tenant-aware |
| `current_user_role()` | `user_role` (enum) | `current_user_role() = 'admin'` — cast invalide = erreur PostgreSQL explicite |
| `is_active_user()` | `BOOLEAN` | Toujours inclus — bloque les comptes désactivés ou supprimés |

Toutes les fonctions : `SECURITY DEFINER`, `SET search_path = public`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO authenticated`.

---

## Template universel — copier-adapter pour chaque nouvelle table

```sql
-- =====================================================
-- RLS : ma_table
-- =====================================================
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;

-- Index tenant (obligatoire pour les performances RLS)
CREATE INDEX IF NOT EXISTS ma_table_tenant_idx ON ma_table (tenant_id);

-- Lecture tenant : tout utilisateur actif du même tenant
DROP POLICY IF EXISTS "tenant_read" ON ma_table;
CREATE POLICY "tenant_read" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Écriture admin : CRUD complet dans le tenant
DROP POLICY IF EXISTS "admin_write" ON ma_table;
CREATE POLICY "admin_write" ON ma_table
  FOR ALL USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );
```

---

## Patterns par rôle

### Coach — implantations assignées uniquement

```sql
-- Coach accède uniquement aux données de ses implantations (permanent)
DROP POLICY IF EXISTS "coach_assigned" ON ma_table;
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

-- Coach — accès temporaire via grant (Story 2.3)
DROP POLICY IF EXISTS "coach_granted" ON ma_table;
CREATE POLICY "coach_granted" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM coach_access_grants cag
      WHERE cag.coach_id = auth.uid()
        AND cag.implantation_id = ma_table.implantation_id
        AND cag.expires_at > now()
        AND cag.revoked_at IS NULL
    )
  );
```

### Parent — enfants liés uniquement

```sql
-- Parent accède uniquement aux données de ses enfants
DROP POLICY IF EXISTS "parent_children" ON ma_table;
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
```

### Child — données propres uniquement

```sql
-- Child accède uniquement à ses propres données
DROP POLICY IF EXISTS "child_own" ON ma_table;
CREATE POLICY "child_own" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND child_id = auth.uid()
  );
```

---

## Matrice RBAC par table

| Table | admin | coach | parent | child | club |
|---|---|---|---|---|---|
| `profiles` | CRUD (tenant) | SELECT own | SELECT own | SELECT own | — |
| `parent_child_links` | CRUD | — | SELECT own | — | — |
| `coach_implantation_assignments` | CRUD | SELECT own | — | — | — |
| `coach_access_grants` | CRUD | SELECT own | — | — | — |
| `sessions` *(Story 4.1)* | CRUD | SELECT (assigned+granted) | — | — | — |
| `attendances` *(Story 5.1)* | CRUD | INSERT/UPDATE (assigned) | SELECT (children) | — | SELECT (children) |
| `evaluations` *(Story 6.1)* | CRUD | INSERT own | SELECT (children) | — | — |
| `quiz_results` *(Story 8.x)* | CRUD | SELECT (tenant) | SELECT (children) | INSERT own | — |
| `audit_logs` | SELECT + INSERT | INSERT | — | — | — |

---

## Checklist obligatoire pour chaque nouvelle table

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] `CREATE INDEX IF NOT EXISTS ..._tenant_idx ON ... (tenant_id);`
- [ ] Au moins une policy `FOR SELECT` avec `current_tenant_id() AND is_active_user()`
- [ ] Policy admin `FOR ALL` avec `current_user_role() = 'admin'`
- [ ] Toutes les policies préfixées `DROP POLICY IF EXISTS` (idempotence)
- [ ] Section ajoutée dans `supabase/migrations/00090_rls_policies_complete.sql`

---

## Pièges courants

1. **`REVOKE ALL FROM PUBLIC`** sur chaque fonction `SECURITY DEFINER` — obligatoire
2. **`is_active_user()` fait une requête SQL** — mise en cache `STABLE` par transaction, mais si performance dégradée : encoder `status` dans le JWT via le Custom Access Token Hook
3. **`coach_implantation_assignments` sans FK `implantations`** — intentionnel jusqu'à Story 4.1
4. **Ne pas créer des policies dans les migrations de table** — toujours dans `00090_rls_policies_complete.sql`
5. **Admin désactivé** — `is_active_user()` dans la policy admin garantit qu'un admin banni ne peut plus accéder aux données

---

## Registre des migrations RLS

| Migration | Story | Tables couvertes |
|---|---|---|
| `00090_rls_policies_complete.sql` | 2.2 | `tenants`, `profiles`, `parent_child_links`, `processed_operations`, `audit_logs`, `coach_implantation_assignments`, `coach_access_grants` |
| *(à compléter)* | 4.1 | `sessions`, `implantations`, `groups`, `session_blocks` — + FK `coach_implantation_assignments.implantation_id` |
| *(à compléter)* | 5.1 | `attendances`, `attendance_events`, `sync_queue` |
| *(à compléter)* | 6.1 | `evaluations`, `session_evaluation_snapshots` |
