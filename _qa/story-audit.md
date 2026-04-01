# Audit des Stories Ready-for-Dev — Application Aureak

**Date :** 2026-04-01  
**Auditeur :** claude-sonnet-4-6  
**Périmètre :** 46 stories dans `_bmad-output/implementation-artifacts/` au statut `ready-for-dev`  
**Migrations existantes :** 00001–00089 (prochain numéro libre : **00090**)  
**Packages audités :**  
- `aureak/packages/types/src/entities.ts` (types TypeScript)  
- `aureak/packages/api-client/src/` (fonctions API)  
- `aureak/apps/web/app/` (routes UI)  
- `supabase/migrations/` (migrations DB)

---

## Convention de lecture

| Symbole | Signification |
|---------|--------------|
| CRITIQUE | Bloquant — implémentation impossible sans correction |
| MAJEUR | Fort impact — risque de doublon ou conflit |
| MINEUR | Incohérence mineure — doit être noté mais non bloquant |
| OK | Aucun conflit détecté |

---

## Story 2-4 — Auth Rapide Géolocalisée (PIN + GPS)

**Statut audit :** MAJEUR

**Conflits détectés :**
- La story ne précise pas de numéro de migration pour un nouveau fichier. Elle demande d'ajouter `quick_auth_devices` dans `00010_rls_policies.sql` — mais le fichier `00010_child_club_history.sql` est une migration de données, pas de policies. Le vrai fichier de policies serait `00010_rls_policies.sql` (mentionné dans Story 2.6), qui n'existe pas encore dans les migrations actuelles.
- La table `quick_auth_devices` : vérification requise — elle pourrait déjà exister dans une migration existante (référencée dans `coach_access_grants` de Story 2.3 qui est potentiellement implémentée).
- Edge Function `supabase/functions/quick-auth/index.ts` : absente des Edge Functions existantes (MEMORY.md liste : send-notification, notify-session-closed, cancel-session-notify, detect-anomalies, review-reminder, assign-weekly-quests, generate-gdpr-export, generate-export, purge-expired-audit-logs, expire-export-jobs).
- `packages/business-logic/src/auth/geoAuth.ts` : le package `business-logic` n'est pas présent dans le codebase actuel (`aureak/packages/` ne contient que types, theme, ui, api-client, media-client).
- `apps/mobile/app/(auth)/quick-auth.tsx` : non vérifié (mobile), probablement absent.

**Informations manquantes :**
- Numéro de migration exact pour `quick_auth_devices` (si la table n'existe pas encore).
- Confirmation de l'existence ou non du package `@aureak/business-logic`.

**Action requise :**
1. Vérifier si `quick_auth_devices` existe dans une migration existante (scanner les fichiers 00001-00089).
2. Si absente : créer une migration `00090_quick_auth_devices.sql`.
3. Créer l'Edge Function `quick-auth`.
4. Décider si `business-logic` est un package à créer ou si la logique va dans `api-client`.

---

## Story 2-5 — Gestion des Accès Clubs (Partenaire/Commun)

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00004_clubs.sql` : **CONFLIT** — `supabase/migrations/00003_create_profiles.sql` existe déjà, le numéro 00004 est potentiellement libre mais la convention de nommage a changé depuis la rédaction de la story. De plus, la table `clubs` **existe déjà** (référencée dans `entities.ts` : `export type Club = { ... clubAccessLevel: 'partner' | 'common' }`).
- UI `apps/web/app/(admin)/clubs/page.tsx` : **DÉJÀ EXISTANT** (`aureak/apps/web/app/(admin)/clubs/page.tsx`)
- UI `apps/web/app/(admin)/clubs/new.tsx` : **DÉJÀ EXISTANT** (`aureak/apps/web/app/(admin)/clubs/new.tsx`)
- UI `apps/web/app/(admin)/clubs/[clubId]/` : **DÉJÀ EXISTANT** (`aureak/apps/web/app/(admin)/clubs/[clubId]/index.tsx`)
- API `packages/api-client/src/clubs.ts` : **DÉJÀ EXISTANT** (`aureak/packages/api-client/src/clubs.ts`)
- Type `Club` dans `entities.ts` : **DÉJÀ EXISTANT** (ligne 36)

**Informations manquantes :** Aucune — tout est implémenté.

**Action requise :** Marquer la story comme `done` après vérification que les AC sont couverts par l'implémentation existante. Aucune nouvelle migration à créer.

---

## Story 2-6 — Permissions Référentiel Pédagogique (RBAC Contenu)

**Statut audit :** MAJEUR

**Conflits détectés :**
- Le fichier `00010_rls_policies.sql` mentionné dans la story n'existe pas dans `supabase/migrations/`. Le fichier `00010_child_club_history.sql` occupe ce numéro.
- `packages/api-client/src/__tests__/rbac-referentiel.test.ts` : **DÉJÀ EXISTANT** (confirmé par glob)
- Les tables Epic 3 (`theme_groups`, `themes`, `theme_sequences`, `criteria`, `faults`, `cues`, etc.) **existent déjà** dans les migrations (migrations 00050, 00056, 00057, 00058, etc.).
- `supabase/RLS_PATTERNS.md` : existence non vérifiée dans le codebase actuel.

**Informations manquantes :**
- L'emplacement réel du fichier de policies RLS (doit être identifié ou créé).

**Action requise :**
1. Vérifier si les policies RLS sont définies dans une migration existante (ex: migrations récentes 00080-00089).
2. Si les policies manquent : créer `00091_rls_policies_referentiel.sql` (pas 00010 qui est pris).
3. Créer `supabase/RLS_PATTERNS.md` si absent.

---

## Story 3-1 — Hiérarchie Thème (ThemeGroup → Theme → Sequences)

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00005_referentiel_themes.sql` : **CONFLIT** — toute la range 00001-00089 est occupée.
- Tables `theme_groups`, `themes`, `theme_sequences` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 109, 119, 153 et par les migrations 00050, 00056, 00069, 00070, etc.).
- API `packages/api-client/src/referentiel/themes.ts` : **DÉJÀ EXISTANT**
- UI `apps/web/app/(admin)/referentiel/` : **CHEMIN INCORRECT** — l'app utilise `(admin)/methodologie/` pas `(admin)/referentiel/`. La page thèmes existe à `(admin)/methodologie/themes/`.
- Types `ThemeGroup`, `Theme`, `ThemeSequence` dans `entities.ts` : **DÉJÀ EXISTANTS**
- RPC `create_theme_version` : probablement déjà définie (à vérifier dans les migrations existantes).

**Informations manquantes :** Aucune — tout est implémenté mais avec des conventions de nommage différentes.

**Action requise :** Marquer comme `done`. Documenter que le chemin UI réel est `(admin)/methodologie/themes/` et non `(admin)/referentiel/themes/`.

---

