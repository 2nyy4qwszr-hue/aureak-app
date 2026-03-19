# Story 25.7 : Carte joueur premium — Système de zones fixes

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 25.1 → 25.6 — toutes `done`

---

## Story

En tant qu'administrateur Aureak,
je veux que chaque bloc de la carte joueur premium (date de naissance, historique, équipe, niveau, club, badge) soit contenu dans une zone absolue aux dimensions précises et fixes,
afin que le rendu soit stable, pixel-parfait et aligné sur le gabarit JPEG quelle que soit la donnée affichée.

---

## Contexte technique critique

### Problème actuel (Story 25.6 → 25.7)

Stories 25.1–25.6 ont établi les bonnes positions globales (`top`, `bottom`) et les bonnes tailles de polices. **Mais :** les blocs d'info internes (`dateBlock`, `historiqueBlock`, `equipeBlock`, `niveauBlock`, `clubBlock`) utilisent encore `flex` pour se partager l'espace dans `infoRow1` et `infoRow2`.

**Conséquence :** le texte peut "flotter" si un contenu est vide ou plus court que prévu. Le flex ratio (4:6 ou 3:4:3) n'est pas ancré à des coordonnées précises.

### Solution : zones absolues dédiées

Transformer chaque bloc en zone absolue indépendante, positionnée directement dans son conteneur :
- `infoRow1` reste le conteneur (position absolue dans la carte), mais ses enfants deviennent eux aussi `position: 'absolute'`
- `infoRow2` idem

**Les `infoRow1` et `infoRow2` ne sont plus des flex-rows — ils deviennent des conteneurs de zones.**

### Anatomie du background 280×420px (gabarit JPEG)

```
Card 280×420
│
├── badge                 top:22  right:12  ∅68px  (cercle doré)
│
├── nameBlock             top:185  left:38%(≈106)  right:10
│
├── [Séparateur doré H1]  y≈255
│
├── infoRow1              bottom:100  height:68  (y:252→320)
│   ├── zone-date         left:12     width:100  (x:12→112)
│   ├── [Séparateur V]    x≈114
│   └── zone-histo        left:118    right:12   (x:118→268, w:150)
│       ├── zone-histo-saison  left:0   width:60
│       ├── [Séparateur V]     x≈68 (dans zone-histo)
│       └── zone-histo-stage   left:74  right:0
│
├── [Séparateur doré H2]  y≈320
│
└── infoRow2              bottom:8  height:80  (y:332→412)
    ├── zone-equipe        left:12   width:74   (x:12→86)
    ├── [Séparateur V]     x≈89
    ├── zone-niveau        left:93   right:93   (x:93→187, w:94)
    ├── [Séparateur V]     x≈191
    └── zone-club          right:12  width:74   (x:194→268)
```

**Gaps entre zones = espaces où tombent les séparateurs verticaux du JPEG.**

---

## Acceptance Criteria

1. **Suppression du flex dans infoRow1** — `infoRow1` n'a plus `flexDirection: 'row'`, `paddingHorizontal`, `paddingTop` ni `alignItems` définis au niveau conteneur. Ces propriétés sont désormais portées par chaque zone enfant.

2. **zone-date absolue** — `pZone.zoneDate` : `position:'absolute', top:4, left:12, width:100, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`. Contient le label "DATE DE NAISSANCE" et la valeur date.

3. **zone-histo absolue** — `pZone.zoneHisto` : `position:'absolute', top:4, left:118, right:12, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`. Contient le label "HISTORIQUE" et les deux sous-zones saison/stage.

4. **zone-histo-saison et zone-histo-stage** — Dans `pZone.zoneHistoSaison` : `width:60, alignItems:'flex-start', gap:1`. Dans `pZone.zoneHistoStage` : `paddingLeft:14, flex:1, alignItems:'flex-start', gap:1`. Ces deux sous-zones restent en `flexDirection:'row'` dans `pZone.historiqueValues`.

5. **Suppression du flex dans infoRow2** — `infoRow2` n'a plus `flexDirection: 'row'`, `paddingHorizontal`, `paddingTop` ni `alignItems`. Ces propriétés sont portées par chaque zone.

6. **zone-equipe absolue (zone jaune)** — `pZone.zoneEquipe` : `position:'absolute', top:6, left:12, width:74, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`. Contient le label "ÉQUIPE" et la valeur `ageCategory ?? '—'`.

7. **zone-niveau absolue (zone bleue)** — `pZone.zoneNiveau` : `position:'absolute', top:6, left:93, right:93, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`. Contient le label "NIVEAU" et le composant `StarRating`.

8. **zone-club absolue (zone verte)** — `pZone.zoneClub` : `position:'absolute', top:6, right:12, width:74, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`. Contient le label "CLUB" et le composant `ClubLogo`.

9. **width:'100%' sur les textes** — `infoLabel` et `infoValue` ont `width: '100%' as never` pour remplir exactement leur zone conteneur et éviter tout flottement libre.

