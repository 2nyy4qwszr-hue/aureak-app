-- Seed : tenant initial + profil admin Jeremy
-- À supprimer ou conserver selon la politique de seed du projet

INSERT INTO tenants (id, name)
VALUES ('1bac8d39-6518-4867-ac79-b64eb8bf35df', 'Aureak')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (user_id, tenant_id, user_role, display_name, status)
VALUES (
  '1bac8d39-6518-4867-ac79-b64eb8bf35df',
  '1bac8d39-6518-4867-ac79-b64eb8bf35df',
  'admin',
  'Jeremy',
  'active'
)
ON CONFLICT (user_id) DO UPDATE SET
  user_role    = 'admin',
  display_name = 'Jeremy',
  status       = 'active';
