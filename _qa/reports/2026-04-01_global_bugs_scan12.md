# Rapport Bugs — Scan Global Codebase Aureak (12ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (12ème passage, post-Bloc O / commit b918182)
**Fichiers analysés** : 52 fichiers — scope complet

---

## Résumé Exécutif

B-29/W-34/W-35 confirmés corrigés. 1 BLOCKER (B-30) + 2 warnings (W-36, W-37).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 1      |
| WARNING  | 2      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-30 — `coaches/[coachId]/grade.tsx:67` — `setWorking(false)` hors `finally`

**Fichier** : `aureak/apps/web/app/(admin)/coaches/[coachId]/grade.tsx:48-68`
**Confiance** : 88
**Description** : Dans `handleAward`, `setWorking(false)` est après le bloc if/else mais hors `finally`. Si `sendGradeNotification()` throw, le bouton "Attribuer" reste désactivé définitivement.
**Fix** : `try/catch/finally` avec `setWorking(false)` dans `finally`.

---

## Issues Détectées — Warnings

### [WARNING] W-36 — `seances/[sessionId]/page.tsx` — `.catch(() => {})` silencieux dans la recherche invités

**Fichier** : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
**Confiance** : 85
**Description** : `listChildDirectory(...).catch(() => {})` — catch vide, aucun feedback ni log. Utilisateur ne peut pas distinguer "pas de résultat" de "erreur réseau".
**Fix** : `.catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] guestSearch error:', err) })`
**Deadline** : Avant Gate 2.

### [WARNING] W-37 — `clubs/[clubId]/page.tsx:417-422` — `handleDelete` sans try/catch, redirection même sur erreur

**Fichier** : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx:417-422`
**Confiance** : 82
**Description** : Si `softDeleteClubDirectoryEntry` échoue, `router.replace('/clubs')` est quand même appelé → utilisateur redirigé alors que le club n'a pas été supprimé.
**Fix** : `try/catch`, appeler `router.replace` uniquement si succès.
**Deadline** : Avant Gate 2.

---

## Vérification Bloc O

| Issue | Statut |
|-------|--------|
| B-29 — `recurrence.ts` lecture avant soft-delete + snake_case | ✅ Corrigé |
| W-34 — `coach/attendance` `setSaving(null)` dans `finally` | ✅ Corrigé |
| W-35 — `exports/index.tsx` `tenantId` via `useAuthStore` | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-30 + W-36 + W-37
