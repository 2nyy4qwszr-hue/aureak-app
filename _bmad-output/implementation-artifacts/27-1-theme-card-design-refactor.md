# Story 27.1 : Theme Card — Refonte visuelle premium (Admin Theme Page)

Status: done

**Epic :** 27 — Theme Card Premium Design
**Dépendances :** Story 25.1 (design language de référence — identique `borderRadius: radius.cardLg`, hauteur fixe, zones absolues, background JPEG). Le composant `ThemeCard` actuel dans `methodologie/_components/ThemeCard.tsx` doit rester intact.

---

## Story

En tant qu'administrateur Aureak,
je veux que les cartes de thèmes sur la page `/methodologie/themes` adoptent le même vocabulaire visuel premium que la carte joueur (Story 25),
afin que la bibliothèque pédagogique soit élégante, lisible en grille, et cohérente avec l'identité visuelle Aureak.

---

## Acceptance Criteria

1. **Nouveau composant `PremiumThemeCard`** — Créé dans `aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx`. L'ancien `ThemeCard.tsx` reste intact et non modifié.

2. **Dimensions** — Hauteur fixe **280px**, largeur fluide (hérite du CSS grid). `overflow: 'hidden'`, `borderRadius: radius.cardLg` (24). Ratio adapté à une grille pédagogique dense.

3. **Zone visuelle supérieure** — Les 140px supérieurs de la carte constituent la zone visuelle. Fond de base : dégradé sombre doré `linear-gradient(135deg, #1a1a1a 0%, #2a2206 60%, #1a1400 100%)`. Si `theme.imageUrl` est présent, l'afficher superposé en absolu avec `opacity: 0.6` par-dessus le fond. Si un `background-theme.jpg` est disponible dans `assets/cards/`, l'utiliser comme fond principal en `resizeMode="cover"` (voir T1).

4. **Badge numéro** (`#01`) — `positionIndex` du thème formaté `#${String(positionIndex).padStart(2,'0')}`, positionné `position: absolute, top: 12, left: 14` sur la zone visuelle. Style : fond noir semi-transparent, texte gold, `fontSize: 11, fontWeight: 700, letterSpacing: 1`. Si `positionIndex` est null, le badge n'est pas affiché.

5. **Badge bloc** — `groupName` positionné `position: absolute, top: 12, right: 14` sur la zone visuelle. Style : fond `colors.accent.gold + '20'`, bordure `colors.accent.gold + '60'`, texte gold, `fontSize: 10, fontWeight: 600`. Si null, non affiché.

6. **Zone infos basse** — Les 140px inférieurs sur fond `colors.light.surface` contiennent :
   - Nom du thème : `fontFamily: 'Rajdhani, sans-serif'`, `fontSize: 15, fontWeight: 800`, `numberOfLines: 2`, couleur `colors.text.dark`.
   - Meta : `{themeKey} · v{version}`, `fontSize: 10, color: colors.text.muted`.
   - Badge catégorie (si `category` présent) : style discret, aligné à gauche.
   - Bouton `Gérer` aligné à droite dans le pied de zone.

