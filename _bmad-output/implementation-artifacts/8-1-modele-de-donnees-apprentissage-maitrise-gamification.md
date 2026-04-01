# Story 8.1 : Modèle de Données — Apprentissage, Maîtrise & Gamification

Status: done

## Story

En tant que développeur,
Je veux créer le modèle de données complet pour les tentatives d'apprentissage adaptatif, les seuils de maîtrise configurables, et le moteur de gamification (points ledger, badges, streaks),
Afin que toute la logique de progression soit traçable, versionnée et extensible.

## Acceptance Criteria

**AC1 — Tables créées**
- **When** la migration Story 8.1 est exécutée
- **Then** `mastery_thresholds`, `learning_attempts`, `learning_answers` sont créées avec toutes contraintes

**AC2 — Indexes partiels `mastery_thresholds`**
- **And** 4 indexes partiels pour unicité par scope : `global`, `theme`, `age_group`, `theme_age_group`

**AC3 — `player_progress` snapshot**
- **And** table `player_progress` créée (snapshot dénormalisé : total_points, current_streak, max_streak, themes_acquired_count)

**AC4 — RLS activé**
- **And** RLS activé sur toutes les tables — policies définies en Story 8.5

**AC5 — Note gamification**
- **And** `badge_definitions`, `player_badges`, `player_points_ledger` définis dans Epic 12 — Epic 8 déclenche des événements via RPC uniquement

**AC6 — Clean migration**
- **And** `supabase db diff` reste clean après migration

## Tasks / Subtasks

- [ ] Task 1 — Migration `00019_learning.sql` (AC: #1–#3)
  - [ ] 1.1 Créer `mastery_thresholds` + 4 indexes partiels
  - [ ] 1.2 Créer `learning_attempts` + index `(child_id, theme_id)`
  - [ ] 1.3 Créer `learning_answers`
  - [ ] 1.4 Créer `player_progress`
  - [ ] 1.5 Activer RLS sur toutes les tables

- [ ] Task 2 — Types TypeScript (AC: #1)
  - [ ] 2.1 Ajouter types `MasteryThreshold`, `LearningAttempt`, `LearningAnswer`, `PlayerProgress` dans `@aureak/types`

## Dev Notes

### Migration `00019_learning.sql`

```sql
-- Seuils de maîtrise configurables par Admin (scope hiérarchique)
CREATE TABLE mastery_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  scope_type TEXT NOT NULL
    CHECK (scope_type IN ('global','theme','age_group','theme_age_group')),
  theme_id  UUID REFERENCES themes(id),
  age_group TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  threshold INTEGER NOT NULL DEFAULT 80 CHECK (threshold BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE mastery_thresholds ENABLE ROW LEVEL SECURITY;

-- Unicité par scope (indexes partiels car colonnes nullable)
CREATE UNIQUE INDEX mt_global    ON mastery_thresholds (tenant_id)
  WHERE scope_type = 'global';
CREATE UNIQUE INDEX mt_theme     ON mastery_thresholds (tenant_id, theme_id)
  WHERE scope_type = 'theme';
CREATE UNIQUE INDEX mt_age       ON mastery_thresholds (tenant_id, age_group)
  WHERE scope_type = 'age_group';
CREATE UNIQUE INDEX mt_theme_age ON mastery_thresholds (tenant_id, theme_id, age_group)
  WHERE scope_type = 'theme_age_group';

-- Tentatives d'apprentissage adaptatif
CREATE TABLE learning_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id UUID REFERENCES sessions(id),     -- null pour revalidations standalone
  child_id UUID NOT NULL REFERENCES profiles(user_id),
  theme_id UUID NOT NULL REFERENCES themes(id),
  attempt_type TEXT NOT NULL DEFAULT 'post_session'
    CHECK (attempt_type IN ('post_session','revalidation')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  mastery_percent INTEGER CHECK (mastery_percent BETWEEN 0 AND 100),
  mastery_status TEXT CHECK (mastery_status IN ('acquired','not_acquired')),
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  stop_reason TEXT CHECK (stop_reason IN ('mastered','child_stopped','time_limit')),
  review_due_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_result TEXT CHECK (review_result IN ('maintained','lost')),
  model_name TEXT,  -- réservé intégration IA future
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE learning_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX learning_attempts_child_theme ON learning_attempts (child_id, theme_id);

-- Réponses individuelles par tentative
CREATE TABLE learning_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES learning_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id),
  selected_option_id UUID NOT NULL REFERENCES quiz_options(id),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE learning_answers ENABLE ROW LEVEL SECURITY;
CREATE INDEX la_attempt ON learning_answers (attempt_id);

-- Snapshot dénormalisé progression joueur
-- total_points = cache de SUM(player_points_ledger.points_delta) — recalculé par trigger Epic 12
CREATE TABLE player_progress (
  child_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  themes_acquired_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
```

### Types TypeScript

```typescript
// packages/types/src/learning.ts
export type AttemptType = 'post_session' | 'revalidation'
export type MasteryStatus = 'acquired' | 'not_acquired'
export type StopReason = 'mastered' | 'child_stopped' | 'time_limit'
export type AgeGroup = 'U5' | 'U8' | 'U11' | 'Senior'

export interface LearningAttempt {
  id: string
  tenantId: string
  sessionId: string | null
  childId: string
  themeId: string
  attemptType: AttemptType
  startedAt: string
  endedAt: string | null
  masteryPercent: number | null
  masteryStatus: MasteryStatus | null
  questionsAnswered: number
  correctCount: number
  stopReason: StopReason | null
  reviewDueAt: string | null
}

export interface PlayerProgress {
  childId: string
  tenantId: string
  totalPoints: number
  currentStreak: number
  maxStreak: number
  themesAcquiredCount: number
  lastActivityAt: string | null
}
```

### Dépendances

- **Prérequis** : Story 3.5 (quiz_questions, quiz_options) + Story 4.1 (sessions, session_themes) + Story 1.2 (profiles)
- **Consommé par** : Story 8.2 (moteur quiz) + Story 8.4 (streaks) + Epic 12 (badges, ledger)

### References
- [Source: epics.md#Story-8.1] — lignes 2237–2318

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
