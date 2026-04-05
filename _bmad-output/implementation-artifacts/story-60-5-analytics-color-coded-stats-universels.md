# Story 60.5 : Analytics — Color-coded stats universels vert/or/rouge

Status: done

## Story

En tant qu'administrateur Aureak,
Je veux que toutes les valeurs numériques affichées dans les pages analytics soient automatiquement colorées (vert si bon, or si moyen, rouge si faible) selon des seuils configurables,
Afin de scanner visuellement les performances sans avoir à lire les chiffres un par un.

## Acceptance Criteria

**AC1 — Utilitaire `getStatColor` disponible dans `@aureak/theme`**
- **Given** un développeur importe `getStatColor` depuis `@aureak/theme`
- **When** il appelle `getStatColor(value, thresholdHigh, thresholdLow)`
- **Then** la fonction retourne `colors.status.success` si `value >= thresholdHigh`, `colors.accent.gold` si `thresholdLow <= value < thresholdHigh`, et `colors.accent.red` si `value < thresholdLow`

**AC2 — Variante `getStatColorClass` pour StyleSheet**
- **And** une fonction `getStatColorClass(value, thresholdHigh, thresholdLow)` retourne une clé string `'stat-good' | 'stat-medium' | 'stat-low'` utilisable comme classe CSS dans les composants web

**AC3 — Constantes de seuils prédéfinis exportées**
- **And** des constantes `STAT_THRESHOLDS` sont exportées depuis `@aureak/theme` :
  - `STAT_THRESHOLDS.attendance = { high: 80, low: 60 }` (taux de présence %)
  - `STAT_THRESHOLDS.mastery = { high: 4.0, low: 3.0 }` (note /5)
  - `STAT_THRESHOLDS.progression = { high: 75, low: 50 }` (progression %)
  - `STAT_THRESHOLDS.xp = { high: 500, low: 200 }` (points XP mensuels)

**AC4 — Usage dans les pages analytics**
- **And** toutes les valeurs numériques dans `analytics/presences/page.tsx`, `analytics/charge/page.tsx`, `analytics/clubs/page.tsx` utilisent `getStatColor` pour leur couleur de texte
- **And** les KPIs globaux du hub `analytics/page.tsx` utilisent `getStatColor` pour la valeur numérique principale

**AC5 — Usage dans le dashboard**
- **And** les tiles KPI du dashboard (`dashboard/page.tsx`) qui affichent un taux ou une note utilisent `getStatColor` pour la valeur

**AC6 — Badge visuel pour valeurs record**
- **And** `getStatColor` accepte un 4e paramètre optionnel `isRecord?: boolean` — si `true`, la couleur retournée est `colors.accent.gold` avec un badge "🏆" ou un token CSS `record` pour indiquer un record historique

**AC7 — Tests unitaires**
- **And** des tests unitaires (`getStatColor.test.ts`) valident les 4 cas : high, medium, low, record

## Tasks / Subtasks

- [x] Task 1 — Implémenter `getStatColor` et `getStatColorClass` dans `@aureak/theme` (AC: #1, #2)
  - [x] 1.1 Créer `aureak/packages/theme/src/statColors.ts`
  - [x] 1.2 `getStatColor(value, thresholdHigh, thresholdLow, isRecord?)` → retourne string couleur hex
  - [x] 1.3 `getStatColorClass(value, thresholdHigh, thresholdLow)` → retourne `'stat-good' | 'stat-medium' | 'stat-low'`
  - [x] 1.4 Exporter depuis `aureak/packages/theme/src/index.ts`

- [x] Task 2 — Exporter `STAT_THRESHOLDS` (AC: #3)
  - [x] 2.1 Déclarer `STAT_THRESHOLDS` dans `statColors.ts`
  - [x] 2.2 Exporter depuis `@aureak/theme`

- [x] Task 3 — Appliquer dans les pages analytics (AC: #4)
  - [x] 3.1 `analytics/page.tsx` : KPI taux de présence moyen coloré via `getStatColor`
  - [x] 3.2 `analytics/presences/page.tsx` : résumé taux moyens par groupe colorés
  - [x] 3.3 `analytics/clubs/page.tsx` : getStatColor local remplacé par celui de @aureak/theme

- [x] Task 4 — Appliquer dans le dashboard (AC: #5)
  - [x] 4.1 Identifier les KPI tiles attendance/mastery dans `dashboard/page.tsx`
  - [x] 4.2 `rateColor()` refactorisée pour déléguer à `getStatColor` de @aureak/theme

- [x] Task 5 — Tests unitaires (AC: #7)
  - [x] 5.1 Créer `aureak/packages/theme/src/__tests__/getStatColor.test.ts`
  - [x] 5.2 6 cas de test : high, medium, low, record, limite exact high, limite exact low

- [x] Task 6 — QA scan
  - [x] 6.1 Console guards OK, try/finally OK, 0 erreur TypeScript

## Dev Notes

### Signature complète

```typescript
// aureak/packages/theme/src/statColors.ts
import { colors } from './tokens'

export function getStatColor(
  value      : number,
  thresholdHigh: number,
  thresholdLow : number,
  isRecord?   : boolean
): string {
  if (isRecord) return colors.accent.gold
  if (value >= thresholdHigh) return colors.status.success
  if (value >= thresholdLow)  return colors.accent.gold
  return colors.accent.red
}

export function getStatColorClass(
  value        : number,
  thresholdHigh: number,
  thresholdLow : number
): 'stat-good' | 'stat-medium' | 'stat-low' {
  if (value >= thresholdHigh) return 'stat-good'
  if (value >= thresholdLow)  return 'stat-medium'
  return 'stat-low'
}

export const STAT_THRESHOLDS = {
  attendance : { high: 80,  low: 60  },
  mastery    : { high: 4.0, low: 3.0 },
  progression: { high: 75,  low: 50  },
  xp         : { high: 500, low: 200 },
} as const
```

### Usage type

```typescript
import { getStatColor, STAT_THRESHOLDS } from '@aureak/theme'
// Dans un composant :
<Text style={{ color: getStatColor(attendanceRate, STAT_THRESHOLDS.attendance.high, STAT_THRESHOLDS.attendance.low) }}>
  {attendanceRate}%
</Text>
```

## File List

- `aureak/packages/theme/src/statColors.ts` — créer
- `aureak/packages/theme/src/index.ts` — modifier (export getStatColor, getStatColorClass, STAT_THRESHOLDS)
- `aureak/packages/theme/src/__tests__/getStatColor.test.ts` — créer
- `aureak/apps/web/app/(admin)/analytics/page.tsx` — modifier (appliquer getStatColor)
- `aureak/apps/web/app/(admin)/analytics/presences/page.tsx` — modifier (appliquer getStatColor)
- `aureak/apps/web/app/(admin)/analytics/clubs/page.tsx` — modifier (appliquer getStatColor)
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — modifier (appliquer getStatColor sur KPIs)
