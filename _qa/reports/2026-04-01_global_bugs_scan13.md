# Rapport Bugs — Scan Global Codebase Aureak (13ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (13ème passage, post-Bloc P / commit e60415c)
**Fichiers analysés** : 52 fichiers — scope complet

---

## Résumé Exécutif

B-30/W-36/W-37 confirmés corrigés. 4 BLOCKERs (B-31→B-34) + 2 warnings (W-38, W-39).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 4      |
| WARNING  | 2      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-31 — `stages/[stageId]/page.tsx:495-516` — `load()` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx:495-516`
**Confiance** : 92
**Description** : `load()` appelle `getStage`, `listAvailableCoaches`, `listStageDays`, `listStageBlocks` sans try/catch. Si l'une de ces promesses throw, `setLoading(false)` n'est jamais appelé → spinner infini.
**Fix** : Entourer le corps de `load()` d'un try/catch/finally avec `setLoading(false)` dans `finally`.

---

### [BLOCKER] B-32 — `clubs/new.tsx:174-217` — `setSubmitting(false)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/new.tsx:174-217`
**Confiance** : 91
**Description** : `handleSubmit` appelle `setSubmitting(true)` puis `createClubDirectoryEntry()`. Si la promesse throw, `setSubmitting(false)` (ligne 209) n'est jamais atteint → bouton "Créer" définitivement désactivé.
**Fix** : try/catch/finally, `setSubmitting(false)` dans `finally`.

---

### [BLOCKER] B-33 — `clubs/[clubId]/page.tsx:386-415` — `setSaving(false)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx:386-415`
**Confiance** : 90
**Description** : `handleSave` appelle `uploadClubLogo` et `updateClubDirectoryEntry` sans try/catch global. Si l'une throw, `setSaving(false)` n'est pas atteint → bouton "Enregistrer" définitivement bloqué.
**Fix** : try/catch/finally, `setSaving(false)` dans `finally`, supprimer les `setSaving(false)` inline.

---

### [BLOCKER] B-34 — `clubs/[clubId]/page.tsx:472-491` — `unlinkPlayer` + `unlinkCoach` sans try/catch

**Fichier** : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx:472-491`
**Confiance** : 88
**Description** : `unlinkPlayer` et `unlinkCoach` appellent les API sans try/catch. Si l'appel échoue, l'état local est quand même mis à jour (joueur/coach supprimé de l'UI sans confirmation de succès côté serveur).
**Fix** : try/catch, ne modifier le state local que si l'appel réussit, afficher `setError` en cas d'échec.

---

## Issues Détectées — Warnings

### [WARNING] W-38 — `gdpr/index.tsx:110` — "Rejeter" sans `.catch()`

**Fichier** : `aureak/apps/web/app/(admin)/gdpr/index.tsx:110`
**Confiance** : 85
**Description** : `processGdprRequest(req.id, 'rejected').then(() => load())` sans `.catch()` → erreur silencieuse, aucun feedback utilisateur.
**Fix** : Ajouter `.catch(err => { if (process.env.NODE_ENV !== 'production') console.error(...) })`
**Deadline** : Avant Gate 2.

### [WARNING] W-39 — `coach/attendance/index.tsx:405-409` — debounce `saveCoachNote` sans try/catch

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/[sessionId]/attendance/index.tsx:405-409`
**Confiance** : 84
**Description** : Le callback debounce dans `handleNoteChange` appelle `saveCoachNote` sans try/catch. Si l'appel échoue, `notesDirty` est quand même remis à `false` → faux indicateur "sauvegardé", `setSavingNote(null)` jamais atteint.
**Fix** : try/catch/finally dans le callback, `setSavingNote(null)` dans `finally`, `notesDirty` remis à `false` uniquement sur succès.
**Deadline** : Avant Gate 2.

---

## Vérification Bloc P

| Issue | Statut |
|-------|--------|
| B-30 — `coaches/grade.tsx` `setWorking(false)` dans `finally` | ✅ Corrigé |
| W-36 — `seances/[sessionId]/page.tsx` `.catch()` non silencieux | ✅ Corrigé |
| W-37 — `clubs/[clubId]/page.tsx` `handleDelete` avec try/catch | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-31 + B-32 + B-33 + B-34 + W-38 + W-39
