# Story 3.5 : Questions de Quiz (Workflow Draft/Published)

Status: ready-for-dev

## Story

En tant qu'Admin,
Je veux créer des questions de quiz associées à un thème, avec un workflow draft → published sécurisé par trigger,
Afin que seules les questions valides (3-4 options, exactement 1 bonne réponse) soient exposées aux enfants lors des séances.

## Acceptance Criteria

**AC1 — Tables `quiz_questions` et `quiz_options` créées**
- **Given** les tables de Story 3.1 existent (`themes`)
- **When** la migration Story 3.5 est exécutée
- **Then** les tables suivantes existent :
  ```sql
  CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    question_text TEXT NOT NULL,
    explanation TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    sort_order INTEGER,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER
  );
  CREATE UNIQUE INDEX one_correct_per_question ON quiz_options (question_id) WHERE is_correct = true;
  ```

**AC2 — Trigger de publication**
- **And** un trigger valide la question avant `draft → published` :
  - 3–4 options requises
  - Exactement 1 bonne réponse
  - Violation = `RAISE EXCEPTION` — l'UPDATE est annulé

**AC3 — Workflow**
- **And** une question peut rester en `draft` sans limite de temps
- **And** seul un Admin peut déclencher le passage à `published`
- **And** la publication peut être révoquée (`published → draft`) sans contrainte

**AC4 — RLS et migration propre**
- **And** RLS activé sur `quiz_questions` et `quiz_options`, policies couvertes par Story 2.6
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Compléter `00008_referentiel_taxonomies.sql` ou créer `00009_referentiel_quiz.sql` (AC: #1, #2)
  - [ ] 1.1 Créer `supabase/migrations/00009_referentiel_quiz.sql` avec les 2 tables + index partiel + trigger
  - [ ] 1.2 Activer RLS sur les 2 tables
  - [ ] 1.3 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Policies RLS dans `00010_rls_policies.sql`
  - [ ] 2.1 Section Story 2.6 : policies pour `quiz_questions` (admin=ALL, coach=SELECT filtré `status='published'`) et `quiz_options`

- [ ] Task 3 — Types TypeScript
  - [ ] 3.1 Ajouter `QuizQuestion`, `QuizOption`, `QuizStatus = 'draft' | 'published'`

- [ ] Task 4 — `@aureak/api-client`
  - [ ] 4.1 Créer `packages/api-client/src/referentiel/quiz.ts` :
    - `createQuestion({ themeId, questionText, explanation })` → INSERT status='draft'
    - `addOption({ questionId, optionText, isCorrect })` → INSERT
    - `publishQuestion(questionId)` → UPDATE status='published' (trigger valide)
    - `unpublishQuestion(questionId)` → UPDATE status='draft'
    - `listPublishedByTheme(themeId)` → SELECT WHERE status='published'

- [ ] Task 5 — UI Admin (web)
  - [ ] 5.1 Créer `apps/web/app/(admin)/referentiel/themes/[themeKey]/quiz/page.tsx` — liste des questions avec statut + bouton publier
  - [ ] 5.2 Formulaire de création question : question_text + explanation + 3-4 options avec radio "bonne réponse"

## Dev Notes

### Trigger de publication

```sql
CREATE OR REPLACE FUNCTION validate_quiz_question_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  opt_count     INTEGER;
  correct_count INTEGER;
BEGIN
  IF NEW.status = 'published' AND OLD.status = 'draft' THEN
    SELECT COUNT(*) INTO opt_count     FROM quiz_options WHERE question_id = NEW.id;
    SELECT COUNT(*) INTO correct_count FROM quiz_options WHERE question_id = NEW.id AND is_correct = true;
    IF opt_count NOT BETWEEN 3 AND 4 THEN
      RAISE EXCEPTION 'Quiz question % must have 3-4 options, has %', NEW.id, opt_count;
    END IF;
    IF correct_count != 1 THEN
      RAISE EXCEPTION 'Quiz question % must have exactly 1 correct answer, has %', NEW.id, correct_count;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_quiz_publish BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION validate_quiz_question_publish();
```

### Policy coach sur `quiz_questions` : uniquement les publiées

```sql
-- Dans 00010_rls_policies.sql section Story 2.6
CREATE POLICY "quiz_coach_read_published" ON quiz_questions
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'coach'
    AND status = 'published'
    AND deleted_at IS NULL
  );
```

### Index partiel `one_correct_per_question`

Garantit qu'une seule option `is_correct = true` existe par question. L'Admin qui tente d'insérer une 2e option correcte obtient une erreur de contrainte unique.

### Numérotation migration

`00009_referentiel_quiz.sql` (après `00008_referentiel_taxonomies.sql`). Si `audit_logs` est en `00009` (Story 1.2), utiliser `00010a` ou regrouper dans un fichier plus long. La convention project est que `00010_rls_policies.sql` est toujours le dernier — ajuster la numérotation entre 00005 et 00009 au besoin.

### Dépendances

- **Prérequis** : Story 3.1 (`themes`)
- **À compléter en Story 8.2** : `quiz_questions` et `quiz_options` utilisés par le moteur de quiz adaptatif

### References

- [Source: epics.md#Story-3.5] — lignes 1132–1190

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
### Completion Notes List
### File List
