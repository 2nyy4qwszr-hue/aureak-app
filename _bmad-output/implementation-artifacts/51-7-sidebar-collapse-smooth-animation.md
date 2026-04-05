# Story 51.7 : Sidebar collapse smooth animation

Status: done

## Story

En tant qu'administrateur,
Je veux que la sidebar se réduise et s'étende avec une animation fluide plutôt qu'un saut instantané, et qu'un tooltip apparaisse au survol des icônes en mode collapsed,
Afin d'avoir une expérience de navigation premium et de pouvoir identifier les items en mode icône-only sans ambiguïté.

## Contexte & Décisions de Design

### État actuel
Le collapse est déjà implémenté dans `_layout.tsx` avec `sidebarWidth` qui passe de 220 à 52, stocké dans `localStorage`. Le changement est instantané — il n'y a pas d'animation de transition sur la largeur.

### Approche animation
Sur le web, la transition de largeur d'une `View` React Native se fait via le style `transition: 'width 280ms ease'` injecté dans le style inline (pattern déjà utilisé dans le codebase : `transitions.normal`). Le token `transitions.normal` = `'0.25s ease'` — on utilisera `0.28s ease` pour cette story.

### Mode icône-only
En mode collapsed, les labels et les separators de groupe sont masqués. La transition doit masquer les textes `opacity: 0` avant de les faire disparaître, et les afficher après l'expansion (éviter le "text débordant" pendant l'animation).

### Tooltips
En mode collapsed + hover sur un item → un tooltip discret affiche le label de l'item. Implémenté via un composant `NavTooltip` utilisant le pattern `Pressable` + `onHoverIn/Out` (React Native Web) et un `View` positionné absolute.

### localStorage
Déjà implémenté. Aucun changement de logique — uniquement l'animation est ajoutée.

## Acceptance Criteria

**AC1 — Animation 280ms ease sur la largeur**
- **Given** l'admin clique sur le bouton toggle de la sidebar
- **When** la sidebar change d'état (expanded ↔ collapsed)
- **Then** la largeur transite de 220 à 52 (ou inverse) en 280ms avec courbe ease
- **And** les éléments adjacents (zone contenu) suivent le mouvement fluidement

**AC2 — Masquage animé des labels lors du collapse**
- **Given** la sidebar est en cours de collapse
- **When** la largeur réduit
- **Then** les labels des items nav disparaissent en `opacity: 0` pendant les 100 premiers ms
- **And** ils ne débordent pas visuellement pendant la transition

**AC3 — Apparition animée des labels lors de l'expansion**
- **Given** la sidebar est en cours d'expansion
- **When** la largeur augmente vers 220
- **Then** les labels apparaissent en `opacity: 1` dans les 100 derniers ms (après que la largeur soit presque à destination)
- **And** l'effet est smooth, pas de clignotement

**AC4 — Tooltip au hover en mode collapsed**
- **Given** la sidebar est en mode collapsed (icônes seules)
- **When** l'admin survole un item nav avec la souris
- **Then** un tooltip affichant le label de l'item s'affiche à droite de l'icône
- **And** le tooltip disparaît quand la souris quitte l'item

**AC5 — Tooltip design cohérent**
- **Given** le tooltip est visible
- **When** l'admin le voit
- **Then** il a un fond `colors.background.elevated`, radius=6, padding horizontal=8, padding vertical=4
- **And** le texte est en `colors.text.primary`, fontSize=12
- **And** le tooltip est positionné `position: absolute` à droite de l'item (via `left: 56`)

**AC6 — État mémorisé localStorage (déjà implémenté — à vérifier)**
- **Given** l'admin a collapsed la sidebar et recharge la page
- **When** le layout se monte
- **Then** la sidebar est dans l'état sauvegardé (collapsed ou expanded)
- **And** l'animation ne se déclenche pas au chargement initial (uniquement sur les toggles utilisateur)

**AC7 — Bouton toggle animé**
- **Given** la sidebar change d'état
- **When** le bouton `‹` / `›` change
- **Then** l'icône de toggle fait une rotation de 180° en même temps que l'animation de largeur
- **And** la rotation est en 280ms ease

**AC8 — Zéro layout shift sur le contenu principal**
- **Given** la sidebar s'anime
- **When** la zone de contenu (`flex: 1`) se redimensionne
- **Then** le contenu de la page ne saute pas brusquement (transition CSS naturelle du flex container)

## Tasks / Subtasks

- [x] Task 1 — Animation de la largeur sidebar dans `_layout.tsx`
  - [x] 1.1 Ajouter `transition: 'width 0.28s ease'` dans le style de la `YStack` sidebar
  - [x] 1.2 Vérifier que `sidebarWidth` (52 ou 220) appliqué via la prop `width` est bien affecté par la transition
  - [x] 1.3 Ajouter un état `isAnimating: boolean` pour éviter les interactions pendant l'animation (optional debounce 280ms sur le toggle)

