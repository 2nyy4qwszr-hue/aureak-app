# Story 59-5 — Gamification : Quêtes hebdomadaires coaches

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P2 — engagement staff

---

## Contexte & objectif

Le système de quêtes (migration 00107) ne couvre que les joueurs (`player_quests`). Cette story étend la gamification aux **coaches** : des quêtes hebdomadaires leur sont proposées (valider 3 séances, évaluer 10 joueurs, etc.), avec récompenses badge coach et XP admin. La progression est visible dans la fiche coach admin.

---

## Dépendances

- Story 12-4 `done` (phase 2) ou en parallèle — tables `quest_definitions` et `player_quests` existantes (migration 00107)
- Story 59-1 `done` — `xp_ledger` disponible pour créditer l'XP coach

---

## Acceptance Criteria

1. **AC1 — Migration 00120 — Coach quests** : La migration crée une table `coach_quests (id, tenant_id, coach_id REFERENCES profiles(user_id), quest_definition_id REFERENCES quest_definitions(id), status CHECK('active','completed','expired'), current_value INTEGER DEFAULT 0, target_value INTEGER, period_start DATE, period_end DATE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(coach_id, quest_definition_id, period_start))`. RLS : `staff_own_read` (coach voit ses quêtes), `admin_read_all`, `insert_rpc`, `update_rpc`. Index sur `(coach_id, status, period_end)`.

2. **AC2 — Quêtes coaches définies** : La migration insère dans `quest_definitions` (avec `ON CONFLICT DO NOTHING`) 5 quêtes coach avec `quest_type = 'coach_action'` (nouveau type à ajouter au check constraint) :
   - `VALIDER_3_SEANCES` — "Valider 3 séances cette semaine" — target 3
   - `EVALUER_10_JOUEURS` — "Évaluer 10 joueurs cette semaine" — target 10
   - `NOTER_PROGRESSION` — "Ajouter 5 notes de progression" — target 5
   - `PRESENCE_100PCT` — "Enregistrer 100% des présences sur une séance" — target 1
   - `SEANCE_COMPLETE` — "Compléter une séance avec thème + participants" — target 1
   Chaque quête a un badge coach reward et `xp_reward` (25–100 XP).

3. **AC3 — Fonction SQL assign_weekly_coach_quests** : La migration crée une function SQL `assign_weekly_coach_quests(p_coach_id UUID)` qui insère les 5 quêtes dans `coach_quests` pour la semaine courante (lundi→dimanche), avec `ON CONFLICT DO NOTHING`. Appelable par admin ou Edge Function cron.

4. **AC4 — Affichage dans fiche coach admin** : La page `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx` (ou équivalent dans la structure réelle) reçoit une section "Quêtes de la semaine". Elle charge les `coach_quests` actives du coach via API. Affichage en liste : nom quête, barre de progression (`current_value / target_value`), statut badge (✓ complété, ⏳ en cours, ✗ expiré).

5. **AC5 — Barre de progression** : La barre utilise `gamification.xp.fillColor` (or) pour la partie remplie, `gamification.xp.trackColor` pour le fond, `gamification.xp.barHeight` et `gamification.xp.barRadius`. Texte `current_value / target_value` en `typography.caption`.

6. **AC6 — API coach quests** : `aureak/packages/api-client/src/gamification/coach-quests.ts` exporte `getCoachWeeklyQuests(coachId)`, `assignCoachWeeklyQuests(coachId)`, `updateCoachQuestProgress(questId, delta)`. Types `CoachQuest`, `CoachQuestWithDefinition` dans `@aureak/types`.

7. **AC7 — Règles de code** : try/finally sur tout setLoading/setSaving, console guards, aucun accès Supabase direct dans la page — tout via `@aureak/api-client`.

---

## Tasks

- [x] **T1** — Écrire `supabase/migrations/00131_coach_quests.sql` : table, RLS, quêtes définitions, fonction SQL
- [x] **T2** — Créer `aureak/packages/api-client/src/gamification/coach-quests.ts`
- [x] **T3** — Ajouter types `CoachQuest`, `CoachQuestWithDefinition` dans `@aureak/types/src/entities.ts`
- [x] **T4** — Page fiche coach localisée dans `(admin)/coaches/[coachId]/page.tsx` — section quêtes intégrée
- [x] **T5** — QA scan : try/finally, console guards, tokens gamification
- [x] **T6** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Vérifier le chemin exact de la fiche coach dans `aureak/apps/web/app/` avant de modifier (peut être `(admin)/coaches/[coachId]/` ou autre).
- Le type `quest_type = 'coach_action'` nécessite un `ALTER TYPE` ou modification du `CHECK` constraint — à faire proprement en migration.
- La barre de progression peut réutiliser un composant `XpBar` si créé dans une autre story de l'epic.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00120_coach_quests.sql` | Créer |
| `aureak/packages/api-client/src/gamification/coach-quests.ts` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — CoachQuest types |
| Page fiche coach (chemin à vérifier) | Modifier — section quêtes |
