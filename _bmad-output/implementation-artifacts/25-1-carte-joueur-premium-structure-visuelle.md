# Story 25.1 : Carte joueur premium — Structure visuelle de base

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 22.2A et 22.2B (done — baseline `JoueurCard` centrée) + Story 25.0 (pour NIVEAU étoiles en 25.2)

---

## Story

En tant qu'administrateur Aureak,
je veux une carte joueur avec un fond visuel premium et des zones de mise en page définies,
afin d'avoir un rendu élégant et structuré qui peut ensuite recevoir toutes les données dynamiques.

---

## Acceptance Criteria

1. **Nouveau composant `PremiumJoueurCard`** — Un nouveau composant React Native est créé dans `children/index.tsx` (ou extrait dans `children/PremiumJoueurCard.tsx`). L'ancien `JoueurCard` reste intact et non modifié.
2. **Background visuel JPEG** — La carte affiche une image de fond JPEG (`background-card.jpg`) couvrant toute la surface de la carte (`resizeMode="cover"`). L'image est stockée dans `aureak/apps/web/assets/cards/background-card.jpg`. Le JPEG original (`Cards Aureak - Joueur.jpg`) doit être **optimisé** avant d'être placé (voir T1). Le background inclut déjà : triangles noirs en coins, filets dorés, image stadium en diagonal haut-gauche, cercle doré haut-droite (zone badge pré-dessinée), séparateurs horizontaux et verticaux en bas.
3. **Dimensions et ratio** — La carte a une largeur fluide (hérite du CSS grid) et une hauteur fixe de **420px**. Le ratio portrait correspond au modèle de référence (~3:4). Le `overflow: 'hidden'` est appliqué avec `borderRadius: radius.cardLg = 24`.
4. **Zone photo diagonale** — La photo joueur occupe la zone diagonale **gauche** de la carte (depuis le coin haut-gauche jusqu'à mi-droite en diagonal, couvrant environ les 55% supérieurs de la hauteur). Cette zone est clippée par le background lui-même (la diagonale est dans le PNG du background). La photo est positionnée en absolu pour remplir cette zone.
5. **Zone badge** — Le badge statut s'insère dans le cercle doré pré-dessiné dans le background, positionné en `position: 'absolute'`, top-droite. Dimensions environ `width: 100, height: 100`, `top: 20, right: 18`. La photo du badge doit remplir le cercle (le cercle doré est déjà dans le background PNG).
6. **Zone nom** — La zone nom est positionnée dans la partie **droite-centre** de la carte, sous le badge, dans la zone blanche. Le prénom (plus petit) est au-dessus, le NOM (plus grand, bold) en-dessous. Position : `top: 180, left: 0, right: 0` (centré horizontalement dans la moitié droite) — ajuster visuellement.
7. **Zone infos** — Deux rangées d'informations dans le bas de la carte (sur fond blanc/gris du background) :
   - Rangée 1 (labels + valeurs) : `DATE DE NAISSANCE` | `HISTORIQUE` → avec séparateurs verticaux dorés déjà dans le background
   - Rangée 2 (labels + valeurs) : `EQUIPE` | `NIVEAU` | `CLUB` → avec séparateurs verticaux dorés déjà dans le background
8. **Placeholders visuels** — Chaque zone affiche un placeholder (View colorée ou texte statique) pour valider le layout avant les données réelles.
9. **Grille maintenue** — `PremiumJoueurCard` remplace `JoueurCard` dans la grille. La grille CSS (`auto-fill minmax(200px, 1fr)`) reste inchangée.
10. **Skeleton adapté** — `PremiumSkeletonCard` avec mêmes dimensions (height: 420, borderRadius: 24).
11. **Pressable** — Carte interactive avec effet `opacity: 0.92` au press.
12. **Aucune donnée réelle** — Story 25.1 = structure + placeholders uniquement.

---

## Tasks / Subtasks

- [x] **T1** — Optimiser et placer le JPEG background (AC: #2)
  - [x] Ouvrir `assets/Cards Aureak - Joueur.jpg` dans squoosh.app
  - [x] Exporter en **JPEG, quality 80%**, résolution réduite si nécessaire (cible : ≤ 150 Ko)
  - [x] Sauvegarder sous `aureak/apps/web/assets/cards/background-card.jpg`
  - [x] Vérifier que `require('../assets/cards/background-card.jpg')` fonctionne dans Metro

- [x] **T2** — Créer le composant `PremiumJoueurCard` avec background (AC: #1, #2, #3)
  - [x] Wrapper `Pressable` avec `accessibilityRole="button"`
  - [x] `<Image source={require('../assets/cards/background-card.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />`
  - [x] `pCard.container` : `position: 'relative', overflow: 'hidden', borderRadius: radius.cardLg, height: 420`

- [x] **T3** — Positionner la zone photo diagonale (AC: #4)
  - [x] `pZone.photo` : `position: 'absolute', top: 0, left: 0, right: 0, height: 230`
  - [x] Placeholder : View grise semi-transparente remplissant la zone
  - [x] Note : le clipping diagonal est géré par le background PNG (pas de clip Path RN nécessaire)

- [x] **T4** — Positionner la zone badge (AC: #5)
  - [x] `pZone.badge` : `position: 'absolute', top: 20, right: 18, width: 100, height: 100`
  - [x] Placeholder : View dorée semi-transparente circulaire

- [x] **T5** — Positionner la zone nom (AC: #6)
  - [x] `pZone.nameBlock` : `position: 'absolute', top: 185, left: '40%', right: 12, alignItems: 'center'`
  - [x] Placeholder : deux lignes "PRÉNOM" + "NOM" en blanc/noir

- [x] **T6** — Positionner les rangées d'infos (AC: #7)
  - [x] `pZone.infoRow1` : `position: 'absolute', bottom: 95, left: 0, right: 0, height: 55, paddingHorizontal: 12`
    - Sous-zones : `dateBlock` (left ~40%) + `historiqueBlock` (right ~60%, deux sous-colonnes)
  - [x] `pZone.infoRow2` : `position: 'absolute', bottom: 10, left: 0, right: 0, height: 70, paddingHorizontal: 12`
    - Sous-zones : `equipeBlock` (~30%) + `niveauBlock` (~40%) + `clubBlock` (~30%)
  - [x] Placeholders texte dans chaque sous-zone

- [x] **T7** — Créer `PremiumSkeletonCard` (AC: #10)
  - [x] Height: 420, borderRadius: 24, fond gris `colors.border.divider`, opacity: 0.55

- [x] **T8** — Substituer dans la grille (AC: #9, #11)
  - [x] Remplacer `<JoueurCard>` par `<PremiumJoueurCard>` dans la grille
  - [x] Remplacer `<SkeletonCard>` par `<PremiumSkeletonCard>`
  - [x] Vérifier l'adaptation du CSS grid

- [x] **T9** — Vérification visuelle (AC: #12)
  - [x] Comparer avec l'image de référence `Cards Aureak - Joueur.jpg` (gabarit vide)
  - [x] Aucune régression filtres/recherche/pagination

---

## Dev Notes

### Layout de référence — analyse visuelle

Le background PNG contient déjà tous les éléments décoratifs :
- Triangles noirs en coins (haut-gauche + bas-droite)
- Filets dorés diagonaux
- Image stadium football en fondu dans le triangle haut-gauche
- **Cercle doré** haut-droite (zone badge pré-définie)
- Ligne horizontale séparatrice avec tirets verticaux dorés (entre zone noms et zone infos)
- Deux rangées de séparateurs verticaux dorés (| DATE | HIST |) et (| EQUIPE | NIVEAU | CLUB |)

→ Le dev n'a PAS à redessiner ces éléments — ils font partie du background PNG.

### Schéma de positionnement (carte 420px de haut, largeur fluide ~220-280px)

```
┌─────────────────────────────────────────┐  ← top: 0
│ [triangle noir]    [cercle doré badge]  │
│  STADIUM IMAGE                          │  ← pZone.photo : top:0 h:230
│   ╲ DIAGONALE                           │
│    ╲ FOND BLANC                         │
│         PRÉNOM (regular, dark)          │  ← pZone.nameBlock : top:185
│       NOM BOLD (extra-large, black)     │
│                                         │
│─────────────────────────────────────────│  ← séparateur horizontal (dans PNG)
│ DATE DE NAISSANCE  │   HISTORIQUE       │  ← pZone.infoRow1 : bottom:95
│   22.03.1986       │  5 Saison │ 2 Stg  │
│─────────────────────────────────────────│
│  EQUIPE  │  NIVEAU  │   CLUB            │  ← pZone.infoRow2 : bottom:10
│   SEN    │ ★★★☆☆   │  [logo]           │
└─────────────────────────────────────────┘  ← bottom: 0
           [triangle noir bas]
```

### StyleSheet de base

```tsx
const pCard = StyleSheet.create({
  container: {
    position    : 'relative' as never,
    overflow    : 'hidden',
    borderRadius: radius.cardLg,  // 24
    height      : 420,
    ...shadows.md,
  },
  pressed: { opacity: 0.92 },
})

const pZone = StyleSheet.create({
  photo: {
    position: 'absolute' as never,
    top     : 0,
    left    : 0,
    right   : 0,
    height  : 230,
  },
  badge: {
    position: 'absolute' as never,
    top     : 20,
    right   : 18,
    width   : 100,
    height  : 100,
  },
  nameBlock: {
    position  : 'absolute' as never,
    top       : 185,
    left      : '38%' as never,
    right     : 12,
    alignItems: 'center',
    gap       : 2,
  },
  infoRow1: {
    position       : 'absolute' as never,
    bottom         : 95,
    left           : 0,
    right          : 0,
    height         : 55,
    flexDirection  : 'row',
    paddingHorizontal: 12,
    alignItems     : 'center',
  },
  infoRow2: {
    position       : 'absolute' as never,
    bottom         : 10,
    left           : 0,
    right          : 0,
    height         : 70,
    flexDirection  : 'row',
    paddingHorizontal: 12,
    alignItems     : 'center',
  },
})
```

### Police Montserrat — à ajouter au projet

La police utilisée pour le NOM du joueur est **Montserrat** (non Rajdhani). Elle n'est pas encore dans le projet.

Tâche dans T2 :
- Télécharger `Montserrat-Regular.ttf`, `Montserrat-SemiBold.ttf`, `Montserrat-Bold.ttf`, `Montserrat-ExtraBold.ttf` (Google Fonts)
- Placer dans `aureak/apps/web/assets/fonts/Montserrat/`
- Enregistrer dans `app/_layout.tsx` via `useFonts` (pattern identique à Rajdhani/Geist)
- Utiliser `fontFamily: 'Montserrat-Bold'` (ou `'Montserrat-ExtraBold'`) pour le NOM

### Points d'attention

- Les **séparateurs verticaux** dans les rangées infos sont dessinés dans le background PNG — ne pas en ajouter en code.
- La **diagonale** de la photo est également gérée par le PNG du background (la zone blanche commence en diagonal). Pas besoin de `clipPath` ou de `overflow: 'hidden'` spécifique sur la zone photo.
- Ajuster `top: 185` de `nameBlock` visuellement selon l'image de référence exacte.
- Sur mobile futur : les positions absolues restent valides mais les `%` doivent être testés.

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/assets/cards/background-card.jpg` | NOUVEAU — background JPEG optimisé (source : `assets/Cards Aureak - Joueur.jpg`) |
| `aureak/apps/web/app/(admin)/children/index.tsx` | Ajout `PremiumJoueurCard` + `PremiumSkeletonCard` + substitution grille |

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L160-L310] — `JoueurCard`, `SkeletonCard`, grille
- [Source: aureak/packages/theme/src/tokens.ts] — `radius.cardLg: 24`, `shadows.md`
- [Image ref: assets/Cards Aureak - Joueur.jpg] — gabarit background vide
- [Image ref: assets/Cards Aureak - Joueur modèle.jpg] — carte complète avec données

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage. Erreurs TS pré-existantes non liées à Story 25.1 (`...shadows.*` spread, TextStyle array, Dispatch types).

### Completion Notes List

- **T1** : Background JPEG optimisé avec Pillow (Python) — 832K → 115 KB (560×840px, quality 80, progressive). Placé sous `aureak/apps/web/assets/cards/background-card.jpg`.
- **T2** : `PremiumJoueurCard` créé dans `children/index.tsx`. Background via `StyleSheet.absoluteFillObject` + `resizeMode="cover"`. `pCard.container` : `position:relative, overflow:hidden, borderRadius:24, height:420`. Montserrat (Regular/SemiBold/Bold/ExtraBold) téléchargé depuis GitHub + enregistré dans `_layout.tsx`.
- **T3** : Zone photo `pZone.photo` : `position:absolute, top:0, left:0, right:0, height:230`. Placeholder View gris semi-transparent. Clipping diagonal géré par le background.
- **T4** : Zone badge `pZone.badge` : `position:absolute, top:20, right:18, width:100, height:100`. Placeholder circulaire doré.
- **T5** : Zone nom `pZone.nameBlock` : `position:absolute, top:185, left:'38%', right:12`. Placeholders "PRÉNOM" (Montserrat-Regular 10px) + "NOM" (Montserrat-Bold 14px).
- **T6** : Rangée 1 (`bottom:95, height:55`) — `dateBlock` + `historiqueBlock`. Rangée 2 (`bottom:10, height:70`) — `equipeBlock`/`niveauBlock`/`clubBlock`. Séparateurs = background.
- **T7** : `PremiumSkeletonCard` : `height:420, borderRadius:24, backgroundColor:divider, opacity:0.55`.
- **T8** : Grille substituée — `PremiumJoueurCard` + `PremiumSkeletonCard`. CSS grid inchangé. `JoueurCard` + `SkeletonCard` conservés.
- **T9** : Aucune nouvelle erreur TS. Filtres/recherche/pagination non touchés.

### Code Review Notes (claude-sonnet-4-6)

- **HIGH — Z-order corrigé** : `pZone.photo` déplacé AVANT `<Image CARD_BG>` en JSX (z=0 photo, z=1 background). Sans ce fix, le masque diagonal blanc du PNG n'aurait pas masqué la photo en Story 25.3.
- **MEDIUM — `accessible={false}`** : ajouté sur l'Image background (image décorative, ne doit pas être annoncée par les screen readers VoiceOver/TalkBack).
- **LOW — `accessibilityLabel`** : `item.displayName` → `formatNomPrenom(item)` (formateur standard projet, déjà importé).

### File List

- `aureak/apps/web/assets/cards/background-card.jpg` (NOUVEAU — 115 KB)
- `aureak/apps/web/assets/fonts/Montserrat/Montserrat-Regular.ttf` (NOUVEAU)
- `aureak/apps/web/assets/fonts/Montserrat/Montserrat-SemiBold.ttf` (NOUVEAU)
- `aureak/apps/web/assets/fonts/Montserrat/Montserrat-Bold.ttf` (NOUVEAU)
- `aureak/apps/web/assets/fonts/Montserrat/Montserrat-ExtraBold.ttf` (NOUVEAU)
- `aureak/apps/web/app/_layout.tsx` (modifié — Montserrat dans useFonts)
- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — PremiumJoueurCard, PremiumSkeletonCard, substitution grille)
