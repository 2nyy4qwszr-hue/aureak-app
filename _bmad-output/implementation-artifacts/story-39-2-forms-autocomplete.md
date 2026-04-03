# Story 39-2 — Forms: autocomplete club/coach

**Epic:** 39
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux un champ de saisie avec suggestions automatiques lors de la recherche d'un club ou d'un coach afin de sélectionner rapidement la bonne entité sans avoir à saisir le nom exact.

## Acceptance Criteria
- [ ] AC1: Un composant `AutocompleteInput` existe dans `@aureak/ui` avec props: `onSearch: (query: string) => Promise<{ id: string; label: string }[]>`, `onSelect: (item: { id: string; label: string }) => void`, `placeholder?: string`, `value?: string`
- [ ] AC2: La recherche est déclenchée avec un debounce de 300ms après la frappe
- [ ] AC3: Les résultats s'affichent dans une dropdown (max 8 items) sous le champ
- [ ] AC4: Un clic sur un résultat appelle `onSelect` et ferme la dropdown
- [ ] AC5: La dropdown se ferme si l'utilisateur clique en dehors ou appuie sur Escape
- [ ] AC6: Un état "chargement" est visible pendant la recherche (indicateur spinner ou skeleton)
- [ ] AC7: `children/[childId]/page.tsx` utilise `AutocompleteInput` pour le champ "Club actuel" (recherche dans `club_directory`)
- [ ] AC8: Si la recherche retourne 0 résultat, afficher "Aucun résultat pour «query»"

## Tasks
- [ ] Créer `aureak/packages/ui/src/AutocompleteInput.tsx` — composant avec debounce, dropdown, keyboard nav (Escape)
- [ ] Exporter `AutocompleteInput` depuis `aureak/packages/ui/src/index.ts`
- [ ] Modifier `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — remplacer champ texte "Club actuel" par `AutocompleteInput` appelant `searchClubDirectory(query)` depuis `@aureak/api-client`
- [ ] Vérifier que `searchClubDirectory` existe dans `@aureak/api-client/src/admin/club-directory.ts` — si non, créer la fonction (query sur `club_directory.nom ilike '%query%'` limit 8)
- [ ] Vérifier QA: try/finally autour du onSearch, console guards

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/AutocompleteInput.tsx` (nouveau)
  - `aureak/packages/ui/src/index.ts`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
  - `aureak/packages/api-client/src/admin/club-directory.ts` (si `searchClubDirectory` absent)
- Debounce: implémenter avec `useRef` + `setTimeout`/`clearTimeout` (pas de lib externe)
- Dropdown: `position: absolute`, `zIndex: 100`, fond `colors.light.surface`, `shadows.md`
- Item hover: `backgroundColor: colors.light.hover`
- Spinner: utiliser le composant `ActivityIndicator` natif React Native / Expo
- Pas de migration Supabase nécessaire
- La recherche doit filtrer sur `nom` (insensible à la casse) dans `club_directory` (table annuaire, pas `clubs` auth)
