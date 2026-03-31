# Rapport Bugs — Scan Global Codebase Aureak

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global pré-deploy
**Fichiers analysés** : 71 fichiers (apps/web, packages/api-client, packages/business-logic, packages/types)
**Déclencheur** : Scan global manuel — aucun rapport précédent

---

## Résumé Exécutif

Scan global de 71 fichiers sources. Une violation architecturale systémique a été identifiée : l'accès direct à `supabase` dans les composants UI, contournant la règle non-négociable qui impose de passer exclusivement par `@aureak/api-client` (ARCH-1). Ce pattern est présent dans **13 fichiers** distincts côté UI. Des violations de soft-delete et des erreurs Supabase ignorées complètent le tableau.

**Verdict : CORRECTIONS REQUISES**

| Sévérité | Nombre |
|----------|--------|
| P0 — BLOCKER | 15 |
| P1 — WARNING | 7 |
| P3 — INFO | 3 |
| **Total** | **25** |

---

## P0 — BLOCKERS (à corriger avant tout merge)

### [B-01] Accès Supabase direct — `dashboard/page.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
**Violation** : ARCH-1 — 4 requêtes directes (`profiles`, `groups`, `group_members`, `coach_implantation_assignments`)
**Impact** : Contournement de la couche API centralisée, impossibilité de tester/mocker, accès RLS non médiatisé.
**Fix** : Créer des fonctions dans `@aureak/api-client/src/admin/dashboard.ts`.

---

### [B-02] Accès Supabase direct + erreur ignorée — `evaluations/index.tsx` (admin)

**Fichier** : `aureak/apps/web/app/(admin)/evaluations/index.tsx`
**Code** : `const { data } = await supabase.from('evaluations').select(...)`
**Violation** : ARCH-1 + `error` non déstructuré.
**Impact** : Si la requête échoue, `data` est `null` → crash silencieux.
**Fix** : Déplacer dans `@aureak/api-client`. Déstructurer `{ data, error }`.

---

### [B-03] Accès Supabase direct + erreur ignorée — `coaches/index.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/coaches/index.tsx`
**Code** : `const { data: profiles, count } = await supabase.from('profiles').select(...)`
**Violation** : ARCH-1 + `error` non déstructuré.
**Fix** : Utiliser `listUsers` de `@aureak/api-client` avec filtre `role: 'coach'`.

---

### [B-04] Accès Supabase direct — `seances/[sessionId]/page.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
**Code** : Deux `supabase.from('profiles').select('user_id, display_name')` pour résoudre coaches et enfants.
**Violation** : ARCH-1.
**Fix** : Enrichir `getSession()` dans l'api-client pour retourner les display_names résolus.

---

### [B-05] Accès Supabase direct — `parent/dashboard/index.tsx`

**Fichier** : `aureak/apps/web/app/(parent)/parent/dashboard/index.tsx`
**Code** : `supabase.from('parent_child_links').select('child_id, profiles!child_id(display_name)')`
**Violation** : ARCH-1.
**Fix** : Créer `listChildrenOfParent()` dans `@aureak/api-client/src/parent/`.

---

### [B-06] Accès Supabase direct — `attendance/index.tsx` (coach, AddGuestModal)

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx`
**Code** : `supabase.from('child_directory').select(...).ilike(...)` dans `AddGuestModal`.
**Violation** : ARCH-1.
**Fix** : Utiliser `searchChildDirectory(query)` existant dans l'api-client.

---

### [B-07] Accès Supabase direct — `evaluations/index.tsx` (coach)

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx`
**Code** : `supabase.from('attendances')` + `supabase.from('profiles')` directement.
**Violation** : ARCH-1.
**Fix** : Créer `listSessionAttendancesWithProfiles(sessionId)` dans l'api-client.

---

### [B-08] Accès Supabase direct — `club/dashboard/index.tsx`

