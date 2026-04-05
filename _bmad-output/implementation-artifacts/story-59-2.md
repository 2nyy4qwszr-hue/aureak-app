# Story 59-2 — Gamification : Level-up animation spring + flash or

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P1 — expérience joueur

---

## Contexte & objectif

Quand un joueur franchit un seuil de niveau (bronze → argent → or → platine → diamant → légende), l'application doit déclencher une animation visuelle mémorable : spring bounce sur le badge de niveau + flash doré plein écran 0.8s. Un son optionnel peut accompagner l'animation (non bloquant si absent).

Les tokens `gamification.animations.levelUp` (`0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`) et `gamification.levels.*` (couleurs, labels) dans `@aureak/theme/tokens.ts` sont déjà définis et doivent être utilisés exclusivement.

---

## Dépendances

- Story 59-1 `done` — `XpEventType`, `resolveLevel()` disponibles
- Tokens `gamification.*` présents dans `@aureak/theme/tokens.ts` (vérifié)

---

## Acceptance Criteria

1. **AC1 — Composant LevelUpAnimation** : Le composant `LevelUpAnimation` dans `aureak/packages/ui/src/LevelUpAnimation.tsx` accepte les props `{ level: keyof typeof gamification.levels, visible: boolean, onDismiss: () => void }`. Quand `visible=true`, il affiche une overlay plein écran avec la couleur du niveau (`gamification.levels[level].color`) en fond semi-transparent, le label du niveau en grand (`typography.display`), et l'icône badge avec animation spring définie par `gamification.animations.levelUp`.

2. **AC2 — Flash doré** : L'overlay s'anime en deux phases : (1) fade-in rapide 150ms vers opacity 0.85, (2) hold 400ms, (3) fade-out 250ms. La durée totale n'excède pas 0.8s (`gamification.animations.levelUp`). Implémenté via CSS keyframes ou Animated (React Native/Web compatible).

3. **AC3 — Hook useLevelUp** : Le hook `useLevelUp(currentXp: number)` dans `aureak/packages/ui/src/hooks/useLevelUp.ts` retourne `{ level, prevLevel, isLevelUp, clearLevelUp }`. Il détecte le changement de tier via `resolveLevel()` importé de `@aureak/theme`. `isLevelUp` devient `true` uniquement quand le tier monte (pas quand XP augmente sans changer de tier). `clearLevelUp()` remet `isLevelUp` à false.

4. **AC4 — Son optionnel non bloquant** : La prop `soundEnabled?: boolean` (défaut `false`) déclenche `Audio('level-up.mp3').play().catch(() => {})` si `true`. L'absence du fichier son ou un `NotAllowedError` du navigateur ne fait pas crasher le composant (catch silencieux explicitement documenté).

5. **AC5 — Accessibilité** : L'overlay porte `aria-live="assertive"` et `role="alert"`. Le label du niveau est lisible par les screen readers. L'overlay se ferme via `Escape` (keydown) ou `onDismiss` après 800ms automatiquement.

6. **AC6 — Exports** : `LevelUpAnimation` et `useLevelUp` sont exportés depuis `aureak/packages/ui/src/index.ts`. Aucune couleur hardcodée — tout via `gamification.*` et `colors.*` de `@aureak/theme`.

7. **AC7 — Storybook-ready** : Le composant peut être instancié sans dépendance Supabase (props pures). Un usage minimal est documenté dans le JSDoc du composant.

---

## Tasks

- [x] **T1** — Créer `aureak/packages/ui/src/LevelUpAnimation.tsx` : overlay, animation phases, badge spring
- [x] **T2** — Créer `aureak/packages/ui/src/hooks/useLevelUp.ts` : détection tier change via `resolveLevel()`
- [x] **T3** — Ajouter exports dans `aureak/packages/ui/src/index.ts`
- [x] **T4** — QA scan : zéro couleur hardcodée, catch son documenté
- [x] **T5** — Cocher tasks, mettre Status: done

---

## Notes techniques

- `resolveLevel(xp)` est déjà dans `@aureak/theme/tokens.ts` — importer depuis `@aureak/theme`.
- Le composant est web-first (admin web). Compatibilité React Native = bonus non requis pour cette story.
- Utiliser `React.memo` pour éviter les re-renders inutiles.
- Animation implémentée en CSS pur (`@keyframes`) via `style` tag injecté ou module CSS — pas de dépendance externe animation.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/LevelUpAnimation.tsx` | Créer |
| `aureak/packages/ui/src/hooks/useLevelUp.ts` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — export LevelUpAnimation, useLevelUp |
