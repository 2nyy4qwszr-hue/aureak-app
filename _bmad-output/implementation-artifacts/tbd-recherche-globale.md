# Story: Recherche globale dans la sidebar

**ID:** tbd-recherche-globale
**Status:** done
**Source:** new
**Epic:** TBD — Admin UX

## Description
Ajouter un champ de recherche global dans la sidebar admin.
Cherche joueurs + clubs + coachs en parallèle, affiche les résultats dans un dropdown.

## Changements effectués
- `components/GlobalSearch.tsx` : composant React pur (web-only)
  - Input avec debounce 300ms
  - `Promise.allSettled` sur `listChildDirectory`, `listClubDirectory`, `listCoaches`
  - Dropdown avec max 10 résultats typés (joueur/club/coach)
  - Icône + couleur par type
  - Navigation Expo Router au clic
  - Fermeture sur clic extérieur
  - Console guard sur les erreurs
- `_layout.tsx` : import + rendu `<GlobalSearch />` entre Brand et Nav Groups

## Acceptance Criteria
- [x] Champ recherche visible dans la sidebar
- [x] Résultats joueurs, clubs, coachs
- [x] Navigation au clic sur un résultat
- [x] Debounce 300ms
- [x] Fermeture sur clic extérieur

## Commit
`feat(admin): recherche globale dans la sidebar`
