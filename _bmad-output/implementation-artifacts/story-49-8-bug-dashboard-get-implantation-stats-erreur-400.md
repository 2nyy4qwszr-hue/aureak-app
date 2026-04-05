# Story 49.8 : BUG P1 — Dashboard admin — `getImplantationStats` retourne erreur 400 — tiles KPI vides

Status: done

Epic: 49 — Bugfix batch avril 2026 #2

## Contexte

Sur le dashboard admin (`/dashboard`), la fonction `getImplantationStats` échoue avec une
erreur 400. Les tiles KPI "Taux de présence" et "Taux de maîtrise" affichent `—` (valeur
nulle) au lieu de pourcentages calculés. La tile "Séances" affiche également `—`.

Le message console observé est :
```
[dashboard] getImplantationStats error: [object Object]
```

**Cause racine identifiée :** La fonction appelle `supabase.rpc('get_implantation_stats', { p_from, p_to })`
(fichier `aureak/packages/api-client/src/admin/supervision.ts`, ligne 31), mais **aucune
migration ne crée cette fonction PostgreSQL** dans `supabase/migrations/`. La fonction SQL
`get_implantation_stats` est absente de la base de données remote.

Supabase retourne une erreur 400 (`"Could not find the function public.get_implantation_stats"`)
lorsqu'une RPC est appelée sur une fonction inexistante, ce qui explique l'erreur `[object Object]`
(objet d'erreur PostgREST non stringifié).

Le dashboard charge bien `getDashboardKpiCounts()` (profiles, groups, coach_implantation_assignments)
qui fonctionne car ces requêtes ne dépendent pas de la fonction manquante.

## Story

En tant qu'admin,
je veux voir les tiles KPI "Taux de présence" et "Taux de maîtrise" afficher des valeurs
réelles sur le dashboard,
afin de superviser la performance des implantations sans erreurs silencieuses.

## Acceptance Criteria

1. Après implémentation, naviguer vers `/dashboard` ne produit aucune erreur console
   `getImplantationStats error` en mode développement.
2. Les tiles "Taux de présence" et "Taux de maîtrise" affichent un pourcentage (0%–100%)
   si des séances existent dans la période, ou `—` accompagné d'un message "Aucune donnée
   sur la période" si aucune séance n'est trouvée (empty state explicite, pas silence).
3. La tile "Séances" affiche le ratio `clôturées / total` si des données existent.
4. Le fallback UI distingue "données manquantes" (pas de séances sur la période) de
   "erreur technique" (appel RPC échoué) — l'erreur technique affiche une mention discrète
   "Données indisponibles" sur les tiles concernées.
5. La fonction SQL `get_implantation_stats(p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)` retourne
   les colonnes : `implantation_id`, `implantation_name`, `tenant_id`, `sessions_total`,
   `sessions_closed`, `attendance_rate_pct`, `mastery_rate_pct` — miroir exact du type TS
   `ImplantationStats` dans `supervision.ts`.
6. La migration est idempotente (`CREATE OR REPLACE FUNCTION`).

## Dépendances

- Tables requises (doivent exister en remote) : `sessions`, `implantations`, `attendance_records`,
  `evaluations` — toutes créées dans les migrations 00001–00113.
- Aucune dépendance sur d'autres stories en `ready-for-dev`.

## Tasks

### T1 — Diagnostiquer la requête exacte et les tables sources

- [x] Confirmer que `get_implantation_stats` est absent de toutes les migrations :
  ```bash
  grep -r "get_implantation_stats" supabase/migrations/
  ```
  Résultat attendu : aucun match → fonction manquante confirmée.
- [x] Identifier les colonnes disponibles dans `sessions`, `attendance_records`, `evaluations`
  pour construire la requête de calcul des taux.
  - `sessions` : `id`, `implantation_id` (via `group_id → groups.implantation_id`), `status` (`closed` / `open`), `session_date`, `tenant_id`
  - `attendance_records` : `session_id`, `child_id`, `status` (`present` / `absent` / …)
  - `evaluations` : `session_id`, `child_id`, `signal` (`acquired` / `not_acquired` / …)
- [x] Vérifier que le type de retour TS `ImplantationStats` dans `supervision.ts` correspond
  aux colonnes que la fonction SQL doit retourner.

### T2 — Créer la migration `00116_create_fn_get_implantation_stats.sql`

- [x] Numéroter la migration : dernière = `00113_create_v_club_gardien_stats.sql` → suivante = `00116` (00114 réservé pour story-49-6, 00115 pour story-49-7).
- [x] Créer `supabase/migrations/00116_create_fn_get_implantation_stats.sql` avec :

```sql
-- Migration 00116 — Story 49.8
-- Création de la fonction RPC get_implantation_stats
-- Appelée par : @aureak/api-client/src/admin/supervision.ts → getImplantationStats()
-- Retourne les stats d'assiduité et de maîtrise par implantation sur une période donnée.

CREATE OR REPLACE FUNCTION get_implantation_stats(
  p_from TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_to   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  implantation_id     UUID,
  implantation_name   TEXT,
  tenant_id           UUID,
  sessions_total      BIGINT,
  sessions_closed     BIGINT,
  attendance_rate_pct NUMERIC,
  mastery_rate_pct    NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id                                      AS implantation_id,
    i.name                                    AS implantation_name,
    i.tenant_id                               AS tenant_id,
    COUNT(DISTINCT s.id)                      AS sessions_total,
    COUNT(DISTINCT s.id) FILTER (
      WHERE s.status = 'closed'
    )                                         AS sessions_closed,
    ROUND(
      100.0 * COUNT(ar.id) FILTER (WHERE ar.status = 'present')
      / NULLIF(COUNT(ar.id), 0),
      1
    )                                         AS attendance_rate_pct,
    ROUND(
      100.0 * COUNT(ev.id) FILTER (WHERE ev.signal = 'acquired')
      / NULLIF(COUNT(ev.id), 0),
      1
    )                                         AS mastery_rate_pct
  FROM implantations i
  JOIN groups g
    ON g.implantation_id = i.id
   AND g.deleted_at IS NULL
   AND g.is_transient  = false
  JOIN sessions s
    ON s.group_id   = g.id
   AND s.session_date BETWEEN p_from AND p_to
   AND s.deleted_at IS NULL
  LEFT JOIN attendance_records ar
    ON ar.session_id = s.id
  LEFT JOIN evaluations ev
    ON ev.session_id = s.id
  WHERE i.deleted_at IS NULL
    AND i.tenant_id  = (
      SELECT tenant_id FROM profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  GROUP BY i.id, i.name, i.tenant_id
  ORDER BY i.name
$$;

-- Permissions : accessible uniquement aux utilisateurs authentifiés (RLS côté app)
REVOKE ALL ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_implantation_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
```

  **Note sur la requête :**
  - `is_transient = false` : exclut les groupes ponctuels (Migration 00061).
  - `NULLIF(COUNT(...), 0)` : évite la division par zéro → retourne `NULL` si aucune donnée.
  - `SECURITY DEFINER` + `search_path = public` : pattern standard du projet pour les RPC admin.
  - Le filtre `tenant_id` utilise le profil de l'utilisateur connecté (`auth.uid()`), cohérent
    avec l'isolation RLS du projet.
  - Si les noms exacts de colonnes (`status`, `signal`) divergent du schéma réel, ajuster
    avant de pousser (voir T1).

- [x] Pousser la migration en remote :
  ```bash
  supabase db push
  ```

### T3 — Améliorer le fallback UI dans `dashboard/page.tsx`

- [x] Ajouter un state `statsError: boolean` initialisé à `false`.
- [x] Dans `load()`, si `statsResult.error` est défini, passer `statsError = true` (en plus du
  log console existant). Laisser `setStats([])`.
- [x] Modifier les tiles "Taux de présence" et "Taux de maîtrise" :
  - Si `statsError === true` : afficher `value="—"` et `sub="Données indisponibles"` avec
    `accent={colors.text.muted}` (ton neutre, pas rouge — l'erreur n'est pas critique pour
    l'utilisateur).
  - Si `statsError === false` et `avgAttendance === null` : comportement actuel (`'—'` +
    sous-texte contextuel) — indique qu'il n'y a pas de séances sur la période (vide attendu).
- [x] Même logique pour la tile "Séances" : si `statsError`, afficher `"Données indisponibles"`
  en sous-texte.
- [x] S'assurer que `statsError` est remis à `false` à chaque appel `load()` (reset en début
  de fonction, avant le `try`).
- [x] Vérifier que try/finally est bien respecté (déjà présent — vérifier que `statsError` reset
  ne casse pas le pattern).

### T4 — Validation Playwright

- [x] Vérifier que l'app tourne :
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
  ```
- [x] Naviguer vers `http://localhost:8081/(admin)/dashboard`.
- [x] Prendre un screenshot — vérifier que les tiles KPI "Taux de présence" et "Taux de
  maîtrise" affichent un % ou `—` sans `Données indisponibles`.
- [x] Vérifier la console : zéro erreur `getImplantationStats error`.
- [x] Tester le changement de période (preset "Semaine en cours") → les tiles se rechargent
  sans erreur.

## QA pré-commit

```bash
# BLOCKER — try/finally
grep -n "setLoading(false)\|setSaving(false)" aureak/apps/web/app/(admin)/dashboard/page.tsx

# WARNING — console non guardé
grep -n "console\." aureak/apps/web/app/(admin)/dashboard/page.tsx | grep -v "NODE_ENV"

# WARNING — catch silencieux
grep -n "catch(() => {})" aureak/apps/web/app/(admin)/dashboard/page.tsx
```

## Fichiers à modifier

- `supabase/migrations/00116_create_fn_get_implantation_stats.sql` — **NOUVEAU** (migration SQL)
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ajout state `statsError` + fallback UI tiles

## Fichiers en lecture seule (référence)

- `aureak/packages/api-client/src/admin/supervision.ts` — fonction `getImplantationStats()` (ne pas modifier)
- `supabase/migrations/00095_anomaly_events.sql` — pattern SECURITY DEFINER + GRANT référence

## Commit

```
fix(epic-49): story 49-8 — créer fn SQL get_implantation_stats + fallback UI dashboard
```
