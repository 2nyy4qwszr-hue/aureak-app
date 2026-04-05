# Story 56.8 : Groupes — Transition slide vers fiche joueur

Status: done

## Story

En tant qu'utilisateur de l'interface admin,
Je veux voir une animation de transition fluide (slide right) quand je navigue d'un groupe vers la fiche d'un joueur,
Afin d'avoir une expérience de navigation premium et spatiale qui renforce la hiérarchie groupe → joueur.

## Contexte & Décisions de Design

### Animation slide right
- Durée : 300ms
- Easing : `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design standard)
- Direction : la page cible arrive depuis la droite (slide in), la page source sort vers la gauche (slide out)
- Sur le retour (back) : direction inversée (slide in depuis gauche)

### Technologie
Expo Router (web) utilise CSS pour les transitions sur le web. Configurer les transitions via le fichier `_layout.tsx` de la route `groups/` avec la config Expo Router web screen transitions, ou via CSS classes appliquées au container de navigation.

Alternative si Expo Router ne supporte pas les transitions CSS au niveau de la route : implémenter via `Animated.View` wrappant le contenu de la page source et cible, déclenché par la navigation.

### Portée
L'animation s'applique uniquement au clic sur un joueur dans la liste d'un groupe (`groups/[groupId]/page.tsx` → `children/[childId]/page.tsx`). Les autres navigations ne sont pas affectées.

### Accessibilité
Respecter `prefers-reduced-motion` : si activé, l'animation est désactivée (transition instantanée).

## Acceptance Criteria

**AC1 — Animation slide right au clic sur un joueur**
- **Given** la page `groups/[groupId]/page.tsx` avec sa liste de membres
- **When** l'admin clique sur un joueur
- **Then** la page `children/[childId]/page.tsx` arrive depuis la droite en 300ms
- **And** la page groupe sort vers la gauche simultanément

**AC2 — Animation slide left au retour**
- **Given** la fiche joueur ouverte depuis le groupe
- **When** l'admin clique sur "Retour" (back navigation)
- **Then** la fiche joueur sort vers la droite et la page groupe revient depuis la gauche
- **And** la durée est identique (300ms)

**AC3 — Easing fluide**
- **Given** l'animation en cours
- **When** elle est observée
- **Then** l'easing `cubic-bezier(0.4, 0.0, 0.2, 1)` est appliqué (départ rapide, fin douce)
- **And** aucun saut ou flash blanc pendant la transition

**AC4 — Respect de prefers-reduced-motion**
- **Given** un utilisateur avec `prefers-reduced-motion: reduce` dans son OS
- **When** il navigue joueur → groupe
- **Then** la transition est instantanée (0ms) sans animation
- **And** aucun `@media` override ne force l'animation

**AC5 — Non-interférence avec les autres navigations**
- **Given** l'animation configurée pour groups → children
- **When** l'admin navigue depuis le dashboard ou la sidebar vers d'autres pages
- **Then** ces navigations ne sont pas affectées par la configuration de transition
- **And** le comportement par défaut (sans animation) est préservé partout ailleurs

**AC6 — Performance : aucun jank frame**
- **Given** l'animation slide en cours sur un affichage standard (1080p)
- **When** les DevTools perf sont analysés
- **Then** aucun frame drop sous 30fps pendant la transition
- **And** l'animation utilise `transform: translateX` (GPU-accelerated, pas de `left` ou `margin`)

## Tasks

- [ ] Analyser les options Expo Router web pour les transitions de routes (screen options)
- [ ] Implémenter la configuration de transition dans `groups/[groupId]/_layout.tsx` (créer si absent) ou via CSS global scopé
- [ ] CSS keyframes : `@keyframes slideInRight`, `@keyframes slideOutLeft`, `@keyframes slideInLeft`, `@keyframes slideOutRight`
- [ ] Media query `prefers-reduced-motion` : désactiver les animations
- [ ] Vérifier que l'animation ne s'applique qu'aux liens joueur dans la fiche groupe (pas à la sidebar)
- [ ] Tester le retour back avec la même animation inversée
- [ ] Performance audit : utiliser `transform: translateX` uniquement
- [ ] QA scan : console guards
- [ ] Test Playwright : naviguer joueur depuis groupe, screenshot avant/après, vérifier absence d'erreur

## Fichiers concernés

- `aureak/apps/web/app/(admin)/groups/[groupId]/_layout.tsx` (nouveau ou modifié)
- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` (liens joueur avec config navigation)
- CSS global ou fichier `styles/transitions.css` si applicable (nouveau)

## Dépendances

- Story 56-1 (GroupCard) recommandée
- Story 56-2 ou 56-3 (page groupe peuplée avec des joueurs) requise pour tester

## Notes techniques

- Expo Router web : `<Stack.Screen options={{ animation: 'slide_from_right' }}` dans le layout peut fonctionner
- Si non supporté nativement : wrapper `<Animated.View>` avec `useEffect` sur `router.push`, `translateX` de `width` → 0 sur 300ms
- CSS : `will-change: transform` sur le container de page pour activation GPU
- `@media (prefers-reduced-motion: reduce) { .slide-transition { animation: none !important; } }`
