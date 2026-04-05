# Story 52-10 — Radar chart 6 axes SVG pur

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P2
**Dépend de** : story-52-2 (computePlayerStats + 6 attributs définis)

---

## Story

En tant qu'admin, je veux voir un radar chart SVG hexagonal sur la fiche joueur représentant les 6 attributs gardien (PLO/TIR/TEC/TAC/PHY/MEN), sans dépendance de librairie externe, afin d'avoir une visualisation visuelle premium et légère du profil technique du joueur.

---

## Acceptance Criteria

1. **AC1 — SVG pur** : Le radar chart est entièrement en SVG React natif. Sur web : éléments `<svg>` JSX natifs React (`<svg>`, `<polygon>`, `<line>`, `<text>`). Sur native : `react-native-svg` si disponible, sinon fallback barres horizontales. Aucune librairie de chart (recharts, victory, etc.) n'est utilisée.

2. **AC2 — 6 axes hexagonaux** : Les axes sont distribués à 60° d'espacement (0°, 60°, 120°, 180°, 240°, 300°). L'axe 0° (haut) = PLO, 60° = TIR, 120° = TEC, 180° = TAC, 240° = PHY, 300° = MEN.

3. **AC3 — Grille de référence** : 3 niveaux de grille hexagonale concentriques à 33%, 66%, 100% du rayon. Couleur `colors.border.light`, stroke-width 0.5, fill none.

4. **AC4 — Polygone data** : Le polygone des stats du joueur est rempli avec la couleur du tier à 30% d'opacité et contour 2px. Couleur tier : Prospect = `#909090`, Académicien = `#555`, Confirmé = `#C1AC5C`, Elite = `#FFE566`.

5. **AC5 — Labels axes** : Chaque axe a son label (`PLO`, `TIR`, etc.) positionné à l'extrémité avec la valeur entre parenthèses (ex : `PLO\n72`). Font `fonts.mono`, taille 9px, couleur `colors.text.muted`.

6. **AC6 — Dimensions** : Le SVG est 200×200px par défaut, configurable via prop `size`. Le rayon du chart = `size/2 * 0.72` pour laisser de la marge aux labels.

7. **AC7 — Composant exporté** : `RadarChart` exporté depuis `@aureak/ui` avec props `{ stats: PlayerStats; tier: PlayerTier; size?: number }`. `PlayerStats = { PLO: number; TIR: number; TEC: number; TAC: number; PHY: number; MEN: number }`.

8. **AC8 — Cross-platform** : Sur Platform web, éléments SVG JSX directs dans un `<View>`. Sur Platform native, utiliser `react-native-svg` ou fallback. Détecter avec `Platform.OS`.

---

## Tasks

- [x] **T1** — Créer `aureak/packages/ui/src/RadarChart.tsx` :
  - Import `Platform`, `View` depuis `react-native`
  - Définir `polarToCartesian(angle, value, maxValue, radius, cx, cy): { x: number, y: number }` helper pur
  - `computePolygonPoints(stats, maxValue, radius, cx, cy): string` — retourne la string SVG `points`
  - `computeGridPoints(pct, radius, cx, cy): string` — retourne les points grille à pct% du rayon

- [x] **T2** — Implémentation web (`Platform.OS === 'web'`) :
  - Retourner un `<View>` contenant des éléments JSX SVG natifs React : `<svg viewBox>`, `<polygon>`, `<line>`, `<text>`
  - Grille : 3 éléments `<polygon>` fill="none" stroke
  - Data : 1 `<polygon>` fill semi-transparent + stroke couleur tier
  - Axes : 6 `<line>` du centre vers l'extrémité
  - Labels : 6 `<text>` aux extrémités

- [x] **T3** — Implémentation native (`Platform.OS !== 'web'`) :
  - react-native-svg absent → fallback barres horizontales

- [x] **T4** — Exporter `RadarChart` depuis `aureak/packages/ui/src/index.ts`

- [x] **T5** — Dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` :
  - Importer `RadarChart` depuis `@aureak/ui`
  - Importer `computePlayerStats`, `computePlayerTier` depuis `@aureak/business-logic`
  - Positionner `<RadarChart stats={stats} tier={tier} size={200} />` dans le tab `Profil`, sous l'identité
  - Titre section : "Profil technique"

- [x] **T6** — QA : vérifier zéro import de librairies chart tierces dans `RadarChart.tsx`.

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/RadarChart.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — ajouter export RadarChart |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — ajouter RadarChart dans tab Profil |

---

## Notes techniques

- La formule coordonnées polaires → cartésiennes :
  `x = cx + radius * (value/maxValue) * Math.sin(angle_rad)`
  `y = cy - radius * (value/maxValue) * Math.cos(angle_rad)`
  Angles : axe 0 = 0 rad, puis +Math.PI/3 par axe.
- `maxValue = 100` (valeurs stats clampées 40–85 sur 100).
- Les éléments `<svg>`, `<polygon>`, `<line>`, `<text>` sont des composants JSX React natifs valides en Expo Router web (React Native for Web les passe au DOM HTML directement).
- Vérifier `aureak/apps/mobile/package.json` ou `aureak/package.json` pour la présence de `react-native-svg`.
- Les valeurs SVG `points`, `x1`, `y1`, etc. sont calculées côté JS et injectées comme props — pas de contenu HTML construit dynamiquement côté string.
