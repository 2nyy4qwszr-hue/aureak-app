# Story: Route players/ orpheline — audit et redirection

**ID:** tbd-route-players-orpheline
**Status:** done
**Source:** new
**Epic:** TBD — Routing

## Description
La route `players/` existait avec seulement `[playerId]/` subroute. Créer une page de redirection `players/index.tsx` → `/children`.

## Acceptance Criteria
- [x] `players/index.tsx` créé avec redirection vers `/children`
- [x] `players/[playerId]/` conservé (peut encore fonctionner si quelqu'un navigue directement)

## Tasks
- [x] Vérifier l'existence du dossier players/
- [x] Créer `players/index.tsx` avec redirection
- [x] Commit

## Commit
`fix(routing): redirection players/ → children/`
