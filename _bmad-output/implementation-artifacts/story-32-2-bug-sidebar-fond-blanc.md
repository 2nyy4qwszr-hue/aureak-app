# Story 32-2 — Bug: sidebar fond blanc au lieu de dark

**Epic:** 32
**Status:** ready-for-dev
**Priority:** high

## Story
En tant qu'admin, je veux que la sidebar reste dark (fond #111111 avec stripe gold) conformément à la vision design Light Premium afin de conserver le contraste premium voulu.

## Acceptance Criteria
- [ ] AC1: La sidebar affiche un fond `#111111` (dark) et non `colors.light.surface` (#FFFFFF)
- [ ] AC2: Les items de navigation ont une couleur de texte adaptée au fond sombre (blanc ou gold, pas gris foncé)
- [ ] AC3: La stripe gold (3px) en haut de la sidebar reste visible et inchangée
- [ ] AC4: Le logo et les éléments d'en-tête de sidebar sont lisibles sur fond dark
- [ ] AC5: Aucun token hardcodé (#111111 doit provenir de `colors.sidebar.bg` ou équivalent token existant dans `@aureak/theme`)

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/_layout.tsx` pour localiser la ligne ~125 utilisant `colors.light.surface` sur la sidebar
- [ ] Lire `aureak/packages/theme/src/tokens.ts` pour identifier le token dark approprié (`colors.dark.*` ou `colors.sidebar.*`)
- [ ] Si aucun token sidebar n'existe dans `tokens.ts`, ajouter `colors.sidebar` : `{ bg: '#111111', text: '#FFFFFF', textMuted: '#9CA3AF', border: '#222222' }`
- [ ] Dans `_layout.tsx` : remplacer `colors.light.surface` → token dark sidebar sur le container sidebar
- [ ] Ajuster les couleurs de texte des nav items pour contraste sur fond sombre (utiliser tokens ajoutés)
- [ ] Vérifier que la stripe gold et le logo restent inchangés
- [ ] QA visuel : screenshot ou review que la sidebar est dark et les items lisibles

## Dev Notes
- Fichiers à modifier: `aureak/apps/web/app/(admin)/_layout.tsx`, potentiellement `aureak/packages/theme/src/tokens.ts`
- Token cible sidebar bg: `'#111111'` (pas `colors.light.primary` ni `colors.light.surface`)
- Les tokens `colors.light.*` sont réservés au content area (fond beige #F3EFE7 + cards blanches)
- Design vision: sidebar dark (contraste premium) / content area light — voir MEMORY.md section Design System v2
- Ne pas modifier la logique de navigation ni les routes
- Pattern couleur texte sur fond dark:
  ```typescript
  color: colors.sidebar?.text ?? '#FFFFFF'
  ```
- Si `colors.sidebar` n'existe pas encore dans tokens.ts, l'ajouter dans la section `colors` en suivant le pattern existant des autres groupes
