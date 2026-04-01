# Backlog d'implémentation — Aureak

> Ordre d'exécution recommandé basé sur les dépendances inter-épics.
> Dernière mise à jour : 2026-04-01 (post-audit + décisions produit)

---

## Légende
- `[x]` = done
- `[ ]` = ready-for-dev
- `[~]` = review
- `[d]` = deferred (mobile différé ou hors scope phase 1)
- `[2]` = phase-2 (après fonctionnalités opérationnelles)

---

## Notes transversales (issues systémiques)

> **Toujours lire avant d'implémenter une story.**

1. **Migrations** : toujours utiliser **00090+** (migrations 00001–00089 occupées)
2. **Chemin UI `sessions` → `seances`** : les stories Epic 4 écrivent `(admin)/sessions/`. L'app réelle utilise `(admin)/seances/`.
3. **Chemin UI `referentiel` → `methodologie`** : les stories Epic 3 écrivent `(admin)/referentiel/`. L'app réelle utilise `(admin)/methodologie/`.
4. **Package `@aureak/business-logic`** : EXISTS à `aureak/packages/business-logic/src/`. Règle architecture : `api-client` = accès Supabase/fetch/mapping ; `business-logic` = règles métier, use cases, orchestration, validations partagées.
5. **App mobile** : `apps/mobile/` différée à phase ultérieure. Stories mobile-only = `[d]`.

---

## Stories complétées (référence)

- [x] Epic 1 : Fondation monorepo (1-1, 1-2, 1-3)
- [x] Epic 2 : Auth & permissions (2-1, 2-2, 2-3, 2-5) — 2-4 deferred
- [x] Epic 3 : Référentiel pédagogique (3-1, 3-2, 3-3, 3-4, 3-5, 3-6)
- [x] Epic 4 : Séances terrain (4-1, 4-2, 4-3, 4-5, 4-6, 4-7)
- [x] Epic 6 partial : Évaluations (6-1, 6-4)
- [x] Epic 7 partial : Notifications (7-2)
- [x] Epic 9 partial : Dashboard admin (9-1, 9-3, 9-4)
- [x] Epic 10 partial : RGPD (10-3, 10-5)
- [x] Epic 11 partial : Grades coaches (11-1, 11-3)
- [x] Epic 13 : Séances v2 (13-1, 13-3)
- [x] Epic 18 : Joueurs admin (18-1, 18-2, 18-4, 18-5, 18-6, 18-7)
- [x] Epic 19 : Séances admin UI (19-4, 19-5)
- [x] Epic 20 : Méthodologie UX (20-1 → 20-5)
- [x] Epic 21 : Training builder (21-1, 21-2, 21-3)
- [x] Epic 22 : Création joueur qualité (22-1a, 22-1b, 22-2a, 22-2b, 22-3)
- [x] Epic 23 : Clubs visuels (23-1 → 23-5)
- [x] Epic 24 : Sections thème (24-1 → 24-7)
- [x] Epic 25 : Carte joueur premium (25-0 → 25-8)
- [x] Epic 26 : Carte club premium (26-1, 26-2)
- [x] Epic 27 : Theme card design (27-1, 27-2)
- [x] Epic 28 partial : Logos clubs (28-2, 28-3)
- [x] Epic 29 : Matricules RBFA (29-1)
- [x] Epic 30 : Script détection gardiens (30-1)
- [x] Epic 31 : Filtre saison académie (31-1)

---

## En attente de review

- [~] 1-4 : pipeline-ci-cd-tests-standards-de-code
- [~] 13-2 : sessions-calendrier-auto-generation-gestion-exceptions
- [~] 24-6 : mini-exercices-terrain

---

## Deferred (mobile phase 2 ou hors scope)

- [d] 2-4 : auth-rapide-geolocalisee-pin-gps (hors scope phase 1)
- [d] 5-3 : enregistrement-presence-offline-2s (mobile)
- [d] 6-2 : ux-evaluation-rapide-10s-par-enfant (mobile)
- [d] 8-3 : ux-enfant-acquired-not-acquired-avatar-badges (mobile)
- [d] 12-3 : avatar-system-equipement-items-debloquables (mobile)
- [d] 12-5 : carte-de-progression-theme-collection-de-skill-cards (mobile)

---

## Phase 2 (après fonctionnalités opérationnelles)

- [2] 12-1 : modele-de-donnees-badges-points-ledger-cosmetiques-avatar
- [2] 12-2 : event-bus-gamification-traitement-des-4-evenements-declencheurs
- [2] 12-4 : quetes-hebdomadaires-attribution-progression-recompenses

---

## Backlog ordonné — ready-for-dev

### Priorité 1 — Auth complète ⚠️ GAP CRITIQUE
*Dépendance : Epic 2 code done ✓ — mais Custom Access Token Hook manquant*

> **État réel** : Code des stories 2-1/2-2/2-3 est présent. Gap = `custom-access-token-hook` Edge Function manquante → JWT sans `role`/`tenant_id` → RLS ne fonctionne pas en production.

