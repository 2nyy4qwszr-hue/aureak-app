# Story 25.6 : Carte joueur premium — Corrections d'alignement et de layout

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 25.1 + 25.2 + 25.3 + 25.4 + 25.5 — toutes `done`

---

## Story

En tant qu'administrateur Aureak,
je veux que la carte joueur premium affiche ses éléments visuels (badge, nom/prénom, blocs d'infos, ligne du bas) avec des proportions correctes et un alignement fidèle au gabarit de référence,
afin d'obtenir un rendu premium cohérent et professionnel pour tous les joueurs.

---

## Contexte technique critique

### Cause racine des désalignements (Story 25.5 → 25.6)

Story 25.5 a corrigé le rendu du background (`absoluteFillObject` → `width: 280, height: 420`). **Mais :** les positions absolues des zones (`top`, `bottom`, `right`) avaient été calibrées alors que le background se rendait à sa taille naturelle 560×840 (clippé par `overflow:hidden`). Avec le background maintenant correctement rendu à 280×420, ces positions doivent être recalibrées pour s'aligner sur les éléments visuels réels du JPEG (séparateurs dorés, cercle badge, zones d'info).

**Les 5 zones à corriger :**
1. Badge statut (haut-droite) — trop grand et mal centré dans le cercle doré
2. Bloc nom/prénom — doit être aligné à droite, pas centré
3. InfoRow1 (DATE DE NAISSANCE + HISTORIQUE) — labels et valeurs pas alignés à la même hauteur
4. InfoRow2 (ÉQUIPE + NIVEAU + CLUB) — trop bas, titres et contenus mal alignés
5. Cohérence globale — espaces, marges, hiérarchie

### Structure du background 280×420 (gabarit de référence)

Le JPEG `background-card.jpg` (560×840 × 0.5 = 280×420) contient :
- **Zone photo** : moitié gauche avec découpe diagonale blanche vers le bas-droite
- **Cercle doré badge** : haut-droite, environ ∅ 68px, centré à ~top:25 right:14
- **Zone nom** : espace blanc à droite de la diagonale, environ top:165 → 230
- **Séparateur horizontal doré 1** : ~top:255 (ligne fine entre zone nom et infoRow1)
- **InfoRow1** : entre ~top:255 et top:320, hauteur ~65px
- **Séparateur horizontal doré 2** : ~top:320
- **InfoRow2** : entre ~top:325 et top:415, hauteur ~90px
- **Triangles noirs** : coins (haut-gauche, bas-droite) — non touchés

---

## Acceptance Criteria

1. **Badge réduit et repositionné** — `pZone.badge` passe de 100×100 à **68×68px**. Le badge est visuellement contenu dans le cercle doré du background. `pZone.badgeImage` passe à **68×68**. Le badge ne déborde pas et ne mange pas l'espace visuel de la carte.

2. **Nom/prénom aligné à droite** — `pZone.nameBlock` utilise `alignItems: 'flex-end'` (au lieu de `'center'`). `pZone.prenomText` et `pZone.nomText` ont `textAlign: 'right'`. La position verticale (`top`) est ajustée pour correspondre à la zone blanche du gabarit. Le texte ne dépasse jamais à droite (padding de sécurité `right: 10` conservé). La taille du nom est réduite à **17px** (au lieu de 20) pour absorber les noms longs sur 2 lignes maximum.

3. **InfoRow1 — labels alignés à la même hauteur** — `pZone.dateBlock` et `pZone.historiqueBlock` ont `alignItems: 'flex-start'` et `justifyContent: 'flex-start'`. La rangée `infoRow1` est positionnée à `bottom: 100` (ajustement depuis 95). Les labels "DATE DE NAISSANCE" et "HISTORIQUE" sont visuellement sur la même ligne horizontale. Les valeurs numériques sont sur la même ligne horizontale sous leurs labels respectifs. "Saison / Saisons" et "Stage / Stages" sont alignés sous leurs chiffres.

4. **InfoRow2 — ÉQUIPE/NIVEAU/CLUB remontés** — `pZone.infoRow2` est repositionné à `bottom: 8` avec `height: 80` et `alignItems: 'flex-start'` + `paddingTop: 6`. Les titres ÉQUIPE, NIVEAU, CLUB sont tous à la même hauteur. Les contenus (valeur texte, étoiles, logo) sont tous alignés visuellement sous leurs titres respectifs. Les étoiles `StarRating` et le logo `ClubLogo` ont la même hauteur effective (28px) pour assurer l'alignement horizontal.

5. **Position badge corrigée** — `pZone.badge` est positionné `top: 22, right: 12` pour centrer le badge image dans le cercle doré du JPEG. Le badge ne dépasse pas le bord de la carte.

6. **Position nom corrigée** — `pZone.nameBlock` est positionné `top: 170` (ajustement depuis 185) pour mieux correspondre à la zone blanche du gabarit entre la diagonale et le premier séparateur doré.

