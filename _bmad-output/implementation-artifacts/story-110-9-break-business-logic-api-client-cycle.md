# Story 110.9 : Casser le require cycle business-logic ↔ api-client

Status: ready-for-dev

## Story

En tant que **dev Aureak**,
je veux **éliminer le require cycle entre `@aureak/business-logic` et `@aureak/api-client`**,
afin de **supprimer le warning Metro et éviter les valeurs `undefined` à l'init de modules sur cold start**.

## Contexte

Warning Metro dev (2026-05-03) :

```
Require cycle:
  ../../packages/business-logic/src/index.ts →
  ../../packages/business-logic/src/stores/useAuthStore.ts →
  ../../packages/api-client/src/index.ts →
  ../../packages/api-client/src/admin/trial-usage.ts →
  ../../packages/business-logic/src/index.ts
```

Trace :
- `business-logic/index.ts` re-exporte `stores/useAuthStore.ts`
- `useAuthStore.ts` importe `{ supabase, type Session, type User }` de `@aureak/api-client`
- `api-client/index.ts` re-exporte `admin/trial-usage.ts`
- `trial-usage.ts` importe `{ processTrialOutcome }` de `@aureak/business-logic`

Le cycle est purement architectural : api-client devrait être 100% pur (accès Supabase + mapping DB→TS), business-logic au-dessus pour les use cases métier.

## Acceptance Criteria

- **AC1 — Cycle cassé** : `metro bundle` plus de warning "Require cycle: …business-logic … api-client …".
- **AC2 — Option recommandée** : sortir `processTrialOutcome` de `@aureak/business-logic` vers une fonction pure locale dans `@aureak/api-client/src/admin/trial-usage.ts` OU déplacer `useAuthStore.ts` ailleurs (apps/web/stores/) car il importe Supabase de toute façon.
- **AC3 — Pas de régression** : tous les imports `useAuthStore` et `processTrialOutcome` continuent de résoudre. tsc OK. Tests Vitest existants OK (Vitest est dans @aureak/business-logic).
- **AC4 — Pas de régression UX** : application tourne après refacto, login fonctionne, trial-usage flow fonctionne.
- **AC5 — Conformité ARCH** : api-client reste pur DB. Business-logic peut consommer api-client mais l'inverse interdit (sauf via un 3ème package neutre comme `@aureak/types` ou `@aureak/shared-pure`).

## Tasks / Subtasks

- [ ] **T1 — Choix solution** :
  - **Solution A (recommandée)** : inliner la logique de `processTrialOutcome` dans `api-client/admin/trial-usage.ts` (fonction privée). Petit, peu de code partagé.
  - **Solution B** : extraire `processTrialOutcome` dans un nouveau package `@aureak/shared-pure` (ou `@aureak/types/business-rules`) sans dépendances. Plus propre long terme.
  - **Solution C** : déplacer `useAuthStore.ts` vers `aureak/apps/web/lib/stores/` ou `aureak/apps/web/contexts/`. Casse aussi le cycle mais change le pattern (state global plus dans business-logic).
- [ ] **T2 — Implémentation** : appliquer la solution choisie
- [ ] **T3 — Suppression imports cycliques** : retirer les `from '@aureak/business-logic'` dans api-client (sauf si solution C)
- [ ] **T4 — Vérification** :
  - `cd aureak && npx tsc --noEmit -p .`
  - Vitest si tests existent : `cd aureak/packages/business-logic && npm test`
  - Lancer le dev server, vérifier que le warning Require cycle a disparu
- [ ] **T5 — Test manuel** : login flow + un appel trial-usage (si UI disponible) → pas de régression

## Fichiers touchés

### Solution A
- `aureak/packages/api-client/src/admin/trial-usage.ts` (inline processTrialOutcome)
- `aureak/packages/business-logic/src/index.ts` (retirer export processTrialOutcome si plus utilisé ailleurs)

### Solution B
- Nouveau package `aureak/packages/shared-pure/` OU nouveau fichier dans `@aureak/types/`
- `aureak/packages/api-client/src/admin/trial-usage.ts` (import depuis le nouveau)
- `aureak/packages/business-logic/src/index.ts` (re-export)

### Solution C
- `aureak/apps/web/contexts/AuthContext.tsx` ou similar (déplacer useAuthStore)
- Tous les imports `from '@aureak/business-logic'` qui utilisent useAuthStore (grep)

## Notes

- Vérifier d'abord ce qu'est `processTrialOutcome` (probablement une fonction pure de calcul de patch après une séance d'essai). Si c'est court (<100 lignes) → Solution A.
- Si c'est long ou utilisé ailleurs → Solution B.
- Solution C casse le pattern Aureak où les stores sont dans business-logic — éviter sauf raison forte.
- Memory `architecture-details` à mettre à jour si décision structurante.
