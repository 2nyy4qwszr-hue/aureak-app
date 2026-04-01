# Rapport Bugs — Scan Global Codebase Aureak (4ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (4ème passage, post-corrections scan 3 / commit 5a786c2)
**Fichiers analysés** : 75 fichiers — scope complet
**Déclencheur** : Scan global — vérification exhaustive

---

## Résumé Exécutif

Scan post-corrections complet. 1 nouveau BLOCKER (B-25) identifié : la page présence coach utilise `supabase` directement sans import — crash runtime garanti + violation ARCH-1. 8 warnings sur des `load()` sans try/catch et des catches silencieux dans des mutations.

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 1      |
| WARNING  | 8      |
| INFO     | 1      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-25 — `attendance/index.tsx` coach : `supabase` utilisé sans import — crash runtime + ARCH-1

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx:330,337,354,357`
**Description** : La fonction `load` appelle `supabase.from(...)` 4 fois mais aucun import de `supabase` n'existe dans le fichier. `ReferenceError: supabase is not defined` à chaque ouverture de la page. Violation ARCH-1 (accès Supabase hors `@aureak/api-client`).
**Impact** : Page présence coach inutilisable en production — CRASH garanti.
**Correction** : Créer `listSessionAttendeeRoster(sessionId)` dans `@aureak/api-client/src/sessions/attendances.ts` pour `session_attendees`, utiliser les fonctions existantes pour la résolution des noms.

---

## Issues Détectées — Warnings

### [WARNING] W-14 — `(admin)/attendance/index.tsx` : load() sans try/catch, setLoading non garanti

**Fichier** : `aureak/apps/web/app/(admin)/attendance/index.tsx:266-282`
**Description** : `setLoading(false)` en fin de fonction body, pas dans `finally`. Pas de try/catch. Exception → spinner bloqué indéfiniment.
**Deadline** : Avant Gate 2.

### [WARNING] W-15 — `seances/[sessionId]/page.tsx:135` : console.error sans garde NODE_ENV

**Fichier** : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx:135`
**Description** : `console.error('[SessionDetail] load error:', err)` sans `if (process.env.NODE_ENV !== 'production')`. Seule déviation dans tout le codebase.
**Deadline** : Avant Gate 2.

### [WARNING] W-16 — `seances/page.tsx:114` : rejet silencieux de listSchoolCalendarExceptions

**Fichier** : `aureak/apps/web/app/(admin)/seances/page.tsx:114`
**Description** : `.then(r => setExceptions(r.data ?? []))` sans `.catch()`. Erreur réseau silencieusement avalée.
**Deadline** : Avant Gate 2.

### [WARNING] W-17 — `children/[childId]/page.tsx` : 3 catches silencieux dans mutations

**Fichier** : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx:360-364,371-372,596`
**Description** : `handleAddMembership`, `handleRemoveMembership`, `handleDelete` (blessures) — catches explicitement silencieux (`// erreur silencieuse`, `/* silencieux */`, `/* ignore */`). L'UI paraît avoir réussi alors que la mutation a échoué.
**Deadline** : Avant Gate 2.

### [WARNING] W-18 — `gdpr/index.tsx:39-48` : handleProcess sans gestion d'erreur fetch

**Fichier** : `aureak/apps/web/app/(admin)/gdpr/index.tsx:39-48`
**Description** : `fetch('/api/generate-gdpr-export', ...)` sans try/catch. Non-2xx non détecté. `load()` appelé quoi qu'il arrive.
**Deadline** : Avant Gate 2.

### [WARNING] W-19 — `audit/index.tsx:24-33` : handleExport sans try/catch

**Fichier** : `aureak/apps/web/app/(admin)/audit/index.tsx:24-33`
**Description** : `fetch(...)` + `res.json()` sans try/catch. Sur erreur réseau, `setExporting(false)` jamais appelé → bouton Export bloqué définitivement.
**Deadline** : Avant Gate 2.

### [WARNING] W-20 — `exports/index.tsx` : load() et handleCreate sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/exports/index.tsx:35-40,44-58`
**Description** : `load()` sans try/catch, `setLoading(false)` pas dans `finally`. `handleCreate` : si `createExportJob` throw, `setCreating(false)` jamais appelé → bouton bloqué.
**Deadline** : Avant Gate 2.

### [WARNING] W-21 — `coaches/[coachId]/grade.tsx:28-39` : load() Promise.all sans try/catch

**Fichier** : `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx:28-39`
**Description** : `Promise.all([...])` sans try/catch. Exception → `setLoading(false)` jamais appelé → page bloquée sur "Chargement..." sans feedback.
**Deadline** : Avant Gate 2.

---

## Info

### [INFO] I-04 — `useSessionValidation.ts` : accès Supabase via re-export @aureak/api-client

**Fichier** : `aureak/packages/business-logic/src/sessions/useSessionValidation.ts`
**Observation** : Import de `supabase` depuis `@aureak/api-client` (pas depuis `supabase-js`). Conforme à la lettre de la règle ARCH-1. À refactoriser à terme : exposer `getSessionValidationStatus(sessionId)` dans `api-client`.

---

## Fichiers sans issue (sélection)

- `packages/api-client/src/*` — OK (sauf corrections en cours)
- `apps/web/app/(admin)/stages/*` — OK
- `apps/web/app/(admin)/users/new.tsx` — OK (B-24 résolu)
- `apps/web/app/(admin)/dashboard/page.tsx` — OK (W-13 résolu)
- `apps/web/app/(admin)/seances/page.tsx` — OK (load principal, W-16 isolé)
- `apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx` — OK
- `apps/web/app/(child)/child/dashboard/index.tsx` — OK (B-16 résolu)
- `apps/web/app/(parent)/parent/notifications/index.tsx` — OK (B-18 résolu)
- `packages/business-logic/src/stores/useAuthStore.ts` — OK
- `packages/business-logic/src/sync/SyncQueueService.ts` — OK

---

## Verdict Final

**Verdict** : ✅ PRÊT POUR PRODUCTION

- [x] B-25 corrigé — commit 9cd1c87 (Bloc H)
- [x] W-14 à W-21 corrigés — commit 9cd1c87 (Bloc H)

**Clôturé le** : 2026-04-01
