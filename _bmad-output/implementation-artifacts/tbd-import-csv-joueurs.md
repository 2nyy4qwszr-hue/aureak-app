# Story: Import CSV joueurs

**ID:** tbd-import-csv-joueurs
**Status:** done
**Source:** new
**Epic:** TBD — Admin Actions

## Description
Ajouter un modal d'import CSV dans la page joueurs (`children/index.tsx`).

## Changements effectués
- Import de `createChildDirectoryEntry` dans la page
- Bouton "Importer CSV" dans le header (à côté de "Ajouter un joueur")
- Modal HTML natif web (pas React Native — pour l'input file) :
  - `<input type="file" accept=".csv">` avec FileReader
  - Aperçu des 5 premières lignes
  - Import batch via `createChildDirectoryEntry` avec gestion erreurs par ligne
  - Résultat : "X importé(s), Y erreur(s)"
- Colonnes CSV reconnues : `displayName` / `nom`+`prenom`, `statut`, `currentClub`, `birthDate`
- Fragment `<>...</>` pour supporter le modal hors ScrollView
- Fix: CSV export utilisait `j.actif` et `j.totalSeasons` (inexistants) → corrigé en `j.inCurrentSeason` et `j.totalAcademySeasons`

## Acceptance Criteria
- [x] Bouton "Importer CSV" dans le header
- [x] Modal avec FileReader
- [x] Aperçu des données
- [x] Import batch avec résultat
- [x] Rechargement de la liste après import

## Commit
`feat(joueurs): import CSV avec aperçu et batch`
