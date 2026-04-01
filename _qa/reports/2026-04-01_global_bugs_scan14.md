# Rapport Bugs — Scan Global Codebase Aureak (14ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (14ème passage, post-Bloc Q / commit 25d68c5)
**Fichiers analysés** : 52 fichiers — scope complet

---

## Résumé Exécutif

B-31→B-34/W-38/W-39 confirmés corrigés. 8 BLOCKERs (B-35→B-42) + 3 warnings (W-40→W-42).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 8      |
| WARNING  | 3      |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-35 — `implantations/index.tsx` — `handleCreate`/`handleSave` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/implantations/index.tsx`
**Confiance** : 95
**Description** : `setCreating(false)` / `setSaving(false)` posés inline après les await, aucun try/catch. Si une API throw, spinner permanent.
**Fix** : `try { ... } finally { setCreating/setSaving(false) }`

---

### [BLOCKER] B-36 — `coach/sessions/new/index.tsx` — `handleSubmit` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(coach)/coach/sessions/new/index.tsx`
**Confiance** : 92
**Description** : `setSaving(false)` uniquement dans le branch d'erreur early-return. Si `createSession` throw, `setSaving` n'est jamais réinitialisé.
**Fix** : `try { ... } catch { setError(...) } finally { setSaving(false) }`

---

### [BLOCKER] B-37 — `seances/[sessionId]/edit.tsx` — `handleSave` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx`
**Confiance** : 97
**Description** : Fonction volumineuse avec multiples `setSaving(false)` inline dans des branches if. Tout throw inattendu laisse le bouton "Enregistrer" définitivement bloqué.
**Fix** : Entourer le corps complet d'un `try { ... } finally { setSaving(false) }`, supprimer les calls inline.

---

### [BLOCKER] B-38 — `users/new.tsx` — `setSubmitting(false)` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/users/new.tsx`
**Confiance** : 95
**Description** : `handleSubmit` appelle `createProfileFiche` / `inviteProfileUser` sans try/catch. `setSubmitting(false)` inline seulement sur le chemin normal.
**Fix** : `try { ... } catch { ... } finally { setSubmitting(false) }`

---

### [BLOCKER] B-39 — `methodologie/seances/new.tsx` — `setSaving(false)` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/methodologie/seances/new.tsx`
**Confiance** : 93
**Description** : `handleSave` a deux `setSaving(false)` inline (branch erreur + succès). Un throw dans les `Promise.all` de liaison thèmes/situations laisse saving bloqué.
**Fix** : `try { ... } catch { setError(...) } finally { setSaving(false) }`

---

### [BLOCKER] B-40 — `groups/[groupId]/page.tsx` — 3 handlers sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`
**Confiance** : 92
**Description** : `handleSave` (GroupInfoEditor), `handleAdd` (GroupStaffSection), `handleAdd` (GroupMembersSection) — tous avec `setSaving(false)` inline, aucun try/catch.
**Fix** : Même pattern pour chacun.

---

### [BLOCKER] B-41 — `children/[childId]/page.tsx` — `setSaving(false)` uniquement dans catch

**Fichier** : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (AddHistoryModal.handleSave)
**Confiance** : 88
**Description** : Sur le chemin succès `onAdded()` + `onClose()`, `setSaving(false)` n'est jamais appelé. Uniquement dans le `catch`. Si la sauvegarde réussit, state `saving` reste true.
**Fix** : Déplacer `setSaving(false)` dans `finally`.

---

### [BLOCKER] B-42 — `methodologie/seances/[sessionId]/page.tsx` — `handleSave` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/methodologie/seances/[sessionId]/page.tsx`
**Confiance** : 90
**Description** : `handleSave` appelle `await updateMethodologySession(...)` sans try/catch. `setSaving(false)` inline seulement sur le chemin normal.
**Fix** : `try { ... } finally { setSaving(false) }`

---

## Issues Détectées — Warnings

### [WARNING] W-40 — `implantations/index.tsx` — `console.error` sans garde NODE_ENV

**Fichier** : `aureak/apps/web/app/(admin)/implantations/index.tsx`
**Confiance** : 85
**Fix** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

### [WARNING] W-41 — `useAuthStore.ts` — `.then()` sur auth init sans `.catch()`

**Fichier** : `aureak/packages/business-logic/src/stores/useAuthStore.ts`
**Confiance** : 82
**Description** : `supabase.auth.getSession().then(...)` sans `.catch()`. Si `resolveRole` throw, `isLoading` reste `true` → spinner infini sur toute l'app.
**Fix** : Ajouter `.catch(() => { set({ ..., isLoading: false }) })`

### [WARNING] W-42 — Couleurs hex hardcodées dans plusieurs composants (ARCH-2)

**Fichiers** : `seances/[sessionId]/edit.tsx`, `seances/page.tsx`, `seances/new.tsx`, `YearView.tsx`, `club/dashboard/index.tsx`
**Confiance** : 80
**Description** : Codes hex bruts (#DC2626, #FEE2E2, etc.) non mappés sur les tokens `@aureak/theme`.
**Deadline** : Phase 2 — non bloquant pour Gate 1.

---

## Vérification Bloc Q

| Issue | Statut |
|-------|--------|
| B-31 — `stages/[stageId]/page.tsx` `load()` try/catch/finally | ✅ Corrigé |
| B-32 — `clubs/new.tsx` `setSubmitting` dans finally | ✅ Corrigé |
| B-33 — `clubs/[clubId]/page.tsx` `handleSave` try/catch/finally | ✅ Corrigé |
| B-34 — `clubs/[clubId]/page.tsx` `unlinkPlayer`/`unlinkCoach` try/catch | ✅ Corrigé |
| W-38 — `gdpr/index.tsx` "Rejeter" `.catch()` | ✅ Corrigé |
| W-39 — `attendance/index.tsx` `saveCoachNote` try/catch/finally | ✅ Corrigé |

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES — B-35→B-42 + W-40/W-41
