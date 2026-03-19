# Story 24.5 : Erreurs Observées — Création indépendante & Liaison exclusive aux critères

Status: done

## Story

En tant qu'admin,
je veux créer des erreurs observées indépendamment et les lier optionnellement à un critère,
afin de constituer une banque d'erreurs réutilisables rattachées à des critères précis quand c'est pertinent.

## Acceptance Criteria

1. La colonne `faults.criterion_id` est rendue **nullable**. La FK est modifiée de `ON DELETE CASCADE` vers `ON DELETE SET NULL`.
2. Une colonne `faults.theme_id UUID NOT NULL FK(themes ON DELETE CASCADE)` est ajoutée et backfillée.
3. Une erreur peut être créée sans critère (`criterion_id IS NULL`) — état "libre".
4. Une erreur liée à un critère est supprimée de la liaison (passage à `criterion_id = NULL`) quand le critère est supprimé.
5. Une erreur ne peut être liée qu'à un critère — jamais directement à une séquence ou une métaphore.
6. L'API expose `listFaultsByTheme(themeId)` qui retourne toutes les erreurs du thème (liées ou non à un critère).
7. `createFault` accepte `criterionId?: string | null` et requiert `themeId`.
8. Le type TypeScript `Fault` ajoute `themeId: string` et rend `criterionId` nullable (`string | null`).
9. Le trigger `enforce_faults_tenant()` est mis à jour pour gérer `criterion_id` nullable.
10. `SectionCriteres.tsx` est mise à jour :
    - Le message de confirmation de suppression d'un critère reflète le nouveau comportement : "les erreurs liées resteront disponibles sans critère parent"
    - Une section "Erreurs libres" liste les faults avec `criterion_id IS NULL` en bas du composant
    - Un bouton "+ Ajouter une erreur libre" crée une erreur sans critère avec sélecteur critère optionnel
    - Un bouton inline "Lier à un critère" permet d'assigner un critère a posteriori à une erreur libre

## Tasks / Subtasks

