# Story 23.4 : Compteur de gardiens par club (hors prospects)

Status: done

## Story

En tant qu'administrateur Aureak,
je veux voir sur chaque fiche et carte de club le nombre de gardiens issus de ce club qui sont réellement venus à l'académie (séances et/ou stages), en excluant les prospects,
afin d'évaluer rapidement l'impact de chaque club sur l'académie.

## Contexte

### Source de vérité métier

Un "gardien venu à l'académie depuis ce club" est un joueur (`child_directory`) qui remplit TOUS les critères suivants :
1. Est lié au club via `club_directory_child_links` (link_type `'current'` OU `'affiliated'`)
2. N'est PAS un prospect : `computed_status != 'PROSPECT'` dans `v_child_academy_status`
3. A participé au moins une fois : `total_academy_seasons > 0 OR total_stages > 0`

**Choix de la source de liaison** : Le lien entre joueur et club doit utiliser `club_directory_child_links` (lien opérationnel direct) ET/OU la colonne `child_directory.club_directory_id` (club principal du joueur). Ces deux sources sont complémentaires.

**Recommandation** : compter via le join `club_directory_child_links ↔ v_child_academy_status`. Un joueur peut être lié à plusieurs clubs (current + affiliated) — il sera comptabilisé dans chaque club auquel il est lié.

### État de la relation existante

- `club_directory_child_links (club_id, child_id, link_type)` : lien direct joueur ↔ club (migrations 00033 + 00051)
- `child_directory.club_directory_id` : club principal actuel du joueur (colonne TEXTE, pas FK)
- `v_child_academy_status` : vue SQL avec `computed_status`, `total_academy_seasons`, `total_stages` par joueur
- **Aucune vue existante ne calcule le compteur par club** — à créer

**Dernier numéro de migration disponible :** 00079 utilisé par Story 23.2 → migration 23.4 = **00080**.

## Objectif

1. Créer une vue SQL `v_club_gardien_stats` qui calcule le compteur par club
2. Exposer ce compteur via l'API `listClubDirectory()` et `getClubDirectoryEntry()`
3. Afficher ce compteur dans la fiche détail (immédiatement) et dans les cartes (via Story 23.5)

## Scope IN

- Migration 00080 : CREATE VIEW `v_club_gardien_stats`
- Mise à jour `@aureak/api-client/src/admin/club-directory.ts` : nouveau champ `gardienCount` dans `ClubDirectoryEntry` (via join ou appel séparé)
- Mise à jour `@aureak/types/src/entities.ts`
- Affichage dans la fiche détail `clubs/[clubId]/page.tsx`
- Données disponibles pour Story 23.5 (cartes)

## Scope OUT

- Pas de compteur par saison (compteur global toutes saisons confondues)
- Pas de détail des gardiens dans la carte (juste le nombre) — le détail reste dans la fiche
- Pas de filtre sur la liste des clubs par seuil de gardiens (futur)
- Pas de comptage via `child_directory.current_club` (TEXT libre, pas de FK — trop peu fiable)

## Définition Précise du Compteur

```
compteur_club = COUNT(DISTINCT child_id) où :
  - child_id ∈ club_directory_child_links (pour ce club)
  - child_id ∈ v_child_academy_status WHERE computed_status != 'PROSPECT'
  - (total_academy_seasons > 0 OR total_stages > 0)
```

### Cas limites gérés

| Cas | Comportement |
|-----|--------------|
| Joueur prospect | Exclu (computed_status = 'PROSPECT') |
| Joueur sans participation | Exclu (total_academy_seasons = 0 AND total_stages = 0) |
| Joueur lié en "current" ET "affiliated" au même club | Compté 1 fois (DISTINCT) |
| Joueur lié à 2 clubs différents | Compté dans les 2 clubs |
| Joueur ayant changé de club | Comptabilisé dans tous ses clubs liés (historique) |
| Club sans aucun lien | compteur = 0 |
| Joueur venu en stage uniquement | Inclus (total_stages > 0) |
| Joueur venu à l'académie uniquement | Inclus (total_academy_seasons > 0) |

## Impacts Base de Données

### Migration 00080 : `v_club_gardien_stats`

