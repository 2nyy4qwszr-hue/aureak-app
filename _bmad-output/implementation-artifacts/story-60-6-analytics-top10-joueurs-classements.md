# Story 60.6 : Analytics — Top 10 joueurs classements multiples

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux consulter des classements de joueurs (présence, progression, XP) avec flèches d'évolution hebdomadaire et mise en avant du podium top 3,
Afin de valoriser les meilleurs joueurs et motiver l'ensemble de l'académie.

## Acceptance Criteria

**AC1 — Section classements dans la page Progression**
- **Given** l'admin navigue vers `/analytics/progression`
- **When** la page se charge
- **Then** 3 onglets s'affichent : "Présence", "Progression", "XP" — chacun affichant un tableau de 10 joueurs

**AC2 — Podium top 3 visuellement mis en avant**
- **And** les 3 premiers joueurs ont un traitement visuel spécial : fond doré pour #1 (or gold), fond argenté pour #2 (gris clair), fond bronze pour #3 (#CD7F32)
- **And** une médaille emoji (🥇🥈🥉) ou icône SVG est affichée à gauche du rang

**AC3 — Flèche d'évolution hebdomadaire**
- **And** à côté du rang de chaque joueur, une flèche indique l'évolution par rapport à la semaine précédente : ▲ vert si monté, ▼ rouge si descendu, = gris si stable
- **And** le nombre de positions gagnées/perdues est affiché (ex. "▲3")

**AC4 — Données du tableau**
- **And** chaque ligne affiche : rang, nom du joueur, groupe, valeur de la métrique (% ou points), variation hebdomadaire
- **And** cliquer sur un joueur navigue vers `/children/[childId]`

**AC5 — API `getPlayerRankings`**
- **And** une fonction `getPlayerRankings(metric: RankingMetric, limit: number = 10, implantationId?: string)` existe dans `@aureak/api-client/src/analytics.ts`
- **And** elle retourne `PlayerRankingItem[]` avec `{ childId, displayName, groupName, value, rank, weeklyDelta }`

**AC6 — Sélecteur implantation**
- **And** un sélecteur "Toutes implantations" / par implantation filtre le classement
- **And** le classement se recharge avec skeleton à chaque changement

**AC7 — Skeleton et état vide**
- **And** pendant le chargement, 10 lignes skeleton s'affichent avec largeurs variées
- **And** si aucun joueur n'a de données pour la métrique, un empty state s'affiche : "Aucune donnée de [métrique] disponible"

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase 00121 : vue SQL rankings (AC: #5)
  - [ ] 1.1 Créer `supabase/migrations/00121_analytics_player_rankings_view.sql`
  - [ ] 1.2 Vue `v_player_attendance_ranking` : JOIN child_directory + sessions + attendances, AVG presence_rate, fenêtre LAG pour weekly_delta
  - [ ] 1.3 Vue `v_player_xp_ranking` : JOIN profiles + xp_ledger si disponible, sinon mock avec COUNT(evaluations)
  - [ ] 1.4 Activer RLS : accessible uniquement aux rôles admin et coach

- [ ] Task 2 — API `getPlayerRankings` (AC: #5, #6)
  - [ ] 2.1 Créer/modifier `@aureak/api-client/src/analytics.ts`
  - [ ] 2.2 `getPlayerRankings(metric, limit=10, implantationId?)` → query sur la vue appropriée
  - [ ] 2.3 Type `PlayerRankingItem` dans `@aureak/types/analytics.ts`

- [ ] Task 3 — Composant `RankingTable` (AC: #2, #3, #4)
  - [ ] 3.1 Créer `RankingTable.tsx` dans `analytics/progression/page.tsx` (composant local, pas dans @aureak/ui)
  - [ ] 3.2 Podium top 3 : fond coloré selon rang, icône médaille
  - [ ] 3.3 Flèche évolution : `weeklyDelta > 0` → ▲ vert, `< 0` → ▼ rouge, `=== 0` → = gris
  - [ ] 3.4 `onPress` → `router.push(\`/children/\${childId}\`)`

- [ ] Task 4 — Intégration dans `analytics/progression/page.tsx` (AC: #1, #6, #7)
  - [ ] 4.1 3 onglets avec state `activeMetric: RankingMetric`
  - [ ] 4.2 Sélecteur implantation
  - [ ] 4.3 Skeleton 10 lignes + empty state

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier try/finally sur les loaders
  - [ ] 5.2 Vérifier console guards dans analytics.ts

## Dev Notes

### Types TypeScript

```typescript
// @aureak/types/analytics.ts
export type RankingMetric = 'attendance' | 'progression' | 'xp'
export interface PlayerRankingItem {
  childId     : string
  displayName : string
  groupName   : string
  value       : number
  rank        : number
  weeklyDelta : number  // positif = monté, négatif = descendu
}
```

### Migration 00121 — vue ranking présence

```sql
CREATE OR REPLACE VIEW v_player_attendance_ranking AS
WITH ranked AS (
  SELECT
    cd.id             AS child_id,
    cd.display_name,
    g.name            AS group_name,
    ROUND(AVG(CASE WHEN a.status = 'present' THEN 100.0 ELSE 0 END), 1) AS attendance_rate,
    ROW_NUMBER() OVER (ORDER BY AVG(CASE WHEN a.status = 'present' THEN 100.0 ELSE 0 END) DESC) AS rank
  FROM child_directory cd
  JOIN group_members gm ON gm.child_id = cd.id
  JOIN groups g          ON g.id = gm.group_id
  JOIN sessions s        ON s.group_id = g.id
  JOIN attendances a     ON a.session_id = s.id AND a.child_id = cd.id
  WHERE cd.deleted_at IS NULL AND s.deleted_at IS NULL
  GROUP BY cd.id, cd.display_name, g.name
)
SELECT *, 0 AS weekly_delta FROM ranked;
-- weekly_delta : à enrichir via LAG sur window hebdomadaire dans une itération future
```

### Couleurs podium

```typescript
const PODIUM_COLORS = {
  1: colors.accent.gold,    // or
  2: '#C0C0C0',             // argent — constante locale SILVER
  3: '#CD7F32',             // bronze — constante locale BRONZE
}
```

## File List

- `supabase/migrations/00121_analytics_player_rankings_view.sql` — créer
- `aureak/packages/api-client/src/analytics.ts` — modifier (ajouter getPlayerRankings)
- `aureak/packages/types/src/analytics.ts` — modifier (ajouter RankingMetric, PlayerRankingItem)
- `aureak/apps/web/app/(admin)/analytics/progression/page.tsx` — modifier (implémenter classements)
