# Story 25.5 : Carte joueur premium — Correction dimensions background

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 25.1 + 25.2 + 25.3 + 25.4 — toutes done

---

## Story

En tant qu'administrateur Aureak,
je veux que le background de la carte joueur s'affiche sans distorsion ni rognage avec les zones visuelles parfaitement alignées (badge, séparateurs dorés, triangles),
afin d'avoir un rendu premium fidèle au gabarit original quelle que soit la taille de l'écran.

---

## Contexte technique

Le background `background-card.jpg` est en 560×840px (ratio 2:3). La carte est définie avec `height: 420` mais une largeur fluide héritée du CSS grid (`auto-fill minmax(200px, 1fr)`).

Avec `resizeMode="cover"`, si la largeur de la carte ≠ 280px (largeur "naturelle" pour un fond 560×840 affiché en hauteur 420), l'image est mise à l'échelle et rognée :

- **Carte plus large que 280px** (cas courant) : l'image est mise à l'échelle pour remplir la largeur → sa hauteur affichée dépasse 420px → la partie basse (séparateurs horizontaux, zone ÉQUIPE/NIVEAU/CLUB) est rognée → les zones absolues (`bottom: 95`, `bottom: 10`) ne correspondent plus aux séparateurs visuels du background.
- **Carte plus étroite que 280px** : l'image est mise à l'échelle pour remplir la hauteur → les côtés sont rognés → les triangles de coins et le cercle badge sont partiellement coupés.

