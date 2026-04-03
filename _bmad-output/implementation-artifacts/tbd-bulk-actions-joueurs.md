# Story: Bulk actions liste joueurs

**ID:** tbd-bulk-actions-joueurs
**Status:** done
**Source:** new
**Epic:** TBD — UX Productivité

## Description
Ajouter une barre de sélection bulk + export CSV dans la page joueurs.

## Acceptance Criteria
- [x] Bouton "Sélectionner" toggle le mode bulk
- [x] En mode bulk : checkbox par card (overlay haut-gauche)
- [x] "Tout sélectionner" / "Tout désélectionner"
- [x] Compteur de sélectionnés
- [x] Bouton "Exporter CSV" — données côté client (pas de requête serveur)
- [x] Export CSV : colonnes id, nom, prenom, displayName, statut, club, actif, nbSaisons, nbStages
- [x] Web only (Platform.OS === 'web')

## Commit
`feat(children): bulk actions sélection + export CSV`
