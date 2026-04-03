# Story 24.6 : Mini-Exercices Terrain — Liaison optionnelle à une séquence

Status: done

## Story

En tant qu'admin,
je veux lier des mini-exercices terrain optionnellement à une séquence (en plus du critère déjà existant),
afin d'organiser les exercices dans la progression pédagogique des séquences.

## Acceptance Criteria

1. La colonne `theme_mini_exercises.sequence_id UUID NULL FK(theme_sequences ON DELETE SET NULL)` est ajoutée. C'est la **seule** modification de schéma requise pour cette story.
2. `theme_mini_exercises.criterion_id` est déjà nullable (ON DELETE SET NULL depuis migration 00056) — **aucune modification** nécessaire sur ce champ.
3. `theme_mini_exercises.theme_id` existe déjà (NOT NULL depuis migration 00056) — **aucune modification** nécessaire sur ce champ.
4. Un mini-exercice peut être créé sans séquence ni critère.
5. Un mini-exercice peut être lié à une séquence, un critère, les deux, ou aucun — pas de contrainte d'exclusivité (contrairement aux critères).
6. L'API `createThemeMiniExercise` accepte `sequenceId?: string | null` en plus de `criterionId`.
7. L'API `updateThemeMiniExercise` accepte `sequenceId?: string | null`.
8. `listThemeMiniExercises` retourne `sequenceId` dans chaque objet (automatique avec `SELECT *`).
9. Le type TypeScript `ThemeMiniExercise` ajoute `sequenceId: string | null`.
10. `SectionMiniExercices.tsx` est mise à jour :
    - Prop `sequences: ThemeSequence[]` ajoutée
    - Sélecteur "Séquence liée" dans les formulaires création et édition
    - Badge séquence affiché sur chaque exercice si `sequenceId` présent
    - Le sélecteur critère existant reste inchangé

## Tasks / Subtasks