- [x] Migration DB (AC: #1, #2, #4, #9)
  - [x] Numéro migration : **00081**
  - [x] Trouver le nom exact de la contrainte FK `criterion_id` :
    ```sql
    -- Inclure dans la migration pour être sûr :
    DO $$ DECLARE v_cname TEXT;
    BEGIN
      SELECT conname INTO v_cname FROM pg_constraint
      WHERE conrelid = 'faults'::regclass
        AND confrelid = 'criteria'::regclass
        AND contype = 'f';
      EXECUTE format('ALTER TABLE faults DROP CONSTRAINT %I', v_cname);
    END $$;
    ```
  - [x] Recréer la FK : `ALTER TABLE faults ADD CONSTRAINT faults_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE SET NULL;`
  - [x] Rendre `criterion_id` nullable : `ALTER TABLE faults ALTER COLUMN criterion_id DROP NOT NULL;`
  - [x] Ajouter `theme_id` : `ALTER TABLE faults ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES themes(id) ON DELETE CASCADE;`
  - [x] Backfill `theme_id` via `criteria.theme_id` (disponible après migration 00080)
  - [x] Vérifier l'absence de NULL restants
  - [x] `ALTER TABLE faults ALTER COLUMN theme_id SET NOT NULL;`
  - [x] Index : `CREATE INDEX IF NOT EXISTS faults_theme_idx ON faults (theme_id);`
  - [x] Réécrire `enforce_faults_tenant()` (voir Dev Notes)
  - [x] `DROP TRIGGER IF EXISTS trg_faults_tenant ON faults;`
  - [x] `CREATE TRIGGER trg_faults_tenant BEFORE INSERT OR UPDATE ON faults FOR EACH ROW EXECUTE FUNCTION enforce_faults_tenant();`

- [x] Types TypeScript (AC: #8)
  - [x] `Fault.criterionId` → `string | null` dans `entities.ts`
  - [x] `Fault.themeId: string` ajouté dans `entities.ts`

- [x] API Client — `criteria.ts` et `theme-dossier.ts` (AC: #6, #7)
  - [x] `CreateFaultParams.criterionId` → `string | null` (optionnel)
  - [x] `CreateFaultParams.themeId: string` → requis
  - [x] Mapper `theme_id` et `criterion_id` nullable dans `mapFaultRow` (theme-dossier.ts)
  - [x] Ajouter `listFaultsByTheme(themeId: string): Promise<Fault[]>` dans `theme-dossier.ts`
  - [x] Exporter `listFaultsByTheme` depuis `index.ts`
  - [x] Mettre à jour `mapFaultRow` : `criterionId: r.criterion_id as string | null` et `themeId: r.theme_id as string`

- [x] Mise à jour `SectionCriteres.tsx` (AC: #10)
  - [x] **Confirmation suppression critère** : message mis à jour avec comportement erreurs libres
  - [x] Ajouter chargement `listFaultsByTheme(themeId)` au mount
  - [x] Dériver `freeFaults` = faults avec `criterionId === null`
  - [x] Section "Erreurs libres" en bas du composant (style distinct, titre "⚠ Erreurs libres")
  - [x] Formulaire "+ Ajouter une erreur libre" : label requis + sélecteur critère optionnel
  - [x] Bouton "Lier à un critère" inline sur chaque erreur libre → appelle `updateFaultExtended(id, { criterionId })`

- [ ] Tests manuels (AC: #3, #4, #5, #6, #10)
  - [ ] Créer une erreur libre → apparaît dans "Erreurs libres"
  - [ ] Lier une erreur libre à un critère → migre sous le critère, disparaît des erreurs libres
  - [ ] Supprimer un critère avec des erreurs → confirmer avec le nouveau message → les erreurs passent dans "Erreurs libres"
  - [ ] Tenter de créer une erreur directement liée à une séquence (hors UI, via API) → impossible (pas de champ séquence sur faults)
  - [ ] Recharger la page après liaison/déliaison → state correct

## Dev Notes

### RISK 3 corrigé — Nom dynamique de la contrainte FK

PostgreSQL génère les noms de contraintes automatiquement. Le nom `faults_criterion_id_fkey` est probable mais pas garanti (surtout si la table a été créée dans un contexte différent). Utiliser une lookup dynamique dans la migration :

```sql
DO $$ DECLARE v_cname TEXT;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'faults'::regclass
    AND confrelid = 'criteria'::regclass
    AND contype = 'f';                  -- 'f' = foreign key

  IF v_cname IS NULL THEN
    RAISE EXCEPTION 'FK faults→criteria introuvable';
  END IF;

  EXECUTE format('ALTER TABLE faults DROP CONSTRAINT %I', v_cname);
END $$;

-- Recréer avec ON DELETE SET NULL
ALTER TABLE faults
  ADD CONSTRAINT faults_criterion_id_fkey
  FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE SET NULL;

-- Rendre nullable séparément (DROP NOT NULL doit venir après le DROP CONSTRAINT
-- car la contrainte NOT NULL et la FK sont indépendantes en PG)
ALTER TABLE faults ALTER COLUMN criterion_id DROP NOT NULL;
```

### RISK 2 corrigé (cascade sur trigger) — `enforce_faults_tenant()` réécrite

```sql
CREATE OR REPLACE FUNCTION enforce_faults_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Vérification via theme_id direct si disponible
  IF NEW.theme_id IS NOT NULL AND
     (SELECT tenant_id FROM themes WHERE id = NEW.theme_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'faults.tenant_id must match themes.tenant_id (theme_id=%)', NEW.theme_id;
  END IF;
  -- Vérification criterion_id si présent (garde-fou tenant croisé)
  IF NEW.criterion_id IS NOT NULL AND
     (SELECT tenant_id FROM criteria WHERE id = NEW.criterion_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'faults.tenant_id must match criteria.tenant_id (criterion_id=%)', NEW.criterion_id;
  END IF;
  RETURN NEW;
END;
$$;
```

### Backfill `faults.theme_id` — chaîne de dépendance

La migration 00080 utilise `criteria.theme_id` pour le backfill. Ce champ est ajouté par la migration 00079 (Story 24.4). L'ordre d'exécution `00079 → 00080` est garanti par la numérotation.

Chaîne de backfill :
```sql
UPDATE faults f
  SET theme_id = c.theme_id
  FROM criteria c
  WHERE f.criterion_id = c.id;
```

Ce backfill couvre 100% des faults existants car, à l'instant de 00080, tous les faults existants ont `criterion_id NOT NULL` (ils n'ont pas encore pu être orphelins — 00080 est la migration qui rend ça possible). Le `DO $$ ... IF EXISTS (...WHERE theme_id IS NULL)` est donc un simple garde-fou de cohérence.

### `sequence_criteria` — pas de nettoyage requis

Les entrées dans `sequence_criteria` représentent "critères ciblés par une séquence pour le coaching" — un many-to-many indépendant de `faults`. Aucune relation avec les erreurs. Pas de nettoyage nécessaire ici.

### Section "Erreurs libres" — position dans le composant

```tsx
// En bas de SectionCriteres, après la liste des critères
{freeFaults.length > 0 && (
  <div style={{ marginTop: 24 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                  textTransform: 'uppercase', color: colors.accent.red,
                  marginBottom: 12 }}>
      ⚠ Erreurs libres ({freeFaults.length})
    </div>
    {freeFaults.map(fault => (
      <FreeFaultRow
        key={fault.id}
        fault={fault}
        criteria={tree}
        onLink={(criterionId) => handleLinkFaultToCriterion(fault.id, criterionId)}
        onDelete={() => handleDeleteFault(null, fault.id)}
      />
    ))}
  </div>
)}
<button onClick={() => setShowAddFreeFault(true)}>+ Ajouter une erreur libre</button>
```

### Erreurs libres — chargement dans SectionCriteres

Ajouter `listFaultsByTheme(themeId)` dans `loadTree()` :
```ts
const loadTree = async () => {
  setLoading(true)
  const crits = await listCriteriaByTheme(themeId)
  const allFaults = await listFaultsByTheme(themeId)    // ← nouveau : charge TOUS les faults du thème

  // faults liés à un critère → mêmes qu'avant
  const faultsByCrit = new Map(...)
  // faults libres → criterion_id IS NULL
  const free = allFaults.filter(f => f.criterionId === null)
  setFreeFaults(free)
  // ... reste inchangé
}
```

### Accès Supabase

Tout accès Supabase via `@aureak/api-client` uniquement.

### Project Structure Notes

```
supabase/migrations/00080_faults_independent.sql         ← créer (dans supabase/migrations/ racine)
aureak/packages/types/src/entities.ts                    ← Fault.criterionId nullable + themeId
aureak/packages/api-client/src/referentiel/criteria.ts   ← createFault params
aureak/packages/api-client/src/referentiel/theme-dossier.ts  ← listFaultsByTheme + mapFaultRow
aureak/packages/api-client/src/index.ts                  ← exporter listFaultsByTheme
aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx  ← modifier
```

### References

- [Source: aureak/supabase/migrations/00006_referentiel_criteria.sql] — schema faults actuel + trigger `enforce_faults_tenant`
- [Source: supabase/migrations/00056_theme_pedagogical_dossier.sql] — table `theme_mini_exercises` (pattern similaire pour nullable criterion_id)
- [Source: aureak/packages/api-client/src/referentiel/theme-dossier.ts#mapFaultRow] — ligne 718 à mettre à jour
- [Source: aureak/packages/api-client/src/referentiel/criteria.ts#createFault] — `CreateFaultParams` à étendre
- [Source: aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx] — `handleDeleteCriterion` ligne 155-159 + `handleAddFault` lignes 161-173
- [Source: _bmad-output/implementation-artifacts/24-4-criteres-de-reussite.md] — dépendance migration 00079 + `criteria.theme_id`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

**Code Review fixes (2026-03-14):** H1 — `handleDeleteFault` enveloppé dans try/catch. H2 — `createFault` error vérifiée dans `handleAddFault` et `handleAddFreeFault` (`const { error } = await createFault(...); if (error) throw error`). H3 — signature `handleDeleteFault(critId, faultId)` → `handleDeleteFault(faultId)` (critId vestigial supprimé, appels mis à jour). M1 — import `listFaultsByCriteriaIds` supprimé. M2 — paramètre vestigial `critId` supprimé.

Migration 00081 créée : `criterion_id` rendu nullable (FK recréée avec ON DELETE SET NULL via lookup dynamique pg_constraint), `theme_id` ajouté (backfillé depuis criteria.theme_id, NOT NULL), index `faults_theme_idx`, `enforce_faults_tenant()` réécrit (theme_id source de vérité + criterion_id nullable). Type `Fault` mis à jour : `criterionId: string | null`, `themeId: string`. `CreateFaultParams` mis à jour : `themeId` requis, `criterionId` optionnel. `mapFaultRow` mis à jour : `criterionId` nullable, `themeId` mappé. `listFaultsByTheme` ajoutée dans `theme-dossier.ts` et exportée depuis `index.ts`. `listFaultsByCriterionExtended` utilise maintenant `mapFaultRow`. `updateFaultExtended` étendu avec `criterionId?`. `SectionCriteres.tsx` : `loadTree` utilise `listFaultsByTheme` (faults groupés par criterionId non-null, freeFaults = criterionId null), état `freeFaults`, section "Erreurs libres" avec sélecteur de liaison inline, formulaire "+ Ajouter une erreur libre" avec critère optionnel, `handleLinkFaultToCriterion`, `handleAddFreeFault`, message de confirmation suppression critère mis à jour.

### File List

- `supabase/migrations/00081_faults_independent.sql` — migration DB
- `aureak/packages/types/src/entities.ts` — type `Fault` mis à jour
- `aureak/packages/api-client/src/referentiel/criteria.ts` — `CreateFaultParams` + `createFault` mis à jour
- `aureak/packages/api-client/src/referentiel/theme-dossier.ts` — `mapFaultRow` mis à jour, `listFaultsByTheme` ajoutée, `updateFaultExtended` étendu
- `aureak/packages/api-client/src/index.ts` — export `listFaultsByTheme`
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx` — freeFaults, section erreurs libres, liaison inline
