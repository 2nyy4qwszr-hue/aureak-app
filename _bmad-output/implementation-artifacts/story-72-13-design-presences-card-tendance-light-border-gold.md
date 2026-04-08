# Story 72.13 : Présences — Card "Tendance Globale" passe en style light avec border or

Status: done

## Story

En tant qu'admin consultant l'onglet Présences (hub Activités),
je veux que la 4ème stat card "Tendance Global" soit en style light (fond blanc) avec une border or,
afin que la card soit visuellement cohérente avec la zone light de la page et respecte le design system.

## Acceptance Criteria

1. La card "Tendance Global" (`cardDarkGold` dans `StatCardsPresences`) a `backgroundColor: colors.light.surface` (blanc) — fini le fond sombre `colors.accent.goldDark`.
2. La card "Tendance Global" a `borderColor: colors.accent.gold` et `borderWidth: 1` — la border or la distingue visuellement des 3 autres cards.
3. Le label "TENDANCE GLOBAL" passe de `colors.accent.goldLight` (lisible sur fond sombre) à `colors.text.muted` (lisible sur fond blanc) — même style que les 3 autres labels.
4. La valeur de tendance (`+X.X` ou `—`) utilise `colors.accent.gold` pour la valeur positive et `colors.status.absent` pour la valeur négative — sur fond blanc ces couleurs sont lisibles sans ajustement supplémentaire.
5. Le sous-texte "pts vs moyenne période" / "Données insuffisantes" passe de `colors.text.primary + '99'` (blanc semi-transparent, lisible sur fond sombre) à `colors.text.muted` (lisible sur fond blanc).
6. L'icône `↗` utilise `colors.accent.gold` à la place de `colors.text.primary` (blanc).
7. Un `grep` sur `colors.dark` et `colors.accent.goldDark` dans `activites/presences/page.tsx` dans les styles de `cardDarkGold`, `cardLabelDark`, `cardSubDark`, `statIconLight` retourne zéro occurrence.
8. Aucune couleur hardcodée introduite — uniquement des tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Modifier le style `cardDarkGold` dans `cardStyles` (AC: 1, 2, 8)
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 199-204 pour vérifier `cardDarkGold`
  - [x] T1.2 — Remplacer `backgroundColor: colors.accent.goldDark` par `backgroundColor: colors.light.surface`
  - [x] T1.3 — Remplacer `borderColor: colors.accent.goldDark` par `borderColor: colors.accent.gold`
  - [x] T1.4 — Vérifier que `borderWidth: 1` est hérité du style `card` parent (déjà présent sur la card de base)

- [x] T2 — Adapter les styles de texte de la card Tendance (AC: 3, 4, 5, 6)
  - [x] T2.1 — Modifier `cardLabelDark` : `color: colors.accent.goldLight` → `color: colors.text.muted`
  - [x] T2.2 — Modifier `cardSubDark` : `color: colors.text.primary + '99'` → `color: colors.text.muted`
  - [x] T2.3 — Modifier `statIconLight` : `color: colors.text.primary` → `color: colors.accent.gold`
  - [x] T2.4 — Modifier l'inline style de la valeur de tendance dans le JSX (ligne env. 170) : `trendPositive ? colors.text.primary : colors.status.absent` → `trendPositive ? colors.accent.gold : colors.status.absent`

- [x] T3 — QA scan (AC: 7, 8)
  - [x] T3.1 — Grep : zéro résidu sombre dans les styles de la card Tendance (les occurrences restantes sont hors périmètre : getCellStyle heatmap + styles modales)
  - [x] T3.2 — Grep hex : zéro couleur hardcodée
  - [x] T3.3 — Playwright skipped — app non démarrée

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T1 — Changements dans `cardStyles` (StyleSheet)

Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`

**Avant (état actuel) :**
```tsx
cardDarkGold: {
  // Figma card Tendance fond gold foncé
  backgroundColor: colors.accent.goldDark,
  borderColor    : colors.accent.goldDark,
},
cardLabelDark: {
  fontSize     : 10,
  fontFamily   : fonts.heading,
  fontWeight   : '700',
  color        : colors.accent.goldLight,
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom : space.sm,
},
cardSubDark: {
  fontSize  : 11,
  fontFamily: fonts.body,
  color     : colors.text.primary + '99',
},
statIconLight: {
  fontSize    : 22,
  marginBottom: 4,
  color       : colors.text.primary,
},
```

**Après (cible) :**
```tsx
cardDarkGold: {
  // Card Tendance : style light avec border or (zone light de la page)
  backgroundColor: colors.light.surface,
  borderColor    : colors.accent.gold,
},
cardLabelDark: {
  fontSize     : 10,
  fontFamily   : fonts.heading,
  fontWeight   : '700',
  color        : colors.text.muted,  // lisible sur fond blanc
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom : space.sm,
},
cardSubDark: {
  fontSize  : 11,
  fontFamily: fonts.body,
  color     : colors.text.muted,  // lisible sur fond blanc
},
statIconLight: {
  fontSize    : 22,
  marginBottom: 4,
  color       : colors.accent.gold,  // icône or sur fond blanc
},
```

---

### T2 — Changement dans le JSX (valeur de tendance)

Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx`, env. ligne 170.

