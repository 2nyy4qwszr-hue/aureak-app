# Rapport Bugs — Scan Global Codebase Aureak (22ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (22ème passage, post-Bloc Y / commit 58c881a)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-72→B-84 + W-50→W-51 confirmés corrigés. 8 BLOCKERs (B-86→B-93) + 2 Warnings (W-53→W-54).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 8      |
| WARNING  | 2      |

---

## Issues Détectées — BLOCKERs

| ID | Fichier | Description |
|----|---------|-------------|
| B-86 | `coach/dashboard/index.tsx:90` | `load()` : `setLoading(false)` inline, awaits non-gardés |
| B-87 | `club/goalkeepers/[childId]/index.tsx:246` | `load()` : `setLoading(false)` inline après await non-gardé |
| B-88 | `child/badges/index.tsx:41` | `Promise.all.then()` sans `.finally()` — `setLoading(false)` skippé si rejet |
| B-89 | `parent/children/[childId]/sessions/index.tsx:128` | `load()` : `setLoading(false)` inline sans try/finally |
| B-90 | `parent/children/[childId]/index.tsx:160` | `load()` : `setLoading(false)` inline sans try/finally |
| B-91 | `child/quiz/index.tsx:36` | `.then()` sans `.finally()` — `setLoading(false)` skippé si rejet |
| B-92 | `child/progress/index.tsx:52` | `Promise.all.then()` sans `.finally()` |
| B-93 | `parent/dashboard/index.tsx:128` | `load()` : `setLoading(false)` inline sans try/finally |

## Issues Détectées — Warnings

| ID | Fichier | Description |
|----|---------|-------------|
| W-53 | `api-client/src/supabase.ts:29` | `console.warn` protégé par `__DEV__` (Expo) au lieu de `NODE_ENV` — s'exécute en prod web |
| W-54 | `seances/new.tsx:748` | `.catch(() => {})` silencieux sur `listAvailableCoaches()` |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-86→B-93, W-53→W-54
