# Story 89.6 : Séance gratuite usage unique traçable

Status: done

## Story

En tant qu'admin,
je veux que chaque prospect n'ait droit qu'à UNE séance gratuite, traçable dans le système,
afin d'éviter les abus et de mesurer le taux de conversion essai → inscription.

## Acceptance Criteria

1. Colonne `trial_used` (boolean, default false) sur `child_directory`
2. Colonne `trial_date` (timestamp nullable) sur `child_directory`
3. Colonne `trial_outcome` (enum: `present`, `absent`, `cancelled`, null) sur `child_directory`
4. Quand un prospect confirme sa séance d'essai, `trial_used = true`
5. Si le prospect est absent à sa séance d'essai → pas de deuxième chance (statut final traçable)
6. Si le prospect est présent → statut passe à `candidat`
7. Dashboard stats : taux de conversion par étape du funnel (prospect → invité → essai → candidat → inscrit)
8. L'admin peut exceptionnellement réinitialiser le droit à l'essai (override manuel)

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #2, #3)
  - [x] `ALTER TABLE child_directory ADD COLUMN trial_used boolean DEFAULT false`
  - [x] `ALTER TABLE child_directory ADD COLUMN trial_date timestamptz`
  - [x] Créer enum `trial_outcome` + colonne
  - [x] Étendre enum `prospect_status` avec valeur `'candidat'` (AC #6)
- [x] Task 2 — Logique métier (AC: #4, #5, #6)
  - [x] Dans `@aureak/business-logic` : `processTrialOutcome(input)` (fonction pure)
  - [x] Si `present` → update `prospect_status = 'candidat'` (conditionnel sur funnel)
  - [x] Si `absent` → trace sans reset, pas de promotion (AC #5)
  - [x] Tests unitaires vitest
- [x] Task 3 — API client (AC: #4, #7, #8)
  - [x] `recordTrialOutcome({childId, outcome})` dans `@aureak/api-client`
  - [x] `resetTrialRight(childId)` — admin only, override exceptionnel (AC #8)
  - [x] `getProspectFunnelStats()` — compteurs par étape (AC #7)
  - [x] Edge Function `confirm-trial-slot` : maj `trial_used=true` + `trial_date=NOW` à confirmation (AC #4)
- [x] Task 4 — UI funnel stats (AC: #7)
  - [x] Page `/developpement/prospection/gardiens` — dashboard funnel complet
  - [x] Compteurs par étape avec % de conversion
  - [x] Listing des essais consommés + actions (setOutcome, resetTrial)
  - [x] Lien vers cette page depuis `/developpement/prospection`

## Dev Notes

- L'essai gratuit est un levier commercial clé — sa mesure est importante pour le business
- Le reset admin est un override exceptionnel (ex: enfant malade le jour de l'essai)
- Le funnel stats peut être simple en V1 : juste les compteurs par statut dans child_directory

### References

- [Brainstorming: idées #19, #22 Prospection — funnel gardien, séance gratuite usage unique]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.7 (1M context) — pipeline dev agent

### Debug Log References
—

### Completion Notes List
- Extension `prospect_status` enum (valeur `'candidat'`) via `ALTER TYPE ... ADD VALUE` idempotent (Context7 PostgreSQL docs).
- `processTrialOutcome` est une **pure function** dans `@aureak/business-logic` — pas d'accès DB. L'api-client `recordTrialOutcome` fait la lecture + la fusion + l'UPDATE.
- La promotion `invite → candidat` est **conditionnelle** sur le statut courant (prospect/contacte/invite), pour ne pas écraser un statut plus avancé.
- L'Edge Function `confirm-trial-slot` (Story 89.5) a été étendue : dès confirmation parent, on marque `trial_used=true` + `trial_date=NOW`. `trial_outcome` reste null tant que la séance n'a pas eu lieu (admin l'enregistre ensuite).
- La RLS de `child_directory` est gérée au niveau table (policies UPDATE admin-only via `current_user_role()`) — les 3 nouvelles colonnes sont donc déjà protégées sans nouvelle policy.
- Le funnel UI est **cumulatif** (chaque étape inclut tous les plus avancés) pour calculer des taux de conversion inter-étape.

### File List
**Nouveaux**
- `supabase/migrations/00155_trial_usage_unique.sql`
- `aureak/packages/business-logic/src/prospection/processTrialOutcome.ts`
- `aureak/packages/business-logic/src/__tests__/processTrialOutcome.test.ts`
- `aureak/packages/api-client/src/admin/trial-usage.ts`
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx`
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/index.tsx`

**Modifiés**
- `aureak/packages/types/src/entities.ts` — ajout `TrialOutcome`, extension `ProspectStatus` avec `'candidat'`, 3 champs `ChildDirectoryEntry` (trialUsed/trialDate/trialOutcome)
- `aureak/packages/api-client/src/admin/child-directory.ts` — mapping `toEntry` des 3 nouveaux champs
- `aureak/packages/api-client/src/index.ts` — export `recordTrialOutcome`/`resetTrialRight`/`getProspectFunnelStats`
- `aureak/packages/business-logic/src/index.ts` — export `processTrialOutcome`
- `supabase/functions/confirm-trial-slot/index.ts` — maj `trial_used`/`trial_date` à la confirmation (AC #4)
- `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` — bouton lien vers le funnel gardiens
