-- Migration 00131 — Gamification : quêtes hebdomadaires coaches
-- Story 59-5 — Table coach_quests + quest_type 'coach_action' + fonction SQL

-- ─── Étendre quest_definitions : ajouter 'coach_action' au check constraint ───
-- Méthode compatible Supabase : drop constraint + recreate
ALTER TABLE quest_definitions
  DROP CONSTRAINT IF EXISTS quest_definitions_quest_type_check;

ALTER TABLE quest_definitions
  ADD CONSTRAINT quest_definitions_quest_type_check
  CHECK (quest_type IN ('attend_sessions', 'acquire_themes', 'complete_reviews', 'coach_action'));

-- ─── Seed 5 quêtes coaches dans quest_definitions ─────────────────────────────
INSERT INTO quest_definitions (tenant_id, code, name, description, recurrence, quest_type, target_value, xp_reward, is_active)
SELECT
  t.id AS tenant_id,
  q.code, q.name, q.description, 'weekly' AS recurrence, 'coach_action' AS quest_type,
  q.target_value, q.xp_reward, true AS is_active
FROM tenants t
CROSS JOIN (VALUES
  ('VALIDER_3_SEANCES',  'Valider 3 séances',            'Valider 3 séances cette semaine',                      3,  25),
  ('EVALUER_10_JOUEURS', 'Évaluer 10 joueurs',           'Évaluer 10 joueurs cette semaine',                     10, 50),
  ('NOTER_PROGRESSION',  'Notes de progression',         'Ajouter 5 notes de progression sur les joueurs',       5,  35),
  ('PRESENCE_100PCT',    'Présences complètes',          'Enregistrer 100% des présences sur une séance',        1,  40),
  ('SEANCE_COMPLETE',    'Séance complète',              'Compléter une séance avec thème + participants',        1,  30)
) AS q(code, name, description, target_value, xp_reward)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ─── Table coach_quests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_quests (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id),
  coach_id            UUID        NOT NULL REFERENCES profiles(user_id),
  quest_definition_id UUID        NOT NULL REFERENCES quest_definitions(id),
  status              TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired')),
  current_value       INTEGER     NOT NULL DEFAULT 0,
  target_value        INTEGER     NOT NULL,
  period_start        DATE        NOT NULL,
  period_end          DATE        NOT NULL,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, quest_definition_id, period_start)
);

ALTER TABLE coach_quests ENABLE ROW LEVEL SECURITY;

-- staff_own_read : un coach voit ses propres quêtes
DO $$ BEGIN
  CREATE POLICY "cq_staff_own_read" ON coach_quests
    FOR SELECT USING (coach_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- admin_read_all : admin voit toutes les quêtes coaches du tenant
DO $$ BEGIN
  CREATE POLICY "cq_admin_read" ON coach_quests
    FOR SELECT USING (current_user_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- insert_rpc : insertion via RPC ou Edge Function uniquement
DO $$ BEGIN
  CREATE POLICY "cq_insert_rpc" ON coach_quests
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- update_rpc : mise à jour progression via RPC uniquement
DO $$ BEGIN
  CREATE POLICY "cq_update_rpc" ON coach_quests
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS cq_coach_status ON coach_quests (coach_id, status, period_end);
CREATE INDEX IF NOT EXISTS cq_tenant_period ON coach_quests (tenant_id, period_start DESC);

-- ─── Fonction SQL : assign_weekly_coach_quests ────────────────────────────────
CREATE OR REPLACE FUNCTION assign_weekly_coach_quests(
  p_coach_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id   UUID;
  v_week_start  DATE;
  v_week_end    DATE;
BEGIN
  -- Récupérer le tenant du coach
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE user_id = p_coach_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Coach % not found', p_coach_id;
  END IF;

  -- Calculer lundi → dimanche de la semaine courante
  v_week_start := date_trunc('week', CURRENT_DATE)::date;
  v_week_end   := v_week_start + 6;

  -- Insérer les 5 quêtes coach_action pour cette semaine
  INSERT INTO coach_quests (
    tenant_id, coach_id, quest_definition_id, status,
    current_value, target_value, period_start, period_end
  )
  SELECT
    v_tenant_id,
    p_coach_id,
    qd.id,
    'active',
    0,
    qd.target_value,
    v_week_start,
    v_week_end
  FROM quest_definitions qd
  WHERE qd.tenant_id = v_tenant_id
    AND qd.quest_type = 'coach_action'
    AND qd.is_active = true
  ON CONFLICT (coach_id, quest_definition_id, period_start) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION assign_weekly_coach_quests FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_weekly_coach_quests TO authenticated;
