# Story 83.2 : Méthodologie — Espacement tableaux + Programme simplification + Thèmes refonte DA

Status: ready-for-dev

## Story

En tant qu'admin consultant la section Méthodologie,
je veux que les tableaux Entraînements soient mieux espacés, que le filtre Méthode soit retiré de Programmes, et que la page Thèmes reprenne exactement la même structure DA qu'Entraînements (headerBlock + statCards + filtresRow),
afin d'avoir une cohérence visuelle et de navigation optimale dans tout le module Méthodologie.

## Context

La page Entraînements (`seances/index.tsx`) est la référence DA du module. Deux autres pages doivent s'aligner :
- **Programmes** : simplification (retrait du pill MÉTHODE ▾)
- **Thèmes** : refonte complète pour reproduire le pattern headerBlock + statCardsRow + filtresRow

### DA Référence — Entraînements
```
headerBlock
  headerTopRow : MÉTHODOLOGIE · + Nouvel entraînement
  tabsRow      : ENTRAÎNEMENTS | PROGRAMMES | THÈMES | SITUATIONS | ÉVALUATIONS

statCardsRow   : 7 cards (méthode / picto / count)

filtresRow     : [GLOBAL] [MÉTHODE ▾]          ····  [ENTRAÎNEMENT|EXERCICE]  ····  [ACADÉMIE|STAGE]

tableWrapper   : tableau avec colonnes MÉTHODE / NUM / TITRE / … / STATUT
```

---

## Partie 1 — Espacement tableau Entraînements

### Problème
Les colonnes du tableau dans `EntraînementsTable` et `ExercicesTable` sont collées les unes aux autres. La colonne MÉTHODE (cercle picto) et la colonne NUM (numéro `#xxx`) n'ont aucun gap entre elles.

### Fix
Dans `seances/index.tsx` :
- Ajouter `gap: 12` aux styles `tableHeader` et `tableRow`
- Augmenter `paddingVertical` des lignes : remplacer `minHeight: 52` par `paddingVertical: 12` (hauteur devient content-driven, plus aérée)
- Assurer `numText` a au moins `paddingLeft: 4` si nécessaire

### Acceptance Criteria (Partie 1)
1. Le tableau Entraînements affiche un gap visible (≥12px) entre chaque colonne — MÉTHODE / NUM / TITRE ne se touchent plus.
2. Les lignes ont une hauteur confortable (padding vertical ≥12px autour du contenu).
3. Aucun changement de layout ou de données — seuls les styles `tableHeader`, `tableRow` et éventuellement `numText` sont modifiés.

---

## Partie 2 — Retirer le pill MÉTHODE du filtre Programmes

### Problème
La page `programmes/index.tsx` affiche dans la FiltresRow : [GLOBAL] [MÉTHODE ▾] et à droite [ACADÉMIE|STAGE]. L'utilisateur veut retirer le pill/dropdown MÉTHODE (trop complexe, inutile pour les programmes).

### Fix
Dans `programmes/index.tsx` :
- Supprimer la `View style={st.dropdownWrapper}` contenant le pill MÉTHODE ▾ + `methodDropdown` du JSX
- Supprimer les états `methodFilter`, `setMethodFilter`, `methodDropOpen`, `setMethodDropOpen`
- Supprimer le filtre `if (methodFilter !== 'all' && ...)` du `filtered` useMemo
- Supprimer `methodFilter !== 'all'` de `isGlobal`
- Conserver : GLOBAL pill + ACADÉMIE/STAGE toggle

### Acceptance Criteria (Partie 2)
1. La FiltresRow de Programmes ne contient plus le pill MÉTHODE ▾.
2. Le filtre GLOBAL + ACADÉMIE/STAGE fonctionne toujours correctement.
3. Aucune erreur TypeScript — états `methodFilter`, `methodDropOpen` et leur logique sont complètement retirés.

---

## Partie 3 — Thèmes : refonte DA (pattern Entraînements)

### Objectif
Refondre `themes/index.tsx` pour qu'il suive exactement la même structure DA qu'Entraînements :
1. **headerBlock** : même titre MÉTHODOLOGIE + nav tabs (THÈMES actif) + bouton "+ Nouveau thème"
2. **statCardsRow** : 7 cards par ThemeGroup (bloc), chacune avec picto + nom + count de thèmes
3. **filtresRow** : [GLOBAL] [THÈME ▾] à gauche — rien à droite (pas de toggle)
4. **Grille PremiumThemeCard** : garder la grille drag & drop existante, juste filtrée par le bloc sélectionné

### StatCards — 7 blocs
Les StatCards reprennent chaque ThemeGroup chargé depuis `listThemeGroups()`. Chaque card affiche :
- Picto emoji (mappé par nom de groupe, fallback `📋`)
- Nom du groupe (ex: "Tir au but")
- Nombre de thèmes dans ce groupe

```
BLOC_PICTOS mapping (insensible à la casse, en dur dans le fichier) :
  'tir au but'         → 🎯
  '1 contre 1'         → ⚔️
  'centre'             → 📐
  'balle en profondeur'→ 🚀
  'relance'            → 🔄
  'phase arrêtée'      → ⛔
  'communication'      → 📢
  fallback             → 📋
```

### filtresRow — GLOBAL + THÈME dropdown
- Pill **GLOBAL** : `selectedGroupId === null` → affiche tous les thèmes
- Pill **THÈME ▾** : dropdown listant les ThemeGroups, sélection filtre la grille
- Le dropdown est positionné en `position: absolute, top: 38` (même pattern que MÉTHODE dans Entraînements)
- Aucun autre filtre (pas de toggle ACADÉMIE/STAGE, pas de toggle ENTRAÎNEMENT/EXERCICE)

