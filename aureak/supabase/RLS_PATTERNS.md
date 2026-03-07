# RLS Patterns — Aureak

Référence des patterns RLS à utiliser dans chaque story créant une nouvelle table.
Toutes les policies sont centralisées dans `supabase/migrations/00010_rls_policies.sql`.

## Règles absolues

1. **Toujours activer RLS** : `ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;`
2. **Toujours créer l'index tenant** : `CREATE INDEX ON ma_table (tenant_id);`
3. **Toujours utiliser les fonctions helper** : jamais le chemin JSON brut `auth.jwt() -> 'app_metadata'`
4. **Toujours inclure `is_active_user()`** : un utilisateur désactivé ne peut accéder à rien
5. **Ne jamais créer de policies dans les migrations de création de table** : toutes dans `00010_rls_policies.sql`

## Fonctions helper disponibles

```sql
current_tenant_id()    -- UUID  : tenant_id depuis JWT app_metadata
current_user_role()    -- user_role (enum typé) : rôle depuis JWT app_metadata
is_active_user()       -- BOOLEAN : profil actif + non supprimé dans ce tenant
```

## Template universel

```sql
-- 1. Activer RLS
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;

-- 2. Index performance
CREATE INDEX IF NOT EXISTS ma_table_tenant_idx ON ma_table (tenant_id);

-- 3. Lecture — isolation tenant + utilisateur actif
CREATE POLICY "ma_table_tenant_read" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- 4. Admin — CRUD complet dans son tenant
CREATE POLICY "ma_table_admin_write" ON ma_table
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );
```

## Pattern coach — implantations assignées

Utiliser quand un coach n'accède qu'aux données de ses implantations.

```sql
CREATE POLICY "ma_table_coach_read" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM coach_implantation_assignments cia
      WHERE cia.coach_id = auth.uid()
        AND cia.implantation_id = ma_table.implantation_id
    )
  );
```

## Pattern parent — enfants liés

Utiliser quand un parent accède aux données de ses enfants.

```sql
CREATE POLICY "ma_table_parent_read" ON ma_table
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

## Pattern child — données propres

```sql
CREATE POLICY "ma_table_child_own" ON ma_table
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND child_id = auth.uid()
  );
```

## Pattern coach — écriture sur ses présences/évaluations

```sql
CREATE POLICY "ma_table_coach_write" ON ma_table
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM coach_implantation_assignments cia
      WHERE cia.coach_id = auth.uid()
        AND cia.implantation_id = ma_table.implantation_id
    )
  );
```

## Matrice RBAC par rôle

| Table | admin | coach | parent | child |
|---|---|---|---|---|
| `profiles` | CRUD tenant | SELECT own | SELECT own | SELECT own |
| `parent_child_links` | CRUD | — | SELECT own | — |
| `coach_implantation_assignments` | CRUD | SELECT own | — | — |
| `sessions` *(Story 4.1)* | CRUD | SELECT assigned | — | — |
| `attendances` *(Story 5.1)* | CRUD | INSERT/UPDATE assigned | SELECT children | — |
| `evaluations` *(Story 6.1)* | CRUD | INSERT own | SELECT children | — |
| `quiz_results` *(Story 8.x)* | CRUD | SELECT tenant | SELECT children | INSERT own |
| `audit_logs` | SELECT+INSERT | INSERT | — | — |

## Ajout d'une nouvelle table — checklist

- [ ] Créer la table dans sa migration (sans policies inline)
- [ ] Activer RLS dans la migration de création
- [ ] Ajouter `CREATE INDEX ... ON ma_table (tenant_id)` dans la migration
- [ ] Ouvrir `00010_rls_policies.sql` et ajouter une section commentée pour la table
- [ ] Appliquer le template universel + patterns spécifiques aux rôles concernés
- [ ] Valider avec `supabase db diff` après `supabase db reset`

## Pattern 2.6 — Référentiel Pédagogique (admin CRUD, coach SELECT, autres rien)

Ce pattern s'applique aux 15 tables du référentiel : `theme_groups`, `themes`, `theme_sequences`, `criteria`, `faults`, `cues`, `situation_groups`, `situations`, `situation_criteria`, `situation_theme_links`, `taxonomies`, `taxonomy_nodes`, `unit_classifications`, `quiz_questions`, `quiz_options`.

**Règle :** admin = CRUD dans son tenant, coach = SELECT dans son tenant, parent/child/club = 0 rows (deny-by-default, aucune policy explicite nécessaire).

```sql
-- Pattern à appliquer pour chaque table du référentiel :
CREATE POLICY "<table>_tenant_isolation" ON <table>
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "<table>_admin_full" ON <table>
  FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "<table>_coach_read" ON <table>
  FOR SELECT USING (
    current_user_role() = 'coach'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );
```

**DO block pour application en lot** (voir `00010_rls_policies.sql` section Story 2.6) — à activer après création des tables Epic 3.

| Table | admin | coach | parent | child | club |
|---|---|---|---|---|---|
| Toutes tables référentiel | CRUD (tenant) | SELECT (tenant) | — (0 rows) | — (0 rows) | — (0 rows) |
