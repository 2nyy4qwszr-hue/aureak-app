# Story 36-2 — Page fix: attendance couleurs

**Epic:** 36
**Status:** ready-for-dev
**Priority:** high

## Story
En tant que mainteneur, je veux que toutes les couleurs de statut de présence dans `attendance/index.tsx` utilisent les tokens `colors.status.*` afin d'éliminer les couleurs hardcodées et garantir la cohérence du design system.

## Acceptance Criteria
- [ ] AC1: Aucune couleur hex hardcodée dans `attendance/index.tsx` — toutes remplacées par tokens `colors.status.*`.
- [ ] AC2: `colors.status.present` (#66BB6A) est utilisé pour les présences confirmées.
- [ ] AC3: `colors.status.absent` (#EF5350) est utilisé pour les absences.
- [ ] AC4: `colors.status.warning` (#FFA726) est utilisé pour les retards/justifications.
- [ ] AC5: `colors.status.info` (#4FC3F7) est utilisé pour les statuts informatifs.
- [ ] AC6: La barre de progression utilise le composant `ProgressBar` de `@aureak/ui` si disponible, sinon un `View` avec `colors.status.*` — pas de couleur hardcodée.
- [ ] AC7: grep `#[0-9A-Fa-f]{3,6}` dans `attendance/index.tsx` retourne 0 résultats après fix.

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/attendance/index.tsx` lignes 25-65 pour identifier toutes les couleurs hardcodées.
- [ ] Remplacer les couleurs de statut présence/absence/retard/info par les tokens `colors.status.*` correspondants (importer depuis `@aureak/theme`).
- [ ] Vérifier si `ProgressBar` existe dans `@aureak/ui` — si oui, remplacer le `View` progression par `<ProgressBar />` ; si non, laisser le `View` avec couleur tokenisée.
- [ ] QA scan : grep couleurs hardcodées dans le fichier modifié.
- [ ] QA scan : vérifier try/finally sur tous les state setters de chargement.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/attendance/index.tsx`
- **Dépend de story-33-1** : les tokens `colors.status.*` doivent être définis dans `@aureak/theme/tokens.ts` avant cette story.
- Tokens cibles : `colors.status.present`, `colors.status.absent`, `colors.status.warning`, `colors.status.info`
- Import pattern : `import { colors } from '@aureak/theme'`
- Ne pas modifier la logique métier, uniquement les couleurs inline
