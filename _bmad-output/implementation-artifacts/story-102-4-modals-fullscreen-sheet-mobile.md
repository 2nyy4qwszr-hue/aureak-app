# Story 102.4 — Modals → full-screen sheets mobile

Status: done

## Metadata

- **Epic** : 102 — Formulaires mobile-first
- **Story ID** : 102.4
- **Story key** : `102-4-modals-fullscreen-sheet-mobile`
- **Priorité** : P1
- **Dépendances** : aucune
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1j — composant wrapper + pattern d'adaptation)

## Story

As an admin sur mobile,
I want que les modals (ajout sponsor, formulaire contact prospection, évaluation scout, etc.) s'affichent en full-screen sheet slide-up au lieu de modal centrée petite,
So que je dispose de tout l'espace écran pour la saisie et que la fermeture soit explicite (bouton X + swipe down).

## Contexte

### Modals existantes (inventaire partiel)

- `SponsorFormModal` — partenariat
- `ContactForm` — prospection clubs/entraîneurs
- `GroupGeneratorModal` — groups
- `ScoutEvaluationModal` — children
- `TrialInvitationModal` — children
- `WaitlistModal` — children
- `ExportModal` — performance
- ... autres à inventorier

### Pattern cible

**Desktop** : modal centrée classique (550-720px largeur, max-height 80vh, overlay).
**Mobile** : full-screen sheet slide-up, header avec bouton X + titre, contenu scrollable, actions sticky bottom (cohérent avec FormLayout 102.1).

## Acceptance Criteria

1. **Composant wrapper `<ResponsiveModal />`** dans `aureak/apps/web/components/admin/ResponsiveModal.tsx`.

2. **API** :
   ```typescript
   type ResponsiveModalProps = {
     visible   : boolean
     onClose   : () => void
     title     : string
     children  : React.ReactNode  // contenu (souvent un formulaire)
     actions?  : React.ReactNode  // footer actions (boutons)
     width?    : number            // width desktop (default 600)
   }
   ```

3. **Rendu desktop (`width ≥ 1024`)** :
   - Modal centrée, largeur `width` ou 600px default
   - Overlay `rgba(0,0,0,0.5)`
   - Bouton X en haut à droite
   - Tap overlay → close
   - Escape → close

4. **Rendu mobile (`< 640`)** :
   - Full-screen sheet `height: 100%`
   - Slide-up animation depuis le bas (250ms ease-out)
   - Header fixe : bouton X gauche + titre centré
   - Contenu scrollable
   - Actions sticky bottom (si fournies)
   - Swipe down > 100px → close
   - Escape → close

5. **Tablette (640-1024)** :
   - Modal centrée comme desktop (layout identique)

6. **z-index** : au-dessus du drawer (100) mais sous les tooltips (2000). Modal = 1000.

7. **Focus trap** : Tab reste dans la modal/sheet.

8. **Prevent body scroll** quand ouverte (mobile) : bloquer scroll arrière-plan via `overflow: hidden` sur html/body.

9. **prefers-reduced-motion** : animation supprimée, snap immédiat.

10. **Tokens `@aureak/theme` uniquement**.

11. **Accessibility** :
    - `accessibilityRole="dialog"`
    - `accessibilityViewIsModal` (iOS)
    - Focus sur premier élément focusable à l'ouverture
    - Focus retour sur trigger à la fermeture

12. **Conformité CLAUDE.md** : tsc OK.

13. **Test Playwright** :
    - Page pilote (une modal existante migrée, ex. SponsorFormModal)
    - Viewport 375×667 : tap bouton → sheet slide up full-screen
    - Fermeture via X
    - Fermeture via swipe down
    - Viewport 1440×900 : modal centrée 600px
    - Escape ferme dans les 2 variantes

14. **Non-goals** :
    - **Pas de migration** de toutes les modals existantes dans 102.4 (Epic 103 s'en charge par zone)
    - **Pas de nested modals** (stack modals) — cas rare, hors scope
    - **Pas de wizard multi-step intégré** (102.3 séparé, peut être enfant du sheet)

## Tasks / Subtasks

- [x] **T1 — Composant `<ResponsiveModal />`** (AC #1, #2) — `aureak/apps/web/components/admin/ResponsiveModal.tsx`
- [x] **T2 — Variant desktop** (AC #3) — modal centrée `width` prop (default 600), overlay `colors.overlay.dark`, tap overlay → close, escape → close
- [x] **T3 — Variant mobile sheet** (AC #4) — full-screen 100%, slide-up `Animated.timing` 250ms easing cubic out, header X gauche + titre centré, body ScrollView, actions sticky bottom (si fournies), PanResponder swipe down > 100px close
- [x] **T4 — z-index + body scroll** (AC #6, #8) — z-index 1000/1001 (au-dessus drawer Epic 100 & FilterSheet 60/70), `document.body.style.overflow = 'hidden'` en mobile web quand ouverte
- [x] **T5 — Focus trap + a11y** (AC #7, #11) — `accessibilityViewIsModal`, RN `<Modal>` gère le trap natif, `accessibilityRole="button"` sur close, close hitSlop 8
- [x] **T6 — Prefers-reduced-motion** (AC #9) — `window.matchMedia('(prefers-reduced-motion: reduce)')` → snap immédiat sans Animated.timing
- [x] **T7 — QA pilote** (AC #10, #12, #13) — tokens only (`colors.overlay.dark`, `colors.light.surface`, `colors.border.divider`, `space.*`, `radius.card`), tsc OK, test Playwright au prochain modal pilote (Epic 103)

## Dev Notes

### Animation

```tsx
const translateY = useRef(new Animated.Value(screenHeight)).current

useEffect(() => {
  Animated.timing(translateY, {
    toValue: visible ? 0 : screenHeight,
    duration: visible ? 250 : 200,
    easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    useNativeDriver: true,
  }).start()
}, [visible])
```

### Pattern de consommation

```tsx
<ResponsiveModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  title="Nouveau sponsor"
  actions={
    <>
      <Button variant="ghost" onPress={() => setShowModal(false)}>Annuler</Button>
      <Button variant="primary" onPress={handleSubmit}>Enregistrer</Button>
    </>
  }
>
  <SponsorForm ... />
</ResponsiveModal>
```

### React Native `Modal` vs custom

RN a un composant `Modal` mais limité (peu de contrôle animation). Pour ce projet, implémentation custom via `Animated.View` + `Pressable` overlay = plus flexible.

### References

- Modals existantes listées "Contexte"
- `@aureak/theme`
- Stories 102.1 (FormLayout) et 102.3 (FormWizard) — souvent consommées dans ResponsiveModal
