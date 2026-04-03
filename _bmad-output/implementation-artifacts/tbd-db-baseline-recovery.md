# Story: Baseline DB — note de synchronisation

**ID:** tbd-db-baseline-recovery
**Status:** done
**Source:** new
**Epic:** TBD — Infrastructure

## Description
Créer une migration 00108 qui sert de point de baseline après les migrations 00001-00107.

## Changements effectués
- `supabase/migrations/00108_baseline_sync_note.sql` : migration no-op de synchronisation
  - Aucune modification de schéma
  - Note explicite sur le contexte de baseline
  - `DO $$ BEGIN RAISE NOTICE ... END $$;`

## Acceptance Criteria
- [x] Migration 00108 créée dans le bon répertoire
- [x] No-op (pas de changement de schéma)
- [x] Note explicative incluse

## Commit
`chore(db): migration 00108 — note de synchronisation baseline`
