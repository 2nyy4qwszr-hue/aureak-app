# Story: Fiche coach — historique de ses groupes

**ID:** tbd-coach-historique-groupes
**Status:** done
**Source:** new
**Epic:** TBD — Coach Admin

## Description
Ajouter une section "Historique des groupes" dans la fiche coach admin.

## Changements effectués
- Nouvelle fonction `listGroupsByCoach(coachId)` dans `api-client/src/sessions/implantations.ts`
- Export `CoachGroupEntry` type depuis `api-client/src/index.ts`
- Section "Historique des groupes" dans `coaches/[coachId]/page.tsx` :
  - Liste des groupes avec nom, implantation, rôle (badge gold si principal), date d'ajout
  - État vide si aucun groupe

## Acceptance Criteria
- [x] API `listGroupsByCoach` dans `@aureak/api-client`
- [x] Section affichée dans la fiche coach admin
- [x] Rôle visible (principal/assistant/remplacant) avec badge gold pour principal
- [x] Implantation affichée si disponible

## Commit
`feat(coaches): historique groupes dans fiche coach`
