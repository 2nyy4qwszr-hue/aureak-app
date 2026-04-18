# Story 89.6 : Séance gratuite usage unique traçable

Status: ready-for-dev

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

- [ ] Task 1 — Migration Supabase (AC: #1, #2, #3)
  - [ ] `ALTER TABLE child_directory ADD COLUMN trial_used boolean DEFAULT false`
  - [ ] `ALTER TABLE child_directory ADD COLUMN trial_date timestamptz`
  - [ ] Créer enum `trial_outcome` + colonne
- [ ] Task 2 — Logique métier (AC: #4, #5, #6)
  - [ ] Dans `@aureak/business-logic` : `processTrialOutcome(childId, outcome)`
  - [ ] Si `present` → update `prospect_status = 'candidat'`
  - [ ] Si `absent` → update `trial_outcome = 'absent'`, pas de reset
- [ ] Task 3 — API client (AC: #7, #8)
  - [ ] `recordTrialOutcome(childId, outcome)` dans `@aureak/api-client`
  - [ ] `resetTrialRight(childId)` — admin only, override exceptionnel
  - [ ] `getProspectFunnelStats()` — compteurs par étape
- [ ] Task 4 — UI funnel stats (AC: #7)
  - [ ] StatCards ou mini-funnel visuel dans `/prospection/gardiens`
  - [ ] Compteurs par étape avec % de conversion

## Dev Notes

- L'essai gratuit est un levier commercial clé — sa mesure est importante pour le business
- Le reset admin est un override exceptionnel (ex: enfant malade le jour de l'essai)
- Le funnel stats peut être simple en V1 : juste les compteurs par statut dans child_directory

### References

- [Brainstorming: idées #19, #22 Prospection — funnel gardien, séance gratuite usage unique]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