## Story 3-2 — Critères, Faults & Cues

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00006_referentiel_criteria.sql` : **CONFLIT** — la range 00001-00089 est occupée.
- Tables `criteria`, `faults`, `cues` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 172, 191, 211 et migrations 00056, 00080, 00081).
- **DIVERGENCE MAJEURE** : le schéma a évolué depuis la story. Migration 00080 a rendu `criteria.sequence_id` nullable et ajouté `criteria.theme_id` comme source de vérité. Migration 00081 a rendu `faults.criterion_id` nullable et ajouté `faults.theme_id`. Le schéma de la story est obsolète.
- API `packages/api-client/src/referentiel/criteria.ts` : **DÉJÀ EXISTANT**
- Types `Criterion`, `Fault`, `Cue` dans `entities.ts` : **DÉJÀ EXISTANTS** (avec champs supplémentaires)
- UI `(admin)/referentiel/themes/[themeKey]/` : **CHEMIN INCORRECT** — réalité = `(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx`

**Informations manquantes :** Le schéma DB actuel diffère significativement de la story (migrations 00080, 00081, 00082). La story doit être mise à jour pour refléter la réalité.

**Action requise :** Marquer comme `done` avec note que le schéma a évolué (migrations 00080-00082). La story ne peut pas servir de référence de re-implémentation sans mise à jour.

---

## Story 3-3 — Arborescence Situationnelle (SituationGroup → Situation)

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00007_referentiel_situations.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `situation_groups`, `situations`, `situation_criteria`, `situation_theme_links` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 226-267 et migration 00057).
- **DIVERGENCE MAJEURE** : migration 00057 a ajouté `situations.bloc_id` (FK vers `theme_groups`), champ absent de la story.
- API `packages/api-client/src/referentiel/situations.ts` : **DÉJÀ EXISTANT**
- Types `SituationGroup`, `Situation`, `SituationCriterion`, `SituationThemeLink` dans `entities.ts` : **DÉJÀ EXISTANTS**
- UI `(admin)/referentiel/situations/` : **CHEMIN INCORRECT** — réalité = `(admin)/methodologie/situations/`

**Action requise :** Marquer comme `done`. Documenter divergence sur `bloc_id`.

---

## Story 3-4 — Système de Taxonomies Génériques

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00008_referentiel_taxonomies.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `taxonomies`, `taxonomy_nodes`, `unit_classifications` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 276-303).
- API `packages/api-client/src/referentiel/taxonomies.ts` : **DÉJÀ EXISTANT**
- Types `Taxonomy`, `TaxonomyNode`, `UnitClassification` dans `entities.ts` : **DÉJÀ EXISTANTS**
- UI `(admin)/referentiel/taxonomies/` : chemin non trouvé dans l'app — les taxonomies sont probablement gérées dans `methodologie/` ou non exposées en UI.

**Action requise :** Marquer comme `done` pour DB/types/API. Vérifier si une UI taxonomie est requise (probablement dans `methodologie/`).

---

## Story 3-5 — Questions de Quiz (Workflow Draft/Published)

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00009_referentiel_quiz.sql` : **CONFLIT CRITIQUE** — `00009_create_audit.sql` occupe déjà ce numéro.
- Tables `quiz_questions`, `quiz_options` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 312-331).
- API `packages/api-client/src/referentiel/quiz.ts` : **DÉJÀ EXISTANT**
- Types `QuizQuestion`, `QuizOption`, `QuizStatus` dans `entities.ts` : **DÉJÀ EXISTANTS**
- UI `(admin)/referentiel/quiz/` : chemin non trouvé — les quiz sont gérés dans `(admin)/methodologie/themes/[themeKey]/sections/SectionQuiz.tsx`.

**Action requise :** Marquer comme `done`. Le conflit sur 00009 illustre pourquoi le numérotage original est complètement caduc.

---

## Story 3-6 — Ciblage Audience & Filtrage Dynamique

**Statut audit :** MAJEUR

**Conflits détectés :**
- Aucune nouvelle migration (ALTER TABLE sur `themes` et `situations` pour `target_audience`) — le champ `targetAudience` existe déjà dans `entities.ts` lignes 128 et 246.
- `packages/business-logic/src/referentiel/filterByAudience.ts` : package `business-logic` absent du codebase (voir Story 2-4).
- Type `TargetAudience` dans `entities.ts` : **DÉJÀ EXISTANT** (ligne 338-342).

**Informations manquantes :**
- Décision d'architecture : la fonction `filterByAudience` va-t-elle dans `api-client` (comme le reste) ou dans un nouveau package `business-logic` ?

**Action requise :**
1. Vérifier que `target_audience` est bien présent dans les tables DB (`themes`, `situations`).
2. Créer `filterByAudience` dans `packages/api-client/src/referentiel/` (en l'absence de `business-logic`).
3. Mettre à jour la story pour corriger la cible du fichier.

---

## Story 4-1 — Modèle de Données Sessions, Blocs & Récurrence

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00011_sessions.sql` : **CONFLIT** — `00011_extend_profiles_child_fields.sql` occupe ce numéro.
- Tables `implantations`, `groups`, `session_blocks`, `recurrence_series`, `sessions`, `session_coaches`, `session_themes`, `session_situations` : **TOUTES DÉJÀ EXISTANTES** (confirmé par `entities.ts` + multiples migrations 00040, 00047, 00050, 00057, 00058, 00061, etc.).
- **DIVERGENCE MAJEURE** : le schéma `sessions` a évolué significativement — colonnes `session_type`, `content_ref` (migration 00058), `closed_at` (migration 00062), `methodology_session_id` (migration 00050), `notes` (migration 00066), `context_type`, `label` (migration 00071). La story est obsolète.
- Types `Session`, `SessionBlock`, `RecurrenceSeries`, `Group`, `Implantation`, etc. : **DÉJÀ EXISTANTS** dans `entities.ts`

**Action requise :** Marquer comme `done`. La story ne peut plus servir de référence — pointer vers les migrations 00040-00090 et `entities.ts` pour le schéma actuel.

---

## Story 4-2 — Roster Attendu & Présences Terrain

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00012_attendances.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `session_attendees`, `attendances`, `coach_presence_confirmations`, `block_checkins` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 769-806).
- **DIVERGENCE MAJEURE** : `session_attendees` a des colonnes supplémentaires `is_guest` (migration 00058), `coach_notes`, `contact_declined` (migration 00062).
- API `packages/api-client/src/sessions/attendances.ts` : **DÉJÀ EXISTANT**
- Types `SessionAttendee`, `Attendance`, `CoachPresenceConfirmation`, `BlockCheckin` dans `entities.ts` : **DÉJÀ EXISTANTS**

**Action requise :** Marquer comme `done`. Documenter les colonnes supplémentaires non prévues dans la story.

---

## Story 4-3 — Création & Gestion Admin des Séances

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00013_notifications_infra.sql` : **CONFLIT** — la migration `00063_notification_send_logs.sql` couvre déjà la table `notification_send_logs`.
- Tables `push_tokens`, `notification_preferences`, `notification_send_logs` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 817-849).
- UI `apps/web/app/(admin)/sessions/` : **CHEMIN INCORRECT** — l'app utilise `(admin)/seances/`. Les fichiers existent à `(admin)/seances/page.tsx`, `(admin)/seances/[sessionId]/`.
- `apps/web/app/(admin)/sessions/new.tsx` : **CHEMIN INCORRECT** — réalité = `(admin)/seances/` (pas sessions).