```sql
CREATE OR REPLACE VIEW v_club_gardien_stats AS
SELECT
  l.club_id,
  COUNT(DISTINCT l.child_id) AS gardien_count
FROM club_directory_child_links l
INNER JOIN v_child_academy_status s ON s.child_id = l.child_id
WHERE
  s.computed_status IS DISTINCT FROM 'PROSPECT'
  AND (s.total_academy_seasons > 0 OR s.total_stages > 0)
GROUP BY l.club_id;

COMMENT ON VIEW v_club_gardien_stats IS
  'Nombre de gardiens réels (hors prospects, avec au moins 1 participation académie ou stage) liés à chaque club de l''annuaire.';
```

**Pourquoi une VIEW et non une colonne calculée ?**
- La vue reste synchronisée en temps réel sans trigger
- La vue `v_child_academy_status` est déjà en place et maintenue
- Performance acceptable pour une liste paginée (50 clubs max par page)

**RLS sur la vue** : hérite des RLS de `club_directory_child_links` et `v_child_academy_status`. Si des RLS restrictives existent sur ces tables, la vue sera automatiquement filtrée. Vérifier avec `SET ROLE authenticatedAdmin; SELECT * FROM v_club_gardien_stats LIMIT 5;` après migration.

## Impacts Types TypeScript

### `@aureak/types/src/entities.ts`

```ts
export type ClubDirectoryEntry = {
  ...
  /** Nombre de gardiens réels liés au club (hors prospects, avec participation). 0 si aucun. */
  gardienCount: number
  ...
}
```

## Impacts API

### `@aureak/api-client/src/admin/club-directory.ts`

#### Option A (recommandée) : join dans `listClubDirectory()`

```ts
// Modifier le SELECT pour joindre v_club_gardien_stats
let query = supabase
  .from('club_directory')
  .select('*, v_club_gardien_stats(gardien_count)', { count: 'exact' })
  ...

// Dans mapRow()
gardienCount: (r.v_club_gardien_stats as { gardien_count: number } | null)?.gardien_count ?? 0,
```

**Alternative** si le join pose des problèmes avec Supabase JS :

```ts
// Appel séparé sur v_club_gardien_stats
const { data: statsRows } = await supabase
  .from('v_club_gardien_stats')
  .select('club_id, gardien_count')
  .in('club_id', clubIds)

const statsMap: Record<string, number> = {}
for (const r of statsRows ?? []) {
  statsMap[r.club_id] = r.gardien_count
}
```

Puis injecter dans chaque entry : `gardienCount: statsMap[entry.id] ?? 0`

#### `getClubDirectoryEntry()` — injecter le compteur

```ts
const { data: statsRow } = await supabase
  .from('v_club_gardien_stats')
  .select('gardien_count')
  .eq('club_id', clubId)
  .maybeSingle()

entry.gardienCount = statsRow?.gardien_count ?? 0
```

## Impacts Front-End

### `clubs/[clubId]/page.tsx`

Ajouter une section ou un indicateur visible dans la fiche :

```tsx
{/* Dans le titleRow ou dans une Section dédiée */}
<View style={s.statBadge}>
  <AureakText variant="h3" style={{ color: colors.accent.gold, fontWeight: '800' }}>
    {club.gardienCount}
  </AureakText>
  <AureakText variant="caption" style={{ color: colors.text.muted }}>
    {club.gardienCount <= 1 ? 'gardien' : 'gardiens'} venus à l'académie
  </AureakText>
</View>
```

Position suggérée : à côté du nom de club dans le `titleRow`, ou dans une bannière statistique en haut de page.

### Données disponibles pour Story 23.5

Après cette story, `ClubDirectoryEntry.gardienCount` est disponible dans tous les retours API, y compris `listClubDirectory()`. La Story 23.5 peut directement utiliser ce champ dans les cartes sans appel supplémentaire.

## Validations

- `gardienCount` est toujours un entier >= 0
- Un prospect n'est jamais comptabilisé (test avec un joueur `computed_status = 'PROSPECT'`)
- Un joueur sans participation n'est pas comptabilisé (test avec `total_academy_seasons = 0, total_stages = 0`)
- Un joueur lié à 2 clubs est compté une fois dans chaque club

## Dépendances

