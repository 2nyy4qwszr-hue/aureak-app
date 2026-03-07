# Conventions de développement — Supabase / PostgreSQL

## 1. Convention soft-delete (toutes les tables métier)

Toutes les tables métier DOIVENT inclure ces colonnes de cycle de vie :

```sql
created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at   TIMESTAMPTZ NULL,          -- NULL = actif ; valeur = supprimé logiquement
deleted_by   UUID NULL REFERENCES auth.users(id)
```

**Règles :**
- Jamais de `DELETE` SQL dans le code applicatif
- Toutes les lectures incluent `WHERE deleted_at IS NULL`
- Le hard delete est **réservé** aux jobs RGPD automatisés (Edge Functions avec `service_role`)

**Exceptions :** `audit_logs` et `processed_operations` n'ont pas de soft-delete (immuabilité par design).

## 2. Table `audit_logs` — immuabilité absolue (append-only)

- **Aucun UPDATE ni DELETE** ne doit jamais être exécuté sur `audit_logs`
- Les policies RLS bloquent UPDATE et DELETE (enforced en Story 10.4)
- Insérer uniquement via la couche application (`@aureak/api-client`)
- Ne jamais créer de FK depuis `audit_logs` vers des tables modifiables

## 3. Nommage des tables

- `snake_case` pluriel exclusivement : `sessions`, `session_themes`, `audit_logs`, etc.
- Pas de préfixe `tbl_` ou similaire
- Noms anglais (pas de mélange français/anglais)

## 4. Isolation tenant — règle absolue (Zone 12 architecture)

- L'isolation tenant est garantie par **RLS PostgreSQL + JWT claims** uniquement
- Headers HTTP custom (`X-Tenant-Id`) sont **informatifs** — jamais source d'autorisation
- Pattern obligatoire sur toutes les tables multi-tenant :

```sql
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON ma_table
  FOR ALL USING (tenant_id = current_tenant_id());
```

- Jamais de filtrage `WHERE tenant_id = $1` côté client
- `current_tenant_id()` et `current_user_role()` sont les seules sources d'autorisation

## 5. Enums PostgreSQL

- Tout nouvel enum PostgreSQL DOIT avoir son miroir TypeScript dans `@aureak/types/src/enums.ts`
- Les deux (DB enum + TypeScript union type) sont mis à jour dans la même PR
- Ne jamais modifier les valeurs d'un enum existant sans migration de renommage
- Référence : `supabase/migrations/00002_create_enums.sql`

## 6. Variables sensibles

- `SUPABASE_SERVICE_ROLE_KEY` : **jamais** dans les apps ou côté client
- Réservé aux Edge Functions, CI/CD, scripts admin
- Toujours utiliser les variables préfixées `EXPO_PUBLIC_` uniquement pour les valeurs client-safe

## 7. Ordre des migrations

Migrations numérotées par ordre d'application (alphabétique par Supabase) :

| Fichier | Contenu | Story |
|---|---|---|
| `00001_initial_schema.sql` | Extensions, `tenants`, fonctions helper JWT | 1.2 |
| `00002_create_enums.sql` | Tous les enums PostgreSQL | 1.2 |
| `00003_create_profiles.sql` | `profiles` + grades coach | 2.1 |
| `00004_create_sessions.sql` | `sessions`, `session_themes`, `locations` | 4.1 |
| `00004b_create_push_tokens.sql` | `push_tokens` | 7.1 |
| `00005_create_attendance.sql` | Présences | 5.1 |
| `00006_create_evaluations.sql` | Évaluations | 6.1 |
| `00007_create_content.sql` | Référentiel pédagogique | 3.1 |
| `00008_create_quizzes.sql` | Quiz results | 8.1 |
| `00009_create_audit.sql` | `audit_logs` + `processed_operations` | 1.2 |
| `00010_rls_policies.sql` | Toutes les RLS policies complètes | 2.2 |
