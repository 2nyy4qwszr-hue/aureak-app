# Story 101.2 — `<FilterSheet />` — filtres bottom sheet mobile / toolbar desktop

Status: review

## Metadata

- **Epic** : 101 — Composants data mobile-first
- **Story ID** : 101.2
- **Story key** : `101-2-filtersheet-bottom-sheet`
- **Priorité** : P1
- **Dépendances** : 100.1 (drawer gestures réutilisables)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1-1.5j — composant + animations)

## Story

As an admin sur mobile,
I want que les filtres/tris des listings soient accessibles via un bouton "Filtres" qui ouvre un bottom sheet (au lieu d'être affichés en permanence en haut de page et prendre de l'espace),
So that le listing utilise 100% de la hauteur écran et que les filtres soient à portée de pouce.

## Contexte

### Problème

Les pages listing actuelles (coaches, clubs, sponsors, etc.) ont des filtres affichés en permanence en toolbar horizontale. Sur mobile, ça prend 80-120px de hauteur pour quelque chose qui n'est pas toujours utilisé.

### Solution

Composant `<FilterSheet />` :
- **Desktop** : toolbar horizontale inline (actuel)
- **Tablette** : drawer latéral droit (optionnel, peut stay toolbar)
- **Mobile** : bouton "🎚 Filtres" + bottom sheet qui slide-up depuis le bas au tap

## Acceptance Criteria

1. **Composant `<FilterSheet />`** dans `aureak/apps/web/components/admin/FilterSheet.tsx`.

2. **API** :
   ```typescript
   type FilterSheetProps = {
     children      : React.ReactNode  // filtres (inputs, selects, toggles)
     activeCount   : number            // nombre de filtres actifs
     onReset?      : () => void
     variant?      : 'auto' | 'inline' | 'sheet'  // auto = détection breakpoint
   }
   ```

3. **Variant inline** (desktop) :
   - Children rendus en toolbar horizontale
   - Pas de bouton "Filtres"
   - Comportement inchangé

4. **Variant sheet** (mobile) :
   - Bouton trigger "🎚 Filtres ({activeCount})" visible dans la page
   - Tap → bottom sheet slide-up avec animation 250ms
   - Sheet contient les children + header "Filtres" + bouton "Réinitialiser" si `onReset`
   - Close via : swipe down, tap overlay, bouton "Fermer", escape key

5. **Bottom sheet mobile implementation** :
   - Animation `Animated.View` `translateY` de `screenHeight` à `0`
   - Overlay `rgba(0,0,0,0.5)` fade in/out
   - Max-height : 80% de la viewport (permet de voir un peu du contenu derrière)
   - PanResponder : swipe down > 50px → close
   - z-index > drawer (cf. Epic 100)

6. **Variant auto** : détecte breakpoint (< 640 → sheet, ≥ 640 → inline).

7. **Badge count** actifs : si `activeCount > 0`, bouton trigger affiche le count dans un badge gold.

8. **Accessibility** :
   - Focus trap quand sheet ouverte
   - Escape ferme
   - aria-label sur bouton trigger

9. **Tokens `@aureak/theme` uniquement**.

10. **Conformité CLAUDE.md** : tsc OK, try/finally si setters.

11. **Test Playwright** :
    - Page pilote (`/academie/coaches` avec FilterSheet intégré)
    - Viewport 375×667 : bouton Filtres visible
    - Tap bouton → sheet slide up, filtres visibles
    - Tap overlay → sheet se ferme
    - Swipe down → sheet se ferme
    - Viewport 1440×900 : filtres inline, pas de bouton trigger

12. **Non-goals** :
    - **Pas de logique métier de filtrage** (responsabilité de la page consommatrice)
    - **Pas de persistance filtres** (scope page consommatrice)
    - **Pas d'intégration avec DataCard** (composants orthogonaux)

## Tasks / Subtasks

- [x] **T1 — Composant `<FilterSheet />`** (AC #1, #2)
- [x] **T2 — Variant inline** (AC #3)
- [x] **T3 — Variant sheet mobile** (AC #4, #5)
  - [x] Animation slide-up
  - [x] Overlay
  - [x] PanResponder swipe down
- [x] **T4 — Badge count** (AC #7)
- [x] **T5 — A11y** (AC #8)
- [x] **T6 — QA + pilote** (AC #9-11)

## Completion Notes

- Implémentation custom (pas de `@gorhom/bottom-sheet` — absent des deps, usage simple)
- Sheet monté via `<Modal transparent>` RN — nécessaire sur RN-web car le parent ScrollView applique un `transform` qui capture `position: fixed` (nouveau containing block). Le Modal monte au root, contournant la hierarchy. Pattern identique à `AdminTopbar` (ProfileMenu, SearchOverlay).
- z-index interne Modal : overlay 60 / sheet 70 (> drawer Epic 100 qui utilise 40/50, bien que Modal root isole déjà visuellement).
- Variant auto : breakpoint 640px (aligné sur DataCard 101.1 et AdminTopbar mobile).
- Pilote : `/academie/coachs` — FilterSheet wrap la `FiltresRow` (pill TOUS + toggle COACH/ASSISTANT). `activeCount` = `roleFilter === 'all' ? 0 : 1`. `onReset` remet le filtre sur 'all' et reset la page.
- DataCard de 101.1 non impacté (composants orthogonaux — AC #12 respecté).
- Playwright QA : 1440 (inline), 768 (inline, 768 ≥ 640), 375 (trigger + sheet + overlay + badge + escape) — tous verts, zéro nouvelle erreur console (les 4 erreurs 406 Supabase sur `coach_current_grade` sont pré-existantes à la story).

## Dev Notes

### Pattern bottom sheet RN

Référence : `@gorhom/bottom-sheet` (lib populaire). Si déjà dépendance → l'utiliser. Sinon implémentation custom suffit pour ce cas simple (1 sheet, 1 snap point à 80%).

### Animation

```tsx
const translateY = useRef(new Animated.Value(screenHeight)).current

const open = () => Animated.timing(translateY, {
  toValue: screenHeight * 0.2,  // 80% depuis le bas
  duration: 250,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
}).start()

const close = () => Animated.timing(translateY, {
  toValue: screenHeight,
  duration: 200,
  easing: Easing.in(Easing.cubic),
  useNativeDriver: true,
}).start(() => setIsOpen(false))
```

### Handle visuel

Ajouter une barre horizontale 40×4px grise en haut du sheet pour indiquer "tirable" — pattern iOS/Material.

### References

- Tokens : `@aureak/theme`
- Pattern similaire Epic 100.1 (drawer) — réutiliser les gestures si possible
- Pages à intégrer Epic 103
