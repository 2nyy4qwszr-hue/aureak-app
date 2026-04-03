# Story 40-3 — Lists: raccourcis clavier

**Epic:** 40
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux utiliser des raccourcis clavier pour naviguer rapidement dans l'application afin d'accélérer mon workflow sans lever les mains du clavier.

## Acceptance Criteria
- [ ] AC1: `Cmd+K` (Mac) / `Ctrl+K` (Windows) ouvre la recherche globale (appelle `setSearchOpen(true)` via context)
- [ ] AC2: `Cmd+N` / `Ctrl+N` navigue vers la route "nouveau" contextuelle selon le pathname courant
- [ ] AC3: `Escape` ferme le modal ou la recherche globale ouverts
- [ ] AC4: Les raccourcis sont actifs uniquement quand le focus n'est pas dans un champ de saisie (input, textarea)
- [ ] AC5: Des badges `kbd` sont affichés dans l'UI pour indiquer les raccourcis disponibles (ex: `⌘K` dans le bouton search, `⌘N` dans le bouton "Nouveau")
- [ ] AC6: Les raccourcis ne déclenchent pas l'action par défaut du navigateur (ex: Cmd+N n'ouvre pas un nouvel onglet)
- [ ] AC7: Un hook `useKeyboardShortcuts` est créé et peut être étendu facilement

## Tasks
- [ ] Créer `aureak/apps/web/lib/useKeyboardShortcuts.ts` — hook avec `useEffect` sur `keydown`, détection `event.metaKey || event.ctrlKey`, guard sur `event.target` pour exclure inputs
- [ ] Créer ou vérifier `aureak/apps/web/contexts/SearchContext.tsx` — context `{ isOpen, setOpen }` pour la recherche globale
- [ ] Modifier `aureak/apps/web/app/(admin)/_layout.tsx` — intégrer `useKeyboardShortcuts()`, brancher `setSearchOpen` depuis context, définir le mapping `pathname → new route`
- [ ] Ajouter badge `<kbd>⌘K</kbd>` dans le composant de recherche globale (bouton/input search dans le header)
- [ ] Ajouter badge `<kbd>⌘N</kbd>` dans les boutons "Nouveau" des pages liste (clubs, children, stages, seances)
- [ ] Vérifier QA: `event.preventDefault()` bien appelé, nettoyage `removeEventListener` dans le return du useEffect

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/lib/useKeyboardShortcuts.ts` (nouveau)
  - `aureak/apps/web/contexts/SearchContext.tsx` (nouveau ou existant)
  - `aureak/apps/web/app/(admin)/_layout.tsx`
  - Pages liste pour badges kbd
- Mapping `Cmd+N` par pathname:
  ```
  /clubs     → /clubs/new
  /children  → (pas de route new — ignorer ou désactiver)
  /stages    → /stages/new
  /seances   → /seances/new
  /methodologie/seances → /methodologie/seances/new
  ```
- Style badge `kbd`: `backgroundColor: colors.light.elevated`, `borderRadius: 4`, `padding: '2px 6px'`, `fontSize: 11`, `fontFamily: monospace`, `border: 1px solid colors.border.light`
- Guard input: `const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)`
- Pas de migration Supabase nécessaire
