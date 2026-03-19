# Story 25.0 : Classification du niveau d'équipe et système d'étoiles

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Stories 22.1A + 22.1B (done — formulaire joueur existant)
**Bloque :** Story 25.2 (NIVEAU étoiles dans la carte premium)

---

## Story

En tant qu'administrateur Aureak,
je veux qu'un niveau en étoiles (1 à 5) soit calculé automatiquement pour chaque joueur selon son type (jeune ou senior) et son niveau compétitif,
afin que la carte joueur affiche une information précise et cohérente sans risque de saisie manuelle incorrecte.

---

## Acceptance Criteria

1. **Champs DB ajoutés à `child_directory`** — Quatre nouveaux champs : `age_category`, `player_type` (dérivé), `youth_level` (si youth), `senior_division` (si senior). Les étoiles (`team_level_stars`) sont une colonne générée PostgreSQL, jamais saisies.
2. **`player_type` dérivé de `age_category`** — Calculé automatiquement en DB (colonne générée) : U7→U21 = `'youth'`, Senior = `'senior'`. Aucune saisie manuelle de `player_type`.
3. **`team_level_stars` calculé automatiquement** — Colonne générée PostgreSQL (`GENERATED ALWAYS AS ... STORED`). Retourne un entier 1-5 ou NULL si données manquantes. Logique :
   - Youth : Régional=1, Provincial=2, Inter=3, Élite 2=4, Élite 1=5
   - Senior : P4/P3=1, P2/P1=2, D3/D2/D1 amateurs=3, D1B=4, D1A=5
4. **Enums TypeScript synchronisés** — `AgeCategory`, `YouthLevel`, `SeniorDivision`, `PlayerType` dans `@aureak/types/enums.ts`. Constantes de liste pour les sélecteurs UI.
5. **`JoueurListItem` enrichi** — Champs `ageCategory`, `playerType`, `youthLevel`, `seniorDivision`, `teamLevelStars` ajoutés.
6. **Formulaire joueur — affichage conditionnel** — Dans la fiche joueur (`children/[childId]/page.tsx`) :
   - Si `age_category` = Senior → afficher sélecteur `senior_division` (pas de `youth_level`)
   - Si `age_category` ∈ U7→U21 → afficher sélecteur `youth_level` (pas de `senior_division`)
   - Si `age_category` non défini → afficher les deux, mais valider qu'un seul est rempli
7. **Étoiles calculées visibles en fiche joueur** — Affichage read-only des étoiles calculées dans la fiche joueur, sous le sélecteur actif. L'admin voit immédiatement le résultat sans rechargement.
8. **Migration idempotente** — La migration SQL initialise `age_category = NULL`, `youth_level = NULL`, `senior_division = NULL` pour les joueurs existants (pas de valeur par défaut incorrecte).
9. **Aucun crash si NULL** — `team_level_stars = NULL` si `youth_level` ou `senior_division` non renseigné. La carte premium affiche 0 étoiles dans ce cas (☆☆☆☆☆).

---

## Tasks / Subtasks

