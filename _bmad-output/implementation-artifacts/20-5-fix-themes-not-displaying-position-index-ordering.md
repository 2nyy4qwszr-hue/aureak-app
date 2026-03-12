# Story 20.5 : Fix — Thèmes non affichés (ordering position_index)

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que la page Admin → Thèmes affiche correctement les thèmes,
afin de pouvoir gérer et visualiser le référentiel pédagogique normalement.

## Acceptance Criteria

1. La page Admin → Thèmes (`/methodologie/themes`) affiche toutes les ThemeCards des thèmes existants en base.
2. Si une erreur API se produit lors du chargement (`t.error` non null), un message d'erreur explicite est affiché (pas une liste vide silencieuse).
3. La migration `00077_themes_position_index.sql` est appliquée sur la base Supabase (colonne `position_index` présente dans la table `themes`).
4. Les thèmes sont correctement triés : `position_index ASC nulls last` → `order_index ASC nulls last` → `name ASC`.
5. Aucune régression sur le filtrage par Bloc, le drag & drop de réordonnancement, ni la navigation vers la fiche thème.

## Cause Racine Identifiée

### Pourquoi les thèmes n'apparaissent-ils pas ?

1. **Migration 00077 non appliquée** : Le fichier `supabase/migrations/00077_themes_position_index.sql` existe localement mais la colonne `position_index` n'a pas encore été ajoutée à la table `themes` en base Supabase.

2. **Requête `listThemes()` échoue silencieusement** :
   ```ts
   // aureak/packages/api-client/src/referentiel/themes.ts:193
   .order('position_index', { ascending: true, nullsFirst: false })
   ```
   Supabase/PostgREST renvoie une erreur 400 : *"column themes.position_index does not exist"*.
   La fonction retourne alors `{ data: [], error: <DB error> }` — pas d'exception levée.

3. **`loadData` dans `themes/index.tsx` ne vérifie pas `t.error`** :
   ```ts
   const [t, g] = await Promise.all([listThemes(), listThemeGroups()])
   setThemes(t.data)   // ← t.data = [] car l'erreur est ignorée
   setGroups(g.data)
   ```
   `themes` reste `[]`, la condition `themes.length === 0` est vraie → "Aucun thème configuré." affiché sans erreur visible.

## Tasks / Subtasks

