# Rapport Bugs — Scan Global Codebase Aureak (17ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (17ème passage, post-Bloc T / commit fa1cd7f)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-47/W-44 confirmés corrigés. 7 BLOCKERs (B-48→B-55), aucun warning.

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 7      |
| WARNING  | 0      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-48 — `implantations/index.tsx` — `setAddingGroup` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/implantations/index.tsx:290-308`
**Confiance** : 100
**Description** : `handleAddGroup` sans try/catch/finally. Si `createGroup` ou `loadGroups` throw, `setAddingGroup` reste true → bouton "Ajouter groupe" définitivement bloqué.
**Fix** : `try { ... } catch { ... } finally { setAddingGroup(false) }`

### [BLOCKER] B-49 — `groups/[groupId]/page.tsx` — `GroupStaffSection.handleRemove` : `setRemoving` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx:377-382`
**Confiance** : 100
**Description** : `setRemoving(id)` avant `await removeGroupStaff(id)` sans try/catch. Si throw, `setRemoving` reste non-null → tous les boutons "supprimer" du staff désactivés.
**Fix** : `try { ... } finally { setRemoving(null) }`

### [BLOCKER] B-50 — `groups/[groupId]/page.tsx` — `GroupMembersSection.handleRemove` : `setRemoving` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx:566-571`
**Confiance** : 100
**Description** : Même pattern que B-49 dans la section membres.
**Fix** : `try { ... } finally { setRemoving(null) }`

### [BLOCKER] B-51 — `partnerships/index.tsx` — `load()` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/partnerships/index.tsx:30-45`
**Confiance** : 100
**Description** : `setLoading(false)` inline seulement. Tout throw laisse la page partenariats en spinner permanent.
**Fix** : `try { ... } catch { ... } finally { setLoading(false) }`

### [BLOCKER] B-52 — `clubs/page.tsx` — `load()` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/page.tsx:80-93`
**Confiance** : 100
**Description** : `setLoading(false)` inline. Tout throw = spinner permanent sur la liste clubs.
**Fix** : `try { ... } catch { ... } finally { setLoading(false) }`

### [BLOCKER] B-53 — `users/[userId]/index.tsx` — `load()` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/users/[userId]/index.tsx:85-103`
**Confiance** : 100
**Description** : `Promise.all([getUserProfile, listLifecycleEvents])` sans try/catch. `setLoading(false)` non atteint sur erreur.
**Fix** : `try { ... } catch { ... } finally { setLoading(false) }`

### [BLOCKER] B-54 — `clubs/[clubId]/page.tsx` — `handleLogoDelete` : `setLogoUploading` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx:449-457`
**Confiance** : 100
**Description** : `setLogoUploading(true)` avant 2 awaits sans try/catch. Tout throw = UI logo gelée.
**Fix** : `try { ... } catch { ... } finally { setLogoUploading(false) }`

### [BLOCKER] B-55 — `groups/[groupId]/page.tsx` — `loadAll` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx:998-1012`
**Confiance** : 100
**Description** : `Promise.all` de 6 appels sans try/catch. Tout throw = skeleton permanent sur la page groupe.
**Fix** : `try { ... } catch { ... } finally { setLoading(false) }`

---

## Vérification Bloc T

| Issue | Statut |
|-------|--------|
| B-47 — `players/[playerId]/page.tsx` load() → finally | ✅ Corrigé |
| W-44 — `rbfa-sync.ts` console.info → NODE_ENV guard | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-48→B-55
