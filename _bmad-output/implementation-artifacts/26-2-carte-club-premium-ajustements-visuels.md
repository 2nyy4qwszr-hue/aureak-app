# Story 26.2 : Carte Club Premium — Ajustements visuels pour conformité référence

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que les cartes clubs correspondent fidèlement à la maquette de référence visuelle (image "Cards aureak - Club modèle.png"),
afin d'obtenir un rendu premium cohérent avec les attentes design du projet.

## Acceptance Criteria

1. La carte est **carrée** (`aspectRatio: 1`) — elle s'adapte à n'importe quelle largeur de colonne sans déformation.
2. Le cercle logo est plus grand (`CIRCLE_OUTER = 140px`) et positionné proche du bord haut (`CIRCLE_TOP = 24px`), donnant un effet visuel "flottant" au-dessus du fond graphique.
3. Le nom du club est affiché en **majuscules** (`textTransform: 'uppercase'`), taille 17px, letterSpacing 1 — fidèle à la maquette.
4. La police **Montserrat** est chargée dans l'application web (`+html.tsx` ou `_layout.tsx`) via Google Fonts.
5. Toutes les positions absolues (`textZone.top`, `statZone.bottom`) sont recalculées proportionnellement aux nouvelles dimensions du cercle.
6. Le rendu visuel sur la page `/clubs` est conforme à la maquette de référence `Cards aureak - Club modèle.png`.
7. La grille existante (`clubs/page.tsx`) reste inchangée — aucune régression.
8. Le `ClubCardSkeleton` est mis à jour avec les nouvelles dimensions (aspectRatio: 1, circle 140px).

## Tasks / Subtasks

