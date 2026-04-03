# Story 33-2 — Tokens couleurs entité

**Epic:** 33
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que développeur, je veux que les couleurs propres aux entités métier (stage, club) soient centralisées dans `@aureak/theme` afin d'éviter la dispersion de valeurs hexadécimales dans les pages.

## Acceptance Criteria
- [ ] AC1: `colors.entity.stage` et `colors.entity.club` existent dans `packages/theme/src/tokens.ts`
- [ ] AC2: `colors.entity.stage` = valeur verte cohérente avec `colors.status.success` (ou alias direct)
- [ ] AC3: `colors.entity.club` = `'#60A5FA'` (bleu)
- [ ] AC4: Les occurrences de `#4ade80` et `#f87171` dans `stages/index.tsx` et `stages/[stageId]/page.tsx` sont remplacées par les tokens appropriés (`colors.entity.stage`, `colors.status.success`, `colors.status.error`)
- [ ] AC5: L'occurrence de `#60a5fa` dans `clubs/_components/ClubCard.tsx` est remplacée par `colors.entity.club`
- [ ] AC6: Aucune régression visuelle sur les pages stages et clubs

## Tasks
- [ ] Lire `aureak/packages/theme/src/tokens.ts` pour identifier l'emplacement d'ajout du groupe `colors.entity`
- [ ] Ajouter `colors.entity: { stage: colors.status.success (référence ou valeur '#10B981'), club: '#60A5FA' }` dans `tokens.ts`
- [ ] Lire `aureak/apps/web/app/(admin)/stages/index.tsx` et identifier les couleurs hardcodées `#4ade80` / `#f87171`
- [ ] Lire `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` et identifier les couleurs hardcodées `#4ade80` / `#f87171`
- [ ] Remplacer dans `stages/index.tsx` et `stages/[stageId]/page.tsx`
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` et identifier `#60a5fa`
- [ ] Remplacer dans `ClubCard.tsx` par `colors.entity.club`
- [ ] QA scan: grep couleurs hex dans les 3 fichiers → zéro résultat pour les couleurs ciblées

## Dev Notes
- Fichiers à modifier: `aureak/packages/theme/src/tokens.ts`, `aureak/apps/web/app/(admin)/stages/index.tsx`, `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`, `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx`
- Tokens à utiliser: `colors.entity.*`, `colors.status.success`, `colors.status.error`
- Si `colors.status.success` est déjà `#10B981` dans tokens.ts, `colors.entity.stage` peut être un alias : `stage: colors.status.success` (cela nécessite d'exporter les tokens calculés — vérifier la structure actuelle de tokens.ts)
- Alternative simple si alias non supporté: `stage: '#10B981'` avec commentaire // = colors.status.success
- `#f87171` ≈ rouge erreur → utiliser `colors.status.error` ou `colors.accent.red` selon ce qui existe
- Pattern import:
  ```typescript
  import { colors } from '@aureak/theme'
  // puis
  backgroundColor: colors.entity.club
  ```