7. **Lisibilité premium conservée** — `pZone.prenomText` reste à `fontSize: 11`, `pZone.nomText` à `fontSize: 17` max (réduit depuis 20). Les `lineHeight` sont ajustés pour éviter le chevauchement (`nomText.lineHeight: 20`). Les couleurs, fontFamily et letterSpacing restent inchangés.

8. **Pas de régression** — Les filtres, search, pagination et navigation vers la fiche joueur fonctionnent comme avant. Le skeleton `PremiumSkeletonCard` reste à `width: 280, height: 420` sans modification.

9. **Vérification visuelle browser** — Sur Chrome DevTools à 1440px, les éléments de la carte correspondent visuellement au gabarit de référence :
   - Badge dans le cercle doré sans débordement
   - Nom/prénom aligné à droite dans la zone blanche
   - DATE DE NAISSANCE et HISTORIQUE labels à la même hauteur
   - ÉQUIPE / NIVEAU / CLUB visibles et non rognés en bas

---

## Tasks / Subtasks

- [x] **T1** — Corriger le badge (AC: #1, #5)
  - [x] `pZone.badge` : `width: 68, height: 68` (depuis 100×100) + `top: 22, right: 12` (depuis 20/18)
  - [x] `pZone.badgeImage` : `width: 68, height: 68`

- [x] **T2** — Corriger le bloc nom/prénom (AC: #2, #6, #7)
  - [x] `pZone.nameBlock` : `alignItems: 'flex-end'`, `top: 170` (depuis 185), `right: 10`
  - [x] `pZone.prenomText` : `fontSize: 11, textAlign: 'right'`
  - [x] `pZone.nomText` : `fontSize: 17, textAlign: 'right', lineHeight: 20` (depuis fontSize:20, lineHeight:24)

- [x] **T3** — Corriger infoRow1 (AC: #3)
  - [x] `pZone.infoRow1` : `bottom: 100` (depuis 95), `alignItems: 'flex-start'`, `paddingTop: 4`
  - [x] `pZone.dateBlock` : `justifyContent: 'flex-start'`
  - [x] `pZone.historiqueBlock` : `justifyContent: 'flex-start'`

- [x] **T4** — Corriger infoRow2 (AC: #4)
  - [x] `pZone.infoRow2` : `bottom: 8` (depuis 10), `height: 80` (depuis 70), `alignItems: 'flex-start'`, `paddingTop: 6`
  - [x] `pZone.equipeBlock`, `niveauBlock`, `clubBlock` : `justifyContent: 'flex-start'`
  - [x] `pZone.clubLogo` + `clubLogoFallback` : height 28px cohérent avec StarRating (fontSize:12) ✓

- [x] **T5** — Vérification visuelle Playwright (AC: #9)
  - [x] Naviguer sur `http://localhost:8083/children` à 1440px ✓
  - [x] Screenshot pris — badge réduit, nom à droite, labels alignés, infoRow2 visible ✓
  - [x] Badge dans le cercle doré, 68×68 confirmé par JS measurement ✓
  - [x] Alignement nom à droite (ABBENBROECK ADAM, ACKERMANN LLORIS, AENDEKERK SAM) ✓
  - [x] Labels DATE DE NAISSANCE / HISTORIQUE alignés à la même hauteur ✓
  - [x] Zone infoRow2 ÉQUIPE/NIVEAU/CLUB entièrement visible ✓

- [x] **T6** — Vérification fonctionnelle (AC: #8)
  - [x] Filtre "Nouveau" → "0 joueurs · 1 filtre actif" + bouton Réinitialiser ✓
  - [x] Réinitialiser → retour 678 joueurs ✓
  - [x] Clic carte ABBENBROECK Adam → navigation `/children/4546693f-...` ✓
  - [x] Aucune régression détectée

---

## Dev Notes

### Fichier unique à modifier

| Fichier | Section | Action |
|---|---|---|
| `aureak/apps/web/app/(admin)/children/index.tsx` | `pZone` StyleSheet (~ligne 547) | Modifier les valeurs numériques uniquement |

**Aucun autre fichier ne doit être touché.** La logique métier, les composants enfants (StarRating, ClubLogo, PremiumPhotoZone), et le skeleton `PremiumSkeletonCard` sont hors scope.

### Tableau des valeurs avant / après

| Propriété | Avant (25.5) | Après (25.6) | Raison |
|---|---|---|---|
| `badge.width/height` | 100 | 68 | Trop grand vs cercle du background |
| `badge.top` | 20 | 22 | Centrage dans le cercle |
| `badge.right` | 18 | 12 | Décalage visuel |
| `badgeImage.width/height` | 100 | 68 | Cohérent avec badge |
| `nameBlock.top` | 185 | 170 | Recalibrage après fix background 25.5 |
| `nameBlock.right` | 12 | 10 | Légère marge de sécurité bord droit |
| `nameBlock.alignItems` | `'center'` | `'flex-end'` | Alignement droit demandé |
| `nomText.fontSize` | 20 | 17 | Noms longs sans débordement |
| `nomText.lineHeight` | 24 | 20 | Proportionnel au fontSize |
| `prenomText.fontSize` | 13 | 11 | Hiérarchie visuelle |
| `infoRow1.bottom` | 95 | 100 | Alignement sur séparateur doré |
| `infoRow1.alignItems` | `'center'` | `'flex-start'` | Labels alignés en haut |
| `infoRow2.bottom` | 10 | 8 | Légère remontée |
| `infoRow2.height` | 70 | 80 | Plus d'espace pour les contenus |
| `infoRow2.alignItems` | `'center'` | `'flex-start'` | Titres alignés en haut |
| `infoRow2.paddingTop` | (absent) | 6 | Espace sous le séparateur doré |

### Rappel : structure des composants

```tsx
// children/index.tsx — composant PremiumJoueurCard
<Pressable style={pCard.container}>
  <PremiumPhotoZone />                    // z=0, ne pas toucher
  <Image source={CARD_BG} ... />          // z=1, ne pas toucher (fix 25.5)
  <View style={pZone.badge}>              // ← T1 : réduire badge
    <Image style={pZone.badgeImage} />
  </View>
  <View style={pZone.nameBlock}>          // ← T2 : aligner à droite
    <AureakText style={pZone.prenomText} />
    <AureakText style={pZone.nomText} />
  </View>
  <View style={pZone.infoRow1}>           // ← T3 : recalibrer
    <View style={pZone.dateBlock} />
    <View style={pZone.historiqueBlock} />
  </View>
  <View style={pZone.infoRow2}>           // ← T4 : remonter + aligner
    <View style={pZone.equipeBlock} />
    <View style={pZone.niveauBlock} />
    <View style={pZone.clubBlock} />
  </View>
</Pressable>
```

### Règle d'or : valeurs maintenables

- **Pas de positions magiques sans commentaire** — chaque valeur numérique doit avoir un commentaire expliquant le calcul ou la référence visuelle
- **Pas de positionnement pixel-perfect fragile** — préférer des valeurs arrondies cohérentes (multiples de 4 ou 5) qui restent stables
- **Vérifier avec Playwright** — ne jamais marquer `done` sans vérification browser

### Contexte Metro

Le serveur Metro (`http://localhost:8083`) doit être redémarré si le bundle JS cesse de se charger. Voir erreur passée : `Unable to resolve module ./index` → `Ctrl+C` puis `npx expo start --web` depuis `aureak/`.

### Patterns à respecter (architecture Aureak)

- Styles via `StyleSheet.create()` uniquement — pas de styles inline dans le JSX pour les composants de liste
- Pas de `!important`, pas de CSS direct — tout passe par StyleSheet RN
- `colors.*` depuis `@aureak/theme` pour toutes les couleurs
- `as never` sur les styles CSS web (boxShadow, textTransform, etc.) pour éviter les warnings TypeScript

### Références

- Background source : `aureak/apps/web/assets/cards/background-card.jpg` — 560×840px, CMYK, 115Ko
- Dimensions carte : `width: 280, height: 420` (Story 25.5)
- Gabarit visuel : `Cards Aureak - Joueur.jpg` (racine projet) + `Cards Aureak - Joueur modele.jpg`
- File to modify : `aureak/apps/web/app/(admin)/children/index.tsx` (StyleSheet `pZone`, ~ligne 547–680)
- Story précédente : `_bmad-output/implementation-artifacts/25-5-carte-joueur-premium-dimensions-background.md`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : Badge réduit 100×100 → 68×68px, repositionné `top:22 right:12`. Confirmé par JS measurement (getBoundingClientRect = 68×68).
- **T2** : Nom/prénom aligné à droite (`alignItems: flex-end`, `textAlign: right`). fontSize 20→17 pour les noms longs. `top: 185→170` pour recalibrage post-fix 25.5.
- **T3** : `infoRow1.bottom: 95→100`, `alignItems: center→flex-start` + `paddingTop: 4`. Labels DATE DE NAISSANCE et HISTORIQUE alignés à la même hauteur.
- **T4** : `infoRow2.bottom: 10→8`, `height: 70→80`, `alignItems: center→flex-start` + `paddingTop: 6`. ÉQUIPE/NIVEAU/CLUB entièrement visibles.
- **T5** : Vérification visuelle Playwright à 1440px — rendu fortement rapproché du gabarit de référence.
- **T6** : Filtres, navigation, reset confirmés sans régression.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — `pZone` StyleSheet : badge, nameBlock, prenomText, nomText, infoRow1, dateBlock, historiqueBlock, infoRow2, equipeBlock, niveauBlock, clubBlock)
