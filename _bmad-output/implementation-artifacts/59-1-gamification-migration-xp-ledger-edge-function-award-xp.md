# Story 59-1 : Gamification Migration XP Ledger + Edge Function award-xp

Status: done
Epic: 59 — Gamification XP
Priority: P0 (fondation)
Dependencies: none

## Description

Migration : tables `xp_ledger` (child_id, amount, reason, source_type, source_id) + `child_progression` (child_id, total_xp, level, title).
Edge Function `award-xp` (appel interne).
Types TS.

## Acceptance Criteria

- [x] AC1 : Table `xp_ledger` creee avec RLS (migration 00129)
- [x] AC2 : Table `player_xp_progression` creee avec RLS (migration 00129)
- [x] AC3 : Edge Function `award-xp` fonctionnelle (supabase/functions/award-xp/)
- [x] AC4 : Types TS `XpLedgerEntry`, `PlayerXpSnapshot`, `XpEvent` dans `@aureak/types`
- [x] AC5 : API client `awardXp`, `getXpLedger`, `getXpProgression` dans `@aureak/api-client`

## Tasks

- [x] T1 : Migration 00129 xp_ledger + player_xp_progression
- [x] T2 : Types XpLedgerEntry, PlayerXpSnapshot, XpEvent dans entities.ts
- [x] T3 : Edge Function award-xp
- [x] T4 : API client gamification/xp.ts

## Notes

Tout deja implemente. Migration 00129, types, edge function et API client existent.
