# Rapport story 2-2 — RBAC Règle Universelle RLS

**Date** : 2026-04-01
**Commit** : 9e7772c
**Statut** : ✅ done

---

## Changements apportés

| Fichier | Action | Raison |
|---------|--------|--------|
| `supabase/migrations/00090_rls_policies_complete.sql` | Créé | Gap : migration absente du repo — policies existaient en DB mais non versionnées |
| `supabase/RLS_PATTERNS.md` | Créé | Gap : documentation template universel absente |
| `aureak/packages/api-client/src/__tests__/rls-isolation.test.ts` | Modifié | Correction chemin migrations (`../../../../` → `../../../../../`) + nom fichier migration (`00010` → `00090`) |

**Déjà présents et complets :**
- `packages/api-client/src/__tests__/rls-isolation.test.ts` — existait, tests cross-tenant déjà écrits
- `packages/business-logic/src/stores/useAuthStore.ts` — utilise `current_tenant_id()` via JWT
- `packages/api-client/src/auth.ts` — `inviteUser()`, `disableUser()` déjà implémentés

---

## Contenu de la migration 00090

### Fonctions helper durcies
- `current_tenant_id()` — `RETURNS UUID`, `SECURITY DEFINER`, `SET search_path = public`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO authenticated`
- `current_user_role()` — `RETURNS user_role` (enum typé — cast invalide = erreur PostgreSQL explicite)
- `is_active_user()` — vérifie `status = 'active' AND deleted_at IS NULL` — bloque les comptes désactivés/supprimés

### Policies RLS (idempotentes — DROP IF EXISTS + CREATE)
- **`tenants`** : `tenant_isolation` — lecture par tenant_id + is_active_user
- **`profiles`** : `own_profile_read` (lecture self + admin), `own_profile_update` (modification display_name), `admin_insert`, `admin_soft_delete`
- **`parent_child_links`** : `parent_sees_own_links`, `admin_manage_links`
- **`processed_operations`** : `user_own_operations`, `admin_all_operations`
- **`audit_logs`** : `admin_read_audit` (SELECT admin), `insert_only_base` (INSERT tout utilisateur actif)

### Nouvelles tables (CREATE TABLE IF NOT EXISTS — idempotent)
- **`coach_implantation_assignments`** : table + 2 index + RLS (`cia_tenant_read`, `cia_admin_write`, `cia_coach_read`)
- **`coach_access_grants`** : table + 3 index dont 2 partiels (`WHERE revoked_at IS NULL`) + RLS (`cag_tenant_read`, `cag_admin_write`, `cag_coach_read`)

### Pattern coach_assigned_or_granted
- Commenté dans la migration pour référence Stories 4.1/5.1
- Combine accès permanent (coach_implantation_assignments) et accès temporaire (coach_access_grants avec expires_at > now() AND revoked_at IS NULL)

---

## Décision migration : 00090 au lieu de 00010

La story demandait `00010_rls_policies.sql` (fichier évolutif central). Cependant :
- `00010_child_club_history.sql` occupe déjà ce numéro
- Les migrations 00004-00032 existent en DB mais pas dans le repo (créées directement via Studio)
- Solution retenue : `00090_rls_policies_complete.sql` — migration idempotente `CREATE OR REPLACE` / `DROP IF EXISTS` applicable sur la DB existante sans conflit

---

## QA Gates

| Gate | Résultat |
|------|----------|
| try/finally state setters | ✅ N/A (migration SQL + doc — pas de state React) |
| console sans NODE_ENV guard | ✅ N/A (pas de fichier apps/web ou api-client modifié) |
| catch vides | ✅ N/A |
| Vitest smoke tests | ✅ 2/2 passent (4 skippés sans Supabase local) |
| Playwright AuthGuard | ✅ /users → /login sans session |
| Console errors | ✅ 0 erreur liée à cette story (1 erreur pré-existante borderRadius) |
| Build TypeScript | ✅ Aucune nouvelle erreur |

---

## Risques

| Risque | Niveau | Mitigation |
|--------|--------|------------|
| Migration appliquée sur DB avec policies déjà existantes | Bas | Idempotente — DROP IF EXISTS avant chaque CREATE POLICY |
| FK `coach_implantation_assignments.implantation_id` sans contrainte | Bas | Intentionnel jusqu'à Story 4.1 — commenté dans la migration |
| `is_active_user()` : requête SQL dans chaque policy RLS | Bas | STABLE = cache par transaction. Profiling si perf dégradée → encoder status dans JWT |

---

## Points à vérifier avant mise en production

- [ ] Appliquer la migration 00090 en remote : `supabase db push --project-ref tuiicxlkvzvanikbkmmf`
- [ ] Vérifier `supabase db diff` clean (aucune dérive schéma)
- [ ] Tester cross-tenant avec 2 comptes réels — vérifier 0 fuite de données
- [ ] Story 4.1 : ajouter FK `coach_implantation_assignments.implantation_id → implantations(id)` via `ALTER TABLE ... ADD CONSTRAINT`
