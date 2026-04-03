-- Migration 00082 : File de validation manuelle des matchings RBFA
-- Story 28-1 — RBFA enrichissement clubs

-- ── Table club_match_reviews ─────────────────────────────────────────────────

CREATE TABLE club_match_reviews (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID        NOT NULL REFERENCES tenants(id),
  club_directory_id  UUID        NOT NULL REFERENCES club_directory(id) ON DELETE CASCADE,

  -- Candidat RBFA brut : { rbfaId, nom, matricule, logoUrl, rbfaUrl, ville, province }
  rbfa_candidate     JSONB       NOT NULL,

  -- Score de matching global 0–100
  match_score        NUMERIC(5, 2) NOT NULL,

  -- Détail par champ : { matricule, nomExact, nomSimilarite, ville, province }
  score_detail       JSONB       NOT NULL DEFAULT '{}',

  -- Statut de la review
  status             TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'confirmed', 'rejected')),

  -- Qui a validé / rejeté (null si en attente)
  reviewed_by        UUID        REFERENCES auth.users(id) NULL,
  reviewed_at        TIMESTAMPTZ NULL,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_match_reviews ENABLE ROW LEVEL SECURITY;

-- Isolation tenant : admins uniquement
CREATE POLICY "club_match_reviews_admin"
  ON club_match_reviews
  FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_club_match_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_match_reviews_updated_at
  BEFORE UPDATE ON club_match_reviews
  FOR EACH ROW EXECUTE FUNCTION set_club_match_reviews_updated_at();

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX idx_club_match_reviews_tenant_status
  ON club_match_reviews (tenant_id, status);

CREATE INDEX idx_club_match_reviews_club
  ON club_match_reviews (club_directory_id);
