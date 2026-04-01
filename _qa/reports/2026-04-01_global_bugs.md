# Rapport Bugs — Scan Global Codebase Aureak (2ème passage — post-corrections)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global post-corrections
**Fichiers analysés** : 71 fichiers scope initial + 5 nouveaux fichiers détectés
**Déclencheur** : Second scan — vérification des corrections du premier rapport

---

## Résumé Exécutif

Second scan post-corrections du codebase Aureak. Les 15 BLOCKERs et 7 WARNINGs du premier rapport ont tous été corrigés. Cependant, l'analyse révèle que **4 fichiers hors-scope initial** contiennent de nouvelles violations ARCH-1 (accès Supabase direct), ainsi que **2 nouvelles issues** dans les fichiers corrigés. Le bilan global est positif mais le scope des violations ARCH-1 s'est avéré plus large qu'initialement détecté.

**Verdict : ⚠️ PASS WITH WARNINGS**

| Sévérité | Nombre |
|----------|--------|
| [BLOCKER] | 4 |
| [WARNING] | 3 |
| [INFO] | 2 |
| **Total** | **9** |

---

## Statut des issues du premier rapport

### Blockers corrigés ✅

| ID | Fichier | Statut |
|----|---------|--------|
| B-01 | dashboard/page.tsx | ✅ Corrigé — `getDashboardKpiCounts`, `getImplantationStats`, `listAnomalies`, `listImplantations` via api-client |
| B-02 | admin/evaluations/index.tsx | ✅ Corrigé — `listEvaluationsAdmin` via api-client |
| B-03 | coaches/index.tsx | ✅ Corrigé — `listCoaches`, `getCoachCurrentGrade` via api-client |
| B-04 | seances/[sessionId]/page.tsx | ✅ Corrigé — `resolveProfileDisplayNames` via api-client |
| B-05 | parent/dashboard/index.tsx | ✅ Corrigé — `listChildrenOfParent` via api-client |
| B-06 | coach/attendance/index.tsx | ✅ Corrigé — plus de supabase direct, `listChildDirectory` via api-client |
| B-07 | coach/evaluations/index.tsx | ✅ Corrigé — `listMergedEvaluations`, `listPresentChildIdsForSession` via api-client |
| B-08 | club/dashboard/index.tsx | ✅ Corrigé — toutes les fonctions via api-client |
| B-09 | coaches/[coachId]/grade.tsx | ✅ Corrigé — `getProfileDisplayName`, `sendGradeNotification` via api-client |
| B-10 | parent/children/[childId]/index.tsx | ✅ Corrigé — `getProfileDisplayName` via api-client |
| B-11 | parent/children/[childId]/sessions/index.tsx | ✅ Corrigé — `getProfileDisplayName` via api-client |
| B-12 | club/goalkeepers/[childId]/index.tsx | ✅ Corrigé — `getGoalkeeperDetail` via api-client |
| B-13 | coach/dashboard/index.tsx | ✅ Corrigé — `listEvaluatedSessionIds` via api-client |
| B-14 | api-client/attendances.ts | ✅ Corrigé — `sessionsError` déstructuré et retourné ligne 51 |
| B-15 | api-client/child-club-history.ts | ✅ Corrigé — `deleteHistoryEntry` fait `update({ deleted_at: ... })` (soft-delete ARCH-4 conforme) |

### Warnings corrigés ✅

