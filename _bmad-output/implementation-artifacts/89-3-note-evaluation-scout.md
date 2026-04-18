# Story 89.3 : Note evaluation scout

Status: done

## Story

En tant que scout,
je veux pouvoir noter et evaluer un gardien prospect avec des criteres structures,
afin de fournir un avis documente pour la decision de recrutement.

## Acceptance Criteria

1. Une table `scout_evaluations` existe avec : `id`, `child_id` (FK child_directory), `scout_id` (FK profiles), `rating` (1-5), `notes` (text), `criteria` (jsonb), `created_at`, `deleted_at`, `tenant_id`
2. Un composant `StarRating` reutilisable est disponible dans `@aureak/ui`
3. La fiche gardien prospect affiche une section "Evaluations scout" avec la liste des evaluations
4. Un bouton "Ajouter une evaluation" ouvre un formulaire avec rating etoiles, criteres et notes
5. Les criteres JSON supportent au minimum : reflexes, positionnement, jeu_au_pied, communication, mental
6. Un scout peut creer plusieurs evaluations pour le meme gardien (suivi dans le temps)
7. Soft-delete uniquement

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase (AC: #1, #7)
  - [x] Creer `supabase/migrations/00154_create_scout_evaluations.sql`
  - [x] Table `scout_evaluations` avec toutes les colonnes
  - [x] FK vers `child_directory(id)` et `profiles(id)`
  - [x] RLS : admin et scout peuvent lire/ecrire, coach peut lire
  - [x] Index sur `child_id` et `scout_id`
- [x] Task 2 — Types TypeScript (AC: #1, #5)
  - [x] Ajouter type `ScoutEvaluation` dans `@aureak/types`
  - [x] Ajouter type `ScoutEvaluationCriteria` pour le JSON structure
- [x] Task 3 — API client (AC: #3, #4)
  - [x] `listScoutEvaluations(childId)` dans `@aureak/api-client/src/admin/scoutEvaluations.ts`
  - [x] `createScoutEvaluation(data)` dans le meme fichier
- [x] Task 4 — Composant StarRating (AC: #2)
  - [x] StarRating deja existant dans `@aureak/ui/src/StarRating.tsx` (Story 58-6)
  - [x] Props : `value`, `onChange` (undefined = readonly), `size`
  - [x] Etoiles cliquables avec hover
  - [x] Export depuis `@aureak/ui`
- [x] Task 5 — Section evaluations fiche prospect (AC: #3, #4, #6)
  - [x] Liste des evaluations existantes dans la fiche gardien
  - [x] Formulaire ajout avec StarRating + criteres + notes
  - [x] Try/finally sur setSaving

## Dev Notes

### Contraintes Stack
Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText, AureakButton, Badge, Card, Input
- **Acces Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Try/finally obligatoire** sur tout state setter de chargement
- **Console guards obligatoires** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

### Fichiers a creer / modifier
| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00149_create_scout_evaluations.sql` | Creer | Table + RLS + index |
| `aureak/packages/types/src/scoutEvaluation.ts` | Creer | Types |
| `aureak/packages/api-client/src/admin/scoutEvaluations.ts` | Creer | CRUD |
| `aureak/packages/ui/src/StarRating.tsx` | Creer | Composant etoiles |
| `aureak/apps/web/app/(admin)/prospection/gardiens/` | Modifier | Section evaluations |

### Dependencies
- Story 89-2 (formulaire scout gardien) doit etre `done`

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6 (1M context)
### Debug Log References
N/A
### Completion Notes List
- StarRating component already existed from Story 58-6 — reused as-is (readonly = onChange undefined)
- Migration numbered 00154 (story referenced 00149 but last migration was 00153)
- Created detail page for gardien prospect at `[childId]/page.tsx` with back navigation
- Pipeline table names now clickable (gold link) to navigate to detail page
- criteria JSON stores `jeu_au_pied` in snake_case DB, mapped to `jeuAuPied` in camelCase TS
### File List
- `supabase/migrations/00154_create_scout_evaluations.sql`
- `aureak/packages/types/src/entities.ts` (added ScoutEvaluation types)
- `aureak/packages/api-client/src/admin/scoutEvaluations.ts` (new)
- `aureak/packages/api-client/src/index.ts` (exports)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/_components/ScoutEvaluationSection.tsx` (new)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/[childId]/page.tsx` (new)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/[childId]/index.tsx` (new)
- `aureak/apps/web/app/(admin)/developpement/prospection/gardiens/page.tsx` (modified — clickable names)