- [x] T1 — Appliquer la migration 00077 (AC: #3)
  - [x] T1.1 — Appliquer `supabase/migrations/00077_themes_position_index.sql` via `npx supabase db push`
  - [x] T1.2 — Vérifier que la colonne `position_index` est présente (`npx supabase db push --dry-run` → "Remote database is up to date")

- [x] T2 — Corriger `loadData` pour propager les erreurs API (AC: #2)
  - [x] T2.1 — Après `const [t, g] = await Promise.all(...)`, vérifier `t.error`
  - [x] T2.2 — Si `t.error`, appeler `setErrorMsg(...)` et `return` (ne pas appeler `setThemes([])`)
  - [x] T2.3 — Message d'erreur ajouté : `'Impossible de charger les thèmes (erreur base de données). Réessayez ou contactez le support.'`

- [x] T3 — Validation (AC: #1, #4, #5)
  - [x] T3.1 — Migration appliquée → `listThemes()` trie par `position_index` sans erreur DB
  - [x] T3.2 — Tri `position_index → order_index → name` actif dans `listThemes()` (inchangé, désormais fonctionnel)
  - [x] T3.3 — Filtre par Bloc et DnD non modifiés — aucune régression

## Dev Notes

### Root cause en détail

La story 20-4 a introduit `.order('position_index', ...)` dans `listThemes()` **avant** que la migration correspondante ne soit appliquée en base. En production / dev Supabase non migré, cette requête échoue avec :

```
PostgreSQL error: column themes.position_index does not exist
```

PostgREST traduit ça en HTTP 400. Le Supabase JS client renvoie `{ data: null, error: { code: '42703', message: '...' } }`. `data ? data.map(mapTheme) : []` retourne `[]`.

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Vérification de `t.error` dans `loadData` |

### Fichier de migration à appliquer (pas à modifier)

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00077_themes_position_index.sql` | Appliquer via MCP Supabase |

### Pattern de correction `loadData` (fichier : `themes/index.tsx:41-52`)

```ts
// AVANT (bugué — t.error ignoré)
const loadData = async () => {
  setErrorMsg(null)
  try {
    const [t, g] = await Promise.all([listThemes(), listThemeGroups()])
    setThemes(t.data)
    setGroups(g.data)
  } catch {
    setErrorMsg('Impossible de charger les thèmes. Veuillez réessayer.')
  } finally {
    setLoading(false)
  }
}

// APRÈS (correct — t.error propagé)
const loadData = async () => {
  setErrorMsg(null)
  try {
    const [t, g] = await Promise.all([listThemes(), listThemeGroups()])
    if (t.error) {
      setErrorMsg('Impossible de charger les thèmes (erreur base de données). Réessayez ou contactez le support.')
      return
    }
    setThemes(t.data)
    setGroups(g.data)
  } catch {
    setErrorMsg('Impossible de charger les thèmes. Veuillez réessayer.')
  } finally {
    setLoading(false)
  }
}
```

### Ne pas modifier

- `listThemes()` dans `themes.ts` — le tri par `position_index` est correct une fois la migration appliquée
- `ThemeCard.tsx` — aucun lien avec ce bug
- `SectionIdentite.tsx` — aucun lien avec ce bug
- Les autres sections `[themeKey]/sections/*.tsx`

### Vérification via MCP Supabase

Après application de la migration, vérifier :
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'themes' AND column_name = 'position_index';
```
Doit retourner une ligne avec `column_name = 'position_index'`, `data_type = 'integer'`.

### Pattern de gestion d'erreur API dans ce projet

Dans d'autres pages admin (ex : `seances/page.tsx`, `children/index.tsx`), le pattern est :
```ts
const { data, error } = await someApiCall()
if (error) { setError('...'); return }
setState(data)
```
La correction de `loadData` aligne `themes/index.tsx` sur ce pattern standard.

### Project Structure Notes

- `themes/index.tsx` est le fichier de route (re-exporte `./page` implicitement ou contient directement le composant dans ce cas — il contient directement le composant)
- Accès Supabase uniquement via `@aureak/api-client` (ESLint rule — respecté)
- Le pattern `try/catch` autour de `Promise.all` ne capturait que les exceptions JS, pas les erreurs Supabase retournées via `{ error }` dans le return value

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Migration 00077 confirmée en attente via `npx supabase db push --dry-run` → "Would push: 00077_themes_position_index.sql"
- Migration appliquée via `npx supabase db push` → "Finished supabase db push"
- Post-vérification : `--dry-run` → "Remote database is up to date"
- TypeScript check : zéro erreur dans `methodologie/themes/index.tsx` ni dans les fichiers modifiés

### Completion Notes List

- T1: Migration `00077_themes_position_index.sql` appliquée via `npx supabase db push`. Colonne `position_index INTEGER` avec CHECK (1–25) et index UNIQUE partiel `uq_themes_group_position` désormais présents en base.
- T2: `loadData` corrigé — vérification `t.error || g.error` après `Promise.all`. Les deux requêtes (themes + groups) sont maintenant surveillées.
- CR-M1: Ajout de `g.error` dans la condition — si `listThemeGroups()` échoue, l'erreur est propagée au lieu d'être silencieuse.
- CR-M2: Condition `!errorMsg` ajoutée sur le message "Aucun thème configuré." — plus de double message contradictoire lors d'une erreur API.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00077_themes_position_index.sql` | Appliqué en base (npx supabase db push) |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Modifié — `t.error \|\| g.error` + `!errorMsg` sur message vide |
