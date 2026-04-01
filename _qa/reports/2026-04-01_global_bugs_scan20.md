# Rapport Bugs — Scan Global Codebase Aureak (20ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (20ème passage, post-Bloc W / commit 9064e31)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-58→B-60/W-48 confirmés corrigés. 11 BLOCKERs (B-61→B-71) + 1 warning (W-49).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 11     |
| WARNING  | 1      |

---

## Issues Détectées — BLOCKERs

| ID | Fichier | Description |
|----|---------|-------------|
| B-61 | `seances/new.tsx:728-742,1127-1132` | `setLoadingImplantations(false)` dans `.then()` sans `.finally()` |
| B-62 | `methodologie/situations/[situationKey]/page.tsx:63-79` | `fetchData()` sans try/finally |
| B-63 | `methodologie/situations/page.tsx:35-39` + `situations/index.tsx:32-37` | `setLoading(false)` dans `.then()` / inline |
| B-64 | `methodologie/theme-groups/page.tsx:62-67` | `fetchGroups()` sans try/finally |
| B-65 | `settings/school-calendar/page.tsx:35-55` | `load()` + `handleAdd()` sans try/finally |
| B-66 | `access-grants/page.tsx:65-82` | `fetchGrants()` + `handleRevoke()` sans try/finally |
| B-67 | `child/avatar/index.tsx:31-43` | `Promise.all.then()` sans `.catch().finally()` |
| B-68 | `seances/page.tsx:131-146` | `handleGenerate()` sans try/finally |
| B-69 | `SectionIdentite.tsx:56-65` | `handleSave()` sans try/finally |
| B-70 | `BlocsManagerModal.tsx:26-80` | `loadBlocs`, `handleSaveEdit`, `handleDelete` sans try/finally |
| B-71 | `dashboard/comparison.tsx:116-124` | `load()` sans try/finally |

## Issues Détectées — Warnings

| ID | Fichier | Description |
|----|---------|-------------|
| W-49 | `players/[playerId]/page.tsx:121,223,338` | `.catch(() => {})` silencieux — ajouter console.error en dev |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-61→B-71 + W-49