7. **Hover** — `boxShadow: shadows.gold` (ou `shadows.md` si `shadows.gold` n'existe pas dans les tokens) + `borderColor: colors.accent.gold + '80'`. État géré par `useState(hovered)` + `onHoverIn/Out`, identique au `ThemeCard` actuel.

8. **Pressable** — Carte interactive `opacity: 0.92` au press. `accessibilityRole="button"`.

9. **Props identiques à `ThemeCard`** — `PremiumThemeCard` accepte exactement `{ theme: Theme, groupName: string | null, category?: string | null, onPress: () => void, onManage: () => void }`. Substitution drop-in, aucun changement dans `index.tsx` sauf l'import.

10. **Substitution dans la grille** — `import PremiumThemeCard from '../_components/PremiumThemeCard'` remplace `import ThemeCard` dans `themes/index.tsx`. L'usage `<ThemeCard ... />` devient `<PremiumThemeCard ... />`. La grille CSS, le drag-and-drop, et les filtres restent inchangés.

11. **Aucune régression** — Filtres par bloc, drag-and-drop (`draggable` sur le `<div>` wrapper), navigation `onPress/onManage` → `[themeKey]/page.tsx` fonctionnent identiquement.

---

## Tasks / Subtasks

- [x] **T1** — Préparer l'asset background (AC: #3)
  - [x] Vérifier si `aureak/apps/web/assets/cards/` existe déjà (créé par Story 25.1)
  - [x] Si un JPEG de fond thème est disponible : l'optimiser (cible ≤ 100 Ko, quality 80%) et le placer dans `assets/cards/background-theme.jpg`
  - [x] Si aucun JPEG disponible : utiliser uniquement le dégradé CSS — **ne pas bloquer l'implémentation sur cet asset**
  - [x] Documenter dans le code si le JPEG est présent ou non (commentaire)

- [x] **T2** — Créer `PremiumThemeCard.tsx` — structure (AC: #1, #2, #8, #9)
  - [x] Créer `aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx`
  - [x] Copier la signature de Props depuis `ThemeCard.tsx` — identique
  - [x] Wrapper `Pressable` + `useState(hovered)` + `onHoverIn/Out` (pattern ThemeCard existant)
  - [x] `pCard.container` : `overflow: 'hidden', borderRadius: radius.cardLg, height: 280, borderWidth: 1, borderColor: colors.border.light, boxShadow: shadows.sm`
  - [x] `pCard.pressed` : `{ opacity: 0.92 }`

- [x] **T3** — Zone visuelle (AC: #3, #4, #5)
  - [x] `pZone.visual` : `height: 140, position: 'relative', overflow: 'hidden'`
  - [x] Fond dégradé CSS doré (View absolu remplissant la zone) — toujours présent
  - [x] Si `background-theme.jpg` présent : `<Image style={StyleSheet.absoluteFillObject} resizeMode="cover" />` par-dessus le dégradé
  - [x] Si `theme.imageUrl` présent : `<Image source={{ uri: theme.imageUrl }} style={[StyleSheet.absoluteFillObject, { opacity: 0.6 }]} resizeMode="cover" />` par-dessus le fond
  - [x] Badge numéro (`#01`) : positionner en absolu `top: 12, left: 14`
  - [x] Badge bloc : positionner en absolu `top: 12, right: 14`

- [x] **T4** — Zone infos (AC: #6)
  - [x] `pZone.info` : `height: 140, padding: 12, paddingHorizontal: 14, backgroundColor: colors.light.surface, flexDirection: 'column', justifyContent: 'space-between'`
  - [x] Nom du thème : Rajdhani 15px 800, `numberOfLines: 2`
  - [x] Meta : `{themeKey} · v{version}`, 10px muted
  - [x] Badge catégorie conditionnel (même style que `ThemeCard.categoryBadge` existant)
  - [x] Pied de carte : bouton Gérer aligné à droite (même style que `ThemeCard.manageBtn` existant)

- [x] **T5** — Hover (AC: #7)
  - [x] `pCard.hover` : `boxShadow: shadows.md, borderColor: colors.accent.gold + '80'` (`shadows.gold` absent des tokens → `shadows.md` utilisé)
  - [x] Vérifier que `shadows.gold` est dans `@aureak/theme` — sinon utiliser `shadows.md`

- [x] **T6** — Substitution dans la grille (AC: #10, #11)
  - [x] Dans `themes/index.tsx` ligne 9 : remplacer l'import `ThemeCard` par `PremiumThemeCard`
  - [x] Ligne ~175 : remplacer `<ThemeCard` par `<PremiumThemeCard` (même props)
  - [x] Vérifier que le `<div>` wrapper avec `draggable` / `onDragStart/Over/Drop/End` reste inchangé

- [x] **T7** — Vérification visuelle (AC: #11)
  - [x] Tester avec thème ayant `imageUrl` + sans `imageUrl`
  - [x] Tester avec `positionIndex` null et non-null
  - [x] Tester avec `groupName` null et non-null
  - [x] Tester drag-and-drop entre cartes
  - [x] Vérifier responsive : 1 → 5 colonnes

---

## Dev Notes

### Analyse du design language Story 25 — Adaptation pour les thèmes

Story 25 (carte joueur premium) établit les règles suivantes que cette story réutilise :

| Règle Story 25 | Valeur | Réutilisation ici |
|---|---|---|
| `borderRadius` | `radius.cardLg` = 24 | ✅ Identique |
| Background JPEG | `StyleSheet.absoluteFillObject` + `resizeMode="cover"` | ✅ Identique (si JPEG dispo) |
| Zones absolues superposées | `position: absolute` sur les éléments UI | ✅ Identique |
| Police titre | Rajdhani Bold/ExtraBold | ✅ Réutilisé (Rajdhani 15px 800) |
| Palette | Fond sombre + accents gold + fond blanc zone infos | ✅ Identique |
| Hauteur fixe | 420px (joueur) | **Adapté → 280px** (densité pédagogique) |
| Éléments décoratifs | Dans le JPEG background | **Adapté** — dégradé CSS en fallback |

### Structure de positionnement

```
┌─────────────────────────────────────────┐  ← top: 0
│ [#01]              [BLOC: Offensive]    │
│                                         │  ← pZone.visual : height: 140
│  [imageUrl du thème si présent, op 0.6] │
│  [fond dégradé doré sombre]             │
├─────────────────────────────────────────┤  ← séparation (height 140 atteint)
│ NOM DU THÈME (Rajdhani 800, 2 lignes)  │  ← pZone.info : height: 140
│ sortie-au-sol · v3          [Catégorie] │
│                              [Gérer →]  │
└─────────────────────────────────────────┘  ← bottom: 0 (280px total)
```

### StyleSheet de référence

```tsx
import React, { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, shadows, radius } from '@aureak/theme'
import type { Theme } from '@aureak/types'

// Décommenter quand l'asset est disponible :
// const BG_THEME = require('../../../assets/cards/background-theme.jpg')

type Props = {
  theme    : Theme
  groupName: string | null
  category?: string | null
  onPress  : () => void
  onManage : () => void
}

const pCard = StyleSheet.create({
  container: {
    overflow    : 'hidden',
    borderRadius: radius.cardLg,        // 24 — identique Story 25
    height      : 280,
    borderWidth : 1,
    borderColor : colors.border.light,
    ...shadows.sm,
  } as never,
  hover: {
    // shadows.gold si disponible, sinon shadows.md
    boxShadow  : shadows.md,
    borderColor: colors.accent.gold + '80',
  } as never,
  pressed: { opacity: 0.92 },
})

const pZone = StyleSheet.create({
  visual: {
    height  : 140,
    position: 'relative' as never,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2206 60%, #1a1400 100%)',
  } as never,
  numberBadge: {
    position         : 'absolute' as never,
    top              : 12,
    left             : 14,
    backgroundColor  : 'rgba(0,0,0,0.55)',
    borderRadius     : 8,
    paddingHorizontal: 7,
    paddingVertical  : 3,
  },
  blocBadge: {
    position         : 'absolute' as never,
    top              : 12,
    right            : 14,
    backgroundColor  : colors.accent.gold + '20',
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '60',
    borderRadius     : 10,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  },
  info: {
    height           : 140,
    paddingHorizontal: 14,
    paddingVertical  : 12,
    backgroundColor  : colors.light.surface,
    flexDirection    : 'column',
    justifyContent   : 'space-between',
  } as never,
})
```

### Intégration future du background JPEG

Quand un JPEG de fond sera fourni, le workflow d'intégration est :
1. Placer dans `aureak/apps/web/assets/cards/background-theme.jpg` (même répertoire que `background-card.jpg` de Story 25)
2. Dans `PremiumThemeCard.tsx`, décommenter la ligne `const BG_THEME = require(...)` en haut du fichier
3. Dans le rendu de `pZone.visual`, ajouter `<Image source={BG_THEME} style={StyleSheet.absoluteFillObject} resizeMode="cover" />` **avant** le layer `imageUrl`
4. Le dégradé CSS reste en place comme dernier fallback (s'affiche si Metro ne peut pas charger l'image)

**Pattern propre recommandé** — pour éviter de modifier le composant lors de l'ajout du JPEG :
```tsx
// assets/cards/index.ts
export const BG_THEME: number | null = null
// → changer à : export const BG_THEME = require('./background-theme.jpg')
```
Puis dans `PremiumThemeCard.tsx` : `import { BG_THEME } from '../../../assets/cards'`

### Responsive behavior — grille existante (ne pas modifier)

La grille dans `themes/index.tsx` est déjà responsive (lignes 25-29) :
- `< 640px` → 1 colonne
- `640–900px` → 2 colonnes
- `900–1200px` → 3 colonnes
- `1200–1400px` → 4 colonnes
- `> 1400px` → 5 colonnes

Comportement de la carte `height: 280px` selon les colonnes :
- 1 colonne (~full width) : ratio très large → zone visuelle spacieuse
- 3 colonnes (~350px wide) : ratio ~350×280 = équilibré ✅
- 5 colonnes (~280px wide) : ratio ~280×280 = quasi-carré, dense mais lisible ✅

Le nom du thème en `numberOfLines: 2` + Rajdhani 15px reste lisible dans toutes les configurations.

### Vérification `shadows.gold`

Avant d'utiliser `shadows.gold`, lire `aureak/packages/theme/src/tokens.ts` pour confirmer son existence. Si absent, utiliser `shadows.md` — ne **pas** modifier `tokens.ts` dans cette story.

### Hiérarchie visuelle recommandée

L'information la plus importante sur la carte (par ordre de priorité visuelle) :

1. **Nom du thème** — Rajdhani Bold 15px, zone infos, premier élément lu
2. **Zone visuelle** — imageUrl ou dégradé gold, attire l'œil en premier
3. **Badge bloc** — top-right, contexte groupement
4. **Badge numéro** — top-left, identifiant rapide

### Données disponibles dans `Theme` (type source : `entities.ts#L119-L137`)

| Champ | Utilisé | Usage |
|---|---|---|
| `theme.name` | ✅ | Zone infos — titre principal |
| `theme.imageUrl` | ✅ | Zone visuelle — image superposée |
| `theme.positionIndex` | ✅ | Badge `#01` |
| `theme.themeKey` | ✅ | Meta ligne |
| `theme.version` | ✅ | Meta ligne |
| `theme.groupId` | ❌ | Résolu en `groupName` par le parent |
| `theme.category` | ✅ | Badge catégorie |
| `theme.level` | ❌ | Non affiché dans cette story |
| `theme.orderIndex` | ❌ | Utilisé par la grille (drag-and-drop), pas la carte |

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx` | **CRÉER** |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Changer import + usage (2 lignes) |
| `aureak/apps/web/assets/cards/background-theme.jpg` | **OPTIONNEL** — si JPEG disponible |

### Points d'attention

- Le `<div>` wrapper dans `themes/index.tsx` (lignes ~161-174) porte `draggable` + handlers drag — NE PAS déplacer ce code sur `PremiumThemeCard`
- `onManage` doit appeler `e.stopPropagation?.()` comme dans le `ThemeCard` existant pour éviter la propagation au `onPress`
- `'use client'` n'est pas nécessaire dans un fichier React Native / Expo Router (pattern du projet : pas de directive dans les composants RN)

### References

- [Source: aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx] — composant existant à remplacer (props, styles à réutiliser)
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/index.tsx#L9, L175] — 2 lignes à modifier
- [Story: _bmad-output/implementation-artifacts/25-1-carte-joueur-premium-structure-visuelle.md] — design language de référence complet
- [Source: aureak/packages/types/src/entities.ts#L119-L137] — type `Theme` complet
- [Source: aureak/packages/theme/src/tokens.ts] — `radius.cardLg: 24`, `shadows.sm/md`, `colors.accent.gold`, `colors.light.surface`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

`PremiumThemeCard` créé comme drop-in replacement de `ThemeCard`. Hauteur fixe 280px, borderRadius 24 (radius.cardLg). Zone visuelle 140px avec dégradé doré sombre (linear-gradient CSS) + imageUrl superposé à opacity 0.6 si présent. Badges #01 (positionIndex) en absolu top-left et bloc (groupName) en absolu top-right. Zone infos 140px : nom Rajdhani 800 15px numberOfLines:2, meta, badge catégorie optionnel, bouton Gérer. Hover: shadows.gold + colors.border.goldSolid. `themes/index.tsx` : import + usage remplacés (2 lignes). `ThemeCard.tsx` conservé intact. TS compile sans erreur.

**Code Review fixes :** H1 — shadows.gold utilisé (existait dans tokens, commentaire erroné corrigé) ; M1 — gap remplacé par space.xs (token) ; M2 — borderColor hover → colors.border.goldSolid (token officiel) ; L1 — hauteur container 280→282px (box-sizing: border-box, zones internes 140+140=280px de contenu) ; L2 — gabarits visuels PNG référencés dans le commentaire du composant.

### File List

- `aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx` — créé
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` — import + usage mis à jour
