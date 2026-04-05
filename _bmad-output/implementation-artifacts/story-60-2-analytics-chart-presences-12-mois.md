# Story 60.2 : Analytics — Chart présences 12 mois multi-groupes

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un graphique linéaire affichant le taux de présence sur les 12 derniers mois, avec une ligne par groupe,
Afin d'identifier les tendances et comparer la régularité des groupes dans le temps.

## Acceptance Criteria

**AC1 — Section présences dans Stats Room**
- **Given** l'admin navigue vers `/analytics/presences`
- **When** la page se charge
- **Then** un titre "Présences — 12 derniers mois" s'affiche avec un sélecteur d'implantation

**AC2 — Line chart SVG pur rendu**
- **And** un composant `LineChart` SVG pur (sans librairie externe) affiche une courbe par groupe actif de l'implantation sélectionnée
- **And** l'axe X = 12 mois (Jan → Déc ou glissant), l'axe Y = taux de présence 0–100%
- **And** chaque ligne a une couleur distincte tirée d'une palette de 8 couleurs (or, vert, bleu, rose, violet, orange, cyan, rouge)

**AC3 — Légende colorée**
- **And** une légende s'affiche sous le chart : pastille couleur + nom du groupe pour chaque ligne
- **And** cliquer sur un item de légende toggle la visibilité de la ligne correspondante

**AC4 — Hover tooltip**
- **And** au survol d'un point sur une ligne, un tooltip s'affiche avec : mois (format "Avr 2026"), nom du groupe, taux de présence en %, nombre de séances
- **And** le tooltip suit le curseur horizontalement (axe X) et affiche toutes les lignes pour ce mois

**AC5 — État vide et loading**
- **And** si aucune séance n'existe sur la période, un `EmptyState` s'affiche : "Aucune donnée de présence sur cette période"
- **And** pendant le chargement, un skeleton de la forme du chart s'affiche (rectangle gris animé)

**AC6 — Responsive**
- **And** le chart se redimensionne à la largeur de son container (`viewBox` dynamique via `ResizeObserver` ou container query)
- **And** sur mobile (< 768px) l'axe X n'affiche que les mois impairs pour éviter la collision

**AC7 — Composant réutilisable dans @aureak/ui**
- **And** `LineChart` est exporté depuis `@aureak/ui` et peut être réutilisé dans d'autres pages

## Tasks / Subtasks

- [ ] Task 1 — API : requête présences agrégées par groupe/mois (AC: #1, #2)
  - [ ] 1.1 Créer `getAttendanceByGroupMonth(implantationId, months=12)` dans `@aureak/api-client/src/analytics.ts`
  - [ ] 1.2 Requête SQL : `SELECT group_id, DATE_TRUNC('month', session_date) AS month, COUNT(*) sessions, AVG(presence_rate) rate FROM sessions JOIN attendances ... GROUP BY group_id, month`
  - [ ] 1.3 Retourner type `AttendanceMonthlyData[]` avec `{ groupId, groupName, month: string, rate: number, sessionCount: number }`

- [ ] Task 2 — Composant `LineChart.tsx` dans `@aureak/ui` (AC: #2, #3, #4, #6)
  - [ ] 2.1 Props : `data: LineChartSeries[]`, `width?: number`, `height?: number`, `onHover?: (month, values) => void`
  - [ ] 2.2 Calculer les points SVG depuis les données normalisées (0–100 → height SVG)
  - [ ] 2.3 Rendre les `<polyline>` SVG pour chaque série avec `strokeWidth=2`, `fill=none`
  - [ ] 2.4 Rendre axes X et Y avec labels, `<line>` gris tiretées pour la grille
  - [ ] 2.5 Ajouter le handler hover sur une zone invisible `<rect>` par colonne mois
  - [ ] 2.6 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 3 — Composant `ChartLegend` (AC: #3)
  - [ ] 3.1 Afficher pastilles + noms avec toggle visibilité (state local `hiddenSeries: Set<string>`)

- [ ] Task 4 — Tooltip hover (AC: #4)
  - [ ] 4.1 State `hoverMonth: string | null` + `hoverX: number`
  - [ ] 4.2 Rendu conditionnel d'un `<div>` positionné absolument avec les valeurs du mois survolé

- [ ] Task 5 — Intégration dans `analytics/presences/page.tsx` (AC: #1, #5, #6)
  - [ ] 5.1 Charger les données via `getAttendanceByGroupMonth`
  - [ ] 5.2 Sélecteur implantation au-dessus du chart
  - [ ] 5.3 Gérer état loading + empty state

- [ ] Task 6 — QA scan
  - [ ] 6.1 Vérifier try/finally sur le loader
  - [ ] 6.2 Vérifier console guards

## Dev Notes

### Types TypeScript

```typescript
// @aureak/types/analytics.ts
export interface LineChartPoint { month: string; value: number; meta?: Record<string, unknown> }
export interface LineChartSeries { id: string; label: string; color: string; points: LineChartPoint[] }
export interface AttendanceMonthlyData {
  groupId: string; groupName: string; month: string; rate: number; sessionCount: number
}
```

### Palette couleurs séries

```typescript
// Déclaré en constante dans LineChart.tsx ou @aureak/theme
const SERIES_COLORS = [
  colors.accent.gold,       // or
  colors.status.success,    // vert
  '#3B82F6',                // bleu
  '#EC4899',                // rose
  '#8B5CF6',                // violet
  '#F59E0B',                // ambre
  '#06B6D4',                // cyan
  colors.accent.red,        // rouge
]
```

### Pas de dépendance externe
Le SVG est rendu manuellement — pas de recharts, victory-native, ou d3 pour garder le bundle minimal.

### Notes QA
- `LineChart` dans `@aureak/ui` : zéro accès Supabase, purement présentationnel
- API dans `@aureak/api-client/src/analytics.ts` : nouveau fichier, exports nommés uniquement
- Console guard dans `analytics.ts` : `if (process.env.NODE_ENV !== 'production') console.error(...)`

## File List

- `aureak/packages/ui/src/LineChart.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export LineChart)
- `aureak/packages/api-client/src/analytics.ts` — créer (getAttendanceByGroupMonth)
- `aureak/packages/types/src/analytics.ts` — créer (types LineChartSeries, AttendanceMonthlyData)
- `aureak/packages/types/src/index.ts` — modifier (export analytics types)
- `aureak/apps/web/app/(admin)/analytics/presences/page.tsx` — modifier (implémenter avec LineChart)
