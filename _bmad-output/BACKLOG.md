# Backlog d'implémentation — Aureak

> Ordre d'exécution recommandé basé sur les dépendances inter-épics.
> Dernière mise à jour : 2026-04-01 (décisions produit finales)

---

## Légende
- `[x]` = done
- `[ ]` = ready-for-dev
- `[~]` = review
- `[d]` = deferred (mobile phase 2 ou hors scope)
- `[2]` = phase-2 (après fonctionnalités opérationnelles)

---

## Notes transversales (règles absolues avant de coder)

1. **Migrations** : toujours utiliser **00090+** (00001–00089 occupées). Ignorer les numéros dans les story files — ils sont obsolètes.
2. **Chemin UI `sessions` → `seances`** : les stories écrivent `(admin)/sessions/`. L'app réelle utilise `(admin)/seances/`.
3. **Chemin UI `referentiel` → `methodologie`** : les stories écrivent `(admin)/referentiel/`. L'app réelle utilise `(admin)/methodologie/`.
4. **Architecture packages** :
   - `@aureak/api-client` = accès Supabase / requêtes / mapping DB→TS uniquement
   - `@aureak/business-logic` = règles métier, validations, use cases, orchestration (EXISTS à `aureak/packages/business-logic/src/`)
5. **App mobile** : `apps/mobile/` différée. Stories mobile-only = `[d]`.
6. **DB remote vs repo** : le remote Supabase a ~30 tables sans migration dans le repo. Chantier séparé "DB baseline recovery" à traiter en parallèle (ne bloque pas le dev).

---

## Stories complétées (référence)

- [x] Epic 1 : Fondation monorepo (1-1, 1-2, 1-3)
- [x] Epic 2 partial : Accès clubs + RLS policies (2-5)
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

## Deferred — mobile phase 2 ou hors scope

- [d] 2-4 : auth-rapide-geolocalisee-pin-gps
- [d] 5-3 : enregistrement-presence-offline-2s
- [d] 6-2 : ux-evaluation-rapide-10s-par-enfant
- [d] 8-3 : ux-enfant-acquired-not-acquired-avatar-badges
- [d] 12-3 : avatar-system-equipement-items-debloquables
- [d] 12-5 : carte-de-progression-theme-collection-de-skill-cards

---

## Phase 2 — après fonctionnalités opérationnelles

- [2] 12-1 : modele-de-donnees-badges-points-ledger-cosmetiques-avatar
- [2] 12-2 : event-bus-gamification-traitement-des-4-evenements-declencheurs
- [2] 12-4 : quetes-hebdomadaires-attribution-progression-recompenses
- [2] 4-4 : planification-recurrente-gestion-des-exceptions
- [2] 6-3 : double-validation-coach-realtime-fallback-polling

---

## Backlog ordonné — ready-for-dev

---

### PRIORITÉ 1 — Auth + Sécurité (Epic 2) 🔴 BLOQUANT TOUT
*Code existant partiel — 3 gaps critiques à combler*

> **Pourquoi bloquant** : sans `custom-access-token-hook`, le JWT ne contient pas `role`/`tenant_id` → `current_tenant_id()` et `current_user_role()` retournent NULL → toutes les policies RLS échouent silencieusement en production.

| # | Story | État code | Gap à combler | Migration |
|---|-------|-----------|---------------|-----------|
| 2-1 | Auth email/MDP | Code présent ✓ | `custom-access-token-hook` Edge Function ABSENTE | Aucune (00003 ok) |
| 2-2 | RLS/RBAC universel | Code présent ✓ | `00010_rls_policies.sql` ABSENT du repo | Créer `00090_rls_policies_complete.sql` |
| 2-3 | Accès cross-implantation | Code présent ✓ | Vérifier section coach_access_grants dans `00090` | Inclus dans 00090 |

- [ ] **2-1** : inscription-auth-standard-email-mot-de-passe
- [ ] **2-2** : controle-acces-par-role-rbac-regle-universelle-rls
- [ ] **2-3** : acces-temporaire-cross-implantation-coach

