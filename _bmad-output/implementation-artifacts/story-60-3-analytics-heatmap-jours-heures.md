# Story 60.3 : Analytics — Heatmap jours/heures séances

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir une heatmap 7 jours × 24h qui visualise la densité des séances par créneau horaire,
Afin d'identifier les créneaux surchargés, les plages disponibles et optimiser la planification.

## Acceptance Criteria

**AC1 — Heatmap présente dans la section Charge**
- **Given** l'admin navigue vers `/analytics/charge`
- **When** la page se charge
- **Then** une grille 7 colonnes (Lun–Dim) × 24 lignes (00h–23h) s'affiche, chaque cellule représentant un créneau d'1 heure

**AC2 — Couleur d'intensité basée sur le nombre de séances**
- **And** les cellules sont colorées en dégradé : 0 séance = fond neutre `colors.light.surface`, 1-2 = or clair `#F5E6C0`, 3-4 = or `colors.accent.gold`, 5+ = or foncé / ambre `#B45309`
- **And** l'intensité utilise une échelle relative au maximum observé sur la période filtrée

**AC3 — Hover tooltip avec détail**
- **And** au survol d'une cellule, un tooltip affiche : jour (ex. "Mercredi"), heure (ex. "14h00–15h00"), nombre de séances, liste des 3 premiers groupes concernés
- **And** le tooltip disparaît au mouvement de souris hors de la cellule

**AC4 — Filtres période**
- **And** un sélecteur de période permet de filtrer : "Ce mois", "3 derniers mois", "6 derniers mois", "Cette année"
- **And** la heatmap se recharge (avec skeleton) à chaque changement de filtre

**AC5 — Légende de densité**
- **And** une légende horizontale en bas de la grille affiche les 4 niveaux d'intensité avec leurs couleurs correspondantes et les seuils (0, 1-2, 3-4, 5+)

**AC6 — Heures de nuit masquées par défaut**
- **And** les heures 00h–06h et 22h–23h sont masquées par défaut avec un bouton "Afficher toutes les heures" pour les révéler
- **And** quand masquées, la grille affiche 07h–21h uniquement (15 lignes)

**AC7 — Composant réutilisable**
- **And** `HeatmapGrid` est exporté depuis `@aureak/ui` avec des props génériques `data: HeatmapCell[][]`

## Tasks / Subtasks

- [ ] Task 1 — API : agrégation sessions par jour/heure (AC: #1, #2, #4)
  - [ ] 1.1 Créer `getSessionHeatmap(implantationId?, period: HeatmapPeriod)` dans `@aureak/api-client/src/analytics.ts`
  - [ ] 1.2 Requête SQL : `SELECT EXTRACT(DOW FROM start_time) AS day, EXTRACT(HOUR FROM start_time) AS hour, COUNT(*) AS count, ARRAY_AGG(DISTINCT g.name) AS groups FROM sessions s JOIN groups g ON ... WHERE ... GROUP BY day, hour`
  - [ ] 1.3 Retourner `HeatmapData[][]` (7×24 matrix, zéros pour créneaux vides)

- [ ] Task 2 — Composant `HeatmapGrid.tsx` dans `@aureak/ui` (AC: #1, #2, #3, #5, #6)
  - [ ] 2.1 Props : `data: HeatmapCell[][]`, `rowLabels: string[]`, `colLabels: string[]`, `showAllHours?: boolean`
  - [ ] 2.2 Calculer la couleur de chaque cellule : `interpolateColor(count, 0, maxCount)`
  - [ ] 2.3 Rendre la grille avec `<div>` CSS Grid, chaque cellule = `<HeatmapCell>`
  - [ ] 2.4 Ajouter state hover pour tooltip positionné
  - [ ] 2.5 Toggle "Afficher toutes les heures" avec state `showAllHours`
  - [ ] 2.6 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 3 — Légende densité (AC: #5)
  - [ ] 3.1 `HeatmapLegend` inline dans `HeatmapGrid.tsx` — 4 carrés colorés + labels

- [ ] Task 4 — Intégration dans `analytics/charge/page.tsx` (AC: #4, #6)
  - [ ] 4.1 State `period: 'month' | '3months' | '6months' | 'year'`
  - [ ] 4.2 Sélecteur implantation (optionnel, "Toutes les implantations" par défaut)
  - [ ] 4.3 Skeleton loading pendant la requête

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier try/finally sur le loader
  - [ ] 5.2 Vérifier console guards

## Dev Notes

### Types TypeScript

```typescript
// @aureak/types/analytics.ts
export type HeatmapPeriod = 'month' | '3months' | '6months' | 'year'
export interface HeatmapCell { day: number; hour: number; count: number; groups: string[] }
```

### Interpolation couleur

```typescript
// Dans HeatmapGrid.tsx
function getCellColor(count: number, max: number): string {
  if (count === 0) return colors.light.surface
  const ratio = count / Math.max(max, 1)
  if (ratio < 0.3) return '#F5E6C0'
  if (ratio < 0.6) return colors.accent.goldLight
  if (ratio < 0.9) return colors.accent.gold
  return '#B45309'  // constante locale HEATMAP_HOT
}
```

### CSS Grid layout

```typescript
// Grille CSS : 1 colonne label + 7 colonnes jours
// 1 ligne label + 15 ou 24 lignes heures
gridTemplateColumns: `60px repeat(7, 1fr)`
gridTemplateRows: `32px repeat(${showAllHours ? 24 : 15}, 28px)`
```

### Notes QA
- `#F5E6C0` déclaré comme `HEATMAP_WARM`, `#B45309` comme `HEATMAP_HOT` — constantes locales en haut du fichier
- Zéro accès Supabase dans `HeatmapGrid.tsx`

## File List

- `aureak/packages/ui/src/HeatmapGrid.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export HeatmapGrid)
- `aureak/packages/api-client/src/analytics.ts` — modifier (ajouter getSessionHeatmap)
- `aureak/packages/types/src/analytics.ts` — modifier (ajouter HeatmapCell, HeatmapPeriod)
- `aureak/apps/web/app/(admin)/analytics/charge/page.tsx` — modifier (implémenter avec HeatmapGrid)