**Fichier** : `aureak/apps/web/app/(club)/club/dashboard/index.tsx`
**Violation** : ARCH-1 — plusieurs appels `supabase.from(...)` directs.
**Fix** : Créer les fonctions manquantes dans `@aureak/api-client/src/club/`.

---

### [B-09] Accès Supabase direct + Edge Function directe — `coaches/[coachId]/grade.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx`
**Code** :
- Ligne 33 : `supabase.from('profiles').select('display_name').eq('user_id', coachId).single()`
- Ligne 51–64 : `supabase.auth.getSession()` + `supabase.functions.invoke('send-notification', ...)`
**Violation** : ARCH-1 double — requête DB **et** invocation Edge Function directe hors api-client.
**Fix** : (1) `getCoachProfile(coachId)` dans l'api-client. (2) `sendGradeNotification()` wrapper dans l'api-client.

---

### [B-10] Accès Supabase direct — `parent/children/[childId]/index.tsx`

**Fichier** : `aureak/apps/web/app/(parent)/parent/children/[childId]/index.tsx`
**Code** : `supabase.from('profiles').select('display_name').eq('user_id', childId).single()`
**Violation** : ARCH-1.
**Fix** : Enrichir `getChildProfile` pour retourner le `display_name`.

---

### [B-11] Accès Supabase direct — `parent/children/[childId]/sessions/index.tsx`

**Fichier** : `aureak/apps/web/app/(parent)/parent/children/[childId]/sessions/index.tsx`
**Code** : `supabase.from('profiles').select('display_name')` directement.
**Violation** : ARCH-1.

---

### [B-12] Accès Supabase direct — `club/goalkeepers/[childId]/index.tsx`

**Fichier** : `aureak/apps/web/app/(club)/club/goalkeepers/[childId]/index.tsx`
**Code** : 4 appels `supabase.from(...)` dans le `useEffect` principal : `profiles`, `attendances`, `session_evaluations_merged`, `session_attendees`.
**Violation** : ARCH-1 massive — la fiche gardien est entièrement construite par des requêtes directes.
**Fix** : Créer `getGoalkeeperDetail(childId)` dans `@aureak/api-client/src/club/`.

---

### [B-13] Accès Supabase direct — `coach/dashboard/index.tsx`

**Fichier** : `aureak/apps/web/app/(coach)/coach/dashboard/index.tsx`
**Code** : `supabase.from('session_evaluations_merged').select('session_id').in(...)`
**Violation** : ARCH-1.
**Fix** : Créer `listMissingEvaluationsByCoach(coachId, sessionIds)` dans l'api-client.

---

### [B-14] Erreur Supabase ignorée — `attendances.ts`

**Fichier** : `aureak/packages/api-client/src/sessions/attendances.ts` (~ligne 50)
**Code** : `const { data: sessions } = await sessionQuery`
**Impact** : Si la requête DB échoue, `sessions` est `null` → `listSessionsWithAttendance` retourne un résultat vide sans signaler l'erreur. Le coach voit ses présences vides sans explication.
**Fix** :
```typescript
const { data: sessions, error: sessionsError } = await sessionQuery
if (sessionsError) return { data: [], error: sessionsError }
```

---

### [B-15] Soft-delete violé — `child-club-history.ts`

**Fichier** : `aureak/packages/api-client/src/child-club-history.ts` (ligne ~136)
**Code** : `.delete().eq('id', id).eq('tenant_id', tenantId)` — DELETE physique.
**Violation** : ARCH-4 — soft-delete obligatoire sauf jobs RGPD.
**Impact** : Suppressions irréversibles. Parcours football définitivement perdu.
**Fix** :
```typescript
// Soft-delete conforme ARCH-4
await supabase
  .from('child_club_history')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id)
  .eq('tenant_id', tenantId)
```

---

## P1 — WARNINGS (à corriger avant Gate 2)

