# Story 59-1 — Gamification : Migration player_xp_progression + Edge Function award-xp

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P0 — fondation de l'epic (toutes les autres stories en dépendent)

---

## Contexte & objectif

L'Epic 12 a posé les fondations gamification (tables `badge_definitions`, `player_badges`, `player_points_ledger`, `quest_definitions`). La table `player_points_ledger` existante n'enregistre que les événements `BADGE_AWARDED` ; il n'existe pas de snapshot mensuel XP ni de système d'accumulation XP multi-sources.

Cette story crée :
1. La table `player_xp_progression` — snapshot mensuel XP par joueur (append-only, tendance)
2. La table `xp_ledger` — ledger principal étendu avec 5 event types XP
3. L'Edge Function `award-xp` — point d'entrée HTTP unique pour créditer des XP

---

## Dépendances

- Story 12-1 `done` — tables `badge_definitions`, `player_badges`, `player_points_ledger` existantes (migration 00106)
- Story 12-2 `done` — `award_badge_if_applicable` SQL function (migration 00107)
- Migration 00117 réservée — ne pas utiliser
- Migration disponible : **00118**

---

## Acceptance Criteria

1. **AC1 — Table xp_ledger étendue** : La migration 00118 crée une table `xp_ledger` avec colonnes `(id, tenant_id, child_id, event_type, ref_id, xp_delta, created_at)`. Le check constraint sur `event_type` accepte exactement : `'ATTENDANCE'`, `'NOTE_HIGH'`, `'BADGE_EARNED'`, `'STAGE_PARTICIPATION'`, `'SESSION_STREAK_5'`. RLS activé, politiques `tenant_read` + `child_own_read` + `staff_read` + `no_update` + `no_delete` (ledger immuable).

2. **AC2 — Table player_xp_progression** : La migration crée `player_xp_progression (id, tenant_id, child_id, season_id, snapshot_month DATE, xp_total INTEGER, xp_delta_month INTEGER, level_tier TEXT, computed_at TIMESTAMPTZ)`. Index sur `(child_id, snapshot_month DESC)`. Soft-delete non applicable (snapshot analytics).

3. **AC3 — Edge Function award-xp** : Le fichier `supabase/functions/award-xp/index.ts` expose un endpoint HTTP POST. Corps attendu : `{ child_id, event_type, ref_id?, xp_override?, operation_id? }`. La fonction valide le JWT Supabase, vérifie que le caller est `admin` ou `coach`, calcule l'XP selon le barème, insère dans `xp_ledger` avec idempotence via `operation_id`.

4. **AC4 — Barème XP documenté et appliqué** :
   - `ATTENDANCE` = 10 XP
   - `NOTE_HIGH` (note ≥ 7/10) = 20 XP
   - `BADGE_EARNED` = 50 XP
   - `STAGE_PARTICIPATION` = 30 XP
   - `SESSION_STREAK_5` (5 séances consécutives) = 75 XP
   Le barème est défini en constante dans la Edge Function (facile à modifier).

5. **AC5 — Types TypeScript** : `aureak/packages/types/src/entities.ts` reçoit les types `XpEvent`, `XpLedgerEntry`, `PlayerXpSnapshot`, `XpEventType` (union des 5 types). `aureak/packages/api-client/src/gamification/` reçoit `xp.ts` avec `awardXp()`, `getXpLedger(childId)`, `getXpProgression(childId)`.

6. **AC6 — Idempotence** : Si le même `operation_id` est soumis deux fois à l'Edge Function, la seconde requête retourne `{ idempotent: true, xp_delta: 0 }` sans insérer de doublon. La table `processed_operations` existante est réutilisée.

7. **AC7 — Console guards & try/finally** : L'Edge Function utilise `try/finally` sur toute logique d'insertion. Le fichier API client `xp.ts` porte des console guards `if (process.env.NODE_ENV !== 'production')`.

---

## Tasks

- [x] **T1** — Écrire migration `supabase/migrations/00129_xp_ledger_and_progression.sql` : tables `xp_ledger` + `player_xp_progression`, RLS, index
- [x] **T2** — Créer `supabase/functions/award-xp/index.ts` : JWT validation, barème XP, insertion idempotente `xp_ledger`
- [x] **T3** — Ajouter types `XpEventType`, `XpLedgerEntry`, `PlayerXpSnapshot` dans `@aureak/types/src/entities.ts`
- [x] **T4** — Créer `aureak/packages/api-client/src/gamification/xp.ts` : `awardXp()`, `getXpLedger()`, `getXpProgression()`
- [x] **T5** — Exporter les nouvelles fonctions depuis `aureak/packages/api-client/src/index.ts`
- [x] **T6** — QA scan : try/finally + console guards sur tous les fichiers créés
- [x] **T7** — Cocher tasks, mettre Status: done

---

## Notes techniques

- La table `player_points_ledger` (migration 00106) reste intacte — elle ne gère que `BADGE_AWARDED`. La nouvelle `xp_ledger` coexiste et gère le système XP étendu.
- `player_xp_progression` est un snapshot mensuel calculé en batch (par `award-xp` ou un cron futur) — pas de trigger automatique en migration pour éviter la complexité.
- L'Edge Function doit appeler `supabase.auth.getUser()` pour valider le JWT avant toute opération.
- Format fichier Edge Function : Deno + `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00118_xp_ledger_and_progression.sql` | Créer |
| `supabase/functions/award-xp/index.ts` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — ajout types XP |
| `aureak/packages/api-client/src/gamification/xp.ts` | Créer |
| `aureak/packages/api-client/src/gamification/index.ts` (ou `src/index.ts`) | Modifier — export xp |
