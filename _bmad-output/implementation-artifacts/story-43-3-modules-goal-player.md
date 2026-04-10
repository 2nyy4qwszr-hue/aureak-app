# Story 43.3 : Modules structurés dans un entraînement Goal & Player

Status: done

## Story

En tant qu'admin,
je veux définir 3 modules numérotés dans un entraînement Goal & Player,
afin d'organiser les exercices par thème avec une plage de numéros cohérente.

## Acceptance Criteria

1. Dans le formulaire de création/édition d'entraînement (`methodologie/seances/new.tsx`), si la méthode est "Goal & Player", une section "Modules" apparaît avec 3 modules pré-remplis
2. Chaque module a : un numéro (1/2/3), un titre éditable (ex: "Tir au but"), une plage d'exercices auto-calculée (Module 1 = 1-5, Module 2 = 6-10, Module 3 = 11-15)
3. Les titres des modules sont éditables mais la numérotation est fixe (5 exercices par module)
4. Les modules sont sauvegardés dans le champ `notes` ou un nouveau champ JSON `modules` sur la table `methodology_sessions`
5. Les modules s'affichent dans la fiche détail de l'entraînement (`methodologie/seances/[sessionId]/page.tsx`)
6. Si la méthode n'est pas "Goal & Player", la section Modules n'apparaît pas

## Technical Tasks

- [x] Lire `aureak/apps/web/app/(admin)/methodologie/seances/new.tsx`
- [x] Lire `aureak/apps/web/app/(admin)/methodologie/seances/[sessionId]/page.tsx`
- [x] Lire `aureak/packages/types/src/entities.ts` — type `MethodologySession`
- [x] Vérifier si un champ `modules` existe sur `methodology_sessions` — sinon utiliser le champ `notes` avec format JSON `[{num:1, titre:"...", range:"1-5"}, ...]`
- [x] Si migration nécessaire : `ALTER TABLE methodology_sessions ADD COLUMN IF NOT EXISTS modules JSONB`
- [x] Ajouter la section Modules dans le formulaire — conditionnelle sur `method === 'Goal & Player'`
- [x] 3 champs titre éditables avec labels fixes "Module 1 (ex. 1→5)", "Module 2 (ex. 6→10)", "Module 3 (ex. 11→15)"
- [x] Sauvegarder via l'API `updateMethodologySession` ou `createMethodologySession`
- [x] Afficher les modules dans la fiche détail
- [x] Vérifier TypeScript

## Files

- `aureak/apps/web/app/(admin)/methodologie/seances/new.tsx` (modifier)
- `aureak/apps/web/app/(admin)/methodologie/seances/[sessionId]/page.tsx` (modifier)
- `supabase/migrations/NNNNN_methodology_sessions_modules.sql` (si champ manquant)
- `aureak/packages/types/src/entities.ts` (si type à étendre)

## Dependencies

- story-43-1 doit être `done` (même module méthodologie)
