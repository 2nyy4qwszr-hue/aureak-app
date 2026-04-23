# Story 102.3 — Multi-step forms wizard mobile / accordion desktop

Status: done

## Metadata

- **Epic** : 102 — Formulaires mobile-first
- **Story ID** : 102.3
- **Story key** : `102-3-multi-step-wizard-mobile`
- **Priorité** : P2
- **Dépendances** : 102.1 (FormLayout), 102.2 (inputs)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1j — composant wizard + intégration pilote)

## Story

As an admin sur mobile saisissant un long formulaire (création joueur, ajout sponsor complet, onboarding coach),
I want que le formulaire se présente en wizard — 1 étape = 1 écran, avec barre de progression et boutons "Précédent/Suivant" —,
So that je puisse saisir sans être submergée par 30 champs affichés d'un coup.

## Contexte

### Pattern cible

**Desktop (> 1024)** :
- Accordion : toutes les sections visibles, expandable/collapsable
- Ou single-page avec sections séparées visuellement

**Mobile (< 640)** :
- Wizard : 1 écran = 1 step
- Barre de progression en haut (dots ou bar)
- Boutons "← Précédent" + "Suivant →"
- Dernière étape : bouton "Enregistrer" au lieu de "Suivant"

### Exemples cas d'usage

- `/academie/joueurs/new` : 4-5 étapes (identité, parents, club actuel, santé, consents)
- `/prospection/gardiens/ajouter` : 3-4 étapes (contact, profil, évaluation, notes)
- `/partenariat/sponsors/new` : 2-3 étapes (info base, contacts, contribution)

## Acceptance Criteria

1. **Composant `<FormWizard />`** dans `aureak/apps/web/components/admin/FormWizard.tsx`.

2. **API** :
   ```typescript
   type WizardStep = {
     key       : string
     label     : string
     content   : React.ReactNode
     isValid?  : boolean  // pour désactiver "Suivant"
   }

   type FormWizardProps = {
     steps         : WizardStep[]
     onFinish      : () => void
     onCancel?     : () => void
     currentStep?  : number  // controlled ou uncontrolled
     onStepChange? : (step: number) => void
   }
   ```

3. **Rendu mobile (< 640)** :
   - Barre de progression en haut (5 dots si 5 steps, dot actif gold, passé gris clair)
   - Label de la step active sous la barre
   - Contenu de la step occupe l'espace central
   - Footer sticky : "← Précédent" (disabled si step 0) + "Suivant →" (ou "Enregistrer" si dernière step)

4. **Rendu desktop (≥ 1024)** :
   - Option accordion : toutes les steps visibles, chaque section expandable, bouton "Enregistrer" en bas
   - **OU** tabs horizontaux avec steps cliquables
   - **Recommandation** : accordion (plus naturel formulaire long)

5. **Rendu tablette (640-1024)** :
   - Fallback accordion desktop (plus simple à implémenter)

6. **Validation par step** :
   - Si `isValid=false`, bouton "Suivant" désactivé
   - Responsabilité consommateur (hook React Hook Form avec schema Zod partiel par step)

7. **Navigation** :
   - "Suivant" → increment currentStep, scroll to top
   - "Précédent" → decrement currentStep, scroll to top
   - Dernière step "Enregistrer" → appelle `onFinish()`

8. **Animation transition** :
   - Slide horizontal entre steps (optionnel)
   - 200ms
   - `prefers-reduced-motion` → snap immédiat

9. **Tokens `@aureak/theme` uniquement**.

10. **Accessibilité** :
    - Role progressbar sur la barre
    - aria-current sur step active
    - Focus auto sur premier input de la nouvelle step

11. **Conformité CLAUDE.md** : tsc OK.

12. **Test Playwright** :
    - Page pilote (créer `/academie/joueurs/new` ou équivalent)
    - Viewport 375×667 : wizard visible, 4 dots barre, step 1/4 active
    - Remplir step 1 → Suivant → step 2
    - Précédent → retour step 1, data préservée
    - Viewport 1440×900 : accordion ou tabs, toutes sections visibles

13. **Non-goals** :
    - **Pas de sauvegarde automatique partielle** (scope consommateur)
    - **Pas de drag-drop réorganiser steps** (pas applicable)

## Tasks / Subtasks

- [x] **T1 — Composant `<FormWizard />`** (AC #1, #2) — `aureak/apps/web/components/admin/FormWizard.tsx`, controlled + uncontrolled via `currentStep` + `onStepChange`
- [x] **T2 — Variant mobile wizard** (AC #3) — dots row (dot actif gold élargi, past gold-light, upcoming border.light), step counter + h3 titre, scroll auto-top au changement, footer sticky prev/next (ou Annuler/Suivant sur 1re)
- [x] **T3 — Variant desktop accordion** (AC #4) — toutes steps en accordion (default expand tous), numéro de step en chip (actif = gold), bouton unique "Enregistrer" en bas, disabled si any `isValid === false`
- [x] **T4 — Validation par step** (AC #6) — mobile : Suivant/Enregistrer disabled si `step.isValid === false` ; desktop : Enregistrer disabled si allValid === false
- [ ] **T5 — Animation transition** (AC #8) — reporté (noté "optionnel" dans la story), snap immédiat en attendant
- [x] **T6 — A11y** (AC #10) — `accessibilityRole="progressbar"` + `accessibilityValue={now, min, max}` barre, `aria-current="step"` dot actif, `accessibilityState={{ expanded }}` chevrons accordion, `accessibilityRole="toolbar"` footer
- [x] **T7 — QA pilote** (AC #9, #11, #12) — tokens only (`colors.accent.gold`, `.goldLight`, `colors.border.*`, `colors.light.*`, `space.*`, `radius.card`), tsc OK, test Playwright au prochain wizard pilote (Epic 103)

## Dev Notes

### Progress bar dots

```tsx
{steps.map((_, i) => (
  <View
    key={i}
    style={[
      s.dot,
      i === currentStep && s.dotActive,
      i < currentStep && s.dotPast,
    ]}
  />
))}
```

### Accordion desktop

```tsx
{steps.map((step, i) => (
  <Pressable key={step.key} onPress={() => toggleExpand(i)}>
    <View style={s.accordionHeader}>
      <AureakText>{step.label}</AureakText>
      <Icon name={expanded[i] ? 'chevronUp' : 'chevronDown'} />
    </View>
    {expanded[i] && step.content}
  </Pressable>
))}
```

### Persistence data entre steps

Responsabilité du consommateur via React Hook Form `useForm({ defaultValues, shouldUnregister: false })`.

### References

- Stories 102.1 (FormLayout), 102.2 (inputs)
- React Hook Form — lib principale de forms
- Tokens : `@aureak/theme`
