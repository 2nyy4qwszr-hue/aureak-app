# Story 62.5 : Polish — Transitions page animées Expo Router

Status: done

## Story

En tant qu'utilisateur de l'app Aureak,
Je veux que les navigations entre pages s'accompagnent d'une transition fluide (fade + légère translation),
Afin de vivre une expérience de navigation premium cohérente avec l'identité visuelle de l'académie.

## Acceptance Criteria

**AC1 — Transition fade + translate à chaque navigation**
- **Given** l'utilisateur clique sur un lien de navigation
- **When** Expo Router change la route active
- **Then** la nouvelle page apparaît avec un fade-in de 0→1 et une translation `translateX(8px)→0` en 200ms

**AC2 — Transition de sortie**
- **And** la page sortante effectue un fade-out de 1→0 en 150ms simultané avec l'entrée de la nouvelle page

**AC3 — Implémentation via CSS (web)**
- **And** sur web, les transitions sont implémentées via CSS `@keyframes` appliqués aux containers de page
- **And** la classe `page-enter` est ajoutée au montage de chaque route et retirée après 200ms

**AC4 — Désactivation si `prefers-reduced-motion`**
- **And** si `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, aucune animation n'est appliquée
- **And** le comportement de navigation reste fonctionnel sans les animations

**AC5 — Pas de conflit avec les modales et drawers**
- **And** les composants modale et drawer (ex: `Modal.tsx`) ne déclenchent pas la transition de page
- **And** seule la navigation réelle (changement de route Expo Router) déclenche la transition

**AC6 — Configuration Expo Router**
- **And** si Expo Router expose une API de configuration d'animation (`animation` option sur `<Stack.Screen>`), elle est utilisée pour les routes natives
- **And** Pour le web, la configuration CSS via `_layout.tsx` est le mécanisme principal

**AC7 — Performance**
- **And** les transitions utilisent `transform` et `opacity` uniquement (propriétés accélérées GPU)
- **And** aucune propriété layout (`width`, `height`, `margin`) n'est animée

## Tasks / Subtasks

- [ ] Task 1 — CSS `@keyframes` de transition dans `_layout.tsx` (AC: #1, #2, #3, #7)
  - [ ] 1.1 Injecter dans le `<style>` global du layout admin :
    - `@keyframes page-enter` : `opacity 0→1, translateX 8px→0`, 200ms ease-out
    - `@keyframes page-exit` : `opacity 1→0`, 150ms ease-in
  - [ ] 1.2 Classe `.page-enter` appliquée à chaque `<Slot>` ou container de contenu

- [ ] Task 2 — Application dynamique de la classe au changement de route (AC: #1, #3)
  - [ ] 2.1 Utiliser le hook Expo Router `usePathname()` pour détecter les changements de route
  - [ ] 2.2 `useEffect` sur `pathname` : ajouter classe `page-enter`, timeout 200ms pour la retirer
  - [ ] 2.3 Appliquer sur le container principal du contenu (`contentArea` ou équivalent)

- [ ] Task 3 — Guard `prefers-reduced-motion` (AC: #4)
  - [ ] 3.1 Vérifier `window.matchMedia('(prefers-reduced-motion: reduce)').matches` avant d'ajouter la classe
  - [ ] 3.2 Si réduit : skip l'animation sans casser la navigation

- [ ] Task 4 — Configuration Expo Router screens (AC: #6)
  - [ ] 4.1 Dans le layout `<Stack>` ou `<Tabs>`, ajouter `animation="fade"` si l'option est disponible dans la version Expo Router du projet
  - [ ] 4.2 Ne PAS activer les animations natives si elles entrent en conflit avec le CSS web

- [ ] Task 5 — Tests de non-régression (AC: #5)
  - [ ] 5.1 Vérifier que les modales ne déclenchent pas de transition de page
  - [ ] 5.2 Vérifier que le skeleton n'est pas perturbé par la transition

- [ ] Task 6 — QA scan
  - [ ] 6.1 Vérifier le cleanup du timeout `setTimeout` dans le return du useEffect
  - [ ] 6.2 Vérifier que seules `opacity` et `transform` sont animées (pas de layout shift)

## Dev Notes

### CSS keyframes à injecter dans `<style>` global

```css
@keyframes page-enter {
  from {
    opacity  : 0;
    transform: translateX(8px);
  }
  to {
    opacity  : 1;
    transform: translateX(0);
  }
}

.page-enter {
  animation: page-enter 200ms ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter { animation: none; }
}
```

### Hook de transition dans `_layout.tsx`

```typescript
const pathname = usePathname()
const contentRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const el = contentRef.current
  if (!el) return
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  el.classList.add('page-enter')
  const timeout = setTimeout(() => el.classList.remove('page-enter'), 200)
  return () => clearTimeout(timeout)
}, [pathname])
```

### Notes QA
- `clearTimeout` OBLIGATOIRE dans le return du useEffect — BLOCKER si oublié
- Utiliser `transform` et `opacity` uniquement — pas de `left/right` ni `margin`

## File List

- `aureak/apps/web/app/(admin)/_layout.tsx` — modifier (CSS keyframes + useEffect transition)
