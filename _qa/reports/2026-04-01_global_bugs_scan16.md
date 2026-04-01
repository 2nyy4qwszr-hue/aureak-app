# Rapport Bugs — Scan Global Codebase Aureak (16ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (16ème passage, post-Bloc S / commit 2e1c6a7)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-43→B-46/W-43 confirmés corrigés. 1 BLOCKER (B-47) + 1 warning (W-44).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 1      |
| WARNING  | 1      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-47 — `players/[playerId]/page.tsx` — `load()` principale sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx:521-532`
**Confiance** : 100
**Description** : `load()` appelle `Promise.all([getAdminPlayerProfile, getChildAcademyStatus])` sans try/catch. `setLoading(false)` ligne 529 uniquement sur le chemin heureux. Tout throw laisse l'écran en skeleton permanent.
**Fix** : `try { ... } catch { ... } finally { setLoading(false) }`

---

## Issues Détectées — Warnings

### [WARNING] W-44 — `api-client/src/admin/rbfa-sync.ts:189` — `console.info` sans garde NODE_ENV

**Fichier** : `aureak/packages/api-client/src/admin/rbfa-sync.ts:189`
**Confiance** : 82
**Description** : `console.info(...)` sans `NODE_ENV` guard dans `processClub()`, appelée depuis le navigateur via le bouton "Lancer l'import". Émet des logs verbeux en production pour chaque club avec fallback logo.
**Fix** : `if (process.env.NODE_ENV !== 'production') console.info(...)`

---

## Vérification Bloc S

| Issue | Statut |
|-------|--------|
| B-43 — `rbfa-sync/page.tsx` loadStats → finally | ✅ Corrigé |
| B-44 — `rbfa-sync/reviews/page.tsx` load() → finally | ✅ Corrigé |
| B-45 — `rbfa-sync/reviews/page.tsx` handleConfirm/Reject → finally | ✅ Corrigé |
| B-46 — `players/[playerId]/page.tsx` 3 onglets → .finally() | ✅ Corrigé |
| W-43 — `seances/edit.tsx` console.warn → NODE_ENV guard | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-47 + W-44
