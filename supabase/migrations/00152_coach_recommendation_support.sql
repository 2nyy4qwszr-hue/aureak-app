-- Story 90.2 — Support recommandation coach prospect par un coach
-- 1. Ajouter recommended_by_id pour tracer le coach recommandant
-- 2. Permettre aux coaches d'insérer des prospects (source = recommendation_coach)
-- 3. Permettre aux coaches d'insérer des notifications in-app pour les managers

-- 1. Colonne recommended_by_id
ALTER TABLE coach_prospects
  ADD COLUMN IF NOT EXISTS recommended_by_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_coach_prospects_recommended_by
  ON coach_prospects(recommended_by_id)
  WHERE deleted_at IS NULL;

-- 2. Politique INSERT : autoriser les coaches à insérer des prospects
-- (en complément de la politique existante coach_prospects_insert pour admin/commercial)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_prospects' AND policyname = 'coach_prospects_insert_coach'
  ) THEN
    CREATE POLICY coach_prospects_insert_coach ON coach_prospects FOR INSERT WITH CHECK (
      tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      AND (auth.jwt() ->> 'role') = 'coach'
      AND recommended_by_id = auth.uid()
    );
  END IF;
END $$;

-- 3. Politique INSERT sur inapp_notifications pour les coaches
-- (permet d'envoyer une notif aux managers lors d'une recommandation)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inapp_notifications' AND policyname = 'coach_insert_notifications'
  ) THEN
    CREATE POLICY coach_insert_notifications ON inapp_notifications FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
          AND profiles.user_role = 'coach'
          AND profiles.tenant_id = inapp_notifications.tenant_id
      )
    );
  END IF;
END $$;

COMMENT ON COLUMN coach_prospects.recommended_by_id IS
  'Story 90.2 — ID du coach qui a recommandé ce prospect (NULL si ajouté par admin/manager)';
