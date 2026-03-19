# Story 26.1 : Carte Club Premium — Refonte visuelle avec fond graphique

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que les cartes clubs affichent un rendu premium avec fond graphique cohérent avec les cartes joueurs (Story 25),
afin d'avoir une interface homogène et qualitative dans toute la section admin.

## Acceptance Criteria

1. `ClubCard` utilise un fond graphique PNG plein-cadre (`background-card-club.png`) comme arrière-plan de la carte.
2. Le logo du club est affiché centré dans le cercle gold pré-dessiné sur le fond graphique.
3. Fallback : si aucun logo n'est disponible, un pictogramme gant 🧤 est affiché dans le cercle.
4. Le nom du club est affiché centré sous le cercle, en gras (Montserrat avec fallback Geist).
5. La ville et la province sont affichées sous le nom, en texte muted centré.
6. La stat "Gardiens à l'académie" est affichée en bas de la carte : label uppercase + pictogramme 🧤 + nombre en grand (40px, brun-gold).
7. Si `gardienCount === 0`, afficher `—` à la place du nombre (évite un `0` gold trompeur).
8. Le badge type de relation (partenaire / associé) est conservé en position top-right sur fond blanc semi-transparent.
9. Hover : `shadows.gold` + `scale: 1.02`.
10. `ClubCardSkeleton` est mis à jour aux nouvelles dimensions (360px de hauteur, `borderRadius: 24`).
11. Le fond graphique `background-card-club.png` est stocké dans `aureak/apps/web/assets/cards/`.
12. La grille existante (`clubs/page.tsx`) est inchangée — aucune régression.

## Tasks / Subtasks

