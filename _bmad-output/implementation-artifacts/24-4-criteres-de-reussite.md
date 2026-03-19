# Story 24.4 : Critères de Réussite — Découplage & Liaison exclusive (séquence OU métaphore)

Status: done

## Story

En tant qu'admin,
je veux créer des critères de réussite indépendamment, puis les lier soit à une séquence, soit à une métaphore (jamais les deux simultanément),
afin de construire une architecture pédagogique flexible où chaque critère appartient à un seul parent logique.

## Acceptance Criteria

1. La colonne `criteria.sequence_id` est rendue **nullable** (était `NOT NULL`). Une migration ALTER TABLE l'applique.
2. Une colonne `criteria.metaphor_id UUID NULL FK(theme_metaphors ON DELETE SET NULL)` est ajoutée à `criteria`.
3. Une colonne `criteria.theme_id UUID NOT NULL FK(themes ON DELETE CASCADE)` est ajoutée à `criteria` et backfillée depuis `theme_sequences.theme_id` pour toutes les lignes existantes.
4. Une contrainte `CHECK (NOT (sequence_id IS NOT NULL AND metaphor_id IS NOT NULL))` est ajoutée — un critère **ne peut pas** appartenir simultanément à une séquence et une métaphore.
5. Le trigger `enforce_criteria_tenant()` est réécrit pour gérer `sequence_id` nullable et vérifier le tenant via `metaphor_id` quand applicable.
6. La fonction API `listCriteriaByTheme(themeId)` est réécrite pour utiliser `WHERE theme_id = $1` directement (plus de double requête via `theme_sequences`). Elle retourne aussi les critères orphelins et ceux liés à une métaphore.
7. L'API `createCriterion` accepte `sequenceId?: string | null`, `metaphorId?: string | null`, et `themeId: string` (requis).
8. L'API `updateCriterionExtended` accepte `sequenceId` et `metaphorId` pour mise à jour de liaison.
9. Le type TypeScript `Criterion` ajoute `metaphorId: string | null` et `themeId: string`.
10. `SectionCriteres.tsx` est mise à jour :
    - Suppression du guard `if (!existingSeqId) { alert(...) }` et de la dépendance à `tree[0]?.sequenceId`
    - Deux sélecteurs optionnels : "Lier à une séquence" et "Lier à une métaphore"
    - Les deux sélecteurs sont **mutuellement exclusifs** : choisir une séquence vide le champ métaphore, et vice versa
    - Badge de liaison affiché sur chaque critère (séquence OU métaphore)
11. `SectionCriteres.tsx` reçoit les props `sequences: ThemeSequence[]` et `metaphors: ThemeMetaphor[]`.

## Tasks / Subtasks

