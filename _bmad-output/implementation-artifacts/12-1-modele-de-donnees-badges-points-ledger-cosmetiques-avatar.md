# Story 12.1 : Modèle de Données — Badges, Points Ledger & Cosmétiques Avatar

Status: phase-2

## Story

En tant que développeur,
Je veux créer le modèle de données complet de la couche gamification MVP : définitions de badges avec valeur en points, ledger immuable, collection de badges par enfant, et items cosmétiques d'avatar débloquables via badges/points,
Afin que le système de récompenses soit découplé du moteur d'apprentissage, idempotent, et auditable.

## Acceptance Criteria

**AC1 — Tables créées**
- **When** la migration Story 12.1 est exécutée
- **Then** `badge_definitions`, `player_badges`, `player_points_ledger`, `avatar_items`, `player_avatars`, `player_unlocked_items`, `player_theme_mastery`, `skill_cards`, `player_skill_cards` créées

**AC2 — Trigger `after_player_badge_insert`**
- **And** à chaque INSERT `player_badges` → INSERT automatique `player_points_ledger` + UPDATE `player_progress.total_points`

**AC3 — RPC `award_badge_if_applicable`**
- **And** SECURITY DEFINER, idempotency via `processed_operations`, `INSERT ON CONFLICT DO NOTHING`
- **And** appelle `check_and_award_items(child_id)` pour items cosmétiques
- **And** retourne `{ badges_awarded, items_unlocked }`

**AC4 — Seed badges de base**
- **And** 5 badges de base seedés : `FIRST_ACQUIRED` (10pts), `EARLY_BIRD` (25pts), `STREAK_3` (30pts), `STREAK_7` (75pts), `SKILL_REVALIDATED` (30pts)

**AC5 — RLS**
- **And** `player_points_ledger` : aucun UPDATE ni DELETE autorisé même pour admin (append-only)
- **And** enfant voit uniquement ses propres données

**AC6 — Contraintes schéma**
- **And** `player_badges` : UNIQUE(child_id, badge_id) — un badge par enfant une seule fois
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00031_gamification.sql` (AC: #1, #5, #6)
  - [ ] 1.1 Créer `badge_definitions` + `player_badges` + `player_points_ledger`
  - [ ] 1.2 Créer `avatar_items` + `player_avatars` + `player_unlocked_items`
  - [ ] 1.3 Créer `player_theme_mastery` + `skill_cards` + `player_skill_cards`
  - [ ] 1.4 Activer RLS sur toutes les tables avec policies

- [ ] Task 2 — Trigger `after_player_badge_insert` (AC: #2)
  - [ ] 2.1 Fonction `fn_badge_awarded_ledger()` + trigger

- [ ] Task 3 — RPC `award_badge_if_applicable` (AC: #3)
  - [ ] 3.1 Implémenter avec idempotency `processed_operations`
  - [ ] 3.2 Implémenter `check_and_award_items(child_id)`

- [ ] Task 4 — Seed badges de base (AC: #4)
  - [ ] 4.1 SQL seed dans la migration (ou Edge Function `init-tenant`)

## Dev Notes

### Migration `00031_gamification.sql`

```sql
-- Définitions de badges
CREATE TABLE badge_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  code        TEXT NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  icon_url    TEXT,
  points      INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  season      INTEGER,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON badge_definitions
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON badge_definitions
  FOR ALL USING (current_user_role() = 'admin');

-- Badges attribués (append-only, un badge par enfant)
CREATE TABLE player_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  child_id   UUID NOT NULL REFERENCES profiles(user_id),
  badge_id   UUID NOT NULL REFERENCES badge_definitions(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source     TEXT NOT NULL CHECK (source IN ('quiz','attendance','skill_mastered','coach_award','special_event')),
  ref_id     UUID,
  UNIQUE (child_id, badge_id)
);
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON player_badges FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "child_own" ON player_badges FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "parent_children" ON player_badges FOR SELECT USING (
  current_user_role() = 'parent' AND EXISTS (
    SELECT 1 FROM parent_child_links WHERE child_id = player_badges.child_id AND parent_id = auth.uid()
  )
);
CREATE POLICY "staff_read" ON player_badges FOR SELECT USING (current_user_role() IN ('coach','admin'));
CREATE INDEX pb_child ON player_badges (child_id, awarded_at DESC);

-- Ledger de points immuable (append-only)
CREATE TABLE player_points_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  event_type   TEXT NOT NULL DEFAULT 'BADGE_AWARDED' CHECK (event_type IN ('BADGE_AWARDED')),
  ref_id       UUID NOT NULL,
  points_delta INTEGER NOT NULL CHECK (points_delta > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON player_points_ledger FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "child_own" ON player_points_ledger FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "parent_children" ON player_points_ledger FOR SELECT USING (
  current_user_role() = 'parent' AND EXISTS (
    SELECT 1 FROM parent_child_links WHERE child_id = player_points_ledger.child_id AND parent_id = auth.uid()
  )
);
-- Immuable : ni update ni delete, même pour admin
CREATE POLICY "no_update" ON player_points_ledger FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON player_points_ledger FOR DELETE USING (false);
CREATE INDEX ppl_child ON player_points_ledger (child_id, created_at DESC);

-- Items cosmétiques avatar
CREATE TABLE avatar_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('frame','background','accessory','effect','title')),
  unlock_condition JSONB NOT NULL,
  asset_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER,
  UNIQUE (tenant_id, slug)
);
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON avatar_items FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON avatar_items FOR ALL USING (current_user_role() = 'admin');