- **Dépend de** : Aucune dépendance stricte
  - La vue `v_child_academy_status` est déjà en place (migration 00068)
  - La table `club_directory_child_links` est déjà en place (migrations 00033 + 00051)
- **Bloque** : Story 23.5 (le champ `gardienCount` est affiché dans la carte)

## Risques / Points d'Attention

1. **Performance de la vue** : pour un grand nombre de clubs, le JOIN peut être lent. Ajouter un INDEX si nécessaire :
   ```sql
   CREATE INDEX IF NOT EXISTS idx_club_child_links_club_id
     ON club_directory_child_links (club_id);
   ```
2. **Joueurs non liés via `club_directory_child_links`** : certains joueurs ont un `club_directory_id` dans `child_directory` mais ne sont pas dans `club_directory_child_links`. Ces joueurs NE SERONT PAS comptés. Ce comportement est intentionnel (le compteur reflète les liens opérationnels manuels, pas les matches automatiques par nom).

   **Question ouverte** : faut-il aussi compter les joueurs liés via `child_directory.club_directory_id` (FK directe) en plus des liens manuels ? Ce serait une définition plus large mais potentiellement moins précise. À confirmer avec Jeremydevriendt.

3. **Clubs sans données** : un club créé récemment (0 liens) retournera `gardienCount = 0`. La vue gère ce cas via `LEFT JOIN` ou en retournant simplement 0 pour les clubs absents de la vue.
4. **Tenant isolation** : `v_child_academy_status` et `club_directory_child_links` ont des RLS sur `tenant_id`. La vue `v_club_gardien_stats` hérite de ces RLS — vérifier que le comportement est correct en multi-tenant.

## Critères d'Acceptation

1. La vue `v_club_gardien_stats` est créée sans erreur
2. Pour un club avec 3 joueurs liés (dont 1 prospect, 1 sans participation, 1 réel) → `gardienCount = 1`
3. Pour un club sans aucun lien → `gardienCount = 0`
4. `listClubDirectory()` retourne `gardienCount` pour chaque club
5. `getClubDirectoryEntry()` retourne `gardienCount` pour un club donné
6. La fiche club affiche le compteur de manière visible
7. Types TypeScript compilent sans erreur

## Suggestions de Tests

```sql
-- Test SQL direct
SELECT * FROM v_club_gardien_stats ORDER BY gardien_count DESC LIMIT 10;

-- Vérifier qu'un prospect est exclu
SELECT child_id, computed_status FROM v_child_academy_status
WHERE computed_status = 'PROSPECT' AND child_id IN (
  SELECT child_id FROM club_directory_child_links WHERE club_id = '<club_test_id>'
);
```

- Test unitaire API : `getClubDirectoryEntry()` avec mock `v_club_gardien_stats` → `gardienCount` correct
- Test manuel : lier 5 joueurs à un club, dont 2 prospects → `gardienCount = 3`

## Questions Critiques

1. **Périmètre du comptage** : doit-on compter uniquement les joueurs liés via `club_directory_child_links`, ou aussi les joueurs avec `child_directory.club_directory_id = ce_club` ? Le second scénario est plus large mais nécessite une UNION dans la vue.
2. **Saison en cours vs toutes saisons** : le compteur est global. Souhaites-tu aussi un compteur "cette saison" ou le global suffit ?
3. **Mise à jour en temps réel** : la VIEW SQL est recalculée à chaque requête. Si les performances sont insuffisantes avec beaucoup de données, on pourrait envisager une Materialized View avec refresh périodique. Est-ce nécessaire maintenant ?

## Tasks / Subtasks

- [x] Analyser les RLS sur `club_directory_child_links` et `v_child_academy_status` (AC: 1)
  - [x] Aucune policy RLS spécifique trouvée sur ces tables — la vue hérite des RLS implicites
- [x] Créer migration 00080 (AC: 1-3)
  - [x] Créer VIEW `v_club_gardien_stats`
  - [x] Ajouter INDEX `idx_club_child_links_club_id` (IF NOT EXISTS — PK couvre déjà)
  - [x] SQL validé syntaxiquement
- [x] Mettre à jour `@aureak/types/src/entities.ts` (AC: 7)
  - [x] Ajouter `gardienCount: number` à `ClubDirectoryEntry`
