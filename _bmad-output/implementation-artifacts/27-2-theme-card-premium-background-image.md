# Story 27.2 : Theme Card — Refonte visuelle complète avec background officiel

Status: done

**Epic :** 27 — Theme Card Premium Design
**Dépendances :** Story 27.1 (done — `PremiumThemeCard` existant à remplacer)

---

## Story

En tant qu'administrateur Aureak,
je veux que les cartes de thèmes utilisent le background officiel Aureak (`Cards aureak - themes.png`) avec le titre en haut et l'illustration du thème centrée dans la zone basse,
afin que la grille de thèmes corresponde exactement au gabarit visuel fourni.

---

## Acceptance Criteria

1. **Asset background activé** — `assets/Cards aureak - themes.png` (racine projet) est copié dans `aureak/apps/web/assets/cards/background-theme.png` et chargé via `require` dans `PremiumThemeCard`.

2. **Background PNG couvre toute la carte** — `<Image source={BG_THEME} style={StyleSheet.absoluteFillObject} resizeMode="cover" />` positionné en première couche. Tous les éléments UI sont superposés en `position: absolute` par-dessus.

3. **Carte carrée** — `aspectRatio: 1` (hauteur = largeur, calculée par la grille CSS). Pas de `height` fixe en px. `overflow: 'hidden'`, `borderRadius: radius.cardLg` (24).

4. **Zone titre** — Positionnée AU-DESSUS de la ligne dorée horizontale du PNG (qui est à ~30% du haut). Style : `position: absolute, top: 0, left: 0, right: 0, height: '30%'`. Contenu centré verticalement et horizontalement. Texte : `fontFamily: 'Rajdhani, sans-serif'`, `fontWeight: '900'`, `fontSize: 17`, `textTransform: 'uppercase'`, `letterSpacing: 0.5`, `color: colors.text.dark`, `textAlign: 'center'`, `numberOfLines: 2`, padding horizontal `14`.

5. **Zone image** — Positionnée SOUS la ligne dorée. Style : `position: absolute, top: '33%', left: 12, right: 12, bottom: 12`. L'image est dans un `View` avec `borderRadius: 14`, `overflow: 'hidden'`. Si `theme.imageUrl` présent : `<Image source={{ uri: theme.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />`. Sinon : fond `colors.accent.gold + '15'` + icône `◈` centrée (`fontSize: 36, color: colors.accent.gold, opacity: 0.35`).

6. **Badge numéro `#01`** — Affiché si `theme.positionIndex != null`. Positionné `position: absolute, top: 8, left: 10` dans la zone titre. Style discret : fond `rgba(0,0,0,0.10)`, texte `colors.text.dark`, `fontSize: 9, fontWeight: '700', letterSpacing: 0.8`. Ne pas gêner le titre.

7. **Pas de badge bloc** — Supprimé du rendu (le fond blanc du PNG ne supporte pas deux badges lisibles). Le filtre par bloc reste dans la page via les chips de filtre.

8. **Pas de bouton Gérer** — La navigation se fait via `onPress` sur toute la carte. `onManage` reste dans les props pour compatibilité mais n'est pas rendu. L'UX de gestion passe par le clic sur la carte.

9. **Hover** — `boxShadow: shadows.gold`, léger `transform: [{ scale: 1.015 }]`, `transition: 'transform 0.15s ease, box-shadow 0.15s ease'` (CSS web).

10. **Press** — `opacity: 0.94` au press.

11. **Props identiques** — Mêmes props que `PremiumThemeCard` v1 : `{ theme: Theme, groupName: string | null, category?: string | null, onPress: () => void, onManage: () => void }`. Drop-in replacement dans `themes/index.tsx` — aucune modification dans la grille.

12. **Aucune régression** — Grille CSS, drag-and-drop, filtres par bloc fonctionnent identiquement.

---

## Tasks / Subtasks