### Styles à reprendre depuis `seances/index.tsx`
Copier exactement les styles suivants (même valeurs) :
```
headerBlock, headerTopRow, pageTitle, newBtn, newBtnLabel
tabsRow, tabLabel, tabLabelActive, tabUnderline
statCardsRow, statCard, statCardPicto, statCardLabel, statCardValue
filtresRow, filtresLeft
pillActive, pillInactive, pillTextActive, pillTextInactive
dropdownWrapper, methodDropdown, methodDropdownItem, methodDropdownItemActive
```
Source : `st` StyleSheet dans `seances/index.tsx` — **aucune réinvention**, copie exacte.

### Grille PremiumThemeCard
- Conserver le drag & drop existant (logique `handleDrop`, `updateThemeOrder`)
- Conserver la grille CSS grid responsive (`gridTemplateColumns: repeat(${gridColumns}, 1fr)`)
- Conserver le bouton "Gérer les blocs" (⚙) et la `BlocsManagerModal`
- Retirer l'ancien `<View style={styles.filterRow}>` (chips de filtre actuels) — remplacé par la nouvelle filtresRow

### Acceptance Criteria (Partie 3)
1. La page Thèmes affiche `headerBlock` avec titre "MÉTHODOLOGIE" et nav tabs (THÈMES souligné or).
2. `statCardsRow` contient autant de cards que de ThemeGroups chargés — chaque card affiche picto + nom + count.
3. La `filtresRow` contient uniquement : pill GLOBAL + pill THÈME ▾ (dropdown des blocs).
4. Cliquer sur GLOBAL → `selectedGroupId = null` → grille affiche tous les thèmes.
5. Cliquer sur un bloc dans THÈME ▾ → filtre la grille → PremiumThemeCard uniquement pour ce groupe.
6. Le drag & drop de réordonnancement fonctionne toujours dans la grille filtrée.
7. Le bouton "+ Nouveau thème" redirige vers `/methodologie/themes/new`.
8. L'ancien `filterRow` (chips colorés) est supprimé du JSX.
9. Aucune couleur hardcodée — tokens `@aureak/theme` uniquement.
10. Console guards sur tous les `console.error`.

---

## Tasks / Subtasks

- [ ] P1 — Espacement tableau Entraînements (`seances/index.tsx`)
  - [ ] T1.1 — Ajouter `gap: 12` à `tableHeader` et `tableRow`
  - [ ] T1.2 — Remplacer `minHeight: 52` par `paddingVertical: 12` dans `tableRow`
  - [ ] T1.3 — Vérifier que la même correction s'applique à `ExercicesTable` (partage les mêmes styles `st.tableHeader`/`st.tableRow`)

- [ ] P2 — Simplification Programmes (`programmes/index.tsx`)
  - [ ] T2.1 — Supprimer états `methodFilter`, `methodDropOpen` et handlers associés
  - [ ] T2.2 — Supprimer le `dropdownWrapper` + pill MÉTHODE ▾ + `methodDropdown` du JSX
  - [ ] T2.3 — Corriger `isGlobal` : `= contextFilter === 'all'` (plus de methodFilter)
  - [ ] T2.4 — Supprimer `if (methodFilter !== 'all' ...)` du filtre `filtered`
  - [ ] T2.5 — Supprimer les styles devenus inutilisés (`st.dropdownWrapper`, `st.methodDropdown`, `st.methodDropdownItem`, `st.methodDropdownItemActive`) s'ils ne sont plus référencés

- [ ] P3 — Refonte Thèmes (`themes/index.tsx`)
  - [ ] T3.1 — Ajouter import `methodologyMethodColors` (pour cohérence styles) et `shadows, radius` depuis `@aureak/theme`
  - [ ] T3.2 — Définir `BLOC_PICTOS: Record<string, string>` avec les 7 mappings + fallback
  - [ ] T3.3 — Ajouter état `themeDropOpen: boolean`
  - [ ] T3.4 — Implémenter `headerBlock` (copie exacte du pattern Entraînements, onglet THÈMES actif)
  - [ ] T3.5 — Implémenter `statCardsRow` : map des groupes → card avec picto/nom/count
  - [ ] T3.6 — Implémenter `filtresRow` avec GLOBAL pill + THÈME dropdown (même pattern que MÉTHODE dans Entraînements)
  - [ ] T3.7 — Supprimer l'ancien `filterRow` (chips colorés) du JSX
  - [ ] T3.8 — Conserver la grille PremiumThemeCard, `BlocsManagerModal`, drag & drop
  - [ ] T3.9 — Copier les styles nécessaires depuis `seances/index.tsx` (bloc styles listés ci-dessus)
  - [ ] T3.10 — QA scan : console guards + aucun hex hardcodé

---

## Files to Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Partie 1 — gap tableRow/tableHeader |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Partie 2 — retrait pill MÉTHODE |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Partie 3 — refonte complète DA |

## Dependencies

- Aucune migration DB
- Aucune modification `@aureak/api-client` ou `@aureak/types`
- `listThemeGroups()` et `listThemes()` déjà disponibles dans `@aureak/api-client`

## Commit

```
feat(epic-83): story 83.2 — Méthodologie tableaux espacement + Programme simplifié + Thèmes refonte DA
```
