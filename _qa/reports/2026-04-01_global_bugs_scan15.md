# Rapport Bugs — Scan Global Codebase Aureak (15ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (15ème passage, post-Bloc R / commit 8cd6705)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-35→B-42/W-40/W-41 confirmés corrigés. 4 BLOCKERs (B-43→B-46) + 1 warning (W-43).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 4      |
| WARNING  | 1      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-43 — `clubs/rbfa-sync/page.tsx` — `setStatsLoading(false)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/rbfa-sync/page.tsx:80-86`
**Confiance** : 100
**Description** : `loadStats` sans try/catch/finally. Si `getClubRbfaStats` throw, `setStatsLoading(false)` jamais atteint → spinner permanent sur le panneau stats.
**Fix** : `try { ... } finally { setStatsLoading(false) }`

---

### [BLOCKER] B-44 — `clubs/rbfa-sync/reviews/page.tsx` — `setLoading(false)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/rbfa-sync/reviews/page.tsx:227-232`
**Confiance** : 100
**Description** : `load()` sans try/catch/finally. Si `listPendingMatchReviews` throw, `setLoading(false)` jamais atteint → page reviews bloquée en "Chargement…".
**Fix** : `try { ... } finally { setLoading(false) }`

---

### [BLOCKER] B-45 — `clubs/rbfa-sync/reviews/page.tsx` — `setProcessing(null)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/rbfa-sync/reviews/page.tsx:236-250`
**Confiance** : 100
**Description** : `handleConfirm` + `handleReject` — `setProcessing(null)` posé inline. Si l'API throw, `setProcessing` reste non-null → toute la page reviews désactivée (tous les boutons disabled car `!!processing` = true).
**Fix** : `try { ... } finally { setProcessing(null) }` pour les deux handlers.

---

### [BLOCKER] B-46 — `players/[playerId]/page.tsx` — `setLoading(false)` dans `.then()` sans `.catch()`

**Fichier** : `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx:118-122, 220-224, 327-337`
**Confiance** : 100
**Description** : 3 composants onglets chargent leurs données avec `.then(r => { ...; setLoading(false) })` sans `.catch()`. Si la Promise reject, `setLoading(false)` jamais appelé → squelette permanent sans feedback.
**Fix** : `.then(...).catch(() => {}).finally(() => setLoading(false))` pour chaque onglet.

---

## Issues Détectées — Warnings

### [WARNING] W-43 — `seances/[sessionId]/edit.tsx` — `console.warn` sans garde NODE_ENV

**Fichier** : `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx:255, 274, 287`
**Confiance** : 90
**Description** : 3 appels `console.warn('[EditSession] ...Workshop error:', error)` non protégés par `NODE_ENV`.
**Fix** : `if (process.env.NODE_ENV !== 'production') console.warn(...)`

---

## Vérification Bloc R

| Issue | Statut |
|-------|--------|
| B-35 — `implantations` handleCreate/handleSave → finally | ✅ Corrigé |
| B-36 — `coach/sessions/new` handleSubmit → finally | ✅ Corrigé |
| B-37 — `seances/edit` handleSave → finally | ✅ Corrigé |
| B-38 — `users/new` setSubmitting → finally | ✅ Corrigé |
| B-39 — `methodologie/seances/new` handleSave → finally | ✅ Corrigé |
| B-40 — `groups/[groupId]` 3 handlers → finally | ✅ Corrigé |
| B-41 — `children/[childId]` AddHistoryModal → finally | ✅ Corrigé |
| B-42 — `methodologie/seances/[sessionId]` handleSave → finally | ✅ Corrigé |
| W-40 — `implantations` NODE_ENV guard | ✅ Corrigé |
| W-41 — `useAuthStore` .catch() ajouté | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-43→B-46 + W-43