- [ ] **AUTH-GAP-1** : Créer `supabase/functions/custom-access-token-hook/index.ts` (voir plan détaillé)
- [ ] **AUTH-GAP-2** : Créer `supabase/migrations/00090_rls_policies_complete.sql` (fichier manquant du repo)
- [ ] **AUTH-GAP-3** : Vérifier `supabase/RLS_PATTERNS.md` et policies DB complètes

---

### Priorité 2 — Offline & Sync (Epic 5)
*Dépendance : Epic 4 done ✓ — tables `sync_queue` et `event_log` existent en DB*

- [ ] **5-1** : schema-offline-sqlite-sync-queue-serveur ⚠️ auditer `apps/mobile/` (SyncQueueService.ts existe dans business-logic)
- [ ] **5-2** : event-sourcing-event-log-snapshot-attendance-apply-event ⚠️ RPC `apply_event` à vérifier/créer
- [ ] **5-4** : sync-queue-idempotente-resolution-de-conflits (SyncQueueService.ts existe, vérifier complétion)
- [ ] **5-5** : timeline-admin-restauration-via-event-log (2 fichiers à créer : `api-client/sessions/timeline.ts` + `seances/[id]/timeline.tsx`)
- [ ] **5-6** : ux-offline-indicateur-sync-alertes-rappel-j1 (Edge Function `review-reminder` déjà là)

---

### Priorité 3 — Dashboard anomalies & Contact
*Dépendance : Epic 4 + Epic 6 done ✓ — tables existent en DB*

- [ ] **9-2** : detection-anomalies ⚠️ table exists, API à créer dans `admin/anomalies.ts`
- [ ] **9-5** : contact-direct-coach ⚠️ table exists, API à créer dans `admin/messages.ts`

---

### Priorité 4 — Notifications infrastructure (Epic 7)
*Dépendance : Epic 6 done ✓*

- [ ] **7-1** : infrastructure-notifications-push-tokens-preferences-urgence ⚠️ vérifier CRUD push_tokens dans `parent/notifications.ts`
- [ ] **7-3** : board-parent-fiche-enfant-transparence-terrain-admin
- [ ] **7-4** : systeme-de-tickets-parent-minimal-trace ⚠️ CRITIQUE — `support_tickets` ABSENT DB → créer `00090_support_tickets.sql`

---

### Priorité 5 — Quiz & apprentissage (Epic 8)
*Dépendance : Epic 3 + Epic 6 done ✓ — tables learning_attempts/mastery_thresholds existent en DB*

- [ ] **8-1** : modele-de-donnees-apprentissage-maitrise-gamification (tables DB ok, vérifier complétion)
- [ ] **8-2** : moteur-de-quiz-adaptatif-stop-conditions-maitrise ⚠️ RPCs `next_question`, `finalize_attempt` à créer
- [ ] **8-4** : streaks-revision-espacee-declenchement-gamification (partie shared arch seulement)
- [ ] **8-5** : rapports-coach-vue-agregee-groupe-acces-parent

---

### Priorité 6 — RGPD / conformité (Epic 10)
*Dépendance : Auth done*

- [ ] **10-1** : cycle-de-vie-utilisateur (table `user_lifecycle_events` DB ok)
- [ ] **10-2** : consentements-parentaux-revocation-en-cascade ⚠️ `user_consents` ABSENT DB → créer migration
- [ ] **10-4** : audit-trail-admin-policies-completes-indexes-retention

---

### Priorité 7 — Grades & partenariats reste (Epic 11)

- [ ] **11-2** : permissions-de-contenu-par-grade ⚠️ `grade_content_permissions` ABSENT DB → créer migration + API

---

### Bloc 12 — RBFA enrichissement

- [ ] **28-1** : rbfa-enrichissement-clubs

---

### Phase 2 — Récurrence & planification avancée

- [ ] **4-4** : planification-recurrente-gestion-des-exceptions (RPCs à créer)
- [ ] **6-3** : double-validation-coach-realtime-fallback-polling

---

## Migrations manquantes (tables absentes en DB)

| Table | Story | Migration à créer |
|-------|-------|------------------|
| `support_tickets` | 7-4 | `00090_support_tickets.sql` |
| `user_consents` | 10-2 | `00091_user_consents.sql` |
| `grade_content_permissions` | 11-2 | `00092_grade_content_permissions.sql` |
| `badges`, `badge_awards`, `points_ledger` | 12-1 (phase 2) | `00093_gamification_schema.sql` |

---

## Commande de lancement type

```
Implémente la Priorité 1 — Auth Gap.
Tasks dans l'ordre : AUTH-GAP-1 (custom-access-token-hook), AUTH-GAP-2 (migration 00090 RLS policies), AUTH-GAP-3 (vérification).
Pour chaque task : vérifie l'état actuel → implémente → QA scan → commit.
```
