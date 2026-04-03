# Story: Génération automatique de groupes par saison

**ID:** tbd-generation-groupes-saison
**Status:** done
**Source:** new
**Epic:** TBD — Admin UX

## Description
Dans la page admin groupes, ajouter un bouton "Générer pour la saison" qui ouvre un modal.
Le modal permet de choisir une saison académique et une implantation, puis génère les groupes
standard (un groupe par méthode × implantation) en appelant `createGroup` en batch.

## Changements effectués
- Bouton "Générer groupes" dans le header de `groups/index.tsx`
- Modal inline avec :
  - Sélecteur de saison (via `listAcademySeasons`)
  - Sélecteur d'implantation (déjà chargées)
  - Aperçu des 4 groupes à créer (un par méthode)
  - Bouton "Générer" qui crée les groupes en batch via `createGroup`
- Rechargement automatique de la liste après création

## Acceptance Criteria
- [x] Bouton "Générer groupes" visible dans le header
- [x] Modal avec sélecteur saison + implantation
- [x] Aperçu des groupes à créer
- [x] Création batch via createGroup
- [x] Rechargement de la liste après succès

## Commit
`feat(groupes): génération automatique par saison`
