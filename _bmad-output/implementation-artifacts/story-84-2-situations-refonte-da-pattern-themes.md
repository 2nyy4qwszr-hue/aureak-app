# Story 84.2 : Méthodologie — Situations : Refonte DA (pattern Thèmes)

Status: done

## Story

En tant qu'admin consultant la section Situations,
je veux que la page reprenne exactement la même structure DA que la page Thèmes (story 83.2),
afin d'obtenir une cohérence visuelle dans tout le module Méthodologie.

## Context

La page actuelle (`situations/page.tsx`) est une liste groupée basique sans header DA ni statCards.
La page Thèmes (story 83.2) constitue le pattern de référence.

### DA Cible — même structure que Thèmes

```
headerBlock
  headerTopRow : MÉTHODOLOGIE · + Nouvelle situation
  tabsRow      : ENTRAÎNEMENTS | PROGRAMMES | THÈMES | SITUATIONS | ÉVALUATIONS

statCardsRow   : N cards (1 par bloc/ThemeGroup) avec picto + nom + count situations

filtresRow     : [GLOBAL]  [BLOC ▾]

grille         : SituationCards (grid responsive)
```

### Différences vs Thèmes

| Thèmes | Situations |
|--------|------------|
| Pill "BLOC ▾" (ThemeGroups) | Pill "BLOC ▾" (même ThemeGroups via `blocId`) |
| PremiumThemeCard + drag & drop | SituationCard simple (pas de drag & drop) |
| BlocsManagerModal (⚙) | Pas de BlocsManagerModal |
| `groupId` sur Theme | `blocId` sur Situation |

Les situations sont filtrées par `blocId` (FK vers `theme_groups`).

### Données disponibles

- `listSituations()` → `{ data: Situation[] }` — API déjà existante
- `listThemeGroups()` → `{ data: ThemeGroup[] }` — même API que Thèmes
- `Situation.blocId: string | null` — FK vers ThemeGroup

### BLOC_PICTOS mapping

Réutiliser le même mapping que Thèmes (déjà dans `themes/index.tsx`) :
```ts
const BLOC_PICTOS: Record<string, string> = {
  'tir au but': '🎯', '1 contre 1': '⚔️', 'centre': '📐',
  'balle en profondeur': '🚀', 'relance': '🔄',
  'phase arrêtée': '⛔', 'communication': '📢',
}
function getBlocPicto(name: string) { return BLOC_PICTOS[name.toLowerCase()] ?? '📋' }
```

### SituationCard

Créer un composant inline dans `situations/page.tsx` (pas de fichier séparé) :
```tsx
function SituationCard({ situation, onPress }) {
  return (
    <Pressable onPress={onPress} style={st.situationCard}>
      <AureakText style={st.situationName}>{situation.name}</AureakText>
      <AureakText style={st.situationKey}>{situation.situationKey}</AureakText>
    </Pressable>
  )
}
```
Style sobre : card blanche `colors.light.surface`, border `colors.border.divider`, borderRadius `radius.card`, padding `space.md`, shadow `shadows.sm`.

### Nav tabs — onglet SITUATIONS actif

```ts
const NAV_TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',    active: false },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: false },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: true  },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: false },
]
```

### Styles à copier depuis `themes/index.tsx`

Copier exactement :
```
headerBlock, headerTopRow, pageTitle, newBtn, newBtnLabel
tabsRow, tabLabel, tabLabelActive, tabUnderline
statCardsRow, statCard, statCardActive, statCardPicto, statCardLabel, statCardValue
filtresRow, filtresLeft
pillActive, pillInactive, pillTextActive, pillTextInactive
dropdownWrapper, themeDropdown, themeDropdownItem, themeDropdownItemActive
```
Renommer `themeDropdown*` → `blocDropdown*` dans `situations/page.tsx`.

## Acceptance Criteria

1. `headerBlock` affiché : titre "MÉTHODOLOGIE" + tabs (SITUATIONS souligné or) + bouton "+ Nouvelle situation".
2. `statCardsRow` : une card par ThemeGroup avec picto emoji + nom + count de situations dans ce bloc.
3. `filtresRow` : pill GLOBAL + pill BLOC ▾ (dropdown des blocs).
4. Cliquer GLOBAL → `selectedBlocId = null` → toutes les situations affichées.
5. Sélectionner un bloc dans BLOC ▾ → filtre les SituationCards de ce bloc uniquement.
6. Cliquer sur une SituationCard → navigation vers `/methodologie/situations/${situation.situationKey}`.
7. L'ancienne liste groupée basique est supprimée.
8. Pas de drag & drop, pas de BlocsManagerModal.
9. Console guards sur tous les `console.error`.
10. Aucune couleur hardcodée — tokens `@aureak/theme` uniquement.

## Tasks / Subtasks

- [ ] T1 — Remplacer `situations/page.tsx` entier par le nouveau design
  - [ ] T1.1 — Ajouter `BLOC_PICTOS`, `getBlocPicto`, `NAV_TABS`, imports nécessaires
  - [ ] T1.2 — Ajouter états : `selectedBlocId`, `blocDropOpen`
  - [ ] T1.3 — Implémenter `headerBlock` + `tabsRow`
  - [ ] T1.4 — Implémenter `statCardsRow` (map groupes → card pressable)
  - [ ] T1.5 — Implémenter `filtresRow` (GLOBAL + BLOC ▾ dropdown)
  - [ ] T1.6 — Implémenter `SituationCard` inline + grille CSS grid responsive
  - [ ] T1.7 — Copier styles depuis `themes/index.tsx` + ajouter `situationCard`, `situationName`, `situationKey`
- [ ] T2 — QA : console guards + aucun hex hardcodé

## Files to Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` | Réécriture complète DA |

## Dependencies

- `listSituations()` : déjà disponible dans `@aureak/api-client`
- `listThemeGroups()` : déjà disponible dans `@aureak/api-client`
- Aucune migration DB, aucun nouveau type

## Commit

```
feat(epic-84): story 84.2 — Situations refonte DA pattern Thèmes
```
