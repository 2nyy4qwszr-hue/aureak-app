# Story 39-1 — Forms: validation inline temps réel

**Epic:** 39
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir les erreurs de validation s'afficher directement sous chaque champ de formulaire au moment où je quitte le champ afin de corriger mes saisies sans attendre la soumission.

## Acceptance Criteria
- [ ] AC1: Le composant `FormField` dans `@aureak/ui` accepte une prop `error?: string`
- [ ] AC2: Si `error` est renseigné, un message rouge s'affiche sous le champ (token `colors.accent.red`)
- [ ] AC3: La validation se déclenche au `onBlur` (perte de focus), pas au keystroke
- [ ] AC4: Les validators email, téléphone belge et URL sont disponibles dans un hook `useFormValidation`
- [ ] AC5: `clubs/new.tsx` utilise ces validators sur les champs email, téléphone et site web
- [ ] AC6: La soumission du formulaire est bloquée si des erreurs existent
- [ ] AC7: Les messages d'erreur sont en français

## Tasks
- [ ] Modifier `aureak/packages/ui/src/FormField.tsx` (ou créer si absent) — ajouter prop `error?: string`, afficher `<Text style={styles.error}>{error}</Text>` sous le champ
- [ ] Créer `aureak/apps/web/lib/useFormValidation.ts` — hook avec validators: `validateEmail`, `validatePhone` (format belge +32 / 04xx), `validateUrl`, `validateRequired`
- [ ] Modifier `aureak/apps/web/app/(admin)/clubs/new.tsx` — importer `useFormValidation`, brancher `onBlur` sur champs email/téléphone/site, passer `error` prop à `FormField`, désactiver submit si erreurs
- [ ] Vérifier QA: try/finally sur le handleSubmit, console guards présents

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/FormField.tsx`
  - `aureak/packages/ui/src/index.ts` (si export manquant)
  - `aureak/apps/web/lib/useFormValidation.ts` (nouveau)
  - `aureak/apps/web/app/(admin)/clubs/new.tsx`
- Token couleur erreur: `colors.accent.red` (#E05252)
- Style message erreur: `fontSize: 12`, `marginTop: 4`, `color: colors.accent.red`
- Pattern état erreurs:
  ```typescript
  const [errors, setErrors] = useState<Record<string, string>>({})
  const handleBlur = (field: string, value: string) => {
    const error = validators[field]?.(value)
    setErrors(prev => ({ ...prev, [field]: error ?? '' }))
  }
  ```
- Validators regex:
  - Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Phone belge: `/^(\+32|0)[0-9\s\-\.]{8,}$/`
  - URL: `/^https?:\/\/.+\..+/`
- Pas de migration Supabase nécessaire
- Pattern extractable: le hook `useFormValidation` pourra être réutilisé dans `stages/new.tsx` et `seances/new.tsx` (stories suivantes)