-- Avatar équipé par l'enfant
CREATE TABLE player_avatars (
  child_id            UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  equipped_frame      UUID REFERENCES avatar_items(id),
  equipped_background UUID REFERENCES avatar_items(id),
  equipped_accessory  UUID REFERENCES avatar_items(id),
  equipped_effect     UUID REFERENCES avatar_items(id),
  equipped_title      UUID REFERENCES avatar_items(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE player_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_avatars FOR ALL USING (child_id = auth.uid());

-- Items débloqués
CREATE TABLE player_unlocked_items (
  child_id       UUID NOT NULL REFERENCES profiles(user_id),
  item_id        UUID NOT NULL REFERENCES avatar_items(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_trigger TEXT NOT NULL CHECK (unlock_trigger IN ('badge_earned','total_points','themes_acquired')),
  PRIMARY KEY (child_id, item_id)
);
ALTER TABLE player_unlocked_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_unlocked_items FOR SELECT USING (child_id = auth.uid());

-- Snapshot maîtrise par thème
CREATE TABLE player_theme_mastery (
  child_id          UUID NOT NULL REFERENCES profiles(user_id),
  theme_id          UUID NOT NULL REFERENCES themes(id),
  tenant_id         UUID NOT NULL,
  mastery_status    TEXT NOT NULL DEFAULT 'not_started'
    CHECK (mastery_status IN ('not_started','in_progress','acquired','revalidated')),
  first_acquired_at TIMESTAMPTZ,
  last_attempt_at   TIMESTAMPTZ,
  total_attempts    INTEGER NOT NULL DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, theme_id)
);
ALTER TABLE player_theme_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_theme_mastery FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "parent_children" ON player_theme_mastery FOR SELECT USING (
  current_user_role() = 'parent' AND EXISTS (
    SELECT 1 FROM parent_child_links WHERE child_id = player_theme_mastery.child_id AND parent_id = auth.uid()
  )
);
CREATE POLICY "staff_read" ON player_theme_mastery FOR SELECT USING (current_user_role() IN ('coach','admin'));

-- Skill cards catalogue
CREATE TABLE skill_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  theme_id         UUID NOT NULL REFERENCES themes(id),
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  rarity           TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  illustration_url TEXT,
  unlock_condition TEXT NOT NULL CHECK (unlock_condition IN ('theme_acquired','revalidated','first_acquired','streak_active')),
  UNIQUE (tenant_id, slug)
);
ALTER TABLE skill_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON skill_cards FOR SELECT USING (tenant_id = current_tenant_id());

-- Collection skill cards
CREATE TABLE player_skill_cards (
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  skill_card_id UUID NOT NULL REFERENCES skill_cards(id),
  tenant_id     UUID NOT NULL,
  collected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, skill_card_id)
);
ALTER TABLE player_skill_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_own" ON player_skill_cards FOR SELECT USING (child_id = auth.uid());
```

### Trigger `fn_badge_awarded_ledger`

```sql
CREATE OR REPLACE FUNCTION fn_badge_awarded_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_points INTEGER;
BEGIN
  SELECT points INTO v_points FROM badge_definitions WHERE id = NEW.badge_id;
  IF v_points > 0 THEN
    INSERT INTO player_points_ledger
      (tenant_id, child_id, event_type, ref_id, points_delta)
    VALUES
      (NEW.tenant_id, NEW.child_id, 'BADGE_AWARDED', NEW.badge_id, v_points);
    UPDATE player_progress
      SET total_points = total_points + v_points, updated_at = now()
      WHERE child_id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER after_player_badge_insert
  AFTER INSERT ON player_badges
  FOR EACH ROW EXECUTE FUNCTION fn_badge_awarded_ledger();
```

### Seed badges de base

```sql
-- Inséré dans la migration ou dans init-tenant Edge Function
-- Ces badges sont seedés par tenant lors de l'initialisation
INSERT INTO badge_definitions (tenant_id, code, label, description, points) VALUES
  (current_setting('app.tenant_id')::uuid, 'FIRST_ACQUIRED', 'Première Maîtrise', 'Première compétence acquise', 10),
  (current_setting('app.tenant_id')::uuid, 'EARLY_BIRD', 'Matinal', 'Maîtrise acquise dans les 72h post-séance', 25),
  (current_setting('app.tenant_id')::uuid, 'STREAK_3', 'Sur ma lancée', '3 séances consécutives avec ≥ 1 acquis', 30),
  (current_setting('app.tenant_id')::uuid, 'STREAK_7', 'Invincible', '7 séances consécutives', 75),
  (current_setting('app.tenant_id')::uuid, 'SKILL_REVALIDATED', 'Confirmé', 'Revalidation réussie', 30)
ON CONFLICT (tenant_id, code) DO NOTHING;
```

### Dépendances

- **Prérequis** : Story 8.1 (`player_progress`) + Story 3.1 (themes) + Story 2.1 (profiles, parent_child_links)
- **Requis par** : Story 12.2 (event bus gamification — utilise toutes ces tables)

### References
- [Source: epics.md#Story-12.1] — lignes 2479–2675

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
