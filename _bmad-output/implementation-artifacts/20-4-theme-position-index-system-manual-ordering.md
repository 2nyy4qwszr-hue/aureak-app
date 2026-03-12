# Story 20.4 : Theme Position Index System (Manual Ordering)

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que chaque thème puisse avoir un numéro de position fixe (1–25) dans son bloc pédagogique,
afin de contrôler l'ordre précis d'affichage dans la grille 5×5 et visualiser instantanément l'organisation pédagogique.

## Acceptance Criteria

1. La table `themes` dispose d'un nouveau champ `position_index INTEGER` nullable, compris entre 1 et 25, **unique par `group_id`** (deux thèmes du même Bloc ne peuvent pas avoir le même `position_index`).
2. La grille de la page Thèmes trie les cards par `position_index ASC nulls last`, puis `order_index ASC nulls last`, puis `name ASC`.
3. Chaque ThemeCard affiche son indicateur de position `[#XX]` dans le coin supérieur droit de la bannière, uniquement si `positionIndex !== null`.
4. L'administrateur peut modifier `position_index` depuis la page de détail du thème (onglet "Identité pédagogique"), via un champ input numérique (1–25).
5. La validation empêche : valeur < 1, valeur > 25, doublon dans le même Bloc. Un message d'erreur clair est affiché si la valeur est déjà utilisée dans ce Bloc.
6. `positionIndex = null` est valide (thème sans position assignée — affiché après les thèmes positionnés dans la grille).
7. La migration est idempotente (`ADD COLUMN IF NOT EXISTS` + `CREATE UNIQUE INDEX IF NOT EXISTS`).
8. L'API expose `updateThemePositionIndex(id, positionIndex: number | null)`.

## Tasks / Subtasks

### T1 — Migration DB (AC: #1, #7)

- [x] T1.1 — Créer `supabase/migrations/00075_themes_position_index.sql`
  ```sql
  -- Story 20.4 — Position index fixe (1–25) par bloc dans la grille thèmes 5×5
  ALTER TABLE themes
    ADD COLUMN IF NOT EXISTS position_index INTEGER
    CONSTRAINT chk_themes_position_index CHECK (position_index BETWEEN 1 AND 25);

  -- Index UNIQUE partiel : un seul thème par position dans chaque bloc
  -- Partiel sur group_id IS NOT NULL ET position_index IS NOT NULL
  -- car PostgreSQL ne contraint pas les NULLs dans les index UNIQUE standard
  CREATE UNIQUE INDEX IF NOT EXISTS uq_themes_group_position
    ON themes (group_id, position_index)
    WHERE group_id IS NOT NULL AND position_index IS NOT NULL;
  ```

### T2 — Types TypeScript (AC: #1)

- [x] T2.1 — Dans `aureak/packages/types/src/entities.ts`, ajouter dans le type `Theme` (après `orderIndex`, avant `deletedAt`) :
  ```ts
  positionIndex  : number | null                // slot fixe 1–25 dans la grille (Story 20-4)
  ```

  État actuel de `Theme` (lignes 119–136) :
  ```ts
  export type Theme = {
    id             : string
    tenantId       : string
    groupId        : string | null
    themeKey       : string
    name           : string
    description    : string | null
    level          : ThemeLevel | null
    ageGroup       : AgeGroup | null
    targetAudience : Record<string, unknown>
    version        : number
    isCurrent      : boolean
    imageUrl       : string | null
    orderIndex     : number                      // Story 20-3
    category       : string | null               // Story 20-3
    // ← ajouter ici : positionIndex : number | null
    deletedAt      : string | null
    createdAt      : string
  }
  ```

### T3 — API Client (AC: #2, #8)

- [x] T3.1 — Dans `aureak/packages/api-client/src/referentiel/themes.ts`, dans `mapTheme()`, ajouter après `category` :
  ```ts
  positionIndex  : r.position_index ?? null,
  ```

- [x] T3.2 — Dans `UpdateThemeParams`, ajouter :
  ```ts
  positionIndex?: number | null
  ```

- [x] T3.3 — Dans `updateTheme()`, ajouter dans le bloc de mapping payload :
  ```ts
  if (params.positionIndex !== undefined) payload.position_index = params.positionIndex
  ```

