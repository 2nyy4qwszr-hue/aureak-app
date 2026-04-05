# Migration Validator — Story 49-8
**Date** : 2026-04-05
**Migration** : `supabase/migrations/00116_create_fn_get_implantation_stats.sql`
**Auditeur** : QA Gate 1 Agent

---

## 1. Numérotation

**OBSERVATION — Saut de numérotation**
- Dernière migration précédente : `00113_create_v_club_gardien_stats.sql`
- Migrations 00114 et 00115 absentes du dossier
- Migration story-49-8 : `00116`

Ce saut (113 → 116) signale que des migrations 00114 et 00115 ont probablement été créées dans d'autres branches ou stories en cours. La migration 00116 peut entrer en conflit lors d'un merge si 00114/00115 créent ou modifient des tables référencées (implantations, sessions, attendances, evaluations).

**Recommandation** : Vérifier l'état des branches concurrentes avant de push. Non bloquant pour la migration elle-même.

---

## 2. Idempotence

**Pattern DROP IF EXISTS + CREATE OR REPLACE**

```sql
DROP FUNCTION IF EXISTS get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION get_implantation_stats(...) ...
```

- `DROP FUNCTION IF EXISTS` avec signature complète : OK — nécessaire car le type de retour (TABLE) ne peut pas être modifié par `CREATE OR REPLACE` seul.
- `CREATE OR REPLACE` : OK — idempotent pour le corps de la fonction.
- La combinaison DROP IF EXISTS + CREATE OR REPLACE est le pattern standard pour les fonctions avec type TABLE. Conforme.

**Verdict : PASS**

---

## 3. SECURITY DEFINER pattern

```sql
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
```

- `SECURITY DEFINER` présent : OK — nécessaire pour que la fonction accède aux tables en tant que `definer` (plutôt que le user appelant), garantissant l'isolation via tenant_id sans dépendre des RLS des tables internes.
- `SET search_path = public` présent : OK — protection critique contre le search_path hijacking. Sans ce paramètre, une SECURITY DEFINER function serait vulnérable à une injection de schema. Conforme au pattern des migrations existantes (ex: 00053, 00093).
- `STABLE` : OK — la fonction ne modifie pas la DB, correctement annotée.

**Verdict : PASS**

---

## 4. GRANT / REVOKE

```sql
REVOKE ALL ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
```

- `REVOKE ALL FROM PUBLIC` : OK — retire l'accès par défaut à tous les utilisateurs non authentifiés.
- `GRANT EXECUTE TO authenticated` : OK — conforme au rôle Supabase des utilisateurs connectés.
- La signature `(TIMESTAMPTZ, TIMESTAMPTZ)` dans les GRANTs correspond exactement à la déclaration de la fonction. Cohérent.

**Verdict : PASS**

---

## 5. Colonnes retournées vs schéma existant

| Colonne retournée | Type | Source | Vérification |
|---|---|---|---|
| `implantation_id` | UUID | `implantations.id` | OK — table standard |
| `implantation_name` | TEXT | `implantations.name` | OK |
| `tenant_id` | UUID | `implantations.tenant_id` | OK |
| `sessions_total` | BIGINT | COUNT(DISTINCT sessions.id) | OK |
| `sessions_closed` | BIGINT | COUNT FILTER status IN ('réalisée','terminée') | OK après correction BLOCKER-1 |
| `attendance_rate_pct` | NUMERIC | COUNT attendances / NULLIF total | OK |
| `mastery_rate_pct` | NUMERIC | COUNT evaluations signals / NULLIF total | OK |

**Correspondance TypeScript** (`@aureak/api-client/src/admin/supervision.ts`) :

| Colonne SQL | Champ TS | Match |
|---|---|---|
| `implantation_id` | `implantation_id: string` | OK |
| `implantation_name` | `implantation_name: string` | OK |
| `tenant_id` | `tenant_id: string` | OK |
| `sessions_total` | `sessions_total: number` | OK (BIGINT → number JS) |
| `sessions_closed` | `sessions_closed: number` | OK |
| `attendance_rate_pct` | `attendance_rate_pct: number` | OK (NUMERIC → number) |
| `mastery_rate_pct` | `mastery_rate_pct: number` | OK |

**Verdict : PASS**

---

## 6. Joins et filtres soft-delete

- `groups.deleted_at IS NULL` : OK
- `sessions.deleted_at IS NULL` : OK
- `implantations.deleted_at IS NULL` : OK
- `attendances` et `evaluations` : LEFT JOIN sans filtre deleted_at — ces tables n'ont pas de colonne `deleted_at` (pattern enregistrements immuables). Non applicable.

**Verdict : PASS**

---

## Résumé

| Check | Verdict |
|-------|---------|
| Numérotation | WARNING (saut 113→116) |
| Idempotence | PASS |
| SECURITY DEFINER | PASS |
| GRANT/REVOKE | PASS |
| Colonnes vs schéma | PASS (après BLOCKER-1 corrigé) |
| Soft-delete | PASS |

**Verdict global : PASS** (après correction BLOCKER-1 status 'closed' → 'réalisée','terminée')