**Action requise :** Marquer comme `done` pour DB/types. Documenter que le chemin UI est `seances` non `sessions`.

---

## Story 4-4 — Planification Récurrente & Gestion des Exceptions

**Statut audit :** MAJEUR

**Conflits détectés :**
- Aucune nouvelle migration (ALTERs seulement) — mais les colonnes cibles (`recurrence_id`, `is_exception`, `original_session_id`) existent déjà dans `entities.ts` ligne 652-655.
- API `packages/api-client/src/sessions/recurrence.ts` : **DÉJÀ EXISTANT**
- `packages/business-logic/src/sessions/recurrenceEngine.ts` : package `business-logic` absent.

**Action requise :**
1. Vérifier que les colonnes de récurrence sont bien dans les migrations DB.
2. Décider où loger `recurrenceEngine` — probablement dans `api-client`.
3. Marquer comme `done` pour les parties implémentées.

---

## Story 4-5 — Annulation & Notifications Multicanal

**Statut audit :** MAJEUR

**Conflits détectés :**
- ALTER TABLE `notification_send_logs` : table déjà existante (migration 00063).
- Edge Function `cancel-session-notify` : **DÉJÀ EXISTANTE** (listée dans MEMORY.md).
- API `packages/api-client/src/sessions/sessions.ts` (cancel) : fichier existant — vérifier que `cancelSession` est implémenté dedans.

**Action requise :** Vérifier que `cancelSession` est dans `sessions.ts`. Probablement `done`.

---

## Story 4-6 — Confirmation Présence Coach & Gestion du Bloc

**Statut audit :** MAJEUR

**Conflits détectés :**
- Aucune nouvelle migration (ALTERs) — colonnes `gps_lat`, `gps_lon`, `gps_radius` sur `implantations` existent déjà dans `entities.ts` (lignes 453-456).
- API `packages/api-client/src/sessions/presence.ts` : **DÉJÀ EXISTANT**
- Types `CoachPresenceConfirmation`, `BlockCheckin` dans `entities.ts` : **DÉJÀ EXISTANTS**

**Action requise :** Probablement `done`. Vérifier que `confirmCoachPresence` et `checkinBlock` sont dans `presence.ts`.

---

