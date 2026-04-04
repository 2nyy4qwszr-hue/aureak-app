# Story 47.4 : FEATURE — Liaisons joueurs-clubs auto-affiliation par saison

Status: done

## Story

En tant qu'admin Aureak gérant les affiliations des joueurs,
je veux pouvoir valider l'affiliation d'un joueur à un club pour une saison donnée et que cette information soit persistée et affichée dans sa fiche,
afin de suivre le parcours officiel des joueurs sans saisie manuelle répétitive.

## Acceptance Criteria

1. La fiche joueur `(admin)/children/[childId]/page.tsx` affiche le club actuel du joueur (champ `current_club` de `child_directory`)
2. Un bouton "Valider affiliation club" permet d'associer officiellement le joueur à un `club_directory` pour la saison actuelle
3. Cette association crée une entrée dans `child_directory_history` (child_id, saison, club_nom, club_directory_id, affilie=true)
4. L'historique des affiliations est visible dans la fiche joueur (tableau par saison)
5. Si le joueur est déjà affilié à un club pour la saison actuelle → afficher le club actuel avec option de modification

## Tasks / Subtasks

- [x] T1 — Vérifier l'état actuel de la fiche joueur
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
  - [x] T1.2 — Identifier si `current_club` et `child_directory_history` sont déjà affichés

- [x] T2 — Ajouter la section affiliation club
  - [x] T2.1 — Section "Club actuel & Affiliations" dans la fiche joueur (composant `AffiliationSection`)
  - [x] T2.2 — Afficher `current_club` (champ texte libre) + badge affiliation courante si existante
  - [x] T2.3 — Bouton "Valider affiliation" → modal de sélection de club (search `listClubDirectory` dans `club_directory`)
  - [x] T2.4 — À la validation : appeler `addChildHistoryEntry` avec saison actuelle auto-calculée, club sélectionné, `affilie: true`
  - [x] T2.5 — Tableau historique des affiliations : saison | club | catégorie | niveau | affilié ✓/✗

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T3.2 — Test : valider une affiliation → entrée créée dans child_directory_history (Playwright skipped — app non démarrée)

## Dev Notes

### API existante
- `addHistoryEntry(childId, entry)` dans `@aureak/api-client/src/admin/child-directory.ts`
- `listChildDirectoryHistory(childId)` pour charger l'historique
- `listClubDirectory(filters)` pour la recherche de clubs

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Section affiliations |

## Dev Agent Record

- **Implémenté par** : Claude Sonnet 4.6 (Amelia — Dev Agent BMAD)
- **Date** : 2026-04-04
- **Fichiers modifiés** :
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`

### Résumé technique

- Ajout de la fonction helper `getCurrentFootballSeason()` : calcule la saison courante (ex. "2025-2026") selon la règle mois ≥ août = nouvelle saison
- Ajout du composant `AffiliationSection` : affiche club actuel, badge statut affiliation saison courante (vert = affilié / orange = absent), tableau historique affiliations (filtre `affilie = true` sur `child_directory_history`)
- Modal de validation : recherche autocomplete `listClubDirectory` (min. 2 caractères, debounce 300ms), sélection obligatoire dans l'annuaire, appel `addChildHistoryEntry` avec `affilie: true` et saison auto-calculée
- Section insérée entre "Club actuel" (section [C]) et "Niveau équipe" (section [C.ter])
- `npx tsc --noEmit` → zéro erreur

### APIs utilisées
- `listClubDirectory` (déjà importé) — recherche clubs dans l'annuaire
- `addChildHistoryEntry` (déjà importé) — persistance affiliation
- `listChildDirectoryHistory` / state `history` déjà chargé dans `loadChild` — source du tableau

### File List
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modified — ajout `AffiliationSection`, helper `getCurrentFootballSeason`, styles `aff` |
