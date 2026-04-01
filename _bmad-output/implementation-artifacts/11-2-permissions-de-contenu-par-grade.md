# Story 11.2 : Permissions de Contenu par Grade

Status: done

## Story

En tant que Coach,
Je veux accéder au contenu du référentiel pédagogique correspondant à mon grade (Bronze : contenu de base ; Platine : contenu avancé complet),
Afin que l'accès aux ressources avancées soit conditionné à la progression réelle.

## Acceptance Criteria

**AC1 — Colonnes `required_grade_level` sur thèmes et situations**
- **When** la migration Story 11.2 est exécutée
- **Then** `themes.required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze'`
- **And** `situations.required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze'`

**AC2 — Fonction `grade_rank(g coach_grade_level)` IMMUTABLE**
- **And** convertit le grade en rang numérique (bronze=1, silver=2, gold=3, platinum=4)

**AC3 — Policies RLS filtrées par grade**
- **And** policy `grade_access_themes` : coach voit uniquement `grade_rank(required_grade_level) <= grade_rank(current_user_grade())`
- **And** idem pour `grade_access_situations`
- **And** admin voit tout (pas de restriction grade)

**AC4 — UX "verrouillé"**
- **And** contenu avec `required_grade_level > grade courant` : affiché en grisé avec cadenas + "Requis : grade Or"

**AC5 — Mise à jour immédiate**
- **And** attribution nouveau grade (Story 11.1) → restrictions RLS effectives immédiatement (stateless via `current_user_grade()`)

**AC6 — Couverture FRs**
- **And** FR63–FR64 couverts : permissions contenu dynamiques par grade
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00029_grade_content_access.sql` (AC: #1, #2, #3)
  - [ ] 1.1 `ALTER TABLE themes ADD COLUMN required_grade_level`
  - [ ] 1.2 `ALTER TABLE situations ADD COLUMN required_grade_level`
  - [ ] 1.3 Créer `grade_rank()` function IMMUTABLE
  - [ ] 1.4 Créer policies `grade_access_themes` + `grade_access_situations`

- [ ] Task 2 — UI Admin configuration grade (AC: #4)
  - [ ] 2.1 Champ `required_grade_level` dans formulaire édition thème/situation (back-office Admin)

- [ ] Task 3 — UI Coach contenu verrouillé (AC: #4)
  - [ ] 3.1 Afficher cadenas + message "Requis : grade [X]" pour contenu inaccessible
  - [ ] 3.2 Prévoir skeleton/placeholder côté client pour contenu filtré par RLS

## Dev Notes

### Migration `00029_grade_content_access.sql`

```sql
-- Colonnes grade minimum sur thèmes et situations
ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';
ALTER TABLE situations
  ADD COLUMN IF NOT EXISTS required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';

-- Fonction de comparaison de grades (IMMUTABLE pour RLS performant)
CREATE OR REPLACE FUNCTION grade_rank(g coach_grade_level)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE g
    WHEN 'bronze'   THEN 1
    WHEN 'silver'   THEN 2
    WHEN 'gold'     THEN 3
    WHEN 'platinum' THEN 4
  END;
$$;

-- Policy RLS thèmes : filtre par grade si Coach
-- (Remplace ou complète la policy tenant_isolation existante de Story 3.1)
CREATE POLICY "grade_access_themes" ON themes
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() = 'admin'
      OR current_user_role() != 'coach'  -- parent, child, club voient tout le catalogue filtré par audience
      OR (
        current_user_role() = 'coach'
        AND grade_rank(required_grade_level) <= grade_rank(COALESCE(current_user_grade(), 'bronze'))
      )
    )
  );

CREATE POLICY "grade_access_situations" ON situations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() = 'admin'
      OR current_user_role() != 'coach'
      OR (
        current_user_role() = 'coach'
        AND grade_rank(required_grade_level) <= grade_rank(COALESCE(current_user_grade(), 'bronze'))
      )
    )
  );
```

### Gestion coach sans grade

Un coach sans entrée dans `coach_grades` a `current_user_grade() = NULL`. Le COALESCE 'bronze' garantit qu'il voit au minimum le contenu Bronze — comportement défensif approprié.

### UX contenu verrouillé

```typescript
// Dans les listes de thèmes/situations côté coach :
// Si le contenu n'est pas retourné par l'API (filtré par RLS),
// l'UI peut afficher une section "Contenu avancé (Grade Or requis)"
// avec des cartes grisées basées sur les métadonnées publiques (non-filtrées).
// Implémentation : API séparée pour "catalogue complet pour votre grade actuel"
// vs "tout le catalogue du tenant avec indication accès"
```

### Dépendances

- **Prérequis** : Story 11.1 (`coach_grade_level` enum + `current_user_grade()`) + Story 3.1 (tables themes, situations)
- **Consommé par** : Story 11.3 (partenariats — niveau accès aussi lié au grade)

### References
- [Source: epics.md#Story-11.2] — lignes 3499–3551

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