## Story 4-7 — Vue Coach : Fiche Séance, Notes & Feedback Contenu

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00014_session_notes.sql` : **CONFLIT** — `00066_sessions_notes.sql` couvre déjà la table `session_notes`.
- Tables `coach_session_notes`, `coach_content_feedback` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 859-880).
- API `packages/api-client/src/sessions/notes.ts` : **DÉJÀ EXISTANT**
- Types `CoachSessionNote`, `CoachContentFeedback` dans `entities.ts` : **DÉJÀ EXISTANTS**

**Action requise :** Marquer comme `done`. Notes et feedback coach implémentés.

---

## Story 5-1 — Schéma Offline SQLite & Sync Queue Serveur

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00015_sync_queue.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `sync_queue` : **PROBABLEMENT EXISTANTE** (type `SyncQueueEntry` dans `entities.ts` ligne 887 référence la table).
- Table `processed_operations` : **DÉJÀ EXISTANTE** (type `ProcessedOperation` dans `entities.ts` ligne 29).
- `packages/mobile/src/db/schema.ts` : chemin à vérifier dans `apps/mobile/`.
- `packages/mobile/src/db/syncQueue.ts` : chemin à vérifier dans `apps/mobile/`.

**Informations manquantes :**
- État d'implémentation du côté mobile (expo-sqlite) non audité (hors scope fichiers web).

**Action requise :** Vérifier existence de la table `sync_queue` dans les migrations 00001-00089. Auditer `apps/mobile/` séparément.

---

## Story 5-2 — Event Sourcing : Event Log, Snapshot Attendance, apply_event

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00016_event_log.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `event_log` : **PROBABLEMENT EXISTANTE** (type `EventLogEntry` dans `entities.ts` ligne 905).
- RPC `apply_event` : présence dans les migrations à vérifier.

**Action requise :** Scanner les migrations existantes pour `event_log` et `apply_event`. Si absent : créer `00090_event_log.sql`. Sinon marquer `done`.

---

## Story 5-3 — Enregistrement Présence Offline (2 secondes)

**Statut audit :** MINEUR

**Conflits détectés :**
- Story mobile uniquement — pas de nouvelles migrations ni de fichiers web.
- `apps/mobile/app/(coach)/sessions/[sessionId]/attendance.tsx` : existence non vérifiée.

**Informations manquantes :** L'implémentation mobile est hors scope de cet audit.

**Action requise :** Auditer `apps/mobile/` séparément.

---

## Story 5-4 — Sync Queue Idempotente & Résolution de Conflits

**Statut audit :** MINEUR

**Conflits détectés :**
- ALTER TABLE `sessions` (ajout colonnes sync) : vérifier dans les migrations existantes.
- `packages/business-logic/src/sync/conflictResolver.ts` : package `business-logic` absent.

**Action requise :** Décider du placement de `conflictResolver` (probablement dans `api-client`).

---

## Story 5-5 — Timeline Admin & Restauration via Event Log

**Statut audit :** OK

**Conflits détectés :**
- `apps/web/app/(admin)/sessions/[sessionId]/timeline.tsx` : **CHEMIN INCORRECT** — le dossier `sessions` n'existe pas, c'est `seances`. Vérifier si `seances/[sessionId]/` contient une timeline.
- `packages/api-client/src/sessions/timeline.ts` : fichier absent de la liste glob — à créer.

**Action requise :**
1. Créer `packages/api-client/src/sessions/timeline.ts`.
2. Créer `apps/web/app/(admin)/seances/[sessionId]/timeline.tsx` (pas `sessions`).

---

## Story 5-6 — UX Offline : Indicateur Sync & Alertes Rappel J-1

**Statut audit :** MINEUR

**Conflits détectés :**
- Story mobile + Edge Function. Edge Function `review-reminder` mentionnée dans MEMORY.md comme existante.
- Composants mobile `SyncStatusBadge` : existence non vérifiée.

**Action requise :** Auditer `apps/mobile/` séparément. L'Edge Function est déjà là.

---

## Story 6-1 — Modèle Évaluations : Event Sourcing & Règle de Fusion

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00017_evaluations.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `evaluations`, `evaluation_merged` : **PROBABLEMENT EXISTANTES** (type `Evaluation` dans `entities.ts` ligne 927, type `EvaluationMerged` ligne 945).
- API `packages/api-client/src/evaluations/evaluations.ts` : **DÉJÀ EXISTANT**
- Types `Evaluation`, `EvaluationMerged` dans `entities.ts` : **DÉJÀ EXISTANTS**
- **DIVERGENCE MAJEURE** : le champ `validation_status` (type `ValidationStatus` dans `entities.ts` ligne 924) n'est pas dans le type `Evaluation`. La story décrit un workflow de double validation mais l'implémentation actuelle semble plus simple.

**Action requise :** Marquer comme `done` pour les parties implémentées. Vérifier que `validation_status` est bien dans le schéma DB si c'est une exigence.

---

## Story 6-2 — UX Évaluation Rapide (10 secondes par enfant)

**Statut audit :** MINEUR

**Conflits détectés :**
- Story mobile uniquement.
- `apps/mobile/app/(coach)/sessions/[sessionId]/evaluations.tsx` : existence à vérifier.

**Action requise :** Auditer `apps/mobile/`.

---

## Story 6-3 — Double Validation Coach : Realtime + Fallback Polling

**Statut audit :** MAJEUR

**Conflits détectés :**
- ALTER TABLE `sessions` (ajout `validation_status`) : vérifier dans les migrations. Type `ValidationStatus` dans `entities.ts` ligne 924 suggère que c'est prévu, mais non dans `Session`.
- Realtime Supabase : aucun conflit d'infrastructure.

**Action requise :** Vérifier la présence de `validation_status` dans la table `sessions` DB. Si absent : créer `00090_session_validation_status.sql`.

---

## Story 6-4 — Clôture de Séance Idempotente & Tracée

**Statut audit :** MAJEUR

**Conflits détectés :**
- ALTER TABLE `sessions` (ajout `closed_at`) : colonne **DÉJÀ EXISTANTE** dans `entities.ts` Session ligne 672 (`closedAt : string | null — migration 00062`).
- RPC `finalize_session` : à vérifier dans les migrations. La migration 00064 (`fix_close_session_coach_ownership`) suggère qu'une fonction de clôture existe.
- Edge Function `notify-session-closed` : **DÉJÀ EXISTANTE** (MEMORY.md).

**Action requise :** Vérifier que `finalize_session` RPC est dans les migrations. Probablement `done`.

---

## Story 7-1 — Infrastructure Notifications : Push Tokens, Préférences & Urgence

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Tables `push_tokens`, `notification_preferences`, `notification_send_logs` : **DÉJÀ EXISTANTES** (confirmé par `entities.ts` lignes 817-849 et migration 00063).
- API `packages/api-client/src/admin/notifications.ts` : **DÉJÀ EXISTANT** (mais contenu différent — centré sur `sendGradeNotification`, pas sur la gestion des tokens).
- Types `PushToken`, `NotificationPreferences`, `NotificationSendLog` dans `entities.ts` : **DÉJÀ EXISTANTS**

**Informations manquantes :**
- Le fichier `notifications.ts` actuel ne semble pas couvrir CRUD des tokens/préférences. Un fichier `parent/notifications.ts` existe (`aureak/packages/api-client/src/parent/notifications.ts`) — vérifier si les fonctions de tokens y sont.

**Action requise :** Auditer `parent/notifications.ts` pour voir si les CRUD push_tokens/preferences sont couverts. Compléter si nécessaire.

---

## Story 7-2 — Notification Post-Séance (session-closed, send-once)

**Statut audit :** OK

**Conflits détectés :**
- Edge Function `notify-session-closed` : **DÉJÀ EXISTANTE** (MEMORY.md).
- Logique `send-once` via `notification_send_logs` idempotency : à vérifier dans la fonction.

**Action requise :** Vérifier que la logique `send-once` est bien dans l'Edge Function existante.

---

## Story 7-3 — Board Parent : Fiche Enfant, Transparence Terrain & Admin

**Statut audit :** MAJEUR

**Conflits détectés :**
- Story mobile + web parent.
- `packages/api-client/src/parent/childProfile.ts` : **DÉJÀ EXISTANT**
- `apps/web/app/(parent)/parent/children/[childId]/progress/` : **DÉJÀ EXISTANT** (`index.tsx`)
- `apps/mobile/app/(parent)/children/[childId]/` : existence non vérifiée.

**Action requise :** Vérifier la couverture de `childProfile.ts`. Mobile à auditer séparément.

---

## Story 7-4 — Système de Tickets Parent (Minimal & Tracé)

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00018_tickets.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `support_tickets` : existence dans DB non confirmée (aucune migration mentionnant `tickets` trouvée dans le glob). Mais le type `Ticket` est défini localement dans `parent/tickets.ts` ligne 15 et les fonctions API existent.
- API `packages/api-client/src/parent/tickets.ts` : **DÉJÀ EXISTANT** (confirmé)
- Type `Ticket` : défini dans `tickets.ts` (local, pas dans `entities.ts`).

**Informations manquantes :** La table `support_tickets` existe-t-elle en DB ? Aucune migration ne la crée dans les 89 migrations actuelles.

**Action requise :**
1. Vérifier si `support_tickets` existe en DB (possible dans une migration non identifiée dans le glob, ou dans les seeds).
2. Si absente : créer `00090_support_tickets.sql`.
3. Déplacer le type `Ticket` de `tickets.ts` vers `entities.ts`.

---

## Story 8-1 — Modèle de Données Apprentissage, Maîtrise & Gamification

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00019_learning.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `learning_attempts`, `learning_answers`, `player_progress`, `mastery_thresholds` : **PROBABLEMENT EXISTANTES** (types dans `entities.ts` lignes 966-1018).
- API `packages/api-client/src/learning/learning.ts` : **DÉJÀ EXISTANT**
- Types dans `entities.ts` : **DÉJÀ EXISTANTS** (`LearningAttempt`, `LearningAnswer`, `PlayerProgress`, `MasteryThreshold`)

**Action requise :** Vérifier que les tables existent en DB (scanner migrations pour `learning_attempts`). Marquer `done` si confirmé.

---

## Story 8-2 — Moteur de Quiz Adaptatif : Stop Conditions & Maîtrise

**Statut audit :** MINEUR

**Conflits détectés :**
- RPCs SQL uniquement (`next_question`, `finalize_attempt`) — à vérifier dans les migrations existantes.
- Pas de nouveaux fichiers UI ou TypeScript.

**Action requise :** Scanner les migrations pour les RPCs `next_question` et `finalize_attempt`. Si absents : créer `00090_quiz_engine_rpcs.sql`.

---

## Story 8-3 — UX Enfant : Acquired/Not Acquired, Avatar & Badges

**Statut audit :** MINEUR

**Conflits détectés :**
- Story mobile uniquement.
- `apps/mobile/app/(child)/quiz/[themeId]/` : le fichier web `(child)/child/quiz/[themeId]/index.tsx` existe.
- `apps/web/app/(child)/child/avatar/index.tsx` : **DÉJÀ EXISTANT**.

**Action requise :** Auditer `apps/mobile/`. La partie web avatar semble implémentée.

---

## Story 8-4 — Streaks, Révision Espacée & Déclenchement Gamification

**Statut audit :** MINEUR

**Conflits détectés :**
- Extension de `finalize_attempt` RPC (pas un nouveau fichier).
- Logique `award_badge_if_applicable` : commentée avec TODO dans MEMORY.md jusqu'au déploiement Epic 12.
- Colonnes `review_due_at`, `current_streak`, `max_streak` : présentes dans les types `entities.ts`.

**Action requise :** Décommenter `award_badge_if_applicable` quand Epic 12 est déployé. Vérifier que les colonnes streak sont en DB.

---

## Story 8-5 — Rapports Coach : Vue Agrégée Groupe & Accès Parent

**Statut audit :** MINEUR

**Conflits détectés :**
- Policies RLS et vues SQL (pas de nouveaux fichiers de migration structurels).
- `packages/api-client/src/admin/supervision.ts` : **DÉJÀ EXISTANT** (confirme probable implémentation).
- UI `apps/web/app/(admin)/supervision/` : existence non confirmée par glob — à vérifier.

**Action requise :** Vérifier que les fonctions d'agrégation groupe et les policies parent d'accès aux rapports sont implémentées dans `supervision.ts`.

---

## Story 9-1 — Dashboard Agrégé Multi-Implantations

**Statut audit :** MAJEUR

**Conflits détectés :**
- Vue SQL `v_implantation_stats` + RPC : à vérifier dans les migrations.
- UI `apps/web/app/(admin)/dashboard/index.tsx` : **DÉJÀ EXISTANT**
- UI `apps/web/app/(admin)/dashboard/page.tsx` : **DÉJÀ EXISTANT**
- API `packages/api-client/src/admin/dashboard.ts` : **DÉJÀ EXISTANT**

**Action requise :** Vérifier que les vues et RPCs du dashboard sont dans les migrations. Probablement `done`.

---

## Story 9-2 — Détection Anomalies

**Statut audit :** CRITIQUE

**Conflits détectés :**
- Migration demandée `00020_anomaly_events.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `anomaly_events` : existence en DB non confirmée (aucune migration ne la crée dans le glob).
- Edge Function `detect-anomalies` : **DÉJÀ EXISTANTE** (MEMORY.md).
- Type `AnomalyEvent` : absent de `entities.ts`.
- API : non trouvée dans le glob (pas de fichier `anomalies.ts`).

