-- Story 86.1 : Ajout des rôles manager et marketeur à l'enum user_role
-- ALTER TYPE ... ADD VALUE n'est pas réversible — ces rôles sont définitifs.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketeur';
