# Story: Rapport de présences

**ID:** tbd-rapport-presences
**Status:** done
**Source:** new
**Epic:** TBD — Admin Actions

## Description
Ajouter des boutons "Exporter CSV" et "Imprimer" dans le dashboard présences.

## Changements effectués
- `presences/page.tsx` : header réorganisé en `display: flex; justify-content: space-between`
  - Bouton "Exporter CSV" : génère un CSV des séances visibles (sessionId, date, groupId, status, roster, presents, absents, essais)
  - Bouton "Imprimer" : appelle `window.print()`

## Acceptance Criteria
- [x] Bouton "Exporter CSV" dans le header
- [x] CSV contient les données de présence des séances visibles
- [x] Bouton "Imprimer" appelle window.print()

## Commit
`feat(presences): export CSV + impression du rapport`