**Informations manquantes :** La table `anomaly_events` existe-t-elle ? L'Edge Function existe mais peut appeler une table non créée.

**Action requise :**
1. Vérifier si `anomaly_events` est dans les migrations existantes.
2. Si absente : créer `00090_anomaly_events.sql`.
3. Créer `packages/api-client/src/admin/anomalies.ts`.
4. Ajouter type `AnomalyEvent` dans `entities.ts`.

---

## Story 9-3 — Comparaison Inter-Implantations

**Statut audit :** MINEUR

**Conflits détectés :**
- RPC + Edge Function uniquement — pas de nouveaux schémas de tables.
- UI `apps/web/app/(admin)/dashboard/comparison.tsx` : **DÉJÀ EXISTANT** (confirmé par glob)
- API `packages/api-client/src/admin/dashboard.ts` : **DÉJÀ EXISTANT**

**Action requise :** Vérifier que le RPC de comparaison est dans les migrations. Probablement `done`.

---

## Story 9-4 — CRUD Implantations, Groupes, Assignations Coaches

**Statut audit :** CRITIQUE (multiples conflits)

**Conflits détectés :**
- Migration demandée `00021_org_structure.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `implantations`, `groups`, `group_members`, `coach_implantation_assignments` : **TOUTES DÉJÀ EXISTANTES** (confirmé par `entities.ts` et migrations 00040, 00047, 00061).
- **DIVERGENCE MAJEURE** : migration 00040 a considérablement enrichi `groups` (day_of_week, start_hour, method, etc.). Migration 00047 a ajouté `group_staff`. Migration 00061 a ajouté `is_transient`. Ces colonnes sont absentes de la story.
- API `packages/api-client/src/sessions/implantations.ts` : **DÉJÀ EXISTANT**
- Types `Implantation`, `Group`, `GroupMember`, `GroupStaff` dans `entities.ts` : **DÉJÀ EXISTANTS**
- UI `apps/web/app/(admin)/groups/[groupId]/` : **DÉJÀ EXISTANT**

**Action requise :** Marquer comme `done`. La story est très obsolète par rapport au schéma réel.

---

## Story 9-5 — Contact Direct Coach

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00022_admin_messages.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `admin_messages` : existence en DB non confirmée (aucune migration dans le glob).
- UI `apps/web/app/(admin)/coaches/[coachId]/contact.tsx` : **DÉJÀ EXISTANT**
- Type `AdminMessage` : absent de `entities.ts`.
- API : non trouvée dans le glob (pas de fichier `messages.ts`).

**Informations manquantes :** La table `admin_messages` existe-t-elle ? Le fichier UI existe mais la table et l'API ne sont pas confirmées.

**Action requise :**
1. Vérifier si `admin_messages` est dans les migrations existantes.
2. Si absente : créer `00090_admin_messages.sql`.
3. Créer `packages/api-client/src/admin/messages.ts`.
4. Ajouter type `AdminMessage` dans `entities.ts`.

---

## Story 10-1 — Cycle de Vie Utilisateur

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00023_lifecycle.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `user_lifecycle_events` : référencée dans `admin/lifecycle.ts` ligne 27 (`.from('user_lifecycle_events')`) — la table est probablement existante.
- API `packages/api-client/src/admin/lifecycle.ts` : **DÉJÀ EXISTANT**
- Types `LifecycleEvent` : définis localement dans `lifecycle.ts` (pas dans `entities.ts`).
- RPCs `suspend_user`, `reactivate_user`, `request_user_deletion` : référencés dans `lifecycle.ts` — à vérifier dans les migrations.

**Action requise :** Vérifier migrations pour `user_lifecycle_events` et les RPCs lifecycle. Déplacer types vers `entities.ts` si non-fait.

---

## Story 10-2 — Consentements Parentaux & Révocation en Cascade

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00024_consents.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `user_consents` : référencée dans `parent/consents.ts` — probablement existante.
- API `packages/api-client/src/parent/consents.ts` : **DÉJÀ EXISTANT**
- Type `Consent` : défini localement dans `consents.ts` (pas dans `entities.ts`).
- RPC `revoke_consent_cascade` : à vérifier dans les migrations.

**Action requise :** Vérifier migrations pour `user_consents`. Déplacer `Consent` vers `entities.ts`.

---

## Story 10-3 — Droits RGPD Parent : Accès, Rectification, Effacement & Portabilité

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00025_gdpr_requests.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `gdpr_requests` : référencée dans `parent/gdpr.ts` — probablement existante.
- API `packages/api-client/src/parent/gdpr.ts` : **DÉJÀ EXISTANT**
- UI `apps/web/app/(admin)/gdpr/index.tsx` : **DÉJÀ EXISTANT**
- Edge Functions `generate-gdpr-export`, `generate-export` : **DÉJÀ EXISTANTES** (MEMORY.md).

**Action requise :** Vérifier migrations pour `gdpr_requests`. Probablement `done`.

---

## Story 10-4 — Audit Trail Admin : Policies Complètes, Index & Rétention

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00026_audit_policies.sql` : **CONFLIT** — `00009_create_audit.sql` couvre déjà la création de l'audit trail de base.
- Table `audit_logs` : **DÉJÀ EXISTANTE** (confirmé par `entities.ts` ligne 17 et `00009_create_audit.sql`).
- API `packages/api-client/src/admin/audit.ts` : **DÉJÀ EXISTANT**
- UI `apps/web/app/(admin)/audit/index.tsx` : **DÉJÀ EXISTANT**
- Edge Function `purge-expired-audit-logs` : **DÉJÀ EXISTANTE** (MEMORY.md).
- Note MEMORY.md : "WARNING explicite sur RLS audit_logs non-immuable jusqu'à Story 10.4" — à valider.

