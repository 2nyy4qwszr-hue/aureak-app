-- Fix Epic 86 seed — corrections matrice par défaut
-- Issue détectée au test UI live (19 avril 2026) :
-- 1. Parent avait accès à la section Partenariat (sponsors/ambassadeurs) — inapproprié
--    (le parent doit voir uniquement dashboard + ce qui le concerne personnellement)
-- 2. Joueur (child) n'avait pas accès à son Dashboard — bug du seed 00150
--    (le joueur connecté doit toujours voir son propre dashboard)
--
-- Idempotent : UPDATE direct, sans effet si la valeur est déjà correcte.
-- Ne déclenche pas de re-seed ni de conflit sur les overrides utilisateurs.

-- Fix 1 : child voit toujours son dashboard
UPDATE section_permissions
SET granted = TRUE
WHERE role = 'child' AND section_key = 'dashboard';

-- Fix 2 : parent n'a pas accès à la section Partenariat
UPDATE section_permissions
SET granted = FALSE
WHERE role = 'parent' AND section_key = 'partenariat';