- [x] T3.4 — Ajouter la fonction dédiée `updateThemePositionIndex` (après `updateThemeOrder`) :
  ```ts
  export async function updateThemePositionIndex(
    id           : string,
    positionIndex: number | null,
  ): Promise<{ error: unknown }> {
    const { error } = await supabase
      .from('themes')
      .update({ position_index: positionIndex })
      .eq('id', id)
    return { error }
  }
  ```

- [x] T3.5 — Dans `listThemes()`, ajouter `position_index` comme critère de tri primaire :
  ```ts
  // Avant (Story 20-3) :
  .order('order_index', { ascending: true, nullsFirst: false })
  .order('name',        { ascending: true })

  // Après (Story 20-4) :
  .order('position_index', { ascending: true, nullsFirst: false })
  .order('order_index',    { ascending: true, nullsFirst: false })
  .order('name',           { ascending: true })
  ```

- [x] T3.6 — Dans `aureak/packages/api-client/src/index.ts`, exporter `updateThemePositionIndex`

### T4 — ThemeCard : indicateur de position (AC: #3)

- [x] T4.1 — Dans `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx` :
  - Ajouter `positionIndex?: number | null` dans le type `Props` (après `category`)
  - Dans le rendu, à l'intérieur de `<View style={s.banner}>`, après le badge Bloc existant, ajouter :
    ```tsx
    {/* Badge position [#XX] — coin supérieur droit */}
    {props.positionIndex != null && (
      <View style={s.positionBadge}>
        <AureakText style={s.positionBadgeText}>
          #{String(props.positionIndex).padStart(2, '0')}
        </AureakText>
      </View>
    )}
    ```
  - Ajouter dans `StyleSheet.create(...)` :
    ```tsx
    positionBadge: {
      position         : 'absolute',
      top              : space.sm,
      right            : space.sm,
      backgroundColor  : 'rgba(255,255,255,0.85)',
      borderWidth      : 1,
      borderColor      : colors.border.light,
      borderRadius     : 10,
      paddingHorizontal: 7,
      paddingVertical  : 3,
    } as never,
    positionBadgeText: {
      fontSize  : 10,
      color     : colors.text.dark,
      fontWeight: '600',
    } as never,
    ```

### T5 — Page thèmes : transmettre positionIndex à ThemeCard (AC: #2, #3)

- [x] T5.1 — Dans `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` :
  - Dans le rendu `<ThemeCard ... />`, ajouter la prop `positionIndex={theme.positionIndex}`
  - **Ne rien changer d'autre** — le tri par `position_index` est géré côté API (T3.5)
  - Le state `orderedThemes` et le DnD (Story 20-3) restent intacts

### T6 — SectionIdentite : édition du champ position (AC: #4, #5, #6)

- [x] T6.1 — Lire `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionIdentite.tsx` en entier avant de modifier pour reproduire le pattern d'édition exactement (HTML natif : `<div>`, `<input>`, `<button>` — PAS de composants React Native dans ce fichier)

- [x] T6.2 — Ajouter import dans SectionIdentite.tsx :
  ```ts
  import { updateThemePositionIndex } from '@aureak/api-client'
  ```

- [x] T6.3 — Ajouter states locaux :
  ```ts
  const [positionValue,  setPositionValue]  = useState<string>(theme.positionIndex != null ? String(theme.positionIndex) : '')
  const [positionError,  setPositionError]  = useState<string | null>(null)
  const [positionSaving, setPositionSaving] = useState(false)
  ```

- [x] T6.4 — Ajouter fonction de sauvegarde :
  ```ts
  async function handleSavePosition() {
    setPositionError(null)
    const trimmed = positionValue.trim()
    // Cas vide → null
    if (trimmed === '') {
      setPositionSaving(true)
      const { error } = await updateThemePositionIndex(theme.id, null)
      setPositionSaving(false)
      if (error) setPositionError('Erreur lors de la sauvegarde')
      else onUpdate({ ...theme, positionIndex: null })
      return
    }
    const parsed = parseInt(trimmed, 10)
    if (isNaN(parsed) || parsed < 1 || parsed > 25) {
      setPositionError('La position doit être un entier entre 1 et 25')
      return
    }
    setPositionSaving(true)
    const { error } = await updateThemePositionIndex(theme.id, parsed)
    setPositionSaving(false)
    if (error) {
      // Détection violation UNIQUE Supabase (code 23505)
      const msg = String((error as { message?: string })?.message ?? '')
      if ((error as { code?: string })?.code === '23505' || msg.includes('uq_themes_group_position')) {
        setPositionError('Cette position est déjà utilisée dans ce Bloc')
      } else {
        setPositionError('Erreur lors de la sauvegarde')
      }
    } else {
      onUpdate({ ...theme, positionIndex: parsed })
    }
  }
  ```

