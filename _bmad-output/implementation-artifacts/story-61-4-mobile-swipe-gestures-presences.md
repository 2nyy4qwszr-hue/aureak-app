# Story 61.4 : Mobile — Swipe gestures présences

Status: done

## Story

En tant que coach utilisant l'app sur mobile pendant une séance,
Je veux marquer la présence ou l'absence d'un joueur en glissant son nom vers la droite (présent) ou la gauche (absent),
Afin de prendre les présences d'une main, sans avoir à toucher des petits boutons précis.

## Acceptance Criteria

**AC1 — Swipe droite = présent**
- **Given** le coach est sur `/seances/[sessionId]` en mode mobile (< 768px)
- **When** il fait glisser un joueur vers la droite (swipe > 80px)
- **Then** le statut de présence du joueur devient "present" et un feedback visuel vert apparaît derrière la ligne (fond vert `colors.status.success` avec icône ✓)

**AC2 — Swipe gauche = absent**
- **And** glisser vers la gauche (swipe > 80px) marque le joueur "absent" avec feedback rouge (`colors.accent.red`, icône ✗)

**AC3 — Animation de retour snap**
- **And** si le swipe ne dépasse pas 80px, la ligne revient à sa position d'origine en 150ms avec un effet spring
- **And** si le swipe dépasse 80px, la ligne se translate jusqu'au bout puis revient après l'action API

**AC4 — Indicateurs sous la ligne**
- **And** pendant le swipe, un fond coloré apparaît progressivement derrière la ligne : vert à droite, rouge à gauche
- **And** une icône (✓ ou ✗) apparaît côté destination dès 40px de déplacement

**AC5 — Uniquement sur mobile**
- **And** les swipe gestures ne sont activées que sur viewport < 768px ou `Platform.OS === 'android' | 'ios'`
- **And** sur desktop, les boutons toggle Présent/Absent existants restent la seule interaction

**AC6 — Appel API à la validation**
- **And** à la validation du swipe (> 80px), `updateAttendance(sessionId, childId, status)` est appelé
- **And** l'optimistic update est immédiat (statut mis à jour dans le state local avant la réponse API)
- **And** si l'API échoue, le statut revient à l'état précédent et un toast d'erreur s'affiche

**AC7 — Accessibilité sur mobile**
- **And** chaque ligne a un `accessibilityLabel` décrivant le joueur et son statut actuel
- **And** les gestes sont complémentaires aux boutons (pas de remplacement)

## Tasks / Subtasks

- [ ] Task 1 — Créer hook `useSwipeGesture(onSwipeLeft, onSwipeRight, threshold=80)` (AC: #1, #2, #3)
  - [ ] 1.1 Créer `aureak/packages/ui/src/hooks/useSwipeGesture.ts`
  - [ ] 1.2 Web : écoute `touchstart`, `touchmove`, `touchend` avec `deltaX` calculé
  - [ ] 1.3 React Native : utiliser `PanResponder` avec `dx` pour le déplacement
  - [ ] 1.4 Retourner `{ translateX, bind }` — `bind` = handlers à attacher au conteneur
  - [ ] 1.5 Exporter depuis `@aureak/ui`

- [ ] Task 2 — Composant `SwipeableRow.tsx` dans `@aureak/ui` (AC: #1, #2, #3, #4, #5)
  - [ ] 2.1 Props : `onSwipeLeft: () => void`, `onSwipeRight: () => void`, `leftBackground: React.ReactNode`, `rightBackground: React.ReactNode`, `children: React.ReactNode`
  - [ ] 2.2 Animations CSS/Animated pour fond coloré progressif (`opacity: deltaX / threshold`)
  - [ ] 2.3 Icônes ✓ et ✗ positionnées derrière la ligne
  - [ ] 2.4 Guard `isMobile` pour désactiver sur desktop
  - [ ] 2.5 Exporter depuis `@aureak/ui`

- [ ] Task 3 — Intégrer `SwipeableRow` dans la liste des présences (AC: #1, #6, #7)
  - [ ] 3.1 Dans `seances/[sessionId]/page.tsx` section présences, envelopper chaque ligne joueur dans `<SwipeableRow>`
  - [ ] 3.2 `onSwipeRight` → `handleUpdateAttendance(childId, 'present')`
  - [ ] 3.3 `onSwipeLeft` → `handleUpdateAttendance(childId, 'absent')`
  - [ ] 3.4 Optimistic update local + rollback en cas d'erreur API

- [ ] Task 4 — QA scan
  - [ ] 4.1 Vérifier que les listeners touch sont nettoyés au démontage
  - [ ] 4.2 Vérifier try/finally sur `handleUpdateAttendance`
  - [ ] 4.3 Vérifier console guards

## Dev Notes

### Logique swipe web (touch events)

```typescript
// useSwipeGesture.ts
export function useSwipeGesture(onLeft: () => void, onRight: () => void, threshold = 80) {
  const startX = useRef(0)
  const [deltaX, setDeltaX] = useState(0)

  const bind = {
    onTouchStart: (e: React.TouchEvent) => { startX.current = e.touches[0].clientX },
    onTouchMove : (e: React.TouchEvent) => { setDeltaX(e.touches[0].clientX - startX.current) },
    onTouchEnd  : () => {
      if (deltaX >  threshold) onRight()
      if (deltaX < -threshold) onLeft()
      setDeltaX(0)
    },
  }
  return { deltaX, bind }
}
```

### Fond coloré progressif

```typescript
// Opacité du fond selon deltaX
const rightBgOpacity = Math.min(Math.max(deltaX / 80, 0), 1)   // 0→1 en glissant droite
const leftBgOpacity  = Math.min(Math.max(-deltaX / 80, 0), 1)  // 0→1 en glissant gauche
```

### Notes QA
- `removeEventListener` obligatoire pour touch events si implémentation manuelle
- Optimistic update + rollback — BLOCKER si try/finally absent
- Guard `Platform.OS === 'web'` ou viewport check avant d'activer les gestures

## File List

- `aureak/packages/ui/src/hooks/useSwipeGesture.ts` — créer
- `aureak/packages/ui/src/SwipeableRow.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export SwipeableRow, useSwipeGesture)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — modifier (SwipeableRow sur chaque ligne présence)
