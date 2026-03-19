# Story 23.1 : Refonte de l'affichage des clubs en grille multi-colonnes

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que la liste des clubs soit affichée en grille de cartes multi-colonnes responsive (5 colonnes sur grand écran),
afin d'avoir une vue cohérente avec la page Joueurs et de visualiser rapidement l'ensemble des clubs.

## Contexte

Actuellement, la page `/clubs` affiche les clubs dans un tableau HTML (lignes + colonnes). Cette story remplace ce tableau par une grille de cartes en utilisant le composant `ClubCard` créé dans la Story 23.5.

**Référence directe** : la grille de la page Joueurs (`children/index.tsx`) qui utilise un pattern `flex wrap` avec `minWidth` calculé pour créer une grille responsive sans CSS Grid (compatibilité React Native Web).

**Composant réutilisé** : `ClubCard` (créé en Story 23.5) + `ClubCardSkeleton`.

**Dernier numéro de migration :** aucune migration nécessaire pour cette story.

## Objectif

Refactorer `clubs/page.tsx` pour remplacer la table par une grille responsive de `ClubCard`, tout en conservant 100% des filtres, recherche et pagination existants.

## Scope IN

- Remplacement du bloc `<View style={styles.table}>` par une grille `flex-wrap` dans `clubs/page.tsx`
- Intégration du composant `ClubCard` + `ClubCardSkeleton`
- Logique responsive : 5 colonnes (xl), 4 colonnes (lg), 3 colonnes (md), 2 colonnes (sm), 1 colonne (mobile)
- Conservation des filtres, recherche, pagination inchangés
- Conservation des états loading / empty / error
- Mise à jour du skeleton (utiliser `ClubCardSkeleton` au lieu des `skeletonRow`)
- Suppression du code de table (`thead`, `tr`, `td`, `th`, `trAlt`)

## Scope OUT

- Pas de changement de logique de données (pas de nouveaux champs fetchés ici — couverts par 23.2/23.3/23.4)
- Pas de changement des filtres ou de la pagination
- Pas de vue "table" alternative (toggle liste/grille)
- Pas de tri par colonne (la table avait un ordre fixe par nom)

## Logique Responsive

### Pattern de référence : grille React Native Web

React Native Web ne supporte pas CSS Grid. On utilise un `View` avec `flexDirection: 'row'`, `flexWrap: 'wrap'` et un `minWidth` calculé via `useWindowDimensions`.

```ts
import { useWindowDimensions } from 'react-native'

function useGridColumns(): number {
  const { width } = useWindowDimensions()
  if (width >= 1600) return 5
  if (width >= 1280) return 4
  if (width >= 900)  return 3
  if (width >= 600)  return 2
  return 1
}
```

```tsx
function ClubGrid({ clubs, onPress }: { clubs: ClubDirectoryEntry[]; onPress: (id: string) => void }) {
  const columns = useGridColumns()
  const cardWidth = `${Math.floor(100 / columns)}%`

  return (
    <View style={g.grid}>
      {clubs.map(club => (
        <View key={club.id} style={[g.cell, { width: cardWidth as never }]}>
          <ClubCard club={club} onPress={() => onPress(club.id)} />
        </View>
      ))}
    </View>
  )
}

const g = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    marginHorizontal: -space.xs,  // compense le padding des cellules
  },
  cell: {
    paddingHorizontal: space.xs,
    paddingBottom    : space.sm,
  },
})
```

### Breakpoints

| Largeur fenêtre | Colonnes |
|----------------|---------|
| ≥ 1600px       | 5       |
| 1280–1599px    | 4       |
| 900–1279px     | 3       |
| 600–899px      | 2       |
| < 600px        | 1       |

**Note** : ces breakpoints correspondent aux valeurs utilisées dans `children/index.tsx`. Les utiliser tels quels pour la cohérence.

## Impacts Front-End

### `clubs/page.tsx` — Changements principaux

#### 1. Imports à ajouter

```ts
import { useWindowDimensions } from 'react-native'
import ClubCard, { ClubCardSkeleton } from './_components/ClubCard'
```

#### 2. Hook responsive

```ts
// Dans le composant ClubsPage
const { width } = useWindowDimensions()
const columns = width >= 1600 ? 5 : width >= 1280 ? 4 : width >= 900 ? 3 : width >= 600 ? 2 : 1
```

#### 3. Remplacer le bloc loading skeleton