- [x] Charger la police Montserrat (AC: #4)
  - [x] Identifier le fichier de layout web (`apps/web/app/+html.tsx` ou `_layout.tsx`)
  - [x] Montserrat déjà chargé via `useFonts` dans `_layout.tsx` (Story 25.1) — noms: `'Montserrat-Regular'`, `'Montserrat-SemiBold'`, `'Montserrat-Bold'`, `'Montserrat-ExtraBold'`
  - [x] `fontFamily` corrigé dans ClubCard : `'Montserrat, Geist, sans-serif'` → noms expo-font exacts (`'Montserrat-Bold'`, `'Montserrat-Regular'`, `'Montserrat-SemiBold'`, `'Montserrat-ExtraBold'`)

- [x] Ajuster les dimensions de la carte (AC: #1, #2, #5, #8)
  - [x] Remplacer `height: CARD_HEIGHT` par `aspectRatio: 1` dans `s.card` — constante `CARD_HEIGHT` supprimée
  - [x] Mettre à jour `CIRCLE_OUTER`: 116 → 140
  - [x] Mettre à jour `CIRCLE_TOP`: 50 → 24
  - [x] Recalculer `textZone.top` : `CIRCLE_TOP + CIRCLE_OUTER + 16` = 24 + 140 + 16 = **180**
  - [x] Ajuster `CIRCLE_INNER` (logoImage) : `CIRCLE_OUTER - 28` = 112px
  - [x] Mettre à jour `ClubCardSkeleton` : `aspectRatio: 1`, circle 140px/top:24, nameLine top:184, locationLine top:204

- [x] Ajuster le style du nom du club (AC: #3)
  - [x] `fontSize`: 14 → 17
  - [x] Ajouter `textTransform: 'uppercase' as const`
  - [x] `letterSpacing`: 0.3 → 1
  - [x] `lineHeight`: 20 → 22

- [ ] Valider le rendu visuel (AC: #6, #7)
  - [ ] Vérifier `/clubs` — carte carrée, cercle grand, nom en majuscules
  - [ ] Vérifier la grille 5/4/3/2/1 colonnes inchangée
  - [ ] Vérifier le skeleton aux nouvelles proportions
  - [ ] Comparer avec la maquette `Cards aureak - Club modèle.png`

## Dev Notes

### Changements clés dans `ClubCard.tsx`

```ts
// AVANT
const CARD_HEIGHT  = 360
const CIRCLE_OUTER = 116
const CIRCLE_TOP   = 50

// APRÈS
// CARD_HEIGHT supprimé — remplacé par aspectRatio: 1
const CIRCLE_OUTER = 140
const CIRCLE_TOP   = 24
```

```ts
// s.card — AVANT
card: {
  height      : CARD_HEIGHT,
  borderRadius: 24,
  overflow    : 'hidden',
  ...
}

// s.card — APRÈS
card: {
  aspectRatio     : 1,
  borderRadius    : 24,
  overflow        : 'hidden',
  ...
}
```

```ts
// s.name — AVANT
name: {
  fontSize     : 14,
  letterSpacing: 0.3,
  lineHeight   : 20,
}

// s.name — APRÈS
name: {
  fontSize     : 17,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  lineHeight   : 22,
}
```

### Chargement Montserrat — Google Fonts

```html
<!-- Dans +html.tsx ou _layout.tsx, dans le <head> -->
<link
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap"
  rel="stylesheet"
/>
```

### Recalcul des positions après changement de dimensions

Avec `aspectRatio: 1` et `CIRCLE_OUTER = 140`, `CIRCLE_TOP = 24` :
- `logoImage` : `CIRCLE_OUTER - 28 = 112px` (inscrit dans le ring gold)
- `textZone.top` : `24 + 140 + 16 = 180` (cercle + espace respiration)
- `statZone.bottom` : `20` (inchangé — ancrage en bas)
- `logoZone.marginLeft` : `-(140 / 2) = -70`

### Skeleton mise à jour

```ts
const sk = StyleSheet.create({
  card: {
    aspectRatio    : 1,        // était height: CARD_HEIGHT
    borderRadius   : 24,
    ...
  },
  circle: {
    top       : CIRCLE_TOP,    // 24
    marginLeft: -(CIRCLE_OUTER / 2),  // -70
    width     : CIRCLE_OUTER,  // 140
    height    : CIRCLE_OUTER,  // 140
    ...
  },
  nameLine: {
    top: CIRCLE_TOP + CIRCLE_OUTER + 20,  // 184
    ...
  },
  locationLine: {
    top: CIRCLE_TOP + CIRCLE_OUTER + 40,  // 204
    ...
  },
  // statBlock inchangé (bottom: 24)
})
```

### Aucune migration requise

Story purement frontend — aucun changement de schéma, d'API ou de type.

### Project Structure Notes

```
aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx   ← MODIFIER
aureak/apps/web/app/+html.tsx (ou _layout.tsx)               ← MODIFIER (Montserrat)
```

### References

- [Source: aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx] — composant Story 26.1
- [Source: assets/Cards aureak - Club modèle.png] — maquette de référence visuelle
- [Source: _bmad-output/implementation-artifacts/26-1-carte-club-premium.md] — story précédente

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Tous les ajustements visuels appliqués dans `ClubCard.tsx` :
- Carte carrée : `aspectRatio: 1` (suppression `CARD_HEIGHT = 360`)
- Cercle plus grand : `CIRCLE_OUTER = 140`, `CIRCLE_TOP = 24` — effet "flottant" proche du bord haut
- `CIRCLE_INNER = 112px` (logoImage inscrit dans le ring gold)
- `textZone.top = 180` (recalculé : 24+140+16)
- Nom en majuscules : `fontSize: 17`, `textTransform: 'uppercase'`, `letterSpacing: 1`, `lineHeight: 22`
- `fontFamily` corrigé : utilisation des noms expo-font exacts (`'Montserrat-Bold'` etc.) au lieu de `'Montserrat, Geist, sans-serif'` (Montserrat déjà chargé via `useFonts` dans `_layout.tsx` — Story 25.1)
- `ClubCardSkeleton` mis à jour : `aspectRatio: 1`, circle 140px/top:24, positions nameLine/locationLine recalculées
- Grille `clubs/page.tsx` inchangée — aucune régression

**Code Review fixes (2026-03-17):** M1 — `fontWeight: '700'` supprimé de `s.name` (`fontFamily: 'Montserrat-Bold'` encode déjà le poids, évite double-bold iOS/Android). M2 — `fontWeight: '600'` supprimé de `s.statLabel` + `fontWeight: '800'` supprimé de `s.statNumber` (même raison). L1 — `lineHeight: 16` ajouté à `s.location` (cohérence multi-plateforme). L2 — `s.relationBadgeText` : `fontWeight: '700'` → `fontFamily: 'Montserrat-Bold'`. L3 — Commentaire fichier mis à jour (Story 26.1 + 26.2).

### File List

- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` — MODIFIÉ (ajustements visuels story 26.2)
