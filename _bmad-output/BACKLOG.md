# Backlog d'implémentation — Aureak

> Ordre d'exécution recommandé basé sur les dépendances inter-épics.
> Mettre à jour `[ ]` → `[x]` quand une story passe à `done`.
> Dernière mise à jour : 2026-04-01 (post-audit story-audit.md)

---

## Légende
- `[x]` = done
- `[ ]` = ready-for-dev
- `[~]` = review (à investiguer avant de coder)

---

## Notes transversales (issues systémiques)

> **Toujours lire avant d'implémenter une story.**

1. **Numérotation migrations** : les stories supposent 00004–00032. Toute nouvelle migration doit utiliser **00090+** (migrations 00001–00089 occupées).
2. **Chemin UI `sessions` → `seances`** : les stories Epic 4 écrivent `(admin)/sessions/`. L'app réelle utilise `(admin)/seances/`.
3. **Chemin UI `referentiel` → `methodologie`** : les stories Epic 3 écrivent `(admin)/referentiel/`. L'app réelle utilise `(admin)/methodologie/`.
4. **Package `business-logic` absent** : les stories 3-6, 4-4, 5-4, 5-5 y référencent du code. Ce package n'existe pas — mettre la logique dans `packages/api-client/src/`.
5. **Types locaux à consolider** : plusieurs fichiers api-client définissent leurs propres types au lieu de `@aureak/types/entities.ts`. À corriger progressivement (ARCH-10).

---

## Stories complétées (référence)

- [x] Epic 1 : Fondation monorepo (1-1, 1-2, 1-3)
- [x] Epic 2 partial : Accès clubs (2-5)
- [x] Epic 3 : Référentiel pédagogique (3-1, 3-2, 3-3, 3-4, 3-5)
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
- [~] 2-1 : inscription-auth-standard-email-mot-de-passe
- [~] 2-2 : controle-acces-par-role-rbac-regle-universelle-rls
- [~] 2-3 : acces-temporaire-cross-implantation-coach
- [~] 13-2 : sessions-calendrier-auto-generation-gestion-exceptions
- [~] 24-6 : mini-exercices-terrain

---

## Backlog ordonné — ready-for-dev

### Bloc 1 — Auth & permissions (Epic 2 reste)
*Dépendance : Epic 1 done ✓*

- [ ] **2-4** : auth-rapide-geolocalisee-pin-gps ⚠️ vérifier `quick_auth_devices` en DB, Edge Function à créer
- [x] **2-5** : gestion-des-acces-clubs-partenaire-commun ✅ tout implémenté
- [ ] **2-6** : permissions-referentiel-pedagogique-rbac-contenu ⚠️ `00010_rls_policies.sql` introuvable — créer `00090_rls_policies_referentiel.sql`

---

### Bloc 2 — Référentiel pédagogique (Epic 3)
*Dépendance : Epic 1 done ✓*

- [x] **3-1** : hierarchie-theme-themegroup-theme-sequences ✅ tout implémenté (UI : `methodologie/themes/`)
- [x] **3-2** : criteres-faults-cues ✅ implémenté (schéma évolué migrations 00080-00082)
- [x] **3-3** : arborescence-situationnelle-situationgroup-situation ✅ implémenté (+ champ `bloc_id`)
- [x] **3-4** : systeme-de-taxonomies-generiques ✅ tout implémenté
- [x] **3-5** : questions-de-quiz-workflow-draft-published ✅ tout implémenté (UI : `methodologie/themes/[key]/sections/SectionQuiz`)
- [ ] **3-6** : ciblage-audience-filtrage-dynamique ⚠️ `filterByAudience` à créer dans `api-client` (pas `business-logic`)

---

### Bloc 3 — Séances terrain (Epic 4)
*Dépendance : Epic 3 done ✓*

- [x] **4-1** : modele-de-donnees-sessions-blocs-recurrence ✅ implémenté (schéma très évolué)
- [x] **4-2** : roster-attendu-presences-terrain ✅ implémenté (colonnes supplémentaires)
- [x] **4-3** : creation-gestion-admin-des-seances ✅ implémenté (UI : `seances/` non `sessions/`)
- [ ] **4-4** : planification-recurrente-gestion-des-exceptions ⚠️ `recurrenceEngine` à placer dans `api-client`
- [x] **4-5** : annulation-notifications-multicanal ✅ tout implémenté
- [x] **4-6** : confirmation-presence-coach-gestion-du-bloc ✅ tout implémenté
- [x] **4-7** : vue-coach-fiche-seance-notes-feedback-contenu ✅ tout implémenté

---

### Bloc 4 — Offline & sync (Epic 5)
*Dépendance : Epic 4 done ✓*

- [ ] **5-1** : schema-offline-sqlite-sync-queue-serveur ⚠️ vérifier `sync_queue` en DB (types existent), auditer `apps/mobile/`
- [ ] **5-2** : event-sourcing-event-log-snapshot-attendance-apply-event ⚠️ vérifier `event_log` + RPC `apply_event` en DB
- [ ] **5-3** : enregistrement-presence-offline-2s (mobile uniquement — auditer séparément)
- [ ] **5-4** : sync-queue-idempotente-resolution-de-conflits ⚠️ `conflictResolver` → `api-client` (pas `business-logic`)
- [ ] **5-5** : timeline-admin-restauration-via-event-log ⚠️ 2 fichiers à créer : `api-client/sessions/timeline.ts` + `seances/[sessionId]/timeline.tsx`
- [ ] **5-6** : ux-offline-indicateur-sync-alertes-rappel-j1 (Edge Function `review-reminder` déjà là)

---

### Bloc 5 — Évaluations (Epic 6)
*Dépendance : Epic 4 done ✓*

