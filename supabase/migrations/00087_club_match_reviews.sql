-- Migration 00087 — Table club_match_reviews
-- Story 28-3 — Reviews manuelles pour les matchings RBFA à confiance moyenne
-- (Les numéros 00081/00082 planifiés en 28-1 ont été pris par d'autres stories)

CREATE TABLE IF NOT EXISTS club_match_reviews (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID          NOT NULL REFERENCES tenants(id),
  club_directory_id UUID          NOT NULL REFERENCES club_directory(id) ON DELETE CASCADE,
  rbfa_candidate    JSONB         NOT NULL,
  match_score       NUMERIC(5,2)  NOT NULL,
  score_detail      JSONB         NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'pending'
                    CONSTRAINT club_match_reviews_status_check
                    CHECK (status IN ('pending','confirmed','rejected')),
  reviewed_by       UUID          REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE club_match_reviews IS 'Reviews manuelles pour les matchings RBFA à confiance moyenne (score 40-74)';

ALTER TABLE club_match_reviews ENABLE ROW LEVEL SECURITY;

-- Accès admin uniquement (isolation par tenant)
CREATE POLICY "Admin accès club_match_reviews"
  ON club_match_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id    = auth.uid()
        AND profiles.user_role  = 'admin'
        AND profiles.tenant_id  = club_match_reviews.tenant_id
    )
  );

-- Index pour les requêtes de liste (filtre status, tri par score)
CREATE INDEX IF NOT EXISTS idx_club_match_reviews_status
  ON club_match_reviews(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_club_match_reviews_club
  ON club_match_reviews(club_directory_id);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_club_match_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_club_match_reviews_updated_at
  BEFORE UPDATE ON club_match_reviews
  FOR EACH ROW EXECUTE FUNCTION update_club_match_reviews_updated_at();
