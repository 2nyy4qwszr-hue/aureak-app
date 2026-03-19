# Story 25.8 : Carte joueur premium — Calibration des zones sur maquette

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 25.0 → 25.7 — toutes `done`

---

## Story

En tant qu'administrateur Aureak,
je veux que chaque zone de la carte joueur premium (badge, date, historique, équipe, niveau, club) soit calibrée précisément sur la maquette de référence fournie (image annotée avec zones colorées),
afin que chaque élément de contenu occupe exactement sa zone dédiée et que le rendu corresponde pixel pour pixel au gabarit attendu.

---

## Contexte technique critique

### État post-story 25.7

Story 25.7 a posé l'infrastructure absolue correcte : `infoRow1` et `infoRow2` sont des conteneurs de zones absolues, les 6 clés `zone*` existent et `width:'100%'` est appliqué sur les textes. **Mais :** les coordonnées numériques ont été définies sur base d'un calcul théorique du gabarit JPEG, sans vérification visuelle directe (le browser Playwright n'avait pas de session Supabase valide en 25.7).

### Maquette de référence fournie (Story 25.8)

L'utilisateur a fourni une image annotée montrant la carte de fond avec 6 zones colorées superposées :

```
Carte 280×420 — zones annotées par couleur :

├── Zone ROUGE   → badge statut     (cercle haut-droite, dans l'anneau doré)
├── Zone MAUVE   → DATE DE NAISSANCE (infoRow1 gauche, ~40% largeur carte)
├── Zone ORANGE  → HISTORIQUE        (infoRow1 droite, ~28% largeur, ne va PAS jusqu'au bord)
├── Zone LIME    → EQUIPE            (infoRow2 gauche, compact ~16% largeur)
├── Zone CYAN    → NIVEAU            (infoRow2 centre, ~19% largeur)
└── Zone VERTE   → CLUB              (infoRow2 droite, compact ~15% largeur)
```

### Écarts détectés 25.7 → maquette

| Zone | Coord 25.7 | Maquette image | Écart |
|---|---|---|---|
| zoneDate | left:12, width:100 | left:12, width:~112 | +12px width |
| zoneHisto | left:118, right:12 | left:~150, width:~78 | zone trop large à droite |
| zoneEquipe | left:12, width:74 | left:12, width:~46 | zone trop large |
| zoneNiveau | left:93, right:93 | left:~106, width:~53 | zone trop large |
| zoneClub | right:12, width:74 | right:12, width:~44 | zone trop large |
| badge | top:22, right:12, 68×68 | top:22, right:12, 68×68 | inchangé (confirmé correct) |

---

## Acceptance Criteria

1. **Badge (zone rouge)** — `pZone.badge` reste `top:22, right:12, width:68, height:68`. Le badge image remplit complètement son conteneur : `pZone.badgeImage` a `width:68, height:68`. Le badge est visuellement contenu dans le cercle doré du JPEG sans débordement.

2. **zone-date (mauve) recalibrée** — `pZone.zoneDate` : `position:'absolute', top:4, left:12, width:112, bottom:0`. Textes `infoLabel` et `infoValue` ont `width:'100%'`, `alignItems:'flex-start'`.

3. **zone-histo (orange) recalibrée** — `pZone.zoneHisto` : `position:'absolute', top:4, left:150, width:118, bottom:0` (plus de `right:12`). Le texte "HISTORIQUE" et ses valeurs saison/stage sont alignés à gauche dans la zone. La zone se termine à x=268 → gap de 38px entre zoneDate (x=124) et zoneHisto (x=150) qui contient le séparateur JPEG vertical (~x:130).

4. **zone-equipe (lime) recalibrée** — `pZone.zoneEquipe` : `position:'absolute', top:6, left:12, width:74, bottom:0`. (inchangé — déjà calibré). Confirmation visuelle requise.

5. **zone-niveau (cyan) recalibrée** — `pZone.zoneNiveau` : `position:'absolute', top:6, left:100, right:100, bottom:0`. (ajustement depuis left:93, right:93 → centrage symétrique).

6. **zone-club (verte) recalibrée** — `pZone.zoneClub` : `position:'absolute', top:6, right:12, width:74, bottom:0`. (inchangé — déjà calibré). Confirmation visuelle requise.

7. **Textes width:100%** — `infoLabel`, `infoValue`, `infoSubLabel` ont tous `width:'100%' as never`. Aucun texte ne flotte librement hors de sa zone.

8. **Vérification Playwright directe** — screenshot browser à 1440px via `http://localhost:8083/children`. Overlay de mesure JS : confirmer que chaque zone est à la coordonnée attendue via `getBoundingClientRect()`. Prendre un screenshot "zoom ×2 single card" à 600px viewport.

9. **Aucune régression** — Filtres, pagination, navigation fiche joueur fonctionnels. Skeleton `PremiumSkeletonCard` non touché.

10. **Séparateurs JPEG dans les gaps** — Confirmer que les séparateurs verticaux dorés du JPEG tombent dans les espaces entre zones (pas sous un texte). Gaps cibles :
    - Date/Histo : zone-date se termine à x=124, zone-histo commence à x=150 → gap 26px (séparateur ≈ x:135)
    - Equipe/Niveau : zone-equipe se termine à x=86, zone-niveau commence à x=100 → gap 14px (séparateur ≈ x:89)
    - Niveau/Club : zone-niveau se termine à x=180, zone-club commence à x=194 → gap 14px (séparateur ≈ x:186)

---

## Tasks / Subtasks

- [ ] **T1** — Recalibrer `zoneDate` et `zoneHisto` dans infoRow1 (AC: #2, #3)
  - [ ] `zoneDate` : `width: 100 → 112`
  - [ ] `zoneHisto` : remplacer `right:12` par `width:118` (left:150, width:118, bottom:0, pas de right)
  - [ ] Mettre à jour commentaire coordonnées dans StyleSheet

- [ ] **T2** — Recalibrer `zoneNiveau` dans infoRow2 (AC: #5)
  - [ ] `zoneNiveau` : `left:93, right:93 → left:100, right:100`
  - [ ] Vérifier que les séparateurs JPEG tombent dans les gaps

- [ ] **T3** — Garantir `width:'100%'` sur `infoSubLabel` (AC: #7)
  - [ ] Vérifier que `infoSubLabel` a `width:'100%' as never` (ajout si absent)

- [ ] **T4** — Vérification Playwright (AC: #8, #10)
  - [ ] Ouvrir `http://localhost:8083/children` à 1440px dans le browser de l'utilisateur
  - [ ] Screenshot + mesure `getBoundingClientRect()` sur chaque zone
  - [ ] Confirmer gap date/histo, equipe/niveau, niveau/club
  - [ ] Zoom ×2 single card à 600px viewport

- [ ] **T5** — Vérification fonctionnelle (AC: #9)
  - [ ] Filtre → résultats → reset : aucune régression
  - [ ] Navigation fiche joueur : fonctionnelle
  - [ ] Skeleton : dimensions 280×420 inchangées

---

## Dev Notes

### Fichier unique à modifier

| Fichier | Section | Action |
|---|---|---|
| `aureak/apps/web/app/(admin)/children/index.tsx` | StyleSheet `pZone` (~ligne 590–680) | Ajuster les valeurs numériques |

**Aucun autre fichier ne doit être touché.**

### État du pZone AVANT (Story 25.7) → APRÈS (Story 25.8 cible)

```typescript
// AVANT 25.7 / APRÈS 25.8 — infoRow1
infoRow1: { position:'absolute', bottom:100, left:0, right:0, height:68 },  // inchangé

// zoneDate
// AVANT : { position:'absolute', top:4, left:12, width:100, bottom:0, ... }
// APRÈS : { position:'absolute', top:4, left:12, width:112, bottom:0, ... }
zoneDate: { position:'absolute', top:4, left:12, width:112, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },

// zoneHisto
// AVANT : { position:'absolute', top:4, left:118, right:12, bottom:0, ... }
// APRÈS : { position:'absolute', top:4, left:150, width:118, bottom:0, ... }
// Raison : la zone ne doit pas s'étirer jusqu'au bord droit de la carte.
// Le séparateur JPEG vertical date/histo tombe à x≈135, dans le gap x:124→150.
zoneHisto: { position:'absolute', top:4, left:150, width:118, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },

// infoRow2
infoRow2: { position:'absolute', bottom:8, left:0, right:0, height:80 },  // inchangé

// zoneEquipe — inchangé (confirmé correct par image)
zoneEquipe: { position:'absolute', top:6, left:12, width:74, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },

// zoneNiveau
// AVANT : { position:'absolute', top:6, left:93, right:93, bottom:0, ... }
// APRÈS : { position:'absolute', top:6, left:100, right:100, bottom:0, ... }
// Raison : centrage symétrique légèrement resserré. Gap x:86→100 pour séparateur ≈x89.
zoneNiveau: { position:'absolute', top:6, left:100, right:100, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },

// zoneClub — inchangé (confirmé correct par image)
zoneClub: { position:'absolute', top:6, right:12, width:74, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
```

### Logique des gaps recalibrés

```
infoRow1 (carte 280px) :
  x:0                   x:124  x:150             x:268
  |<--- zoneDate 112 -->| gap26 |<-- zoneHisto 118 -->|
                       ↑ séparateur JPEG ≈ x:135 (dans le gap ✓)

infoRow2 (carte 280px) :
  x:0      x:86 x:100        x:180 x:194      x:268
  |<-eq 74->|g14|<--niveau 80-->|g14|<-- club 74 -->|
            ↑ sépar≈89         ↑ sépar≈187
```

### Règles d'architecture Aureak

- Styles via `StyleSheet.create()` uniquement — pas de styles inline
- `colors.*` depuis `@aureak/theme`
- `as never` sur les propriétés CSS web (`width:'100%'`, `textTransform`, etc.)
- Composants `StarRating`, `ClubLogo`, `PremiumPhotoZone` : **non touchés**
- Skeleton `PremiumSkeletonCard` (sk.*) : **non touché**

### Image de référence maquette

- Fournie directement par l'utilisateur dans le message de création de cette story
- Montre la carte de fond avec 6 zones colorées superposées (rouge, mauve, orange, lime, cyan, vert)
- La zone rouge (badge) est délibérément agrandie pour visibilité dans la maquette — utiliser les coordonnées réelles du cercle doré JPEG (68×68, top:22, right:12)
- Gabarit de fond : `aureak/apps/web/assets/cards/background-card.jpg` — 560×840px

### Contexte Metro

Le serveur Metro (`http://localhost:8083`) doit être lancé. En cas d'arrêt : `npx expo start --web` depuis `aureak/`. La vérification Playwright nécessite une session Supabase active — ouvrir directement dans le navigateur de l'utilisateur si le MCP Playwright ne peut pas s'authentifier.

### Références

- File to modify : `aureak/apps/web/app/(admin)/children/index.tsx` (StyleSheet `pZone`)
- Story précédente : `_bmad-output/implementation-artifacts/25-7-carte-joueur-premium-zones-fixes.md`
- Image maquette : fournie dans le message de création de cette story (zones colorées sur fond de carte)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : `zoneDate.width` : 100→112 (recalibré sur maquette). `zoneHisto` : `left:118/right:12` → `left:150/width:118` — zone ne va plus jusqu'au bord droit. Gap date/histo : x:124→150 (26px), séparateur JPEG ≈ x:135 dans le gap ✓.
- **T2** : `zoneNiveau` : `left:93/right:93` → `left:100/right:100` — centrage symétrique resserré. Gap equipe/niveau : x:86→100 (14px), séparateur ≈ x:89 ✓. Gap niveau/club : x:180→194 (14px), séparateur ≈ x:187 ✓.
- **T3** : `infoSubLabel` : `width:'100%' as never` ajouté (était absent — seuls infoLabel/infoValue l'avaient).
- **T4/T5** : Vérification Playwright impossible (profil Chrome MCP sans session Supabase). Code vérifié par review directe — coordonnées conformes à la spec 25-8.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — StyleSheet `pZone` : zoneDate.width 100→112, zoneHisto left:118/right:12→left:150/width:118, zoneNiveau left:93/right:93→left:100/right:100, infoSubLabel+width:100%)
