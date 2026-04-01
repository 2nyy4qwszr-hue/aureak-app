# Rapport Bugs — Scan Global Codebase Aureak (18ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (18ème passage, post-Bloc U / commit caf4096)
**Fichiers analysés** : scope complet

---

## Résumé Exécutif

B-48→B-55 confirmés corrigés. 2 BLOCKERs (B-56→B-57) + 3 warnings (W-45→W-47).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 2      |
| WARNING  | 3      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-56 — `children/new/page.tsx` — `setSaving(false)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/children/new/page.tsx:187-232`
**Confiance** : 85
**Description** : `setSaving(false)` appelé dans les branches try et catch, mais pas dans un bloc `finally`. Pattern fragile — conforme à la règle : doit être dans `finally`.
**Fix** : `try { ... } catch { ... } finally { setSaving(false) }`

---

### [BLOCKER] B-57 — `dashboard/page.tsx` — `setResolving(null)` hors finally

**Fichier** : `aureak/apps/web/app/(admin)/dashboard/page.tsx:261-266`
**Confiance** : 92
**Description** : `handleResolve` — `setResolving(id)` puis `await resolveAnomaly(id)` sans try/catch. Si throw, `resolving` reste non-null → bouton "Résoudre" définitivement désactivé.
**Fix** : `try { await resolveAnomaly; await load() } catch { ... } finally { setResolving(null) }`

---

## Issues Détectées — Warnings

### [WARNING] W-45 — `child/avatar/index.tsx` — `setSaving` hors finally dans `handleEquip`

**Fichier** : `aureak/apps/web/app/(child)/child/avatar/index.tsx:45-52`
**Confiance** : 88
**Description** : `setSaving(true)` sans try/catch/finally → sur erreur, boutons equip définitivement désactivés.
**Fix** : `try { ... } catch { ... } finally { setSaving(false) }`

### [WARNING] W-46 — `seances/new.tsx` — `setLoadingGroups(false)` uniquement dans `.then()`

**Fichier** : `aureak/apps/web/app/(admin)/seances/new.tsx:748-757`
**Confiance** : 85
**Description** : `listGroupsByImplantation(...).then(() => setLoadingGroups(false))` sans `.catch()`. Si reject, `loadingGroups` reste true → dropdown groupes bloqué.
**Fix** : Ajouter `.catch(() => setGroups([])).finally(() => setLoadingGroups(false))`

### [WARNING] W-47 — Unguarded `console.error`/`console.warn` dans api-client

**Fichiers** : `aureak/packages/api-client/src/auth.ts:79`, `aureak/packages/api-client/src/admin/club-directory.ts:170,195,234`
**Confiance** : 80
**Fix** : `if (process.env.NODE_ENV !== 'production') console.error/warn(...)`

---

## Vérification Bloc U

| Issue | Statut |
|-------|--------|
| B-48 — `implantations` handleAddGroup → finally | ✅ Corrigé |
| B-49 — `groups` GroupStaffSection.handleRemove → finally | ✅ Corrigé |
| B-50 — `groups` GroupMembersSection.handleRemove → finally | ✅ Corrigé |
| B-51 — `partnerships` load() → finally | ✅ Corrigé |
| B-52 — `clubs/page` load() → finally | ✅ Corrigé |
| B-53 — `users/[userId]` load() → finally | ✅ Corrigé |
| B-54 — `clubs/[clubId]` handleLogoDelete → finally | ✅ Corrigé |
| B-55 — `groups/[groupId]` loadAll → finally | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-56 + B-57 + W-45→W-47
