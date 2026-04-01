# Rapport Bugs — Scan Global Codebase Aureak (10ème passage)

**Date** : 2026-04-01
**Agent** : bug-hunter
**Story** : N/A — Scan global (10ème passage, post-corrections Bloc M / commit d4e875f)
**Fichiers analysés** : 52 fichiers — scope complet
**Déclencheur** : Vérification post-Bloc M (correction B-27)

---

## Résumé Exécutif

B-27 confirmé corrigé. 1 BLOCKER (B-28) : ARCH-1 violée dans `useSessionValidation.ts`
qui importe et utilise `supabase` directement dans `@aureak/business-logic`.
2 warnings (W-32, W-33).

**Verdict** : ❌ BLOCKED

| Sévérité | Nombre |
|----------|--------|
| BLOCKER  | 1      |
| WARNING  | 2      |

---

## Vérification correction Bloc M (B-27)

| Issue | Statut |
|-------|--------|
| B-27 — `seances/[sessionId]/page.tsx:119` `.data` sur retour direct `getChildDirectoryEntry` | ✅ Corrigé |

---

## Issues Détectées — BLOCKERs

### [BLOCKER] B-28 — `useSessionValidation.ts` — `supabase` utilisé directement hors `@aureak/api-client`

**Fichier** : `aureak/packages/business-logic/src/sessions/useSessionValidation.ts:3,16,35,59`
**Règle violée** : ARCH-1
**Confiance** : 100
**Description** : Le hook importe et utilise directement le client `supabase` pour un polling DB (`supabase.from('sessions')...`) et une souscription Realtime (`supabase.channel(...)`, `supabase.removeChannel(...)`). Toute communication avec Supabase doit passer par des fonctions exportées de `@aureak/api-client`.
**Fix** : Créer `getSessionValidationStatus(sessionId)`, `subscribeToSessionValidation(sessionId, callback)` et `unsubscribeSessionValidation(channel)` dans `@aureak/api-client/src/sessions/sessions.ts`.

---

## Issues Détectées — Warnings

### [WARNING] W-32 — `stages/new.tsx:42-63` — `setSaving(false)` absent du `finally`

**Fichier** : `aureak/apps/web/app/(admin)/stages/new.tsx:42-63`
**Confiance** : 90
**Description** : `setSaving(false)` uniquement dans le `catch`. Si `router.push()` throw, le bouton "Créer" reste désactivé indéfiniment.
**Deadline** : Avant Gate 2.

### [WARNING] W-33 — `gdpr/index.tsx:27-32` — `load()` sans try/catch/finally

**Fichier** : `aureak/apps/web/app/(admin)/gdpr/index.tsx:27-32`
**Confiance** : 85
**Description** : `load()` sans try/catch. Exception réseau → `setLoading(false)` jamais atteint → page bloquée.
**Deadline** : Avant Gate 2.

---

## Verdict Final

**Verdict** : ❌ CORRECTIONS REQUISES

- [ ] B-28 (BLOCKER) — ARCH-1 dans `useSessionValidation.ts`
- [ ] W-32 + W-33

**Action suivante** : Corriger B-28 + W-32 + W-33 (Bloc N), puis scanner à nouveau.
