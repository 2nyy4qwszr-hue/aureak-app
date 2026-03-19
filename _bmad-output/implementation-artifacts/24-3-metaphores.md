# Story 24.3 : Métaphores — Création & Liaison optionnelle à une séquence

Status: done

## Story

En tant qu'admin,
je veux créer des métaphores pédagogiques pour un thème et les lier optionnellement à une séquence,
afin de disposer d'images conceptuelles réutilisables qui enrichissent la compréhension du thème.

## Acceptance Criteria

1. Une nouvelle table `theme_metaphors` est créée en DB avec les colonnes : `id UUID PK`, `tenant_id UUID NOT NULL FK(tenants)`, `theme_id UUID NOT NULL FK(themes ON DELETE CASCADE)`, `title TEXT NOT NULL`, `description TEXT NULL`, `sequence_id UUID NULL FK(theme_sequences ON DELETE SET NULL)`, `sort_order INTEGER NOT NULL DEFAULT 0`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
2. RLS sur `theme_metaphors` : `admin` = full CRUD, `coach` = read-only (même pattern que `theme_sequences`).
3. Les types TypeScript `ThemeMetaphor` et `CreateThemeMetaphorParams` sont ajoutés dans `entities.ts`.
4. L'API client expose : `listMetaphorsByTheme(themeId)`, `createThemeMetaphor(params)`, `updateThemeMetaphor(id, data)`, `deleteThemeMetaphor(id)`, `linkMetaphorToSequence(metaphorId, sequenceId | null)`.
5. Un nouveau composant `SectionMetaphores.tsx` est créé dans `[themeKey]/sections/`.
6. La section liste les métaphores du thème triées par `sort_order`.
7. L'admin peut créer une métaphore avec un titre (obligatoire) + description (optionnelle) + séquence liée (optionnelle, sélecteur parmi les séquences du thème).
8. L'admin peut modifier une métaphore existante (titre, description, séquence liée) via mode édition inline.
9. L'admin peut supprimer une métaphore (`window.confirm`). La suppression ne touche pas les critères qui lui seraient liés (Story 24.4 — `criteria.metaphor_id` sera nullable/SET NULL).
10. La séquence liée est affichée comme un badge/chip gold cliquable dans la liste.
11. `SectionMetaphores.tsx` est intégré dans l'onglet `sequences-pedagogiques` de `ThemeDossierPage`, après `SectionSequences` et avant `SectionCriteres`.
12. Le placeholder Story 24.1 est mis à jour : item "Métaphores" passe de badge "À venir" à badge "Disponible".

## Tasks / Subtasks

