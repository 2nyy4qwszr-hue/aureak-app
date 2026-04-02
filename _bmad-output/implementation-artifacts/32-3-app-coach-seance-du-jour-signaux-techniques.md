# Story 32.3 : App Coach — Séance du Jour & Signaux Techniques

Status: done

## Story

En tant que coach de l'académie,
Je veux accéder en 1 tap à ma séance du jour avec le contenu pédagogique complet, marquer les présences en temps réel et créer des signaux techniques par enfant (erreur observée + critère de réussite),
Afin d'exécuter le programme sans préparation préalable et d'alimenter le profil technique longitudinal de chaque enfant.

## Contexte Métier

- **USP académie** : zéro préparation pour le coach — le curriculum fait le travail pédagogique
- **Autonomie Situationnel** : pour la méthode Situationnel uniquement, le coach choisit l'entraînement dans un pool (avec cooldown 30-40 séances par groupe)
- **Niveaux coach** : Apprenti = cycle imposé toujours / Expérimenté = choix libre sur Situationnel
- **Débrief** = post-séance uniquement, 60 secondes max (confirmation + présences pré-remplies + signaux optionnels)
- **Signal technique** = observation pédagogique structurée (erreur observée + critère de réussite) → trace dans profil enfant + push optionnel au parent

## Acceptance Criteria

**AC1 — Séance du Jour en 1 Tap**
- **When** le coach ouvre l'app
- **Then** la séance du jour (ou prochaine séance dans les 24h) est mise en avant sur la home
- **And** un tap affiche : groupe, implantation, heure, durée, méthode, module, contenu complet de l'entraînement (objectifs pédagogiques, description, variantes, matériel, durée)
- **And** si aucune séance aujourd'hui → les 3 prochaines séances sont listées

**AC2 — Choix Entraînement Situationnel (coach expérimenté)**
- **When** la méthode du jour est Situationnel ET le coach est `experienced`
- **Then** un pool d'entraînements disponibles est affiché (filtrés : cooldown > 30 séances depuis dernier usage pour ce groupe)
- **And** les entraînements en cooldown sont affichés grisés avec la date de retour disponibilité
- **And** le coach choisit un entraînement → confirmation → séance mise à jour
- **When** le coach est `apprentice`
- **Then** le choix n'est pas disponible — l'entraînement est imposé par le programme

**AC3 — Présences en Temps Réel**
- **When** les enfants arrivent à la séance
- **Then** le coach coche chaque enfant présent au fur et à mesure (pas de batch final)
- **And** le statut absent/présent est visible instantanément
- **And** un tap long sur un enfant absent → pop-up : marquer blessé / absent avec motif / absent sans motif
- **And** si le parent a signalé un motif d'absence à l'avance → icône 📌 visible sur l'enfant avec le motif

**AC4 — Fiche Enfant Contextuelle en Séance**
- **When** le coach tape sur un enfant dans la liste de présence
- **Then** une fiche résumée s'ouvre : signaux techniques actifs (⚠️ en cours), points résolus récents (✅), erreurs récurrentes (🔴)
- **And** ces données sont issues des séances précédentes — tous coachs confondus
- **And** le coach peut lire le contexte en 10 secondes sans navigation supplémentaire

**AC5 — Débrief Post-Séance (60 secondes)**
- **When** la séance est terminée, le coach accède au débrief
- **Then** les présences sont déjà pré-remplies depuis AC3
- **And** une confirmation en 1 tap ("Séance réalisée ✅") est suffisante pour valider le débrief minimal
- **And** des signaux rapides optionnels sont disponibles par enfant : ✅ bon / ⚠️ à revoir / 🔴 problème
- **And** une note libre optionnelle (texte ou vocal) est disponible
- **And** aucun champ obligatoire au-delà de la confirmation de séance

**AC6 — Création Signal Technique**
- **When** le coach crée un signal technique sur un enfant
- **Then** il renseigne : erreur observée (texte court) + critère de réussite (texte court)
- **And** le signal est lié à la séance en cours (date, méthode, module)
- **And** le signal est ajouté au profil technique de l'enfant (visible par tous les coachs)
- **And** une option "Notifier les parents" est disponible (activée par défaut)
- **When** l'option est activée
- **Then** les parents reçoivent un push : "Le coach a noté un point de vigilance pour [PRÉNOM] : [ERREUR]. Critère de réussite : [CRITÈRE]"

