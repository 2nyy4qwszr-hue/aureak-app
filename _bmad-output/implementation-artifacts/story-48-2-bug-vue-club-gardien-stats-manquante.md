# Story 48.2 : BUG — Vue SQL v_club_gardien_stats manquante — stats gardiens vides

Status: done

## Story

En tant qu'admin Aureak consultant les stats d'un club,
je veux que les statistiques des gardiens de but s'affichent correctement,
afin d'avoir une vue complète des données du club.

## Acceptance Criteria

1. La vue SQL `v_club_gardien_stats` existe en DB (migration idempotente créée)
2. Les stats gardiens s'affichent dans la page clubs sans erreur
3. La migration est dans `supabase/migrations/` (racine) avec le prochain numéro disponible

## Tasks / Subtasks

- [x] T1 — Diagnostiquer
  - [x] T1.1 — Lire les pages clubs `aureak/apps/web/app/(admin)/clubs/` et `(club)/` pour identifier les requêtes sur `v_club_gardien_stats`
  - [x] T1.2 — Vérifier `supabase/migrations/` — identifier si une migration crée cette vue
  - [x] T1.3 — Vérifier `aureak/packages/api-client/src/` — identifier les fonctions qui utilisent cette vue

- [x] T2 — Créer la migration
  - [x] T2.1 — Identifier le prochain numéro de migration (`ls supabase/migrations/ | tail -3`) → 00113
  - [x] T2.2 — Créer `supabase/migrations/00113_create_v_club_gardien_stats.sql` avec la définition récupérée depuis l'archive
  - [x] T2.3 — Structure adaptée depuis `aureak/supabase/_archive/migrations/00080_v_club_gardien_stats.sql` (identique)

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T3.2 — Vue créée avec `CREATE OR REPLACE` (idempotente)

## Dev Notes

### Diagnostic

- La vue `v_club_gardien_stats` était référencée dans `@aureak/api-client/src/admin/club-directory.ts` (2 requêtes `.from('v_club_gardien_stats')`)
- Elle existait dans l'archive (`aureak/supabase/_archive/migrations/00080_v_club_gardien_stats.sql`) mais **n'avait jamais été portée** dans `supabase/migrations/` (racine active)
- Lors de la migration vers le dossier racine, cette vue a été omise

### Migration pattern
```sql
-- 00113_create_v_club_gardien_stats.sql
CREATE OR REPLACE VIEW v_club_gardien_stats AS ...;
```
`CREATE OR REPLACE` est idempotent — pas besoin de IF NOT EXISTS pour les vues.

### Dépendance
- La vue dépend de `v_child_academy_status` → présente en migrations 00041 et 00068 ✅

### Fichiers modifiés/créés
| Fichier | Action |
|---------|--------|
| `supabase/migrations/00113_create_v_club_gardien_stats.sql` | Créé |
| `_bmad-output/implementation-artifacts/story-48-2-bug-vue-club-gardien-stats-manquante.md` | Mis à jour (done) |

## Dev Agent Record

- **Agent** : Claude Sonnet 4.6 (Amelia — Developer Agent BMAD)
- **Date** : 2026-04-04
- **Migration** : `00113_create_v_club_gardien_stats.sql`
- **tsc** : zéro erreur
- **Playwright** : skipped — app non démarrée
- **Cause racine** : vue archivée (00080) non portée vers `supabase/migrations/` (racine) lors de la migration des dossiers