---

### PRIORITÉ 2 — Permissions de contenu par grade (Epic 11)
*Dépendance : Auth done*

- [ ] **11-2** : permissions-de-contenu-par-grade ⚠️ `grade_content_permissions` ABSENT DB → `00091_grade_content_permissions.sql`

---

### PRIORITÉ 3 — Support tickets parent (Epic 7)
*Dépendance : Auth done*

- [ ] **7-4** : systeme-de-tickets-parent-minimal-trace ⚠️ `support_tickets` ABSENT DB → `00092_support_tickets.sql`

---

### PRIORITÉ 4 — Consentements parentaux (Epic 10)
*Dépendance : Auth done*

- [ ] **10-2** : consentements-parentaux-revocation-en-cascade ⚠️ `user_consents` ABSENT DB → `00093_user_consents.sql`

---

### PRIORITÉ 5 — Dashboard anomalies & messages admin (Epic 9)
*Dépendance : Auth + Epic 4/6 done*

- [ ] **9-2** : detection-anomalies ⚠️ table `anomaly_events` ok en DB, API `admin/anomalies.ts` à créer
- [ ] **9-5** : contact-direct-coach ⚠️ table `admin_messages` ok en DB, API `admin/messages.ts` à créer

---

### PRIORITÉ 6 — Offline & Sync (Epic 5) — selon besoin réel
*Dépendance : Epic 4 done ✓ — tables `sync_queue` et `event_log` existent en DB*

- [ ] **5-1** : schema-offline-sqlite-sync-queue-serveur (SyncQueueService.ts existe, vérifier complétion)
- [ ] **5-2** : event-sourcing-event-log-snapshot-attendance-apply-event ⚠️ RPCs `apply_event` à vérifier
- [ ] **5-4** : sync-queue-idempotente-resolution-de-conflits
- [ ] **5-5** : timeline-admin-restauration-via-event-log (2 fichiers à créer)
- [ ] **5-6** : ux-offline-indicateur-sync-alertes-rappel-j1

---

### Suite — Notifications & apprentissage (Epics 7, 8, 10)

- [ ] **7-1** : infrastructure-notifications-push-tokens-preferences-urgence
- [ ] **7-3** : board-parent-fiche-enfant-transparence-terrain-admin
- [ ] **8-1** : modele-de-donnees-apprentissage-maitrise-gamification
- [ ] **8-2** : moteur-de-quiz-adaptatif-stop-conditions-maitrise
- [ ] **8-4** : streaks-revision-espacee (partie shared arch seulement)
- [ ] **8-5** : rapports-coach-vue-agregee-groupe-acces-parent
- [ ] **10-1** : cycle-de-vie-utilisateur
- [ ] **10-4** : audit-trail-admin-policies-completes-indexes-retention
- [ ] **28-1** : rbfa-enrichissement-clubs

---

## Chantier parallèle — DB Baseline Recovery

> Ne bloque pas le développement immédiat. À traiter en parallèle.

**Problème** : ~30 tables existent en remote Supabase sans migration dans le repo. Si la DB est recréée from scratch, elle sera incomplète.

**Objectif** : rendre la base recréable à 100% depuis `supabase/migrations/`.

**Étapes** :
1. Dumper le schéma remote : `supabase db dump --linked --schema public > /tmp/remote_schema.sql`
2. Identifier les tables/fonctions sans migration correspondante
3. Reconstituer les migrations manquantes (numérotées 00090+, intercalées logiquement)
4. Valider avec `supabase db reset` + `supabase db diff` = clean

---

## Migrations à créer (ordre priorité)

| Migration | Contenu | Pour story |
|-----------|---------|------------|
| `00090_rls_policies_complete.sql` | functions helpers durcies + toutes policies + coach_access_grants | 2-2, 2-3 |
| `00091_grade_content_permissions.sql` | table + RLS | 11-2 |
| `00092_support_tickets.sql` | table + RLS | 7-4 |
| `00093_user_consents.sql` | table + RLS | 10-2 |
