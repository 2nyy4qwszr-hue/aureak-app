-- Migration 00059 : Table school_calendar_exceptions pour l'auto-génération des séances
-- Story 13.2 — Sessions : Calendrier, Auto-génération & Gestion des Exceptions
-- Idempotent : IF NOT EXISTS sur table et policies

CREATE TABLE IF NOT EXISTS school_calendar_exceptions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date          DATE        NOT NULL,
  label         TEXT        NOT NULL,
  is_no_session BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, date)
);

-- Index pour lookup rapide lors de la génération (AC #1 task 1.3)
CREATE INDEX IF NOT EXISTS idx_school_calendar_tenant_date
  ON school_calendar_exceptions (tenant_id, date);

ALTER TABLE school_calendar_exceptions ENABLE ROW LEVEL SECURITY;

-- Policy admin : full access sur leur tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'school_calendar_exceptions'
    AND policyname = 'admin_all_school_calendar'
  ) THEN
    CREATE POLICY "admin_all_school_calendar" ON school_calendar_exceptions
      FOR ALL
      USING (
        tenant_id = current_tenant_id()
        AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'admin'
        )
      );
  END IF;
END$$;

-- Policy lecture pour tous les rôles authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'school_calendar_exceptions'
    AND policyname = 'all_select_school_calendar'
  ) THEN
    CREATE POLICY "all_select_school_calendar" ON school_calendar_exceptions
      FOR SELECT
      USING (tenant_id = current_tenant_id());
  END IF;
END$$;

-- ── Seed : Vacances scolaires belges 2025-2026 (réseau libre, Belgique) ──────
-- NOTE : Ces dates sont approximatives. L'admin peut les modifier via la page
-- Settings > Calendrier scolaire. Elles ne s'appliquent qu'au tenant courant.
-- La seed utilise un DO block pour insérer seulement si aucune exception n'existe
-- (idempotence : relancer la migration ne crée pas de doublons).

-- Toussaint 2025 : lundi 27 oct → dimanche 2 nov
DO $$
DECLARE v_tid UUID;
BEGIN
  BEGIN
    v_tid := current_tenant_id();
  EXCEPTION WHEN OTHERS THEN
    -- Pas de tenant courant (migration hors session auth) → skip seed
    RETURN;
  END;

  -- current_tenant_id() retourne NULL hors session auth → skip seed
  IF v_tid IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM school_calendar_exceptions WHERE tenant_id = v_tid) THEN
    INSERT INTO school_calendar_exceptions (tenant_id, date, label) VALUES
      -- Toussaint 2025
      (v_tid, '2025-10-27', 'Vacances Toussaint'),
      (v_tid, '2025-10-28', 'Vacances Toussaint'),
      (v_tid, '2025-10-29', 'Vacances Toussaint'),
      (v_tid, '2025-10-30', 'Vacances Toussaint'),
      (v_tid, '2025-10-31', 'Vacances Toussaint'),
      (v_tid, '2025-11-01', 'Vacances Toussaint'),
      (v_tid, '2025-11-02', 'Vacances Toussaint'),
      -- Noël 2025-2026 : lundi 22 déc → dimanche 4 jan
      (v_tid, '2025-12-22', 'Vacances Noël'),
      (v_tid, '2025-12-23', 'Vacances Noël'),
      (v_tid, '2025-12-24', 'Vacances Noël'),
      (v_tid, '2025-12-25', 'Vacances Noël'),
      (v_tid, '2025-12-26', 'Vacances Noël'),
      (v_tid, '2025-12-27', 'Vacances Noël'),
      (v_tid, '2025-12-28', 'Vacances Noël'),
      (v_tid, '2025-12-29', 'Vacances Noël'),
      (v_tid, '2025-12-30', 'Vacances Noël'),
      (v_tid, '2025-12-31', 'Vacances Noël'),
      (v_tid, '2026-01-01', 'Jour de l''An'),
      (v_tid, '2026-01-02', 'Vacances Noël'),
      (v_tid, '2026-01-03', 'Vacances Noël'),
      (v_tid, '2026-01-04', 'Vacances Noël'),
      -- Carnaval 2026 : lundi 16 fév → dimanche 22 fév
      (v_tid, '2026-02-16', 'Vacances Carnaval'),
      (v_tid, '2026-02-17', 'Vacances Carnaval'),
      (v_tid, '2026-02-18', 'Vacances Carnaval'),
      (v_tid, '2026-02-19', 'Vacances Carnaval'),
      (v_tid, '2026-02-20', 'Vacances Carnaval'),
      (v_tid, '2026-02-21', 'Vacances Carnaval'),
      (v_tid, '2026-02-22', 'Vacances Carnaval'),
      -- Pâques 2026 : lundi 6 avr → dimanche 19 avr
      (v_tid, '2026-04-06', 'Vacances Pâques'),
      (v_tid, '2026-04-07', 'Vacances Pâques'),
      (v_tid, '2026-04-08', 'Vacances Pâques'),
      (v_tid, '2026-04-09', 'Vacances Pâques'),
      (v_tid, '2026-04-10', 'Vacances Pâques'),
      (v_tid, '2026-04-11', 'Vacances Pâques'),
      (v_tid, '2026-04-12', 'Vacances Pâques'),
      (v_tid, '2026-04-13', 'Vacances Pâques'),
      (v_tid, '2026-04-14', 'Vacances Pâques'),
      (v_tid, '2026-04-15', 'Vacances Pâques'),
      (v_tid, '2026-04-16', 'Vacances Pâques'),
      (v_tid, '2026-04-17', 'Vacances Pâques'),
      (v_tid, '2026-04-18', 'Vacances Pâques'),
      (v_tid, '2026-04-19', 'Vacances Pâques');
  END IF;
END$$;
