# Story: Anomalies — résolution inline sans redirection

**ID:** tbd-anomalies-actions
**Status:** done
**Source:** new
**Epic:** TBD — Admin Actions

## Description
Ajouter des boutons d'action inline (résoudre, ignorer, voir détail) sans redirection.

## Changements effectués
- Bouton "Résolu" (déjà existant, gardé)
- Bouton "Ignorer" : masque l'anomalie localement (state client)
- Bouton "Voir détail" : ouvre un panneau inline (overlay) avec métadonnées
- Panel détail avec actions Résoudre + Ignorer intégrées
- Compteur d'anomalies ignorées en bas de page

## Acceptance Criteria
- [x] Action "Résolu" inline (pas de navigation)
- [x] Action "Ignorer" inline (masquage local)
- [x] Panneau "Voir détail" overlay sans redirection
- [x] Panneau inclut les métadonnées et les actions

## Commit
`feat(anomalies): résolution inline sans redirection`