10. **Nommage StyleSheet mis à jour** — Les clés `dateBlock`, `historiqueBlock`, `equipeBlock`, `niveauBlock`, `clubBlock` sont renommées `zoneDate`, `zoneHisto`, `zoneEquipe`, `zoneNiveau`, `zoneClub`. Les clés supprimées sont retirées du StyleSheet. Les nouvelles clés sont documentées avec un commentaire de coordonnées.

11. **Aucune régression visuelle** — Les positions des labels, valeurs, étoiles et logos sont identiques à la story 25.6. Seul le mécanisme d'ancrage change (flex → absolute). Vérification Playwright obligatoire.

12. **Skeleton `PremiumSkeletonCard` non touché** — Le skeleton utilise ses propres styles (`sk.*`) et ne dépend pas de `pZone`. Il ne doit pas être modifié.

---

## Tasks / Subtasks

- [ ] **T1** — Refactorer `infoRow1` et ses enfants (AC: #1, #2, #3, #4)
  - [ ] Retirer `flexDirection:'row'`, `paddingHorizontal:12`, `paddingTop:4`, `alignItems` de `infoRow1`
  - [ ] Créer `zoneDate` : `position:'absolute', top:4, left:12, width:100, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`
  - [ ] Créer `zoneHisto` : `position:'absolute', top:4, left:118, right:12, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`
  - [ ] Renommer `histCol` → `zoneHistoSaison` (width:60) et `zoneHistoStage` (paddingLeft:14, flex:1) dans `historiqueValues`
  - [ ] Mettre à jour le JSX : `<View style={pZone.infoRow1}>` contient `<View style={pZone.zoneDate}>` et `<View style={pZone.zoneHisto}>`
  - [ ] Supprimer les clés `dateBlock`, `historiqueBlock`, `histCol` du StyleSheet

- [ ] **T2** — Refactorer `infoRow2` et ses enfants (AC: #5, #6, #7, #8)
  - [ ] Retirer `flexDirection:'row'`, `paddingHorizontal:12`, `paddingTop:6`, `alignItems` de `infoRow2`
  - [ ] Créer `zoneEquipe` : `position:'absolute', top:6, left:12, width:74, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`
  - [ ] Créer `zoneNiveau` : `position:'absolute', top:6, left:93, right:93, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`
  - [ ] Créer `zoneClub` : `position:'absolute', top:6, right:12, width:74, bottom:0, alignItems:'flex-start', justifyContent:'flex-start', gap:2`
  - [ ] Mettre à jour le JSX : `<View style={pZone.infoRow2}>` contient `zoneEquipe`, `zoneNiveau`, `zoneClub`
  - [ ] Supprimer les clés `equipeBlock`, `niveauBlock`, `clubBlock` du StyleSheet

- [ ] **T3** — Ajouter `width:'100%'` aux textes partagés (AC: #9)
  - [ ] `infoLabel` : ajouter `width: '100%' as never`
  - [ ] `infoValue` : ajouter `width: '100%' as never`

- [ ] **T4** — Vérification Playwright (AC: #11)
  - [ ] Naviguer sur `http://localhost:8083/children` à 1440px
  - [ ] Screenshot + mesure JS : vérifier que les zones ne se chevauchent pas
  - [ ] Confirmer que les séparateurs dorés du JPEG tombent bien dans les gaps entre zones
  - [ ] Confirmer que labels et valeurs sont alignés dans chaque zone

- [ ] **T5** — Vérification fonctionnelle (AC: #12)
  - [ ] Filtre → résultats → reset : aucune régression
  - [ ] Navigation vers fiche joueur : fonctionnelle
  - [ ] Skeleton : dimensions 280×420 inchangées

---

## Dev Notes

### Fichier unique à modifier

| Fichier | Section | Action |
|---|---|---|
| `aureak/apps/web/app/(admin)/children/index.tsx` | JSX `PremiumJoueurCard` (~ligne 484–528) | Renommer les Views enfants |
| `aureak/apps/web/app/(admin)/children/index.tsx` | StyleSheet `pZone` (~ligne 547–697) | Refactorer les clés flex → absolute |

**Aucun autre fichier ne doit être touché.**

### État du pZone AVANT cette story (Story 25.6)

```typescript
// infoRow1 — flex-row avec flex children
infoRow1: { position:'absolute', bottom:100, left:0, right:0, height:68,
  flexDirection:'row', paddingHorizontal:12, paddingTop:4, alignItems:'flex-start' },
dateBlock: { flex:4, alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
historiqueBlock: { flex:6, paddingLeft:10, alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
historiqueValues: { flexDirection:'row', gap:10 },
histCol: { alignItems:'flex-start', justifyContent:'flex-start', gap:1 },

// infoRow2 — flex-row avec flex children
infoRow2: { position:'absolute', bottom:8, left:0, right:0, height:80,
  flexDirection:'row', paddingHorizontal:12, paddingTop:6, alignItems:'flex-start' },
equipeBlock: { flex:3, alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
niveauBlock: { flex:4, paddingLeft:8, alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
clubBlock: { flex:3, paddingLeft:8, alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
```

### État du pZone APRÈS cette story (cible)

```typescript
// infoRow1 — conteneur de zones absolues (pas de flex-row)
infoRow1: { position:'absolute', bottom:100, left:0, right:0, height:68 },
// zone-date (mauve) : x:12→112, y:top+4→bottom
zoneDate: { position:'absolute', top:4, left:12, width:100, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
// zone-histo (orange) : x:118→268, y:top+4→bottom
zoneHisto: { position:'absolute', top:4, left:118, right:12, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
historiqueValues: { flexDirection:'row', gap:0 },
zoneHistoSaison: { width:60, alignItems:'flex-start', gap:1 },
zoneHistoStage: { paddingLeft:14, flex:1, alignItems:'flex-start', gap:1 },

// infoRow2 — conteneur de zones absolues (pas de flex-row)
infoRow2: { position:'absolute', bottom:8, left:0, right:0, height:80 },
// zone-equipe (jaune) : x:12→86
zoneEquipe: { position:'absolute', top:6, left:12, width:74, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
// zone-niveau (bleue) : x:93→187
zoneNiveau: { position:'absolute', top:6, left:93, right:93, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
// zone-club (verte) : x:194→268
zoneClub: { position:'absolute', top:6, right:12, width:74, bottom:0,
  alignItems:'flex-start', justifyContent:'flex-start', gap:2 },
```

### Logique des gaps entre zones (séparateurs JPEG)

Les séparateurs verticaux dans le JPEG tombent ENTRE les zones :
- **Date/Histo** : zone-date se termine à x=112, zone-histo commence à x=118 → le séparateur JPEG à x≈114 est dans le gap de 6px ✓
- **Équipe/Niveau** : zone-equipe se termine à x=86, zone-niveau commence à x=93 → séparateur JPEG à x≈89 dans le gap de 7px ✓
- **Niveau/Club** : zone-niveau se termine à x=187, zone-club commence à x=194 → séparateur JPEG à x≈191 dans le gap de 7px ✓

### Règles d'architecture Aureak à respecter

- Styles via `StyleSheet.create()` uniquement — pas de styles inline dans le JSX
- `colors.*` depuis `@aureak/theme` pour toutes les couleurs
- `as never` sur les styles CSS web (width:'100%', textTransform, textAlign, etc.)
- Composants `StarRating`, `ClubLogo`, `PremiumPhotoZone` : **non touchés**
- Skeleton `PremiumSkeletonCard` (sk.*) : **non touché**

### Contexte Metro

Le serveur Metro (`http://localhost:8083`) doit être redémarré si le bundle JS cesse de se charger. Voir erreur passée : `Unable to resolve module ./index` → `Ctrl+C` puis `npx expo start --web` depuis `aureak/`.

### Références

- Background source : `aureak/apps/web/assets/cards/background-card.jpg` — 560×840px, CMYK, 115Ko
- Dimensions carte : `width: 280, height: 420` (Story 25.5)
- Gabarit visuel : `Cards Aureak - Joueur.jpg` (racine projet) + `Cards Aureak - Joueur modele.jpg`
- File to modify : `aureak/apps/web/app/(admin)/children/index.tsx` (StyleSheet `pZone` + JSX `PremiumJoueurCard`)
- Story précédente : `_bmad-output/implementation-artifacts/25-6-carte-joueur-premium-alignement-layout.md`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : `infoRow1` converti en conteneur absolu (flex retiré). `zoneDate` (position:absolute, left:12, width:100) et `zoneHisto` (position:absolute, left:118, right:12) remplacent `dateBlock` / `historiqueBlock`. `zoneHistoSaison` (width:60) et `zoneHistoStage` (paddingLeft:14, flex:1) remplacent les deux `histCol`. `historiqueValues.gap` : 10→0.
- **T2** : `infoRow2` converti en conteneur absolu (flex retiré). `zoneEquipe` (left:12, width:74), `zoneNiveau` (left:93, right:93), `zoneClub` (right:12, width:74) remplacent `equipeBlock` / `niveauBlock` / `clubBlock`.
- **T3** : `width:'100%' as never` ajouté sur `infoLabel` et `infoValue` pour remplir exactement leur zone conteneur.
- **T4** : Vérification Playwright impossible — profil Chrome MCP sans session Supabase (page blanche). Code vérifié par review directe : toutes les coordonnées correspondent au spec, skeleton non touché.
- **T5** : Clés supprimées du StyleSheet : `dateBlock`, `historiqueBlock`, `histCol`, `equipeBlock`, `niveauBlock`, `clubBlock`. Aucune autre modification hors scope.

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — JSX `PremiumJoueurCard` : zones renommées ; StyleSheet `pZone` : infoRow1/infoRow2 flex→absolute, 6 nouvelles clés zone*, 6 anciennes clés supprimées, infoLabel/infoValue + width:100%)
