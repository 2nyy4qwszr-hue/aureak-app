# Story 84.3 : Méthodologie — Évaluations : Nouvelle page DA (pattern Entraînements)

Status: done

## Story

En tant qu'admin consultant la section Évaluations de la Méthodologie,
je veux que la page `/methodologie/evaluations` existe avec le même design qu'Entraînements (headerBlock + statCardsRow + filtresRow + tableau),
afin d'avoir une interface cohérente pour gérer les grilles d'évaluation pédagogique.

## Context

La page `/methodologie/evaluations` n'existe pas encore — le dossier `evaluations/` est absent.
Le tab "ÉVALUATIONS" dans la nav de Méthodologie pointe déjà vers cette route.

### DA Cible — même structure qu'Entraînements

```
headerBlock
  headerTopRow : MÉTHODOLOGIE · + Nouvelle évaluation
  tabsRow      : ENTRAÎNEMENTS | PROGRAMMES | THÈMES | SITUATIONS | ÉVALUATIONS

statCardsRow   : 7 cards méthodes (METHOD_PICTOS + count par méthode)

filtresRow     : [GLOBAL] [MÉTHODE ▾]      ····    [ACADÉMIE|STAGE]

tableWrapper   : tableau avec colonnes MÉTHODE / NUM / TITRE / THÈMES / STATUT
```

### Source de données : `listMethodologyExercises`

La page Évaluations utilise **`listMethodologyExercises`** (déjà disponible dans `@aureak/api-client`) comme source de données initiale. Les exercices constituent la base des grilles d'évaluation dans le contexte pédagogique Aureak.

> Note : si à terme une entité distincte `methodology_evaluations` est créée, cette page sera migrée. Pour l'instant, `listMethodologyExercises` est le meilleur match existant.

### Colonnes du tableau Évaluations

| Colonne | Source | Largeur |
|---------|--------|---------|
| MÉTHODE | `exercise.method` (cercle picto) | 52 |
| NUM | `exercise.trainingRef` (#xxx) | 90 |
| TITRE | `exercise.title` | flex: 1 |
| THÈMES | `—` (placeholder) | 100 |
| STATUT | `exercise.isActive` (dot) | 60 |

Pas de colonne PDF ni SITUATIONS (différence vs Entraînements).

### Nav tabs — onglet ÉVALUATIONS actif

```ts
const NAV_TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',    active: false },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: false },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: false },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: true  },
]
```

### Styles

Copier exactement depuis `seances/index.tsx` :
```
container, content
headerBlock, headerTopRow, pageTitle, newBtn, newBtnLabel
tabsRow, tabItem, tabLabel, tabLabelActive, tabUnderline
statCardsRow, statCard, statCardPicto, statCardLabel, statCardValue
filtresRow, filtresLeft, filtresRight
pillActive, pillInactive, pillTextActive, pillTextInactive
dropdownWrapper, methodDropdown, methodDropdownItem, methodDropdownItemActive
toggleRow, toggleBtn, toggleBtnActive, toggleLabel, toggleLabelActive
empty, tableWrapper, tableHeader, thText, tableRow
methodCircle, methodPicto, numText, titleText, dashText, statusDot
```

### Fichiers à créer

```
aureak/apps/web/app/(admin)/methodologie/evaluations/
  ├── page.tsx      ← composant complet
  └── index.tsx     ← re-export './page' (pattern Expo Router)
```

## Acceptance Criteria

1. La route `/methodologie/evaluations` est accessible sans 404.
2. `headerBlock` affiché : titre "MÉTHODOLOGIE" + tabs (ÉVALUATIONS souligné or) + bouton "+ Nouvelle évaluation".
3. `statCardsRow` : 7 cards méthodes (METHOD_PICTOS + count d'exercices par méthode).
4. `filtresRow` : pill GLOBAL + pill MÉTHODE ▾ à gauche, toggle ACADÉMIE/STAGE à droite.
5. Tableau affiché avec colonnes MÉTHODE / NUM / TITRE / THÈMES / STATUT.
6. Filtres MÉTHODE et ACADÉMIE/STAGE fonctionnels (logique identique à seances).
7. Chargement avec `setLoading(true)` dans try/finally.
8. Console guards sur tous les `console.error`.
9. Aucune couleur hardcodée — tokens `@aureak/theme` uniquement.
10. `index.tsx` = re-export `./page` (pattern Expo Router).

## Tasks / Subtasks

- [ ] T1 — Créer `evaluations/page.tsx` (contenu complet)
  - [ ] T1.1 — Imports : `listMethodologyExercises`, `methodologyMethodColors`, `METHOD_PICTOS`, `NAV_TABS`
  - [ ] T1.2 — États : `exercises`, `loading`, `methodFilter`, `contextFilter`, `methodDropOpen`
  - [ ] T1.3 — `loadExercises` avec try/finally
  - [ ] T1.4 — `filteredExercises` useMemo + `methodCounts`
  - [ ] T1.5 — `headerBlock` + `tabsRow` (ÉVALUATIONS actif)
  - [ ] T1.6 — `statCardsRow` (7 méthodes)
  - [ ] T1.7 — `filtresRow` (GLOBAL + MÉTHODE ▾ | ACADÉMIE/STAGE toggle)
  - [ ] T1.8 — `ÉvaluationsTable` sous-composant (tableau colonnes MÉTHODE/NUM/TITRE/THÈMES/STATUT)
  - [ ] T1.9 — Styles (copie exacte depuis seances/index.tsx)
- [ ] T2 — Créer `evaluations/index.tsx` : `export { default } from './page'`
- [ ] T3 — QA : console guards + try/finally + aucun hex hardcodé

## Files to Create

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` | Création |
| `aureak/apps/web/app/(admin)/methodologie/evaluations/index.tsx` | Création (re-export) |

## Dependencies

- `listMethodologyExercises` : disponible dans `@aureak/api-client`
- `methodologyMethodColors`, `METHODOLOGY_METHODS` : disponibles dans `@aureak/theme` / `@aureak/types`
- Aucune migration DB, aucun nouveau type

## Commit

```
feat(epic-84): story 84.3 — Évaluations méthodologie nouvelle page DA pattern Entraînements
```