```tsx
// Avant (table skeleton)
{loading && (
  <View style={styles.skeletonBox}>
    {[0,1,2,3,4,5].map(i => <View key={i} style={styles.skeletonRow} />)}
  </View>
)}

// Après (grid skeleton)
{loading && (
  <View style={g.grid}>
    {Array.from({ length: 10 }).map((_, i) => (
      <View key={i} style={[g.cell, { width: `${Math.floor(100 / columns)}%` as never }]}>
        <ClubCardSkeleton />
      </View>
    ))}
  </View>
)}
```

#### 4. Remplacer le bloc table

```tsx
// Avant
{!loading && clubs.length > 0 && (
  <View style={styles.table}>
    {/* thead + rows */}
  </View>
)}

// Après
{!loading && clubs.length > 0 && (
  <View style={g.grid}>
    {clubs.map(club => (
      <View key={club.id} style={[g.cell, { width: `${Math.floor(100 / columns)}%` as never }]}>
        <ClubCard
          club={club}
          onPress={() => router.push(`/clubs/${club.id}` as never)}
        />
      </View>
    ))}
  </View>
)}
```

#### 5. Supprimer les styles de table inutilisés

Supprimer de `StyleSheet.create({})` : `table`, `thead`, `th`, `tr`, `trAlt`, `td`, `manageBtn`, `skeletonRow`.

Garder : `container`, `content`, `pageHeader`, `newBtn`, `searchRow`, `searchInput`, `searchBtn`, `clearBtn`, `filterRow`, `filterGroup`, `tab`, `tabActive`, `provinceRow`, `provincePill`, `provincePillActive`, `skeletonBox` (renommer en `gridSkeleton` ou supprimer et utiliser directement le style inline), `emptyState`.

### `clubs/page.tsx` — Filtres mis à jour (post Story 23.3)

Les onglets "Partenaires / Non partenaires" deviendront "Partenaires / Associés / Normaux" après Story 23.3. Cette intégration est à faire dans Story 23.3, mais **la page 23.1 doit être compatible** avec le nouveau type de filtre.

**Prérequis** : Story 23.3 doit être complète avant ou en parallèle de Story 23.1.

## Validations

- 5 colonnes sur écran >= 1600px
- 4 colonnes sur écran 1280–1599px
- 3 colonnes sur écran 900–1279px
- 2 colonnes sur écran 600–899px
- 1 colonne sur mobile < 600px
- Filtres, recherche et pagination fonctionnent inchangés
- État loading : grille de skeletons
- État empty : message "Aucun club"
- Navigation vers `/clubs/{id}` au clic sur une carte

## Dépendances

