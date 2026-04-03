# Story 39-3 — Forms: auto-save brouillon

**Epic:** 39
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux que mes saisies en cours soient automatiquement sauvegardées localement afin de ne pas perdre mon travail si je ferme accidentellement la page ou si la session expire.

## Acceptance Criteria
- [ ] AC1: Un hook `useDraftSave(key: string, value: unknown, delay?: number)` existe dans `apps/web/lib/`
- [ ] AC2: Le hook persiste `value` en `localStorage` toutes les `delay` ms (défaut: 10000ms)
- [ ] AC3: Le hook expose `restoredDraft: T | null` et `clearDraft: () => void`
- [ ] AC4: Si un brouillon est trouvé en localStorage au montage du composant, un banner "Brouillon restauré — il y a X minutes" s'affiche avec bouton "Ignorer"
- [ ] AC5: Le brouillon est effacé automatiquement après une soumission réussie (`clearDraft()` dans le `finally` du handleSubmit)
- [ ] AC6: `stages/new.tsx` intègre `useDraftSave` avec key `draft-stage-new`
- [ ] AC7: `seances/new.tsx` intègre `useDraftSave` avec key `draft-seance-new`
- [ ] AC8: Le banner est visuellement discret (style info, pas bloquant)

## Tasks
- [ ] Créer `aureak/apps/web/lib/useDraftSave.ts` — hook générique: `setInterval` pour save, `localStorage.getItem` au mount pour restore, `clearDraft` pour cleanup
- [ ] Créer `aureak/apps/web/components/DraftBanner.tsx` — banner avec message "Brouillon restauré" + bouton "Ignorer" (appelle clearDraft + dismiss)
- [ ] Modifier `aureak/apps/web/app/(admin)/stages/new.tsx` — intégrer `useDraftSave('draft-stage-new', formState)`, afficher `<DraftBanner>` si `restoredDraft`, appeler `clearDraft()` dans finally du submit
- [ ] Modifier `aureak/apps/web/app/(admin)/seances/new.tsx` — même intégration avec key `draft-seance-new`
- [ ] Vérifier QA: `clearDraft` bien dans le `finally` (pas inline), console guards présents

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/lib/useDraftSave.ts` (nouveau)
  - `aureak/apps/web/components/DraftBanner.tsx` (nouveau)
  - `aureak/apps/web/app/(admin)/stages/new.tsx`
  - `aureak/apps/web/app/(admin)/seances/new.tsx`
- `localStorage` disponible sur web uniquement — wrapper conditionnel: `if (typeof window !== 'undefined')`
- Sérialisation: `JSON.stringify` / `JSON.parse` avec try/catch (localStorage peut être corrompu)
- Calcul "il y a X minutes": stocker `savedAt: Date.toISOString()` dans le payload du localStorage
- Style banner: fond `colors.status.success` à 15% opacité, bordure `colors.status.success`, padding 12px, `borderRadius: tokens.radius.xs`
- Pas de migration Supabase nécessaire
- ATTENTION: ne pas sauvegarder de données sensibles (mots de passe, tokens) — uniquement les champs de formulaire métier
