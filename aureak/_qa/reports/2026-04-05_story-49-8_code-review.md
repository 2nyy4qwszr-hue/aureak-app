# Code Review — Story 49-8
**Date** : 2026-04-05
**Auditeur** : QA Gate 1 Agent
**Fichiers audités** :
- `supabase/migrations/00116_create_fn_get_implantation_stats.sql`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx`

---

## 1. Migration SQL — 00116

### Try/Finally — N/A (SQL, pas de state setter)

### Console guards — N/A (SQL)

### Catch silencieux — N/A (SQL)

### Qualité du code SQL

**BLOCKER-1 (CORRIGÉ) — Valeur de status incorrecte**
- **Ligne originale 38** : `WHERE s.status = 'closed'`
- **Problème** : La colonne `sessions.status` utilise les valeurs `'réalisée'` et `'terminée'` (confirmé dans migrations 00062, 00064, 00100). La valeur `'closed'` n'existe pas pour les sessions — elle existe dans `tickets.status` (migration 00092).
- **Impact** : `sessions_closed` retournerait toujours 0, rendant les KPI du dashboard inutilisables.
- **Correction appliquée** : `WHERE s.status IN ('réalisée', 'terminée')`
- **Statut** : CORRIGÉ

**BLOCKER-2 (CORRIGÉ) — Subquery tenant isolation au lieu de current_tenant_id()**
- **Lignes originales 78-82** :
  ```sql
  AND i.tenant_id = (
    SELECT tenant_id FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  )
  ```
- **Problème** : Duplique la logique de `current_tenant_id()` définie dans la migration 00053, sans le fallback JWT (`COALESCE(JWT, profiles)`). Cela crée une divergence de comportement si le JWT contient `app_metadata.tenant_id` mais pas de ligne dans `profiles` (edge case réel lors d'un nouveau compte), et viole le principe de source de vérité unique.
- **Correction appliquée** : `AND i.tenant_id = current_tenant_id()`
- **Statut** : CORRIGÉ

**OK — Colonnes référencées**
- `sessions.scheduled_at` : confirmé dans migrations 00062, 00100, 00102
- `sessions.deleted_at` : pattern soft-delete standard
- `groups.is_transient` : ajouté en migration 00061
- `groups.deleted_at` : pattern soft-delete standard
- `evaluations.receptivite / gout_effort / attitude` : confirmés dans `@aureak/types/entities.ts` et `api-client/src/club/clubData.ts`
- `attendances.status` : enum `attendance_status` défini en migration 00002

**OK — Logique NULLIF**
- `NULLIF(COUNT(a.id), 0)` et `NULLIF(COUNT(...), 0)` présents sur les deux taux → pas de division par zéro.

**OK — is_transient filter**
- `g.is_transient = false` correctement appliqué, conforme au pattern établi dans `listGroupsByImplantation`.

---

## 2. Dashboard page.tsx

### Try/Finally

| Setter | Pattern | Verdict |
|--------|---------|---------|
| `setLoading` | `setLoading(true)` → `try {...} finally { setLoading(false) }` | OK |
| `setLoadingCounts` | `setLoadingCounts(true)` → `try {...} finally { setLoadingCounts(false) }` | OK |
| `setResolving` | `setResolving(id)` → `try {...} finally { setResolving(null) }` | OK |

Note : `setLoadingCounts` dans la branche `if (error || !data) { return }` — le `finally` s'exécute quand même, donc `setLoadingCounts(false)` est bien appelé. Conforme.

### Console guards

Tous les `console.error` sont wrappés avec `if (process.env.NODE_ENV !== 'production')`.
Lignes : 322, 325, 326, 331, 360, 367, 381. Conforme.

### Catch silencieux

Aucun `catch(() => {})` silencieux. Tous les catch logguent l'erreur avec le guard NODE_ENV.

### Accès Supabase

Toutes les données viennent de `@aureak/api-client` :
- `getImplantationStats`, `listAnomalies`, `listImplantations`, `getDashboardKpiCounts`, `resolveAnomaly`
Aucun accès direct à Supabase dans le composant. Conforme.

### Styles / Tokens

**WARNING — Couleurs hardcodées**
- Ligne 611 : `accent="#FFFFFF"` — blanc pur hardcodé
- Lignes 616-617 : `background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)'` — gradient vert terrain hardcodé
- Ligne 620 : `valueColor="#FFFFFF"` — blanc hardcodé
- Ligne 957 : `color: '#FFFFFF'` — dans `resolveBtn` style sheet

**Verdict WARNING** : Ces couleurs font partie d'un effet visuel intentionnel (card "Implantations" avec gradient vert football). Les tokens `@aureak/theme` n'exposent pas de tokens pour ce gradient spécifique. Non bloquant mais à signaler pour un futur ticket d'ajout de token `colors.accent.greenField` ou similaire.

### Routing

- Utilise `useRouter` Expo Router + `router.push()`. Conforme.

### useEffect dependencies

- `useEffect(() => { load() }, [])` : pas de dépendances explicites. `load` est recréée à chaque render — c'est tolérable car la fonction capture `from`/`to` via les paramètres par défaut et n'est appelée manuellement que via `handlePresetChange`/`handleApplyCustom`. WARNING non bloquant (règle React exhaustive-deps), mais pas un bug fonctionnel.

---

## Résumé

| Sévérité | Nb | Statut |
|----------|-----|--------|
| BLOCKER | 2 | CORRIGÉS |
| WARNING | 3 | Non corrigés (non bloquants) |
| OK | 14+ | — |

**Verdict : PASS** (après corrections)
