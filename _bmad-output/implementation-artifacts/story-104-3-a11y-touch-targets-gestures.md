# Story 104.3 — A11y mobile : touch targets + contrastes + gestures

Status: done

## Metadata

- **Epic** : 104 — QA devices + perf + a11y mobile
- **Story ID** : 104.3
- **Story key** : `104-3-a11y-touch-targets-gestures`
- **Priorité** : P2 (passe finale)
- **Dépendances** : 104.1 + 104.2
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : S (~0.5-1j — audit + correctifs)

## Story

As an admin utilisateur (éventuellement avec besoin d'accessibilité),
I want que l'admin mobile respecte les standards d'accessibilité — touch targets ≥ 44×44px, contrastes WCAG AA, focus visible, gestures alternatives —,
So que l'app soit utilisable par tous et que Lighthouse Accessibility atteigne ≥ 95.

## Contexte

### Cibles

- **Touch targets** : tous éléments interactifs ≥ 44×44px (Apple HIG) ou 48×48dp (Material)
- **Contrastes** : WCAG AA → 4.5:1 texte normal, 3:1 texte large (18pt+) et UI components
- **Focus** : visible au clavier (Tab / Bluetooth keyboard mobile)
- **Gestures** : pas de gesture-only action (alternative tap obligatoire)
- **Lighthouse Accessibility** : ≥ 95

## Acceptance Criteria

1. **Audit touch targets** :
   - Grep `<Pressable>`, `<TouchableOpacity>`, `<Button>` dans `components/admin/` et pages
   - Vérifier `style` ou `hitSlop` garantit ≥ 44×44
   - Corriger fichiers en défaut

2. **Audit contrastes** :
   - Lancer Lighthouse Accessibility sur 5 pages baseline
   - Corriger les couleurs qui échouent le ratio (ex. texte gris clair sur fond clair)
   - Respecter tokens `@aureak/theme` uniquement (ne pas introduire de nouveau gris)

3. **Focus visible** :
   - Vérifier ring focus sur inputs, boutons, liens navigables au Tab
   - Respecter `outline: 2px solid gold` ou équivalent token

4. **Gestures alternatives** :
   - Drawer mobile : swipe right ferme (100.1), MAIS tap overlay également (AC #6 de 100.1 ✅)
   - Bottom sheets : swipe down ferme, MAIS bouton X ou tap overlay également (AC #4 de 102.4 ✅)
   - Wizard : pas de swipe-only pour naviguer entre steps (boutons Précédent/Suivant obligatoires — AC #3 de 102.3 ✅)
   - **Vérifier chaque gesture a son alternative**

5. **ARIA labels** :
   - `accessibilityLabel` sur tous boutons icône-only (burger, search, close, FAB)
   - `accessibilityRole` correct (button, link, dialog, list, listitem)
   - `accessibilityState` (disabled, expanded, selected)

6. **prefers-reduced-motion** :
   - Animations sidebar drawer, bottom sheets, wizard transitions → respect `useReducedMotion` hook
   - Snap immédiat si activé

7. **Contraste dark mode (sidebar anthracite)** :
   - Vérifier texte blanc sur fond anthracite ≥ 4.5:1 (normalement 15:1 OK)
   - Texte gris clair `colors.text.onDark` ≥ 4.5:1

8. **Lighthouse Accessibility ≥ 95** sur les 5 pages cibles (mêmes que 104.2).

9. **Screen reader test (optionnel mais recommandé)** :
   - VoiceOver iOS ou TalkBack Android : naviguer sidebar + une page
   - Vérifier labels parlent correctement

10. **Rapport QA a11y** : `_bmad-output/qa-reports/epic-104-3-a11y-report.md` avec :
    - Checklist cibles atteintes/non-atteintes
    - Liste bugs corrigés
    - Score Lighthouse Accessibility final

11. **Non-goals** :
    - **Pas de dark mode complet** (sidebar seule)
    - **Pas de language switch accessibility** (hors scope)
    - **Pas de voice control** (hors scope)

## Tasks / Subtasks

- [x] **T1 — Audit touch targets** → topbar (3 variants) 36/40 → 44, FilterSheet resetBtn 36 → 44
- [x] **T2 — Audit contrastes** → `text.subtle` #A1A1AA → #71717A (WCAG AA 4.83:1)
- [x] **T3 — Focus visible** → héritage React Native Web :focus-visible OK
- [x] **T4 — Gestures alternatives** → acquis Epics 100/102 (drawer tap overlay, sheet bouton X)
- [x] **T5 — ARIA labels** → `accessibilityLabel` déjà présent sur tous icons-only topbar
- [x] **T6 — prefers-reduced-motion** → acquis Story 100.1 (`_layout.tsx` useReducedMotion)
- [x] **T7 — Lighthouse A11y ≥ 95** → **100/100** ✅
- [ ] **T8 — Screen reader test (optionnel)** → recommandé VoiceOver/TalkBack avant release
- [x] **T9 — Rapport QA** → `_bmad-output/qa-reports/epic-104-3-a11y-report.md`

## Dev Notes

### hitSlop pour icônes petites

```tsx
<Pressable hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
  <Icon name="search" size={24} />
</Pressable>
```

hitSlop élargit la zone tactile sans agrandir visuellement.

### prefers-reduced-motion hook

```tsx
import { useReducedMotion } from 'react-native-reanimated'

const reducedMotion = useReducedMotion()
const duration = reducedMotion ? 0 : 250
```

Sur web : `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

### Lighthouse Accessibility

Dans le rapport JSON, chercher les items "failed" de la catégorie accessibility. Top causes habituelles :
- `[aria-*]` invalid attributes
- Background and foreground colors do not have sufficient contrast
- Image elements do not have [alt] attributes
- Form elements do not have associated labels

### References

- WCAG 2.1 AA : https://www.w3.org/WAI/WCAG21/quickref/
- Apple HIG touch target : https://developer.apple.com/design/human-interface-guidelines/accessibility
- Material Design a11y : https://m3.material.io/foundations/accessible-design/overview
