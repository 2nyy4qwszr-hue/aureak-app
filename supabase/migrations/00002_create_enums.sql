-- =============================================================================
-- Migration 00002 : Enums PostgreSQL
-- Story 1.2 — Types standardisés (mirrés dans @aureak/types)
-- RÈGLE : tout enum ici DOIT avoir son miroir TypeScript dans packages/types/src/enums.ts
-- =============================================================================

-- Rôles utilisateur (correspond au champ `role` dans JWT app_metadata)
CREATE TYPE user_role AS ENUM (
  'admin',
  'coach',
  'parent',
  'child'
);

-- Niveaux d'accès clubs partenaires (utilisé dans Story 2.5 + 11.3)
CREATE TYPE club_access_level AS ENUM (
  'partner',
  'common'
);

-- Statuts de présence terrain (utilisé dans Epic 5)
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'injured',
  'late',
  'trial'   -- enfant invité non inscrit
);

-- Signaux d'évaluation coach (2 états + vide — jamais de signal rouge)
CREATE TYPE evaluation_signal AS ENUM (
  'positive',   -- 🟢
  'attention',  -- 🟡
  'none'        -- ○ vide — aucune information envoyée au parent
);

-- Statut de synchronisation offline (utilisé dans Epic 5)
CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'failed'
);

-- Canaux de notification (utilisé dans Epic 7)
CREATE TYPE notification_channel AS ENUM (
  'push',
  'email',
  'sms'
);
