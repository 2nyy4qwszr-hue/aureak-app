# Story 52-3 — Shimmer animation cards Elite

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P2
**Dépend de** : story-52-1, story-52-2

---

## Story

En tant qu'admin, je veux que les cartes joueur de tier Elite aient une animation shimmer dorée sur leur bordure, afin de les distinguer visuellement de façon premium dans la grille.

---

## Acceptance Criteria

1. **AC1 — Shimmer uniquement sur Elite** : L'animation shimmer (gradient animé sur la bordure) s'applique **uniquement** aux cards de tier `Elite`. Les tiers Prospect/Académicien/Confirmé n'ont aucune animation.

2. **AC2 — Animation CSS web** : Sur Platform web, l'animation est un `@keyframes` CSS inject via un `<style>` tag inséré une seule fois dans le DOM (pattern singleton). Durée 3 secondes, loop infinie.

3. **AC3 — Gradient bordure** : Le shimmer alterne entre `#C1AC5C` (or AUREAK), `#FFE566` (or brillant), `#D6C98E` (or clair) et retour `#C1AC5C`. Angle 135°.

4. **AC4 — Dégradé en pseudo-element** : Implémenté comme un `::before` pseudo-element en CSS web avec `background: linear-gradient(...)`, `border-radius` identique à la card, `z-index: -1`, animé via `@keyframes shimmerGold`.

5. **AC5 — Fallback mobile/native** : Sur Platform native (iOS/Android), les cards Elite affichent uniquement la bordure or solide `#C1AC5C` épaisseur 2px sans animation (pas de CSS natif disponible).

6. **AC6 — Performance** : Le `<style>` tag CSS est injecté via `useEffect` avec cleanup, uniquement si `Platform.OS === 'web'`. L'animation utilise `will-change: background-position` pour GPU acceleration.

7. **AC7 — Désactivation accessibility** : Si `prefers-reduced-motion: reduce` est détecté, l'animation est désactivée (le shimmer reste statique, fond or fixe).

---

## Tasks

- [x] **T1** — Dans `aureak/packages/ui/src/PlayerCard.tsx`, ajouter :
  - Import `Platform` depuis `react-native`
  - `useShimmerEffect(isElite: boolean)` hook interne :
    - Sur web : injecte un `<style>` tag avec `@keyframes shimmerGold` et la classe `.player-card-elite-shimmer`
    - Nettoyage dans le cleanup du `useEffect`
    - Respecte `prefers-reduced-motion` via `window.matchMedia`
  - Ajouter la classe CSS `.player-card-elite-shimmer` sur le conteneur card si tier Elite + Platform web

- [x] **T2** — Définir le CSS shimmer dans le hook :
  ```css
  @keyframes shimmerGold {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .player-card-elite-shimmer::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: linear-gradient(135deg, #C1AC5C, #FFE566, #D6C98E, #C1AC5C);
    background-size: 300% 300%;
    animation: shimmerGold 3s ease infinite;
    z-index: -1;
    will-change: background-position;
  }
  @media (prefers-reduced-motion: reduce) {
    .player-card-elite-shimmer::before { animation: none; }
  }
  ```

- [x] **T3** — S'assurer que le conteneur card a `position: 'relative'` et `overflow: 'hidden'` pour que le pseudo-element soit correctement clippé.

- [x] **T4** — QA : vérifier que le hook ne crée pas de `<style>` tag en double si plusieurs cards Elite sont rendues simultanément (pattern singleton via id unique `aureak-shimmer-styles`).

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/PlayerCard.tsx` | Modifier — ajouter hook shimmer |

---

## Notes techniques

- L'injection de `<style>` est la seule façon d'utiliser `::before` pseudo-elements et `@keyframes` dans Expo Router web (React Native for Web ne supporte pas directement les pseudo-elements).
- Pattern singleton : vérifier `document.getElementById('aureak-shimmer-styles')` avant d'injecter.
- `Platform.OS === 'web'` est le guard pour tout le bloc CSS injection.
