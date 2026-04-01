# Story 8.5 : Rapports Coach, Vue Agrégée Groupe & Accès Parent

Status: done

## Story

En tant que Coach (et Admin, et Parent),
Je veux consulter les métriques détaillées d'apprentissage de chaque enfant et du groupe, avec les données chiffrées réservées au staff et une vue narrative pour les parents,
Afin que le Coach puisse identifier les enfants en difficulté et que le Parent suive la progression de son enfant sans être noyé dans les chiffres.

## Acceptance Criteria

**AC1 — Vue détaillée Coach par enfant**
- **When** un Coach consulte le rapport de séance
- **Then** affiche par enfant : `mastery_percent`, `correct_count / questions_answered`, `stop_reason`, questions manquées, critères faibles

**AC2 — Vue agrégée groupe Coach**
- **And** % enfants ayant acquis chaque thème, questions les plus ratées, tendance sur N séances

**AC3 — RLS par rôle**
- **And** Child : ses tentatives, SANS `mastery_percent`/`correct_count`
- **And** Parent : tentatives de ses enfants (via `parent_child_links`), SANS `mastery_percent`
- **And** Coach : toutes tentatives des enfants de ses séances (session_coaches), AVEC `mastery_percent`
- **And** Admin : toutes tentatives du tenant, AVEC toutes métriques

**AC4 — Vue parent narrative**
- **And** ✅ thèmes acquis avec date + badge éventuel + streak
- **And** ❌ thèmes "en cours d'apprentissage"
- **And** historique revalidations avec résultat (`maintained/lost`)
- **And** `player_progress.total_points` + collection badges

**AC5 — Couverture FRs**
- **And** FR22–FR24 couverts : quiz enfant + correction + résultats coach
- **And** FR35, FR-P1–FR-P4 couverts : vue progression parent
- **And** FR72 couvert : résultats agrégés par thème
- **And** FR-P2, FR-P3, FR-P6 couverts : historique évaluations, courbe évolution, progression groupe

## Tasks / Subtasks

- [ ] Task 1 — Policies RLS complètes `learning_attempts` (AC: #3)
  - [ ] 1.1 Policy child : SELECT sans `mastery_percent`/`correct_count` → via vue `learning_attempts_child_view` (Story 8.3)
  - [ ] 1.2 Policy parent : SELECT via `parent_child_links` sans `mastery_percent`
  - [ ] 1.3 Policy coach : SELECT via `session_coaches` avec toutes métriques
  - [ ] 1.4 Policy admin : SELECT toutes métriques du tenant

- [ ] Task 2 — API rapport Coach (AC: #1, #2)
  - [ ] 2.1 Fonction `getSessionLearningReport(sessionId)` dans `@aureak/api-client`
  - [ ] 2.2 Agrégat groupe : % acquired par thème, questions les plus ratées

- [ ] Task 3 — UI Coach rapport (AC: #1, #2)
  - [ ] 3.1 Section "Résultats Quiz" dans `apps/mobile/app/(coach)/session/[sessionId]/report.tsx`
  - [ ] 3.2 Tableau enfants : ACQUIS/NON ACQUIS + bouton détail

- [ ] Task 4 — UI Parent progression (AC: #4)
  - [ ] 4.1 Section "Progression" dans la fiche enfant parent (Story 7.3)
  - [ ] 4.2 Afficher thèmes acquis/en cours + streak + badges (sans scores)

## Dev Notes

### Policies RLS `learning_attempts`

```sql
-- Coach : ses séances
CREATE POLICY "coach_read" ON learning_attempts
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'coach'
    AND EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = learning_attempts.session_id
        AND sc.coach_id = auth.uid()
    )
  );

-- Parent : ses enfants (sans mastery_percent → via vue dédiée ou SELECT spécifique)
CREATE POLICY "parent_read" ON learning_attempts
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.child_id = learning_attempts.child_id
        AND pcl.parent_id = auth.uid()
    )
  );

-- Admin : tout le tenant
CREATE POLICY "admin_read" ON learning_attempts
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );

-- Child : ses propres tentatives uniquement
CREATE POLICY "child_read" ON learning_attempts
  FOR SELECT USING (
    child_id = auth.uid()
    AND current_user_role() = 'child'
  );
```

### Policies `player_progress`

```sql
-- Child : son propre progress
CREATE POLICY "child_own" ON player_progress
  FOR SELECT USING (child_id = auth.uid());

-- Parent : progress de ses enfants
CREATE POLICY "parent_children" ON player_progress
  FOR SELECT USING (
    current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE child_id = player_progress.child_id AND parent_id = auth.uid()
    )
  );

-- Coach + Admin : tout le tenant
CREATE POLICY "staff_read" ON player_progress
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('coach','admin')
  );
```

### API rapport coach

```typescript
// packages/api-client/src/sessions/getSessionLearningReport.ts
export async function getSessionLearningReport(sessionId: string) {
  const { data: attempts } = await supabase
    .from('learning_attempts')
    .select(`
      id, child_id, theme_id, mastery_status, mastery_percent,
      questions_answered, correct_count, stop_reason,
      themes(name),
      learning_answers(question_id, is_correct,
        quiz_questions(text, criteria_id, criteria(label)))
    `)
    .eq('session_id', sessionId)

  // Agrégat groupe
  const themeStats = (attempts ?? []).reduce((acc: any, a) => {
    const key = a.theme_id
    if (!acc[key]) acc[key] = { name: (a.themes as any)?.name, total: 0, acquired: 0 }
    acc[key].total++
    if (a.mastery_status === 'acquired') acc[key].acquired++
    return acc
  }, {})

  return { attempts, themeStats }
}
```

### Dépendances

- **Prérequis** : Story 8.1 (tables) + Story 8.2 (tentatives créées) + Story 8.3 (vue enfant) + Story 7.3 (fiche parent enrichie)
- **Consommé par** : Aucune dépendance supplémentaire — complète Epic 8

### References
- [Source: epics.md#Story-8.5] — lignes 2429–2467

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