| ID | Fichier | Statut |
|----|---------|--------|
| W-01 | seances/page.tsx:114 | ✅ Corrigé — `r.data ?? []` |
| W-02 | methodology.ts | ✅ Corrigé — `const { data, error } = await q; if (error) return []` |
| W-03 | coach/evaluations/index.tsx | ✅ Corrigé — `saveOne` et `saveAll` enveloppés dans try/catch avec `setSaveError(...)` |
| W-04 | useSessionValidation.ts | ✅ Corrigé — `wsConnectedRef.current` utilisé dans le setTimeout (plus de stale closure) |
| W-05 | child/quiz/[themeId]/index.tsx | ✅ Corrigé — `handleAnswer` enveloppé dans try/catch avec `setError('Une erreur est survenue. Réessaie.')` |
| W-06 | partnerships/index.tsx:33 | ✅ Corrigé — `result.data ?? []` |
| W-07 | school-calendar/page.tsx | ✅ Corrigé — `removeSchoolCalendarException` fait un soft-delete `update({ deleted_at: ... })` |

---

## Nouvelles Issues Détectées

### [BLOCKER] B-16 — Accès Supabase direct — `child/dashboard/index.tsx`

**Fichier** : `aureak/apps/web/app/(child)/child/dashboard/index.tsx` (lignes 130–156)
**Code** :
```typescript
const { data: saRows } = await supabase
  .from('session_attendees')
  .select('session_id')
  .eq('child_id', user.id)

const { data: upSessions } = await supabase
  .from('sessions')
  .select(...)

const { data: evalRows } = await supabase
  .from('session_evaluations_merged')
  .select(...)
```
**Violation** : ARCH-1 — accès Supabase direct hors `@aureak/api-client`, importé via `import { ..., supabase } from '@aureak/api-client'`. Ce fichier n'était pas dans le scope initial du premier scan.
**Impact** : Accès DB non médiatisé depuis le dashboard enfant. Contournement de la couche API centralisée. Les 3 requêtes sont sans vérification de `error`.
**Correction suggérée** :
```typescript
// Créer dans @aureak/api-client/src/child/dashboard.ts :
export async function getChildDashboardData(childId: string): Promise<{...}>
// Consolider les 3 requêtes en une seule fonction api-client
```

---

### [BLOCKER] B-17 — Accès Supabase direct — `coach/sessions/[sessionId]/notes/index.tsx`

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/notes/index.tsx` (lignes 76–96)
**Code** :
```typescript
const { data: attendees } = await supabase
  .from('session_attendees')
  .select('child_id, is_guest, coach_notes')
  .eq('session_id', sessionId)

// puis résolution des noms via supabase.from('profiles') et supabase.from('child_directory')
```
**Violation** : ARCH-1 — 3 appels `supabase.from()` directs dans la page notes. Un commentaire dans le code reconnaît le problème : `// Skipped: direct supabase access for coach_session_notes is out of scope for this sprint`.
**Impact** : Accès DB non médiatisé. Les notes coach sont construites entièrement par requêtes directes.
**Correction suggérée** : Créer `listSessionAttendeesWithNotes(sessionId)` dans `@aureak/api-client/src/sessions/`. Ce TODO doit être converti en ticket et assigné.

---

### [BLOCKER] B-18 — Accès Supabase direct — `parent/notifications/index.tsx`

**Fichier** : `aureak/apps/web/app/(parent)/parent/notifications/index.tsx` (lignes 51–99)
**Code** :
```typescript
supabase.from('notification_preferences').select(...)
supabase.from('notification_send_log').select(...)
supabase.from('notification_preferences').upsert(...)
```
**Violation** : ARCH-1 — 3 appels directs pour les préférences et logs de notification.
**Impact** : Accès DB non médiatisé. La mutation `upsert` n'a pas de gestion d'erreur visible.
**Correction suggérée** : Créer `getNotificationPreferences(userId)`, `listNotificationLogs(userId)`, `saveNotificationPreferences(...)` dans `@aureak/api-client/src/parent/notifications.ts`.

---

### [BLOCKER] B-19 — Accès Supabase direct — `parent/children/[childId]/progress/index.tsx`