### [W-01] Null non gardé — `seances/page.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/seances/page.tsx` (~ligne 114)
**Code** : `.then(r => setExceptions(r.data))`
**Impact** : Si `r.data` est `null` (erreur réseau), `setExceptions(null)` → crash sur `.map()`.
**Fix** : `setExceptions(r.data ?? [])` + vérifier `r.error`.

---

### [W-02] Erreur ignorée dans `methodology.ts`

**Fichier** : `aureak/packages/api-client/src/methodology.ts` (~ligne 96)
**Code** : `const { data } = await q` — `error` non déstructuré dans `listMethodologyThemes` / `listMethodologySituations`.
**Impact** : Le formulaire nouvelle séance pédagogique affiche "Aucun thème" sans indication d'erreur si la DB échoue.
**Fix** : Déstructurer `{ data, error }` et retourner `{ data: [], error }` si erreur.

---

### [W-03] `saveOne`/`saveAll` sans try/catch — `evaluations/index.tsx` (coach)

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx`
**Impact** : `applyEvaluationEvent` peut lever une exception Supabase. Sans `try/catch`, l'interface d'évaluation crash sans message d'erreur.
**Fix** : Entourer les appels de `try/catch` avec feedback UI.

---

### [W-04] Stale closure — `useSessionValidation.ts`

**Fichier** : `aureak/packages/business-logic/src/sessions/useSessionValidation.ts`
**Impact** : Un `setTimeout` capture `wsConnected` à sa valeur initiale (`false`). Les mises à jour d'état ultérieures ne sont pas reflétées → logique de validation WebSocket incorrecte.
**Fix** : Utiliser une `ref` pour `wsConnected` ou déplacer la logique hors du `setTimeout`.

---

### [W-05] `handleAnswer` sans try/catch — `child/quiz/[themeId]/index.tsx`

**Fichier** : `aureak/apps/web/app/(child)/child/quiz/[themeId]/index.tsx`
**Impact** : `submitAnswer` + `stopAttempt` peuvent lever des exceptions si le réseau échoue → crash pour l'enfant qui soumet un quiz.
**Fix** : `try/catch` + message "Une erreur est survenue, réessaie."

---

### [W-06] `result.data` non null-gardé — `partnerships/index.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/partnerships/index.tsx` (ligne 33)
**Code** : `setPartnerships(result.data)`
**Impact** : Si l'API échoue, `.map()` sur `null` crash la page partenariats.
**Fix** : `setPartnerships(result.data ?? [])`.

---

### [W-07] DELETE physique potentiel — `school-calendar/page.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/settings/school-calendar/page.tsx` (~ligne 67)
**Impact** : `removeSchoolCalendarException(id)` — à vérifier si cette fonction fait un DELETE physique (les exceptions calendrier n'ont pas de `deleted_at` visible). Potentielle violation ARCH-4.
**Fix** : Vérifier la migration de `school_calendar_exceptions`. Si pas de `deleted_at`, ajouter la colonne et implémenter le soft-delete.

---

## P3 — INFO (à traiter dans une future session)

### [I-01] `console.log/warn/error` en production — `seances/new.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/seances/new.tsx`
**Note** : Plusieurs `console.error` / `console.warn` restés en production. Non critique.

---

### [I-02] Casts `any` avec eslint-disable — `child-directory.ts`, `injuries.ts`

**Fichiers** : `aureak/packages/api-client/src/admin/child-directory.ts`, `admin/injuries.ts`
**Note** : Casts `any` dans les mappers Supabase. Justifiés par la complexité des retours mais devrait être typé précisément.

---

### [I-03] Cast `as never` — `users/new.tsx`

**Fichier** : `aureak/apps/web/app/(admin)/users/new.tsx`
**Code** : `fn(baseParams as never)`
**Note** : Masque des incompatibilités de types potentielles.

---

## Fichiers analysés sans issue

`_layout.tsx` · `users/index.tsx` · `access-grants/new.tsx` · `access-grants/page.tsx` · `audit/index.tsx` · `gdpr/index.tsx` · `exports/index.tsx` · `methodologie/index.tsx` · `methodologie/seances/new.tsx` · `methodologie/seances/[sessionId]/page.tsx` · `methodologie/themes/new.tsx` · `methodologie/situations/page.tsx` · `BlocsManagerModal.tsx` · `football-history/index.tsx` · `coach/sessions/new/index.tsx` · `supabase.ts` · `auth.ts` · `access-grants.ts` · `sessions/sessions.ts` · `session-theme-blocks.ts` · `session-workshops.ts` · `implantations.ts` · `presence.ts` · `academy/academyStatus.ts` · `admin/stages.ts` · `parent/childProfile.ts` · `parent/gdpr.ts` · `clubs.ts` · `roles.ts` · `groups/academyStatus.ts` · `useAuthStore.ts` · `SyncQueueService.ts` · `useRecordEvaluation.ts`

---

## Matrice de priorité

| ID | Fichier | Sévérité | Catégorie | Effort |
|----|---------|----------|-----------|--------|
| B-01 | dashboard/page.tsx | P0 | ARCH-1 | Moyen |
| B-02 | admin/evaluations/index.tsx | P0 | ARCH-1 + error ignoré | Faible |
| B-03 | coaches/index.tsx | P0 | ARCH-1 + error ignoré | Faible |
| B-04 | seances/[sessionId]/page.tsx | P0 | ARCH-1 | Faible |
| B-05 | parent/dashboard/index.tsx | P0 | ARCH-1 | Faible |
| B-06 | coach/attendance/index.tsx | P0 | ARCH-1 | Faible |
| B-07 | coach/evaluations/index.tsx | P0 | ARCH-1 | Faible |
| B-08 | club/dashboard/index.tsx | P0 | ARCH-1 | Moyen |
| B-09 | coaches/[coachId]/grade.tsx | P0 | ARCH-1 × 2 | Faible |
| B-10 | parent/children/[childId]/index.tsx | P0 | ARCH-1 | Faible |
| B-11 | parent/children/[childId]/sessions/index.tsx | P0 | ARCH-1 | Faible |
| B-12 | club/goalkeepers/[childId]/index.tsx | P0 | ARCH-1 × 4 | Moyen |
| B-13 | coach/dashboard/index.tsx | P0 | ARCH-1 | Faible |
| B-14 | api-client/attendances.ts | P0 | Error ignoré | Très faible |
| B-15 | api-client/child-club-history.ts | P0 | Soft-delete violé | Très faible |
| W-01 | seances/page.tsx | P1 | Null non gardé | Très faible |
| W-02 | methodology.ts | P1 | Error ignoré | Très faible |
| W-03 | coach/evaluations/index.tsx | P1 | Try/catch manquant | Faible |
| W-04 | useSessionValidation.ts | P1 | Stale closure | Faible |
| W-05 | child/quiz/[themeId]/index.tsx | P1 | Try/catch manquant | Très faible |
| W-06 | partnerships/index.tsx | P1 | Null non gardé | Très faible |
| W-07 | school-calendar/page.tsx | P1 | Soft-delete à vérifier | À évaluer |

---

## Verdict Final

```
╔══════════════════════════════════════════════╗
║  VERDICT : CORRECTIONS REQUISES              ║
║                                              ║
║  P0 Blockers : 15                            ║
║  P1 Warnings : 7                             ║
║  P3 Info     : 3                             ║
║                                              ║
║  Gate production : ❌ BLOQUÉ                 ║
╚══════════════════════════════════════════════╝
```

**Action immédiate** : Corriger les 15 BLOCKERs.
- Priorité 1 : B-01 à B-13 (violations ARCH-1 systémiques — accès Supabase direct en dehors de l'api-client)
- Priorité 2 : B-14 (erreur silencieuse dans attendances.ts — impact coach)
- Priorité 3 : B-15 (DELETE physique historique football — perte de données irréversible)