- [x] **T1** — Copier le background PNG dans les assets web (AC: #1)
  - [x] Copier `assets/Cards aureak - themes.png` → `aureak/apps/web/assets/cards/background-theme.png`
  - [x] Dans `PremiumThemeCard.tsx` en haut du fichier : `const BG_THEME = require('../../../assets/cards/background-theme.png')`
  - [x] Vérifier que Metro/webpack résout le require sans erreur

- [x] **T2** — Refondre la structure de la carte (AC: #2, #3)
  - [x] Remplacer le contenu du composant par : Pressable → Image BG (absoluteFillObject) + zones absolues
  - [x] Container : `aspectRatio: 1`, `overflow: 'hidden'`, `borderRadius: radius.cardLg`, `position: 'relative'`
  - [x] Supprimer les deux `View` `pZone.visual` et `pZone.info` à hauteur fixe
  - [x] Ajouter la `transition` CSS pour hover sur le container

- [x] **T3** — Zone titre (AC: #4, #6)
  - [x] `pZone.titleArea` : `position: 'absolute', top: 0, left: 0, right: 0, height: '30%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14`
  - [x] `<AureakText>` titre : Rajdhani 900 17px uppercase letterSpacing 0.5 dark centré numberOfLines 2
  - [x] Badge #01 en absolu `top: 8, left: 10` si `positionIndex != null`

- [x] **T4** — Zone image (AC: #5)
  - [x] `pZone.imageArea` : `position: 'absolute', top: '33%', left: 12, right: 12, bottom: 12, borderRadius: 14, overflow: 'hidden'`
  - [x] Rendu conditionnel : Image si `theme.imageUrl`, sinon View placeholder doré
  - [x] Placeholder : fond `colors.accent.gold + '15'` + `◈` centré `fontSize: 36 opacity: 0.35`

- [x] **T5** — Hover & press (AC: #9, #10)
  - [x] `pCard.hover` : `boxShadow: shadows.gold, transform: [{ scale: 1.015 }]`
  - [x] `pCard.pressed` : `opacity: 0.94`
  - [x] `pCard.container` : `transition: 'transform 0.15s ease, box-shadow 0.15s ease'`

- [x] **T6** — Nettoyage des anciens styles (AC: #7, #8, #11)
  - [x] Anciens styles v1 supprimés : `gradient`, `visual`, `info`, `infoTop`, `blocBadge`, `blocBadgeText`, `meta`, `categoryBadge`, `categoryBadgeText`, `footer`, `manageBtn`, `manageBtnText`
  - [x] `pZone.numberBadge` et `pZone.numberBadgeText` conservés
  - [x] `groupName`, `category`, `onManage` dans les props sans rendu

- [x] **T7** — Vérification visuelle finale (AC: #12)
  - [x] Structure comparée avec `assets/Cards aureak - themes modele.png`
  - [x] Rendu conditionnel imageUrl testé
  - [x] Ratio carré `aspectRatio: 1` adaptatif à toutes les colonnes
  - [x] Grille et drag-and-drop non touchés (`themes/index.tsx` inchangé)

---

## Dev Notes

### Analyse précise du background PNG

D'après `assets/Cards aureak - themes.png` (haute résolution) :

```
┌─────────────────────────────────────────┐  ← top: 0
│ ╲ bande diagonale gris-argent haut-gauche│
│  ◈ scintillements dorés                 │
│                                         │  ← ZONE TITRE (0% → 30%)
│ ─────────────────────────────────────── │  ← ligne dorée horizontale (~30%)
│                                         │
│         ZONE IMAGE                      │  ← ZONE IMAGE (33% → 100%)
│                                         │
│                         ╱ diagonales    │
│                       ◈ dorées bas-droit│
└─────────────────────────────────────────┘  ← bottom: 0
```

**Éléments du PNG (ne pas recréer en code) :**
- Ligne dorée horizontale à ~30% du haut
- Bande diagonale gris-argent depuis le coin haut-gauche
- 2-3 lignes dorées diagonales dans le coin bas-droit
- Effets bokeh/scintillement dispersés
- Coins arrondis intégrés (~24px)

**Zone titre** : bande blanche/nacrée entre le top et la ligne dorée → ~30% de la hauteur
**Zone image** : grande zone blanche/nacrée sous la ligne → 70% de la hauteur, avec marges

### StyleSheet de référence

```tsx
import React, { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, shadows, radius } from '@aureak/theme'
import type { Theme } from '@aureak/types'

const BG_THEME = require('../../../assets/cards/background-theme.png')

type Props = {
  theme    : Theme
  groupName: string | null
  category?: string | null
  onPress  : () => void
  onManage : () => void
}

export default function PremiumThemeCard({ theme, onPress }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      style={({ pressed }) => [
        pCard.container,
        hovered && pCard.hover,
        pressed && pCard.pressed,
      ]}
    >
      {/* Background officiel */}
      <Image source={BG_THEME} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      {/* Zone titre */}
      <View style={pZone.titleArea}>
        {theme.positionIndex != null && (
          <View style={pZone.numberBadge}>
            <AureakText style={pZone.numberBadgeText}>
              #{String(theme.positionIndex).padStart(2, '0')}
            </AureakText>
          </View>
        )}
        <AureakText style={pZone.themeName} numberOfLines={2}>
          {theme.name}
        </AureakText>
      </View>

      {/* Zone image */}
      <View style={pZone.imageArea}>
        {theme.imageUrl ? (
          <Image
            source={{ uri: theme.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={pZone.imagePlaceholder}>
            <AureakText style={pZone.placeholderIcon}>◈</AureakText>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const pCard = StyleSheet.create({
  container: {
    aspectRatio : 1,
    overflow    : 'hidden',
    borderRadius: radius.cardLg,
    position    : 'relative' as never,
    transition  : 'transform 0.15s ease, box-shadow 0.15s ease',
  } as never,
  hover  : { boxShadow: shadows.gold, transform: [{ scale: 1.015 }] } as never,
  pressed: { opacity: 0.94 },
})

const pZone = StyleSheet.create({
  titleArea: {
    position       : 'absolute' as never,
    top            : 0,
    left           : 0,
    right          : 0,
    height         : '30%' as never,
    justifyContent : 'center',
    alignItems     : 'center',
    paddingHorizontal: 14,
  },
  themeName: {
    fontSize     : 17,
    fontWeight   : '900',
    fontFamily   : 'Rajdhani, sans-serif',
    textTransform: 'uppercase' as never,
    letterSpacing: 0.5,
    color        : colors.text.dark,
    textAlign    : 'center',
  } as never,
  numberBadge: {
    position         : 'absolute' as never,
    top              : 8,
    left             : 10,
    backgroundColor  : 'rgba(0,0,0,0.10)',
    borderRadius     : 6,
    paddingHorizontal: 6,
    paddingVertical  : 2,
  },
  numberBadgeText: {
    fontSize     : 9,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.dark,
    fontFamily   : 'Geist Mono, monospace',
  } as never,
  imageArea: {
    position    : 'absolute' as never,
    top         : '33%' as never,
    left        : 12,
    right       : 12,
    bottom      : 12,
    borderRadius: 14,
    overflow    : 'hidden',
  },
  imagePlaceholder: {
    flex           : 1,
    backgroundColor: colors.accent.gold + '15',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  placeholderIcon: {
    fontSize: 36,
    color   : colors.accent.gold,
    opacity : 0.35,
  } as never,
})
```

### Points d'attention

- `height: '30%'` et `top: '33%'` en `position: absolute` sont relatifs à la hauteur du parent. Ils fonctionnent correctement si le container a une hauteur définie — ce qui est le cas via `aspectRatio: 1` + largeur de grille.
- Le gap entre `height: '30%'` de la titleArea et `top: '33%'` de l'imageArea laisse ~3% de marge pour que la ligne dorée du PNG soit visible et non masquée.
- `transform: [{ scale: 1.015 }]` sur React Native web se traduit en CSS `transform: scale(1.015)`. Fonctionne correctement sur Expo web.
- Le composant reçoit toujours `groupName`, `category` et `onManage` dans ses props mais ne les rend pas — compatibilité avec `themes/index.tsx` sans modification.

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/assets/cards/background-theme.png` | **CRÉER** — copie de `assets/Cards aureak - themes.png` |
| `aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx` | **RÉÉCRIRE** — remplacer tout le contenu |

### References

- [Image ref: assets/Cards aureak - themes.png] — background officiel (gabarit vide)
- [Image ref: assets/Cards aureak - themes modele.png] — carte complète avec données de référence
- [Source: aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx] — v1 à remplacer
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/index.tsx] — grille (ne pas modifier)
- [Source: aureak/packages/theme/src/tokens.ts] — `radius.cardLg: 24`, `shadows.gold`, `colors`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `aureak/apps/web/app/(admin)/methodologie/_components/PremiumThemeCard.tsx` — CRÉÉ (refonte complète avec background PNG)
- `aureak/apps/web/assets/cards/background-theme.png` — CRÉÉ (copie de `assets/Cards aureak - themes.png`)
