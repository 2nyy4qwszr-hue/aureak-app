# Backlog d'implémentation — Aureak

> Ordre d'exécution recommandé basé sur les dépendances inter-épics.
> Mettre à jour `[ ]` → `[x]` quand une story passe à `done`.
> Dernière mise à jour : 2026-04-01

---

## Légende
- `[x]` = done
- `[ ]` = ready-for-dev
- `[~]` = review (à investiguer avant de coder)

---

## Stories complétées (référence)

- [x] Epic 1 : Fondation monorepo (1-1, 1-2, 1-3)
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

- [ ] **2-4** : auth-rapide-geolocalisee-pin-gps
- [ ] **2-5** : gestion-des-acces-clubs-partenaire-commun
- [ ] **2-6** : permissions-referentiel-pedagogique-rbac-contenu

---

### Bloc 2 — Référentiel pédagogique (Epic 3)
*Dépendance : Epic 1 done ✓*

- [ ] **3-1** : hierarchie-theme-themegroup-theme-sequences
- [ ] **3-2** : criteres-faults-cues
- [ ] **3-3** : arborescence-situationnelle-situationgroup-situation
- [ ] **3-4** : systeme-de-taxonomies-generiques
- [ ] **3-5** : questions-de-quiz-workflow-draft-published
- [ ] **3-6** : ciblage-audience-filtrage-dynamique

---

### Bloc 3 — Séances terrain (Epic 4)
*Dépendance : Epic 3 done*

- [ ] **4-1** : modele-de-donnees-sessions-blocs-recurrence
- [ ] **4-2** : roster-attendu-presences-terrain
- [ ] **4-3** : creation-gestion-admin-des-seances
- [ ] **4-4** : planification-recurrente-gestion-des-exceptions
- [ ] **4-5** : annulation-notifications-multicanal
- [ ] **4-6** : confirmation-presence-coach-gestion-du-bloc
- [ ] **4-7** : vue-coach-fiche-seance-notes-feedback-contenu

---

### Bloc 4 — Offline & sync (Epic 5)
*Dépendance : Epic 4 done*

- [ ] **5-1** : schema-offline-sqlite-sync-queue-serveur
- [ ] **5-2** : event-sourcing-event-log-snapshot-attendance-apply-event
- [ ] **5-3** : enregistrement-presence-offline-2s
- [ ] **5-4** : sync-queue-idempotente-resolution-de-conflits
- [ ] **5-5** : timeline-admin-restauration-via-event-log
- [ ] **5-6** : ux-offline-indicateur-sync-alertes-rappel-j1

---

### Bloc 5 — Évaluations (Epic 6)
*Dépendance : Epic 4 done*

- [ ] **6-1** : modele-evaluations-event-sourcing-regle-de-fusion
- [ ] **6-2** : ux-evaluation-rapide-10s-par-enfant
- [ ] **6-3** : double-validation-coach-realtime-fallback-polling
- [ ] **6-4** : cloture-de-seance-idempotente-tracee

---

### Bloc 6 — Notifications (Epic 7)
*Dépendance : Epic 6 done*

- [ ] **7-1** : infrastructure-notifications-push-tokens-preferences-urgence
- [ ] **7-2** : notification-post-seance-session-closed-send-once
- [ ] **7-3** : board-parent-fiche-enfant-transparence-terrain-admin
- [ ] **7-4** : systeme-de-tickets-parent-minimal-trace

---

### Bloc 7 — Quiz & apprentissage (Epic 8)
*Dépendance : Epic 3 + Epic 6 done*

- [ ] **8-1** : modele-de-donnees-apprentissage-maitrise-gamification
- [ ] **8-2** : moteur-de-quiz-adaptatif-stop-conditions-maitrise
- [ ] **8-3** : ux-enfant-acquired-not-acquired-avatar-badges
- [ ] **8-4** : streaks-revision-espacee-declenchement-evenements-gamification
- [ ] **8-5** : rapports-coach-vue-agregee-groupe-acces-parent

---

### Bloc 8 — Dashboard admin (Epic 9)
*Dépendance : Epic 4 + Epic 6 done*

- [ ] **9-1** : dashboard-agrege-multi-implantations
- [ ] **9-2** : detection-anomalies
- [ ] **9-3** : comparaison-inter-implantations
- [ ] **9-4** : crud-implantations-groupes-assignations-coaches
- [ ] **9-5** : contact-direct-coach

---

### Bloc 9 — RGPD (Epic 10)
*Dépendance : Epic 2 done*

- [ ] **10-1** : cycle-de-vie-utilisateur
- [ ] **10-2** : consentements-parentaux-revocation-en-cascade
- [ ] **10-3** : droits-rgpd-parent-acces-rectification-effacement-portabilite
- [ ] **10-4** : audit-trail-admin-policies-completes-indexes-retention
- [ ] **10-5** : exports-conformes

---

### Bloc 10 — Grades coaches (Epic 11)
*Dépendance : Epic 2 done*

- [ ] **11-1** : grades-coach-historique-immuable
- [ ] **11-2** : permissions-de-contenu-par-grade
- [ ] **11-3** : partenariats-clubs

---

### Bloc 11 — Badges & gamification (Epic 12)
*Dépendance : Epic 8 done*

- [ ] **12-1** : modele-de-donnees-badges-points-ledger-cosmetiques-avatar
- [ ] **12-2** : event-bus-gamification-traitement-des-4-evenements-declencheurs
- [ ] **12-3** : avatar-system-equipement-items-debloquables
- [ ] **12-4** : quetes-hebdomadaires-attribution-progression-recompenses
- [ ] **12-5** : carte-de-progression-theme-collection-de-skill-cards

---

### Bloc 12 — RBFA enrichissement (Epic 28 reste)

- [ ] **28-1** : rbfa-enrichissement-clubs

---

## Commande de lancement type

Pour implémenter un bloc entier, utiliser ce prompt :

```
Implémente le Bloc 2 — Référentiel pédagogique (Epic 3).
Stories dans l'ordre : 3-1, 3-2, 3-3, 3-4, 3-5, 3-6.
Pour chaque story : lis la story → vérifie les dépendances → implémente → QA scan → test Playwright → commit → marque done → story suivante.
Arrête-toi après le bloc pour review.
```