- [x] Task 2 — Animation des labels (opacity)
  - [x] 2.1 Introduire un state `labelsVisible: boolean` séparé du `sidebarCollapsed`
  - [x] 2.2 Au collapse : `setLabelsVisible(false)` immédiatement, `setSidebarCollapsed(true)` après 100ms
  - [x] 2.3 À l'expansion : `setSidebarCollapsed(false)` immédiatement, `setLabelsVisible(true)` après 180ms
  - [x] 2.4 Les labels (textes nav, séparateurs, section AUREAK) utilisent `labelsVisible` pour leur `opacity`
  - [x] 2.5 Ajouter `transition: 'opacity 0.1s ease'` sur les éléments texte

- [x] Task 3 — Composant `NavTooltip`
  - [x] 3.1 Créer `aureak/apps/web/app/components/NavTooltip.tsx`
  - [x] 3.2 Props : `label: string`, `visible: boolean`, `children: ReactNode`
  - [x] 3.3 Wrapper `View` avec `position: 'relative'`
  - [x] 3.4 Tooltip `View` positionné `position: 'absolute'`, `left: 56`, `top: '50%'` avec transform `translateY(-50%)`
  - [x] 3.5 Affichage conditionnel sur `visible` + animation fade-in 100ms
  - [x] 3.6 zIndex suffisant pour passer au-dessus des autres items nav

- [x] Task 4 — Intégration tooltip dans le rendu des items nav
  - [x] 4.1 Dans `_layout.tsx`, wrapper chaque `Pressable` nav dans `NavTooltip` avec `label={label}` et `visible={sidebarCollapsed && hoveredHref === href}`
  - [x] 4.2 State `hoveredHref: string | null` géré avec `onMouseEnter` / `onMouseLeave` sur le Pressable (React Native Web props)

- [x] Task 5 — Animation rotation du bouton toggle
  - [x] 5.1 Utiliser `Animated.Value` pour la rotation (0 → 180deg selon l'état)
  - [x] 5.2 `Animated.timing` 280ms ease synchronisé avec le toggle
  - [x] 5.3 Appliquer via `Animated.View` + `transform: [{ rotate: anim.interpolate(...) }]`

- [x] Task 6 — Guard animation initiale
  - [x] 6.1 Utiliser un `useRef(true)` `isInitialRender` pour ne pas déclencher l'animation Animated.Value au mount
  - [x] 6.2 Mettre `isInitialRender.current = false` dans le premier `useEffect`

- [x] Task 7 — QA
  - [x] 7.1 `npx tsc --noEmit` sans erreur
  - [x] 7.2 Tester collapse/expand rapide (plusieurs clics rapides) → pas de state désynchronisé
  - [x] 7.3 Vérifier tooltip visible uniquement en mode collapsed

## Dev Notes

### Transition CSS largeur (React Native Web)

```typescript
// Dans le style de la YStack sidebar :
style={{
  flexShrink   : 0,
  display      : 'flex',
  flexDirection: 'column',
  height       : '100vh',
  transition   : 'width 0.28s ease',  // ← clé
  boxShadow    : shadows.sm,
  // ...isMobile styles...
} as never}
```

La prop `width={sidebarWidth}` sur la YStack Tamagui est appliquée comme style inline — le browser CSS transition l'interpolera automatiquement.

### State labels timing

```typescript
const toggleSidebar = () => {
  const next = !sidebarCollapsed

  if (next) {
    // Collapse : cacher labels immédiatement
    setLabelsVisible(false)
    setTimeout(() => {
      setSidebarCollapsed(true)
      try { localStorage.setItem('sidebar-collapsed', 'true') } catch { /* noop */ }
    }, 80)
  } else {
    // Expand : ouvrir sidebar immédiatement, labels après l'animation
    setSidebarCollapsed(false)
    try { localStorage.setItem('sidebar-collapsed', 'false') } catch { /* noop */ }
    setTimeout(() => setLabelsVisible(true), 180)
  }
}
```

### Tooltip sur RN Web

`onMouseEnter` et `onMouseLeave` sont des props valides sur `Pressable` / `View` en React Native Web. Pas besoin de librairie tierce.

```typescript
<Pressable
  onMouseEnter={() => setHoveredHref(href)}
  onMouseLeave={() => setHoveredHref(null)}
  // ... autres props
>
```

## File List

### New Files
- `aureak/apps/web/app/components/NavTooltip.tsx` — tooltip hover mode collapsed

### Modified Files
- `aureak/apps/web/app/(admin)/_layout.tsx` — animation width + labels opacity timing + tooltip intégration + rotation bouton toggle

## Dev Agent Record

- [x] Story créée le 2026-04-04
- [x] Dépendances : Story 51-1 (icônes SVG — les tooltips ne concernent que les items avec icônes)

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
