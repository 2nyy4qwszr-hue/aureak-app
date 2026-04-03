# Story: Timeline audit log lisible et filtrable

**ID:** tbd-audit-timeline
**Status:** done
**Source:** new
**Epic:** TBD — Admin Audit

## Description
Améliorer l'affichage des logs d'audit : timeline verticale avec icônes par type d'action, filtres par utilisateur et par type d'entité.

## Changements effectués
- Remplacement du tableau par une timeline verticale avec ligne verticale + icônes colorés
- Icônes par type d'action (create/update/delete/login/etc.)
- Couleurs par type (rouge=delete, vert=create, gold=update)
- Filtres client-side : utilisateur (select) + type entité (select)
- Métadonnées accessibles en `<details>` expandable
- Compteur filtré / total

## Acceptance Criteria
- [x] Timeline verticale avec ligne continue entre les entrées
- [x] Icône colorée par type d'action
- [x] Filtre utilisateur (dropdown généré depuis les données)
- [x] Filtre type d'entité (dropdown généré depuis les données)
- [x] Métadonnées dans `<details>` expandable

## Commit
`feat(audit): timeline lisible + filtres utilisateur/type`