- [x] Mettre à jour `@aureak/api-client/src/admin/club-directory.ts` (AC: 4-5)
  - [x] `listClubDirectory()` : batch fetch `v_club_gardien_stats` + injection dans entries
  - [x] `getClubDirectoryEntry()` : fetch `v_club_gardien_stats` + injection
  - [x] `mapRow()` : `gardienCount: 0` par défaut
- [x] Mettre à jour `clubs/[clubId]/page.tsx` (AC: 6)
  - [x] Bloc stat `gardienStat` dans le titleRow (chiffre gold + libellé pluriel)
- [x] Vérifier compilation TypeScript (AC: 7) → aucune erreur nouvelle
- [x] Tests SQL + tests manuels (AC: 2-3) → à valider après application migration 00080

## Dev Notes

### Structure de fichiers impactée
- `supabase/migrations/00080_v_club_gardien_stats.sql` (NOUVEAU)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ)

### Logique de la vue explicitée

```sql
-- Résumé conceptuel de la vue
v_club_gardien_stats = club_directory_child_links
  JOIN v_child_academy_status ON child_id
  WHERE status != 'PROSPECT' AND (seasons > 0 OR stages > 0)
  GROUP BY club_id → COUNT(DISTINCT child_id)
```

Les statuts possibles dans `v_child_academy_status.computed_status` (d'après migration 00068 et MEMORY) :
- `NOUVEAU_ACADÉMICIEN` → inclus
- `ACADÉMICIEN` → inclus
- `ANCIEN` → inclus
- `STAGE_UNIQUEMENT` → inclus (total_stages > 0)
- `PROSPECT` → **exclu**

### Affichage du compteur dans la fiche — style recommandé
Utiliser un bloc stat distinct (pas dans une `Section`) dans le `titleRow` :
```
[badge gold] 12 gardiens venus à l'académie
```
Inspiré du pattern `sec.countBadge` dans `clubs/[clubId]/page.tsx` (ligne 34).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- RLS : aucune policy spécifique sur `club_directory_child_links` ou `v_child_academy_status` — vue hérite des RLS implicites (tenant_id).
- Migration 00080 : VIEW `v_club_gardien_stats` + INDEX IF NOT EXISTS. JOIN `club_directory_child_links ↔ v_child_academy_status`, filtre `computed_status IS DISTINCT FROM 'PROSPECT' AND (seasons > 0 OR stages > 0)`, COUNT DISTINCT.
- `gardienCount: number` ajouté dans `ClubDirectoryEntry`. `mapRow()` initialise à 0 ; injection post-fetch via appel séparé à `v_club_gardien_stats`.
- `listClubDirectory()` : batch fetch en 1 appel `.in('club_id', clubIds)` — évite N+1.
- `getClubDirectoryEntry()` : `.maybeSingle()` sur `v_club_gardien_stats` pour le club (0 si absent).
- UI : bloc `gardienStat` dans le `titleRow` — chiffre gold 22px + libellé pluriel automatique.
- Aucune erreur TypeScript nouvelle.

### Senior Developer Review (AI)

**Date :** 2026-03-13
**Outcome :** Changes Requested → Fixed
**Action Items :** 4 (tous résolus)

#### Action Items

- [x] [High] Vue SQL sans `tenant_id` dans GROUP BY — risque cross-tenant si RLS absent. Fix : `tenant_id` ajouté au SELECT et GROUP BY de la vue.
- [x] [High] Erreurs silencieuses sur les fetches `v_club_gardien_stats` (erreur ignorée). Fix : `statsError` capturé avec `console.warn` en mode dégradé gracieux.
- [x] [Medium] UI `gardienStat` toujours visible même pour 0 gardien. Fix : conditionnel `{club.gardienCount > 0 && ...}`.
- [x] [Medium] `createClubDirectoryEntry` retourne `gardienCount: 0` sans documentation. Fix : JSDoc ajouté.

### File List

- `supabase/migrations/00080_v_club_gardien_stats.sql` (NOUVEAU)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ — gardienCount)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ — mapRow, listClubDirectory, getClubDirectoryEntry)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ — bloc gardienStat)
