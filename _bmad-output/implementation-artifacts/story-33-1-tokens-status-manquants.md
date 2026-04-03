# Story 33-1 — Tokens status manquants

**Epic:** 33
**Status:** ready-for-dev
**Priority:** high

## Story
En tant que développeur, je veux que tous les tokens de statut soient définis dans `@aureak/theme` et utilisés dans `attendance/index.tsx` afin d'éliminer les couleurs hardcodées et d'assurer la cohérence visuelle.

## Acceptance Criteria
- [ ] AC1: `colors.status.warning` (#F59E0B), `colors.status.info` (#60A5FA), `colors.status.neutral` (#9CA3AF), `colors.status.injured` (#CE93D8) existent dans `packages/theme/src/tokens.ts`
- [ ] AC2: `colors.status.success` et `colors.status.error` (si absents) sont également présents et cohérents
- [ ] AC3: Dans `attendance/index.tsx`, les 12 couleurs hardcodées de statut de présence sont remplacées par les tokens correspondants
- [ ] AC4: Mapping couleur → token : `#66BB6A` → `colors.status.success` (présent), `#4FC3F7` → `colors.status.info` (info/retard), `#EF5350` → `colors.status.error` (absent), `#FFA726` → `colors.status.warning` (excusé/warning)
- [ ] AC5: Aucune couleur hexadécimale hardcodée ne subsiste dans `attendance/index.tsx` pour les statuts de présence
- [ ] AC6: L'affichage visuel de la page attendance est identique avant/après (pas de régression)

## Tasks
- [ ] Lire `aureak/packages/theme/src/tokens.ts` pour connaître les tokens `colors.status` existants
- [ ] Ajouter dans `tokens.ts` les tokens manquants: `warning: '#F59E0B'`, `info: '#60A5FA'`, `neutral: '#9CA3AF'`, `injured: '#CE93D8'` sous `colors.status`
- [ ] Lire `aureak/apps/web/app/(admin)/attendance/index.tsx` et identifier toutes les occurrences de couleurs hardcodées liées aux statuts
- [ ] Remplacer chaque couleur hardcodée par le token correspondant (import `colors` depuis `@aureak/theme`)
- [ ] Vérifier que l'import `colors` est déjà présent dans `attendance/index.tsx` ou l'ajouter
- [ ] QA scan: `grep -n "#[0-9A-Fa-f]\{6\}" attendance/index.tsx` → zéro résultat pour les couleurs de statut

## Dev Notes
- Fichiers à modifier: `aureak/packages/theme/src/tokens.ts`, `aureak/apps/web/app/(admin)/attendance/index.tsx`
- Tokens à utiliser: `colors.status.*`
- Pattern import theme:
  ```typescript
  import { colors } from '@aureak/theme'
  ```
- Mapping complet de référence:
  | Hex hardcodé | Token cible | Signification |
  |---|---|---|
  | `#66BB6A` | `colors.status.success` | Présent |
  | `#4FC3F7` | `colors.status.info` | Info / Retard |
  | `#EF5350` | `colors.status.error` (ou `colors.accent.red`) | Absent |
  | `#FFA726` | `colors.status.warning` | Excusé / Avertissement |
- Ne pas toucher à la logique métier ni aux filtres de présence
- `colors.status.error` peut déjà exister sous `colors.accent.red` (#E05252) — vérifier avant de créer un doublon ; utiliser le token existant si la valeur est compatible
