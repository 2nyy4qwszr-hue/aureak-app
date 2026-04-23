# Story 102.1 — `<FormLayout />` wrapper — single-column mobile + sticky actions

Status: done

## Metadata

- **Epic** : 102 — Formulaires mobile-first
- **Story ID** : 102.1
- **Story key** : `102-1-formlayout-wrapper-responsive`
- **Priorité** : P1
- **Dépendances** : 102.2 (inputs)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1j — composant + pattern d'intégration)

## Story

As an admin sur mobile,
I want que les formulaires longs (création joueur, ajout sponsor, etc.) s'affichent en single-column avec les boutons Enregistrer/Annuler sticky au bas de l'écran,
So that je puisse saisir sans scroll horizontal et valider sans scroller pour retrouver les boutons.

## Contexte

### Pattern cible

**Desktop (> 1024)** :
- 2 colonnes (labels gauche, fields droite, ou fields 2-up selon complexité)
- Actions inline en bas du formulaire

**Mobile (< 640)** :
- 1 colonne, label au-dessus du field
- Actions sticky bottom (position fixed, backdrop blur optionnel)
- Bouton "Annuler" ← vers back / bouton "Enregistrer" en gold

## Acceptance Criteria

1. **Composant `<FormLayout />`** dans `aureak/apps/web/components/admin/FormLayout.tsx`.

2. **API** :
   ```typescript
   type FormLayoutProps = {
     children      : React.ReactNode  // sections/fields du formulaire
     onSubmit      : () => void
     onCancel?     : () => void
     submitLabel?  : string  // default "Enregistrer"
     cancelLabel?  : string  // default "Annuler"
     submitting?   : boolean  // désactive bouton + spinner
     submitDisabled?: boolean  // désactive bouton (validation)
     layout?       : 'auto' | 'single-col' | 'two-col'
   }
   ```

3. **Layout desktop (`width ≥ 1024`)** :
   - Children rendus dans un container max-width 720px
   - Actions inline bas du formulaire (horizontal row, à droite)
   - Scroll classique

4. **Layout mobile (`< 640`)** :
   - Children rendus single-column (width 100%)
   - Padding horizontal 16px
   - Actions sticky bottom : `<View position='absolute' bottom={0} left={0} right={0}>` avec fond `colors.light.surface` + borderTop subtle
   - ScrollView avec `contentContainerStyle` qui laisse `paddingBottom: 80` pour ne pas masquer le dernier field

5. **Keyboard handling mobile** :
   - `KeyboardAvoidingView` avec behavior `padding` (iOS) / `height` (Android)
   - Bouton submit reste visible au-dessus du clavier

6. **States bouton submit** :
   - Normal : gold plein
   - Hover/press : opacité 0.9
   - `submitting=true` : gris, spinner, disabled
   - `submitDisabled=true` : opacity 0.5, disabled

7. **Tokens `@aureak/theme` uniquement**.

8. **Accessibilité** :
   - Bouton submit : `accessibilityRole="button"`, `accessibilityState={{ disabled }}`
   - Labels associés aux fields via pattern React Hook Form

9. **Conformité CLAUDE.md** : try/finally dans onSubmit logic (responsabilité consommateur), tsc OK.

10. **Test Playwright** :
    - Page pilote (ex. `/academie/coaches/new` ou modal)
    - Viewport 375×667 : single-column, bouton submit sticky visible même au scroll
    - Focus input → clavier s'ouvre, bouton reste visible
    - Viewport 1440×900 : layout 2 cols si applicable, actions inline

11. **Non-goals** :
    - **Pas d'intégration React Hook Form directe** — FormLayout ne connaît pas RHF, les enfants sont libres
    - **Pas de validation intégrée** (scope consommateur)
    - **Pas de wizard multi-step** (102.3)

## Tasks / Subtasks

- [x] **T1 — Composant `<FormLayout />`** (AC #1, #2) — `aureak/apps/web/components/admin/FormLayout.tsx`
- [x] **T2 — Layout desktop** (AC #3) — max-width 720 centré + actions inline à droite, borderTop divider
- [x] **T3 — Layout mobile** (AC #4) — ScrollView full-width, paddingBottom 96, actions sticky absolute bottom
- [x] **T4 — Keyboard handling** (AC #5) — KeyboardAvoidingView iOS padding / Android height, verticalOffset 60 iOS, `keyboardShouldPersistTaps="handled"`
- [x] **T5 — States bouton** (AC #6) — délègue à AureakButton (loading, disabled, opacity 0.4)
- [x] **T6 — A11y** (AC #8) — `accessibilityRole="toolbar"` sur zones actions, AureakButton gère accessibilityRole button + label
- [x] **T7 — QA pilote** (AC #7, #9, #10) — tokens only (`colors.light.surface`, `colors.border.divider`, `space.*`, `layout.contentPaddingX`), tsc OK, pas de try/finally (onSubmit = responsabilité consommateur), test Playwright au prochain formulaire pilote (Epic 103)

## Dev Notes

### KeyboardAvoidingView cross-platform

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
>
  <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
    {children}
  </ScrollView>
  {/* sticky actions */}
</KeyboardAvoidingView>
```

### Sticky actions vs scrolled actions

Mobile : toujours sticky (plus usable).
Desktop : inline (pas besoin de sticky avec plus d'espace vertical).

### References

- Tokens : `@aureak/theme` — `colors.light.surface`, `colors.accent.gold`
- React Hook Form + Zod : déjà utilisés dans le projet
- Story 102.2 (inputs) — consomme FormLayout