**Fix** : fixer la carte à `width: 280, height: 420` (ratio exact 2:3 = 560/840 à l'échelle 0.5×). À ces dimensions, `resizeMode="cover"` affiche le fond sans aucun rognage ni déformation. Adapter le grid en conséquence.

---

## Acceptance Criteria

1. **Dimensions carte fixes** — `pCard.container` a `width: 280` (en plus du `height: 420` existant). Le ratio 2:3 est ainsi identique à celui du background JPEG (560×840 × 0.5).
2. **Background sans rognage** — À `width: 280, height: 420`, `resizeMode="cover"` affiche le fond à l'échelle exacte 0.5×. Aucun pixel n'est rogné ni en haut/bas ni en gauche/droite. Les filets dorés verticaux et horizontaux, les triangles noirs et le cercle doré badge sont intégralement visibles.
3. **Zones absolues alignées** — Toutes les zones absolues (badge `top:20 right:18`, nom `top:185`, infoRow1 `bottom:95`, infoRow2 `bottom:10`) correspondent visuellement aux éléments dessinés dans le fond. Le badge tombe dans le cercle doré, les séparateurs horizontaux coincident avec les limites des zones d'info.
4. **Grid adapté** — Le CSS grid de la liste joueurs utilise `repeat(auto-fill, minmax(280px, 280px))` (colonnes fixes à 280px) au lieu de `minmax(200px, 1fr)`. Les cartes ne s'étirent plus horizontalement pour remplir l'espace disponible.
5. **Skeleton adapté** — `PremiumSkeletonCard` (inline dans `children/index.tsx`) reçoit également `width: 280` pour rester cohérent avec la carte réelle.
6. **Pas de régression filtres/pagination** — Les filtres, la recherche, la pagination et la navigation vers la fiche joueur fonctionnent comme avant.
7. **Vérification visuelle** — Sur Chrome DevTools à 1280px, 1440px et 1920px de largeur, les cartes s'affichent en colonnes entières (pas de colonne partielle), les backgrounds sont entiers et les zones sont alignées avec le gabarit de référence (`Cards Aureak - Joueur.jpg`).

---

## Tasks / Subtasks

- [x] **T1** — Fixer la largeur de la carte et le skeleton (AC: #1, #5)
  - [x] Dans `pCard.container` : ajout `width: 280` — ratio 2:3 exact avec background 560×840
  - [x] Dans `psk.container` (`PremiumSkeletonCard`) : ajout `width: 280`

- [x] **T2** — Adapter le CSS grid (AC: #4)
  - [x] `gridTemplateColumns` : `minmax(200px, 1fr)` → `repeat(auto-fill, minmax(280px, 280px))`
  - [x] `gap` : 10 → 16 (meilleure respiration visuelle entre cartes fixes)

- [x] **T3** — Vérification visuelle browser (AC: #2, #3, #7)
  - [x] `http://localhost:8083/children` chargée via Playwright
  - [x] 1280px : 3 colonnes, fond entier, badge dans le cercle doré, séparateurs alignés ✓
  - [x] 1440px : 3 colonnes, rendu identique ✓
  - [x] 1920px : 5 colonnes, proportions exactes, tous éléments visuels alignés ✓
  - [x] Aucune régression filtres/search/pagination confirmée

- [x] **T4** — Vérification fonctionnelle (AC: #6)
  - [x] Clic sur carte ALLESSANDRONI Marco → navigation vers `/children/c3b7901c-...` ✓
  - [x] Filtre "Nouveau" → "0 joueurs · 1 filtre actif", état actif or, bouton Réinitialiser ✓
  - [x] Pagination → : page 2 chargée (BERNY KYLIAN, BERTRAND...), 678 joueurs toujours affiché ✓

---

## Dev Notes

### Calcul dimensions

| Dimension | Valeur |
|---|---|
| Background source | 560 × 840 px |
| Facteur d'échelle | 0.5× |
| Carte cible | **280 × 420 px** |
| Ratio | 2:3 (width:height) |

Avec `width: 280, height: 420` et `resizeMode="cover"` sur un fond 560×840 :
- Scale pour remplir la largeur : 280/560 = **0.5** → hauteur rendue = 840 × 0.5 = **420** ✓
- Scale pour remplir la hauteur : 420/840 = **0.5** → largeur rendue = 560 × 0.5 = **280** ✓
- Les deux facteurs sont identiques → zéro rognage, zéro déformation.

### Grid CSS

```tsx
// Avant (fluide — carte s'étire)
gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10

// Après (fixe — carte reste à 280px)
gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))', gap: 16
```

**Gap 10→16** : avec des cartes fixes à 280px (plus larges que les anciennes ~200px), un gap de 10px était visuellement trop serré. 16px donne une respiration cohérente avec le design premium. Ce gap s'applique aussi à `s.gridFallback` (natif) pour cohérence web/native.

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/apps/web/app/(admin)/children/index.tsx` | `pCard.container` + `PremiumSkeletonCard` + CSS grid |

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : `width: 280` ajouté dans `pCard.container` et `psk.container`. Avec 280×420, le facteur d'échelle du fond 560×840 est identique dans les deux axes (0.5×) → zéro rognage, zéro déformation.
- **T2** : Grid `repeat(auto-fill, minmax(280px, 280px))` — colonnes fixes à 280px. Gap ajusté 10→16 pour meilleure respiration. Le `1fr` en max est supprimé : les cartes ne s'étirent plus, laissant l'espace restant vide en fin de ligne (comportement standard pour des cartes premium à dimensions fixes).
- **T3** : Vérification Playwright — 1280px (3 col), 1440px (3 col), 1920px (5 col). Background 100% visible sans rognage. Badge dans le cercle doré, séparateurs horizontaux alignés avec les zones absolues. Aucune régression détectée.
- **T4** : Navigation carte → fiche joueur ✓. Filtre statut "Nouveau" → état actif, résultat correct (0 joueurs). Pagination page 2 ✓.

### Code Review Notes

- **MEDIUM-1 — Gap web/mobile incohérent** : `s.gridFallback` avait `gap: 10` pendant que le CSS grid web utilisait `gap: 16`. Corrigé : `s.gridFallback` mis à `gap: 16` + commentaire explicatif ajouté (`children/index.tsx:1098`). Dev Notes mis à jour pour documenter la raison du gap 10→16.
- **LOW-1 — Screenshots Playwright en racine** : 6 fichiers PNG laissés après vérification browser (`children-1280.png`, etc.). Supprimés.
- **LOW-2 — Gap change non documenté** : Raison du passage gap 10→16 ajoutée dans Dev Notes section "Grid CSS".
- **LOW-3 — Status "done" prématuré** : La story avait été passée "done" après T1+T2 avec T3/T4 incomplètes. Corrigé via dev-story workflow (remis en-progress → review → done). Note de process : ne jamais marquer "done" avant que toutes les tâches `[x]` soient cochées.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — `pCard.container` + `psk.container` + CSS grid + fix `s.gridFallback` gap)