**Fichier** : `aureak/apps/web/app/(parent)/parent/children/[childId]/progress/index.tsx` (ligne 151)
**Code** :
```typescript
supabase.from('profiles').select('display_name').eq('user_id', childId).single()
```
**Violation** : ARCH-1 — requête directe `profiles` alors que `getProfileDisplayName(childId)` existe déjà dans `@aureak/api-client`.
**Impact** : Pattern incohérent — la correction de B-10 et B-11 a introduit `getProfileDisplayName` mais ce fichier (même fonctionnalité, parent/children) n'a pas été mis à jour.
**Correction suggérée** :
```typescript
// avant
supabase.from('profiles').select('display_name').eq('user_id', childId).single()

// après
const { data: name } = await getProfileDisplayName(childId)
setDisplayName(name ?? '')
```

---

### [WARNING] W-08 — `getDashboardKpiCounts` : accès `.data` sans null-guard

**Fichier** : `aureak/apps/web/app/(admin)/dashboard/page.tsx` (ligne 244–248)
**Code** :
```typescript
getDashboardKpiCounts(selectedImplantationId ?? undefined).then(({ data }) => {
  setChildrenTotal(data.childrenTotal)   // ← data peut être undefined si l'API échoue
  setCoachesTotal(data.coachesTotal)
  setGroupsTotal(data.groupsTotal)
  setLoadingCounts(false)
})
```
**Impact** : Si `getDashboardKpiCounts` retourne `{ data: undefined, error: ... }`, l'accès à `data.childrenTotal` crash le dashboard admin sans message d'erreur.
**Correction suggérée** :
```typescript
getDashboardKpiCounts(selectedImplantationId ?? undefined).then(({ data, error }) => {
  if (error || !data) { setLoadingCounts(false); return }
  setChildrenTotal(data.childrenTotal)
  setCoachesTotal(data.coachesTotal)
  setGroupsTotal(data.groupsTotal)
  setLoadingCounts(false)
})
```

---

### [WARNING] W-09 — Login : fallback `supabase.from('profiles')` sans gestion d'erreur complète

**Fichier** : `aureak/apps/web/app/(auth)/login.tsx` (lignes 99–106)
**Code** :
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('user_role')
  .eq('user_id', data.session.user.id)
  .single()
role = profile?.user_role as UserRole | undefined
```
**Description** : Le fallback de résolution du rôle depuis `profiles` (quand le JWT app_metadata ne contient pas le rôle) utilise `supabase` directement. C'est un fallback légitime documenté, mais :
1. `error` n'est pas déstructuré — si la requête échoue, `profile` est `null` sans notification
2. Si `role` reste `undefined`, l'utilisateur est bloqué avec "Rôle inconnu" sans log
**Impact** : Risque de boucle de connexion silencieuse si la table `profiles` est inaccessible.
**Correction suggérée** : Déplacer ce fallback dans `@aureak/api-client/src/auth.ts` comme `getUserRoleFromProfile(userId)`.

---

### [WARNING] W-10 — `anomalyResult.data` accédé sans null-guard dans le dashboard

**Fichier** : `aureak/apps/web/app/(admin)/dashboard/page.tsx` (ligne 219)
**Code** :
```typescript
setAnomalies(anomalyResult.data)  // ← pas de ?? []
```
**Impact** : Contrairement à `statsResult.data ?? []` (ligne 218) et `implRes.data ?? []` (ligne 220), `anomalyResult.data` n'a pas de fallback. Si `listAnomalies()` échoue, `anomalies` est `null` → le `anomalies.length` et le `.filter()` suivants crashent.
**Correction suggérée** :
```typescript
setAnomalies(anomalyResult.data ?? [])
```

---

## Issues INFO

### [INFO] I-04 — `supabase` exporté depuis api-client — risque d'abus

**Fichier** : `aureak/packages/api-client/src/index.ts` (ligne 4)
**Observation** : `supabase` est explicitement exporté depuis `@aureak/api-client`. Cela permet aux pages d'importer le client Supabase en contournant la couche API. C'est la source des ARCH-1 détectés dans B-16 à B-19. Envisager de retirer cet export public et d'exposer uniquement des fonctions métier, en gardant le client privé au package.

---

### [INFO] I-05 — TODO non tickété dans `notes/index.tsx`

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/notes/index.tsx` (ligne ~77)
**Observation** : Commentaire `// Skipped: direct supabase access for coach_session_notes is out of scope for this sprint` sans référence à un ticket ou une story. Doit être converti en story `ready-for-dev` avant la prochaine sprint.