- [x] Copier le fond graphique dans les assets web (AC: #11)
  - [x] `mkdir -p aureak/apps/web/assets/cards/`
  - [x] Copier `assets/Cards aureak - Club.png` → `aureak/apps/web/assets/cards/background-card-club.png`

- [x] Refondre `ClubCard` avec fond graphique (AC: #1 à #9)
  - [x] Supprimer layout vertical (logoZone + body) existant
  - [x] Ajouter `Image` plein-cadre (`StyleSheet.absoluteFillObject`) avec `resizeMode="cover"`
  - [x] Zone logo : `position: absolute`, centrée horizontalement dans le cercle gold (116×116px, `top: 50`)
  - [x] Zone texte : `position: absolute`, centrée sous le cercle (`top: 184`)
  - [x] Zone stat : `position: absolute`, ancrée en bas (`bottom: 20`) — label + 🧤 + nombre
  - [x] Hover : `shadows.gold` + `transform: [{ scale: 1.02 }]`
  - [x] Fallback logo → 🧤 44px (AC: #3)
  - [x] `gardienCount === 0` → `—` (AC: #7)
  - [x] Badge relation top-right sur fond blanc semi-transparent (AC: #8)

- [x] Mettre à jour `ClubCardSkeleton` (AC: #10)
  - [x] Hauteur 360px, `borderRadius: 24`
  - [x] Skeleton sans fond image — gris léger (`colors.light.muted`)
  - [x] Éléments skeleton positionnés en absolu : circle, nameLine, locationLine, statBlock

- [x] Tests manuels (AC: #1 à #12)
  - [x] Vérifier rendu avec logo → logo dans le cercle gold
  - [x] Vérifier fallback sans logo → 🧤 dans le cercle
  - [x] Vérifier gardienCount > 0 → nombre brun-gold
  - [x] Vérifier gardienCount === 0 → `—`
  - [x] Vérifier badge partenaire top-right
  - [x] Vérifier hover → glow gold + scale
  - [x] Vérifier skeleton aux bonnes dimensions
  - [x] Vérifier grille 5 colonnes inchangée (`clubs/page.tsx`)

## Dev Notes

### Pattern architectural — même que Story 25.1

Cette story suit exactement le même pattern que `PremiumJoueurCard` (Story 25.1) :
- Fond PNG plein-cadre via `Image` + `StyleSheet.absoluteFillObject`
- Éléments de contenu en `position: absolute` par-dessus
- `overflow: 'hidden'` + `borderRadius: 24` sur le `Pressable` parent pour le clipping

### Dimensions et positionnement

```
CARD_HEIGHT  = 360px
CIRCLE_OUTER = 116px   (diamètre zone logo, correspond au cercle gold du fond PNG)
CIRCLE_TOP   = 50px    (centre du cercle = 108px = 30% de 360 ✓)

textZone.top     = CIRCLE_TOP + CIRCLE_OUTER + 18 = 184px
statZone.bottom  = 20px
```

Ces valeurs sont calculées proportionnellement aux dimensions du fond graphique (quasi carré).
Si ajustement nécessaire après test visuel : modifier `CIRCLE_TOP` (±8px max).

### Asset

- Source : `assets/Cards aureak - Club.png` (racine projet)
- Destination : `aureak/apps/web/assets/cards/background-card-club.png`
- Référencé via `require('../../../../assets/cards/background-card-club.png')`

### Typographie

- `fontFamily: 'Montserrat, Geist, sans-serif'` — Montserrat activée par Story 25, Geist en fallback
- Nom club : 14px, weight 700
- Location : 11px, `#777`
- Stat label : 9px, weight 600, uppercase, `#888`
- Stat number : 40px, weight 800, `#3d2b00` (brun-gold foncé)

### Cohérence avec Story 25

| Élément Story 25 (joueurs) | Story 26 (clubs) |
|---|---|
| Fond JPEG portrait + découpe diagonale | Fond PNG quasi-carré + cercle gold centré |
| Photo joueur dans zone diagonale | Logo club dans cercle gold |
| `borderRadius: 24` | `borderRadius: 24` ✓ |
| `shadows.gold` au hover | `shadows.gold` au hover ✓ |
| Montserrat (Regular/Bold/ExtraBold) | Montserrat (fallback Geist) ✓ |
| Hauteur fixe 420px | Hauteur fixe 360px |

### Aucune migration requise

Story purement frontend — aucun changement de schema, d'API ou de type.

### Project Structure Notes

```
aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx   ← MODIFIÉ
aureak/apps/web/assets/cards/background-card-club.png        ← CRÉÉ (copié)
```

Aucun autre fichier modifié.

### References

- [Source: aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx] — composant existant (Story 23.5)
- [Source: _bmad-output/implementation-artifacts/25-1-carte-joueur-premium-structure-visuelle.md] — pattern PremiumJoueurCard
- [Source: aureak/apps/web/app/(admin)/clubs/page.tsx] — grille inchangée

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Refonte complète de `ClubCard.tsx` sur le pattern Story 25.1 (PremiumJoueurCard). Fond PNG plein-cadre (`background-card-club.png`) copié depuis `assets/` racine vers `apps/web/assets/cards/`. Éléments positionnés en absolu : cercle logo (116px, top:50, centré), zone texte (top:184), stat gardiens (bottom:20). Hover : `shadows.gold` + `scale: 1.02`. `ClubCardSkeleton` mis à jour aux nouvelles dimensions (360px, borderRadius:24, sans fond image). `gardienCount === 0` affiché `—`. Badge relation conservé top-right sur fond blanc semi-transparent. Grille `clubs/page.tsx` inchangée.

**Code Review fixes (2026-03-17):** M1 — `backgroundColor: colors.light.surface` ajouté à `s.card` (fallback si PNG échoue). M2 — state `pressed` + `onPressIn`/`onPressOut` + style `cardPressed` (`opacity: 0.92, scale: 0.98`). L1 — couleurs hardcodées `#1a1a1a`/`#777`/`#888` remplacées par `colors.text.dark`/`colors.text.muted`. L2 — `accessibilityRole="button"` ajouté sur `Pressable`. L3 — File List corrigé (CRÉÉ/MODIFIÉ non committé).

### File List

- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` — CRÉÉ/MODIFIÉ (non committé depuis Story 23.5 — refonte visuelle complète Sprint 26)
- `aureak/apps/web/assets/cards/background-card-club.png` — CRÉÉ (fond graphique premium)
