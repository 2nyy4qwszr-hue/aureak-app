# Story 60.4 : Analytics — Classement implantations bar chart

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux voir un bar chart horizontal classant les implantations par taux de présence ou maîtrise,
Afin de comparer les performances des sites de l'académie et identifier ceux qui nécessitent une attention.

## Acceptance Criteria

**AC1 — Bar chart présent dans la section Clubs**
- **Given** l'admin navigue vers `/analytics/clubs`
- **When** la page se charge
- **Then** un bar chart horizontal s'affiche listant chaque implantation avec une barre proportionnelle à sa métrique

**AC2 — Deux métriques sélectionnables**
- **And** deux onglets ou un sélecteur permettent de basculer entre : "Taux de présence (%)" et "Maîtrise moyenne (/5)"
- **And** les barres se re-trient et se re-colorent à la sélection (transition 300ms)

**AC3 — Couleur selon performance**
- **And** chaque barre est colorée selon la performance : ≥80% = vert `colors.status.success`, 60-79% = or `colors.accent.gold`, <60% = rouge `colors.accent.red`
- **And** la valeur numérique est affichée à droite de chaque barre (ex. "84%")

**AC4 — Tri décroissant automatique**
- **And** les implantations sont triées de la meilleure à la moins bonne performance (décroissant)
- **And** un rang (#1, #2, …) s'affiche à gauche du nom de chaque implantation

**AC5 — Détail au clic**
- **And** cliquer sur une barre ou le nom d'une implantation navigue vers `/analytics/clubs/[implantationId]` (placeholder pour future story)

**AC6 — Période filtrée**
- **And** un sélecteur de période ("Ce mois", "Ce trimestre", "Cette année") filtre les données
- **And** la période sélectionnée est affichée dans le titre du chart

**AC7 — Composant réutilisable**
- **And** `BarChart` est exporté depuis `@aureak/ui` avec des props génériques `data: BarChartItem[]`

## Tasks / Subtasks

- [ ] Task 1 — API : stats par implantation (AC: #1, #2, #6)
  - [ ] 1.1 Créer `getImplantationRankings(metric: 'attendance' | 'mastery', period: BarChartPeriod)` dans `@aureak/api-client/src/analytics.ts`
  - [ ] 1.2 Requête : `SELECT i.id, i.name, AVG(attendance_rate) FROM sessions s JOIN implantations i ... GROUP BY i.id, i.name ORDER BY avg DESC`
  - [ ] 1.3 Retourner `ImplantationRankingItem[]` : `{ id, name, value, rank, sessionCount }`

- [ ] Task 2 — Composant `BarChart.tsx` dans `@aureak/ui` (AC: #1, #3, #4, #7)
  - [ ] 2.1 Props : `data: BarChartItem[]`, `maxValue?: number`, `onItemClick?: (id: string) => void`, `colorFn?: (value: number) => string`
  - [ ] 2.2 Rendre chaque barre : `<div>` avec `width: (value/max * 100)%`, transition CSS `width 300ms ease`
  - [ ] 2.3 Afficher rang à gauche, nom de l'implantation, valeur à droite de la barre
  - [ ] 2.4 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 3 — `getStatColor` locale (AC: #3)
  - [ ] 3.1 Fonction inline dans la page : `(value) => value >= 80 ? success : value >= 60 ? gold : red`

- [ ] Task 4 — Intégration dans `analytics/clubs/page.tsx` (AC: #2, #5, #6)
  - [ ] 4.1 State `metric: 'attendance' | 'mastery'` + sélecteur onglets
  - [ ] 4.2 State `period: BarChartPeriod`
  - [ ] 4.3 Skeleton loading + empty state "Aucune implantation avec données"
  - [ ] 4.4 `router.push(\`/analytics/clubs/\${id}\`)` au clic sur une barre

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier try/finally sur le loader
  - [ ] 5.2 Vérifier console guards

## Dev Notes

### Types TypeScript

```typescript
// @aureak/types/analytics.ts
export type BarChartPeriod = 'month' | 'quarter' | 'year'
export interface BarChartItem { id: string; label: string; value: number; rank: number; meta?: Record<string, unknown> }
export interface ImplantationRankingItem { id: string; name: string; value: number; rank: number; sessionCount: number }
```

### Transition barre CSS

```typescript
// Barre avec transition via CSS inline
<div style={{
  height    : 32,
  width     : `${(item.value / maxValue) * 100}%`,
  backgroundColor: colorFn(item.value),
  transition: `width ${transitions.normal}`,
  borderRadius: radius.xs,
}} />
```

### Notes QA
- `BarChart` dans `@aureak/ui` : zéro logique métier, purement présentationnel
- Couleurs via `colors.*` — pas de valeurs hex hardcodées dans le composant générique

## File List

- `aureak/packages/ui/src/BarChart.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export BarChart)
- `aureak/packages/api-client/src/analytics.ts` — modifier (ajouter getImplantationRankings)
- `aureak/packages/types/src/analytics.ts` — modifier (ajouter BarChartItem, BarChartPeriod, ImplantationRankingItem)
- `aureak/apps/web/app/(admin)/analytics/clubs/page.tsx` — modifier (implémenter avec BarChart)