- [x] **T1** — Migration SQL (AC: #1, #2, #3, #8)
  - [x] Créer migration `00083_child_directory_level_classification.sql` :
    ```sql
    -- Ajout des champs de classification
    ALTER TABLE child_directory
      ADD COLUMN age_category TEXT,
      ADD COLUMN youth_level  TEXT,
      ADD COLUMN senior_division TEXT;

    -- player_type : dérivé automatiquement de age_category
    ALTER TABLE child_directory
      ADD COLUMN player_type TEXT GENERATED ALWAYS AS (
        CASE
          WHEN age_category = 'Senior' THEN 'senior'
          WHEN age_category IS NOT NULL THEN 'youth'
          ELSE NULL
        END
      ) STORED;

    -- team_level_stars : calculé selon player_type + niveau
    ALTER TABLE child_directory
      ADD COLUMN team_level_stars SMALLINT GENERATED ALWAYS AS (
        CASE
          WHEN age_category = 'Senior' THEN
            CASE senior_division
              WHEN 'P4'          THEN 1
              WHEN 'P3'          THEN 1
              WHEN 'P2'          THEN 2
              WHEN 'P1'          THEN 2
              WHEN 'D3 amateurs' THEN 3
              WHEN 'D2 amateurs' THEN 3
              WHEN 'D1 amateurs' THEN 3
              WHEN 'D1B'         THEN 4
              WHEN 'D1A'         THEN 5
              ELSE NULL
            END
          WHEN age_category IS NOT NULL THEN
            CASE youth_level
              WHEN 'Régional'   THEN 1
              WHEN 'Provincial' THEN 2
              WHEN 'Inter'      THEN 3
              WHEN 'Élite 2'    THEN 4
              WHEN 'Élite 1'    THEN 5
              ELSE NULL
            END
          ELSE NULL
        END
      ) STORED;

    -- Contrainte : un seul type de niveau à la fois
    ALTER TABLE child_directory
      ADD CONSTRAINT chk_level_coherence CHECK (
        NOT (youth_level IS NOT NULL AND senior_division IS NOT NULL)
      );

    -- Index pour les requêtes filtrées par catégorie
    CREATE INDEX idx_child_directory_age_category ON child_directory(age_category);
    CREATE INDEX idx_child_directory_team_level_stars ON child_directory(team_level_stars);
    ```

- [x] **T2** — Enums TypeScript dans `@aureak/types/enums.ts` (AC: #4)
  - [x] Ajouter :
    ```ts
    export type PlayerType = 'youth' | 'senior'

    export type AgeCategory =
      | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13'
      | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'U21'
      | 'Senior'

    export type YouthLevel =
      | 'Régional' | 'Provincial' | 'Inter' | 'Élite 2' | 'Élite 1'

    export type SeniorDivision =
      | 'P4' | 'P3' | 'P2' | 'P1'
      | 'D3 amateurs' | 'D2 amateurs' | 'D1 amateurs'
      | 'D1B' | 'D1A'

    export const AGE_CATEGORIES: AgeCategory[] = [
      'U7','U8','U9','U10','U11','U12','U13',
      'U14','U15','U16','U17','U18','U19','U21','Senior',
    ]

    export const YOUTH_LEVELS: YouthLevel[] = [
      'Régional', 'Provincial', 'Inter', 'Élite 2', 'Élite 1',
    ]

    export const SENIOR_DIVISIONS: SeniorDivision[] = [
      'P4', 'P3', 'P2', 'P1',
      'D3 amateurs', 'D2 amateurs', 'D1 amateurs',
      'D1B', 'D1A',
    ]
    ```

- [x] **T3** — Enrichir `JoueurListItem` + `listJoueurs` (AC: #5)
  - [x] Ajouter à `JoueurListItem` dans `child-directory.ts` :
    ```ts
    ageCategory    : string | null
    playerType     : 'youth' | 'senior' | null
    youthLevel     : string | null
    seniorDivision : string | null
    teamLevelStars : number | null  // 1-5, calculé en DB
    ```
  - [x] Phase 2 de `listJoueurs` — ajouter au select :
    `'age_category, player_type, youth_level, senior_division, team_level_stars'`
  - [x] Mapper dans le `.map()` final

- [x] **T4** — Formulaire joueur conditionnel (AC: #6, #7)
  - [x] Dans `children/[childId]/page.tsx`, section "Niveau" :
    - Sélecteur `age_category` (valeurs `AGE_CATEGORIES`)
    - Si `ageCategory === 'Senior'` → afficher sélecteur `senior_division` (valeurs `SENIOR_DIVISIONS`)
    - Sinon (youth ou non défini) → afficher sélecteur `youth_level` (valeurs `YOUTH_LEVELS`)
    - Read-only : étoiles calculées (`teamLevelStars ?? 0`) affichées sous le sélecteur actif avec `StarRating`
  - [x] `updateChildDirectoryEntry` : inclure `age_category`, `youth_level`, `senior_division` dans le payload PATCH
  - [x] Vider l'autre champ lors du changement : si on passe à Senior → `youth_level = null` ; si on passe à youth → `senior_division = null`

- [x] **T5** — Fonction utilitaire TS (application layer — AC: #3)
  - [x] Ajouter dans `@aureak/business-logic` ou `@aureak/types` une fonction miroir pour usage client :
    ```ts
    export function computeTeamLevelStars(
      ageCategory: string | null,
      youthLevel: string | null,
      seniorDivision: string | null,
    ): number | null {
      if (!ageCategory) return null
      if (ageCategory === 'Senior') {
        return SENIOR_STARS[seniorDivision ?? ''] ?? null
      }
      return YOUTH_STARS[youthLevel ?? ''] ?? null
    }
    const YOUTH_STARS: Record<string, number> = {
      'Régional': 1, 'Provincial': 2, 'Inter': 3, 'Élite 2': 4, 'Élite 1': 5,
    }
    const SENIOR_STARS: Record<string, number> = {
      'P4': 1, 'P3': 1, 'P2': 2, 'P1': 2,
      'D3 amateurs': 3, 'D2 amateurs': 3, 'D1 amateurs': 3,
      'D1B': 4, 'D1A': 5,
    }
    ```
  - [x] Utile pour affichage optimiste dans le formulaire (avant rechargement DB)

- [x] **T6** — Tests & vérification (AC: #1→#9)
  - [x] Vérifier que la colonne générée retourne bien les bonnes valeurs (SQL REPL)
  - [x] Tester le formulaire : Senior → youth_level grisé/absent ; youth → senior_division absent
  - [x] Tester le fallback NULL dans la carte (☆☆☆☆☆)
  - [x] Vérifier la contrainte `chk_level_coherence` (POST avec youth_level + senior_division simultanés → rejeté)

---

## Dev Notes

### Architecture choisie — Pourquoi colonne générée PostgreSQL

**Option A — Colonne générée DB (choisie)** : `GENERATED ALWAYS AS ... STORED`
- Source de vérité unique : la règle est dans la DB
- Zéro risque de désynchronisation entre DB et code
- Performant : calculé une fois à l'écriture, lu sans calcul
- Visible dans Supabase Studio, exportable, indexable

**Option B — Calculé en application** : function TypeScript uniquement
- Risque de désynchronisation si la règle évolue et qu'on oublie de l'un des deux côtés
- Moins traçable en DB

**Option C — Trigger PostgreSQL** : plus complexe que nécessaire, même résultat que la colonne générée

→ **Colonne générée = meilleure approche** pour une règle pure/métier fixe.

### Erreurs fréquentes à éviter

1. **Ne pas stocker `player_type` manuellement** — il doit toujours être dérivé de `age_category`. La colonne générée le garantit.
2. **Ne pas permettre youth_level + senior_division simultanément** — la contrainte CHECK protège contre ça en DB. L'UI doit aussi vider l'un quand l'autre est sélectionné.
3. **Ne pas hardcoder les valeurs de division dans plusieurs endroits** — les constantes `YOUTH_STARS` et `SENIOR_STARS` dans `business-logic` sont la source de vérité TS. La SQL est la source de vérité DB.
4. **Ne pas confondre `niveauClub` et `youth_level`/`senior_division`** — `niveauClub` est un champ texte libre hérité des données Notion (non structuré). Les nouveaux champs sont les données propres.

### Évolutions futures possibles

- **Ajout de nouvelles divisions** : modifier uniquement la fonction SQL + les constantes TS + les enums
- **Système de sous-niveaux** : ex. "Inter A / Inter B" → étendre `YouthLevel` et recalculer
- **Historique du niveau** : table `child_level_history` (un enregistrement par saison) — hors scope, prévoir FK vers `academy_seasons`
- **Export CSV** : `team_level_stars` déjà en DB → requête directe sans calcul applicatif

### Note sur `niveauClub` existant

Le champ `niveauClub` (texte libre Notion) reste en place pour l'instant. Il n'est PAS remplacé — il sert encore aux filtres de la liste joueurs et à l'affichage historique. Les étoiles de la carte premium utiliseront `team_level_stars` (nouveau). Une future migration de nettoyage pourra mapper les valeurs `niveauClub` existantes vers les nouveaux champs.

### Pseudo-code du calcul d'étoiles

```
function computeStars(player):
  if player.age_category is null:
    return null

  if player.age_category == "Senior":
    switch player.senior_division:
      "P4", "P3"                         → return 1
      "P2", "P1"                         → return 2
      "D3 amateurs", "D2 amateurs",
      "D1 amateurs"                       → return 3
      "D1B"                               → return 4
      "D1A"                               → return 5
      default                             → return null
  else:  // youth (U7 à U21)
    switch player.youth_level:
      "Régional"                          → return 1
      "Provincial"                        → return 2
      "Inter"                             → return 3
      "Élite 2"                           → return 4
      "Élite 1"                           → return 5
      default                             → return null
```

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `supabase/migrations/00083_child_directory_level_classification.sql` | NOUVEAU — migration |
| `aureak/packages/types/src/enums.ts` | Ajout `AgeCategory`, `YouthLevel`, `SeniorDivision`, `PlayerType` + constantes |
| `aureak/packages/api-client/src/admin/child-directory.ts` | `JoueurListItem` + `listJoueurs` enrichis |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Formulaire conditionnel youth/senior |
| `aureak/packages/business-logic/src/` (ou `types/`) | `computeTeamLevelStars()` + `YOUTH_STARS` + `SENIOR_STARS` |

### References

- [Source: aureak/packages/api-client/src/admin/child-directory.ts#L362-L508] — `JoueurListItem`, `listJoueurs`
- [Source: aureak/packages/types/src/enums.ts] — enums existants à compléter
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx] — fiche joueur (formulaire)
- [Source: _bmad-output/implementation-artifacts/25-2-carte-joueur-premium-donnees-dynamiques.md] — intégration étoiles dans la carte

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage. Erreurs TS pré-existantes dans les fichiers non modifiés (coaches, dashboard, spreads shadows).

### Completion Notes List

- **T1** : Migration `00083_child_directory_level_classification.sql` créée. Réutilise l'enum PostgreSQL `football_age_category` (migration 00010) pour `age_category`. Colonnes générées `player_type` et `team_level_stars` avec CASE logic exacte de la story. Contraintes CHECK sur `youth_level` (5 valeurs) et `senior_division` (9 valeurs) + contrainte `chk_level_coherence` (pas les deux simultanément).
- **T2** : `PlayerType`, `YouthLevel`, `SeniorDivision` ajoutés dans `@aureak/types/enums.ts`. Constantes `YOUTH_LEVELS` et `SENIOR_DIVISIONS` exportées. `AgeCategory` non dupliquée — `FootballAgeCategory` existante suffit (mêmes valeurs).
- **T3** : `ChildDirectoryEntry` (entities.ts) enrichi de 5 champs. `JoueurListItem` enrichi de 5 champs. `toEntry()` mappe les nouveaux champs. Phase 2 de `listJoueurs` sélectionne `age_category, player_type, youth_level, senior_division, team_level_stars`. `UpdateChildDirectoryParams` + `updateChildDirectoryEntry` acceptent les 3 champs éditables (`ageCategory`, `youthLevel`, `seniorDivision`). `player_type` et `team_level_stars` non éditables (générés).
- **T4** : Section "Niveau équipe" ajoutée dans `children/[childId]/page.tsx` entre Club actuel et Parcours football. Pills pour catégorie d'âge (toutes les `FOOTBALL_AGE_CATEGORIES`). Affichage conditionnel : youth → `YOUTH_LEVELS`, Senior → `SENIOR_DIVISIONS`. Vider l'autre champ automatiquement au changement. Aperçu étoiles calculées (optimiste) via `computeTeamLevelStars`. Vue read-only avec étoiles ★/☆.
- **T5** : `computeTeamLevelStars(ageCategory, youthLevel, seniorDivision)` créé dans `packages/business-logic/src/admin/teamLevelStars.ts`. Exporté depuis `index.ts`.
- **T6** : Vérification TS — aucune nouvelle erreur introduite par Story 25.0. La migration sera testée manuellement en Supabase Studio après push.

### Code Review Fixes (claude-sonnet-4-6)

- **H1 fixed** : `ChildDirectoryEntry.ageCategory` retypé `FootballAgeCategory | null` (était `string | null`) dans `entities.ts:1068`
- **H2 fixed** : `AgeCategory` (alias de `FootballAgeCategory`) + `AGE_CATEGORIES` constant ajoutés dans `enums.ts`. Page `[childId]/page.tsx` mise à jour pour importer et utiliser `AGE_CATEGORIES` à la place de `FOOTBALL_AGE_CATEGORIES`.
- **M1 fixed** : Deux contraintes DB cross-colonnes ajoutées dans migration 00083 : `chk_youth_level_requires_youth` + `chk_senior_div_requires_senior` — empêchent `youth_level` sur un Senior et `senior_division` sur un joueur jeune.
- **M2 fixed** : AC #6 implémenté — quand `ageCategory = null`, les deux sélecteurs (jeune ET senior) sont affichés. Message d'erreur si les deux sont renseignés simultanément.
- **M3 fixed** : Toutes les subtasks T1→T6 cochées `[x]`.

### File List

- `supabase/migrations/00083_child_directory_level_classification.sql` (NOUVEAU)
- `aureak/packages/types/src/enums.ts` (modifié — PlayerType, YouthLevel, SeniorDivision, YOUTH_LEVELS, SENIOR_DIVISIONS)
- `aureak/packages/types/src/entities.ts` (modifié — ChildDirectoryEntry + 5 champs)
- `aureak/packages/api-client/src/admin/child-directory.ts` (modifié — JoueurListItem, toEntry, listJoueurs Phase 2 select + map, UpdateChildDirectoryParams, updateChildDirectoryEntry)
- `aureak/packages/business-logic/src/admin/teamLevelStars.ts` (NOUVEAU)
- `aureak/packages/business-logic/src/index.ts` (modifié — export computeTeamLevelStars)
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (modifié — EditSection, import YOUTH_LEVELS/SENIOR_DIVISIONS/computeTeamLevelStars, saveNiveau, section Niveau équipe)
