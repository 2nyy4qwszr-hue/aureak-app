# Story 55.1 : Évaluations — Card FUT-style avec note centrale

Status: done

## Story

En tant que coach ou administrateur,
Je veux voir les évaluations d'un joueur sous forme de cards visuelles inspirées du style FUT (FIFA Ultimate Team),
Afin d'obtenir une lecture rapide et percutante de la performance d'un gardien en un coup d'oeil.

## Contexte & Décisions de Design

### Concept visuel
La card reprend les codes FUT : note centrale en très grand (72–96px, bold 900), 3 critères latéraux avec sous-scores, photo joueur en background semi-transparent, badge couleur selon la gamme de note (or >8, argent 6–8, bronze <6), date et nom de la séance.

### Palette par gamme
- Note ≥ 8.0 : fond gold gradient (`colors.accent.gold` → `colors.accent.goldLight`), texte sombre
- Note 6.0–7.9 : fond silver (`colors.light.surface` avec bordure argent), texte `colors.text.primary`
- Note < 6.0 : fond rouge pâle (`colors.accent.red` opacité 0.1), bordure rouge, texte danger

### Critères latéraux
Les 3 sous-scores viennent des champs d'évaluation existants. S'il y a moins de 3 critères, les slots vides sont masqués proprement.

### Intégration
Le composant `EvaluationCard` est ajouté dans `@aureak/ui/src/EvaluationCard.tsx` et utilisé dans la page `evaluations/` (liste des évaluations de la séance) et dans la fiche joueur.

## Acceptance Criteria

**AC1 — Rendu visuel card FUT**
- **Given** une évaluation avec note globale et sous-scores
- **When** la card `EvaluationCard` est rendue
- **Then** la note globale s'affiche en grand au centre (fontSize ≥ 72, fontWeight 900)
- **And** 3 critères latéraux avec libellé + sous-score s'affichent en colonne gauche ou droite
- **And** la couleur de fond suit la gamme gold/silver/rouge selon la note

**AC2 — Photo joueur en background**
- **Given** une évaluation liée à un joueur avec photo Storage
- **When** la card est rendue
- **Then** la photo du joueur s'affiche en background semi-transparent (opacité 0.15–0.25)
- **And** si pas de photo, un placeholder initial stylisé remplace

**AC3 — Badge gamme de note**
- **Given** n'importe quelle note
- **When** la note est ≥ 8.0
- **Then** un badge "OR" doré apparaît en coin supérieur droit
- **And** note 6–7.9 → badge "ARG" argenté, note < 6 → badge "BRZ" bronze/rouge

**AC4 — Informations contextuelles**
- **Given** une évaluation
- **When** la card est rendue
- **Then** le nom du joueur, la date de la séance et le nom du coach évaluateur sont affichés
- **And** ces infos sont lisibles quelle que soit la gamme de couleur

**AC5 — Composant réutilisable et typé**
- **Given** le composant `EvaluationCard`
- **When** il est importé depuis `@aureak/ui`
- **Then** il accepte les props `evaluation: EvaluationWithChild`, `showPhoto?: boolean`, `compact?: boolean`
- **And** le mode `compact` réduit la card pour usage en liste dense (note 48px, critères masqués)

**AC6 — Intégration dans evaluations/index.tsx**
- **Given** la page des évaluations admin
- **When** elle est chargée avec des évaluations
- **Then** chaque évaluation est rendue via `EvaluationCard` (remplace l'affichage tabulaire existant si applicable)

## Tasks

- [x] Créer `aureak/packages/ui/src/EvaluationCard.tsx` avec rendu FUT, props typées
- [x] Exporter `EvaluationCard` depuis `aureak/packages/ui/src/index.ts`
- [x] Implémenter logique couleur gamme (gold/silver/rouge) via seuils constants
- [x] Gérer photo joueur en background (Image Expo avec fallback initiales)
- [x] Créer badge gamme en coin (OR/ARG/BRZ)
- [x] Mode compact (prop `compact`) pour listes denses
- [x] Intégrer dans `aureak/apps/web/app/(admin)/evaluations/index.tsx`
- [x] QA scan : try/finally sur loaders, console guards
- [ ] Test Playwright screenshot de la card — Playwright skipped, app non démarrée

## Fichiers concernés

- `aureak/packages/ui/src/EvaluationCard.tsx` (nouveau)
- `aureak/packages/ui/src/index.ts` (export ajouté)
- `aureak/apps/web/app/(admin)/evaluations/index.tsx` (intégration)
- `aureak/packages/types/src/entities.ts` (type `EvaluationWithChild` si absent)

## Dépendances

- `@aureak/theme` tokens (colors, shadows, radius)
- Types `Evaluation` existants dans `@aureak/types`
- API `listEvaluations` existante dans `@aureak/api-client`

## Notes techniques

- Utiliser `StyleSheet.create` ou styles inline via tokens — aucune couleur hardcodée
- La photo est chargée via l'URL Storage Supabase déjà utilisée dans `children/`
- Pas de nouvelle migration DB requise
