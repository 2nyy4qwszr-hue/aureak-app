# Story 52-4 — Toggle galerie cards vs liste compacte

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P1
**Dépend de** : story-52-1 (PlayerCard disponible)

---

## Story

En tant qu'admin, je veux pouvoir basculer entre une vue grille de cartes joueur FUT-style et une vue tableau compact, avec persistance de ma préférence, afin d'adapter l'affichage à mon contexte (exploration visuelle vs traitement rapide).

---

## Acceptance Criteria

1. **AC1 — Bouton toggle** : Un bouton double-icône dans la barre d'actions de `children/index.tsx` permet de basculer entre `galerie` (icône grille 4 carrés) et `liste` (icône lignes). Le bouton actif est mis en surbrillance avec fond `colors.accent.gold` + texte blanc.

2. **AC2 — Vue galerie** : La vue galerie affiche les `PlayerCard` (160×220px) dans une grille `flexWrap: 'wrap'` avec gap `space.md` (16px). Sur desktop ≥ 1024px : maximum 6 cards par ligne. Sur tablet 768–1023px : 4 cards. Sur mobile < 768px : 2 cards.

3. **AC3 — Vue liste compacte** : La vue liste affiche les lignes existantes (comportement actuel de `children/index.tsx`), identiques à l'implémentation pre-story-52.

4. **AC4 — Persistance localStorage** : La préférence de vue est sauvegardée sous la clé `aureak_players_view_mode` dans `localStorage` (web) / `AsyncStorage` (mobile). Elle est restaurée au montage.

5. **AC5 — Vue par défaut** : Si aucune préférence sauvegardée, la vue par défaut est `liste` (rétrocompatibilité).

6. **AC6 — Compteur maintenu** : Dans les deux vues, le compteur `N joueurs` en haut de page reste visible et exact.

7. **AC7 — Pagination adaptée** : En vue galerie, la pagination affiche 48 items par page (multiple de 6 colonnes). En vue liste, elle reste à 50 items.

---

## Tasks

- [x] **T1** — Dans `aureak/apps/web/app/(admin)/children/index.tsx` :
  - Ajouter state `viewMode: 'galerie' | 'liste'` initialisé depuis `localStorage.getItem('aureak_players_view_mode')` ou `'liste'`
  - Ajouter `useEffect` pour persister dans `localStorage` à chaque changement de `viewMode`

- [x] **T2** — Ajouter le bouton toggle dans la barre d'actions (à côté du bouton "Nouveau joueur") :
  - Deux boutons adjacents (groupe) : icône grille + icône liste
  - Style actif : `backgroundColor: colors.accent.gold`, couleur texte blanc
  - Style inactif : `backgroundColor: colors.light.surface`, bordure `colors.border.light`

- [x] **T3** — Implémenter le rendu conditionnel :
  - Si `viewMode === 'galerie'` : `<View style={styles.gridContainer}>` avec `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: space.md` → mapper sur `PlayerCard` avec `onPress={() => router.push(`/children/${joueur.id}`)}`
  - Si `viewMode === 'liste'` : rendu actuel inchangé

- [x] **T4** — Adapter `PAGE_SIZE` :
  - `const PAGE_SIZE = viewMode === 'galerie' ? 48 : 50`

- [x] **T5** — Ajouter les styles dans `StyleSheet.create` :
  ```ts
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingVertical: space.md,
  }
  ```

- [x] **T6** — QA : try/finally sur tout state setter de chargement. Console guards présents.

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/index.tsx` | Modifier — toggle + vue galerie |

---

## Notes techniques

- Ne pas modifier `children/[childId]/page.tsx` dans cette story.
- `localStorage` est disponible sur Platform web. Sur Platform native, utiliser le pattern `Platform.OS === 'web' ? localStorage : AsyncStorage` — mais cette page est web-only, donc `localStorage` direct.
- Les icônes toggle peuvent être des caractères Unicode simples (`⊞` / `☰`) ou des SVG inline minimaux — pas de dépendance icon library requise.
