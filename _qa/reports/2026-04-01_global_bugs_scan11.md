# Rapport Bugs — Scan Global Codebase Aureak (11ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (11ème passage, post-Bloc N / commit 829a2b9)
**Fichiers analysés** : 52 fichiers — scope complet

---

## Résumé Exécutif

B-28/W-32/W-33 confirmés corrigés. 1 BLOCKER (B-29) + 2 warnings (W-34, W-35).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 1      |
| WARNING  | 2      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-29 — `recurrence.ts:modifySingleException` — lecture après soft-delete + snake_case/camelCase mismatch

**Fichier** : `aureak/packages/api-client/src/sessions/recurrence.ts:68-102`
**Confiance** : 95
**Description** : La fonction soft-delete d'abord, puis re-fetch la session. Si RLS/PostgREST filtre les lignes supprimées, `original` vaut `null`. De plus, le résultat DB est casté en `Session` (camelCase) alors qu'il est en snake_case → `implantationId`, `groupId` etc. valent `undefined` → RPC appelé avec des champs nuls → erreur DB ou session invalide.
**Fix** : Lire la session AVANT le soft-delete. Utiliser les clés snake_case du résultat brut.

---

## Issues Détectées — Warnings

### [WARNING] W-34 — `coach/attendance/index.tsx` — `setSaving(null)` + `setAllSaving(false)` hors `finally`

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx`
**Confiance** : 92
**Description** : Dans `handleStatus`, `setSaving(null)` est après l'`await`, pas dans un `finally`. Si `recordAttendance()` throw, le spinner reste bloqué. Même problème pour `handleAllPresent` avec `setAllSaving(false)`.
**Deadline** : Avant Gate 2.

### [WARNING] W-35 — `exports/index.tsx:59` — `tenantId` extrait par cast non-sécurisé

**Fichier** : `aureak/apps/web/app/(admin)/exports/index.tsx:59`
**Confiance** : 88
**Description** : `(user as unknown as Record<string, string>).tenant_id ?? ''` → `tenant_id` n'existe pas directement sur `User` Supabase → retourne toujours `''` → `triggerExport` appelé sans isolation tenant.
**Fix** : `useAuthStore(s => s.tenantId)`.
**Deadline** : Avant Gate 2.

---

## Vérification Bloc N

| Issue | Statut |
|-------|--------|
| B-28 — ARCH-1 `useSessionValidation.ts` | ✅ Corrigé |
| W-32 — `stages/new.tsx` `setSaving` dans `finally` | ✅ Corrigé |
| W-33 — `gdpr/index.tsx` `load()` try/catch/finally | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-29 + W-34 + W-35
