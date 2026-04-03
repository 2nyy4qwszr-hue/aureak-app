# Story 36-7 — Page fix: groups & RbfaStatusBadge

**Epic:** 36
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que mainteneur, je veux que `groups/[groupId]/page.tsx` et `RbfaStatusBadge.tsx` utilisent des tokens `@aureak/theme` afin d'éliminer les patterns `color + '20'` et les couleurs hardcodées.

## Acceptance Criteria
- [ ] AC1: `groups/[groupId]/page.tsx` : le pattern `color + '20'` (hex opacity hack) est remplacé par une valeur hex complète à 8 caractères ou un helper `withOpacity`.
- [ ] AC2: `groups/[groupId]/page.tsx` : l'overlay modal utilise `colors.overlay.dark`.
- [ ] AC3: `RbfaStatusBadge.tsx` : `#10B981` remplacé par `colors.status.success`.
- [ ] AC4: `RbfaStatusBadge.tsx` : `#fee2e2` remplacé par un token rouge clair (soit `colors.status.errorBg`, soit `colors.accent.red` + opacité).
- [ ] AC5: grep `\+ '20'\|#10B981\|#fee2e2` dans les fichiers modifiés retourne 0 résultats.

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` pour identifier tous les patterns `color + '20'` et l'overlay modal.
- [ ] Décider de la stratégie opacity : créer un helper `withOpacity(hexColor: string, opacity: number): string` dans `@aureak/theme/utils.ts` OU remplacer par valeurs hex complètes 8 chars codées en dur depuis les tokens.
- [ ] Remplacer les patterns `color + '20'` dans `groups/[groupId]/page.tsx`.
- [ ] Remplacer l'overlay modal dans `groups/[groupId]/page.tsx` par `colors.overlay.dark`.
- [ ] Localiser `aureak/apps/web/app/(admin)/clubs/_components/RbfaStatusBadge.tsx` (ou chemin réel via Glob).
- [ ] Remplacer `#10B981` par `colors.status.success` dans `RbfaStatusBadge.tsx`.
- [ ] Remplacer `#fee2e2` par token rouge clair dans `RbfaStatusBadge.tsx`.
- [ ] QA scan : grep patterns hardcodés dans les fichiers modifiés.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx`
  - Fichier `RbfaStatusBadge.tsx` (chercher avec Glob `**/RbfaStatusBadge.tsx`)
  - `aureak/packages/theme/src/utils.ts` (créer si helper `withOpacity` décidé)
- **Dépend de story-33-1** : `colors.status.success`.
- **Dépend de story-33-3** : `colors.overlay.dark`.
- Helper `withOpacity` suggestion : `export const withOpacity = (hex: string, pct: number) => hex + Math.round(pct * 255).toString(16).padStart(2, '0')`
- Si le helper est créé, l'exporter depuis `@aureak/theme` pour usage global
