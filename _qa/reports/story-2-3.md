# Rapport story 2-3 — Accès Temporaire Cross-Implantation Coach

**Date** : 2026-04-01
**Commit** : 7d3bb17
**Statut** : ✅ done

---

## Changements apportés

| Fichier | Action | Raison |
|---------|--------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié | Gap : lien nav "Accès temporaires" absent |

**Déjà présents et complets :**
- `supabase/migrations/00090_rls_policies_complete.sql` — table `coach_access_grants` + RLS + index partiels (créés en story 2-2)
- `packages/types/src/entities.ts` — `CoachAccessGrant` type présent
- `packages/api-client/src/access-grants.ts` — `createGrant`, `listActiveGrants`, `revokeGrant` avec audit trail
- `packages/api-client/src/index.ts` — exports présents
- `apps/web/app/(admin)/access-grants/page.tsx` — liste + révocation, try/finally correct
- `apps/web/app/(admin)/access-grants/new.tsx` — formulaire UUID + validation Zod (expiresAt > now())

---

## Vérifications QA

### page.tsx
- `setLoading(false)` dans `finally` ✅
- `setRevoking(null)` dans `finally` ✅
- Aucun `console.*` non gardé ✅

### new.tsx
- `isSubmitting` de React Hook Form (pas de `setLoading` manuel) ✅
- Aucun `console.*` ✅
- Validation Zod `expiresAt > new Date()` ✅

### access-grants.ts
- Pattern `{data, error}` — pas de state React ✅
- Audit trail systématique : `createGrant` → `grant_created`, `revokeGrant` → `grant_revoked` ✅
- `revokeGrant` idempotent : `.is('revoked_at', null)` ✅

---

## QA Gates

| Gate | Résultat |
|------|----------|
| try/finally state setters | ✅ Correct (page.tsx) |
| console sans NODE_ENV guard | ✅ Aucun console.* dans les fichiers UI |
| catch vides | ✅ Aucun |
| TypeScript | ✅ Aucune nouvelle erreur (erreurs Deno pré-existantes) |
| Playwright AuthGuard | ✅ /access-grants → /login sans session |
| Console errors | ✅ 0 erreur liée à cette story |

---

## Architecture coach_access_grants (résumé)

- **Expiration automatique** : condition RLS `expires_at > now()` — pas de cron requis
- **Révocation manuelle** : `UPDATE SET revoked_at = now()` + audit trail
- **Index partiels** `WHERE revoked_at IS NULL` : seuls les grants actifs sont indexés
- **Pattern coach_assigned_or_granted** : documenté dans `00090_rls_policies_complete.sql` — à activer en Story 4.1 (sessions) et Story 5.1 (attendances)
- **FK `implantation_id`** : sans contrainte FK jusqu'à Story 4.1 (table `implantations` non créée)

---

## Points à vérifier avant mise en production

- [ ] Appliquer migration 00090 en remote (table `coach_access_grants`)
- [ ] Story 4.1 : activer la clause `coach_assigned_or_granted` dans les policies `sessions`
- [ ] Story 5.1 : activer la clause dans les policies `attendances`
- [ ] Story 4.1 : `ALTER TABLE coach_access_grants ADD CONSTRAINT fk_implantation FOREIGN KEY (implantation_id) REFERENCES implantations(id)`