**AC7 — Cooldown Entraînements (anti-répétition)**
- **When** un entraînement est réalisé par un groupe
- **Then** cet entraînement est marqué "en cooldown" pour ce groupe (durée : 35 séances par défaut, configurable)
- **And** l'entraînement n'apparaît plus dans le pool disponible pendant la durée de cooldown
- **And** la date de retour disponibilité est calculée et affichée

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase
  - [x] 1.1 Table `technical_signals` : id, child_id, coach_id, session_id, error_observed TEXT, success_criterion TEXT, status (active/resolved/archived), notify_parent BOOL, created_at
  - [x] 1.2 Table `training_usage_log` : id, training_id, group_id, session_id, used_at — pour calcul cooldown
  - [x] 1.3 Colonne `coach_level ENUM('apprentice','experienced')` sur `coach_implantation_assignments` ou table coaches
  - [x] 1.4 RLS : coach voit signaux de ses groupes + signaux sur enfants de ses groupes

- [ ] Task 2 — Types TypeScript `@aureak/types`
  - [ ] 2.1 `TechnicalSignal`, `SignalStatus`, `CoachLevel`, `TrainingUsageLog`

- [ ] Task 3 — API `@aureak/api-client`
  - [ ] 3.1 `getTodaySession(coachId)` — séance du jour + contenu entraînement
  - [ ] 3.2 `getAvailableTrainings(groupId, method)` — pool Situationnel filtré cooldown
  - [ ] 3.3 `selectTrainingForSession(sessionId, trainingId)` — choix coach expérimenté
  - [ ] 3.4 `markAttendance(sessionId, childId, status)` — présence en temps réel
  - [ ] 3.5 `getChildSessionContext(childId, sessionId)` — fiche contextuelle séance
  - [ ] 3.6 `submitDebrief(sessionId, data)` — confirmation + signaux rapides + note
  - [ ] 3.7 `createTechnicalSignal(data)` — crée signal + push parent optionnel
  - [ ] 3.8 `resolveTechnicalSignal(signalId)` — marque signal résolu
  - [ ] 3.9 `getChildTechnicalProfile(childId)` — profil longitudinal signaux

- [ ] Task 4 — UI Mobile/Web Coach
  - [ ] 4.1 Home coach : card "Séance du jour" prominente + liste séances prochaines
  - [ ] 4.2 Écran séance : contenu entraînement (objectifs, description, variantes, matériel)
  - [ ] 4.3 Écran présences : liste enfants + tap = présent, tap long = options (blessé/motif)
  - [ ] 4.4 Drawer fiche enfant contextuelle (signaux actifs/résolus)
  - [ ] 4.5 Modal choix entraînement Situationnel (pool + cooldown grisé)
  - [ ] 4.6 Écran débrief : confirmation 1 tap + signaux rapides optionnels + note vocale/texte
  - [ ] 4.7 Modal création signal technique : erreur + critère + toggle notif parent

- [ ] Task 5 — Notifications
  - [ ] 5.1 Push parent "point de vigilance" déclenché par `createTechnicalSignal`
  - [ ] 5.2 Push coach débrief manquant (T+24h, T+48h) — voir Story 32.2

## Dev Notes

### USP à préserver
Le coach ne prépare RIEN en avance. L'app fournit tout au moment du besoin. Ne jamais ajouter de champ "préparation" ou "objectifs à remplir avant la séance".

### Cooldown
- Durée par défaut : 35 séances (≈ 1 saison pour les méthodes à 30 séances)
- Calculé sur le groupe spécifique, pas cross-groupes
- `training_usage_log` est la source de vérité pour le calcul

### Profil technique longitudinal
- `technical_signals` survit aux changements de coach et de saison
- Seuls les signaux `active` et `resolved` récents sont affichés dans la fiche contextuelle
- Les signaux `archived` restent consultables dans le profil complet enfant

### Niveaux coach
- `apprentice` → cycle imposé sur toutes les méthodes
- `experienced` → choix libre sur Situationnel uniquement (Goal&Player et Technique restent imposés)
- La transition apprenti→expérimenté est manuelle (admin)

### Dépendances
- Requiert `sessions`, `groups`, `attendance`, `injuries` existants
- Requiert le contenu des entraînements (bibliothèque Situationnel) — à créer si non existant
- Story 32.1 pour les statuts séance (annulé/tampon)
- Story 32.2 pour l'escalade débrief manquant