- [x] **6-1** : modele-evaluations-event-sourcing-regle-de-fusion ✅ implémenté
- [ ] **6-2** : ux-evaluation-rapide-10s-par-enfant (mobile uniquement)
- [ ] **6-3** : double-validation-coach-realtime-fallback-polling ⚠️ vérifier `validation_status` sur table `sessions`
- [x] **6-4** : cloture-de-seance-idempotente-tracee ✅ tout implémenté

---

### Bloc 6 — Notifications (Epic 7)
*Dépendance : Epic 6 done ✓*

- [ ] **7-1** : infrastructure-notifications-push-tokens-preferences-urgence ⚠️ vérifier CRUD push_tokens/preferences dans `parent/notifications.ts`
- [x] **7-2** : notification-post-seance-session-closed-send-once ✅ Edge Function existante
- [ ] **7-3** : board-parent-fiche-enfant-transparence-terrain-admin ⚠️ vérifier couverture de `parent/childProfile.ts`
- [ ] **7-4** : systeme-de-tickets-parent-minimal-trace ⚠️ CRITIQUE — vérifier table `support_tickets` en DB (API existe)

---

### Bloc 7 — Quiz & apprentissage (Epic 8)
*Dépendance : Epic 3 + Epic 6 done ✓*

- [ ] **8-1** : modele-de-donnees-apprentissage-maitrise-gamification ⚠️ vérifier tables `learning_attempts`, `mastery_thresholds` en DB (types existent)
- [ ] **8-2** : moteur-de-quiz-adaptatif-stop-conditions-maitrise ⚠️ vérifier RPCs `next_question`, `finalize_attempt` dans migrations
- [ ] **8-3** : ux-enfant-acquired-not-acquired-avatar-badges (mobile, web avatar déjà là)
- [ ] **8-4** : streaks-revision-espacee-declenchement-evenements-gamification ⚠️ décommenter `award_badge_if_applicable` quand Epic 12 déployé
- [ ] **8-5** : rapports-coach-vue-agregee-groupe-acces-parent ⚠️ vérifier fonctions agrégation dans `admin/supervision.ts`

---

### Bloc 8 — Dashboard admin (Epic 9)
*Dépendance : Epic 4 + Epic 6 done ✓*

- [x] **9-1** : dashboard-agrege-multi-implantations ✅ tout implémenté
- [ ] **9-2** : detection-anomalies ⚠️ CRITIQUE — table `anomaly_events` probablement absente + API à créer
- [x] **9-3** : comparaison-inter-implantations ✅ tout implémenté
- [x] **9-4** : crud-implantations-groupes-assignations-coaches ✅ implémenté (schéma très évolué)
- [ ] **9-5** : contact-direct-coach ⚠️ table `admin_messages` probablement absente + API à créer

---

### Bloc 9 — RGPD (Epic 10)
*Dépendance : Epic 2 done*

- [ ] **10-1** : cycle-de-vie-utilisateur ⚠️ vérifier migrations `user_lifecycle_events` + RPCs lifecycle
- [ ] **10-2** : consentements-parentaux-revocation-en-cascade ⚠️ vérifier migrations `user_consents` + RPC `revoke_consent_cascade`
- [x] **10-3** : droits-rgpd-parent-acces-rectification-effacement-portabilite ✅ tout implémenté
- [ ] **10-4** : audit-trail-admin-policies-completes-indexes-retention ⚠️ vérifier policies complètes + indexes de rétention
- [x] **10-5** : exports-conformes ✅ tout implémenté

---

### Bloc 10 — Grades coaches (Epic 11)
*Dépendance : Epic 2 done*

- [x] **11-1** : grades-coach-historique-immuable ✅ implémenté (type à consolider dans entities.ts)
- [ ] **11-2** : permissions-de-contenu-par-grade ⚠️ CRITIQUE — table `grade_content_permissions` probablement absente + API à créer
- [x] **11-3** : partenariats-clubs ✅ implémenté (type à consolider dans entities.ts)

---

### Bloc 11 — Badges & gamification (Epic 12)
*Dépendance : Epic 8 done*

- [ ] **12-1** : modele-de-donnees-badges-points-ledger-cosmetiques-avatar ⚠️ CRITIQUE — tables badges/points/avatar probablement absentes en DB
- [ ] **12-2** : event-bus-gamification-traitement-des-4-evenements-declencheurs ⚠️ bloqué par 12-1
- [ ] **12-3** : avatar-system-equipement-items-debloquables ⚠️ vérifier `equipAvatarItem` dans `gamification/avatar.ts`
- [ ] **12-4** : quetes-hebdomadaires-attribution-progression-recompenses ⚠️ vérifier tables `quest_definitions`, `player_quests` en DB
- [ ] **12-5** : carte-de-progression-theme-collection-de-skill-cards ⚠️ dépend de 12-1

---

### Bloc 12 — RBFA enrichissement (Epic 28 reste)

- [ ] **28-1** : rbfa-enrichissement-clubs

---

## Commande de lancement type

Pour implémenter un bloc entier, utiliser ce prompt :

```
Implémente le Bloc 4 — Offline & sync (Epic 5).
Stories dans l'ordre : 5-1, 5-2, 5-3, 5-4, 5-5, 5-6.
Pour chaque story : lis la story → vérifie les dépendances → VÉRIFIE L'ÉTAT RÉEL EN DB (migrations 00001-00089) → implémente avec migrations 00090+ → QA scan → test Playwright → commit → marque done → story suivante.
Arrête-toi après le bloc pour review.
```

> **Rappel** : toujours utiliser les numéros de migration 00090+ (jamais les numéros indiqués dans les stories qui sont obsolètes).
