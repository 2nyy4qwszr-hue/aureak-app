# Story 33-3 — Tokens rgba et opacité

**Epic:** 33
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que développeur, je veux que les valeurs rgba (overlays modaux, fonds semi-transparents) soient centralisées dans `@aureak/theme` afin d'éliminer les rgba hardcodés dispersés dans les composants.

## Acceptance Criteria
- [ ] AC1: `colors.overlay.dark` (`'rgba(0,0,0,0.5)'`), `colors.overlay.modal` (`'rgba(0,0,0,0.7)'`), `colors.overlay.light` (`'rgba(255,255,255,0.85)'`) existent dans `tokens.ts`
- [ ] AC2: Les rgba hardcodés dans `stages/[stageId]/page.tsx` sont remplacés par les tokens overlay correspondants
- [ ] AC3: Les rgba hardcodés dans `groups/[groupId]/page.tsx` sont remplacés par les tokens overlay correspondants
- [ ] AC4: Les rgba hardcodés dans `clubs/_components/ClubCard.tsx` sont remplacés par les tokens overlay correspondants
- [ ] AC5: Les rgba hardcodés dans `_layout.tsx` (admin) sont remplacés par les tokens overlay correspondants
- [ ] AC6: L'aspect visuel des modaux et overlays est inchangé après remplacement

## Tasks
- [ ] Lire `aureak/packages/theme/src/tokens.ts` et identifier l'emplacement pour ajouter `colors.overlay`
- [ ] Ajouter `colors.overlay: { dark: 'rgba(0,0,0,0.5)', modal: 'rgba(0,0,0,0.7)', light: 'rgba(255,255,255,0.85)' }` dans `tokens.ts`
- [ ] Lire `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` et grep rgba → remplacer par tokens
- [ ] Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` et grep rgba → remplacer par tokens
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` et grep rgba → remplacer par tokens
- [ ] Lire `aureak/apps/web/app/(admin)/_layout.tsx` et grep rgba → remplacer par tokens
- [ ] QA scan: `grep -n "rgba(" <fichier>` → zéro résultat dans les fichiers modifiés (ou seulement si valeur non couverte par les 3 tokens)

## Dev Notes
- Fichiers à modifier: `aureak/packages/theme/src/tokens.ts`, `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`, `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`, `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx`, `aureak/apps/web/app/(admin)/_layout.tsx`
- Tokens à utiliser: `colors.overlay.*`
- Si une valeur rgba dans le code ne correspond exactement à aucun des 3 tokens (ex: `rgba(0,0,0,0.3)`), ajouter un token supplémentaire `colors.overlay.subtle: 'rgba(0,0,0,0.3)'` plutôt que de laisser une valeur hardcodée
- Pattern remplacement:
  ```typescript
  // Avant
  backgroundColor: 'rgba(0,0,0,0.7)'
  // Après
  backgroundColor: colors.overlay.modal
  ```
- Ne pas modifier la logique d'affichage des modaux ni leur z-index