- [x] Migration DB (AC: #1, #2, #3, #4, #5)
  - [x] Numéro migration : **00080**
  - [x] `ALTER TABLE criteria ALTER COLUMN sequence_id DROP NOT NULL;`
  - [x] `ALTER TABLE criteria ADD COLUMN IF NOT EXISTS metaphor_id UUID NULL REFERENCES theme_metaphors(id) ON DELETE SET NULL;`
  - [x] `ALTER TABLE criteria ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES themes(id) ON DELETE CASCADE;`
  - [x] Backfill : `UPDATE criteria c SET theme_id = ts.theme_id FROM theme_sequences ts WHERE c.sequence_id = ts.id;`
  - [x] Vérifier l'absence de NULL restants : `DO $$ BEGIN IF EXISTS (SELECT 1 FROM criteria WHERE theme_id IS NULL) THEN RAISE EXCEPTION 'Backfill incomplet'; END IF; END $$;`
  - [x] `ALTER TABLE criteria ALTER COLUMN theme_id SET NOT NULL;`
  - [x] Index : `CREATE INDEX IF NOT EXISTS criteria_theme_idx ON criteria (theme_id);`
  - [x] Index : `CREATE INDEX IF NOT EXISTS criteria_metaphor_idx ON criteria (metaphor_id);`
  - [x] Contrainte exclusivité : `ALTER TABLE criteria ADD CONSTRAINT chk_criteria_single_parent CHECK (NOT (sequence_id IS NOT NULL AND metaphor_id IS NOT NULL));`
  - [x] Réécrire `enforce_criteria_tenant()` (voir Dev Notes)
  - [x] `DROP TRIGGER IF EXISTS trg_criteria_tenant ON criteria;`
  - [x] `CREATE TRIGGER trg_criteria_tenant BEFORE INSERT OR UPDATE ON criteria FOR EACH ROW EXECUTE FUNCTION enforce_criteria_tenant();`

- [x] Types TypeScript (AC: #9)
  - [x] `Criterion.metaphorId: string | null` ajouté dans `entities.ts`
  - [x] `Criterion.themeId: string` ajouté dans `entities.ts`

- [x] API Client — `criteria.ts` et `theme-dossier.ts` (AC: #6, #7, #8)
  - [x] **Réécrire `listCriteriaByTheme`** dans `theme-dossier.ts` : `SELECT * FROM criteria WHERE theme_id = $1 ORDER BY logical_order`
  - [x] Mapper `metaphor_id` et `theme_id` dans le mapper existant
  - [x] Mettre à jour `CreateCriterionParams` : `themeId: string` requis, `sequenceId?: string | null`, `metaphorId?: string | null`
  - [x] Mettre à jour l'appel `supabase.from('criteria').insert(...)` pour inclure `theme_id`, `metaphor_id`
  - [x] Mettre à jour `updateCriterionExtended` : ajouter `sequenceId` et `metaphorId` dans les champs updatables

- [x] Mise à jour `SectionCriteres.tsx` (AC: #10, #11)
  - [x] Ajouter props `sequences: ThemeSequence[]` et `metaphors: ThemeMetaphor[]`
  - [x] Supprimer le guard `if (!existingSeqId)` dans `handleAddCriterion` (lignes 122-127)
  - [x] Ajouter state `newCritSeqId: string` et `newCritMetaId: string`
  - [x] Sélecteur séquence : `onChange` → `setNewCritSeqId(val); setNewCritMetaId('')` (exclusivité)
  - [x] Sélecteur métaphore : `onChange` → `setNewCritMetaId(val); setNewCritSeqId('')` (exclusivité)
  - [x] Même exclusivité dans le formulaire d'édition inline
  - [x] Badge sur chaque critère : afficher séquence OU métaphore liée (pas les deux — contrainte garantie)
  - [x] Passer `themeId` dans `createCriterion`

- [x] Mise à jour `page.tsx`
  - [x] Charger `metaphors` via `listMetaphorsByTheme(theme.id)` dans `useEffect`
  - [x] Passer `sequences={sequences}` et `metaphors={metaphors}` à `SectionCriteres`

- [ ] Tests manuels (AC: #4, #6, #10, #11)
  - [ ] Créer un critère sans lien → apparaît dans la liste, badge absent
  - [ ] Créer un critère lié à une séquence, vérifier badge séquence
  - [ ] Créer un critère lié à une métaphore, vérifier badge métaphore
  - [ ] Tenter de lier les deux en même temps → le sélecteur empêche (exclusivité UI). En DB : la contrainte CHECK rejette si les deux sont envoyés.
  - [ ] Supprimer une séquence → vérifier que les critères liés ont `sequence_id = NULL` et apparaissent toujours dans `listCriteriaByTheme`
  - [ ] Supprimer une métaphore → vérifier que les critères liés ont `metaphor_id = NULL`

## Dev Notes

### RISK 1 corrigé — `listCriteriaByTheme` réécrite

L'ancienne implémentation (dans `theme-dossier.ts` lignes 663-691) charge d'abord les séquences puis fait un `.in('sequence_id', seqIds)`. Elle devient **aveugle** aux critères orphelins ou liés à une métaphore après l'ajout de `theme_id`.

Nouvelle implémentation :
```ts
export async function listCriteriaByTheme(themeId: string): Promise<Criterion[]> {
  const { data } = await supabase
    .from('criteria')
    .select('*')
    .eq('theme_id', themeId)
    .order('logical_order', { ascending: true })
  return (data ?? []).map(mapCriterionRow)
}
```
La double requête via `theme_sequences` est **supprimée entièrement**.

### RISK 2 corrigé — `enforce_criteria_tenant()` réécrite

```sql
CREATE OR REPLACE FUNCTION enforce_criteria_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Vérification via theme_id direct (source de vérité après migration)
  IF NEW.theme_id IS NOT NULL AND
     (SELECT tenant_id FROM themes WHERE id = NEW.theme_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match themes.tenant_id (theme_id=%)', NEW.theme_id;
  END IF;
  -- Vérification optionnelle sequence_id (garde-fou supplémentaire)
  IF NEW.sequence_id IS NOT NULL AND
     (SELECT tenant_id FROM theme_sequences WHERE id = NEW.sequence_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_sequences.tenant_id (sequence_id=%)', NEW.sequence_id;
  END IF;
  -- Vérification metaphor_id
  IF NEW.metaphor_id IS NOT NULL AND
     (SELECT tenant_id FROM theme_metaphors WHERE id = NEW.metaphor_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_metaphors.tenant_id (metaphor_id=%)', NEW.metaphor_id;
  END IF;
  RETURN NEW;
END;
$$;
```

### RISK 4 corrigé — Contrainte CHECK d'exclusivité

```sql
ALTER TABLE criteria ADD CONSTRAINT chk_criteria_single_parent
  CHECK (NOT (sequence_id IS NOT NULL AND metaphor_id IS NOT NULL));
```

Cette contrainte est DB-level. L'UI l'enforcer via exclusivité des sélecteurs, mais la DB rejette aussi un INSERT/UPDATE invalide.

### Backfill `theme_id` — séquence sécurisée

À l'instant de la migration 00079, `criteria.sequence_id` est encore NOT NULL pour TOUTES les lignes existantes (on le rend nullable juste après le backfill). La jointure `theme_sequences ts WHERE c.sequence_id = ts.id` est donc toujours valide. Ordre dans la migration :

```sql
-- 1. Ajouter la colonne nullable d'abord
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES themes(id) ON DELETE CASCADE;

-- 2. Backfill avant de poser NOT NULL
UPDATE criteria c
  SET theme_id = ts.theme_id
  FROM theme_sequences ts
  WHERE c.sequence_id = ts.id;

-- 3. Vérifier (sécurité)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM criteria WHERE theme_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill theme_id incomplet sur criteria';
  END IF;
END $$;

-- 4. Poser NOT NULL
ALTER TABLE criteria ALTER COLUMN theme_id SET NOT NULL;

-- 5. Rendre sequence_id nullable (maintenant que theme_id est la source de vérité)
ALTER TABLE criteria ALTER COLUMN sequence_id DROP NOT NULL;
```

### Dépendance Story 24.3

`theme_metaphors` doit exister avant que la migration 00079 ne pose `criteria.metaphor_id UUID REFERENCES theme_metaphors(id)`. **Story 24.3 doit être déployée avant Story 24.4.**

### UX — Sélecteurs mutuellement exclusifs

```tsx
// Sélecteur séquence
<select
  value={newCritSeqId}
  onChange={e => {
    setNewCritSeqId(e.target.value)
    if (e.target.value) setNewCritMetaId('') // exclusivité
  }}
>
  <option value="">— Aucune séquence —</option>
  {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
</select>

// Sélecteur métaphore
<select
  value={newCritMetaId}
  onChange={e => {
    setNewCritMetaId(e.target.value)
    if (e.target.value) setNewCritSeqId('') // exclusivité
  }}
>
  <option value="">— Aucune métaphore —</option>
  {metaphors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
</select>
```

### `sequence_criteria` join table — clarification

`sequence_criteria` (table de 00056) représente "critères ciblés par une séquence pour le coaching" — un many-to-many indépendant de `criteria.sequence_id`. Ces deux liens sont conceptuellement distincts :
- `criteria.sequence_id` = parent pédagogique (ownership)
- `sequence_criteria` = ciblage coaching (can span multiple sequences)

Ne pas nettoyer `sequence_criteria` lors du passage de `sequence_id` à NULL — ce sont deux relations différentes.

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement.

### Project Structure Notes

```
aureak/supabase/migrations/ (dossier local) — mais migration à mettre dans supabase/migrations/ (racine)
supabase/migrations/00079_criteria_flexible_links.sql    ← créer
aureak/packages/types/src/entities.ts                    ← Criterion + metaphorId + themeId
aureak/packages/api-client/src/referentiel/criteria.ts   ← createCriterion params
aureak/packages/api-client/src/referentiel/theme-dossier.ts  ← réécrire listCriteriaByTheme + mapper
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx  ← modifier
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx  ← passer metaphors + sequences
```

⚠️ **Note sur les deux dossiers de migrations :** Les migrations fondation sont dans `aureak/supabase/migrations/`. Les migrations récentes (00056+) sont dans `supabase/migrations/` (racine). Suivre le pattern récent → placer 00079 dans `supabase/migrations/`.

### References

- [Source: aureak/supabase/migrations/00006_referentiel_criteria.sql] — schema criteria + trigger `enforce_criteria_tenant` original
- [Source: supabase/migrations/00056_theme_pedagogical_dossier.sql] — `sequence_criteria`, `theme_mini_exercises`
- [Source: aureak/packages/api-client/src/referentiel/theme-dossier.ts#listCriteriaByTheme] — implémentation à réécrire (lignes 663-691)
- [Source: aureak/packages/api-client/src/referentiel/criteria.ts] — `createCriterion`, `updateCriterionExtended`
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx] — guard à supprimer (lignes 122-127)
- [Source: aureak/packages/types/src/entities.ts#Criterion] — type actuel
- [Source: _bmad-output/implementation-artifacts/24-3-metaphores.md] — table `theme_metaphors` dépendance

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Migration 00080 créée : `sequence_id` rendu nullable, `metaphor_id` ajouté (FK → theme_metaphors ON DELETE SET NULL), `theme_id` ajouté (FK → themes, backfillé depuis theme_sequences, NOT NULL), contrainte `chk_criteria_single_parent` CHECK exclusivité, trigger `enforce_criteria_tenant()` réécrit (theme_id + sequence_id nullable + metaphor_id). Type `Criterion` mis à jour : `sequenceId: string | null`, `themeId: string`, `metaphorId: string | null`. `listCriteriaByTheme` réécrite : requête directe `WHERE theme_id = $1`, double requête supprimée, mapper `mapCriterionRow` extraite. `updateCriterionExtended` : `sequenceId` et `metaphorId` ajoutés. `createCriterion` : signature mise à jour (`themeId` requis, `sequenceId`/`metaphorId` optionnels). `SectionCriteres.tsx` : guard supprimé, props `sequences` + `metaphors` ajoutées, sélecteurs mutuellement exclusifs (séquence/métaphore) dans création et édition inline, badges gold (séquence) et violet (métaphore) sur chaque critère. `page.tsx` : chargement `listMetaphorsByTheme` ajouté au Promise.all, state `metaphors`, passage `sequences={sequences} metaphors={metaphors}` à SectionCriteres.

### File List

- `supabase/migrations/00080_criteria_flexible_links.sql` — migration DB
- `aureak/packages/types/src/entities.ts` — type `Criterion` mis à jour
- `aureak/packages/api-client/src/referentiel/criteria.ts` — `CreateCriterionParams` + `createCriterion` mis à jour
- `aureak/packages/api-client/src/referentiel/theme-dossier.ts` — `listCriteriaByTheme` réécrite, `mapCriterionRow` ajoutée, `updateCriterionExtended` étendu
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx` — refonte props + sélecteurs exclusifs + badges
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` — import + state metaphors + passage props
