# Story 36-3 — Page fix: users/new styles

**Epic:** 36
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que mainteneur, je veux que `users/new.tsx` utilise les tokens de `@aureak/theme` pour tous ses styles afin d'éliminer les 15+ couleurs `rgba(...)` et spacings hardcodés.

## Acceptance Criteria
- [ ] AC1: Toutes les occurrences `rgba(...)` dans `users/new.tsx` sont remplacées par des tokens `colors.overlay.*` ou `colors.light.*`.
- [ ] AC2: Tous les spacings hardcodés (px numériques) sont remplacés par `space.*` tokens de `@aureak/theme`.
- [ ] AC3: Les cards de section utilisent `colors.light.surface` comme fond et `shadows.sm` comme ombre.
- [ ] AC4: grep `rgba\(` dans `users/new.tsx` retourne 0 résultats après fix.
- [ ] AC5: L'apparence visuelle de la page est conservée (aucun changement UX).

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/users/new.tsx` en entier pour inventorier tous les `rgba(...)` et spacings hardcodés.
- [ ] Remplacer chaque `rgba(...)` par le token `colors.overlay.*` approprié (dépend story-33-3 pour les nouveaux tokens overlay).
- [ ] Remplacer les spacings numériques hardcodés par `space.xs`, `space.sm`, `space.md`, `space.lg`, `space.xl` selon correspondance.
- [ ] Unifier les cards section : `backgroundColor: colors.light.surface`, `boxShadow: shadows.sm`, `borderRadius: radius.md`.
- [ ] QA scan : grep `rgba\(` et grep couleurs hex hardcodées dans le fichier modifié.
- [ ] QA scan : vérifier try/finally sur tous les state setters.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/users/new.tsx`
- **Dépend de story-33-3** : les tokens `colors.overlay.*` doivent exister avant cette story.
- Tokens spacing attendus dans `@aureak/theme/tokens.ts` : `space.xs` (4), `space.sm` (8), `space.md` (16), `space.lg` (24), `space.xl` (32)
- Tokens overlay attendus : `colors.overlay.light` (rgba blanc semi-transparent), `colors.overlay.dark` (rgba noir semi-transparent), `colors.overlay.modal` (rgba noir fort)
- Ne pas refactorer la logique du formulaire, uniquement les styles