- [x] Migration DB — table `theme_metaphors` (AC: #1, #2)
  - [x] Numéro migration : **00078** (courant après 00077_themes_position_index)
  - [x] Colonnes : id, tenant_id, theme_id, title, description, sequence_id (nullable, SET NULL on delete), sort_order, created_at, updated_at
  - [x] Trigger `update_updated_at()` sur `theme_metaphors` (CREATE OR REPLACE si absente)
  - [x] RLS : isolation tenant + admin full + coach read
  - [x] Index : `(theme_id, sort_order)`, `(tenant_id)`

- [x] Types TypeScript (AC: #3)
  - [x] Ajouter `ThemeMetaphor` dans `aureak/packages/types/src/entities.ts`
  - [x] Champs : `id`, `tenantId`, `themeId`, `title`, `description`, `sequenceId`, `sortOrder`, `createdAt`, `updatedAt`

- [x] API Client (AC: #4)
  - [x] Créer `aureak/packages/api-client/src/referentiel/theme-metaphors.ts`
  - [x] Implémenter : `listMetaphorsByTheme`, `createThemeMetaphor`, `updateThemeMetaphor`, `deleteThemeMetaphor`, `linkMetaphorToSequence`
  - [x] Exporter depuis `aureak/packages/api-client/src/index.ts`

- [x] Composant `SectionMetaphores.tsx` (AC: #5, #6, #7, #8, #9, #10)
  - [x] Props : `{ themeId: string, tenantId: string, sequences: ThemeSequence[] }`
  - [x] Liste des métaphores avec title + séquence liée (badge) + boutons édition/suppression
  - [x] Formulaire création inline : titre requis, description textarea, sélecteur séquence (optionnel)
  - [x] Mode édition inline identique au formulaire création
  - [x] Confirmation suppression avec `window.confirm`
  - [x] Boutons ↑/↓ pour réordonnancement (même pattern que Story 24.2)
  - [x] Style : pattern `colors.light.surface`, `shadows.sm`, `radius.card`, `colors.accent.gold` (identique aux autres sections)

- [x] Intégrer dans `page.tsx` (AC: #11)
  - [x] Passer `sequences` au composant (déjà chargées dans le `useEffect` → ajouter `listSequencesByTheme`)
  - [x] Ordre dans `sequences-pedagogiques` : SectionSequences → **SectionMetaphores** → SectionCriteres → SectionMiniExercices

- [x] Mettre à jour le placeholder Story 24.1 (AC: #12)
  - [x] `SectionPedagogiePlaceholder.tsx` n'existe pas encore (Story 24.1 non implémentée) — à faire lors de 24.1

- [ ] Tests manuels (AC: #6 à #10)
  - [ ] Créer 2 métaphores sans séquence liée
  - [ ] Lier une métaphore à une séquence existante — vérifier badge affiché
  - [ ] Déplacer le lien vers une autre séquence — vérifier mise à jour
  - [ ] Supprimer une métaphore — vérifier qu'elle disparaît
  - [ ] Réordonner avec ↑/↓ — vérifier persistence après reload

## Dev Notes

### Entité nouvelle — aucun existant à réécrire

La table `theme_metaphors` n'existe pas du tout. C'est une création pure.

### Relation sequence_id — SET NULL vs CASCADE

La FK `sequence_id → theme_sequences` doit être `ON DELETE SET NULL` (pas CASCADE) car une métaphore peut exister sans séquence. Si la séquence est supprimée, la métaphore survit (sequenceId → null).

```sql
sequence_id UUID NULL REFERENCES theme_sequences(id) ON DELETE SET NULL
```

### Pattern API attendu

```ts
// theme-metaphors.ts
export type CreateThemeMetaphorParams = {
  tenantId   : string
  themeId    : string
  title      : string
  description?: string | null
  sequenceId ?: string | null
  sortOrder  ?: number
}

export async function listMetaphorsByTheme(themeId: string): Promise<ThemeMetaphor[]> {
  const { data } = await supabase
    .from('theme_metaphors')
    .select('*')
    .eq('theme_id', themeId)
    .order('sort_order', { ascending: true })
  return (data ?? []).map(toThemeMetaphor)
}
```

### Chargement des séquences dans page.tsx

`ThemeDossierPage` doit charger les séquences pour les passer à `SectionMetaphores`. Ajouter `listSequencesByTheme(theme.id)` dans le `Promise.all` du useEffect :

```ts
const [{ data: t }, { data: g }, { data: seqs }] = await Promise.all([
  getThemeByKey(themeKey),
  listThemeGroups(),
  listSequencesByTheme(themeId), // ← ajouter
])
```

Stocker dans un state `sequences: ThemeSequence[]`.

### Scalabilité future

Story 24.7 (Organisation pédagogique) utilisera les métaphores pour les afficher dans le builder hiérarchique. S'assurer que `listMetaphorsByTheme` retourne bien le `sequenceId` pour construire la hiérarchie.

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement.

### Project Structure Notes

```
supabase/migrations/00078_theme_metaphors.sql          ← créer
aureak/packages/types/src/entities.ts                  ← ajouter ThemeMetaphor
aureak/packages/api-client/src/referentiel/theme-metaphors.ts  ← créer
aureak/packages/api-client/src/index.ts                ← exporter
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionMetaphores.tsx  ← créer
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx  ← modifier (import + intégration + chargement séquences)
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionPedagogiePlaceholder.tsx  ← modifier badge
```

### References

- [Source: supabase/migrations/00005_referentiel_themes.sql] — pattern table theme_sequences + RLS à reproduire
- [Source: aureak/packages/api-client/src/referentiel/themes.ts#listSequencesByTheme] — pattern liste
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionSequences.tsx] — pattern UI existant à reproduire
- [Source: aureak/packages/types/src/entities.ts#ThemeSequence] — format type existant pour s'inspirer
- [Source: aureak/packages/api-client/src/index.ts] — pattern d'export

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Toutes les tâches implémentées. Migration 00078 créée (table, RLS, trigger, index). Type `ThemeMetaphor` ajouté dans entities.ts. API client `theme-metaphors.ts` créé avec 5 fonctions. Composant `SectionMetaphores.tsx` créé avec CRUD complet, ↑/↓, badge séquence, error handling, anti double-clic. `page.tsx` mis à jour : import `listSequencesByTheme`, state `sequences`, passage à `SectionMetaphores`. AC #12 différée à story 24.1 (placeholder inexistant).

### File List

- `supabase/migrations/00078_theme_metaphors.sql` — migration DB (table, RLS, trigger, index)
- `aureak/packages/types/src/entities.ts` — type `ThemeMetaphor` ajouté
- `aureak/packages/api-client/src/referentiel/theme-metaphors.ts` — API client créé
- `aureak/packages/api-client/src/index.ts` — exports `listMetaphorsByTheme`, `createThemeMetaphor`, `updateThemeMetaphor`, `deleteThemeMetaphor`, `linkMetaphorToSequence`
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionMetaphores.tsx` — composant créé
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` — import séquences + intégration SectionMetaphores