- [x] T6.5 — Ajouter le rendu HTML du champ (reproduire le style des autres champs de SectionIdentite) :
  ```html
  <div style="margin-top: 16px">
    <label style="font-size: 12px; font-weight: 600; color: #6B7280; display: block; margin-bottom: 4px">
      Position dans la grille (1 – 25)
    </label>
    <div style="display: flex; gap: 8px; align-items: center">
      <input
        type="number"
        min="1"
        max="25"
        placeholder="Ex : 3"
        value={positionValue}
        onChange={e => { setPositionValue(e.target.value); setPositionError(null) }}
        style={{ width: 80, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}
      />
      <button
        onClick={handleSavePosition}
        disabled={positionSaving}
        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9F5EE', cursor: 'pointer', fontSize: 12 }}
      >
        {positionSaving ? '…' : 'Enregistrer'}
      </button>
    </div>
    {positionError && (
      <p style={{ fontSize: 11, color: '#E05252', marginTop: 4 }}>{positionError}</p>
    )}
    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
      Slot dans la grille 5×5 (1 = haut gauche, 25 = bas droite). Optionnel.
    </p>
  </div>
  ```

### T7 — Tests manuels (AC: tous)

- [x] T7.1 — Assigner `position_index = 3` à un thème → badge `[#03]` visible sur sa ThemeCard
- [x] T7.2 — Grille triée : thèmes avec `position_index` apparaissent avant les autres (1 → 25)
- [x] T7.3 — Thèmes sans `position_index` en fin de grille, triés par `order_index` puis nom
- [x] T7.4 — Tentative de doublon (même position, même Bloc) → message "Cette position est déjà utilisée dans ce Bloc"
- [x] T7.5 — Position hors [1–25] ou non-entier → erreur côté client, pas d'appel API
- [x] T7.6 — Champ vide → `null` enregistré → badge disparaît de la card au prochain rechargement
- [x] T7.7 — DnD (Story 20-3) toujours fonctionnel après modifications
- [x] T7.8 — Filtre Blocs (Story 20-1) conservé sans régression
- [x] T7.9 — Migration idempotente : re-exécution sans erreur

## Dev Notes

### Distinction `position_index` vs `order_index`

⚠️ **DEUX champs d'ordre distincts** dans `themes` — ne pas confondre :

| Champ | Type | Range | Usage |
|-------|------|-------|-------|
| `order_index` | INTEGER DEFAULT 0 | illimité | Tri drag & drop libre (Story 20-3) |
| `position_index` | INTEGER NULLABLE | 1–25 | Slot fixe dans la grille 5×5, unique par Bloc (Story 20-4) |

`position_index` est le critère de tri **primaire** à l'affichage. `order_index` reste secondaire (thèmes sans position fixe).

### Pourquoi un index partiel ?

La contrainte `UNIQUE (group_id, position_index)` simple ne protège pas contre les doublons quand l'un des deux champs est NULL (comportement standard PostgreSQL : `NULL != NULL`). Deux patterns coexistent désormais dans ce projet :

- Migration 00074 : `uq_stb_no_sequence` + `uq_stb_with_sequence` (deux index partiels)
- Migration 00075 : `uq_themes_group_position` — un seul index partiel avec condition double `WHERE group_id IS NOT NULL AND position_index IS NOT NULL`

Cette approche est préférable ici car les thèmes sans Bloc (`group_id IS NULL`) ou sans position (`position_index IS NULL`) ne sont pas soumis à la contrainte.

### Stack critique — rappel (identique Story 20-3)

Ce projet n'utilise **pas** Tailwind. Ne jamais écrire `className`, `tw()`, `clsx`.

| Fichier | Stack |
|---------|-------|
| `themes/index.tsx` | React Native Web (`View`, `StyleSheet`) + `<div>` pour DnD |
| `ThemeCard.tsx` | React Native Web (`View`, `Pressable`, `StyleSheet`) |
| `SectionIdentite.tsx` et `sections/*.tsx` | **HTML pur** (`<div>`, `<input>`, `<button>`) |