**Avant :**
```tsx
<AureakText style={{ ...(cardStyles.cardStatGold as object), color: trendPositive ? colors.text.primary : colors.status.absent } as import('react-native').TextStyle}>
```

**Après :**
```tsx
<AureakText style={{ ...(cardStyles.cardStatGold as object), color: trendPositive ? colors.accent.gold : colors.status.absent } as import('react-native').TextStyle}>
```

Note : `colors.text.primary` = blanc (`#FFFFFF`), invisible sur fond blanc. `colors.accent.gold` = or champagne (`#C1AC5C`), parfaitement lisible sur `colors.light.surface`.

---

### Design

**Type design** : `polish`

Tokens utilisés :
```tsx
import { colors } from '@aureak/theme'

// Card Tendance Globale — fond light
backgroundColor : colors.light.surface    // #FFFFFF — cohérent avec les 3 autres cards
borderColor     : colors.accent.gold      // #C1AC5C — border or distinctif

// Textes dans la card — sur fond blanc
color (label)   : colors.text.muted       // #71717A — label uppercase atténué
color (sous-texte) : colors.text.muted    // #71717A — note sous la valeur
color (icône)   : colors.accent.gold      // #C1AC5C — icône ↗ or
color (valeur +): colors.accent.gold      // #C1AC5C — tendance positive
color (valeur -): colors.status.absent    // #F44336 — tendance négative
```

Principes design (source : `_agents/design-vision.md`) :
- Cohérence de la zone light : aucun bloc dark dans une zone de fond `colors.light.primary`
- Différenciation par border : la border or `colors.accent.gold` suffit à distinguer la card premium sans fond sombre
- Tokens sémantiques : jamais de hex hardcodé, jamais de `colors.dark.*` en zone light

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier | 4 styles dans `cardStyles` + 1 inline JSX |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — aucun nouveau token nécessaire, tous existent déjà
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — hors périmètre
- `aureak/apps/web/app/(admin)/activites/presences/index.tsx` — re-export uniquement, pas toucher

---

### Dépendances à protéger

- Story 65-2 utilise `StatCardsPresences` — la signature du composant reste inchangée (seul le style visuel change)
- Story 75-5 a déjà corrigé `getCellStyle` (hex → tokens) — ne pas retoucher cette fonction

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern de référence card light : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 189-198 (style `card` = base avec `colors.light.surface`)
- Card 4 actuelle : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` lignes 200-204 (style `cardDarkGold`)
- Valeur tendance JSX : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` ligne 170
- Story liée (getCellStyle) : `_bmad-output/implementation-artifacts/story-75-5-bug-presences-heatmap-tokens-metrique-fictive.md`
- Story liée (stat cards figma) : `_bmad-output/implementation-artifacts/story-72-3-design-presences-statcards-heatmap-figma.md`

---

### Multi-tenant

Pas de données multi-tenant dans cette story — uniquement styles CSS/StyleSheet, aucune requête DB.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun

### Completion Notes List
- 4 styles modifiés dans `cardStyles` (StyleSheet) : cardDarkGold, cardLabelDark, cardSubDark, statIconLight
- 1 inline style modifié dans le JSX (valeur de tendance ligne 170)
- QA : zéro hex hardcodé, les `colors.text.primary` restants sont hors périmètre (getCellStyle heatmap + modales)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifié |
