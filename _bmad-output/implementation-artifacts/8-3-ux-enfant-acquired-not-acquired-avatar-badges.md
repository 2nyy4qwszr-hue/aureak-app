# Story 8.3 : UX Enfant — Acquired/Not Acquired, Avatar & Badges

Status: deferred

## Story

En tant qu'Enfant,
Je veux vivre le quiz comme un jeu de maîtrise avec retour immédiat et récompenses visuelles, sans jamais voir de note chiffrée,
Afin que l'apprentissage soit perçu comme engageant et motivant, pas comme un examen.

## Acceptance Criteria

**AC1 — Écran de quiz**
- **When** l'enfant démarre son quiz post-séance
- **Then** l'écran affiche : questions avec 3–4 options grandes cibles tactiles (UX-10 : max 5 questions/thème)
- **And** retour immédiat après chaque réponse : ✅ "Bonne réponse !" ou ❌ "Pas encore — [explication]"
- **And** indicateur de progression gamifié (pas de pourcentage visible)

**AC2 — Écran de résultat**
- **And** affiche UNIQUEMENT :
  - ✅ **ACQUIS** (badge animé, confettis, points gagnés) si `mastery_status = 'acquired'`
  - ❌ **CONTINUE D'APPRENDRE** (encouragement, CTA "Réessayer plus tard") si `not_acquired`
  - **Jamais** de score numérique

**AC3 — Écran principal enfant**
- **And** total points : `player_progress.total_points`
- **And** badges : grille `player_badges JOIN badge_definitions`
- **And** streak actif : `player_progress.current_streak` (flamme animée)
- **And** thèmes acquis : liste avec date

**AC4 — RLS enfant sans métriques numériques**
- **And** `mastery_percent`, `correct_count`, `questions_answered` exclus des policies SELECT pour `role = 'child'`

**AC5 — Couverture UX**
- **And** UX-10 couvert : max 5 questions, grandes cibles tactiles ≥ 44×44pt

## Tasks / Subtasks

- [ ] Task 1 — Écran quiz mobile (AC: #1, #2)
  - [ ] 1.1 Créer `apps/mobile/app/(child)/quiz/[attemptId]/index.tsx`
  - [ ] 1.2 Composant `QuizCard` avec 3–4 options dans `@aureak/ui` (zones tactiles ≥ 44×44pt)
  - [ ] 1.3 Animation retour réponse (correct/incorrect)
  - [ ] 1.4 Écran résultat ACQUIS/NON-ACQUIS (sans score)
  - [ ] 1.5 Confettis sur ACQUIS (expo-confetti ou animation native)

- [ ] Task 2 — Écran principal enfant (AC: #3)
  - [ ] 2.1 Créer `apps/mobile/app/(child)/index.tsx`
  - [ ] 2.2 Afficher `player_progress` (points, streak)
  - [ ] 2.3 Grille badges collectés

- [ ] Task 3 — RLS policies enfant (AC: #4)
  - [ ] 3.1 Policy SELECT `learning_attempts` pour child : exclure colonnes `mastery_percent`, `correct_count`, `questions_answered`
  - [ ] 3.2 Utiliser vue dédiée `learning_attempts_child_view` sans métriques

## Dev Notes

### Vue RLS enfant (sans métriques numériques)

```sql
-- Vue limitée pour les enfants — pas de métriques numériques
CREATE VIEW learning_attempts_child_view AS
SELECT
  id, session_id, child_id, theme_id, attempt_type,
  started_at, ended_at,
  mastery_status,  -- 'acquired' | 'not_acquired' uniquement
  stop_reason,
  review_due_at,
  created_at
FROM learning_attempts;

-- Policy : un enfant voit uniquement ses tentatives via cette vue
-- (mastery_percent, correct_count, questions_answered NON inclus)
```

### Composant `QuizCard`

```typescript
// packages/ui/src/components/QuizCard.tsx
// Props: question: string, options: {id: string, text: string}[], onSelect: (optionId: string) => void
// - Zones tactiles ≥ 44×44pt (minHeight: 44)
// - Pas d'import expo-haptics (compatibilité web)
// - onHaptic?: () => void — injecté par mobile
```

### Écran quiz

```typescript
// apps/mobile/app/(child)/quiz/[attemptId]/index.tsx
import * as Haptics from 'expo-haptics'

// Flux :
// 1. Charger questions disponibles pour le thème
// 2. Afficher question courante via QuizCard
// 3. Appeler submit_answer → retour is_correct + should_stop
// 4. Animation retour (vert/rouge)
// 5. Si should_stop → afficher écran résultat ACQUIS/NON-ACQUIS
// 6. Jamais afficher mastery_percent à l'enfant
```

### Dépendances

- **Prérequis** : Story 8.2 (submit_answer, finalize_attempt) + Story 8.1 (player_progress) + Story 12.1 (player_badges — pour l'affichage)
- **Note** : L'affichage des badges (AC3) requiert Epic 12 — prévoir skeleton UI si badges non encore déployés

### References
- [Source: epics.md#Story-8.3] — lignes 2361–2389

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