---

## Fichiers du scope initial sans nouvelle issue

`_layout.tsx` · `users/index.tsx` · `access-grants/new.tsx` · `access-grants/page.tsx` · `audit/index.tsx` · `gdpr/index.tsx` · `exports/index.tsx` · `methodologie/index.tsx` · `methodologie/seances/new.tsx` · `methodologie/seances/[sessionId]/page.tsx` · `methodologie/themes/new.tsx` · `methodologie/situations/page.tsx` · `BlocsManagerModal.tsx` · `football-history/index.tsx` · `coach/sessions/new/index.tsx` · `supabase.ts` · `auth.ts` · `access-grants.ts` · `sessions/sessions.ts` · `session-theme-blocks.ts` · `session-workshops.ts` · `implantations.ts` · `presence.ts` · `academy/academyStatus.ts` · `admin/stages.ts` · `parent/childProfile.ts` · `parent/gdpr.ts` · `clubs.ts` · `roles.ts` · `groups/academyStatus.ts` · `useAuthStore.ts` · `SyncQueueService.ts` · `useRecordEvaluation.ts` · `attendances.ts` ✅ · `child-club-history.ts` ✅ · `methodology.ts` ✅ · `useSessionValidation.ts` ✅

---

## Matrice de priorité

| ID | Fichier | Sévérité | Catégorie | Effort |
|----|---------|----------|-----------|--------|
| B-16 | child/dashboard/index.tsx | P0 | ARCH-1 × 3 | Faible |
| B-17 | coach/sessions/[sessionId]/notes/index.tsx | P0 | ARCH-1 × 3 + TODO orphelin | Faible |
| B-18 | parent/notifications/index.tsx | P0 | ARCH-1 × 3 | Moyen |
| B-19 | parent/children/[childId]/progress/index.tsx | P0 | ARCH-1 | Très faible |
| W-08 | dashboard/page.tsx:244 | P1 | null non gardé | Très faible |
| W-09 | auth/login.tsx:100 | P1 | Error ignorée + ARCH-1 fallback | Faible |
| W-10 | dashboard/page.tsx:219 | P1 | null non gardé | Très faible |

---

## Verdict Final

```
╔══════════════════════════════════════════════════════╗
║  VERDICT : ⚠️ PASS WITH WARNINGS                    ║
║                                                      ║
║  Premier rapport : 15 P0 + 7 P1 → tous corrigés ✅  ║
║                                                      ║
║  Nouvelles issues détectées :                        ║
║  P0 Blockers : 4 (ARCH-1 hors-scope initial)        ║
║  P1 Warnings : 3 (null guards + login fallback)     ║
║  P3 Info     : 2                                     ║
║                                                      ║
║  Gate production : ❌ BLOQUÉ sur les 4 nouveaux     ║
║  BLOCKERs ARCH-1                                    ║
╚══════════════════════════════════════════════════════╝
```

**Action immédiate** : Corriger les 4 nouveaux BLOCKERs ARCH-1.
- Priorité 1 : B-19 (1 ligne, `getProfileDisplayName` existe déjà — correction triviale)
- Priorité 2 : B-16 (child/dashboard — créer `getChildDashboardData` dans api-client)
- Priorité 3 : B-17 (coach/notes — créer `listSessionAttendeesWithNotes` dans api-client)
- Priorité 4 : B-18 (parent/notifications — créer 3 fonctions api-client)
- Priorité 5 : W-08, W-10 (dashboard null guards — 2 lignes chacun)