- [x] Migration DB (AC: #1)
  - [x] Numéro migration : **00082**
  - [x] `ALTER TABLE theme_mini_exercises ADD COLUMN IF NOT EXISTS sequence_id UUID NULL REFERENCES theme_sequences(id) ON DELETE SET NULL;`
  - [x] Index : `CREATE INDEX IF NOT EXISTS mini_exercises_seq_idx ON theme_mini_exercises (sequence_id);`
  - [x] ⚠ **NE PAS** ajouter de trigger `updated_at` — la table a déjà son trigger `theme_mini_exercises_updated_at` depuis migration 00056.
  - [x] ⚠ **NE PAS** ajouter `theme_id` ni modifier `criterion_id` — déjà conformes depuis 00056.

- [x] Types TypeScript (AC: #9)
  - [x] Dans `entities.ts` : `ThemeMiniExercise.sequenceId: string | null` ajouté

- [x] API Client — `theme-dossier.ts` (AC: #6, #7, #8)
  - [x] Ajouter `sequenceId: r.sequence_id as string | null` dans `toThemeMiniExercise` (mapper)
  - [x] `createThemeMiniExercise` : `sequence_id: data.sequenceId ?? null` ajouté dans le payload insert
  - [x] `updateThemeMiniExercise` : `sequence_id: data.sequenceId` ajouté dans les champs updatables

- [x] Mise à jour `SectionMiniExercices.tsx` (AC: #10)
  - [x] Ajouter prop `sequences: ThemeSequence[]`
  - [x] Ajouter `sequenceId: ''` dans `EMPTY_FORM`
  - [x] Ajouter sélecteur `<select>` "Séquence liée" dans `ExerciseForm` (en grille 2 colonnes avec le critère)
  - [x] Passer `sequences` à `ExerciseForm` via les props du composant interne
  - [x] Dans la liste : afficher badge séquence si `ex.sequenceId` présent (style gold identique badge critère)
  - [x] Passer `sequences={sequences}` depuis `page.tsx`

- [ ] Tests manuels (AC: #4, #5, #10)
  - [ ] Créer un mini-exercice sans séquence ni critère → liste sans badge
  - [ ] Créer un mini-exercice lié à une séquence → badge séquence affiché
  - [ ] Créer un mini-exercice lié aux deux (séquence + critère) → deux badges
  - [ ] Supprimer la séquence liée → `sequence_id` passe à NULL (SET NULL), badge disparaît
  - [ ] Éditer un exercice existant pour ajouter/changer la séquence → persistence vérifiée

## Dev Notes

### RISK 7 corrigé — Schéma déjà partiel depuis 00056

Migration `supabase/migrations/00056_theme_pedagogical_dossier.sql` crée `theme_mini_exercises` avec :
```sql
CREATE TABLE IF NOT EXISTS theme_mini_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  theme_id     UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,  -- ← DÉJÀ PRÉSENT
  criterion_id UUID REFERENCES criteria(id) ON DELETE SET NULL,        -- ← DÉJÀ NULLABLE
  title        TEXT NOT NULL,
  ...
);
```

**Ce que la story 24.6 N'A PAS BESOIN DE FAIRE :**
- ❌ Ajouter `theme_id` — déjà là, NOT NULL
- ❌ Rendre `criterion_id` nullable — déjà nullable, déjà SET NULL
- ❌ Ajouter un trigger `updated_at` — déjà présent (`theme_mini_exercises_updated_at`)

**Ce que la story 24.6 FAIT UNIQUEMENT :**
- ✅ Ajouter la colonne `sequence_id` nullable avec SET NULL
- ✅ Mapper cette colonne dans le type TS et l'API
- ✅ Ajouter le sélecteur séquence dans l'UI

Migration 00081 est donc **minimaliste** :
```sql
-- Migration 00081 — Mini-exercices : liaison séquence
ALTER TABLE theme_mini_exercises
  ADD COLUMN IF NOT EXISTS sequence_id UUID NULL
  REFERENCES theme_sequences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mini_exercises_seq_idx
  ON theme_mini_exercises (sequence_id);
```

### Liaison duale (séquence + critère) — pas d'exclusivité

Contrairement aux critères (Story 24.4 — exclusivité séquence/métaphore), les mini-exercices peuvent avoir `sequence_id` ET `criterion_id` simultanément. C'est intentionnel : un exercice peut pratiquer un critère précis dans le cadre d'une séquence spécifique.

Aucune contrainte CHECK d'exclusivité n'est ajoutée pour cette table.

### Mise à jour du mapper `toThemeMiniExercise`

Dans `theme-dossier.ts`, fonction `toThemeMiniExercise` (ligne ~41) :
```ts
function toThemeMiniExercise(r: Record<string, unknown>): ThemeMiniExercise {
  return {
    id          : r.id as string,
    tenantId    : r.tenant_id as string,
    themeId     : r.theme_id as string,
    criterionId : r.criterion_id as string | null,
    sequenceId  : r.sequence_id as string | null,   // ← ajouter
    title       : r.title as string,
    // ...reste inchangé
  }
}
```

### Passage de `sequences` dans `page.tsx`

Si Story 24.3 a déjà ajouté le chargement et le state `sequences` dans `ThemeDossierPage`, il suffit de passer `sequences={sequences}` à `SectionMiniExercices` dans le case `sequences-pedagogiques` :
```tsx
<SectionMiniExercices
  themeId={theme.id}
  tenantId={tenantId}
  criteria={criteria}
  sequences={sequences}   // ← ajouter
/>
```

### Affichage badge séquence dans la liste

Pattern badge existant pour le critère :
```tsx
{ex.criterionId && (
  <span style={{ fontSize: 11, backgroundColor: colors.accent.gold + '15', ... }}>
    Critère : {getCriterionLabel(ex.criterionId)}
  </span>
)}
```
Reproduire pour la séquence (même style, même positionnement) :
```tsx
{ex.sequenceId && (
  <span style={{ fontSize: 11, backgroundColor: colors.accent.gold + '15', ... }}>
    Séquence : {getSequenceLabel(ex.sequenceId)}
  </span>
)}
```
Avec helper `getSequenceLabel(id: string) => sequences.find(s => s.id === id)?.name ?? id`.

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement.

### Project Structure Notes

```
supabase/migrations/00081_mini_exercises_sequence_link.sql  ← créer (minimaliste, ~5 lignes)
aureak/packages/types/src/entities.ts                       ← ThemeMiniExercise + sequenceId
aureak/packages/api-client/src/referentiel/theme-dossier.ts ← toThemeMiniExercise + create + update
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionMiniExercices.tsx  ← modifier
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx  ← passer sequences (déjà fait en 24.3)
```

### References

- [Source: supabase/migrations/00056_theme_pedagogical_dossier.sql] — table `theme_mini_exercises` complète (lignes 76-87), confirme `criterion_id` nullable et `theme_id` NOT NULL
- [Source: aureak/packages/api-client/src/referentiel/theme-dossier.ts#toThemeMiniExercise] — ligne ~41, mapper à étendre
- [Source: aureak/packages/api-client/src/referentiel/theme-dossier.ts#createThemeMiniExercise] — lignes 231-255, payload à étendre
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionMiniExercices.tsx] — composant existant, `EMPTY_FORM` et `ExerciseForm` à étendre
- [Source: aureak/packages/types/src/entities.ts#ThemeMiniExercise] — type actuel
- [Source: _bmad-output/implementation-artifacts/24-3-metaphores.md] — chargement `sequences` dans `page.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

**Code Review fixes (2026-03-14):** H1 — `handleSaveEdit` enveloppé dans try/catch (`setEditingId(null)` et `load()` uniquement en cas de succès). H2 — `handleDelete` enveloppé dans try/catch. M1 — `load()` enveloppé dans try/finally (`setLoading(false)` garanti). L1 — `editForm.title.trim()` ajouté dans `handleSaveEdit`.

Migration 00082 créée : `sequence_id UUID NULL REFERENCES theme_sequences(id) ON DELETE SET NULL` + index `mini_exercises_seq_idx`. Aucune autre modification de schéma (theme_id et criterion_id déjà conformes depuis 00056). Type `ThemeMiniExercise.sequenceId: string | null` ajouté. `toThemeMiniExercise` mappé. `createThemeMiniExercise` insère `sequence_id`. `updateThemeMiniExercise` met à jour `sequence_id`. `SectionMiniExercices.tsx` : prop `sequences: ThemeSequence[]` ajoutée, `EMPTY_FORM` étendu (`sequenceId: ''`), `handleAdd`/`handleEdit`/`handleSaveEdit` passent `sequenceId`, `ExerciseForm` reçoit `sequences` et affiche sélecteur "Séquence liée" en grille 2 colonnes avec le sélecteur critère, badge séquence affiché en liste. `page.tsx` passe `sequences={sequences}` à `SectionMiniExercices`.

### File List

- `supabase/migrations/00082_mini_exercises_sequence_link.sql` — migration DB
- `aureak/packages/types/src/entities.ts` — `ThemeMiniExercise.sequenceId` ajouté
- `aureak/packages/api-client/src/referentiel/theme-dossier.ts` — `toThemeMiniExercise` + `createThemeMiniExercise` + `updateThemeMiniExercise`
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionMiniExercices.tsx` — prop sequences, EMPTY_FORM, ExerciseForm, badges
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` — `sequences={sequences}` passé à SectionMiniExercices