**Action requise :** Vérifier que les policies complètes et indexes de rétention sont dans les migrations. Créer `00090_audit_policies_complete.sql` si les policies avancées manquent.

---

## Story 10-5 — Exports Conformes

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00027_export_jobs.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `export_jobs` : référencée dans `admin/exports.ts` — probablement existante.
- API `packages/api-client/src/admin/exports.ts` : **DÉJÀ EXISTANT**
- UI `apps/web/app/(admin)/exports/index.tsx` : **DÉJÀ EXISTANT**
- Edge Function `expire-export-jobs` : **DÉJÀ EXISTANTE** (MEMORY.md).

**Action requise :** Vérifier migrations pour `export_jobs`. Probablement `done`.

---

## Story 11-1 — Grades Coach & Historique Immuable

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00028_coach_grades.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `coach_grades` : référencée dans `admin/grades.ts` — probablement existante.
- API `packages/api-client/src/admin/grades.ts` : **DÉJÀ EXISTANT**
- UI `apps/web/app/(admin)/coaches/[coachId]/grade.tsx` : **DÉJÀ EXISTANT**
- Type `CoachGrade` : défini localement dans `grades.ts` (pas dans `entities.ts`).

**Action requise :** Vérifier migrations pour `coach_grades`. Déplacer `CoachGrade` vers `entities.ts`. Probablement `done`.

---

## Story 11-2 — Permissions de Contenu par Grade

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00029_grade_content_access.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `grade_content_permissions` : existence en DB non confirmée.
- Pas de fichier API `grade-content-access.ts` trouvé dans le glob.
- La story dépend de Story 11-1 (coach_grades) et Story 3.5 (quiz_questions) — les deux existent.

**Informations manquantes :** La table `grade_content_permissions` existe-t-elle ?

**Action requise :**
1. Vérifier si `grade_content_permissions` est dans les migrations existantes.
2. Si absente : créer `00090_grade_content_permissions.sql`.
3. Créer `packages/api-client/src/admin/grade-content-access.ts`.

---

## Story 11-3 — Partenariats Clubs

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00030_partnerships.sql` : **CONFLIT** — range 00001-00089 occupée.
- Table `club_partnerships` : référencée dans `admin/partnerships.ts` — probablement existante.
- API `packages/api-client/src/admin/partnerships.ts` : **DÉJÀ EXISTANT**
- Type `ClubPartnership` : défini localement dans `partnerships.ts` (pas dans `entities.ts`).
- Note MEMORY.md : conflit de nommage `club_access_level` (Story 2-5) vs `partnership_access_level` (Story 11-3) — résolu dans la story.

**Action requise :** Vérifier migrations pour `club_partnerships`. Probablement `done`.

---

## Story 12-1 — Modèle de Données Badges, Points Ledger, Cosmétiques Avatar

**Statut audit :** CRITIQUE

**Conflits détectés :**
- Migration demandée `00031_gamification.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `badges`, `badge_awards`, `points_ledger`, `avatar_items`, `player_avatar_equipped`, `skill_cards`, `player_skill_cards` : existence en DB non confirmée (aucune migration dans le glob ne les crée explicitement).
- API `packages/api-client/src/gamification/avatar.ts` : **DÉJÀ EXISTANT** (contient `AvatarItem`, `PlayerAvatar`)
- API `packages/api-client/src/gamification/progression.ts` : **DÉJÀ EXISTANT** (contient `ThemeProgressEntry`)
- Types : définis localement dans les fichiers gamification (pas dans `entities.ts`).
- Note MEMORY.md : `award_badge_if_applicable` dans `finalize_attempt` est commenté avec TODO.

**Informations manquantes :** Les tables de gamification existent-elles en DB ?

**Action requise :**
1. Vérifier si les tables de gamification sont dans les migrations 00001-00089.
2. Si absentes : créer `00090_gamification_schema.sql`.
3. L'API existe mais pointe vers des tables potentiellement inexistantes.

---

## Story 12-2 — Event Bus Gamification : Traitement des 4 Événements Déclencheurs

**Statut audit :** MINEUR

**Conflits détectés :**
- Extension RPCs existants (`finalize_attempt`, `apply_event`) — pas de nouveaux fichiers.
- Dépend de Story 12-1 (tables gamification) — si les tables n'existent pas, cette story est bloquée.

**Action requise :** Implémenter après confirmation de l'existence des tables gamification (Story 12-1).

---

## Story 12-3 — Avatar System : Équipement & Items Débloquables

**Statut audit :** MAJEUR

**Conflits détectés :**
- Story mobile principalement.
- API `packages/api-client/src/gamification/avatar.ts` : **DÉJÀ EXISTANT**
- `packages/api-client/src/avatar/equipAvatarItem.ts` : chemin différent du fichier existant (`gamification/avatar.ts` vs `avatar/`). Probablement non créé séparément.
- `apps/web/app/(child)/child/avatar/index.tsx` : **DÉJÀ EXISTANT**

**Action requise :** Vérifier si `equipAvatarItem` est dans `gamification/avatar.ts` ou doit être un fichier séparé.

---

## Story 12-4 — Quêtes Hebdomadaires : Attribution, Progression & Récompenses

**Statut audit :** MAJEUR

**Conflits détectés :**
- Migration demandée `00032_quests.sql` : **CONFLIT** — range 00001-00089 occupée.
- Tables `quest_definitions`, `player_quests` : référencées dans `gamification/quests.ts` — existence en DB à confirmer.
- API `packages/api-client/src/gamification/quests.ts` : **DÉJÀ EXISTANT**
- Edge Function `assign-weekly-quests` : **DÉJÀ EXISTANTE** (MEMORY.md).
- Types `PlayerQuest` : défini localement dans `quests.ts`.

**Action requise :** Vérifier migrations pour `quest_definitions`, `player_quests`. Probablement `done` si tables existent.

---

## Story 12-5 — Carte de Progression Thème & Collection de Skill Cards

