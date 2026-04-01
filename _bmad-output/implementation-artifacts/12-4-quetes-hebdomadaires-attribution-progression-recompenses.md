# Story 12.4 : Quêtes Hebdomadaires — Attribution, Progression & Récompenses

Status: phase-2

## Story

En tant qu'Enfant (et système),
Je veux recevoir automatiquement des quêtes hebdomadaires adaptées à mon niveau et voir ma progression en temps réel,
Afin d'avoir un objectif concret chaque semaine qui encourage la participation et l'apprentissage sans pression.

## Acceptance Criteria

**AC1 — Edge Function cron `assign-weekly-quests` (lundi 6h)**
- **When** une nouvelle semaine commence
- **Then** `assign_weekly_quests()` insère les quêtes `recurrence = 'weekly'` dans `player_quests` avec `status = 'active'`, `current_value = 0`
- **And** ignore les enfants inactifs depuis > 30 jours
- **And** `ON CONFLICT DO NOTHING` pour idempotency

**AC2 — Expiration des quêtes**
- **And** quêtes `status = 'active'` en fin de période → `status = 'expired'` par le même cron

**AC3 — Écran quêtes enfant**
- **And** affiche : nom + icône + description + barre progression (`current_value / target_value`) + badge récompense + temps restant

**AC4 — Progression en temps réel**
- **And** mise à jour par `award_badge_if_applicable()` (Story 12.2) après chaque événement

**AC5 — Complétion**
- **And** animation in-app + badge attribué via `award_badge_if_applicable()`
- **And** note MVP : `xp_reward = 0` pour toutes les quêtes MVP — points via badges uniquement

**AC6 — Notification rappel**
- **And** notification push dimanche soir si quête active non complétée

## Tasks / Subtasks

- [ ] Task 1 — Migration `00032_quests.sql` (AC: #1)
  - [ ] 1.1 Créer `quest_definitions` + `player_quests` + RLS

- [ ] Task 2 — Edge Function `assign-weekly-quests` (AC: #1, #2)
  - [ ] 2.1 Créer `supabase/functions/assign-weekly-quests/index.ts`
  - [ ] 2.2 Cron lundi 6h via pg_cron
  - [ ] 2.3 Logique attribution + expiration

- [ ] Task 3 — Progression quêtes dans `award_badge_if_applicable` (AC: #4)
  - [ ] 3.1 UPDATE `player_quests.current_value` après événements SESSION_ATTENDED / QUIZ_MASTERED

- [ ] Task 4 — Notification rappel (AC: #6)
  - [ ] 4.1 Cron dimanche 19h : détecter quêtes incomplètes + notification push

- [ ] Task 5 — UI Écran quêtes (AC: #3)
  - [ ] 5.1 Créer `apps/mobile/app/(child)/quests/index.tsx`

## Dev Notes

### Migration `00032_quests.sql`

```sql
-- Définitions de quêtes (catalogue)
CREATE TABLE quest_definitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  icon_url     TEXT,
  recurrence   TEXT NOT NULL DEFAULT 'weekly' CHECK (recurrence IN ('weekly','monthly','once')),
  quest_type   TEXT NOT NULL CHECK (quest_type IN ('attend_sessions','acquire_themes','complete_reviews')),
  target_value INTEGER NOT NULL,
  reward_badge_id UUID REFERENCES badge_definitions(id),
  xp_reward    INTEGER NOT NULL DEFAULT 0,  -- Réservé Phase 2 — toujours 0 en MVP
  is_active    BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);
ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON quest_definitions FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON quest_definitions FOR ALL USING (current_user_role() = 'admin');

-- Quêtes actives par enfant
CREATE TABLE player_quests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  quest_id      UUID NOT NULL REFERENCES quest_definitions(id),
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','expired')),
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value  INTEGER NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, quest_id, period_start)  -- idempotency
);
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_quests FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "staff_read" ON player_quests FOR SELECT USING (current_user_role() IN ('coach','admin'));
```

### Edge Function `assign-weekly-quests`

```typescript
// supabase/functions/assign-weekly-quests/index.ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const periodStart = monday.toISOString().split('T')[0]
  const periodEnd = sunday.toISOString().split('T')[0]

  // Expirer les quêtes de la semaine précédente
  await supabase
    .from('player_quests')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('period_end', periodStart)

  // Récupérer les quêtes hebdomadaires actives
  const { data: questDefs } = await supabase
    .from('quest_definitions')
    .select('id, target_value, tenant_id')
    .eq('recurrence', 'weekly')
    .eq('is_active', true)

  if (!questDefs?.length) return new Response('no quests')

  // Enfants actifs (last_activity_at > 30 jours)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const { data: activeChildren } = await supabase
    .from('player_progress')
    .select('child_id, tenant_id')
    .gte('last_activity_at', thirtyDaysAgo)

  const inserts: any[] = []
  for (const child of activeChildren ?? []) {
    for (const quest of questDefs.filter(q => q.tenant_id === child.tenant_id)) {
      inserts.push({
        tenant_id   : child.tenant_id,
        child_id    : child.child_id,
        quest_id    : quest.id,
        target_value: quest.target_value,
        period_start: periodStart,
        period_end  : periodEnd,
      })
    }
  }

  if (inserts.length) {
    await supabase.from('player_quests').insert(inserts)
      .onConflict(['child_id', 'quest_id', 'period_start'])  // ON CONFLICT DO NOTHING
  }

  return new Response(JSON.stringify({ assigned: inserts.length }))
})
```

### Progression quêtes (extension Story 12.2)

Dans `award_badge_if_applicable`, après attribution des badges, incrémenter les quêtes actives :
```sql
-- Incrémenter quêtes 'attend_sessions' si event = 'SESSION_ATTENDED'
UPDATE player_quests SET
  current_value = current_value + 1,
  completed_at = CASE WHEN current_value + 1 >= target_value THEN now() ELSE NULL END,
  status = CASE WHEN current_value + 1 >= target_value THEN 'completed' ELSE 'active' END
WHERE child_id = p_child_id
  AND status = 'active'
  AND period_end >= CURRENT_DATE
  AND quest_id IN (SELECT id FROM quest_definitions WHERE quest_type = 'attend_sessions');
```

### Seed quêtes de base

```sql
INSERT INTO quest_definitions (tenant_id, code, name, description, quest_type, target_value, xp_reward) VALUES
  (tenant_id, 'WEEKLY_3_SESSIONS', 'Assidu', 'Participe à 3 séances cette semaine', 'attend_sessions', 3, 0),
  (tenant_id, 'WEEKLY_1_MASTERY', 'Apprenant', 'Acquiers 1 compétence cette semaine', 'acquire_themes', 1, 0)
ON CONFLICT DO NOTHING;
```

### Dépendances

- **Prérequis** : Story 12.1 (badge_definitions) + Story 12.2 (award_badge_if_applicable pour complétion) + Story 7.1 (notifications rappel)

### References
- [Source: epics.md#Story-12.4] — lignes 2750–2776

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
