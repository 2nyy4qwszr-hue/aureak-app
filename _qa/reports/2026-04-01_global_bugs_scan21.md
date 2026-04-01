# Rapport Bugs — Scan Global Codebase Aureak (21ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (21ème passage, post-Bloc X / commit e24531d)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-61→B-71 et W-49 confirmés corrigés (commit e24531d). 13 BLOCKERs (B-72→B-84) + 2 Warnings (W-50→W-51).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 13     |
| WARNING  | 2      |

---

## Issues Détectées — BLOCKERs

| ID | Fichier | Description |
|----|---------|-------------|
| B-72 | `partnerships/index.tsx` | `handleCreate()` : `setCreating(false)` inline sans try/finally |
| B-73 | `methodologie/seances/new.tsx` | `handleSave()` : await hors try avant le finally |
| B-74 | `SectionIdentite.tsx` | `handleSavePosition()` : `setPositionSaving` inline sans try/finally |
| B-75 | `BlocsManagerModal.tsx` | `handleAddBloc()` : `setSaving(false)` inline sans try/finally |
| B-76 | `users/[userId]/index.tsx` | `handle()` : `setWorking(false)` inline sans try/finally |
| B-77 | `parent/children/[childId]/football-history/index.tsx` | `handleSave()` : `setSaving(false)` uniquement dans catch, jamais sur succès |
| B-78 | `coaches/index.tsx` | `load()` : `setLoading(false)` inline sans try/finally |
| B-79 | `evaluations/index.tsx` | `load()` : `setLoading(false)` inline sans try/finally |
| B-80 | `methodologie/themes/[themeKey]/page.tsx` | `load()` : Promise.all awaits sans try, `setLoading(false)` inline |
| B-81 | `users/index.tsx` | `load()` : `setLoading(false)` inline sans try/finally |
| B-82 | `groups/index.tsx` | `load()` : `setLoading(false)` inline sans try/finally |
| B-83 | `coach/sessions/index.tsx` | `load()` : `setLoading(false)` inline sans try/finally |
| B-84 | `coach/sessions/index.tsx` | `handleCancel()` : `setCancelling(false)` inline sans try/finally |

## Issues Détectées — Warnings

| ID | Fichier | Description |
|----|---------|-------------|
| W-50 | `seances/new.tsx:909` | `.catch(() => {})` silencieux sur `prefillSessionAttendees` |
| W-51 | `api-client/src/admin/club-directory.ts:234` | `console.warn(...)` non protégé par NODE_ENV guard |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-72→B-84, W-50→W-51
