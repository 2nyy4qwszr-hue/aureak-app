# Rapport Bugs — Scan Global Codebase Aureak (5ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (5ème passage, post-corrections Bloc H / commit 9cd1c87)
**Fichiers analysés** : 52 fichiers — scope complet
**Déclencheur** : Vérification post-Bloc H (corrections B-25, W-14→W-21)

---

## Résumé Exécutif

Aucun BLOCKER détecté. B-25 est bien corrigé : `coach/attendance` utilise exclusivement
`listSessionAttendeeRoster` + `batchResolveAttendeeNames` depuis `@aureak/api-client` — ARCH-1 respecté.
W-14→W-21 tous vérifiés comme corrigés.

4 warnings résiduels (pré-existants, non introduits par Bloc H) :
1. `load()` sans try/catch → `setLoading(false)` jamais atteint si throw → page bloquée.
2. Mutations silencieuses (`catch { /* ignore */ }`) sur données joueurs → désynchronisation UI/DB.

**Verdict** : ✅ CLEAN (0 BLOCKER, 4 warnings)

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 0      |
| WARNING  | 4      |

---

## Issues Détectées — BLOCKERs

Aucun BLOCKER détecté.

---

## Issues Détectées — Warnings

### [WARNING] W-22 — `audit/index.tsx` : load() sans try/catch, setLoading non garanti

**Fichier** : `aureak/apps/web/app/(admin)/audit/index.tsx:14-19`
**Description** : `load()` appelle `listAuditLogs(filters)` sans try/catch. Si la requête throw, `setLoading(false)` n'est jamais atteint → page bloquée sur "Chargement…" indéfiniment.
**Deadline** : Avant Gate 2.

### [WARNING] W-23 — `coach/evaluations/index.tsx` : load() sans try/catch

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/evaluations/index.tsx:131-160`
**Description** : `load()` enchaîne 4 appels API (`getSessionById`, `listMergedEvaluations`, `listPresentChildIdsForSession`, `resolveProfileDisplayNames`) sans try/catch. Si l'un throw, `setLoading(false)` jamais atteint → coaches voient le skeleton indéfiniment. Impact direct opérations terrain.
**Deadline** : Avant Gate 2.

### [WARNING] W-24 — `children/[childId]/page.tsx` : 4 mutations silencieuses (blessures, photos, actif)

**Fichier** : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx:600,886,895,1187`
**Description** : `handleDelete` (blessure), `handleSetCurrent` (photo), `handleDelete` (photo), toggle `actif` — tous avec `catch { /* ignore */ }`. UI paraît avoir réussi alors que la DB a échoué (données joueurs mineurs).
**Deadline** : Avant Gate 2 — priorité haute.

### [WARNING] W-25 — `parent/football-history/index.tsx` : load() sans try/catch

**Fichier** : `aureak/apps/web/app/(parent)/parent/children/[childId]/football-history/index.tsx:286-291`
**Description** : `load()` appelle `listHistoryByChild(childId)` sans try/catch. Si throw, `setLoading(false)` jamais atteint → parents voient spinner infini sur l'historique football.
**Deadline** : Avant Gate 2.

---

## Vérification corrections Bloc H

| Issue | Statut |
|-------|--------|
| B-25 — `supabase` direct dans `coach/attendance` | ✅ Corrigé — `listSessionAttendeeRoster` + `batchResolveAttendeeNames` |
| W-14 — `attendance/index.tsx` admin load() finally | ✅ Corrigé |
| W-15 — `seances/[sessionId]/page.tsx` NODE_ENV guard | ✅ Corrigé |
| W-16 — `seances/page.tsx` listSchoolCalendarExceptions .catch() | ✅ Corrigé |
| W-17 — `children/[childId]/page.tsx` catches silencieux membership/stage | ✅ Corrigé |
| W-18 — `gdpr/index.tsx` handleProcess try/catch/finally | ✅ Corrigé |
| W-19 — `audit/index.tsx` handleExport try/catch/finally | ✅ Corrigé |
| W-20 — `exports/index.tsx` load() + handleCreate try/catch/finally | ✅ Corrigé |
| W-21 — `coaches/grade.tsx` load() try/catch/finally | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ✅ PRÊT POUR PRODUCTION (sous réserve correction des 4 warnings)

- [ ] 0 BLOCKER
- [ ] 4 Warnings (deadline : avant Gate 2)
  - W-24 en priorité (mutations silencieuses données joueurs)
  - W-22/W-23/W-25 ensuite (blocages loading)

**Action suivante** : Corriger W-22→W-25, puis déployer.
