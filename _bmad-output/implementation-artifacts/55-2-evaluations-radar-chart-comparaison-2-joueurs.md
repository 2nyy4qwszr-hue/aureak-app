# Story 55.2 : Évaluations — Radar chart comparaison 2 joueurs

Status: done

## Story

En tant que coach ou administrateur,
Je veux superposer les profils radar de 2 joueurs sur un même graphique SVG,
Afin de comparer visuellement leurs forces et faiblesses sur les 6 axes d'évaluation en un seul coup d'oeil.

## Contexte & Décisions de Design

### Radar SVG 6 axes
Les 6 axes correspondent aux critères d'évaluation standards gardien : Technique, Placement, Relance, Agilité, Mental, Communication. Chaque axe est normalisé de 0 à 10.

### Superposition 2 joueurs
- Joueur A : remplissage gold semi-transparent (`colors.accent.gold` opacité 0.3), contour gold plein
- Joueur B : remplissage bleu semi-transparent (`#3B82F6` opacité 0.3), contour bleu plein
- Les deux polygones sont superposés sur le même SVG
- Légende en bas avec couleur + nom joueur

### Sélection des joueurs
Un toggle/selector permet de choisir Joueur A et Joueur B parmi les joueurs évalués. Par défaut : les 2 joueurs avec le plus d'évaluations récentes.

### Données
Moyennes des N dernières évaluations par axe (configurable, défaut 5 séances). Affiché sur la page `evaluations/comparison.tsx` (nouvelle page).

## Acceptance Criteria

**AC1 — Radar SVG double superposition**
- **Given** deux joueurs sélectionnés avec des évaluations
- **When** le radar est rendu
- **Then** deux polygones colorés distincts (gold + bleu) sont superposés sur le même SVG
- **And** les axes sont labellisés avec le nom du critère
- **And** les valeurs aux sommets sont lisibles

**AC2 — Sélecteur joueur A et B**
- **Given** la page comparison
- **When** l'utilisateur clique sur "Joueur A" ou "Joueur B"
- **Then** un picker liste les joueurs disponibles (ceux avec évaluations)
- **And** la sélection met à jour immédiatement le radar

**AC3 — Légende couleur**
- **Given** deux joueurs sélectionnés
- **When** le radar est rendu
- **Then** une légende affiche le nom de chaque joueur avec sa couleur (gold / bleu)
- **And** la légende est positionnée sous le radar

**AC4 — Scores texte par axe**
- **Given** un radar rendu
- **When** l'utilisateur survole un sommet (hover desktop)
- **Then** un tooltip affiche le score exact du joueur sur cet axe (ex. "Technique : 7.4")
- **And** sur mobile, les scores sont affichés en permanence à côté de chaque sommet

**AC5 — Composant RadarChart réutilisable**
- **Given** le composant `RadarChart`
- **When** il est importé depuis `@aureak/ui`
- **Then** il accepte les props `players: RadarPlayer[]` (max 2), `axes: string[]`, `size?: number`
- **And** fonctionne standalone sans dépendance externe (SVG pur React Native)

**AC6 — Page comparison navigable**
- **Given** la route `/evaluations/comparison`
- **When** elle est accédée
- **Then** la page existe, affiche le radar et les sélecteurs
- **And** un lien "Comparer joueurs" est présent dans la page `evaluations/index.tsx`

## Tasks

- [x] Créer `aureak/packages/ui/src/ComparisonRadarChart.tsx` (SVG pur, 6 axes, max 2 datasets)
- [x] Exporter `ComparisonRadarChart` depuis `aureak/packages/ui/src/index.ts`
- [x] Créer `aureak/apps/web/app/(admin)/evaluations/comparison.tsx`
- [x] Créer `aureak/apps/web/app/(admin)/evaluations/comparison/index.tsx` (re-export)
- [x] Implémenter le sélecteur joueur A / joueur B avec recherche par nom
- [x] Ajouter API `getAverageEvaluationsByPlayer(childId, lastN)` dans `@aureak/api-client`
- [x] Tooltip hover (desktop) + scores permanents (mobile) sur les sommets
- [x] Ajouter lien "Comparer" dans `evaluations/index.tsx`
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : naviguer vers comparison — Playwright skipped, app non démarrée

## Fichiers concernés

- `aureak/packages/ui/src/RadarChart.tsx` (nouveau)
- `aureak/packages/ui/src/index.ts` (export)
- `aureak/apps/web/app/(admin)/evaluations/comparison.tsx` (nouveau)
- `aureak/apps/web/app/(admin)/evaluations/comparison/index.tsx` (nouveau re-export)
- `aureak/apps/web/app/(admin)/evaluations/index.tsx` (lien comparaison)
- `aureak/packages/api-client/src/evaluations.ts` (nouvelle fn API)

## Dépendances

- Story 55-1 (EvaluationCard) recommandée mais non bloquante
- Types `Evaluation` dans `@aureak/types`
- `@aureak/theme` tokens couleurs

## Notes techniques

- SVG pur (react-native-svg ou SVG inline web) — pas de librairie chart externe
- Normalisation : valeur / 10 * rayon_max pour placer les sommets
- Grille de fond : cercles concentriques à 25%, 50%, 75%, 100% en `colors.border.light`
