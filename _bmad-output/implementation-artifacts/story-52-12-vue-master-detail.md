# Story 52-12 — Vue master-detail joueurs (liste gauche + fiche droite)

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P2
**Dépend de** : story-52-4 (toggle galerie/liste), story-52-6 (header fiche refacto)

---

## Story

En tant qu'admin sur desktop, je veux voir la liste des joueurs à gauche et la fiche complète à droite dans un split-screen, afin de naviguer rapidement entre les fiches sans rechargement de page.

---

## Acceptance Criteria

1. **AC1 — Layout conditionnel desktop** : Sur écran ≥ 1024px de large (`window.innerWidth >= 1024`), le layout passe en split-screen (panneau gauche 340px fixe + panneau droit flex 1). Sur écran < 1024px, comportement normal (navigation complète vers `/children/[childId]`).

2. **AC2 — Panneau gauche** : Le panneau gauche contient la liste complète existante (filtres, recherche, résultats). Hauteur 100vh, overflow-y scroll. Largeur fixe 340px avec fond `colors.light.primary`.

3. **AC3 — Sélection sans navigation** : En mode split-screen, cliquer sur un joueur dans la liste définit `selectedChildId` (state local) et affiche sa fiche dans le panneau droit. La route URL est mise à jour via `router.replace` pour permettre les bookmarks (`/children?selected={id}`).

4. **AC4 — Panneau droit** : Le panneau droit affiche le contenu de `children/[childId]/page.tsx` mais en mode inline (sans le layout admin wrapping). La fiche est scrollable indépendamment du panneau gauche. Si `selectedChildId === null` : afficher un state vide "Sélectionnez un joueur".

5. **AC5 — Highlight sélection** : Dans le panneau gauche, la ligne ou card du joueur sélectionné a un fond `colors.accent.gold + '20'` (gold à 12% opacité) et une bordure gauche `3px solid colors.accent.gold`.

6. **AC6 — Joueur initial depuis URL** : Si la page charge avec `?selected=UUID` dans l'URL (depuis un bookmark), le joueur correspondant est pré-sélectionné et sa fiche s'affiche immédiatement.

7. **AC7 — Responsive dégradé** : Sur tablette (768–1023px) : la liste est en mode plein écran sans panneau droit. Sur mobile (< 768px) : idem.

8. **AC8 — Compteur maintenu** : En mode split-screen, le compteur total de joueurs reste affiché en tête du panneau gauche.

---

## Tasks

- [x] **T1** — Dans `aureak/apps/web/app/(admin)/children/index.tsx` :
  - Ajouter `const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)`
  - `useEffect` pour `window.addEventListener('resize', ...)` avec cleanup
  - `const isSplitScreen = screenWidth >= 1024`

- [x] **T2** — Ajouter `selectedChildId: string | null` state, initialisé depuis `useLocalSearchParams().selected` ou `null`

- [x] **T3** — Modifier le `onPress` des items liste :
  ```ts
  onPress={() => {
    if (isSplitScreen) {
      setSelectedChildId(joueur.id)
      router.replace(`/children?selected=${joueur.id}`)
    } else {
      router.push(`/children/${joueur.id}`)
    }
  }}
  ```

- [x] **T4** — Implémenter le layout conditionnel :
  ```tsx
  if (isSplitScreen) {
    return (
      <View style={styles.splitContainer}>
        <View style={styles.leftPanel}>
          {/* filtres + liste existante */}
        </View>
        <View style={styles.rightPanel}>
          {selectedChildId
            ? <ChildDetailInline childId={selectedChildId} />
            : <EmptyDetailState />
          }
        </View>
      </View>
    )
  }
  // Sinon : rendu normal existant
  ```

- [x] **T5** — Créer `ChildDetailInline` composant dans `children/index.tsx` (ou fichier séparé `children/_ChildDetail.tsx`) :
  - Reçoit `{ childId: string }` en prop
  - Charge les données du joueur via les mêmes API calls que `page.tsx`
  - Réutilise les composants de `page.tsx` (extraire en composants partagés si nécessaire)
  - Alternative plus simple : utiliser `<iframe src={`/children/${childId}`} />` web-only (plus simple, moins optimal)

- [x] **T6** — Ajouter styles split-screen :
  ```ts
  splitContainer : { flexDirection: 'row', height: '100vh' as never, overflow: 'hidden' },
  leftPanel      : { width: 340, borderRightWidth: 1, borderColor: colors.border.divider, overflowY: 'scroll' as never },
  rightPanel     : { flex: 1, overflowY: 'scroll' as never, backgroundColor: colors.light.primary },
  ```

- [x] **T7** — Appliquer le highlight sélection dans les items liste :
  ```ts
  rowSelected: {
    backgroundColor: colors.accent.gold + '20',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
  }
  ```

- [x] **T8** — `EmptyDetailState` composant interne :
  - Centré verticalement dans le panneau droit
  - Icône ← + texte "Sélectionnez un joueur dans la liste"
  - Couleur `colors.text.subtle`

- [x] **T9** — QA : try/finally sur tous les state loaders dans `ChildDetailInline`. Console guards.

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/index.tsx` | Modifier — layout split-screen conditionnel |
| `aureak/apps/web/app/(admin)/children/_ChildDetail.tsx` | Créer (optionnel — si extraction séparée) |

---

## Notes techniques

- L'option `<iframe>` est la plus simple pour réutiliser exactement la page existante sans refactoring. Elle présente un rechargement iframe à chaque sélection (200ms delay acceptable). Préférer l'option composant React si les performances sont critiques.
- `height: '100vh'` et `overflowY: 'scroll'` sont des styles CSS web. Sur React Native for Web, les passer comme `style={{ height: '100vh', overflowY: 'scroll' }}` fonctionne via le passthrough CSS.
- Le panneau gauche doit rester scrollable de façon indépendante — d'où l'overflow sur chaque panneau séparément, et non sur le container.
- Sur la card / ligne sélectionnée : appliquer le highlight via le style conditionnel `[styles.row, selectedChildId === joueur.id && styles.rowSelected]`.
