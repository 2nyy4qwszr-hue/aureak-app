-- Migration 00002 — Enums PostgreSQL standards
-- Story 1.2 — Tous les enums du projet
-- Prérequis : 00001 (extensions)
-- RÈGLE ARCH-12 : chaque enum a son type TypeScript miroir dans @aureak/types

-- Rôles utilisateur (correspond au champ `role` dans JWT app_metadata)
CREATE TYPE user_role AS ENUM (
  'admin',
  'coach',
  'parent',
  'child'
);

-- Niveaux d'accès clubs partenaires
CREATE TYPE club_access_level AS ENUM (
  'partner',
  'common'
);

-- Statuts de présence terrain
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'injured',
  'late',
  'trial'   -- enfant invité non inscrit
);

-- Signaux d'évaluation coach (2 états + vide — jamais de rouge)
CREATE TYPE evaluation_signal AS ENUM (
  'positive',   -- vert
  'attention',  -- jaune
  'none'        -- vide — aucune information envoyée
);

-- Statut de sync offline
CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'failed'
);

-- Canaux de notification
CREATE TYPE notification_channel AS ENUM (
  'push',
  'email',
  'sms'
);
