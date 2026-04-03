# Story: Wizard d'onboarding administrateur

**ID:** tbd-onboarding
**Status:** done
**Source:** new
**Epic:** TBD — Admin UX

## Description
Créer un wizard d'onboarding en 4 étapes dans `/onboarding/page.tsx`.

## Changements effectués
- `onboarding/page.tsx` : wizard 4 étapes
  - Étape 1 : Bienvenue + présentation des étapes
  - Étape 2 : Créer l'implantation (nom + adresse) via `createImplantation`
  - Étape 3 : Générer les groupes standard via `createGroup` (un par méthode)
  - Étape 4 : Confirmation + liens vers dashboard et joueurs
  - `ProgressStepper` : barre de progression visuelle avec numéros/coches
  - Try/finally sur toutes les actions async
  - Console guard sur les erreurs
- `onboarding/index.tsx` : re-export

## Acceptance Criteria
- [x] 4 étapes navigables
- [x] Création implantation en étape 2
- [x] Génération groupes en étape 3
- [x] Barre de progression
- [x] Navigation vers dashboard en fin

## Commit
`feat(onboarding): wizard 4 étapes — implantation + groupes`
