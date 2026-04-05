# Story 55.3 : Évaluations — Timeline croissance joueur

Status: done

## Story

En tant que coach ou administrateur,
Je veux visualiser l'évolution des notes d'un joueur sur ses 10 dernières séances sous forme de graphique ligne,
Afin de percevoir instantanément la progression ou la régression d'un gardien dans le temps.

## Contexte & Décisions de Design

### Graphique ligne SVG
- Axe X : 10 dernières séances ordonnées chronologiquement (dates affichées en petit en bas)
- Axe Y : notes de 0 à 10, grille horizontale tous les 2 points
- Ligne de tendance : courbe lissée (cubic bezier) en gold (`colors.accent.gold`), stroke-width=2
- Points : cercles 6px sur chaque séance, remplis gold, bordure blanche
- Zone sous la courbe : gradient vertical gold → transparent (opacité 0.15)

### Tooltip au survol
Sur desktop, hover sur un point → tooltip flottant avec : date séance + note + nom séance (si disponible).

### Intégration
Composant `GrowthChart` ajouté dans `@aureak/ui`. Intégré dans la fiche joueur `children/[childId]/page.tsx` dans la section "Évaluations", visible pour admin et coach.

### Données
API `listRecentEvaluationsForChild(childId, limit=10)` retournant les évaluations triées par date DESC puis inversées pour affichage chronologique.

## Acceptance Criteria

**AC1 — Graphique ligne SVG rendu**
- **Given** un joueur avec au moins 2 évaluations
- **When** le `GrowthChart` est rendu
- **Then** une ligne SVG relie les notes sur les séances dans l'ordre chronologique
- **And** la zone sous la courbe est remplie d'un gradient gold semi-transparent

**AC2 — Axes et grille**
- **Given** le graphique rendu
- **When** l'utilisateur le regarde
- **Then** l'axe Y affiche les valeurs 0, 2, 4, 6, 8, 10 avec lignes horizontales en `colors.border.light`
- **And** l'axe X affiche les dates courtes (ex. "14 jan") sous chaque point

**AC3 — Tooltip hover**
- **Given** le graphique en mode desktop
- **When** l'utilisateur survole un point
- **Then** un tooltip apparaît avec : date formatée, note (ex. "7.5/10"), nom de la séance
- **And** le tooltip est positionné sans déborder du conteneur

**AC4 — État vide et minimum 2 points**
- **Given** un joueur avec 0 ou 1 évaluation
- **When** le `GrowthChart` est rendu
- **Then** un état vide "Pas assez de données" s'affiche avec un texte explicatif
- **And** aucune ligne cassée ou erreur SVG

**AC5 — Intégration fiche joueur**
- **Given** la page `children/[childId]/page.tsx`
- **When** la section "Évaluations" est ouverte
- **Then** le `GrowthChart` apparaît au-dessus de la liste des évaluations
- **And** il est masqué si le joueur a moins de 2 évaluations

**AC6 — Composant réutilisable typé**
- **Given** le composant `GrowthChart`
- **When** il est importé depuis `@aureak/ui`
- **Then** il accepte les props `evaluations: EvaluationPoint[]`, `width?: number`, `height?: number`
- **And** le type `EvaluationPoint = { date: string; score: number; sessionName?: string }`

## Tasks

- [x] Créer `aureak/packages/ui/src/GrowthChart.tsx` (SVG ligne avec gradient zone)
- [x] Exporter `GrowthChart` depuis `aureak/packages/ui/src/index.ts`
- [x] Définir type `EvaluationPoint` dans `@aureak/types/src/entities.ts`
- [x] Ajouter `listRecentEvaluationsForChild(childId, limit)` dans `@aureak/api-client/src/evaluations/evaluations.ts`
- [x] Intégrer `GrowthChart` dans `children/[childId]/page.tsx` section évaluations
- [x] Implémenter tooltip hover (onMouseEnter/onMouseLeave sur web)
- [x] État vide propre si < 2 évaluations
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright — Playwright skipped, app non démarrée

## Fichiers concernés

- `aureak/packages/ui/src/GrowthChart.tsx` (nouveau)
- `aureak/packages/ui/src/index.ts` (export)
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (intégration section évaluations)
- `aureak/packages/api-client/src/evaluations.ts` (nouvelle fn)
- `aureak/packages/types/src/entities.ts` (type EvaluationPoint)

## Dépendances

- API évaluations existante dans `@aureak/api-client`
- Types `Evaluation` dans `@aureak/types`
- Story 55-1 (EvaluationCard) recommandée mais non bloquante

## Notes techniques

- SVG pur, pas de librairie chart (Recharts, Victory, etc.)
- Cubic bezier lissage : points de contrôle calculés dynamiquement
- Responsive : utiliser `onLayout` pour width dynamique ou prop width fixe (défaut 320)