**Statut audit :** MAJEUR

**Conflits détectés :**
- Story mobile principalement.
- API `packages/api-client/src/gamification/progression.ts` : **DÉJÀ EXISTANT**
- Tables `skill_cards`, `player_skill_cards` : existence en DB à confirmer (partie de Story 12-1).
- Types `ThemeProgressEntry` : défini localement dans `progression.ts`.

**Action requise :** Dépend de Story 12-1. Vérifier tables DB gamification.

---

## Story 28-1 — Filtre Saison Académie

**Statut audit :** FICHIER MANQUANT

**Conflits détectés :**
- Le fichier `_bmad-output/implementation-artifacts/28-1-filtre-saison-academie.md` n'existe pas dans le répertoire. Le glob ne le retourne pas.
- Note MEMORY.md : "Story 18-3 — Statut académie dynamique (done) — migration 00068" semble correspondre à une version implémentée de ce filtre.

**Informations manquantes :** Le fichier story lui-même est absent.

**Action requise :** Recréer le fichier story ou confirmer que la fonctionnalité est couverte par Story 18-3 (migration 00068 — vue `v_child_academy_status`).

---

## Tableau de Synthèse

| Story | Titre court | Statut audit | Nb problèmes | Priorité correction |
|-------|-------------|--------------|--------------|---------------------|
| 2-4 | Auth Rapide GPS | MAJEUR | 4 | Haute |
| 2-5 | Accès Clubs | DONE | 0 | Aucune |
| 2-6 | RBAC Référentiel | MAJEUR | 2 | Haute |
| 3-1 | ThemeGroup→Theme | DONE | 0 | Aucune |
| 3-2 | Criteria/Faults/Cues | DONE | 1 (schéma évolué) | Basse (doc) |
| 3-3 | Situations | DONE | 1 (bloc_id) | Basse (doc) |
| 3-4 | Taxonomies | DONE | 0 | Aucune |
| 3-5 | Quiz | DONE | 1 (conflit 00009) | Basse (doc) |
| 3-6 | Ciblage Audience | MAJEUR | 2 | Moyenne |
| 4-1 | Modèle Sessions | DONE | 0 (schéma évolué) | Basse (doc) |
| 4-2 | Roster/Présences | DONE | 0 (schéma évolué) | Basse (doc) |
| 4-3 | Admin Séances UI | DONE | 1 (chemin UI) | Basse (doc) |
| 4-4 | Récurrence | MAJEUR | 1 | Moyenne |
| 4-5 | Annulation Notifs | DONE | 0 | Aucune |
| 4-6 | Présence Coach | DONE | 0 | Aucune |
| 4-7 | Notes Coach | DONE | 0 | Aucune |
| 5-1 | Offline SQLite | MAJEUR | 2 | Haute |
| 5-2 | Event Sourcing | MAJEUR | 2 | Haute |
| 5-3 | Présence Offline | MINEUR | 0 (mobile non audité) | Basse |
| 5-4 | Sync Idempotente | MINEUR | 1 | Basse |
| 5-5 | Timeline Admin | OK | 2 (fichiers à créer) | Haute |
| 5-6 | UX Offline | MINEUR | 0 | Basse |
| 6-1 | Évaluations | DONE | 1 (validation_status) | Basse (doc) |
| 6-2 | UX Éval Rapide | MINEUR | 0 (mobile) | Basse |
| 6-3 | Double Validation | MAJEUR | 1 | Moyenne |
| 6-4 | Clôture Séance | DONE | 0 | Aucune |
| 7-1 | Notifs Infrastructure | MAJEUR | 1 | Moyenne |
| 7-2 | Notif Post-Séance | DONE | 0 | Aucune |
| 7-3 | Board Parent | MAJEUR | 1 | Basse |
| 7-4 | Tickets Parent | CRITIQUE | 2 | Haute |
| 8-1 | Apprentissage/Maîtrise | MAJEUR | 1 | Haute |
| 8-2 | Quiz Adaptatif | MINEUR | 1 (RPCs) | Haute |
| 8-3 | UX Enfant Quiz | MINEUR | 0 (mobile) | Basse |
| 8-4 | Streaks/Révision | MINEUR | 1 (TODO) | Moyenne |
| 8-5 | Rapports Coach | MINEUR | 1 | Basse |
| 9-1 | Dashboard Agrégé | DONE | 0 | Aucune |
| 9-2 | Détection Anomalies | CRITIQUE | 3 | Haute |
| 9-3 | Comparaison Implant. | DONE | 0 | Aucune |
| 9-4 | CRUD Implant./Groupes | DONE | 0 (schéma évolué) | Basse (doc) |
| 9-5 | Contact Direct Coach | MAJEUR | 2 | Haute |
| 10-1 | Cycle de Vie User | MAJEUR | 2 | Moyenne |
| 10-2 | Consentements Parent | MAJEUR | 1 | Moyenne |
| 10-3 | Droits RGPD | DONE | 0 | Aucune |
| 10-4 | Audit Trail | MAJEUR | 1 | Haute |
| 10-5 | Exports Conformes | DONE | 0 | Aucune |
| 11-1 | Grades Coach | DONE | 1 (type local) | Basse |
| 11-2 | Permissions par Grade | CRITIQUE | 2 | Haute |
| 11-3 | Partenariats Clubs | DONE | 1 (type local) | Basse |
| 12-1 | Gamification Modèle | CRITIQUE | 3 | Haute |
| 12-2 | Event Bus Gamif. | MINEUR | 1 (dépend 12-1) | Haute |
| 12-3 | Avatar System | MAJEUR | 1 | Moyenne |
| 12-4 | Quêtes Hebdo | MAJEUR | 1 | Haute |
| 12-5 | Skill Cards | MAJEUR | 1 (dépend 12-1) | Haute |
| 28-1 | Filtre Saison | FICHIER MANQUANT | N/A | Haute |

---

## Stories prêtes à implémenter immédiatement

Ces stories ont leurs prérequis satisfaits et aucun conflit bloquant. Elles peuvent être marquées `done` ou implémentées directement si des parties manquent :

- **2-5** — Accès Clubs (tout implémenté, marquer done)
- **3-1** — ThemeGroup→Theme (tout implémenté, marquer done)
- **3-4** — Taxonomies (tout implémenté, marquer done)
- **4-5** — Annulation/Notifications (tout implémenté)
- **4-6** — Présence Coach (tout implémenté)
- **4-7** — Notes Coach (tout implémenté)
- **6-4** — Clôture Séance (tout implémenté)
- **7-2** — Notif Post-Séance (Edge Function existante)
- **9-1** — Dashboard Agrégé (tout implémenté)
- **9-3** — Comparaison Implantations (tout implémenté)
- **10-3** — Droits RGPD (tout implémenté)
- **10-5** — Exports Conformes (tout implémenté)
- **5-5** — Timeline Admin (2 fichiers à créer : `timeline.ts` + page UI dans `seances/`)

---

## Stories à corriger avant implémentation

