# Story 59-4 : 20 Badges Definitions + UI Grid

Status: done
Epic: 59 — Gamification XP
Priority: P1
Dependencies: 59-1

## Description

Migration : table `badge_definitions` + `child_badges` (player_badges).
Seed 20 badges predefinis.
BadgeGrid composant ameliore dans `@aureak/ui`.
Integration fiche joueur.

## Acceptance Criteria

- [x] AC1 : Table `badge_definitions` creee (migration 00106)
- [x] AC2 : Table `player_badges` creee (migration 00106)
- [x] AC3 : 20 badges seedes (migration 00130)
- [x] AC4 : Types BadgeDefinition, PlayerBadge dans `@aureak/types`
- [x] AC5 : API client listBadgeDefinitions, listPlayerBadges
- [x] AC6 : BadgeGrid composant ameliore avec tier/unlock visuel

## Tasks

- [x] T1 : Migration 00106 badge_definitions + player_badges
- [x] T2 : Migration 00130 seed 20 badges
- [x] T3 : Types BadgeDefinition, PlayerBadge dans entities.ts
- [x] T4 : API client gamification/badges.ts
- [x] T5 : BadgeGrid composant dans @aureak/ui

## Notes

Tout deja implemente. Les migrations 00106 et 00130 existent, les types, l'API client et le composant BadgeGrid aussi.
