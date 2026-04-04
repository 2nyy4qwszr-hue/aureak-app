# Story 44.2 : BUG — Filtre "saison actuelle" retourne 0 joueurs

Status: ready-for-dev

## Story

En tant qu'admin,
je veux que le filtre "saison actuelle / 2025-2026" affiche les joueurs de cette saison,
afin de consulter la liste des académiciens de l'année en cours.

## Acceptance Criteria

1. Quand je sélectionne "Saison actuelle" dans les filtres joueurs, les joueurs ayant `current_season_label = '2025-2026'` apparaissent
2. Le filtre ne retourne plus 0 joueurs quand des joueurs ont bien la saison courante définie
3. Le filtre "Saison actuelle" se base sur `in_current_season = true` (vue SQL `v_child_academy_status`) plutôt que sur une recherche ILIKE dans `child_directory_history`

## Root Cause

Dans `child-directory.ts` ligne ~475, le filtre `academySaison` cherche :
```sql
WHERE saison = '2025-2026' AND club_nom ILIKE '%aureak%'
```
Le filtre `club_nom ILIKE '%aureak%'` exclut tous les joueurs dont l'entrée historique a un `club_nom` différent ("Goal & Player", "Académie Aureak", etc.).

## Technical Tasks

- [ ] Lire `aureak/packages/api-client/src/admin/child-directory.ts` lignes 430–500
- [ ] Remplacer le filtre `academySaison` par un filtre sur `in_current_season = true` depuis `v_child_academy_status`
- [ ] Dans `listJoueurs` : quand `academySaison` est fourni → filtrer les IDs via `v_child_academy_status WHERE in_current_season = true AND tenant_id = $tenantId` au lieu de `child_directory_history WHERE club_nom ILIKE`
- [ ] Vérifier que `v_child_academy_status` est bien accessible depuis l'API client (RLS)
- [ ] Lire `aureak/apps/web/app/(admin)/children/index.tsx` — vérifier que `acadStatus === 'current-season'` passe bien `academySaison` et non autre chose
- [ ] Tester : filtre "tous" → N joueurs, filtre "saison actuelle" → sous-ensemble de N
- [ ] Vérifier TypeScript `npx tsc --noEmit`

## Files

- `aureak/packages/api-client/src/admin/child-directory.ts` (modifier — fix filtre)

## Dependencies

- Vue SQL `v_child_academy_status` doit exister (migration 00068 ✅)
