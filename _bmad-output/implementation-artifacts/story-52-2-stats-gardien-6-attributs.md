# Story 52-2 — 6 stats gardien ligne basse PLO/TIR/TEC/TAC/PHY/MEN

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P1
**Dépend de** : story-52-1 (PlayerCard.tsx existant)

---

## Story

En tant qu'admin, je veux voir 6 attributs gardien affichés en ligne horizontale sur chaque PlayerCard, avec une valeur colorée selon la bande de performance, afin de comparer en un coup d'œil le profil technique de chaque gardien.

---

## Acceptance Criteria

1. **AC1 — 6 attributs fixes** : La zone basse de la card affiche exactement 6 colonnes verticales : `PLO` (Plongeon), `TIR` (Tir arrêté), `TEC` (Technique balle), `TAC` (Tactique), `PHY` (Physique), `MEN` (Mental). Chaque colonne = label 8px + valeur 12px bold.

2. **AC2 — Valeurs calculées** : En l'absence de table stats dédiée, les valeurs sont calculées depuis `JoueurListItem` :
   - Valeur par défaut : 50
   - `totalSaisons > 3` → +10 à PHY et MEN
   - `totalStages > 2` → +8 à TEC
   - `in_current_season = true` → +5 à TAC
   - La valeur finale est clampée entre 40 et 85
   - Le tier `Elite` exige que la moyenne des 6 > 70

3. **AC3 — Bandes de couleur** :
   - `>= 75` : vert `#22C55E`
   - `60–74` : or `#C1AC5C`
   - `< 60` : rouge `#EF4444`

4. **AC4 — Layout compact** : Les 6 colonnes tiennent dans la largeur 160px. Font family `fonts.mono` (Geist Mono) pour les valeurs numériques.

5. **AC5 — Tier Elite calculé** : Si la moyenne des 6 stats > 70 ET `totalSaisons >= 3`, la card passe au tier `Elite` (fond dégradé sombre + bordure or). Ce calcul se fait dans un helper `computePlayerTier(joueur: JoueurListItem): PlayerTier` exporté depuis `@aureak/business-logic`.

6. **AC6 — Tokens couleurs** : Les 3 couleurs bandes sont définies comme constantes nommées dans `@aureak/theme/tokens.ts` sous `gamification.statBands` — jamais hardcodées dans le composant.

---

## Tasks

- [x] **T1** — Ajouter dans `aureak/packages/theme/src/tokens.ts` :
  ```ts
  gamification: {
    // ... existant ...
    statBands: {
      high  : '#22C55E',  // >= 75
      medium: '#C1AC5C',  // 60-74
      low   : '#EF4444',  // < 60
    },
    statLabels: ['PLO', 'TIR', 'TEC', 'TAC', 'PHY', 'MEN'] as const,
  }
  ```

- [x] **T2** — Ajouter dans `aureak/packages/business-logic/src/` un fichier `playerStats.ts` :
  - `computePlayerStats(joueur: JoueurListItem): PlayerStats` — retourne `{ PLO, TIR, TEC, TAC, PHY, MEN }` (nombres 40–85)
  - `computePlayerTier(joueur: JoueurListItem): PlayerTier` — retourne `'Prospect' | 'Académicien' | 'Confirmé' | 'Elite'`
  - Exporter depuis `@aureak/business-logic/src/index.ts`

- [x] **T3** — Ajouter `PlayerTier` type dans `aureak/packages/types/src/enums.ts` :
  ```ts
  export type PlayerTier = 'Prospect' | 'Académicien' | 'Confirmé' | 'Elite'
  ```

- [x] **T4** — Modifier `aureak/packages/ui/src/PlayerCard.tsx` :
  - Importer `computePlayerStats`, `computePlayerTier` depuis `@aureak/business-logic`
  - Ajouter `<StatsRow stats={stats} tier={tier} />` composant interne en bas de la card (24px de hauteur)
  - Appliquer le fond tier `Elite` si `computePlayerTier` retourne `'Elite'`

- [x] **T5** — QA : grep `gamification.statBands` dans PlayerCard.tsx pour confirmer aucune couleur hardcodée

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/theme/src/tokens.ts` | Modifier — ajouter `statBands` + `statLabels` dans `gamification` |
| `aureak/packages/business-logic/src/playerStats.ts` | Créer |
| `aureak/packages/business-logic/src/index.ts` | Modifier — ajouter exports |
| `aureak/packages/types/src/enums.ts` | Modifier — ajouter `PlayerTier` |
| `aureak/packages/ui/src/PlayerCard.tsx` | Modifier — ajouter StatsRow |

---

## Notes techniques

- `JoueurListItem` doit exposer `totalSaisons`, `totalStages`, `in_current_season`. Vérifier dans `@aureak/api-client` que ces champs sont présents dans le mapping `listJoueurs()`.
- Le calcul est intentionnellement simple (proxy basé sur données existantes). La story 59-1 (future) créera une vraie table `player_stats` avec saisie manuelle par le coach.
- `PlayerTier` est distinct de `AcademyStatus` : c'est une couche UI gamifiée au-dessus du statut académie.
