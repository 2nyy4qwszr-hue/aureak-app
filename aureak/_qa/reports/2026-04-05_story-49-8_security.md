# Security Audit — Story 49-8
**Date** : 2026-04-05
**Migration** : `supabase/migrations/00116_create_fn_get_implantation_stats.sql`
**UI** : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
**Auditeur** : QA Gate 1 Agent

---

## 1. Tenant Isolation (CRITICAL PATH)

### 1a. Mécanisme de filtrage tenant dans la migration

**BLOCKER (CORRIGÉ) — Subquery directe vs current_tenant_id()**

**Original** : subquery inline `SELECT tenant_id FROM profiles WHERE user_id = auth.uid() LIMIT 1`

**Problèmes de sécurité identifiés** :
1. **Bypass du fallback JWT** : La fonction `current_tenant_id()` (migration 00053) utilise `COALESCE(JWT app_metadata.tenant_id, profiles lookup)`. La subquery directe ignore le JWT, créant un comportement asymétrique. Si un Custom Access Token Hook est activé, la subquery raw pourrait retourner un tenant_id différent du JWT, causant des incohérences d'accès.
2. **Source de vérité dupliquée** : La fonction `current_tenant_id()` est le point de maintenance unique. Dupliquer sa logique crée un risque de drift : toute correction de bug future dans `current_tenant_id()` ne serait pas propagée automatiquement.
3. **Potentielle désynchronisation en edge case** : Un nouvel utilisateur dont le profil n'est pas encore créé mais dont le JWT contient `app_metadata.tenant_id` retournerait NULL via la subquery mais un tenant valide via `current_tenant_id()`.

**Correction appliquée** : `AND i.tenant_id = current_tenant_id()`

**Résultat** : La fonction hérite du comportement JWT-first + profiles-fallback. Isolation tenant garantie par source de vérité unique.

**Statut** : CORRIGÉ

---

## 2. SECURITY DEFINER — Vecteurs de risque

### 2a. Search path hijacking

```sql
SECURITY DEFINER
SET search_path = public
```

Protection présente et correcte. Sans `SET search_path`, une SECURITY DEFINER function serait vulnérable à un attaquant qui crée un schema malveillant avant `public` dans son search_path et y place une table `implantations` falsifiée. La protection `SET search_path = public` neutralise ce vecteur.

**Verdict : PASS**

### 2b. Elevation de privileges

La fonction est de type `LANGUAGE sql STABLE` — elle ne peut pas modifier des données, ne peut pas appeler `SET ROLE`, ne peut pas executer du DDL. Le vecteur d'elevation de privileges via cette fonction est nul.

**Verdict : PASS**

### 2c. Data leakage cross-tenant

La requete filtre sur `i.tenant_id = current_tenant_id()` des le `WHERE` sur la table `implantations`. Les JOINs vers `groups`, `sessions`, `attendances`, `evaluations` sont tous des JOINs FK, donc un tenant ne peut pas acceder aux lignes d'un autre tenant tant que `implantations` est correctement filtree.

**Scenario d'attaque** : Utilisateur authentifie sur tenant A appelle `get_implantation_stats`. La fonction resout `current_tenant_id()` → UUID tenant A. Seules les `implantations` avec `tenant_id = A` sont retournees. Les groupes/sessions/presences/evaluations sont joins FK sur ces implantations, implicitement bornes au tenant A.

**Verdict : PASS**

---

## 3. auth.uid() — Authentification obligatoire

Si `auth.uid()` retourne NULL (utilisateur non authentifie), `current_tenant_id()` retourne NULL, et le filtre `i.tenant_id = NULL` ne matche aucune ligne (semantique NULL SQL). Un appel non authentifie retourne une table vide — pas d'erreur, pas de data leak.

Les GRANTs renforcent ce point : seul le role `authenticated` peut executer la fonction. Un appel anonymous est rejete au niveau PostgreSQL avant meme d'executer le corps.

**Verdict : PASS**

---

## 4. Injection SQL

La fonction accepte deux parametres `TIMESTAMPTZ` :
- Pas d'interpolation de chaine dans le SQL.
- Les parametres `p_from` et `p_to` sont types et utilises dans un `BETWEEN`.
- Pas de surface d'injection SQL.

**Verdict : PASS**

---

## 5. Exposition de donnees sensibles

Colonnes retournees : `implantation_id`, `implantation_name`, `tenant_id`, `sessions_total`, `sessions_closed`, `attendance_rate_pct`, `mastery_rate_pct`.

- Pas de donnees personnelles (PII) retournees.
- Les taux sont des agregats — pas de donnees individuelles exposees.
- `tenant_id` est retourne : donnee organisationnelle non sensible, acceptable pour filtrage cote client.

**Verdict : PASS**

---

## 6. Dashboard UI — Vecteurs frontend

### 6a. Rendu de donnees non sanitisees

- `anomalyLabel(a.anomalyType)` : transformation purement textuelle (split/map/join), pas d'injection HTML possible.
- `stat.implantation_name` affiche directement dans JSX (auto-escape React). Safe.
- Aucune API `innerHTML` utilisee. Rendu uniquement via JSX React.

**Verdict : PASS**

### 6b. Exposition de donnees dans le DOM

- Stats d'implantations : agregats (taux, compteurs). Pas de PII.
- Anomalies : type transforme + severite. Pas de PII.

**Verdict : PASS**

### 6c. Appels authentifies

Tous les appels passent par `@aureak/api-client` avec session JWT Supabase automatique. Pas d'appels bruts a des endpoints non authentifies.

**Verdict : PASS**

---

## Resume

| Check | Severite | Verdict |
|-------|----------|---------|
| Tenant isolation (subquery) | BLOCKER | CORRIGE |
| SECURITY DEFINER + search_path | HIGH | PASS |
| Data leakage cross-tenant | CRITICAL | PASS |
| auth.uid() unauthenticated case | HIGH | PASS |
| Injection SQL | HIGH | PASS |
| PII dans les retours | MEDIUM | PASS |
| Rendu donnees non sanitisees | MEDIUM | PASS |
| Authentification appels frontend | MEDIUM | PASS |

**Verdict global : PASS** (apres correction BLOCKER tenant isolation)