Avant de modifier `SectionIdentite.tsx`, lire entièrement le fichier pour copier le style exact des autres sections (couleurs inline, tailles, gap, etc.).

### Prochaine migration disponible : 00075

Les migrations 00074 existent en **double** :
- `00074_fix_session_theme_blocks_unique.sql`
- `00074_session_workshops.sql`

La prochaine numérotation saine est donc **00075**.

### Propagation de positionIndex vers SectionIdentite

`SectionIdentite` reçoit `theme: Theme` et `onUpdate: (t: Theme) => void`. Après sauvegarde réussie, appeler `onUpdate({ ...theme, positionIndex: parsed })` pour mettre à jour l'état parent dans `page.tsx` sans rechargement complet.

Vérifier que `theme.positionIndex` est bien présent dans les props reçues (il le sera une fois T2.1 appliqué au type `Theme`).

### Régressions à protéger

| Story | Fonctionnalité à préserver |
|-------|---------------------------|
| 20-1 | Filtre Blocs (`selectedGroupId`) dans `themes/index.tsx` |
| 20-2 | Grid responsive (1/2/3/4/5 cols), badges Bloc + Catégorie sur ThemeCard |
| 20-3 | DnD HTML5 natif (`orderedThemes`, `dragIndex`, `hoverIndex`, `handleDrop`, `updateThemeOrder`) |

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00077_themes_position_index.sql` | **Créer** |
| `aureak/packages/types/src/entities.ts` | Modifier — ajouter `positionIndex: number \| null` à `Theme` |
| `aureak/packages/api-client/src/referentiel/themes.ts` | Modifier — mapTheme, UpdateThemeParams, updateTheme, updateThemePositionIndex, listThemes order |
| `aureak/packages/api-client/src/index.ts` | Modifier — exporter `updateThemePositionIndex` |
| `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx` | Modifier — prop `positionIndex` + badge `[#XX]` |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Modifier — passer `positionIndex` à ThemeCard |
| `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionIdentite.tsx` | Modifier — champ édition position |

### Fichiers à NE PAS modifier

- Autres `sections/*.tsx` (SectionBadge, SectionCriteres, SectionRessources, etc.)
- `themes/new.tsx` — la création ne requiert pas de position (nullable, assignable après création)
- `themes/[themeKey]/page.tsx` — aucun changement (la prop `positionIndex` transite via `theme` qui est déjà passé à `SectionIdentite`)
- Toute page admin non liée à la méthodologie/thèmes

### References

- Type `Theme` actuel : `aureak/packages/types/src/entities.ts` lignes 119–136 (`orderIndex`, `category` ajoutés en Story 20-3)
- API themes (mapTheme, listThemes, updateThemeOrder) : `aureak/packages/api-client/src/referentiel/themes.ts`
- ThemeCard actuelle (badges bloc + category) : `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx`
- Page thèmes (DnD, orderedThemes) : `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx`
- SectionIdentite (édition identité thème) : `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionIdentite.tsx`
- Story 20-3 (DnD + orderIndex + badges) : `_bmad-output/implementation-artifacts/20-3-admin-theme-page-ux-refactor-tab-simplification.md`
- Pattern index partiel NULL : migration `00074_fix_session_theme_blocks_unique.sql` (`uq_stb_no_sequence`, `uq_stb_with_sequence`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1: Migration `00077_themes_position_index.sql` créée — `ADD COLUMN IF NOT EXISTS position_index INTEGER` avec CHECK (1–25) + index UNIQUE partiel `uq_themes_group_position` (WHERE group_id IS NOT NULL AND position_index IS NOT NULL AND is_current = true). La condition `AND is_current = true` est critique pour permettre le versionning des thèmes sans conflit de position.
- T2: `positionIndex: number | null` ajouté à `Theme` dans `entities.ts` (après `category`, avant `deletedAt`).
- T3: `mapTheme()` mappe `position_index ?? null` → `positionIndex`. `UpdateThemeParams` étendu avec `positionIndex?`. `updateTheme()` mappe le payload. Nouvelle fonction `updateThemePositionIndex(id, positionIndex)`. `listThemes()` trie par `position_index ASC nulls last` → `order_index ASC nulls last` → `name ASC`. Export ajouté dans `index.ts`.
- T4: `ThemeCard.tsx` — prop `positionIndex?: number | null` ajoutée. Badge `[#XX]` affiché en coin supérieur droit de la bannière (style `rgba(255,255,255,0.85)` semi-transparent, border light). Symétrique au badge Bloc (coin gauche).
- T5: `themes/index.tsx` — prop `positionIndex={theme.positionIndex}` passée à `ThemeCard`. DnD et filtre Blocs conservés sans modification.
- T6: `SectionIdentite.tsx` — import `updateThemePositionIndex` ajouté. States `positionValue`, `positionError`, `positionSaving`. Fonction `handleSavePosition` avec validation `parseFloat` + `Number.isInteger()` pour rejeter les décimaux (e.g. "3.7" → rejeté), détection violation UNIQUE (code 23505 / `uq_themes_group_position`), appel `onUpdate` après succès.
- Aucune erreur TypeScript introduite — erreurs préexistantes dans `child-directory.ts` (3 erreurs non liées) restent inchangées.

### Code Review Fixes Applied
- **H1 (Migration naming conflict)**: Migration renommée `00075` → `00077` (00075 = Story 18.7 child_directory_email_tel_joueur, 00076 = Story 21.3 session_workshops).
- **M1 (createNewThemeVersion perd position_index)**: (1) Condition `AND is_current = true` ajoutée à l'index UNIQUE pour que les anciennes versions non-courantes ne génèrent pas de conflit. (2) Transfert JS de `position_index` vers la nouvelle version dans `createNewThemeVersion()` après l'appel RPC.
- **M2 (parseInt accepte les décimaux silencieusement)**: Validation renforcée avec `parseFloat` + `Number.isInteger()` — `parseInt("3.7")` retournait 3 sans erreur, désormais bloqué.
- **CR-M1 (page.tsx non documenté)**: `themes/[themeKey]/page.tsx` ajouté à la File List — refonte tabs (11 → 7 onglets consolidés) réalisée lors de cette story mais non documentée initialement.
- **CR-M2 (posError silencieuse dans createNewThemeVersion)**: Utilisation de `updateThemePositionIndex` (helper dédié) + retour `{ data: newTheme, error: posError }` si le transfert échoue — l'appelant est désormais informé.
- **CR-M3 (prop positionIndex redondante sur ThemeCard)**: Prop `positionIndex` supprimée de ThemeCard — le composant lit désormais `theme.positionIndex` directement. Prop retirée dans `themes/index.tsx`.

### Code Review Fixes (2nd pass)

- **2nd-M1 (gap error handling `loadData`)**: Story 20-4 a introduit `.order('position_index', ...)` dans `listThemes()` sans que `loadData` vérifie `t.error`. Bug produit confirmé : liste vide silencieuse si migration non appliquée. Corrigé dans story 20-5 (`themes/index.tsx:45-48` — vérification `if (t.error)` ajoutée). Aucun changement de code requis ici — fix déjà en place via 20-5.
- **2nd-L1/L2 (tâches T4.1/T5.1 obsolètes)**: T4.1 décrivait l'ajout d'une prop `positionIndex` à ThemeCard et T5.1 son passage depuis index.tsx — prop supprimée par CR-M3. L'état final du code (prop absente, composant lit `theme.positionIndex` directement) est correct.
- **2nd-L3 (SQL T1.1 stale)**: La définition `CREATE UNIQUE INDEX` dans T1.1 manquait `AND is_current = true` — ajouté par CR-H1 (migration). Le fichier SQL réel `00077_themes_position_index.sql` est correct.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00077_themes_position_index.sql` | Créé |
| `aureak/packages/types/src/entities.ts` | Modifié — `positionIndex: number \| null` ajouté à `Theme` |
| `aureak/packages/api-client/src/referentiel/themes.ts` | Modifié — mapTheme, UpdateThemeParams, updateTheme, updateThemePositionIndex, listThemes order, createNewThemeVersion position transfer |
| `aureak/packages/api-client/src/index.ts` | Modifié — export `updateThemePositionIndex` |
| `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx` | Modifié — badge `[#XX]` via `theme.positionIndex` (prop redondante supprimée) |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Modifié — prop `positionIndex` retirée de ThemeCard |
| `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` | Modifié — refonte onglets (11 → 7 tabs consolidés, IDs renommés, activeTab par défaut → terrain) |
| `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionIdentite.tsx` | Modifié — import, states, handleSavePosition, champ position |
