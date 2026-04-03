# Story: Filtres combinés séances (groupe + date + statut)

**ID:** tbd-filtres-combines-seances
**Status:** done
**Source:** new
**Epic:** TBD — UX Séances

## Description
Ajouter un filtre statut client-side dans la page séances, combinant avec les filtres implantation + groupe déjà existants.

## Changements effectués
- Ajout de `filterStatus` state (string vide = tous)
- `filteredSessions = useMemo(...)` — filtre client-side sur les sessions chargées
- Section "Statut" dans la barre de filtres : Tous / Planifiée / En cours / Réalisée / Annulée
- Toutes les vues (Day/Week/Month/Year) utilisent maintenant `filteredSessions`
- Compteur header mis à jour : `filteredCount/totalCount` si filtre actif

## Acceptance Criteria
- [x] Filtre statut (Tous/Planifiée/En cours/Réalisée/Annulée) côté client
- [x] Combinable avec les filtres implantation + groupe existants
- [x] Toutes les vues utilisent le résultat filtré

## Commit
`feat(seances): filtres combinés groupe + date + statut`