- **Dépend strictement de** :
  - Story 23.5 : composant `ClubCard` et `ClubCardSkeleton` disponibles
  - Story 23.3 : type `clubRelationType` dans `ClubDirectoryEntry` (le `ClubCard` l'utilise)
  - Story 23.2 : `logoUrl` dans `ClubDirectoryEntry`
  - Story 23.4 : `gardienCount` dans `ClubDirectoryEntry`
- **Cette story est la dernière à implémenter** — toutes les autres doivent être complètes

## Risques / Points d'Attention

1. **Largeur de la fenêtre** : `useWindowDimensions` est synchrone en React Native Web — pas de flash initial.
2. **Pagination** : actuellement PAGE_SIZE = 50. Avec 5 colonnes, 50 clubs = 10 lignes de 5. Adapter PAGE_SIZE à 50 (ok) ou 60 (3 rangées × 4 = 60 pour 4 colonnes) ? Recommandation : garder 50, laisser la pagination gérer.
3. **Compatibilité des props `ClubCard`** : `ClubDirectoryEntry` doit avoir les champs `logoUrl`, `clubRelationType`, `gardienCount` — disponibles uniquement si les stories 23.2, 23.3, 23.4 sont complètes.
4. **Scroll infini vs pagination** : la pagination boutons (← →) existante est conservée. Pas de scroll infini dans cette story.

## Critères d'Acceptation

1. La page `/clubs` affiche les clubs en grille de cartes (plus de table)
2. 5 colonnes sur grand écran (≥ 1600px) en production
3. La grille s'adapte dynamiquement à la largeur de la fenêtre (2, 3, 4 colonnes selon breakpoints)
4. Tous les filtres existants (recherche, province, relation type, actif) fonctionnent
5. La pagination (← →) fonctionne
6. État loading : skeletons de cartes affichés
7. État empty : "Aucun club ne correspond aux critères"
8. Clic sur une carte → navigate vers `/clubs/{id}`
9. Suppression des styles table inutilisés
10. Types TypeScript compilent sans erreur
11. Aucune régression sur la fiche détail `/clubs/{id}`

## Suggestions de Tests

- Test responsive : redimensionner la fenêtre de 1800px à 375px → vérifier les breakpoints
- Test filtres : filtrer par province + statut + recherche → résultats cohérents en grille
- Test pagination : naviguer page 2 → grille mise à jour
- Test clic : clic sur une carte → navigate vers la bonne fiche

## Questions Critiques

1. **PAGE_SIZE** : garder 50 ? Ou adapter à 60 pour des grilles "propres" (multiple du nombre de colonnes) ?
2. **Ordre de tri** : la table était triée par `nom` alphabétique. La grille doit-elle aussi être triée par nom, ou selon un autre critère (ex: gardienCount décroissant pour mettre les clubs les plus actifs en premier) ?
3. **Vue alternative** : souhaites-tu un toggle "grille / liste" pour garder la vue table pour les power users ? Scope out pour l'instant, mais à anticiper.

## Tasks / Subtasks

- [x] Vérifier que Stories 23.2, 23.3, 23.4, 23.5 sont complètes (dépendances)
- [x] Mettre à jour `clubs/page.tsx` (AC: 1-11)
  - [x] Ajouter import `useWindowDimensions`, `ClubCard`, `ClubCardSkeleton`
  - [x] Ajouter hook `columns` basé sur `width`
  - [x] Remplacer le skeleton table par skeleton grille
  - [x] Remplacer le bloc table par la grille `ClubCard`
  - [x] Supprimer les styles table inutilisés
  - [x] Adapter les filtres `partenaireFilter` → `relationFilter` (23.3 complète)
- [x] Tester responsive (AC: 2-3)
- [x] Tester filtres + pagination (AC: 4-5)
- [x] Vérifier compilation TypeScript (AC: 10)
- [x] Vérifier page `/clubs/{id}` inchangée (AC: 11)

## Dev Notes

### Structure de fichiers impactée
- `aureak/apps/web/app/(admin)/clubs/page.tsx` (MODIFIÉ — refactoring principal)
- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` (importé depuis 23.5)

### Pattern de référence pour la grille
Observer `children/index.tsx` pour le pattern `useWindowDimensions` + `flexWrap`. La logique exacte des colonnes y est implémentée (Story 18-2).

### Nettoyage de styles
À supprimer du `StyleSheet.create()` de `clubs/page.tsx` :
```ts
// SUPPRIMER après refactoring
table, thead, th, tr, trAlt, td, manageBtn, skeletonRow
```

À garder :
```ts
container, content, pageHeader, newBtn,
searchRow, searchInput, searchBtn, clearBtn,
filterRow, filterGroup, tab, tabActive,
provinceRow, provincePill, provincePillActive,
emptyState
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Code Review Notes

- L1 fixed: `Array.from({ length: 10 })` → `Array.from({ length: Math.max(columns * 2, 6) })` — skeletons adaptés au nombre de colonnes (mobile: 6 min, desktop 5col: 10)
- L2 fixed: stylesheet `g` fusionné dans `styles` (un seul `StyleSheet.create`) — `g.grid`/`g.cell` → `styles.grid`/`styles.cell`

### Completion Notes List

- Table (`thead`, `tr`, `td`, `th`, `trAlt`, `manageBtn`, `skeletonRow`) entièrement supprimée de `clubs/page.tsx`.
- Grille responsive implémentée : `useWindowDimensions` + ternaire de colonnes (5/4/3/2/1) selon les breakpoints du story spec.
- `ClubCard` + `ClubCardSkeleton` importés depuis `clubs/_components` (story 23.5).
- Styles `g.grid` + `g.cell` ajoutés — même pattern que `children/index.tsx`.
- Aucune modification de logique de données, filtres ou pagination.
- Import `Badge` et `CLUB_RELATION_TYPE_LABELS` supprimés (badges maintenant gérés dans `ClubCard`).
- `clubs/[clubId]/page.tsx` non touché — aucune régression.

### File List

- `aureak/apps/web/app/(admin)/clubs/page.tsx` (MODIFIÉ — remplacement table → grille ClubCard)
