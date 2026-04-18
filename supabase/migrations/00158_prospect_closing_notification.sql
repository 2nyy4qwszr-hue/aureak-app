-- Migration 00155 — Notification fondateur quand prospect passe à rdv_qualifie
-- Story 88.6 — Trigger DB qui insère une notification in-app pour tous les admins du tenant

CREATE OR REPLACE FUNCTION trg_notify_admins_rdv_qualifie()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger only when status changes TO rdv_qualifie
  IF NEW.status = 'rdv_qualifie' AND (OLD.status IS DISTINCT FROM 'rdv_qualifie') THEN
    INSERT INTO inapp_notifications (tenant_id, user_id, title, body, type)
    SELECT
      NEW.tenant_id,
      p.user_id,
      'Prospect prêt pour closing',
      'Le club "' || NEW.club_name || '" est passé en RDV qualifié. Un closing peut être planifié.',
      'info'
    FROM profiles p
    WHERE p.tenant_id = NEW.tenant_id
      AND p.user_role = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_admins_rdv_qualifie ON club_prospects;
CREATE TRIGGER notify_admins_rdv_qualifie
  AFTER UPDATE ON club_prospects
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_admins_rdv_qualifie();