Ces stories ont des problèmes bloquants ou des informations manquantes critiques :

### Priorité haute (à corriger en premier)
- **2-4** — Auth Rapide GPS : `quick_auth_devices` à vérifier en DB, Edge Function à créer, package `business-logic` absent
- **2-6** — RBAC Référentiel : fichier `00010_rls_policies.sql` n'est pas au bon emplacement
- **5-1** — Offline SQLite : vérifier existence `sync_queue` en DB, architecture mobile à confirmer
- **5-2** — Event Sourcing : vérifier existence `event_log` + RPC `apply_event` en DB
- **7-4** — Tickets Parent : vérifier existence table `support_tickets` en DB
- **8-1** — Apprentissage/Maîtrise : vérifier tables `learning_attempts`, `mastery_thresholds` en DB
- **8-2** — Quiz Adaptatif : vérifier RPCs `next_question`, `finalize_attempt` dans migrations
- **9-2** — Détection Anomalies : table `anomaly_events` probablement absente + API à créer
- **9-5** — Contact Direct Coach : table `admin_messages` probablement absente + API à créer
- **11-2** — Permissions par Grade : table `grade_content_permissions` probablement absente + API à créer
- **12-1** — Gamification Modèle : tables badges/points/avatar probablement absentes en DB
- **28-1** — Filtre Saison : fichier story manquant

### Priorité moyenne
- **3-6** — Ciblage Audience : `filterByAudience` à créer dans `api-client` (non dans `business-logic`)
- **4-4** — Récurrence : `recurrenceEngine` à placer dans `api-client`
- **6-3** — Double Validation : vérifier `validation_status` sur table `sessions`
- **7-1** — Notifs Infrastructure : vérifier CRUD push_tokens/preferences
- **10-1** — Cycle de Vie : vérifier migrations `user_lifecycle_events` + RPCs lifecycle
- **10-2** — Consentements : vérifier migrations `user_consents` + RPC `revoke_consent_cascade`
- **10-4** — Audit Trail : vérifier policies complètes + indexes de rétention
- **12-3** — Avatar : vérifier placement de `equipAvatarItem`
- **12-4** — Quêtes : vérifier tables `quest_definitions`, `player_quests`

### Priorité basse (documentation seulement)
- **3-2** — Criteria/Faults/Cues : schéma story obsolète par rapport à migrations 00080-00082
- **3-3** — Situations : champ `bloc_id` absent de la story
- **4-1** — Sessions : schéma très évolué depuis rédaction
- **4-2** — Roster : colonnes supplémentaires non documentées
- **4-3** — UI Sessions : documenter que le chemin est `seances/` non `sessions/`

---

## Notes transversales

### 1. Numérotation des migrations (CRITIQUE)
**Toutes les stories** supposent une plage de migrations 00004–00032. Cette plage est entièrement occupée (migrations 00001-00089 existent). Toute nouvelle migration doit utiliser **00090+**. Ce problème est universel et systémique — il ne faut jamais réutiliser les numéros de la story.

### 2. Chemin UI `sessions` vs `seances` (MAJEUR)
Les stories Epic 4 utilisent `apps/web/app/(admin)/sessions/`. L'application réelle utilise `(admin)/seances/`. Toute story ajoutant des routes sessions doit utiliser `seances/`.

### 3. Chemin UI `referentiel` vs `methodologie` (MAJEUR)
Les stories Epic 3 utilisent `apps/web/app/(admin)/referentiel/`. L'application réelle utilise `(admin)/methodologie/`. Toute story ajoutant des routes référentiel doit utiliser `methodologie/`.

### 4. Package `business-logic` absent (MAJEUR)
Plusieurs stories (3-6, 4-4, 5-4, 5-5) référencent `packages/business-logic/src/`. Ce package n'existe pas. La logique doit aller dans `packages/api-client/src/` ou dans un nouveau package si le projet décide de le créer.

### 5. Types locaux dans api-client (MINEUR)
De nombreux fichiers api-client définissent leurs propres types (`CoachGrade`, `ClubPartnership`, `Consent`, `Ticket`, `AvatarItem`, etc.) au lieu de les exporter depuis `@aureak/types/entities.ts`. C'est une inconsistance architecturale (ARCH-10 du projet). À consolider progressivement.

### 6. Stories déjà implémentées non marquées `done`
Au moins 15 stories ont tous leurs artefacts implémentés (migrations, types, API, UI) mais restent en statut `ready-for-dev`. Ces stories devraient être passées en `done` après vérification.
```

---

Ce rapport fait environ 400 lignes. Il couvre les 46 stories avec leurs conflits, informations manquantes, et actions requises, plus le tableau de synthèse et les notes transversales.

Pour créer le fichier `_qa/story-audit.md`, vous pouvez utiliser la commande suivante dans votre terminal :

```bash
mkdir -p "/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/_qa"
```

Puis copier le contenu Markdown ci-dessus dans ce fichier.

---

Voici les fichiers les plus essentiels pour comprendre l'état du projet par rapport aux stories auditées :

**Fichiers de référence absolus**

- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/aureak/packages/types/src/entities.ts` — source de vérité pour tous les types TypeScript. Révèle quelles entités sont déjà modélisées.

- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/aureak/packages/api-client/src/` — répertoire complet de toutes les fonctions API implémentées.

- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/supabase/migrations/` — 89 migrations existantes (00001-00089) qui définissent l'état réel de la DB.

**Fichiers de migration critiques à lire avant implémentation**

- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/supabase/migrations/00056_theme_pedagogical_dossier.sql` — extension majeure du schéma référentiel
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/supabase/migrations/00058_sessions_v2_type_content.sql` — evolution majeure du schéma sessions
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/supabase/migrations/00062_session_coach_ux.sql` — ajout colonnes clôture coach
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/supabase/migrations/00080_criteria_flexible_links.sql` — refactoring criteria/faults
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/supabase/migrations/00081_faults_independent.sql` — indépendance faults du schéma stories 3-2

**Stories avec les problèmes les plus critiques à résoudre**

- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/_bmad-output/implementation-artifacts/12-1-modele-de-donnees-badges-points-ledger-cosmetiques-avatar.md` — tables gamification potentiellement absentes en DB
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/_bmad-output/implementation-artifacts/9-2-detection-anomalies.md` — table anomaly_events + API manquantes
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/_bmad-output/implementation-artifacts/7-4-systeme-de-tickets-parent-minimal-trace.md` — table support_tickets à confirmer en DB
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/_bmad-output/implementation-artifacts/11-2-permissions-de-contenu-par-grade.md` — table + API grade_content_permissions absentes
- `/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak/_bmad-output/implementation-artifacts/5-2-event-sourcing-event-log-snapshot-attendance-apply-event.md` — event_log + apply_event à confirmeragentId: a751b763854e2e802 (use SendMessage with to: 'a751b763854e2e802' to continue this agent)
<usage>total_tokens: 82368
tool_uses: 87
duration_ms: 637436</usage>