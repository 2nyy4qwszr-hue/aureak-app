---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/architecture.md
---

# Application Aureak - Epic Breakdown

## Overview

Ce document fournit la décomposition complète en épics et stories pour Application Aureak, dérivée des exigences du PRD, de la spec UX et de l'architecture, organisées en stories implémentables.

## Requirements Inventory

### Functional Requirements

#### 1. Gestion des Utilisateurs & Accès
- FR1 : Un Admin peut créer, modifier et désactiver les comptes de tous les rôles
- FR2 : Un Coach peut accéder uniquement aux séances et données de ses implantations assignées
- FR3 : Un Admin peut accorder un accès temporaire cross-implantation à un Coach, action journalisée
- FR4 : Un Parent peut accéder aux données de son ou ses enfants uniquement
- FR5 : Un Enfant peut accéder à son profil via le compte de son parent jusqu'à 15-16 ans, puis avec validation parentale
- FR6 : Un Parent peut gérer les consentements (droit à l'image, vidéo, diffusion) depuis son compte
- FR7 : Un Parent peut retirer un consentement vidéo, déclenchant la suppression automatique des médias associés
- FR8 : Un Club partenaire/associé peut consulter en lecture les présences, blessures et rapports de ses enfants
- FR9 : Un Club commun peut consulter en lecture minimale les présences, blessures et rapports périodiques
- FR60 : Les tokens d'authentification sont renouvelés automatiquement sans interruption utilisateur
- FR61 : Les permissions sont vérifiées à chaque requête côté serveur (RBAC serveur-side)
- FR62 : Les données sont isolées par `tenant_id` avec filtrage obligatoire côté backend

#### 2. Gestion des Séances / Entraînements *(nouveau — entité centrale du système)*
- FR-S1 : Un Admin peut créer une séance avec tous ses attributs : date, heure, durée, lieu, implantation, groupe cible, coach(s) assigné(s)
- FR-S2 : Un Admin peut modifier une séance existante (tous champs) et archiver les séances passées
- FR-S3 : Un Admin peut associer un ou plusieurs thèmes techniques à une séance, définissant les objectifs pédagogiques de la séance
- FR-S4 : Un Coach peut consulter la liste de toutes ses séances assignées (passées et futures) avec statut (planifiée / en cours / terminée / annulée)
- FR-S5 : Un Coach peut accéder à la fiche complète de la séance du jour : thèmes, critères, rappels d'exercices, liste des enfants attendus
- FR-S6 : Un Coach peut soumettre un retour global sur la séance à destination de l'admin (texte libre)
- FR-S7 : Le système conserve l'historique complet de toutes les séances d'un enfant (présence, évaluation, quiz résultat)
- FR-S8 : Un Admin peut consulter l'historique de toutes les séances par implantation, coach ou groupe
- FR-S9 : Le système permet la planification récurrente de séances (par exemple, chaque mercredi pour le groupe U8)
- FR-S10 : Un Admin peut annuler une séance avec envoi automatique de notification (push + email + SMS) à tous les participants

#### 3. Opérations Terrain & Présences
- FR10 : Un Coach peut consulter la liste de ses séances du jour avec groupe, lieu et heure
- FR11 : Un Coach peut accéder à la fiche de séance (thèmes techniques, critères, rappels d'exercices)
- FR12 : Un Admin peut créer, modifier et archiver des séances (date, heure, lieu, implantation, groupe, coach) *(couvert par FR-S1/S2)*
- FR13 : Un Admin peut associer des thèmes techniques et critères pédagogiques à une séance *(couvert par FR-S3)*
- FR14 : Un Coach peut soumettre un retour global sur une séance à destination de l'admin *(couvert par FR-S6)*
- FR15 : Un Coach peut enregistrer les présences des enfants en mode hors-ligne
- FR16 : Le système synchronise automatiquement les présences locales dès que le réseau est disponible
- FR17 : Le système alerte le Coach de manière visible lors de tout échec de synchronisation
- FR18 : Le système envoie une notification de rappel au Coach le lendemain si des données restent non synchronisées
- FR19 : Un Coach peut consulter l'état de synchronisation de ses données en temps réel
- FR57 : Un Coach peut enregistrer une présence individuelle en une seule action rapide (< 2s online, immédiat offline)
- FR58 : Le mode séance fonctionne intégralement sans connexion réseau
- FR59 : Le système préserve toutes les données locales même en cas de fermeture forcée de l'app
- FR95 : Le système gère les conflits de synchronisation selon une règle définie (priorité serveur par défaut)
- FR96 : Le Coach est informé lorsqu'une donnée a été modifiée côté serveur pendant son mode offline

#### 3. Évaluation & Boucle Pédagogique
- FR20 : Un Coach peut noter l'attitude et l'effort de chaque enfant à l'issue d'une séance
- FR21 : Un Coach peut ajouter un commentaire libre par enfant après une séance
- FR22 : Un Enfant peut répondre à un quiz QCM lié aux thèmes techniques de la séance
- FR23 : Le système présente à l'Enfant la correction détaillée après soumission du quiz
- FR24 : Un Coach peut consulter les résultats de quiz de l'ensemble de son groupe
- FR72 : Les résultats de quiz sont agrégés par thème pour analyse longitudinale
- FR76 : Le système calcule une progression par thème pour chaque enfant
- FR25 : Un Coach peut uploader une vidéo de retour technique associée à un enfant ou une séance *(Phase 2)*
- FR26 : Un Enfant peut soumettre une vidéo d'auto-évaluation depuis l'app mobile *(Phase 2)*
- FR27 : Un Coach peut visionner les vidéos soumises par les enfants et y ajouter un retour textuel *(Phase 2)*
- FR28 : Un Admin peut valider ou rejeter toute vidéo coach avant sa diffusion *(Phase 2)*
- FR101 : Un Admin peut définir une durée maximale de vidéo d'auto-évaluation par thème/exercice *(Phase 2)*
- FR102 : L'app affiche un compteur et stoppe la capture à la durée maximale *(Phase 2)*
- FR103 : Le système refuse l'upload si la durée dépasse la limite configurée *(Phase 2)*
- FR104 : Un Coach/Admin peut définir un gabarit d'évaluation pour une vidéo *(Phase 2)*
- FR105 : Le système associe chaque vidéo à un thème + version du thème + sous-critère *(Phase 2)*

#### 4. Référentiel Technique & Contenu Pédagogique
- FR66 : Un Admin peut créer, modifier et archiver un thème technique
- FR67 : Un thème peut contenir des sous-critères pédagogiques détaillés (mains, timing, posture, regard…)
- FR68 : Un thème peut être classé par niveau et tranche d'âge
- FR69 : Un thème peut être lié à plusieurs séances
- FR70 : Un Admin peut créer des questions de quiz associées à un thème spécifique
- FR71 : Le système génère automatiquement le quiz d'une séance à partir des thèmes associés
- FR78 : Un Admin peut modifier les critères de validation d'un thème
- FR81 : Un Admin peut mettre à jour le contenu pédagogique d'un thème sans impacter l'historique des données enfants
- FR92 : Le système versionne chaque thème technique
- FR93 : Les données enfants restent liées à la version du thème active au moment de la séance
- FR94 : Un Admin peut créer une nouvelle version d'un thème sans altérer l'historique existant
- FR106 : Le système supporte plusieurs types d'unités pédagogiques (thème, situation, module coach, programme spécifique)
- FR107 : Chaque unité pédagogique est associée à une audience cible (rôle, tranche d'âge, programme)
- FR108 : Les contenus sont filtrés dynamiquement selon le rôle, l'âge et le programme d'appartenance de l'utilisateur
- FR73 : Une vidéo peut être taguée par thème et sous-critère *(Phase 2)*
- FR74 : Le système peut afficher toutes les vidéos associées à un thème donné *(Phase 2)*
- FR75 : Un Coach peut filtrer les vidéos d'un enfant par thème technique *(Phase 2)*
- FR77 : Un badge peut être déclenché automatiquement par la validation d'un thème *(Phase 2)*
- FR79 : Un thème peut contenir un module pédagogique destiné aux coachs *(Phase 3)*
- FR80 : Un Coach peut consulter les capsules pédagogiques liées à un thème *(Phase 3)*
- FR109 : Une vidéo peut être associée à n'importe quel type d'unité pédagogique *(Phase 2)*

#### 5. Communication & Notifications
- FR29 : Le système envoie une notification push au Parent à la clôture de chaque séance de son enfant
- FR30 : Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente
- FR31 : Un Parent peut soumettre une demande structurée au staff via un système de tickets encadrés
- FR32 : Un Coach ou Admin peut répondre aux tickets parents, réponse tracée
- FR33 : Le système notifie le Parent pour l'inviter à faire compléter le quiz post-séance

#### 6. Tableaux de Bord Utilisateur
- FR34 : Un Parent peut consulter la fiche complète de son enfant (présences, évaluations, quiz)
- FR35 : Un Parent peut visualiser l'évolution de son enfant dans le temps
- FR36 : Un Parent peut visionner les vidéos autorisées de son enfant, en lecture seule *(Phase 2)*
- FR37 : Un Parent peut exporter un rapport PDF de la fiche de son enfant *(Phase 2)*
- FR38 : Un Parent peut exporter les séances au format `.ics` *(Phase 2)*
- FR39 : Un Enfant peut consulter sa progression (badges, scores quiz, feedbacks) *(Phase 2)*
- FR40 : Un Enfant peut débloquer des badges techniques en validant les critères d'une séance *(Phase 2)*

#### 6b. Module Progression Joueur *(nouveau — entité distincte, visible parent + enfant)*
- FR-P1 : Le système calcule et affiche un score de progression par thème technique pour chaque enfant, basé sur l'historique des évaluations et des quiz
- FR-P2 : Un Parent peut consulter l'historique complet des évaluations de son enfant (par séance, par thème, dans le temps)
- FR-P3 : Un Parent peut visualiser une courbe d'évolution par thème (graphique temporel) depuis le début de la saison
- FR-P4 : Un Parent peut consulter les statistiques de présence de son enfant (taux de présence, total séances, absences)
- FR-P5 : Le système affiche les badges et niveaux débloqués par l'enfant avec la date et le thème associé *(badges Phase 2, niveau MVP)*
- FR-P6 : Un Coach peut consulter la progression agrégée de son groupe (par thème, par enfant) pour préparer sa prochaine séance
- FR-P7 : Un Admin peut consulter les statistiques de progression par groupe et par implantation
- FR-P8 : La progression est calculée de façon incrémentale à chaque clôture de séance — sans action manuelle du coach

#### 7. Supervision Admin, Qualité & Benchmark
- FR41 : Un Admin peut consulter un tableau de bord agrégé multi-implantations
- FR42 : Un Admin peut identifier les Coachs sans check-in ou feedback sur leurs séances récentes
- FR43 : Un Admin peut contacter directement un Coach depuis la plateforme
- FR44 : Un Admin peut gérer les implantations, groupes et assignations coach/enfant
- FR45 : Un Admin peut exporter un rapport mensuel PDF par implantation *(Phase 2)*
- FR63 : Le système peut agréger anonymement les données inter-implantations pour analyse collective
- FR64 : Un Admin peut comparer les implantations sur des métriques clés
- FR65 : Le système détecte automatiquement des anomalies (baisse de feedback, absentéisme anormal)

#### 8. Grades Coach
- FR82 : Un Admin peut attribuer un grade à un Coach
- FR83 : Les permissions d'un Coach varient dynamiquement selon son grade
- FR84 : Le système restreint l'accès à certains contenus si le grade du Coach est insuffisant
- FR85 : Le passage de grade déclenche automatiquement l'ouverture de nouveaux droits
- FR86 : Le système conserve l'historique des grades d'un Coach

#### 9. Gestion des Clubs & Partenariats
- FR87 : Un Admin peut définir le niveau de partenariat d'un Club (partenaire/associé, commun)
- FR88 : Les permissions de consultation d'un Club varient selon son niveau de partenariat
- FR89 : Le système journalise toute consultation de données par un Club
- FR90 : Un Admin peut modifier le niveau de partenariat d'un Club à tout moment
- FR91 : Le changement de niveau de partenariat met à jour automatiquement les droits d'accès

#### 10. Gestion Médicale *(Phase 2)*
- FR53 : Un Coach peut déclarer une blessure avec type, date et restriction de reprise
- FR54 : Le système empêche l'enregistrement d'une présence active si une restriction médicale est en cours
- FR55 : Un Parent peut consulter l'historique des blessures de son enfant
- FR56 : Un Admin peut exporter un rapport des blessures par implantation

#### 11. Conformité & Intégrité des Données (RGPD)
- FR46 : Le système journalise toutes les opérations sensibles (consultation, modification, export, upload, accès cross-tenant)
- FR47 : Le système supprime automatiquement les médias lors du retrait d'un consentement parental
- FR48 : Un Admin peut configurer la durée de conservation des données par type d'entité
- FR49 : Un Parent peut exercer ses droits RGPD (accès, rectification, effacement, portabilité) depuis son compte
- FR97 : Le système peut anonymiser les données pédagogiques lors d'exports ou d'analyses inter-implantations
- FR98 : Les exports clubs excluent automatiquement toute donnée non autorisée selon les consentements parentaux actifs
- FR99 : Un Admin peut consulter et filtrer l'audit trail par utilisateur, type d'action et période
- FR100 : Le système conserve les logs d'audit pour une durée configurable, indépendante des données enfants

#### 12. Module Médias

**MVP — Partage simple de séance (photo / courte vidéo)**
- FR-M1 : Un Coach peut ajouter une photo ou une courte vidéo (≤ 30 secondes) à une séance terminée depuis son mobile
- FR-M2 : Le média soumis par un Coach passe en statut "en attente de validation" — invisible aux parents jusqu'à validation admin
- FR-M3 : Un Admin peut approuver ou rejeter chaque média soumis par un Coach avant diffusion
- FR-M4 : Un Parent peut visionner les médias de séance approuvés pour son enfant, en lecture seule (streaming uniquement, pas de téléchargement)
- FR-M5 : Le système journalise chaque accès à un média (qui, quand, quel média)
- FR-M6 : La suppression automatique d'un média est déclenchée si le consentement parental associé est retiré (FR7)

**Phase 2 — Module vidéo avancé (auto-évaluation, retour coach)**
- FR25 : Un Coach peut uploader une vidéo de retour technique associée à un enfant ou une séance *(Phase 2)*
- FR26 : Un Enfant peut soumettre une vidéo d'auto-évaluation depuis l'app mobile *(Phase 2)*
- FR27 : Un Coach peut visionner les vidéos soumises par les enfants et y ajouter un retour textuel *(Phase 2)*
- FR28 : Un Admin peut valider ou rejeter toute vidéo coach avant sa diffusion — aucune transmission sans validation admin *(Phase 2)*
- FR101 : Un Admin peut définir une durée maximale de vidéo d'auto-évaluation par thème/exercice *(Phase 2)*
- FR102 : L'app affiche un compteur et stoppe la capture à la durée maximale *(Phase 2)*
- FR103 : Le système refuse l'upload si la durée dépasse la limite configurée *(Phase 2)*
- FR104 : Un Coach/Admin peut définir un gabarit d'évaluation pour une vidéo *(Phase 2)*
- FR105 : Le système associe chaque vidéo à un thème + version du thème + sous-critère *(Phase 2)*

#### 13. Module Business *(Phase 2)*
- FR50 : Un Parent peut consulter les offres de stages et s'y inscrire depuis la plateforme
- FR51 : Un Parent peut régler le paiement d'un stage via la plateforme (Stripe)
- FR52 : Le système génère automatiquement les documents d'inscription, reçus et justificatifs mutuelle

---

### NonFunctional Requirements

#### Performance
- NFR-PERF-1 : Enregistrement présence individuelle (online) < 2 secondes (terrain, coach en mouvement)
- NFR-PERF-2 : Enregistrement présence individuelle (offline) immédiat, sans latence réseau
- NFR-PERF-3 : Chargement liste des séances du jour < 2 secondes sur 4G
- NFR-PERF-4 : Démarrage à froid de l'app < 3 secondes sur appareil mid-range (iPhone 11 / Samsung A54)
- NFR-PERF-5 : Temps de réponse API < 300ms au 95e percentile
- NFR-PERF-6 : Livraison notification push post-séance < 60 secondes après déclenchement
- NFR-PERF-7 : Livraison notification critique (annulation) < 30 secondes (push + email + SMS en parallèle)
- NFR-PERF-8 : Génération export PDF < 5 secondes

#### Sécurité
- NFR-SEC-1 : Toutes les communications chiffrées en transit (TLS 1.2 minimum)
- NFR-SEC-2 : Données au repos chiffrées (AES-256 pour les médias)
- NFR-SEC-3 : Tokens d'accès durée max 24h, tokens de rafraîchissement 30 jours
- NFR-SEC-4 : RBAC appliqué côté serveur à chaque requête — jamais uniquement côté client
- NFR-SEC-5 : Isolation `tenant_id` : zéro fuite de données cross-tenant tolérée
- NFR-SEC-6 : Vidéos : streaming uniquement, aucun endpoint de téléchargement direct
- NFR-SEC-7 : Logs d'accès vidéo : toute consultation tracée avec horodatage et identité
- NFR-SEC-8 : Paiements Stripe : conformité PCI-DSS déléguée — aucune donnée carte stockée

#### Fiabilité & Résilience
- NFR-REL-1 : Disponibilité globale ≥ 95% (évolutif vers 99% en Phase 2)
- NFR-REL-2 : Taux de succès synchronisation offline ≥ 90% — tout échec déclenche une alerte visible
- NFR-REL-3 : Zéro perte silencieuse de données — toute erreur de sync remonte une alerte utilisateur
- NFR-REL-4 : Données locales persistantes : survie à une fermeture forcée de l'app
- NFR-REL-5 : Résolution des conflits de sync : priorité serveur par défaut — Coach notifié en cas de divergence
- NFR-REL-6 : Notifications de rappel J+1 si données non synchronisées

#### Scalabilité
- NFR-SCAL-1 : Support de 1 000 utilisateurs actifs simultanés (horizon 2-3 ans)
- NFR-SCAL-2 : Architecture horizontalement scalable jusqu'à 5 000 utilisateurs sans refactoring majeur
- NFR-SCAL-3 : Modèle multi-tenant supporte jusqu'à 50 implantations sans dégradation
- NFR-SCAL-4 : Requêtes base de données optimisées pour le filtrage systématique par `tenant_id`
- NFR-SCAL-5 : Médias (vidéos) servis via CDN — découplés de l'infrastructure applicative

#### Vidéo & Médias *(Phase 2)*
- NFR-V1 : Durée max vidéo d'auto-évaluation ≤ 10 secondes par défaut, configurable par thème/exercice
- NFR-V2 : Poids max par vidéo ≤ 40 MB — compression automatique côté mobile avant upload
- NFR-V3 : Upload d'une vidéo de 10s en ≤ 60 secondes sur 4G au 95e percentile
- NFR-V4 : Lecture côté parent et enfant en streaming uniquement — aucun endpoint de téléchargement
- NFR-V5 : Purge automatique des vidéos selon consentement parental actif et durée de conservation configurée

#### Conformité RGPD
- NFR-RGPD-1 : Consentement parental collecté et archivé avant tout traitement de données de l'enfant
- NFR-RGPD-2 : Droit à l'effacement exécuté dans un délai ≤ 30 jours (médias supprimés dans les 24h)
- NFR-RGPD-3 : Exportabilité des données : format structuré exploitable (JSON ou CSV) sur demande
- NFR-RGPD-4 : Données inter-implantations : anonymisées systématiquement avant tout agrégat ou export
- NFR-RGPD-5 : Exports clubs : filtrés automatiquement selon les consentements parentaux actifs
- NFR-RGPD-6 : Logs d'audit conservés minimum 5 ans, indépendamment des données enfants

#### Intégrité des Données
- NFR-INT-1 : Toutes les opérations de synchronisation sont transactionnelles — écriture partielle rejetée et rejouée
- NFR-INT-2 : Versioning des thèmes : les données enfants restent liées à la version active au moment de la séance
- NFR-INT-3 : Toute modification de thème pédagogique est non-destructive — historique préservé
- NFR-INT-4 : Journal d'audit immuable — entrées non modifiables par les utilisateurs standard

#### Accessibilité Terrain
- NFR-ACC-1 : Contraste d'affichage WCAG AA minimum — lisibilité en plein soleil
- NFR-ACC-2 : Taille des zones tactiles ≥ 44px — utilisable avec des doigts en mouvement
- NFR-ACC-3 : Indicateur de connectivité/sync : toujours visible dans l'interface mobile
- NFR-ACC-4 : Pas de dépendance exclusive à la couleur pour transmettre un état

---

### Additional Requirements

#### Architecture Technique (depuis architecture.md)
- ARCH-1 : Initialisation monorepo via `yarn create tamagui@latest --template expo-router` — ce starter est le point de départ de la Story 1.1 (Epic 1)
- ARCH-2 : Structure monorepo Turborepo avec 6 packages : `@aureak/types`, `@aureak/theme`, `@aureak/ui`, `@aureak/api-client`, `@aureak/media-client`, `@aureak/business-logic`
- ARCH-3 : 2 apps : `apps/mobile` (Expo iOS+Android) et `apps/web` (Expo Router web)
- ARCH-4 : Supabase backend avec 10 migrations numérotées (00001→00010) et 5 Edge Functions
- ARCH-5 : Stockage local `expo-sqlite` pour données relationnelles terrain ; custom sync queue avec `operation_id` UUID pour l'idempotency
- ARCH-6 : State management : Zustand (client) + TanStack Query (server) — jamais mixés
- ARCH-7 : Forms : React Hook Form + Zod — validation partagée via `@aureak/types`
- ARCH-8 : Supabase Realtime (WebSocket) limité au flow de double-validation coach
- ARCH-9 : Table `push_tokens` requise pour les notifications natives (iOS/Android)
- ARCH-10 : ESLint rule : import `@supabase/supabase-js` uniquement via `@aureak/api-client` ou `@aureak/media-client`
- ARCH-11 : Conflict policy per entity : attendance→server_wins, evaluation→server_wins_per_coach, evaluation_comment→LWW, quiz_result→client_wins
- ARCH-12 : Enums PostgreSQL + TypeScript mirrorés : `attendance_status`, `evaluation_signal`, `coach_role`
- ARCH-13 : Soft-delete obligatoire sur toutes les entités principales (`deleted_at` nullable) — purge dure réservée aux jobs RGPD
- ARCH-14 : Stratégie de tests : Vitest (unit) + RNTL (composants) + Maestro (E2E mobile) + Playwright (E2E web)
- ARCH-15 : Auth rapide géolocalisée : PIN 4 chiffres + vérification périmètre GPS via `expo-location`, rayon configurable par implantation
- ARCH-16 : Notifications : Resend (email) + Twilio (SMS) via Supabase Edge Functions
- ARCH-17 : Build/CI : Expo EAS Build + GitHub Actions ; Supabase Free en développement → Pro au lancement

#### UX Design (depuis ux-design-specification.md)
- UX-1 : 5 indicateurs d'évaluation par enfant : Réceptivité, Goût à l'effort, Attitude, Progression technique, Top séance — cycle 2 états max (🟢/🟡/vide), "Top séance" binaire (⭐/vide)
- UX-2 : Aucun état rouge dans le système — aucun indicateur 🔴
- UX-3 : Flow d'évaluation complète par enfant réalisable en < 10 secondes, à une main (pouce)
- UX-4 : Navigation par swipe gauche/droite entre les cartes enfants
- UX-5 : Double validation coach : chacun valide sur son propre téléphone ; validation solo possible avec notification admin
- UX-6 : Liste d'enfants toujours pré-remplie — le coach ne saisit jamais un nom
- UX-7 : Notification parent automatique après double validation, dans les 5 minutes
- UX-8 : Retour haptique ou visuel immédiat à chaque tap
- UX-9 : Design system "Dark Manga Premium" : tokens couleurs or/noir/beige définis dans `packages/theme/tokens.ts`
- UX-10 : Quiz enfant : maximum 5 questions QCM, feedback visuel immédiat, grandes cibles tactiles

---

### FR Coverage Map

**Phase 1 — MVP**

FR1 → Epic 2 — Création/gestion comptes tous rôles
FR2 → Epic 2 — Accès coach limité à ses implantations
FR3 → Epic 2 — Accès temporaire cross-implantation avec audit
FR4 → Epic 2 — Accès parent limité à ses enfants
FR5 → Epic 2 — Accès enfant via compte parent (<15-16 ans)
FR6 → Epic 10 — Gestion consentements parental depuis compte parent
FR7 → Epic 10 — Retrait consentement → suppression médias automatique
FR8 → Epic 11 — Accès lecture Club partenaire/associé
FR9 → Epic 11 — Accès lecture minimal Club commun
FR10 → Epic 4 — Coach consulte séances du jour (groupe, lieu, heure)
FR11 → Epic 4 — Coach accède à la fiche de séance (thèmes, critères, exercices)
FR12 → Epic 4 — Admin crée/modifie/archive séances (couvert par FR-S1/S2)
FR13 → Epic 4 — Admin associe thèmes à une séance (couvert par FR-S3)
FR14 → Epic 6 — Coach soumet retour global séance (couvert par FR-S6)
FR15 → Epic 5 — Coach enregistre présences en mode hors-ligne
FR16 → Epic 5 — Sync automatique présences dès réseau disponible
FR17 → Epic 5 — Alerte visible sur tout échec de synchronisation
FR18 → Epic 5 — Notification rappel J+1 si données non synchronisées
FR19 → Epic 5 — Coach consulte état de synchronisation en temps réel
FR20 → Epic 6 — Coach note attitude et effort par enfant (5 indicateurs)
FR21 → Epic 6 — Coach ajoute commentaire libre par enfant
FR22 → Epic 8 — Enfant répond au quiz QCM lié aux thèmes de séance
FR23 → Epic 8 — Correction détaillée présentée après soumission quiz
FR24 → Epic 8 — Coach consulte résultats quiz de son groupe
FR25 → Epic 14 — Coach upload vidéo retour technique *(Phase 2)*
FR26 → Epic 14 — Enfant soumet vidéo auto-évaluation *(Phase 2)*
FR27 → Epic 14 — Coach visionne vidéos enfants + retour textuel *(Phase 2)*
FR28 → Epic 14 — Admin valide/rejette vidéo coach avant diffusion *(Phase 2)*
FR29 → Epic 7 — Notification push parent à clôture de séance
FR30 → Epic 7 — Push + email + SMS en cas d'annulation urgente
FR31 → Epic 7 — Parent soumet demande via ticket structuré
FR32 → Epic 7 — Coach/Admin répond aux tickets parents (tracé)
FR33 → Epic 7 — Système notifie parent pour inviter à compléter le quiz
FR34 → Epic 7 — Parent consulte fiche complète de son enfant
FR35 → Epic 8 — Parent visualise évolution de son enfant dans le temps
FR36 → Epic 14 — Parent visionne vidéos autorisées en lecture seule *(Phase 2)*
FR37 → Epic 17 — Parent exporte rapport PDF *(Phase 2)*
FR38 → Epic 17 — Parent exporte séances au format .ics *(Phase 2)*
FR39 → Epic 12 — Enfant consulte sa progression (avatar, badges, quêtes) *(Phase 2)*
FR40 → Epic 12 — Enfant débloque des badges et items via l'apprentissage *(Phase 2)*
FR41 → Epic 9 — Admin consulte dashboard agrégé multi-implantations
FR42 → Epic 9 — Admin identifie coaches sans check-in ou feedback
FR43 → Epic 9 — Admin contacte directement un Coach depuis la plateforme
FR44 → Epic 9 — Admin gère implantations, groupes et assignations
FR45 → Epic 17 — Admin exporte rapport mensuel PDF par implantation *(Phase 2)*
FR46 → Epic 10 — Journalisation de toutes les opérations sensibles
FR47 → Epic 10 — Suppression automatique médias sur retrait consentement
FR48 → Epic 10 — Admin configure durée de conservation par type d'entité
FR49 → Epic 10 — Parent exerce droits RGPD depuis son compte
FR50 → Epic 16 — Parent consulte et s'inscrit aux stages *(Phase 2)*
FR51 → Epic 16 — Parent règle paiement stage via Stripe *(Phase 2)*
FR52 → Epic 16 — Génération automatique documents inscription/reçus *(Phase 2)*
FR53 → Epic 15 — Coach déclare une blessure *(Phase 2)*
FR54 → Epic 15 — Blocage présence active si restriction médicale *(Phase 2)*
FR55 → Epic 15 — Parent consulte historique blessures *(Phase 2)*
FR56 → Epic 15 — Admin exporte rapport blessures *(Phase 2)*
FR57 → Epic 5 — Enregistrement présence individuelle rapide (< 2s online)
FR58 → Epic 5 — Mode séance fonctionne intégralement sans réseau
FR59 → Epic 5 — Données locales préservées en cas de fermeture forcée
FR60 → Epic 2 — Renouvellement automatique tokens sans interruption
FR61 → Epic 2 — Vérification permissions côté serveur à chaque requête
FR62 → Epic 2 — Isolation données par tenant_id côté backend
FR63 → Epic 9 — Agrégation anonyme données inter-implantations
FR64 → Epic 9 — Admin compare implantations sur métriques clés
FR65 → Epic 9 — Détection automatique anomalies (absentéisme, manque feedback)
FR66 → Epic 3 — Admin crée/modifie/archive thème technique
FR67 → Epic 3 — Thème contient sous-critères pédagogiques détaillés
FR68 → Epic 3 — Thème classé par niveau et tranche d'âge
FR69 → Epic 3 — Thème lié à plusieurs séances
FR70 → Epic 3 — Admin crée questions quiz associées à un thème
FR71 → Epic 3 — Génération automatique quiz séance depuis thèmes associés
FR72 → Epic 8 — Résultats quiz agrégés par thème pour analyse longitudinale
FR73 → Epic 14 — Vidéo taguée par thème et sous-critère *(Phase 2)*
FR74 → Epic 14 — Affichage toutes vidéos associées à un thème *(Phase 2)*
FR75 → Epic 14 — Coach filtre vidéos d'un enfant par thème *(Phase 2)*
FR76 → Epic 8 — Calcul progression par thème pour chaque enfant
FR77 → Epic 12 — Badge + skill card déclenchés automatiquement par validation thème *(Phase 2)*
FR78 → Epic 3 — Admin modifie critères de validation d'un thème
FR79 → Epic 3 — Thème contient module pédagogique coach *(Phase 3 hors scope)*
FR80 → Epic 3 — Coach consulte capsules pédagogiques d'un thème *(Phase 3 hors scope)*
FR81 → Epic 3 — Mise à jour contenu pédagogique non destructive (historique préservé)
FR82 → Epic 11 — Admin attribue grade à un Coach
FR83 → Epic 11 — Permissions Coach varient dynamiquement selon grade
FR84 → Epic 11 — Restriction accès contenu si grade insuffisant
FR85 → Epic 11 — Passage de grade déclenche ouverture nouveaux droits
FR86 → Epic 11 — Historique des grades d'un Coach conservé
FR87 → Epic 11 — Admin définit niveau partenariat d'un Club
FR88 → Epic 11 — Permissions consultation Club varient selon partenariat
FR89 → Epic 11 — Journalisation consultation données par un Club
FR90 → Epic 11 — Admin modifie niveau partenariat d'un Club
FR91 → Epic 11 — Changement partenariat met à jour droits automatiquement
FR92 → Epic 3 — Versioning de chaque thème technique
FR93 → Epic 3 — Données enfants liées à la version thème active lors de la séance
FR94 → Epic 3 — Nouvelle version thème sans altérer historique existant
FR95 → Epic 5 — Gestion conflits de synchronisation (priorité serveur)
FR96 → Epic 5 — Coach informé si donnée modifiée côté serveur en offline
FR97 → Epic 10 — Anonymisation données pédagogiques lors d'exports inter-implantations
FR98 → Epic 10 — Exports clubs filtrés automatiquement selon consentements actifs
FR99 → Epic 10 — Admin consulte et filtre audit trail (utilisateur, action, période)
FR100 → Epic 10 — Logs d'audit conservés durée configurable (min 5 ans)
FR101 → Epic 14 — Admin définit durée max vidéo par thème/exercice *(Phase 2)*
FR102 → Epic 14 — App affiche compteur + stoppe capture à durée max *(Phase 2)*
FR103 → Epic 14 — Système refuse upload si durée dépasse limite *(Phase 2)*
FR104 → Epic 14 — Coach/Admin définit gabarit d'évaluation vidéo *(Phase 2)*
FR105 → Epic 14 — Vidéo associée à thème + version + sous-critère *(Phase 2)*
FR106 → Epic 3 — Système supporte plusieurs types d'unités pédagogiques
FR107 → Epic 3 — Unité pédagogique associée à audience cible (rôle, âge, programme)
FR108 → Epic 3 — Contenus filtrés dynamiquement selon rôle, âge, programme
FR109 → Epic 14 — Vidéo associée à tout type d'unité pédagogique *(Phase 2)*

FR-S1 → Epic 4 — Admin crée séance (date, heure, durée, lieu, implantation, groupe, coach)
FR-S2 → Epic 4 — Admin modifie séance et archive séances passées
FR-S3 → Epic 4 — Admin associe thèmes à une séance
FR-S4 → Epic 4 — Coach consulte toutes ses séances assignées avec statut
FR-S5 → Epic 4 — Coach accède fiche complète séance du jour
FR-S6 → Epic 6 — Coach soumet retour global séance à l'admin
FR-S7 → Epic 8 — Historique complet toutes séances d'un enfant
FR-S8 → Epic 9 — Admin consulte historique séances par implantation/coach/groupe
FR-S9 → Epic 4 — Planification récurrente de séances
FR-S10 → Epic 4 — Admin annule séance + notifications automatiques (push/email/SMS)

FR-P1 → Epic 8 — Score progression par thème calculé et affiché
FR-P2 → Epic 8 — Parent consulte historique complet évaluations de son enfant
FR-P3 → Epic 8 — Parent visualise courbe d'évolution par thème (graphique temporel)
FR-P4 → Epic 8 — Parent consulte statistiques de présence de son enfant
FR-P5 → Epic 8 — Badges et niveaux débloqués avec date et thème associé
FR-P6 → Epic 8 — Coach consulte progression agrégée de son groupe
FR-P7 → Epic 9 — Admin consulte stats progression par groupe et implantation
FR-P8 → Epic 8 — Progression calculée incrémentalement à chaque clôture de séance

FR-M1 → Epic 13 — Coach ajoute photo/vidéo courte à une séance *(Phase 2)*
FR-M2 → Epic 13 — Média soumis = statut "en attente de validation admin" *(Phase 2)*
FR-M3 → Epic 13 — Admin approuve/rejette chaque média avant diffusion *(Phase 2)*
FR-M4 → Epic 13 — Parent visionne médias approuvés en streaming uniquement *(Phase 2)*
FR-M5 → Epic 13 — Journalisation de chaque accès à un média *(Phase 2)*
FR-M6 → Epic 13 — Suppression automatique média sur retrait consentement *(Phase 2)*

ARCH-1 → Epic 1 — Starter monorepo Expo Router + Tamagui
ARCH-2 → Epic 1 — Structure 6 packages @aureak/*
ARCH-3 → Epic 1 — 2 apps (mobile + web)
ARCH-4 → Epic 1 — Supabase init (migrations + Edge Functions)
ARCH-5 → Epic 5 — expo-sqlite + sync queue idempotente
ARCH-6 → Epic 1 — Zustand + TanStack Query setup
ARCH-7 → Epic 1 — React Hook Form + Zod setup
ARCH-8 → Epic 6 — Supabase Realtime (double validation)
ARCH-9 → Epic 7 — Table push_tokens + push notifications setup
ARCH-10 → Epic 1 — ESLint import restrictions enforcement
ARCH-11 → Epic 5 — Conflict policy par entité
ARCH-12 → Epic 1 — Enums PostgreSQL + TypeScript
ARCH-13 → Epic 1 — Convention soft-delete global
ARCH-14 → Epic 1 — Stratégie de tests (Vitest + RNTL + Maestro + Playwright)
ARCH-15 → Epic 2 — Auth rapide géolocalisée (PIN + GPS périmètre)
ARCH-16 → Epic 7 — Resend (email) + Twilio (SMS) via Edge Functions
ARCH-17 → Epic 1 — EAS Build + GitHub Actions CI/CD

UX-1 → Epic 6 — 5 indicateurs évaluation (Réceptivité, Effort, Attitude, Progression, Top séance)
UX-2 → Epic 6 — Aucun état rouge dans le système
UX-3 → Epic 6 — Évaluation complète par enfant < 10s, une main
UX-4 → Epic 6 — Navigation swipe gauche/droite entre cartes enfants
UX-5 → Epic 6 — Double validation coach (chacun sur son téléphone)
UX-6 → Epic 4 — Liste enfants toujours pré-remplie
UX-7 → Epic 7 — Notification parent automatique < 5 min après validation
UX-8 → Epic 6 — Retour haptique/visuel immédiat à chaque tap
UX-9 → Epic 1 — Design system Dark Manga Premium (tokens.ts)
UX-10 → Epic 8 — Quiz enfant : max 5 questions QCM, grandes cibles tactiles

---

## Epic List

### PHASE 1 — MVP (11 épics)

---

#### Epic 1 : Fondation — Monorepo, Infrastructure & CI/CD
Un développeur peut initialiser le projet complet (monorepo Turborepo, packages @aureak/*, Supabase, design tokens), configurer le pipeline CI/CD, et livrer les deux apps (mobile + web) en environnement de développement.
**FRs couverts :** ARCH-1 à ARCH-4, ARCH-6 à ARCH-7, ARCH-10, ARCH-12 à ARCH-14, ARCH-17, UX-9
**Dépendances :** Aucune (point de départ absolu)

---

#### Epic 2 : Authentification & Gestion des Rôles
Un utilisateur peut s'inscrire, se connecter (auth normale ou auth rapide géolocalisée), et accéder à son espace selon son rôle (Admin, Coach, Parent, Enfant) avec isolation stricte des données par tenant.
**FRs couverts :** FR1–FR5, FR8–FR9, FR60–FR62, ARCH-15
**Dépendances :** Epic 1

---

#### Epic 3 : Référentiel Pédagogique
Un Admin peut construire et maintenir le curriculum complet d'AUREAK : thèmes techniques, sous-critères, questions de quiz, versioning non-destructif — le contenu pédagogique est le moteur de toutes les séances.
**FRs couverts :** FR66–FR71, FR78, FR81, FR92–FR94, FR106–FR108
**Dépendances :** Epic 1, Epic 2

---

#### Epic 4 : Gestion des Séances & Planning
Un Admin peut planifier et gérer toutes les séances (création, récurrence, modification, annulation avec notifications). Un Coach consulte son planning et la fiche complète de sa séance du jour avec la liste d'enfants pré-remplie.
**FRs couverts :** FR-S1–FR-S10, FR10–FR11, FR12–FR13, UX-6
**Dépendances :** Epic 2, Epic 3

---

#### Epic 5 : Présences Terrain (Offline-First)
Un Coach peut enregistrer les présences de son groupe sur le terrain sans aucune connexion réseau. Les données se synchronisent automatiquement dès le retour du réseau, avec alerte visible en cas d'échec et rappel J+1.
**FRs couverts :** FR15–FR19, FR57–FR59, FR95–FR96, ARCH-5, ARCH-11
**Dépendances :** Epic 4

---

#### Epic 6 : Évaluation Coach & Clôture de Séance
Un Coach peut évaluer chaque enfant en moins de 10 secondes (5 indicateurs + commentaire), valider la séance à deux coaches via synchronisation en temps réel, et déclencher automatiquement la notification aux parents.
**FRs couverts :** FR14, FR20–FR21, FR-S6, ARCH-8, UX-1–UX-5, UX-8, NFR-PERF-6
**Dépendances :** Epic 5

---

#### Epic 7 : Notifications & Board Parent
Un Parent reçoit une notification post-séance soignée dans les 5 minutes, consulte la fiche complète de son enfant (présences, évaluations), et peut soumettre une demande au staff via un ticket structuré.
**FRs couverts :** FR29–FR35, FR31–FR32, ARCH-9, ARCH-16, UX-7
**Dépendances :** Epic 6

---

#### Epic 8 : Quiz, Boucle d'Apprentissage & Progression Joueur
Un Enfant complète le quiz post-séance lié aux thèmes travaillés et reçoit une correction immédiate. Un Parent visualise l'évolution technique de son enfant dans le temps (courbes, stats présence, historique évaluations). Un Coach consulte la progression agrégée de son groupe.
**FRs couverts :** FR22–FR24, FR35, FR71–FR72, FR76, FR-P1–FR-P8, FR-S7, UX-10
**Dépendances :** Epic 7

---

#### Epic 9 : Supervision Admin & Qualité Multi-Sites
Un Admin supervise en temps réel la qualité pédagogique sur toutes ses implantations : dashboard agrégé, identification des coaches inactifs, comparaison inter-sites, détection automatique d'anomalies.
**FRs couverts :** FR41–FR44, FR63–FR65, FR-S8, FR-P7
**Dépendances :** Epic 6

---

#### Epic 10 : Gestion Utilisateurs, Consentements & Conformité RGPD
Un Admin gère le cycle de vie complet des utilisateurs. Un Parent peut gérer ses consentements et exercer ses droits RGPD (accès, rectification, effacement, portabilité). Toutes les opérations sensibles sont tracées dans un audit log immuable ≥ 5 ans.
**FRs couverts :** FR6–FR7, FR46–FR49, FR97–FR100, NFR-RGPD-1–6
**Dépendances :** Epic 2

---

#### Epic 11 : Grades Coach & Partenariats Clubs
Un Admin peut attribuer des grades aux coaches (permissions évolutives automatiques) et définir les niveaux de partenariat des clubs (accès lecture contrôlé et journalisé).
**FRs couverts :** FR82–FR91
**Dépendances :** Epic 2

---

### PHASE 2 — GROWTH (6 épics)

---

#### Epic 12 : Player Universe & Gamification Layer *(nouveau)*
Un Enfant vit dans un univers de progression visuel : avatar personnalisable avec items débloquables par l'apprentissage, niveaux XP, carte de maîtrise par thème, quêtes hebdomadaires et skill cards collectionables liées aux thèmes pédagogiques. Aucun pay-to-win — toute récompense reflète la progression réelle.
**FRs couverts :** FR39–FR40, FR77, FR-P5 (complet) — supersède l'ancien Epic 14
**Dépendances :** Epic 8

---

#### Epic 13 : Médias — Partage Photo/Vidéo de Séance *(ex-Epic 12)*
Un Coach peut partager une photo ou courte vidéo de séance, soumise à validation admin avant toute diffusion. Un Parent visionne les médias approuvés en streaming uniquement, sans téléchargement possible.
**FRs couverts :** FR-M1–FR-M6, NFR-SEC-6/7

---

#### Epic 14 : Module Vidéo Avancé (Auto-évaluation & Retour Coach) *(ex-Epic 13)*
Un Enfant peut soumettre une vidéo d'auto-évaluation, un Coach y dépose un retour textuel, et l'Admin valide chaque vidéo avant diffusion. Durée/poids limités, tagging par thème, gabarits d'évaluation.
**FRs couverts :** FR25–FR28, FR36, FR73–FR75, FR101–FR105, FR109, NFR-V1–V5

---

#### Epic 15 : Module Médical
Un Coach peut déclarer une blessure avec restrictions de reprise (bloquant la présence active). Un Parent consulte l'historique médical de son enfant.
**FRs couverts :** FR53–FR56

---

#### Epic 16 : Module Business — Stages & Paiement Stripe
Un Parent peut s'inscrire et payer un stage directement depuis la plateforme, avec génération automatique des documents (confirmation, reçu, justificatif mutuelle).
**FRs couverts :** FR50–FR52

---

#### Epic 17 : Export & Reporting
Un Parent peut exporter le rapport PDF de son enfant et les séances en `.ics`. Un Admin peut exporter un rapport mensuel PDF par implantation.
**FRs couverts :** FR37–FR38, FR45

---

## Epic 1 : Fondation — Monorepo, Infrastructure & CI/CD

Un développeur peut initialiser le projet complet (monorepo Turborepo, packages @aureak/*, Supabase local + remote, design tokens), configurer le pipeline CI/CD, et livrer les deux apps (mobile + web) en environnement de développement reproductible.

### Story 1.1 : Initialisation du Monorepo & Structure des Packages

En tant que développeur,
Je veux initialiser le monorepo Turborepo avec Expo Router + Tamagui et créer les 6 packages @aureak/* et les 2 apps (mobile, web),
Afin que toute l'équipe développe dans une architecture cohérente avec un environnement reproductible entre machines.

**Acceptance Criteria:**

**Given** un environnement de développement configuré
**When** le développeur clone le repo et suit le README d'installation
**Then** un fichier `.nvmrc` à la racine fixe la version Node `22 LTS` et Yarn est activé via `corepack enable` — aucune instruction manuelle de version n'est requise

**And** la structure suivante existe et compile sans erreur :
```
aureak/
├── apps/mobile/        (Expo, iOS + Android, offline-first)
├── apps/web/           (Expo Router web — web-ready, PWA option Phase 2/3)
└── packages/
    ├── types/          @aureak/types
    ├── theme/          @aureak/theme
    ├── ui/             @aureak/ui
    ├── api-client/     @aureak/api-client
    ├── media-client/   @aureak/media-client  (scaffold Phase 1 uniquement)
    └── business-logic/ @aureak/business-logic
```

**And** `packages/media-client/index.ts` exporte un stub vide documenté `// Phase 2 — video pipeline` sans aucune logique d'implémentation
**And** `apps/mobile` et `apps/web` n'importent pas `@aureak/media-client` en Phase 1 — restriction documentée dans `CONVENTIONS.md` et détectée par lint si possible
**And** `turbo build` s'exécute sans erreur sur tous les packages
**And** `apps/mobile` se lance en mode développement sur iOS et Android
**And** `apps/web` se lance sur `localhost` en mode Expo Router web
**And** la règle ESLint `no-restricted-imports` bloque tout import direct de `@supabase/supabase-js` en dehors de `@aureak/api-client` et `@aureak/media-client`

---

### Story 1.2 : Configuration Supabase & Modèle de Données Base

En tant que développeur,
Je veux configurer le projet Supabase (remote + local dev) avec le modèle multi-tenant de base, RLS activé, enums PostgreSQL typés correctement et convention soft-delete,
Afin que toutes les migrations futures s'appuient sur des fondations cohérentes et que chaque développeur puisse travailler entièrement en local.

**Acceptance Criteria:**

**Given** Supabase CLI installé et Docker disponible en local
**When** le développeur exécute `supabase db reset`
**Then** les migrations s'appliquent dans l'ordre sans erreur et `supabase db diff` ne retourne aucun diff (working tree clean)

**And** les enums PostgreSQL suivants existent avec les valeurs exactes :
- `user_role ('admin','coach','parent','child')`
- `club_access_level ('partner','common')`
- `attendance_status ('present','absent','injured','late','trial')`
- `evaluation_signal ('positive','attention','none')`

**And** la table `tenants` (id UUID PK, name TEXT, created_at TIMESTAMPTZ) est créée avec RLS activé
**And** la table `processed_operations` (operation_id UUID PK, processed_at TIMESTAMPTZ, tenant_id UUID) existe pour l'idempotency de sync
**And** la table `audit_logs` est créée en Story 1.2 (couche Foundation) avec le schéma complet (immuable — append-only enforced par RLS) :
```sql
-- Créée en Story 1.2 — utilisée par Epic 9 (supervision), Epic 10 (RGPD),
-- Epic 2 (auth), Epic 4 (séances), Epic 7 (tickets), Epic 11 (grades/partenariats).
-- Aucune dépendance vers Epic 9 ou Epic 10 pour la définition de cette table.
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL si système / cron
  entity_type TEXT NOT NULL,  -- 'user', 'session', 'consent', 'coach', 'anomaly', etc.
  entity_id   UUID,
  action      TEXT NOT NULL,  -- 'user_suspended', 'consent_revoked', 'gdpr_export', etc.
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- RLS minimal (étendu en Story 10.4 avec policies complètes, indexes et purge)
CREATE POLICY "tenant_isolation" ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "insert_only_base" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
```
**And** la convention soft-delete (`deleted_at TIMESTAMPTZ NULL`) est documentée dans `supabase/CONVENTIONS.md`
**And** `apps/mobile` et `apps/web` lisent `SUPABASE_URL` et `SUPABASE_ANON_KEY` via un loader d'env centralisé dans `@aureak/api-client` — aucun accès direct aux variables d'env dans les apps
**And** un fichier `.env.example` à la racine documente toutes les variables requises avec leurs valeurs locales par défaut

---

### Story 1.3 : Système de Design — Tokens & Composants de Base

En tant que développeur,
Je veux configurer le design system Dark Manga Premium dans `packages/theme/tokens.ts` et créer les composants de base dans `packages/ui`,
Afin que tous les développements UI s'appuient sur des tokens visuels cohérents sans valeurs hardcodées.

**Acceptance Criteria:**

**Given** les packages `@aureak/theme` et `@aureak/ui` initialisés
**When** un développeur importe un token ou un composant
**Then** `packages/theme/tokens.ts` exporte les tokens de couleur (noir `#0A0A0A`, or `#C9A84C`, beige `#F5ECD7`), typographie, espacements et rayons de bordure
**And** `packages/ui` expose au minimum : `Button`, `Text`, `Card`, `Input`, `Badge`, `IndicatorToggle` (cycle vide→vert→jaune), `StarToggle` (cycle vide→étoile), `HierarchyBreadcrumb`
**And** `HierarchyBreadcrumb` affiche la navigation dans une hiérarchie à profondeur variable (ex: ThemeGroup → Thème → Séquence → Critère) avec un chevron séparateur ; utilisable aussi pour la hiérarchie situationnelle (SituationGroup → Situation)
**And** aucune valeur de couleur, font-size ou spacing n'est hardcodée dans `apps/` — uniquement via tokens
**And** `IndicatorToggle` respecte le cycle 2 états max (vide / positif / attention) sans état rouge, zones tactiles ≥ 44×44pt
**And** `apps/mobile` et `apps/web` affichent une page de démonstration avec les composants de base rendus correctement

---

### Story 1.4 : Pipeline CI/CD, Tests & Standards de Code

En tant que développeur,
Je veux configurer GitHub Actions + Expo EAS Build et initialiser la stack de tests (Vitest + RNTL + Playwright),
Afin que chaque push déclenche la validation automatique du code et que les builds soient reproductibles.

**Acceptance Criteria:**

**Given** un repository GitHub configuré avec les secrets EAS et Supabase
**When** un PR est ouvert vers `main`
**Then** le workflow GitHub Actions exécute : lint (ESLint + Prettier) + type-check (TypeScript) + tests unitaires (Vitest) sans erreur
**And** Vitest est configuré dans `packages/` avec au moins un test de smoke sur `@aureak/types`
**And** RNTL est installé et un test de smoke sur un composant `@aureak/ui` passe
**And** Playwright est configuré pour `apps/web` avec un test de smoke sur la page d'accueil
**And** `eas build --platform all --profile development` s'exécute sans erreur sur EAS
**And** les variables d'environnement Supabase sont injectées via EAS secrets (remote) et `.env.local` (local web)

---

## Epic 2 : Authentification & Gestion des Rôles

Un utilisateur peut se connecter (auth normale ou auth rapide géolocalisée), accéder à son espace selon son rôle, et voir ses données isolées par tenant.

### Story 2.1 : Inscription & Auth Standard (Email/Mot de Passe)

En tant qu'Admin,
Je veux créer des comptes utilisateurs et qu'ils puissent se connecter par email/mot de passe,
Afin que chaque utilisateur accède à son espace personnel avec ses données isolées par tenant.

**Acceptance Criteria:**

**Given** un Admin connecté sur l'interface web
**When** il crée un compte avec email, `user_role` et `tenant_id`
**Then** une ligne est insérée dans `profiles (user_id UUID FK auth.users, tenant_id UUID NOT NULL, user_role user_role NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ)` avec `status = 'pending'`
**And** l'utilisateur reçoit un email d'invitation ; à l'activation du lien, `profiles.status` passe à `'active'`
**And** le JWT retourné contient dans `app_metadata` : `{ role, tenant_id }` via Custom Access Token Hook
**And** le token d'accès expire après 24h, le refresh token après 30 jours
**And** une requête sans JWT valide retourne `401 Unauthorized` ; une requête avec JWT valide mais rôle/tenant insuffisant retourne `403 Forbidden`
**And** un Admin désactive un compte → `profiles.status = 'disabled'` ET toutes les sessions actives + refresh tokens sont révoqués via Supabase Auth Admin API
**And** les policies RLS incluent une vérification `AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND status = 'active')` — un utilisateur désactivé ne peut accéder à aucune ressource protégée
**And** à la prochaine tentative d'accès avec un token encore valide, le client est forcé à la déconnexion (token invalidé côté Supabase + `signOut()` déclenché côté app)

---

### Story 2.2 : Contrôle d'Accès par Rôle (RBAC — Règle Universelle RLS)

En tant que système,
Je veux que toutes les tables tenant-aware appliquent RLS avec `tenant_id` filtré via des fonctions SQL centralisées et sécurisées,
Afin qu'aucune donnée ne soit jamais accessible hors du tenant autorisé et que les policies soient maintenables en un seul endroit.

**Acceptance Criteria:**

**Given** toute table tenant-aware (sessions, attendances, evaluations, profiles, etc.)
**When** la migration est appliquée
**Then** les fonctions SQL suivantes sont créées, avec `search_path` fixé et droits restreints :
```sql
CREATE OR REPLACE FUNCTION current_tenant_id()
  RETURNS UUID
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$;
REVOKE ALL ON FUNCTION current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO authenticated;

CREATE OR REPLACE FUNCTION current_user_role()
  RETURNS user_role
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::user_role;
$$;
REVOKE ALL ON FUNCTION current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;
```
**And** `current_user_role()` retourne le type enum `user_role` — un cast invalide lève une erreur PostgreSQL explicite plutôt qu'une dérive silencieuse
**And** chaque table tenant-aware possède `tenant_id UUID NOT NULL` avec un index `(tenant_id)` explicite
**And** RLS est activé sur chaque table tenant-aware et toutes les policies filtrent avec `tenant_id = current_tenant_id()` — jamais le chemin JSON brut directement
**And** jamais de contrôle uniquement côté client — toute permission est vérifiée au niveau DB
**And** un `coach` accède uniquement aux séances de ses implantations assignées
**And** un `parent` accède uniquement aux données liées à ses enfants via `parent_child_links`
**And** un `child` accède uniquement à son propre profil
**And** un test d'intégration vérifie qu'une requête avec `tenant_id` d'un autre tenant retourne `0 rows`

---

### Story 2.3 : Accès Temporaire Cross-Implantation Coach

En tant qu'Admin,
Je veux accorder un accès temporaire à un Coach sur une implantation tierce via une table dédiée,
Afin de gérer les remplacements avec traçabilité complète et révocation automatique à expiration.

**Acceptance Criteria:**

**Given** un Admin connecté et un Coach assigné à l'implantation A
**When** l'Admin crée un enregistrement dans `coach_access_grants (id UUID PK, coach_id UUID NOT NULL, implantation_id UUID NOT NULL, granted_by UUID NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ)`
**Then** les policies RLS des tables `sessions` et `attendances` vérifient l'existence d'un grant actif :
```sql
EXISTS (
  SELECT 1 FROM coach_access_grants
  WHERE coach_id = auth.uid()
  AND implantation_id = sessions.implantation_id
  AND expires_at > now()
)
```
**And** le Coach voit et opère sur les séances de l'implantation B uniquement pendant la fenêtre du grant
**And** à expiration, l'accès disparaît automatiquement — aucune action manuelle requise
**And** chaque grant créé est journalisé dans `audit_logs` (coach, implantation, grantor, expires_at)
**And** l'Admin peut lister les grants actifs et en révoquer un manuellement
**And** `supabase db diff` reste clean après ajout de cette table et de ses policies

---

### Story 2.4 : Auth Rapide Géolocalisée (PIN + GPS)

En tant que Coach,
Je veux me connecter avec un PIN 4 chiffres sur un appareil déjà enregistré si mon téléphone est indisponible,
Afin de ne jamais être bloqué sur le terrain — avec session temporaire limitée aux opérations terrain uniquement.

**Acceptance Criteria:**

**Given** un "device enregistré" = appareil sur lequel une session Coach normale a déjà été ouverte au moins une fois (device_id stocké localement + enregistré en base)
**When** un Coach saisit son PIN 4 chiffres sur cet appareil
**Then** `expo-location` vérifie la position GPS contre le périmètre de l'implantation (rayon configurable, défaut 300m, coordonnées mises en cache local)
**And** si dans le périmètre : une session rapide est créée avec scope restreint aux routes terrain (`/sessions/:id/attendance`, `/sessions/:id/evaluation`) et expire automatiquement après 2h
**And** si hors périmètre : auth refusée avec message explicite "Vous devez être sur le site pour utiliser l'auth rapide" — aucun contournement possible
**And** si GPS indisponible (permission refusée par l'OS ou signal absent) : auth refusée avec message "Localisation requise pour l'auth rapide" — aucun fallback sans GPS
**And** si l'appareil n'est pas enregistré : auth rapide indisponible
**And** chaque auth rapide journalisée dans `audit_logs` : coach_id, implantation_id, device_id, timestamp, résultat

---

### Story 2.5 : Gestion des Accès Clubs (Partenaire & Commun)

En tant qu'Admin,
Je veux que les clubs soient des utilisateurs auth à part entière liés à une table `clubs`, avec accès aux données de leurs enfants filtrés par RLS,
Afin que le modèle de données soit cohérent et que `auth.uid()` suffise pour identifier un club dans toutes les policies.

**Acceptance Criteria:**

**Given** les tables suivantes créées en migration :
```sql
CREATE TABLE clubs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  club_access_level club_access_level NOT NULL DEFAULT 'common',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE club_child_links (
  club_id UUID NOT NULL REFERENCES clubs(user_id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, child_id)
);
```
**When** un Admin crée un compte club (email + `user_role = 'club'` dans `profiles`) et l'associe à des enfants via `club_child_links`
**Then** les policies RLS filtrent via `auth.uid()` :
```sql
EXISTS (
  SELECT 1 FROM club_child_links
  WHERE club_id = auth.uid()
  AND child_id = attendances.child_id
)
```
**And** un club `partner` peut lire : présences, blessures, rapports mi-saison et fin de saison des enfants liés
**And** un club `common` peut lire uniquement : présences, blessures, rapports périodiques
**And** aucun club ne peut lire `evaluations`, `quiz_results`, `evaluation_comments`
**And** `clubs.club_access_level` est lu directement par les policies — tout changement est effectif immédiatement
**And** toute lecture par un club est journalisée dans `audit_logs`
**And** `supabase db diff` reste clean après application des migrations

---

### Story 2.6 : Permissions Référentiel Pédagogique (RBAC Contenu)

En tant que système,
Je veux que les tables du référentiel pédagogique appliquent des politiques RLS différenciées par rôle,
Afin qu'un Admin puisse créer et modifier le contenu, qu'un Coach puisse le consulter en lecture seule, et que les parents/enfants/clubs n'aient aucun accès direct au référentiel.

**Acceptance Criteria:**

**Given** les tables du référentiel pédagogique créées en Epic 3 : `theme_groups`, `themes`, `theme_sequences`, `criteria`, `faults`, `cues`, `situation_groups`, `situations`, `situation_criteria`, `situation_theme_links`, `taxonomies`, `taxonomy_nodes`, `unit_classifications`, `quiz_questions`, `quiz_options`
**When** les policies RLS sont appliquées via migration
**Then** un utilisateur avec `current_user_role() = 'admin'` peut exécuter INSERT, UPDATE, DELETE et SELECT sur toutes ces tables (filtré par `tenant_id = current_tenant_id()`)
**And** un utilisateur avec `current_user_role() = 'coach'` peut exécuter uniquement SELECT sur toutes ces tables (filtré par `tenant_id = current_tenant_id()`) — aucune modification possible
**And** un utilisateur avec `current_user_role() IN ('parent','child')` ne peut accéder à aucune ligne de ces tables — les policies RLS retournent `0 rows`
**And** les comptes club (`profiles.user_role = 'club'`) n'ont aucun accès aux tables du référentiel pédagogique
**And** un test d'intégration vérifie : coach peut SELECT, ne peut pas INSERT ; admin peut tout ; parent retourne 0 rows

---

## Epic 3 : Référentiel Pédagogique

Un Admin peut construire et maintenir le curriculum complet d'AUREAK : hiérarchie ThemeGroup → Thème → Séquence → Critère → Fault → Cue, arborescence situationnelle parallèle, taxonomies génériques pour la classification, questions de quiz avec workflow draft/published, et ciblage d'audience. Le contenu pédagogique est le moteur de toutes les séances.

### Story 3.1 : Hiérarchie Thème — ThemeGroup, Thème & Séquences

En tant qu'Admin,
Je veux créer et organiser les thèmes techniques en groupes et séquences pédagogiques,
Afin que le référentiel soit structuré, versionnable et directement utilisable pour composer les séances.

**Acceptance Criteria:**

**Given** les migrations Epic 1 et Epic 2 appliquées
**When** la migration Story 3.1 est exécutée
**Then** les tables suivantes sont créées :
```sql
CREATE TABLE theme_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_id UUID REFERENCES theme_groups(id),
  theme_key TEXT NOT NULL,          -- slug stable ex: 'sortie-au-sol'
  name TEXT NOT NULL,
  description TEXT,
  level TEXT CHECK (level IN ('debutant','intermediaire','avance')),
  age_group TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  target_audience JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, theme_key, version)
);
CREATE UNIQUE INDEX one_current_theme_version ON themes (tenant_id, theme_key) WHERE is_current = true;

CREATE TABLE theme_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES themes(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**And** RLS est activé sur `theme_groups`, `themes`, `theme_sequences` — les policies appliquent `tenant_id = current_tenant_id()` (RBAC complet couvert par Story 2.6)
**And** un Admin peut créer un `theme_group`, y attacher un `theme` (avec `theme_key` slug stable unique par tenant), et y créer plusieurs `theme_sequences` ordonnées par `sort_order`
**And** `theme_key` est un slug invariant (ex: `'sortie-au-sol'`) — le `name` peut changer entre versions mais pas le `theme_key`
**And** un Admin peut créer une nouvelle version d'un thème : passer `is_current = false` sur la version actuelle et insérer avec `version + 1` et `is_current = true` — l'index partiel `one_current_theme_version` garantit l'unicité
**And** `supabase db diff` reste clean après migration

---

### Story 3.2 : Critères, Faults & Cues

En tant qu'Admin,
Je veux créer les critères de réussite, les fautes associées et les cues de correction coaching pour chaque séquence,
Afin que chaque séquence d'un thème soit outillée d'un référentiel pédagogique détaillé utilisable sur le terrain.

**Acceptance Criteria:**

**Given** les tables de Story 3.1 existent
**When** la migration Story 3.2 est exécutée
**Then** les tables suivantes sont créées :
```sql
CREATE TABLE criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES theme_sequences(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES criteria(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id UUID NOT NULL REFERENCES faults(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**And** un trigger d'intégrité vérifie la cohérence `tenant_id` à chaque niveau de la chaîne :
```sql
CREATE OR REPLACE FUNCTION enforce_criteria_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM theme_sequences WHERE id = NEW.sequence_id) != NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_sequences.tenant_id (sequence_id=%)', NEW.sequence_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_criteria_tenant BEFORE INSERT OR UPDATE ON criteria
  FOR EACH ROW EXECUTE FUNCTION enforce_criteria_tenant();
```
**And** des triggers équivalents sont créés pour `faults` (vérifie `faults.tenant_id = criteria.tenant_id`) et `cues` (vérifie `cues.tenant_id = faults.tenant_id`)
**And** RLS est activé sur `criteria`, `faults`, `cues` avec policy `tenant_id = current_tenant_id()` (RBAC couvert par Story 2.6)
**And** `supabase db diff` reste clean après migration

---

### Story 3.3 : Arborescence Situationnelle (SituationGroup → Situation)

En tant qu'Admin,
Je veux créer et organiser les situations de match en groupes, avec leurs critères d'analyse et leurs liens optionnels vers les thèmes techniques,
Afin que les coachs disposent d'un référentiel situationnel parallèle au référentiel technique pour contextualiser les séances.

**Acceptance Criteria:**

**Given** les tables de Story 3.1 existent
**When** la migration Story 3.3 est exécutée
**Then** les tables suivantes sont créées :
```sql
CREATE TABLE situation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_id UUID REFERENCES situation_groups(id),
  situation_key TEXT NOT NULL,      -- slug stable ex: 'corner-defensif'
  name TEXT NOT NULL,
  description TEXT,
  variables JSONB,                  -- paramètres (nb joueurs, disposition…)
  target_audience JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, situation_key, version)
);
CREATE UNIQUE INDEX one_current_situation_version ON situations (tenant_id, situation_key) WHERE is_current = true;

CREATE TABLE situation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id UUID NOT NULL REFERENCES situations(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  label TEXT NOT NULL,
  sort_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE situation_theme_links (
  situation_id UUID NOT NULL REFERENCES situations(id),
  theme_id UUID NOT NULL REFERENCES themes(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (situation_id, theme_id)
);
```
**And** RLS est activé sur toutes ces tables avec policy `tenant_id = current_tenant_id()` (RBAC couvert par Story 2.6)
**And** les situations sont versionnées avec le même mécanisme que les thèmes : `situation_key` stable + `version` INTEGER + `is_current` BOOLEAN + index unique partiel `one_current_situation_version`
**And** `situation_theme_links` permet à une situation de référencer zéro, un ou plusieurs thèmes — sans contrainte obligatoire ; un thème peut être lié à plusieurs situations
**And** un Admin peut créer une nouvelle version d'une situation en passant `is_current = false` sur l'ancienne et créant avec `version + 1`
**And** `supabase db diff` reste clean après migration

---

### Story 3.4 : Système de Taxonomies Génériques

En tant qu'Admin,
Je veux classifier les thèmes et situations selon des axes pédagogiques configurables (méthode GK, situationnel, Golden Player…),
Afin que le contenu puisse être filtré et organisé selon plusieurs taxonomies en parallèle, sans duplication de contenu.

**Acceptance Criteria:**

**Given** les tables de Stories 3.1 et 3.3 existent
**When** la migration Story 3.4 est exécutée
**Then** les tables suivantes sont créées :
```sql
CREATE TABLE taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE taxonomy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_id UUID NOT NULL REFERENCES taxonomies(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID REFERENCES taxonomy_nodes(id),   -- auto-référentiel pour arbre
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER,
  UNIQUE (taxonomy_id, slug)
);

CREATE TABLE unit_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_node_id UUID NOT NULL REFERENCES taxonomy_nodes(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_type TEXT NOT NULL CHECK (unit_type IN ('theme','situation')),
  unit_id UUID NOT NULL,
  UNIQUE (taxonomy_node_id, unit_type, unit_id)
);
```
**And** RLS est activé sur `taxonomies`, `taxonomy_nodes`, `unit_classifications` avec policy `tenant_id = current_tenant_id()` (RBAC couvert par Story 2.6)
**And** une migration de seed insère 3 taxonomies de base pour chaque nouveau tenant :
- `{ name: 'Méthode GK', slug: 'gk-methode' }`
- `{ name: 'Situationnel', slug: 'situationnel' }`
- `{ name: 'Golden Player', slug: 'golden-player' }`
**And** `unit_type IN ('theme','situation')` — "situation" est une entité distincte, pas un type de thème ; les deux sont classifiables dans le même système de taxonomies
**And** un thème ou une situation peut être assigné à zéro, un ou plusieurs nœuds de taxonomie via `unit_classifications` — sans contrainte obligatoire
**And** `supabase db diff` reste clean après migration

---

### Story 3.5 : Questions de Quiz (Workflow Draft/Published)

En tant qu'Admin,
Je veux créer des questions de quiz associées à un thème, avec un workflow draft → published sécurisé par trigger,
Afin que seules les questions valides (3-4 options, exactement 1 bonne réponse) soient exposées aux enfants lors des séances.

**Acceptance Criteria:**

**Given** les tables de Story 3.1 existent (`themes`)
**When** la migration Story 3.5 est exécutée
**Then** les tables suivantes sont créées :
```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES themes(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  question_text TEXT NOT NULL,
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER
);
CREATE UNIQUE INDEX one_correct_per_question ON quiz_options (question_id) WHERE is_correct = true;
```
**And** un trigger de publication valide la question avant le passage `draft → published` :
```sql
CREATE OR REPLACE FUNCTION validate_quiz_question_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  opt_count INTEGER;
  correct_count INTEGER;
BEGIN
  IF NEW.status = 'published' AND OLD.status = 'draft' THEN
    SELECT COUNT(*) INTO opt_count FROM quiz_options WHERE question_id = NEW.id;
    SELECT COUNT(*) INTO correct_count FROM quiz_options WHERE question_id = NEW.id AND is_correct = true;
    IF opt_count NOT BETWEEN 3 AND 4 THEN
      RAISE EXCEPTION 'Quiz question % must have 3-4 options, has %', NEW.id, opt_count;
    END IF;
    IF correct_count != 1 THEN
      RAISE EXCEPTION 'Quiz question % must have exactly 1 correct answer, has %', NEW.id, correct_count;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_quiz_publish BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION validate_quiz_question_publish();
```
**And** RLS est activé sur `quiz_questions` et `quiz_options` — RBAC couvert par Story 2.6
**And** une question peut rester en `draft` sans limite de temps ; seul un Admin peut déclencher le passage à `published`
**And** `supabase db diff` reste clean après migration

---

### Story 3.6 : Ciblage d'Audience & Filtrage Dynamique

En tant qu'Admin,
Je veux associer chaque thème et situation à une audience cible structurée (rôles, tranches d'âge, programmes),
Afin que le contenu soit filtré dynamiquement selon le profil de l'utilisateur et le programme auquel il appartient.

**Acceptance Criteria:**

**Given** les tables `themes` (Story 3.1) et `situations` (Story 3.3) existent
**When** la migration Story 3.6 est exécutée
**Then** la contrainte CHECK suivante est ajoutée sur `themes.target_audience` :
```sql
ALTER TABLE themes ADD CONSTRAINT target_audience_structure CHECK (
  (target_audience = '{}'::jsonb) OR (
    target_audience ? 'roles'
    AND target_audience ? 'age_groups'
    AND jsonb_typeof(target_audience->'roles') = 'array'
    AND jsonb_typeof(target_audience->'age_groups') = 'array'
    AND (
      NOT (target_audience ? 'programs')
      OR jsonb_typeof(target_audience->'programs') = 'array'
    )
  )
);
```
**And** la même contrainte CHECK est ajoutée sur `situations.target_audience`
**And** `target_audience = '{}'` est valide et signifie "aucune restriction d'audience" (contenu universel)
**And** le champ `programs` supporte des valeurs comme `'golden_player'`, `'gardien_elite'` — liste extensible sans migration schema (ajout de valeurs JSONB)
**And** un thème avec `target_audience = '{"roles":["coach"],"age_groups":["U8","U11"]}'` est accepté
**And** un thème avec `target_audience = '{"roles":"coach"}'` est rejeté (roles doit être un array)
**And** la couche applicative (`@aureak/business-logic`) expose une fonction `filterByAudience(items, userProfile)` qui filtre thèmes et situations selon le `user_role`, `age_group` et `programs` du profil connecté
**And** `supabase db diff` reste clean après migration

---

## Epic 4 : Gestion des Séances & Planning

Un Admin peut planifier et gérer toutes les séances (création, récurrence avec exceptions, modification, annulation multicanal). Un Coach consulte son planning, accède à la fiche séance filtrée par audience, confirme sa présence terrain, et laisse des notes ou suggestions pédagogiques.
**FRs couverts :** FR-S1–FR-S10, FR10–FR11, FR12–FR13, UX-6
**Dépendances :** Epic 2, Epic 3

### Story 4.1 : Modèle de Données — Sessions, Blocs & Récurrence

En tant que développeur,
Je veux créer le modèle de données complet des séances avec blocs, récurrence, coaches et snapshot de versions de thèmes,
Afin que toutes les entités terrain soient modélisées sans ambiguïté et que l'historique des séances passées soit immuable.

**Acceptance Criteria:**

**Given** les migrations Epic 2 (profiles, tenants) et Epic 3 (themes, situations) appliquées
**When** la migration Story 4.1 est exécutée
**Then** les tables suivantes sont créées :
```sql
CREATE TABLE implantations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT,
  gps_lat NUMERIC,
  gps_lon NUMERIC,
  gps_radius INTEGER NOT NULL DEFAULT 300,   -- mètres (utilisé par auth rapide Epic 2.4)
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  name TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id),
  child_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, child_id)
);

-- Bloc de séances (ex: "Lundi soir" = 3 séances dans 4h sur même site)
CREATE TABLE session_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  date DATE NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Règle de récurrence (partagée entre toutes les occurrences d'une série)
CREATE TABLE recurrence_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rule JSONB NOT NULL,   -- {freq:'weekly', day:'wednesday', count:8, until:'2024-06-30'}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  group_id UUID NOT NULL REFERENCES groups(id),
  session_block_id UUID REFERENCES session_blocks(id),        -- nullable
  recurrence_id UUID REFERENCES recurrence_series(id),        -- nullable
  is_exception BOOLEAN NOT NULL DEFAULT false,                 -- true = occurrence modifiée individuellement
  original_session_id UUID REFERENCES sessions(id),           -- pointe vers l'occurrence remplacée si exception
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'planifiée'
    CHECK (status IN ('planifiée','en_cours','terminée','annulée')),
  attendance_started_at TIMESTAMPTZ,       -- set auto à la 1ère action présence
  attendance_completed_at TIMESTAMPTZ,     -- set manuellement par le coach
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coaches assignés à une séance (1 lead, N assistants)
CREATE TABLE session_coaches (
  session_id UUID NOT NULL REFERENCES sessions(id),
  coach_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'lead' CHECK (role IN ('lead','assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, coach_id)
);
CREATE UNIQUE INDEX one_lead_per_session ON session_coaches (session_id) WHERE role = 'lead';

-- Snapshot exact de la version du thème au moment de la création de séance
CREATE TABLE session_themes (
  session_id UUID NOT NULL REFERENCES sessions(id),
  theme_id UUID NOT NULL REFERENCES themes(id),   -- référence themes.id (version précise)
  tenant_id UUID NOT NULL,
  sort_order INTEGER,
  PRIMARY KEY (session_id, theme_id)
);

-- Situations associées à la séance (parallèle aux thèmes)
CREATE TABLE session_situations (
  session_id UUID NOT NULL REFERENCES sessions(id),
  situation_id UUID NOT NULL REFERENCES situations(id),
  tenant_id UUID NOT NULL,
  sort_order INTEGER,
  PRIMARY KEY (session_id, situation_id)
);
```
**And** `session_themes.theme_id` référence `themes.id` (version précise) — une séance passée ne change jamais si le thème évolue ultérieurement ; l'Admin choisit la version `is_current = true` au moment de la création
**And** `one_lead_per_session` interdit l'insertion d'un 2e `lead` sur la même séance — un trigger ou contrainte applicative gère le changement de lead (passe l'ancien en `assistant` puis insère le nouveau en `lead`)
**And** `is_exception = true` + `original_session_id` permettent de tracer qu'une occurrence est une exception à la série d'origine
**And** RLS activé sur toutes ces tables avec `tenant_id = current_tenant_id()`
**And** `supabase db diff` reste clean après migration

---

### Story 4.2 : Roster Attendu & Présences Terrain

En tant que développeur,
Je veux modéliser séparément le roster attendu (pré-rempli) et les présences réelles terrain, en autorisant les ajouts de dernière minute,
Afin que la liste attendue reste immuable après clôture et que les statistiques reflètent toujours la réalité terrain.

**Acceptance Criteria:**

**Given** les tables de Story 4.1 existent
**When** la migration Story 4.2 est exécutée
**Then** les tables suivantes sont créées :
```sql
-- Roster attendu : pré-rempli depuis group_members à la création de séance
CREATE TABLE session_attendees (
  session_id UUID NOT NULL REFERENCES sessions(id),
  child_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  PRIMARY KEY (session_id, child_id)
);

-- Présences réelles terrain (coach enregistre le jour J)
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  child_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  status attendance_status NOT NULL,          -- present|absent|late|injured|trial
  recorded_by UUID NOT NULL REFERENCES profiles(user_id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,                      -- null = local only, set lors de la sync
  UNIQUE (session_id, child_id)
);

-- Confirmation de présence coach (1 tap, n'importe quand pendant la séance)
CREATE TABLE coach_presence_confirmations (
  session_id UUID NOT NULL REFERENCES sessions(id),
  coach_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id TEXT,
  PRIMARY KEY (session_id, coach_id)
);

-- Check-in matériel au niveau du bloc (1 seule action couvre toutes les séances du bloc)
CREATE TABLE block_checkins (
  session_block_id UUID NOT NULL REFERENCES session_blocks(id),
  coach_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_block_id, coach_id)
);
```
**And** `session_attendees` est pré-rempli automatiquement depuis `group_members` lors de la création de la séance — cette liste représente le roster attendu et ne change plus ensuite
**And** un enfant absent de `session_attendees` peut malgré tout avoir une `attendance` enregistrée le jour J (statut `trial` ou présence d'un invité) — `attendances.child_id` n'est pas contraint à `session_attendees`
**And** un trigger `BEFORE INSERT ON attendances` met à jour `sessions.attendance_started_at = now()` (si NULL) et passe `sessions.status = 'en_cours'`
**And** la confirmation de présence coach est journalisée dans `audit_logs` (coach_id, session_id, confirmed_at)
**And** RLS activé sur toutes ces tables avec `tenant_id = current_tenant_id()`
**And** `supabase db diff` reste clean après migration

---

### Story 4.3 : Création & Gestion Admin des Séances

En tant qu'Admin,
Je veux créer, modifier et annuler des séances avec tous leurs attributs, en associant des unités pédagogiques en version snapshot,
Afin de piloter le planning de toutes les implantations depuis l'interface web.

**Acceptance Criteria:**

**Given** les tables de Stories 4.1 et 4.2 existent et un Admin est connecté
**When** l'Admin crée une séance
**Then** une ligne est insérée dans `sessions` avec `status = 'planifiée'`
**And** `session_attendees` est pré-rempli automatiquement depuis tous les `group_members` actifs du groupe sélectionné
**And** `session_themes` enregistre les `theme_id` sélectionnés (version `is_current = true` au moment de la création) — le snapshot est figé ; toute évolution ultérieure du thème n'affecte pas les séances existantes
**And** `session_coaches` est rempli avec au moins 1 coach `lead` ; l'Admin peut ajouter des coaches `assistant`
**And** un Admin peut modifier tous les champs d'une séance `planifiée` : date/heure, durée, lieu, groupe, coaches, thèmes/situations associés
**And** un Admin peut archiver une séance passée (`deleted_at`) — elle reste visible dans l'historique
**And** un Admin peut changer le lead coach (passe l'ancien en `assistant`, insère le nouveau en `lead`) — `one_lead_per_session` reste cohérent
**And** les tables `notification_preferences` et `notification_send_logs` sont créées :
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  channel TEXT NOT NULL CHECK (channel IN ('push','email','sms')),
  event_type TEXT NOT NULL,    -- 'session_cancelled', 'session_reminder', etc.
  reference_id UUID,           -- session_id
  status TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error_text TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**And** RLS activé sur ces tables avec `tenant_id = current_tenant_id()`
**And** `supabase db diff` reste clean après migration

---

### Story 4.4 : Planification Récurrente & Gestion des Exceptions

En tant qu'Admin,
Je veux créer une série de séances récurrentes et pouvoir modifier individuellement une occurrence, les suivantes, ou toute la série,
Afin de gérer les plannings hebdomadaires sans ressaisie tout en gardant la flexibilité pour les exceptions terrain.

**Acceptance Criteria:**

**Given** l'Admin crée une séance avec récurrence activée
**When** il soumet le formulaire
**Then** une `recurrence_series` est créée avec la règle JSONB (`freq`, `day`, `count` ou `until`)
**And** toutes les occurrences sont générées en base avec `recurrence_id` pointant vers la série et `is_exception = false`
**And** `session_attendees` est pré-rempli pour chaque occurrence générée depuis `group_members` au moment de la génération

**And** lorsqu'un Admin modifie une occurrence, il choisit le scope :
- **"Cette séance uniquement"** → `is_exception = true`, `original_session_id` = id de l'occurrence, une nouvelle ligne est créée avec les modifications ; l'occurrence originale est marquée `deleted_at`
- **"Cette séance et les suivantes"** → les occurrences avec `scheduled_at >= date_modif` et même `recurrence_id` sont recréées avec les nouvelles valeurs ; une nouvelle `recurrence_series` est créée pour la sous-série
- **"Toutes les séances de la série"** → toutes les occurrences `planifiée` de la série sont mises à jour ; les séances `terminée` ou `annulée` ne sont pas touchées

**And** supprimer une série passe toutes les occurrences `planifiée` à `status = 'annulée'` + notifications (Story 4.5)
**And** `supabase db diff` reste clean après migration

---

### Story 4.5 : Annulation & Notifications Multicanal

En tant qu'Admin,
Je veux annuler une séance avec envoi automatique de notifications à tous les participants selon leurs préférences de canal,
Afin qu'aucun parent ne soit pris par surprise et que chaque envoi soit tracé pour audit.

**Acceptance Criteria:**

**Given** une séance avec `status = 'planifiée'` ou `'en_cours'`
**When** l'Admin annule la séance (avec motif obligatoire)
**Then** `sessions.status = 'annulée'`, `sessions.cancelled_at = now()`, `sessions.cancellation_reason` stocké
**And** une Edge Function est déclenchée et itère sur tous les parents des enfants de `session_attendees`
**And** pour chaque parent, la Edge Function consulte `notification_preferences` et envoie uniquement via les canaux activés :
- `push_enabled = true` → Expo Push Notification (table `push_tokens`)
- `email_enabled = true` → Resend
- `sms_enabled = true` → Twilio
**And** chaque tentative d'envoi est loguée dans `notification_send_logs` (status = `sent` | `failed` | `skipped`)
**And** `skipped` est utilisé si le canal est désactivé dans les préférences — permettant d'auditer "pourquoi ce parent n'a pas reçu de SMS"
**And** la notification est envoyée en moins de 2 minutes après l'annulation pour les canaux push et email
**And** l'annulation est journalisée dans `audit_logs` (admin_id, session_id, raison, timestamp)
**And** FR-S10 est couvert : Admin peut annuler + notifications automatiques push/email/SMS

---

### Story 4.6 : Confirmation Présence Coach & Gestion du Bloc

En tant que Coach,
Je veux confirmer ma présence terrain d'un tap et effectuer le check-in matériel une seule fois pour tout un bloc de séances,
Afin que la présence coach soit prouvée sans créer de friction sur le terrain et que la clôture de séance soit sécurisée.

**Acceptance Criteria:**

**Given** un Coach assigné à une séance (`session_coaches`) connecté sur l'app mobile
**When** il tape "Confirmer ma présence" à n'importe quel moment pendant la séance
**Then** une ligne est insérée dans `coach_presence_confirmations (session_id, coach_id, confirmed_at, device_id)`
**And** l'action est journalisée dans `audit_logs`

**And** si la séance appartient à un `session_block`, le coach peut effectuer un "check-in matériel" au niveau du bloc :
- Une ligne est insérée dans `block_checkins (session_block_id, coach_id, checked_in_at)`
- Ce check-in est visible sur toutes les séances du bloc — pas besoin de le répéter

**And** règle de clôture MVP (vérifiée en Epic 6) : une séance peut être clôturée si `coach_presence_confirmations` contient au moins 1 confirmation du coach `lead`
**And** la configuration `tenant` peut exiger 2 confirmations (lead + 1 assistant) — paramètre JSONB dans `tenants.config` (ex: `{"require_presence_count": 2}`)
**And** un Admin peut changer le lead coach sur une séance `en_cours` (cas batterie morte/absence) : le `role = 'lead'` est transféré, l'ancien passe `assistant`, journalisé dans `audit_logs`
**And** (Phase 2) la confirmation de présence peut être conditionnée à l'auth rapide PIN+GPS (Epic 2.4) — non bloquante en MVP

---

### Story 4.7 : Vue Coach — Fiche Séance, Notes & Feedback Contenu

En tant que Coach,
Je veux accéder à la fiche complète de ma séance du jour avec les unités pédagogiques filtrées par audience, laisser une note personnelle et soumettre des suggestions d'amélioration sur le contenu,
Afin d'être pleinement outillé sur le terrain et de contribuer à l'amélioration continue du référentiel.

**Acceptance Criteria:**

**Given** un Coach connecté consultant la fiche d'une de ses séances assignées
**When** il ouvre la fiche séance
**Then** la liste des `session_themes` affiche les séquences, critères et cues associés au thème (version snapshotée en Story 4.1) — filtrés server-side par `target_audience` selon le `age_group` du groupe de la séance
**And** les `session_situations` sont également affichées avec leurs critères situationnels, filtrés par `target_audience`
**And** `filterByAudience` (Epic 3.6) est appliqué côté serveur — un coach ne voit jamais de contenu hors de son audience
**And** la liste des enfants attendus (`session_attendees`) est pré-remplie et affichée avec nom + photo

**And** les tables suivantes sont créées pour les notes et feedback :
```sql
CREATE TABLE coach_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  coach_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  note TEXT NOT NULL,
  visible_to_admin BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, coach_id)
);

CREATE TABLE coach_content_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('theme','situation','sequence')),
  unit_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','accepted','rejected','testing')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**And** un Coach peut créer ou mettre à jour sa note sur une séance (1 note par coach par séance — contrainte UNIQUE)
**And** un Coach peut soumettre un feedback sur un thème, une situation ou une séquence — la suggestion entre en `status = 'submitted'` et est visible de l'Admin pour traitement
**And** RLS : `coach_session_notes` visible par le coach auteur + admin du tenant ; `coach_content_feedback` visible par coach auteur + admin
**And** `supabase db diff` reste clean après migration

---

## Epic 5 : Présences Terrain (Offline-First)

Un Coach peut enregistrer les présences de son groupe sur le terrain sans aucune connexion réseau. Les données se synchronisent automatiquement via une queue idempotente. Les conflits sont résolus par règle MVP (lead coach device wins, sinon server wins) avec trace complète dans un `event_log` immuable. L'historique complet de chaque présence est consultable par l'Admin, avec possibilité de restaurer une valeur antérieure (événement ATTENDANCE_RESTORED).
**FRs couverts :** FR15–FR19, FR57–FR59, FR95–FR96, ARCH-5, ARCH-11
**Dépendances :** Epic 4

### Story 5.1 : Schéma Offline SQLite & Sync Queue Serveur

En tant que développeur,
Je veux créer le schéma SQLite local (miroir minimal des séances et présences) et la table `sync_queue` serveur avec suivi d'état complet,
Afin que le mode terrain fonctionne intégralement sans réseau et que toute opération soit récupérable après déconnexion.

**Acceptance Criteria:**

**Given** `expo-sqlite` installé dans `apps/mobile` et `@aureak/business-logic` initialisé
**When** l'app démarre pour la première fois sur un appareil
**Then** une base SQLite locale est créée avec les tables miroir minimales :
```sql
-- SQLite local (apps/mobile)
CREATE TABLE IF NOT EXISTS local_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planifiée',
  attendance_started_at TEXT,
  attendance_completed_at TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS local_session_attendees (
  session_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  PRIMARY KEY (session_id, child_id)
);

CREATE TABLE IF NOT EXISTS local_attendances (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  status TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  operation_id TEXT NOT NULL UNIQUE,
  synced INTEGER NOT NULL DEFAULT 0   -- 0=local, 1=synced
);

CREATE TABLE IF NOT EXISTS local_sync_queue (
  id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,          -- 'attendance', 'coach_presence'
  payload TEXT NOT NULL,              -- JSON
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL
);
```
**And** côté serveur, la table `sync_queue` est créée en migration :
```sql
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  device_id TEXT,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('attendance','evaluation','coach_presence')),
  entity_id UUID,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','syncing','failed','done')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operation_id)
);
CREATE INDEX sync_queue_pending_idx ON sync_queue (tenant_id, status)
  WHERE status IN ('pending','failed');
```
**And** RLS activé sur `sync_queue` — un coach ne voit que ses propres opérations (`actor_id = auth.uid()`) ; admin voit tout le tenant
**And** `@aureak/business-logic` expose `SyncQueueService` avec méthodes `enqueue(op)`, `getLocalPending()`, `markSynced(operationId)`, `markFailed(operationId, error)`
**And** `supabase db diff` reste clean après migration

---

### Story 5.2 : Event Sourcing — `event_log`, Snapshot Attendance & `apply_event()`

En tant que développeur,
Je veux implémenter un modèle event sourcing léger côté serveur : chaque modification d'attendance génère un événement immuable dans `event_log`, la table `attendances` sert de snapshot courant,
Afin de disposer d'un historique d'audit complet, d'une restauration possible sans suppression d'historique, et d'un socle réutilisable pour les évaluations (Epic 6).

**Acceptance Criteria:**

**Given** les tables `attendances` (Story 4.2) et `processed_operations` (Story 1.2) existent
**When** la migration Story 5.2 est exécutée
**Then** la table `event_log` est créée :
```sql
CREATE TABLE event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL,     -- 'attendance', 'evaluation'
  entity_id UUID NOT NULL,       -- attendances.id
  event_type TEXT NOT NULL,
    -- 'ATTENDANCE_SET' | 'ATTENDANCE_RESTORED' | 'ATTENDANCE_CONFLICT_RESOLVED'
  payload JSONB NOT NULL,
    -- { session_id, child_id, old_status, new_status, conflict_rule?, restored_from_event_id? }
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  operation_id UUID NOT NULL,    -- clé d'idempotency
  source TEXT NOT NULL DEFAULT 'field'
    CHECK (source IN ('field','admin','sync','import')),
  device_id TEXT
);
CREATE INDEX event_log_entity_idx ON event_log (tenant_id, entity_type, entity_id);
CREATE UNIQUE INDEX event_log_operation_id_idx ON event_log (operation_id);
```
**And** les colonnes suivantes sont ajoutées à `attendances` :
```sql
ALTER TABLE attendances
  ADD COLUMN last_event_id UUID REFERENCES event_log(id),
  ADD COLUMN updated_by UUID REFERENCES profiles(user_id),
  ADD COLUMN updated_at TIMESTAMPTZ;
```
**And** la fonction RPC `apply_event(p_event JSONB)` est créée :
```sql
CREATE OR REPLACE FUNCTION apply_event(p_event JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_operation_id UUID := (p_event->>'operation_id')::uuid;
  v_event_id     UUID;
  v_snapshot     JSONB;
BEGIN
  -- Tenant check
  IF (p_event->>'tenant_id')::uuid != current_tenant_id() THEN
    RAISE EXCEPTION 'Tenant mismatch';
  END IF;
  -- Idempotency: already processed → return current snapshot
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = v_operation_id) THEN
    SELECT to_jsonb(a.*) INTO v_snapshot
    FROM attendances a
    WHERE id = (p_event->>'entity_id')::uuid;
    RETURN jsonb_build_object('idempotent', true, 'snapshot', v_snapshot);
  END IF;
  -- Insert event
  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type,
    payload, actor_id, occurred_at, operation_id, source, device_id
  ) VALUES (
    current_tenant_id(),
    p_event->>'entity_type',
    (p_event->>'entity_id')::uuid,
    p_event->>'event_type',
    p_event->'payload',
    auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_operation_id,
    COALESCE(p_event->>'source', 'field'),
    p_event->>'device_id'
  ) RETURNING id INTO v_event_id;
  -- Upsert snapshot
  INSERT INTO attendances (
    session_id, child_id, tenant_id, status,
    recorded_by, recorded_at, last_event_id, updated_by, updated_at
  ) VALUES (
    (p_event->'payload'->>'session_id')::uuid,
    (p_event->'payload'->>'child_id')::uuid,
    current_tenant_id(),
    p_event->'payload'->>'new_status',
    auth.uid(),
    COALESCE((p_event->>'occurred_at')::timestamptz, now()),
    v_event_id, auth.uid(), now()
  )
  ON CONFLICT (session_id, child_id) DO UPDATE SET
    status        = EXCLUDED.status,
    last_event_id = EXCLUDED.last_event_id,
    updated_by    = EXCLUDED.updated_by,
    updated_at    = EXCLUDED.updated_at;
  -- Mark idempotency
  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (v_operation_id, current_tenant_id());
  -- Return snapshot
  SELECT to_jsonb(a.*) INTO v_snapshot
  FROM attendances a
  WHERE session_id = (p_event->'payload'->>'session_id')::uuid
    AND child_id   = (p_event->'payload'->>'child_id')::uuid;
  RETURN jsonb_build_object('snapshot', v_snapshot, 'event_id', v_event_id);
END;
$$;
REVOKE ALL ON FUNCTION apply_event(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_event(JSONB) TO authenticated;
```
**And** `apply_event()` est le seul point d'écriture pour les modifications de présences — aucun UPDATE direct sur `attendances` n'est autorisé depuis le client
**And** `event_log` remplace et généralise le besoin de `attendance_history` : `event_log` est la table d'audit canonique, réutilisable pour les évaluations en Epic 6
**And** RLS activé sur `event_log` : coach voit les événements de ses sessions ; admin voit tout le tenant
**And** `supabase db diff` reste clean après migration

---

### Story 5.3 : Enregistrement Présence Offline (< 2s)

En tant que Coach,
Je veux enregistrer la présence d'un enfant en une action rapide, même sans réseau, avec retour visuel immédiat,
Afin de ne jamais perdre une présence terrain et de ne pas être ralenti par des problèmes de connectivité.

**Acceptance Criteria:**

**Given** un Coach connecté (ou en session rapide Epic 2.4) sur la fiche séance
**When** il tape sur le statut d'un enfant (present / absent / late / injured / trial)
**Then** l'écriture dans `local_attendances` (SQLite) est immédiate (< 50ms) — pas d'attente réseau
**And** l'interface affiche le nouveau statut immédiatement (optimistic update)
**And** une opération est enfilée dans `local_sync_queue` avec :
  - `operation_id` = UUID généré localement (clé idempotency)
  - `entity_type = 'attendance'`
  - `payload` = `{ session_id, child_id, new_status, occurred_at, device_id, source: 'field' }`
**And** si le réseau est disponible, la sync est tentée dans les 5 secondes
**And** la durée totale de l'action (tap → retour visuel confirmé localement) est < 2s en online et immédiate en offline
**And** `sessions.attendance_started_at` est mis à jour (trigger) dès la première attendance reçue côté serveur
**And** FR57 est couvert : enregistrement individuel < 2s online, immédiat offline

---

### Story 5.4 : Sync Queue Idempotente & Résolution de Conflits

En tant que système,
Je veux traiter la queue de sync de façon idempotente et résoudre les conflits selon la règle MVP définie,
Afin que la synchronisation soit fiable, que les données ne soient jamais perdues, et que les conflits soient tracés sans ambiguïté.

**Acceptance Criteria:**

**Given** des opérations en attente dans `local_sync_queue` (status = `pending` ou `failed`)
**When** le réseau devient disponible
**Then** `SyncQueueService.processPending()` itère les opérations par ordre `created_at ASC` et appelle `apply_event()` pour chacune
**And** `apply_event()` garantit l'idempotency via `processed_operations` — une opération déjà traitée retourne le snapshot existant sans erreur
**And** en cas de succès : `sync_queue.status = 'done'`, `sync_queue.synced_at = now()`, `local_attendances.synced = 1`
**And** en cas d'erreur serveur récupérable (500, timeout) : `status = 'failed'`, `retry_count++`, `last_error = message`, `last_attempt_at = now()` — max 5 tentatives avant notification
**And** **règle de priorité conflits MVP** : si `apply_event()` détecte une valeur différente déjà présente dans le snapshot courant :
  - Si l'`actor_id` de l'opération entrante est le `lead` coach de la séance → **lead coach device wins** : la valeur entrante écrase le snapshot ; `event_type = 'ATTENDANCE_CONFLICT_RESOLVED'` avec `payload.conflict_rule = 'lead_wins'`
  - Sinon → **server wins** : l'opération entrante est ignorée (status `done`) ; `event_type = 'ATTENDANCE_CONFLICT_RESOLVED'` avec `payload.conflict_rule = 'server_wins'`
  - Dans les deux cas : l'événement est loggué dans `event_log` ; aucune `sync_conflicts` table en MVP
**And** un badge UI "à vérifier" est affiché sur la fiche séance si au moins 1 `ATTENDANCE_CONFLICT_RESOLVED` existe pour cette session
**And** FR95 : conflits gérés par règle définie ; FR96 : coach informé si donnée modifiée côté serveur

---

### Story 5.5 : Timeline Admin & Restauration via `event_log`

En tant qu'Admin,
Je veux consulter l'historique complet des modifications de présence pour une séance/un enfant, filtrer par source et restaurer une valeur antérieure,
Afin d'avoir une traçabilité totale et de pouvoir corriger toute erreur sans jamais supprimer d'historique.

**Acceptance Criteria:**

**Given** un Admin connecté consultant la fiche d'une séance
**When** il ouvre la timeline d'une présence enfant
**Then** l'interface affiche le snapshot courant (`attendances`) + la liste ordonnée des événements (`event_log`) pour `entity_type = 'attendance'` et `entity_id = attendance.id`
**And** chaque événement affiche : `event_type`, `occurred_at`, `actor_id` (nom du coach), `source` (`field/admin/sync`), `payload.old_status` → `payload.new_status`, `device_id`
**And** l'Admin peut filtrer les événements par `source` (field / admin / sync) et par plage de dates
**And** **restauration** : l'Admin sélectionne un événement passé et clique "Restaurer cette valeur"
  - Une nouvelle opération `apply_event()` est appelée avec `event_type = 'ATTENDANCE_RESTORED'`, `source = 'admin'`, `payload.restored_from_event_id = <event.id>`, `payload.new_status = <event.payload.new_status>`
  - L'événement RESTORED est tracé dans `event_log` — l'historique antérieur est intégralement préservé, jamais modifié
**And** le badge "à vérifier" disparaît une fois que l'Admin a explicitement reviewé les conflits de la séance (champ `sessions.conflicts_reviewed_at TIMESTAMPTZ`)
**And** RLS : coach peut lire les événements de ses sessions ; admin peut tout lire et peut créer des événements RESTORED

---

### Story 5.6 : UX Offline — Indicateur Sync, Alertes & Rappel J+1

En tant que Coach,
Je veux voir en permanence l'état de ma synchronisation, être alerté immédiatement en cas d'échec, et recevoir un rappel le lendemain si des données restent non synchronisées,
Afin de ne jamais douter de l'état de mes données terrain.

**Acceptance Criteria:**

**Given** un Coach avec l'app mobile ouverte
**When** des opérations sont en attente dans `local_sync_queue`
**Then** un indicateur de sync persistent est visible (icône + label : "X opérations en attente", "Synchronisation…", "Tout est à jour")
**And** en cas d'échec de sync (`status = 'failed'`, `retry_count >= 3`) : un banner rouge "Échec de synchronisation — Vérifiez votre connexion" apparaît avec bouton "Réessayer"
**And** FR17 est couvert : alerte visible pour tout échec de synchronisation

**And** si des opérations `local_sync_queue.status IN ('pending','failed')` existent encore le lendemain matin (J+1 à 8h) :
  - Une Edge Function (cron Supabase ou scheduled function) détecte les coaches avec données non synchronisées
  - Une notification push est envoyée : "Des présences du [date] n'ont pas été synchronisées — Ouvrez l'app pour les envoyer"
**And** FR18 est couvert : notification rappel J+1 si données non synchronisées
**And** FR19 est couvert : Coach consulte l'état de sync en temps réel via l'indicateur permanent
**And** FR58 est couvert : mode séance fonctionne intégralement sans réseau (SQLite seul)
**And** FR59 est couvert : données locales préservées en cas de fermeture forcée (SQLite persist)

---

## Epic 6 : Évaluation Coach & Clôture de Séance

Un Coach peut évaluer chaque enfant en moins de 10 secondes (5 indicateurs sans état rouge + note libre), valider la séance conjointement via Realtime (WebSocket + fallback polling), et clôturer la séance de façon idempotente via event_log. Les évaluations de deux coaches sont fusionnées selon une règle MVP déterministe.
**FRs couverts :** FR14, FR20–FR21, FR-S6, ARCH-8, UX-1–UX-5, UX-8, NFR-PERF-6
**Dépendances :** Epic 5

### Story 6.1 : Modèle Évaluations — Event Sourcing & Règle de Fusion

En tant que développeur,
Je veux modéliser les évaluations coach en réutilisant le pattern event sourcing de Story 5.2, avec une vue fusionnée quand deux coaches évaluent le même enfant,
Afin que l'historique complet des évaluations soit traçable et que la vue parent/admin reflète toujours la valeur fusionnée déterministe.

**Acceptance Criteria:**

**Given** les tables `event_log`, `apply_event()` (Story 5.2), l'enum `evaluation_signal ('positive','attention','none')` (Story 1.2)
**When** la migration Story 6.1 est exécutée
**Then** la table `evaluations` est créée :
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  child_id UUID NOT NULL REFERENCES profiles(user_id),
  coach_id UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- 5 indicateurs — aucun état négatif/rouge
  receptivite  evaluation_signal NOT NULL DEFAULT 'none',
  gout_effort  evaluation_signal NOT NULL DEFAULT 'none',
  attitude     evaluation_signal NOT NULL DEFAULT 'none',
  top_seance   TEXT NOT NULL DEFAULT 'none' CHECK (top_seance IN ('star','none')),
  note         TEXT,    -- note libre par coach, non fusionnée
  -- event sourcing
  last_event_id UUID REFERENCES event_log(id),
  updated_by    UUID REFERENCES profiles(user_id),
  updated_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, child_id, coach_id)   -- 1 évaluation par coach par enfant par séance
);
```
**And** `apply_event()` (Story 5.2) est étendu pour gérer `entity_type = 'evaluation'` avec `event_type = 'EVALUATION_SET'` :
- Upsert sur `evaluations (session_id, child_id, coach_id)` avec les 5 indicateurs depuis `payload`
- Mise à jour de `last_event_id`, `updated_by`, `updated_at`
- Idempotency via `processed_operations` (même mécanique que pour les attendances)

**And** la **règle de fusion MVP** est implémentée dans une vue SQL :
```sql
CREATE VIEW session_evaluations_merged AS
SELECT
  session_id,
  child_id,
  tenant_id,
  -- Pour chaque signal : 'attention' > 'positive' > 'none'
  CASE
    WHEN bool_or(receptivite = 'attention') THEN 'attention'
    WHEN bool_or(receptivite = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS receptivite,
  CASE
    WHEN bool_or(gout_effort = 'attention') THEN 'attention'
    WHEN bool_or(gout_effort = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS gout_effort,
  CASE
    WHEN bool_or(attitude = 'attention') THEN 'attention'
    WHEN bool_or(attitude = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS attitude,
  -- top_seance : 'star' si au moins 1 coach l'a attribué
  CASE WHEN bool_or(top_seance = 'star') THEN 'star' ELSE 'none' END AS top_seance
FROM evaluations
GROUP BY session_id, child_id, tenant_id;
```
**And** les notes (`note`) ne sont PAS fusionnées — chaque coach garde sa note individuelle ; la vue parent/Epic 8 affiche les notes séparément par coach
**And** RLS activé sur `evaluations` : coach voit et modifie ses propres évaluations ; admin voit tout le tenant ; parent/enfant voit la vue fusionnée de leurs séances
**And** `supabase db diff` reste clean après migration

---

### Story 6.2 : UX Évaluation Rapide (< 10s par enfant)

En tant que Coach,
Je veux évaluer chaque enfant d'une main en moins de 10 secondes avec retour haptique immédiat,
Afin de ne pas ralentir le flux post-séance et de garantir que toutes les évaluations sont saisies avant que les enfants ne partent.

**Acceptance Criteria:**

**Given** une séance `en_cours` avec des attendances enregistrées
**When** le Coach ouvre l'écran d'évaluation
**Then** les enfants présents (`attendance.status = 'present' | 'late' | 'trial'`) sont listés en cartes navigables par swipe gauche/droite (UX-4)
**And** chaque carte affiche :
  - 3 `IndicatorToggle` (réceptivité, goût de l'effort, attitude) — cycle `none → positive → attention` (2 états actifs, sans rouge) — zones tactiles ≥ 44×44pt (UX-3, UX-8)
  - 1 `StarToggle` (top séance) — cycle `none → star`
  - 1 champ note optionnel (texte libre, clavier escamotable)
**And** chaque tap sur un toggle déclenche un retour haptique immédiat (UX-8)
**And** l'évaluation est enregistrée localement et enfilée dans `sync_queue` via `apply_event()` — même pattern offline que les présences
**And** le temps cumulé pour évaluer 1 enfant (4 taps + swipe) est < 10s (UX-3)
**And** un indicateur de progression (ex: "8 / 12 évalués") est visible en permanence
**And** les enfants `absent` ou `injured` sont affichés grisés en bas de liste — le coach peut choisir de les évaluer quand même (cas de présence non enregistrée)
**And** UX-1 à UX-5 et UX-8 sont couverts

---

### Story 6.3 : Double Validation Coach (Realtime + Fallback Polling)

En tant que Coach,
Je veux confirmer la clôture de séance conjointement avec le co-coach via synchronisation en temps réel, avec un fallback polling si le WebSocket est indisponible,
Afin que la double validation soit toujours possible sur le terrain même en conditions réseau dégradées.

**Acceptance Criteria:**

**Given** deux coaches assignés à la séance (`session_coaches` — 1 lead + 1 assistant)
**When** le lead coach ouvre l'écran de validation
**Then** `sessions.validation_status` suit la machine d'état :
  - `'pending'` → `'validated_lead'` (lead confirme, UPDATE via RPC sécurisé)
  - `'validated_lead'` → `'validated_both'` (assistant confirme, UPDATE via RPC sécurisé)
  - `'validated_both'` → permet le passage en clôture (Story 6.4)

**And** la synchronisation Realtime est implémentée via Supabase WebSocket :
```typescript
const channel = supabase
  .channel(`session-validation:${sessionId}`)
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'sessions',
    filter: `id=eq.${sessionId}`
  }, (payload) => {
    useSessionStore.getState().setValidationStatus(payload.new.validation_status)
  })
  .subscribe()
```
**And** **fallback polling** : si `channel.state !== 'joined'` après 3 secondes (WebSocket non disponible), l'app bascule sur un polling via `TanStack Query` avec `refetchInterval: 9000` (9s) sur la query `GET /sessions/:id`
**And** le polling est annulé dès que le WebSocket repasse à l'état `joined`
**And** chaque confirmation de validation est sécurisée côté serveur : RLS vérifie que `auth.uid()` est bien dans `session_coaches` de la séance + que le rôle correspond (lead ou assistant)
**And** si la séance n'a qu'un seul coach assigné : `validation_status` passe directement à `'validated_both'` dès la confirmation du lead (single-coach flow)
**And** UX-5 est couvert : double validation chacun sur son téléphone

---

### Story 6.4 : Clôture de Séance — Idempotente & Tracée

En tant que Coach,
Je veux clôturer une séance de façon idempotente avec une garantie d'envoi unique de la notification parent,
Afin que la clôture ne puisse jamais être exécutée deux fois et que l'historique de clôture soit toujours consultable.

**Acceptance Criteria:**

**Given** une séance avec `validation_status = 'validated_both'` (ou `'validated_lead'` pour un coach seul) et au moins 1 `coach_presence_confirmations` du lead
**When** le Coach principal tape "Clôturer la séance"
**Then** une RPC `close_session(session_id, operation_id)` est appelée côté serveur :
```sql
CREATE OR REPLACE FUNCTION close_session(p_session_id UUID, p_operation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_event_id UUID;
BEGIN
  -- Idempotency
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('idempotent', true);
  END IF;
  -- Validation checks
  IF NOT EXISTS (
    SELECT 1 FROM sessions WHERE id = p_session_id
      AND validation_status IN ('validated_lead','validated_both')
      AND tenant_id = current_tenant_id()
  ) THEN
    RAISE EXCEPTION 'Session % not ready for close', p_session_id;
  END IF;
  -- Emit SESSION_CLOSED event
  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type, payload,
    actor_id, operation_id, source
  ) VALUES (
    current_tenant_id(), 'session', p_session_id, 'SESSION_CLOSED',
    jsonb_build_object('closed_by', auth.uid(), 'closed_at', now()),
    auth.uid(), p_operation_id, 'field'
  ) RETURNING id INTO v_event_id;
  -- Update snapshot
  UPDATE sessions SET
    status     = 'terminée',
    closed_at  = now(),
    closed_by  = auth.uid()
  WHERE id = p_session_id;
  -- Mark idempotency
  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (p_operation_id, current_tenant_id());
  RETURN jsonb_build_object('closed', true, 'event_id', v_event_id);
END; $$;
REVOKE ALL ON FUNCTION close_session(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION close_session(UUID, UUID) TO authenticated;
```
**And** les colonnes suivantes sont ajoutées à `sessions` :
```sql
ALTER TABLE sessions
  ADD COLUMN validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending','validated_lead','validated_both')),
  ADD COLUMN closed_at TIMESTAMPTZ,
  ADD COLUMN closed_by UUID REFERENCES profiles(user_id),
  ADD COLUMN notification_sent_at TIMESTAMPTZ;   -- garantie send-once
```
**And** après clôture réussie, une Edge Function `notify-session-closed` est déclenchée via `event_log` trigger ou webhook :
  - Vérifie `sessions.notification_sent_at IS NULL` avant tout envoi (send-once guarantee)
  - Envoie les notifications push parents (< 5 min — UX-7) via `push_tokens` + `notification_preferences`
  - Met `sessions.notification_sent_at = now()` en une seule UPDATE atomique
  - Logue chaque envoi dans `notification_send_logs` (Story 4.3)

**And** **SESSION_REOPENED (admin uniquement, optionnel Phase 2)** : un Admin peut remettre une séance en `en_cours` en émettant `event_type = 'SESSION_REOPENED'` dans `event_log` — jamais de suppression de l'événement SESSION_CLOSED ; l'historique est intégralement préservé
**And** le Coach qui tente de clôturer une séance déjà `terminée` reçoit un message "Séance déjà clôturée" — aucune erreur bloquante, idempotency garantie
**And** UX-7 est couvert : notification parent < 5 min après clôture

---

## Epic 7 : Notifications & Board Parent

Un Parent reçoit les notifications post-séance dans les 5 minutes, avec envoi idempotent et multicanal selon ses préférences et le niveau d'urgence. Il consulte la fiche complète de son enfant (présences, évaluations fusionnées) avec transparence terrain/édition admin. Il peut soumettre des demandes structurées via un système de tickets tracé.
**FRs couverts :** FR29–FR35, FR31–FR32, ARCH-9, ARCH-16, UX-7
**Dépendances :** Epic 6

### Story 7.1 : Infrastructure Notifications — Push Tokens, Préférences & Urgence

En tant que développeur,
Je veux finaliser l'infrastructure de notifications avec un modèle d'idempotency robuste, des règles d'urgence par type d'événement, et une traçabilité complète par canal,
Afin qu'aucune notification ne soit envoyée deux fois et que les parents ne soient notifiés que selon leurs préférences.

**Acceptance Criteria:**

**Given** la table `push_tokens` (ARCH-9), `notification_preferences` et `notification_send_logs` créées en Story 4.3
**When** la migration Story 7.1 est exécutée
**Then** `notification_send_logs` est étendue avec les colonnes manquantes et la contrainte d'idempotency :
```sql
ALTER TABLE notification_send_logs
  ADD COLUMN urgency TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('routine','urgent')),
  ADD COLUMN provider_response JSONB;   -- réponse brute du provider (Expo/Resend/Twilio)

-- Clé d'idempotency send-once : 1 envoi par canal par parent par notification par entité
ALTER TABLE notification_send_logs
  ADD CONSTRAINT unique_send_once
    UNIQUE (tenant_id, recipient_id, reference_id, event_type, channel);
-- Note: reference_id (session_id) est toujours NOT NULL pour les notifications session
```
**And** la **règle d'urgence** est documentée et appliquée dans les Edge Functions :
  - `urgent` (annulation, changement heure/lieu) → envoie sur **tous les canaux activés** (`push_enabled AND/OR email_enabled AND/OR sms_enabled`) dans cet ordre de priorité
  - `routine` (post-séance, rappel quiz) → envoie **push uniquement** (`push_enabled = true`) ; email/SMS non déclenchés sauf opt-in explicite futur
**And** `push_tokens` est accessible en RLS pour l'utilisateur propriétaire (INSERT/DELETE sur ses propres tokens) et en lecture pour les Edge Functions (service role)
**And** `notification_preferences` peut être créée/mise à jour par le parent lui-même via une mutation protégée par RLS (`user_id = auth.uid()`)
**And** la Edge Function `send-notification` (Deno) encapsule la logique : consulte `notification_preferences`, applique la règle d'urgence, itère les canaux, logue dans `notification_send_logs` avec `ON CONFLICT DO NOTHING` sur `unique_send_once`
**And** `supabase db diff` reste clean après migration

---

### Story 7.2 : Notification Post-Séance (SESSION_CLOSED → Send-Once)

En tant que Parent,
Je veux recevoir une notification push dans les 5 minutes après la clôture de la séance de mon enfant, sans jamais la recevoir deux fois,
Afin d'être informé rapidement du compte-rendu de séance sans être spammé.

**Acceptance Criteria:**

**Given** une séance passée en `status = 'terminée'` (événement `SESSION_CLOSED` dans `event_log`)
**When** la Edge Function `notify-session-closed` est déclenchée (via Database Webhook sur `event_log` filtré sur `event_type = 'SESSION_CLOSED'`)
**Then** la fonction itère tous les parents des enfants présents (`attendances.status IN ('present','late','trial')` pour la séance)
**And** pour chaque parent, elle tente l'INSERT dans `notification_send_logs` pour le canal `push` avec `event_type = 'session_closed'`, `urgency = 'routine'`, `reference_id = session_id`
  - Si `ON CONFLICT ON CONSTRAINT unique_send_once` → `DO NOTHING` et `status = 'skipped'` — le send-once est garanti au niveau DB
  - Si l'INSERT réussit → la notification push est envoyée via Expo Push API et `provider_response` est mis à jour
**And** le contenu de la notification affiche : nom du coach, thèmes du jour, nombre d'enfants présents, CTA "Voir le compte-rendu"
**And** `sessions.notification_sent_at` est mis à jour seulement après le succès du premier envoi réel (`sent` dans `notification_send_logs`) — pas avant
**And** les erreurs push (token expiré, appareil désinscrit) sont loguées avec `status = 'failed'` et `provider_response` — pas de retry automatique en MVP
**And** UX-7 est couvert : notification parent < 5 min après clôture
**And** FR29 est couvert : notification push parent à clôture de séance

---

### Story 7.3 : Board Parent — Fiche Enfant & Transparence Terrain/Admin

En tant que Parent,
Je veux consulter la fiche complète de mon enfant avec les présences, évaluations et le statut terrain vs édition admin, afin de comprendre exactement ce qui s'est passé et si une donnée a été corrigée après coup.

**Acceptance Criteria:**

**Given** un Parent connecté avec au moins un enfant lié via `parent_child_links`
**When** il ouvre la fiche de son enfant
**Then** l'écran affiche en sections :
  1. **Résumé présences** : dernières N séances avec statut (`present/absent/late/injured/trial`) et date
  2. **Évaluations fusionnées** : vue `session_evaluations_merged` (Story 6.1) — indicateurs visuels (IndicatorToggle/StarToggle) + notes coach (non fusionnées)
  3. **Historique séances** : liste paginée avec thèmes, groupe, date, coach(s)

**And** chaque ligne présence/évaluation affiche un indicateur de source dérivé de `event_log` :
  - **"Terrain"** : dernier événement `event_log` pour cette entité a `source = 'field'` — timestamp = `event_log.occurred_at` (heure réelle terrain)
  - **"Modifié"** : dernier événement a `source = 'admin'` — libellé "Modifié le [date] par staff" affiché discrètement sous la valeur
  - La dérivation se fait côté serveur via une query sur `event_log WHERE entity_id = attendance.id ORDER BY occurred_at DESC LIMIT 1`

**And** la vue ne précharge que les 3 derniers mois par défaut ; pagination pour les données plus anciennes
**And** FR34 est couvert : Parent consulte fiche complète de son enfant
**And** FR35 est couvert : Parent visualise évolution dans le temps
**And** RLS garantit qu'un parent ne voit que les données de ses propres enfants (via `parent_child_links`)

---

### Story 7.4 : Système de Tickets Parent (Minimal Tracé)

En tant que Parent,
Je veux soumettre une demande au staff via un formulaire structuré et suivre l'avancement de la réponse,
Afin de centraliser toute communication avec l'académie dans l'app sans fil email dispersé.

**Acceptance Criteria:**

**Given** un Parent connecté
**When** il ouvre "Contacter le staff"
**Then** un formulaire de création de ticket est disponible avec :
  - **Catégorie obligatoire** : `absence | retard | question | logistique`
  - **Sujet** : champ texte libre court (max 120 caractères)
  - **Message** : champ texte long (max 2 000 caractères) — pas de pièce jointe en MVP
  - **Enfant concerné** : sélection parmi ses enfants (si plusieurs)
  - **Séance liée** (optionnel) : sélection depuis ses dernières séances

**And** les tables suivantes sont créées :
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID NOT NULL REFERENCES profiles(user_id),
  child_id UUID REFERENCES profiles(user_id),
  session_id UUID REFERENCES sessions(id),
  category TEXT NOT NULL
    CHECK (category IN ('absence','retard','question','logistique')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to UUID REFERENCES profiles(user_id),   -- coach ou admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(user_id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**And** côté client, des **templates de sujet** pré-remplis sont fournis par catégorie (constantes front-end, pas en DB) :
  - `absence` → "Absence de [prénom] le [date]"
  - `retard` → "Retard prévu pour [prénom] le [date]"
  - `question` → champ libre
  - `logistique` → "Question logistique — [sujet libre]"
**And** chaque changement de `tickets.status` est journalisé dans `audit_logs`
**And** un Coach/Admin reçoit une notification push à la création d'un ticket (`urgency = 'routine'`, `event_type = 'ticket_created'`)
**And** le Parent reçoit une notification push à chaque réponse d'un Coach/Admin
**And** RLS : le Parent voit uniquement ses propres tickets et leurs réponses ; Coach/Admin du tenant voient tous les tickets du tenant
**And** FR31 est couvert : parent soumet demande via ticket structuré
**And** FR32 est couvert : Coach/Admin répond aux tickets parents (tracé)
**And** FR33 est couvert : parent notifié à chaque réponse
**And** `supabase db diff` reste clean après migration

---

## Epic 8 : Apprentissage Adaptatif, Maîtrise & Progression Joueur

Un Enfant suit un parcours de tutorat adaptatif post-séance : l'app continue de poser des questions jusqu'à maîtrise ou arrêt, et lui montre uniquement ✅ ACQUIS ou ❌ NON ACQUIS (jamais de note chiffrée). Des points, badges et streaks récompensent chaque acquisition. L'historique est planifié pour révision espacée. Le Coach voit les métriques détaillées ; le Parent voit la progression de son enfant.
**FRs couverts :** FR22–FR24, FR35, FR71–FR72, FR76, FR-P1–FR-P8, FR-S7, UX-10
**Dépendances :** Epic 7

### Story 8.1 : Modèle de Données — Apprentissage, Maîtrise & Gamification

En tant que développeur,
Je veux créer le modèle de données complet pour les tentatives d'apprentissage adaptatif, les seuils de maîtrise configurables, et le moteur de gamification (points ledger, badges, streaks),
Afin que toute la logique de progression soit traçable, versionnée et extensible.

**Acceptance Criteria:**

**Given** les tables `quiz_questions`, `quiz_options` (Story 3.5), `sessions`, `session_themes` (Story 4.1), `profiles`
**When** la migration Story 8.1 est exécutée
**Then** les tables suivantes sont créées :

```sql
-- Seuils de maîtrise configurables par Admin (scope hiérarchique)
CREATE TABLE mastery_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  scope_type TEXT NOT NULL
    CHECK (scope_type IN ('global','theme','age_group','theme_age_group')),
  theme_id  UUID REFERENCES themes(id),
  age_group TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  threshold INTEGER NOT NULL DEFAULT 80 CHECK (threshold BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Unicité par scope (indexes partiels car colonnes nullable)
CREATE UNIQUE INDEX mt_global   ON mastery_thresholds (tenant_id)              WHERE scope_type = 'global';
CREATE UNIQUE INDEX mt_theme    ON mastery_thresholds (tenant_id, theme_id)    WHERE scope_type = 'theme';
CREATE UNIQUE INDEX mt_age      ON mastery_thresholds (tenant_id, age_group)   WHERE scope_type = 'age_group';
CREATE UNIQUE INDEX mt_theme_age ON mastery_thresholds (tenant_id, theme_id, age_group) WHERE scope_type = 'theme_age_group';

-- Tentatives d'apprentissage adaptatif (1 par theme par session pour l'enfant, + revalidations)
CREATE TABLE learning_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id UUID REFERENCES sessions(id),      -- null pour revalidations standalone
  child_id UUID NOT NULL REFERENCES profiles(user_id),
  theme_id UUID NOT NULL REFERENCES themes(id), -- version-frozen (depuis session_themes.theme_id)
  attempt_type TEXT NOT NULL DEFAULT 'post_session'
    CHECK (attempt_type IN ('post_session','revalidation')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  mastery_percent INTEGER CHECK (mastery_percent BETWEEN 0 AND 100),
  mastery_status TEXT CHECK (mastery_status IN ('acquired','not_acquired')),
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  stop_reason TEXT CHECK (stop_reason IN ('mastered','child_stopped','time_limit')),
  -- Révision espacée (set automatiquement quand mastery_status = 'acquired')
  review_due_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  review_result TEXT CHECK (review_result IN ('maintained','lost')),
  -- Réservé intégration IA future
  model_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX learning_attempts_child_theme ON learning_attempts (child_id, theme_id);

-- Réponses individuelles par tentative
CREATE TABLE learning_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES learning_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id),
  selected_option_id UUID NOT NULL REFERENCES quiz_options(id),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snapshot dénormalisé progression joueur (mis à jour par trigger après chaque badge_awarded)
-- total_points = cache de SUM(player_points_ledger.points_delta) — recalculé par trigger Epic 12
CREATE TABLE player_progress (
  child_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,   -- séances consécutives avec ≥ 1 acquired
  max_streak INTEGER NOT NULL DEFAULT 0,
  themes_acquired_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
**And** RLS activé sur toutes ces tables — règles de visibilité définies en Story 8.5
**Note** : `badge_definitions`, `player_badges`, `player_points_ledger` sont définis dans Epic 12 (Gamification). Epic 8 déclenche des événements gamification via RPC — il n'écrit pas directement dans ces tables.
**And** `supabase db diff` reste clean après migration

---

### Story 8.2 : Moteur de Quiz Adaptatif (Stop Conditions & Maîtrise)

En tant que système,
Je veux gérer le flux de tutorat adaptatif côté serveur : résolution du seuil de maîtrise applicable, sélection de questions, évaluation des conditions d'arrêt, et déclenchement de la gamification à la clôture de tentative,
Afin que chaque enfant reçoive exactement le nombre de questions nécessaire à sa maîtrise, pas plus.

**Acceptance Criteria:**

**Given** un `learning_attempt` créé pour un `(child_id, theme_id, session_id)`
**When** l'enfant répond à chaque question via l'app
**Then** les **questions sont sélectionnées** depuis `quiz_questions WHERE theme_id = attempt.theme_id AND status = 'published'`, dans un ordre aléatoire stable pour la tentative (seed = `attempt.id`), sans répétition dans la même tentative

**And** le **seuil de maîtrise applicable** est résolu par une RPC `get_mastery_threshold(theme_id, age_group)` qui interroge `mastery_thresholds` selon la priorité (le scope le plus spécifique l'emporte) :
  1. `theme_age_group` (theme_id + age_group)
  2. `theme` (theme_id seul)
  3. `age_group` (age_group seul)
  4. `global` (défaut tenant)

**And** après chaque réponse enregistrée dans `learning_answers`, la RPC `submit_answer(attempt_id, question_id, selected_option_id)` :
  - Incrémente `questions_answered` et `correct_count` si `is_correct`
  - Calcule `mastery_percent = ROUND(correct_count::numeric / questions_answered * 100)`
  - Évalue les **conditions d'arrêt** (dans cet ordre) :
    1. `mastery_percent >= threshold AND questions_answered >= 3` → `stop_reason = 'mastered'`
    2. Plus de questions disponibles (toutes répondues) → `stop_reason = 'mastered'` ou `'child_stopped'` selon `mastery_percent`
    3. (Optionnel) `time_limit` dépassé → `stop_reason = 'time_limit'`
  - Si condition d'arrêt atteinte : set `ended_at`, `mastery_status = 'acquired'` si `stop_reason = 'mastered'` sinon `'not_acquired'`
  - Si arrêt → appelle `finalize_attempt(attempt_id)` (Story 8.4 gamification + révision espacée)
  - Retourne `{ is_correct, mastery_percent, should_stop, stop_reason }`

**And** `finalize_attempt()` est une RPC SECURITY DEFINER qui :
  - Met à jour `player_progress` snapshot (streak, themes_acquired_count, last_activity_at)
  - Schedule la révision espacée si `mastery_status = 'acquired'` (Story 8.4)
  - Appelle `award_badge_if_applicable(child_id, event_type, ref_id)` (Epic 12) pour QUIZ_MASTERED / REVIEW_COMPLETED — la logique points/badges est entièrement dans Epic 12

**And** l'enfant peut quitter à tout moment — le front appelle `stop_attempt(attempt_id, 'child_stopped')` qui finalise la tentative avec `stop_reason = 'child_stopped'` et `mastery_status = 'not_acquired'`
**And** FR71 est couvert : génération automatique quiz depuis thèmes associés à la séance

---

### Story 8.3 : UX Enfant — Acquired/Not Acquired, Avatar & Badges

En tant qu'Enfant,
Je veux vivre le quiz comme un jeu de maîtrise avec retour immédiat et récompenses visuelles, sans jamais voir de note chiffrée,
Afin que l'apprentissage soit perçu comme engageant et motivant, pas comme un examen.

**Acceptance Criteria:**

**Given** un enfant connecté après la clôture de sa séance
**When** il démarre son quiz post-séance
**Then** l'écran de quiz affiche :
  - Les questions avec 3–4 options comme grandes cibles tactiles (UX-10 : max 5 questions par thème pour la première tentative post-séance — configurable)
  - Retour immédiat après chaque réponse : ✅ "Bonne réponse !" ou ❌ "Pas encore — [explication de la bonne réponse]"
  - Un indicateur de progression gamifié (ex: barre de "progression vers maîtrise", pas de pourcentage visible)

**And** à la clôture de la tentative, l'écran de résultat affiche **uniquement** :
  - ✅ **ACQUIS** (grand badge animé, confettis, points gagnés) si `mastery_status = 'acquired'`
  - ❌ **CONTINUE D'APPRENDRE** (encouragement, CTA "Réessayer plus tard") si `not_acquired`
  - **Jamais** de score numérique (`mastery_percent` est masqué pour l'enfant)

**And** l'écran principal de l'enfant affiche :
  - **Total points** : `SUM(player_points_ledger.points_delta)` — affiché comme score simple, aucun niveau ou palier XP
  - **Collection de badges** : grille `player_badges JOIN badge_definitions` (icône + label + points)
  - **Streak actif** : `player_progress.current_streak` en flamme animée
  - **Thèmes acquis** : liste des thèmes `mastery_status = 'acquired'` avec date

**And** aucune donnée numérique de score n'est exposée dans les queries RLS côté enfant — `mastery_percent`, `correct_count`, `questions_answered` sont exclus des policies SELECT pour `current_user_role() = 'child'`
**And** UX-10 est couvert : max 5 questions, grandes cibles tactiles

---

### Story 8.4 : Streaks, Révision Espacée & Déclenchement Événements Gamification

En tant que système,
Je veux mettre à jour les streaks et la révision espacée à la finalisation d'une tentative, et notifier la couche gamification (Epic 12) via RPC pour attribution de badges,
Afin que la logique d'apprentissage reste découplée de la logique de récompenses.

**Acceptance Criteria:**

**Given** une tentative finalisée via `finalize_attempt(attempt_id)`
**When** `mastery_status = 'acquired'`
**Then** le **streak** est mis à jour dans `player_progress` :
  - `current_streak` incrémenté si `last_activity_at::date >= current_date - 1`
  - `current_streak` reset à 1 si gap > 1 jour
  - `max_streak` mis à jour si `current_streak > max_streak`
  - `themes_acquired_count` incrémenté
  - `last_activity_at = now()`

**And** la **révision espacée** est planifiée :
  - `learning_attempts.review_due_at = ended_at + INTERVAL '14 days'` (configurable via `tenants.config->>'review_interval_days'`)
  - Un Edge Function cron (daily à 9h) détecte les `review_due_at::date = current_date` et envoie une notification push au parent + enfant : "Il est temps de revalider [thème] pour [prénom] !"
  - Notification loguée dans `notification_send_logs` (`event_type = 'review_due'`, `urgency = 'routine'`)

**And** `finalize_attempt()` appelle en fin de transaction la RPC Epic 12 `award_badge_if_applicable()` avec :
  - `event_type = 'QUIZ_MASTERED'` si `attempt_type = 'post_session'`
  - `event_type = 'SKILL_MASTERED'` si `attempt_type = 'revalidation'`
  - `ref_id = attempt_id`
  - `child_id`
  - `context = { session_id, theme_id, ended_at, current_streak }` — la couche gamification décide quels badges attribuer
  - **Epic 8 n'écrit jamais directement dans `player_badges` ou `player_points_ledger`**

**And** si `mastery_status = 'not_acquired'` : aucun événement gamification émis ; `player_progress` non modifié sauf `last_activity_at`

**And** FR76 est couvert : calcul progression par thème via `player_progress.themes_acquired_count`
**And** FR-P8 est couvert : progression calculée incrémentalement à chaque clôture

---

### Story 8.5 : Rapports Coach, Vue Agrégée Groupe & Accès Parent

En tant que Coach (et Admin, et Parent),
Je veux consulter les métriques détaillées d'apprentissage de chaque enfant et du groupe, avec les données chiffrées réservées au staff et une vue narrative pour les parents,
Afin que le Coach puisse identifier les enfants en difficulté et que le Parent suive la progression de son enfant sans être noyé dans les chiffres.

**Acceptance Criteria:**

**Given** des `learning_attempts` finalisées pour une séance
**When** un Coach consulte le rapport de séance
**Then** l'interface Coach affiche par enfant :
  - `mastery_percent`, `correct_count / questions_answered`, `stop_reason`
  - Questions manquées : liste des `learning_answers WHERE is_correct = false` avec `question_text`
  - Critères faibles : groupement des questions manquées par `criteria.label` (via `quiz_questions → themes → theme_sequences → criteria`)
  - Statut `ACQUIS` / `NON ACQUIS` + date de dernière tentative

**And** le Coach voit une **vue agrégée groupe** :
  - % d'enfants ayant acquis chaque thème de la séance
  - Classement questions les plus ratées (pour ajuster la prochaine séance)
  - Tendance par thème sur les N dernières séances du groupe

**And** les **RLS par rôle** sont appliquées :
```sql
-- Child : voit uniquement ses propres tentatives, SANS mastery_percent/correct_count
-- Parent : voit les tentatives de ses enfants (via parent_child_links), SANS mastery_percent
-- Coach : voit toutes les tentatives des enfants de ses séances (session_coaches), AVEC mastery_percent
-- Admin : voit toutes les tentatives du tenant, AVEC toutes métriques
```
**And** la **vue parent** affiche (sans chiffres) :
  - ✅ Thèmes acquis avec date + badge éventuel + streak actuel
  - ❌ Thèmes "en cours d'apprentissage"
  - Historique des revalidations avec résultat (`maintained/lost`)
  - `player_progress.total_points` + collection badges

**And** FR22–FR24 sont couverts : quiz enfant + correction + résultats coach
**And** FR35, FR-P1–FR-P4 sont couverts : vue progression parent
**And** FR72 est couvert : résultats agrégés par thème
**And** FR-P2, FR-P3, FR-P6 sont couverts : historique évaluations, courbe évolution, progression groupe coach

---

## Epic 12 (nouveau) : Player Universe & Gamification Layer

> **Note de numérotation** : Supersède l'ancien Epic 14 (Gamification & Badges Techniques). L'ancien Epic 12 (Médias) → Epic 13 ; l'ancien Epic 13 (Vidéo Avancé) → Epic 14. La liste des épics en tête de document est à jour.

Un Enfant accumule des badges pédagogiques, chacun valant un nombre de points fixe défini par l'Admin. Le score total est la somme du ledger immuable. Pas de niveaux XP ni de paliers MVP — uniquement badges → points → cosmétiques débloquables. Toute récompense est exclusivement dérivée des événements d'apprentissage réels — aucun achat, aucun pay-to-win.

**Dépendances :** Epic 8 (`player_progress`, événements gamification via RPC)
**Événements déclencheurs :** `QUIZ_MASTERED` · `SKILL_MASTERED` · `SESSION_ATTENDED` · `COACH_AWARD` · `SPECIAL_EVENT`

### Story 12.1 : Modèle de Données — Badges, Points Ledger & Cosmétiques Avatar

En tant que développeur,
Je veux créer le modèle de données complet de la couche gamification MVP : définitions de badges avec valeur en points, ledger immuable, collection de badges par enfant, et items cosmétiques d'avatar débloquables via badges/points,
Afin que le système de récompenses soit découplé du moteur d'apprentissage, idempotent, et auditable.

**Acceptance Criteria:**

**Given** les tables Epic 8 existantes (`player_progress`, `learning_attempts`, `profiles`)
**When** la migration Story 12.1 est exécutée
**Then** les tables suivantes sont créées :

```sql
-- Définitions de badges (gérées par l'Admin)
-- Chaque badge a une valeur en points fixe. Pas de niveaux XP.
CREATE TABLE badge_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  code        TEXT NOT NULL,          -- ex: 'ENT1_S2026', 'STREAK_3', 'FIRST_ACQUIRED'
  label       TEXT NOT NULL,          -- ex: 'Badge ENT1 – Saison 2026'
  description TEXT,
  icon_url    TEXT,
  points      INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  season      INTEGER,                -- ex: 2026 (null = intemporel)
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Badges attribués à un enfant (append-only, idempotent)
-- UNIQUE(child_id, badge_id) garantit qu'un badge ne peut être attribué qu'une seule fois.
CREATE TABLE player_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  child_id    UUID NOT NULL REFERENCES profiles(user_id),
  badge_id    UUID NOT NULL REFERENCES badge_definitions(id),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  source      TEXT NOT NULL
    CHECK (source IN ('quiz','attendance','skill_mastered','coach_award','special_event')),
  ref_id      UUID,   -- learning_attempt_id, session_id, etc.
  UNIQUE (child_id, badge_id)  -- un badge par enfant, une seule fois
);
CREATE INDEX pb_child ON player_badges (child_id, awarded_at DESC);

-- Ledger de points immuable (append-only — jamais UPDATE ni DELETE)
-- Score total = SUM(points_delta) par child_id.
-- Seule source de vérité pour les points — player_progress.total_points est un cache.
CREATE TABLE player_points_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  child_id    UUID NOT NULL REFERENCES profiles(user_id),
  event_type  TEXT NOT NULL DEFAULT 'BADGE_AWARDED'
    CHECK (event_type IN ('BADGE_AWARDED')),  -- extensible en Phase 2
  ref_id      UUID NOT NULL,  -- badge_id (FK logique — pas enforced pour immuabilité)
  points_delta INTEGER NOT NULL CHECK (points_delta > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ppl_child ON player_points_ledger (child_id, created_at DESC);

-- Catalogue d'items cosmétiques avatar (jamais pay-to-win)
-- Conditions de déblocage basées sur badges ou total_points — pas de niveaux XP.
CREATE TABLE avatar_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL
    CHECK (category IN ('frame','background','accessory','effect','title')),
  unlock_condition JSONB NOT NULL,
  -- Exemples (MVP) :
  -- { "type": "badge",           "badge_code": "STREAK_3" }
  -- { "type": "total_points",    "min_points": 100 }
  -- { "type": "themes_acquired", "count": 5 }
  asset_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER,
  UNIQUE (tenant_id, slug)
);

-- Avatar équipé par l'enfant (1 item par slot)
CREATE TABLE player_avatars (
  child_id            UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL,
  equipped_frame      UUID REFERENCES avatar_items(id),
  equipped_background UUID REFERENCES avatar_items(id),
  equipped_accessory  UUID REFERENCES avatar_items(id),
  equipped_effect     UUID REFERENCES avatar_items(id),
  equipped_title      UUID REFERENCES avatar_items(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Items cosmétiques débloqués par l'enfant (append-only)
CREATE TABLE player_unlocked_items (
  child_id       UUID NOT NULL REFERENCES profiles(user_id),
  item_id        UUID NOT NULL REFERENCES avatar_items(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_trigger TEXT NOT NULL
    CHECK (unlock_trigger IN ('badge_earned','total_points','themes_acquired')),
  PRIMARY KEY (child_id, item_id)
);

-- Snapshot maîtrise par thème par enfant (mis à jour par trigger gamification)
CREATE TABLE player_theme_mastery (
  child_id          UUID NOT NULL REFERENCES profiles(user_id),
  theme_id          UUID NOT NULL REFERENCES themes(id),
  tenant_id         UUID NOT NULL,
  mastery_status    TEXT NOT NULL DEFAULT 'not_started'
    CHECK (mastery_status IN ('not_started','in_progress','acquired','revalidated')),
  first_acquired_at TIMESTAMPTZ,
  last_attempt_at   TIMESTAMPTZ,
  total_attempts    INTEGER NOT NULL DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, theme_id)
);

-- Skill cards catalogue (liées aux thèmes pédagogiques)
CREATE TABLE skill_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  theme_id         UUID NOT NULL REFERENCES themes(id),
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  rarity           TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common','rare','epic','legendary')),
  illustration_url TEXT,
  unlock_condition TEXT NOT NULL
    CHECK (unlock_condition IN ('theme_acquired','revalidated','first_acquired','streak_active')),
  UNIQUE (tenant_id, slug)
);

-- Collection de skill cards par enfant
CREATE TABLE player_skill_cards (
  child_id      UUID NOT NULL REFERENCES profiles(user_id),
  skill_card_id UUID NOT NULL REFERENCES skill_cards(id),
  tenant_id     UUID NOT NULL,
  collected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, skill_card_id)
);
```

**And** un trigger `after_player_badge_insert` est créé :
```sql
-- Quand un badge est inséré dans player_badges :
-- 1. Insère automatiquement dans player_points_ledger
-- 2. Incrémente player_progress.total_points (cache)
CREATE OR REPLACE FUNCTION fn_badge_awarded_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_points INTEGER;
BEGIN
  SELECT points INTO v_points FROM badge_definitions WHERE id = NEW.badge_id;
  IF v_points > 0 THEN
    INSERT INTO player_points_ledger
      (tenant_id, child_id, event_type, ref_id, points_delta)
    VALUES
      (NEW.tenant_id, NEW.child_id, 'BADGE_AWARDED', NEW.badge_id, v_points);
    UPDATE player_progress
      SET total_points = total_points + v_points, updated_at = now()
      WHERE child_id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER after_player_badge_insert
  AFTER INSERT ON player_badges
  FOR EACH ROW EXECUTE FUNCTION fn_badge_awarded_ledger();
```

**And** la RPC `award_badge_if_applicable(child_id, event_type, ref_id, context JSONB)` est créée (SECURITY DEFINER) :
  - Détermine quels badges sont applicables selon `event_type` et `context` (streak, theme_id, etc.)
  - Pour chaque badge applicable : `INSERT INTO player_badges ... ON CONFLICT DO NOTHING` (idempotency)
  - Le trigger se charge du ledger — la RPC n'écrit jamais directement dans `player_points_ledger`
  - Retourne `{ badges_awarded: [{ badge_id, code, label, points }] }`

**And** une seed de badges de base est insérée pour chaque tenant :
  - `FIRST_ACQUIRED` (10 pts) — 1ère maîtrise de l'enfant
  - `EARLY_BIRD` (25 pts) — maîtrise acquise dans les 72h post-séance
  - `STREAK_3` (30 pts) — 3 séances consécutives avec ≥ 1 acquired
  - `STREAK_7` (75 pts) — 7 séances consécutives
  - `SKILL_REVALIDATED` (30 pts) — revalidation réussie

**And** RLS activé sur toutes ces tables :
  - `badge_definitions`, `avatar_items`, `skill_cards` : SELECT pour tous les rôles du tenant, INSERT/UPDATE/DELETE pour admin uniquement
  - `player_badges`, `player_points_ledger`, `player_unlocked_items`, `player_skill_cards` : SELECT limité à `child_id = auth.uid()` pour role='child', à ses enfants pour role='parent', toutes du tenant pour coach/admin
  - `player_points_ledger` : aucun UPDATE ni DELETE autorisé même pour admin (append-only enforced par RLS)

**And** `supabase db diff` reste clean après migration

**And** les critères d'acceptation fonctionnels MVP sont vérifiables :
  - Un Admin peut créer un badge avec un code, un label et une valeur en points
  - Un badge ne peut être attribué qu'une seule fois par enfant (`UNIQUE(child_id, badge_id)`)
  - L'attribution d'un badge écrit automatiquement une entrée ledger via trigger
  - `SELECT SUM(points_delta) FROM player_points_ledger WHERE child_id = X` retourne le score total exact
  - Aucun concept de niveau ou palier XP n'existe dans le schéma MVP

---

### Story 12.2 : Event Bus Gamification — Traitement des 4 Événements Déclencheurs

En tant que système,
Je veux une fonction centralisée `process_gamification_event()` qui traite les 4 événements déclencheurs et orchestre les mises à jour de tous les éléments de l'univers joueur,
Afin que chaque événement d'apprentissage produise exactement les bonnes récompenses, sans duplication, avec idempotency garantie.

**Acceptance Criteria:**

**Given** un des 4 événements survient dans le système :
  - `SESSION_CLOSED` (event_log.event_type = 'SESSION_CLOSED')
  - `QUIZ_MASTERED` (learning_attempt finalisé avec mastery_status = 'acquired')
  - `REVIEW_COMPLETED` (revalidation finalisée)
  - `EVALUATION_POSITIVE` (evaluation avec ≥ 1 signal 'positive' ou 'attention')

**When** la RPC `award_badge_if_applicable(child_id, event_type, ref_id, context JSONB, operation_id UUID)` est appelée
**Then** l'idempotency est vérifiée via `processed_operations` — si `operation_id` déjà traité, retourne `{idempotent: true}`

**And** selon `event_type`, les badges applicables sont déterminés et attribués via `INSERT INTO player_badges ON CONFLICT DO NOTHING` :

| Événement | Badges potentiels | Condition |
|---|---|---|
| `QUIZ_MASTERED` | `FIRST_ACQUIRED` | Premier acquired du child |
| `QUIZ_MASTERED` | `EARLY_BIRD` | `ended_at <= session.closed_at + 72h` |
| `QUIZ_MASTERED` | `STREAK_3` | `player_progress.current_streak >= 3` |
| `QUIZ_MASTERED` | `STREAK_7` | `player_progress.current_streak >= 7` |
| `SKILL_MASTERED` | `SKILL_REVALIDATED` | `attempt_type = 'revalidation'` |
| `SESSION_ATTENDED` | *(badges futurs définis par Admin)* | configurable |
| `COACH_AWARD` | badge_id fourni explicitement | Admin déclenche manuellement |
| `SPECIAL_EVENT` | badge_id fourni explicitement | Admin déclenche manuellement |

**And** après attribution de badge(s), `check_and_award_items(child_id)` vérifie les `avatar_items.unlock_condition` non encore débloquées :
  - `{ "type": "badge", "badge_code": X }` → vérifie `player_badges` pour ce code
  - `{ "type": "total_points", "min_points": N }` → vérifie `player_progress.total_points`
  - `{ "type": "themes_acquired", "count": N }` → vérifie `player_progress.themes_acquired_count`
  - Si condition remplie : `INSERT INTO player_unlocked_items ON CONFLICT DO NOTHING`

**And** après attribution de badge(s), `player_theme_mastery` est upsert selon l'événement :
  - `QUIZ_MASTERED` → `mastery_status = 'acquired'`, `first_acquired_at`
  - `SKILL_MASTERED` (revalidation) → `mastery_status = 'revalidated'`, `review_count++`
  - Skill card liée au thème attribuée si condition remplie (`INSERT INTO player_skill_cards ON CONFLICT DO NOTHING`)

**And** la RPC est SECURITY DEFINER avec `REVOKE ALL / GRANT EXECUTE TO authenticated`
**And** `award_badge_if_applicable()` est appelée par `finalize_attempt()` (Epic 8.4) et par `close_session()` (Epic 6.4) pour `SESSION_ATTENDED`
**And** aucune écriture directe dans `player_points_ledger` — le trigger `after_player_badge_insert` (Story 12.1) s'en charge
**And** retourne `{ badges_awarded: [{badge_id, code, label, points}], items_unlocked: [{item_id, slug}] }`

---

### Story 12.3 : Avatar System — Équipement & Items Débloquables

En tant qu'Enfant,
Je veux personnaliser mon avatar en équipant les items que j'ai débloqués grâce à ma progression pédagogique,
Afin de sentir que mon investissement dans l'apprentissage se traduit visuellement, de façon unique et méritée.

**Acceptance Criteria:**

**Given** un Enfant connecté sur son écran "Mon Univers"
**When** il ouvre la section "Avatar"
**Then** son avatar actuel est affiché avec les slots visuels (frame, background, accessory, effect, title)
**And** la galerie affiche tous les `avatar_items` du tenant :
  - **Débloqués** (`player_unlocked_items`) : équipables immédiatement
  - **Verrouillés** : affichés en grisé avec l'indice de déblocage (ex: "Atteins le niveau 5", "Obtiens le badge Streak 7")
  - **Jamais** de prix monétaire affiché — uniquement des conditions d'apprentissage

**And** l'équipement d'un item est immédiat (PUT `player_avatars`) et persisté — aucune confirmation requise
**And** un déblocage déclenche une animation de révélation + notification in-app "🎉 Nouvel item débloqué : [nom]"
**And** le score total est affiché : `player_progress.total_points` (cache) avec CTA "= SUM de tes badges"
**And** aucun niveau, palier XP ou barre de progression vers un niveau n'est affiché en MVP
**And** aucun item ne peut être acheté — `avatar_items` n'a aucun champ `price` ou `is_purchasable`
**And** RLS : un enfant ne peut équiper que ses propres items débloqués (`child_id = auth.uid()` sur `player_unlocked_items`)

---

### Story 12.4 : Quêtes Hebdomadaires — Attribution, Progression & Récompenses

En tant qu'Enfant (et système),
Je veux recevoir automatiquement des quêtes hebdomadaires adaptées à mon niveau et voir ma progression en temps réel,
Afin d'avoir un objectif concret chaque semaine qui encourage la participation et l'apprentissage sans pression.

**Acceptance Criteria:**

**Given** un Edge Function cron qui tourne chaque lundi à 6h
**When** une nouvelle semaine commence
**Then** la fonction `assign_weekly_quests(tenant_id)` :
  - Calcule `period_start = Monday` et `period_end = Sunday`
  - Pour chaque enfant actif du tenant, insère les quêtes `recurrence = 'weekly'` dans `player_quests` avec `status = 'active'` et `current_value = 0`
  - Ignore les enfants inactifs depuis > 30 jours (`player_progress.last_activity_at`)
  - Utilise `ON CONFLICT DO NOTHING` pour garantir l'idempotency

**And** les quêtes expirées (fin de période, `status = 'active'`) sont passées automatiquement en `status = 'expired'` par le même cron
**And** l'écran quêtes de l'enfant affiche pour la semaine en cours :
  - Nom de la quête + icône + description
  - Barre de progression : `current_value / target_value` (ex: "2 / 3 séances")
  - Badge récompense (avec ses points) à gagner à la complétion
  - Temps restant (ex: "3 jours restants")
**And** la progression est mise à jour en temps réel par `award_badge_if_applicable()` (Story 12.2) après chaque événement
**And** à la complétion d'une quête : animation in-app + badge attribué via `award_badge_if_applicable()` (le ledger est écrit par trigger — pas directement ici)
**Note MVP** : Le champ `xp_reward` de `quest_definitions` est conservé en schéma (Phase 2) mais vaut 0 pour tous les quêtes MVP — les points viennent uniquement des badges.
**And** une notification push est envoyée le dimanche soir si une quête active est à `current_value < target_value` : "Termine ta quête avant ce soir — il te reste [N] !"

---

### Story 12.5 : Carte de Progression Thème & Collection de Skill Cards

En tant qu'Enfant,
Je veux visualiser ma progression sur chaque thème du référentiel sous forme de carte visuelle, et collectionner des skill cards que j'obtiens en maîtrisant les thèmes,
Afin d'avoir une représentation concrète et motivante de ce que j'ai appris.

**Acceptance Criteria:**

**Given** un Enfant connecté sur son écran "Ma Progression"
**When** il ouvre la "Carte des Thèmes"
**Then** tous les thèmes accessibles (`filterByAudience` selon son `age_group` + `programs`) sont affichés en grille ou carte visuelle avec leur statut dérivé de `player_theme_mastery` :
  - `not_started` → grisé, icône cadenas
  - `in_progress` → cercle de progression partiel animé
  - `acquired` → ✅ badge vert + date d'acquisition + skill card débloquée (si applicable)
  - `revalidated` → ✅✅ badge or + date de revalidation

**And** le détail d'un thème affiche :
  - Nom + description + niveau (débutant/intermédiaire/avancé)
  - Statut de maîtrise + historique des tentatives (sans `mastery_percent` visible pour l'enfant)
  - Skill card associée : image + rareté + statut (collectée / à débloquer)
  - CTA "Revalider" si `review_due_at <= now()` (révision espacée Epic 8.4)

**And** la **collection de skill cards** est accessible depuis l'écran principal :
  - Grille de toutes les `skill_cards` du tenant (filtrées par audience)
  - Cartes collectées (`player_skill_cards`) : affichées en couleur + rareté animée
  - Cartes non collectées : silhouette avec condition de déblocage ("Maîtrise [thème]")
  - Tri par rareté (legendary > epic > rare > common)

**And** débloquer une skill card `legendary` déclenche une animation plein écran et une notification push parent : "[Prénom] a débloqué une skill card légendaire : [nom] !"
**And** `player_theme_mastery` est mis à jour par `process_gamification_event()` (Story 12.2) — la carte est toujours à jour après chaque tentative
**And** RLS : un enfant voit uniquement ses propres `player_theme_mastery` et `player_skill_cards` ; le catalogue (`skill_cards`, `quest_definitions`, `avatar_items`) est lisible en SELECT par tous les rôles du tenant

---

## Epic 9 : Dashboard Admin & Pilotage Multi-implantations

Un Admin supervise plusieurs implantations (sites physiques) depuis un tableau de bord agrégé : taux de présence, résultats d'évaluation, progression quiz par implantation. Il détecte les anomalies (séances non clôturées, absentéisme élevé, coaches sans feedback), compare les implantations sur des métriques anonymisées, gère le CRUD des implantations/groupes/assignations, et peut contacter un coach directement depuis l'interface (tracé audit).
**FRs couverts :** FR40–FR45, FR50–FR52, FR-A1–FR-A6
**Dépendances :** Epic 4, Epic 6, Epic 8
**Note** : `audit_logs` est créée en Story 1.2 (Foundation) — aucune dépendance vers Epic 10 pour cette table.

### Story 9.1 : Dashboard Agrégé Multi-implantations

En tant qu'Admin,
Je veux visualiser un tableau de bord consolidé affichant les KPIs de chaque implantation (taux de présence, évaluations, maîtrise quiz),
Afin de piloter l'ensemble des sites sans consulter chaque implantation individuellement.

**Acceptance Criteria:**

**Given** un Admin connecté sur l'écran "Tableau de Bord"
**When** il charge la vue multi-implantations avec un filtre période (semaine / mois / trimestre)
**Then** chaque implantation (issue de `implantations`, créées en Story 9.4) affiche :
  - **Taux de présence** : `COUNT(attendances WHERE status='present') / COUNT(attendances) * 100` pour la période
  - **Score évaluation moyen** : distribution `receptivite` (% positive, % attention, % none) depuis `session_evaluations_merged`
  - **Taux de maîtrise quiz** : `COUNT(learning_attempts WHERE mastery_status='acquired') / COUNT(learning_attempts) * 100`
  - **Nombre de séances** tenues vs planifiées (sessions `status='terminée'` vs total)

**And** les métriques sont calculées via la vue SQL `implantation_dashboard_stats` :
```sql
CREATE OR REPLACE VIEW implantation_dashboard_stats AS
SELECT
  i.id                    AS implantation_id,
  i.name                  AS implantation_name,
  i.tenant_id,
  COUNT(DISTINCT s.id)    AS sessions_total,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'terminée') AS sessions_closed,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'present')::numeric
    / NULLIF(COUNT(a.id), 0) * 100
  ) AS attendance_rate_pct,
  ROUND(
    COUNT(la.id) FILTER (WHERE la.mastery_status = 'acquired')::numeric
    / NULLIF(COUNT(la.id), 0) * 100
  ) AS mastery_rate_pct
FROM implantations i
LEFT JOIN sessions s
  ON s.implantation_id = i.id
  AND s.tenant_id      = i.tenant_id
LEFT JOIN session_attendees sa ON sa.session_id = s.id
LEFT JOIN attendances a        ON a.session_id  = s.id AND a.tenant_id = i.tenant_id
LEFT JOIN learning_attempts la ON la.session_id = s.id AND la.tenant_id = i.tenant_id
GROUP BY i.id, i.name, i.tenant_id;

-- RLS sur la vue (héritée des tables sous-jacentes)
ALTER VIEW implantation_dashboard_stats OWNER TO authenticated;
```

**And** un clic sur une implantation affiche le détail : liste des séances de la période, coaches actifs, groupes rattachés
**And** le filtre période est appliqué côté client via paramètre de requête `?from=&to=` transmis au RPC `get_implantation_stats(p_from, p_to)`
**And** RLS : seul un Admin (`current_user_role() = 'admin'`) peut lire `implantation_dashboard_stats` ; un Coach voit uniquement les implantations auxquelles il est assigné via `coach_implantation_assignments`
**And** FR40 est couvert : Admin accède aux métriques agrégées multi-implantations
**And** `supabase db diff` reste clean après migration

---

### Story 9.2 : Détection Anomalies

En tant qu'Admin,
Je veux être alerté automatiquement lorsque des anomalies sont détectées (séances non clôturées après délai, absentéisme élevé, coaches sans feedback post-séance),
Afin d'intervenir rapidement avant que les situations ne se dégradent.

**Acceptance Criteria:**

**Given** un Edge Function `detect-anomalies` planifié quotidiennement (CRON via Supabase `pg_cron`)
**When** la détection est exécutée
**Then** les anomalies suivantes sont identifiées et insérées dans `anomaly_events` :

```sql
CREATE TABLE anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  anomaly_type TEXT NOT NULL
    CHECK (anomaly_type IN (
      'session_not_closed',
      'high_absenteeism',
      'coach_feedback_missing',
      'no_session_activity'
    )),
  severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info','warning','critical')),
  resource_type TEXT NOT NULL,  -- 'session' | 'player' | 'coach' | 'implantation'
  resource_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON anomaly_events
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON anomaly_events
  FOR ALL USING (current_user_role() = 'admin');
```

**And** les règles de détection sont :
  - `session_not_closed` : `sessions WHERE status != 'terminée' AND planned_end_at < now() - INTERVAL '4 hours'`
  - `high_absenteeism` : joueur avec taux d'absence > 40 % sur les 4 dernières séances de son groupe
  - `coach_feedback_missing` : `sessions WHERE status='terminée' AND NOT EXISTS (SELECT 1 FROM coach_session_notes WHERE session_id = sessions.id)` après délai configurable (défaut 24h)
  - `no_session_activity` : implantation sans aucune séance planifiée depuis 14 jours

**And** les anomalies sont affichées dans un panneau "Anomalies" sur le dashboard avec filtres par type, sévérité, implantation
**And** l'Admin peut marquer une anomalie comme résolue (`resolved_at = now()`, `resolved_by = current user`) — action tracée dans `audit_logs` (créée en Story 1.2)
**And** une notification push est envoyée à l'Admin à la création d'une anomalie `severity='critical'` via le système de notifications (Story 7.1), `event_type = 'anomaly_critical'`, `channel = 'push'`
**And** `ON CONFLICT (tenant_id, anomaly_type, resource_id) WHERE resolved_at IS NULL DO NOTHING` sur `anomaly_events` pour éviter les doublons quotidiens
**And** FR41 est couvert : détection proactive des anomalies opérationnelles
**And** `supabase db diff` reste clean après migration

---

### Story 9.3 : Comparaison Inter-implantations

En tant qu'Admin,
Je veux comparer les performances entre implantations sur des métriques anonymisées (pas de noms de joueurs ni de coaches),
Afin d'identifier les meilleures pratiques et les implantations nécessitant un soutien.

**Acceptance Criteria:**

**Given** un Admin sur l'écran "Comparaison Inter-implantations"
**When** il sélectionne une période et des métriques (présence, évaluation, maîtrise, taux de clôture séance)
**Then** un tableau comparatif est affiché avec une ligne par implantation :
  - Nom de l'implantation
  - Métriques sélectionnées (issues de `implantation_dashboard_stats`)
  - Classement relatif (1ᵉʳ / dernier / médiane) calculé côté client

**And** aucun nom de joueur, parent ou coach individuel n'apparaît dans la vue comparaison — seuls les agrégats par implantation sont exposés
**And** un RPC `get_comparison_report(p_from, p_to, p_metric_keys TEXT[])` retourne le JSON anonymisé :
```sql
CREATE OR REPLACE FUNCTION get_comparison_report(
  p_from TIMESTAMPTZ,
  p_to   TIMESTAMPTZ,
  p_metric_keys TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
  v_role      user_role := current_user_role();
BEGIN
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé — rôle admin requis';
  END IF;
  -- Retourne agrégats par implantation filtrés par période et tenant
  RETURN (
    SELECT jsonb_agg(row_to_json(stats))
    FROM implantation_dashboard_stats stats
    WHERE stats.tenant_id = v_tenant_id
  );
END;
$$;
REVOKE ALL ON FUNCTION get_comparison_report FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_comparison_report TO authenticated;
```

**And** le rapport est exportable en CSV (via Edge Function `export-comparison-report`) avec les mêmes règles d'anonymisation
**And** FR42 est couvert : comparaison inter-implantations sur métriques anonymisées
**And** `supabase db diff` reste clean après migration

---

### Story 9.4 : CRUD Implantations, Groupes & Assignations Coaches

En tant que développeur,
Je veux créer le modèle de données et les APIs CRUD pour les implantations, les groupes de joueurs et les assignations coaches,
Afin que l'Admin puisse structurer l'organisation physique et humaine de son club.

**Acceptance Criteria:**

**Given** la migration Story 9.4 est exécutée
**When** les tables sont créées
**Then** le schéma est le suivant :

```sql
-- Sites physiques du club
CREATE TABLE implantations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  name           TEXT NOT NULL,
  address        TEXT,
  city           TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE implantations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON implantations
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON implantations
  FOR INSERT WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "admin_update" ON implantations
  FOR UPDATE USING (current_user_role() = 'admin');

-- Groupes de joueurs (coaching groups) par implantation
CREATE TABLE groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  implantation_id  UUID NOT NULL REFERENCES implantations(id),
  name             TEXT NOT NULL,
  age_group        TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON groups
  FOR ALL USING (tenant_id = current_tenant_id());

-- Membres des groupes (joueurs assignés)
CREATE TABLE group_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES profiles(user_id),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at       TIMESTAMPTZ,
  UNIQUE (group_id, player_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON group_members
  FOR ALL USING (tenant_id = current_tenant_id());

-- Assignations coaches ↔ implantations
CREATE TABLE coach_implantation_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  coach_id         UUID NOT NULL REFERENCES profiles(user_id),
  implantation_id  UUID NOT NULL REFERENCES implantations(id),
  assigned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at    TIMESTAMPTZ,
  UNIQUE (coach_id, implantation_id)
);
ALTER TABLE coach_implantation_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON coach_implantation_assignments
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON coach_implantation_assignments
  FOR ALL USING (current_user_role() = 'admin');

-- Référence implantation sur sessions (colonne ajoutée)
ALTER TABLE sessions ADD COLUMN implantation_id UUID REFERENCES implantations(id);
```

**And** un RPC `bulk_assign_group_members(p_group_id UUID, p_player_ids UUID[])` permet d'importer en lot :
```sql
CREATE OR REPLACE FUNCTION bulk_assign_group_members(p_group_id UUID, p_player_ids UUID[])
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
  v_count     INT;
BEGIN
  IF current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  INSERT INTO group_members (tenant_id, group_id, player_id)
  SELECT v_tenant_id, p_group_id, unnest(p_player_ids)
  ON CONFLICT (group_id, player_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION bulk_assign_group_members FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bulk_assign_group_members TO authenticated;
```

**And** l'Admin peut créer/modifier/désactiver (`is_active = false`) une implantation ou un groupe depuis l'UI — les suppressions sont soft uniquement
**And** un Coach voit les implantations auxquelles il est assigné (via `coach_implantation_assignments`) en lecture seule
**And** FR43–FR44 sont couverts : CRUD structure organisationnelle + assignations coaches
**And** `supabase db diff` reste clean après migration

---

### Story 9.5 : Contact Direct Coach

En tant qu'Admin,
Je veux envoyer un message direct à un coach (push + message interne) depuis le tableau de bord, avec traçabilité complète,
Afin de communiquer rapidement sans sortir de l'application.

**Acceptance Criteria:**

**Given** un Admin sur le profil ou la liste d'un coach
**When** il utilise le formulaire "Contacter ce coach" (champ message, niveau urgence : routine/urgent)
**Then** une notification push est envoyée au coach via le système existant (Story 7.1) :
  - `event_type = 'admin_message'`
  - `channel = 'push'` (+ `email` si `urgency = 'urgent'`)
  - `payload JSONB` contient `{ "message": "...", "from_admin_id": "..." }`
  - Contrainte d'idempotence sur `notification_send_logs` avec `reference_id = admin_message.id`

**And** le message est stocké dans `admin_messages` :
```sql
CREATE TABLE admin_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  sender_id    UUID NOT NULL REFERENCES profiles(user_id),
  recipient_id UUID NOT NULL REFERENCES profiles(user_id),
  message      TEXT NOT NULL CHECK (char_length(message) <= 2000),
  urgency      TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine','urgent')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON admin_messages
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_sender" ON admin_messages
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND sender_id = auth.uid());
CREATE POLICY "recipient_read" ON admin_messages
  FOR SELECT USING (recipient_id = auth.uid() OR current_user_role() = 'admin');
```

**And** chaque envoi est tracé dans `audit_logs` (créée en Story 1.2) avec `action = 'admin_message_sent'`, `entity_type = 'coach'`, `entity_id = recipient_id`
**And** le coach reçoit le message dans un fil "Messages de l'Admin" dans l'app (lecture des `admin_messages WHERE recipient_id = auth.uid()`)
**And** un Admin peut consulter l'historique de tous ses messages envoyés, filtré par coach et période
**And** FR45 est couvert : contact direct coach tracé dans audit
**And** `supabase db diff` reste clean après migration

---

## Epic 10 : Conformité RGPD & Gestion Cycle de Vie Utilisateur

Toutes les données personnelles des joueurs (mineurs) sont soumises au RGPD. L'Admin gère le cycle de vie complet des utilisateurs (activation, suspension, suppression), les consentements parentaux avec révocation en cascade, les droits d'accès/export/effacement des parents, un audit trail complet conservé ≥ 5 ans, et les exports de données conformes aux obligations légales.
**FRs couverts :** FR53–FR60, FR-R1–FR-R8
**Dépendances :** Epic 2 (profils), Epic 7 (notifications)

### Story 10.1 : Cycle de Vie Utilisateur

En tant qu'Admin,
Je veux gérer le cycle de vie complet d'un utilisateur (création → activation → suspension → suppression douce),
Afin d'assurer que seuls les utilisateurs actifs accèdent à l'application et que les données sont correctement archivées.

**Acceptance Criteria:**

**Given** la migration Story 10.1 est exécutée
**When** les tables et fonctions sont créées
**Then** `profiles` reçoit une colonne `status` :
```sql
ALTER TABLE profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending','active','suspended','pending_deletion','deleted'));

-- Journal immuable des événements de cycle de vie
CREATE TABLE user_lifecycle_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID NOT NULL REFERENCES profiles(user_id),
  event_type  TEXT NOT NULL
    CHECK (event_type IN (
      'created','activated','suspended','reactivated',
      'deletion_requested','deleted','data_exported'
    )),
  actor_id    UUID REFERENCES profiles(user_id),  -- NULL si système
  reason      TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON user_lifecycle_events
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON user_lifecycle_events
  FOR ALL USING (current_user_role() = 'admin');
-- INSERT seul ; pas de UPDATE ni DELETE (immuable)
CREATE POLICY "no_update" ON user_lifecycle_events
  FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON user_lifecycle_events
  FOR DELETE USING (false);
```

**And** les RPCs de cycle de vie sont :
```sql
CREATE OR REPLACE FUNCTION suspend_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'suspended' WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id, reason)
  VALUES (current_tenant_id(), p_user_id, 'suspended', auth.uid(), p_reason);
END;
$$;

CREATE OR REPLACE FUNCTION request_user_deletion(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE profiles SET status = 'pending_deletion' WHERE user_id = p_user_id AND tenant_id = current_tenant_id();
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id)
  VALUES (current_tenant_id(), p_user_id, 'deletion_requested', auth.uid());
  -- La suppression effective est réalisée par un Edge Function après délai de rétractation de 30 jours
END;
$$;

REVOKE ALL ON FUNCTION suspend_user, request_user_deletion FROM PUBLIC;
GRANT EXECUTE ON FUNCTION suspend_user, request_user_deletion TO authenticated;
```

**And** un utilisateur avec `status = 'suspended'` ou `'deleted'` ne peut pas se connecter — RLS global : `AND profiles.status = 'active'` ajouté aux policies existantes
**And** la suppression effective (après 30 jours) anonymise les données personnelles (name → 'Supprimé', email → NULL) et conserve les événements anonymisés pour intégrité statistique
**And** FR53 est couvert : cycle de vie complet avec traçabilité immuable
**And** `supabase db diff` reste clean après migration

---

### Story 10.2 : Consentements Parentaux & Révocation en Cascade

En tant que Parent,
Je veux gérer mes consentements (photos/vidéos, traitement données, partage clubs) et pouvoir les révoquer à tout moment,
Afin d'exercer mon droit de contrôle sur les données personnelles de mon enfant.

**Acceptance Criteria:**

**Given** la migration Story 10.2 est exécutée
**When** les tables sont créées
**Then** le schéma de consentements est :
```sql
CREATE TYPE consent_type AS ENUM (
  'photos_videos',
  'data_processing',
  'marketing',
  'sharing_clubs'
);

CREATE TABLE consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  parent_id    UUID NOT NULL REFERENCES profiles(user_id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  consent_type consent_type NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,  -- version du texte de consentement
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, parent_id, child_id, consent_type)
    DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON consents
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "parent_own" ON consents
  FOR ALL USING (parent_id = auth.uid() OR current_user_role() = 'admin');
```

**And** un RPC `revoke_consent(p_child_id UUID, p_consent_type consent_type)` :
  - Met à jour `consents.revoked_at = now()` et `granted = false`
  - Déclenche la mise en `status = 'archived'` de tous les `media` (table Epic 13) liés à l'enfant si `consent_type = 'photos_videos'`
  - Insère un événement `'consent_revoked'` dans `user_lifecycle_events`
  - Tracé dans `audit_logs`

**And** un nouveau consentement est demandé au Parent lors de chaque mise à jour de version du texte (incrément `version`) — notification push envoyée
**And** l'écran "Mes Consentements" affiche pour chaque enfant : type, statut (accordé/révoqué), date, version du texte avec lien vers le texte complet
**And** FR54–FR55 sont couverts : gestion consentements + révocation cascade médias
**And** `supabase db diff` reste clean après migration

---

### Story 10.3 : Droits RGPD Parent (Accès, Rectification, Effacement, Portabilité)

En tant que Parent,
Je veux exercer mes droits RGPD (accéder à mes données, les rectifier, demander leur effacement ou leur portabilité) depuis l'application,
Afin que le club respecte ses obligations légales sans nécessiter d'intervention manuelle longue.

**Acceptance Criteria:**

**Given** la migration Story 10.3 est exécutée
**When** les tables sont créées
**Then** le schéma de requêtes RGPD est :
```sql
CREATE TYPE gdpr_request_type AS ENUM (
  'access',        -- export de toutes les données
  'rectification', -- correction données inexactes
  'erasure',       -- droit à l'oubli
  'portability'    -- export machine-readable JSON
);

CREATE TABLE gdpr_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  requester_id   UUID NOT NULL REFERENCES profiles(user_id),  -- le parent
  target_id      UUID NOT NULL REFERENCES profiles(user_id),  -- l'enfant ou le parent lui-même
  request_type   gdpr_request_type NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','rejected')),
  rejection_reason TEXT,
  payload        JSONB,    -- résultat de l'export (accès / portabilité)
  file_url       TEXT,     -- lien signé S3 pour les exports volumineux
  processed_at   TIMESTAMPTZ,
  processed_by   UUID REFERENCES profiles(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON gdpr_requests
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "parent_own" ON gdpr_requests
  FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "admin_manage" ON gdpr_requests
  FOR ALL USING (current_user_role() = 'admin');
```

**And** un RPC `submit_gdpr_request(p_target_id UUID, p_type gdpr_request_type)` :
  - Insère dans `gdpr_requests` avec `status = 'pending'`
  - Envoie une notification push à l'Admin : "Nouvelle demande RGPD [type] reçue"
  - Tracé dans `audit_logs`

**And** l'Admin traite les demandes depuis le panneau "Demandes RGPD" :
  - `access` / `portability` → Edge Function `generate-gdpr-export` produit un JSON complet (profil, consentements, évaluations, présences, tickets) et stocke dans `gdpr_requests.file_url` (lien signé 72h)
  - `erasure` → déclenche `request_user_deletion()` (Story 10.1)
  - `rectification` → Admin modifie les champs concernés, marque la demande `completed`

**And** le délai légal de traitement (30 jours) est visible dans l'UI — une alerte anomalie (Story 9.2) est créée si `status = 'pending'` après 25 jours
**And** FR56–FR59 sont couverts : accès, rectification, effacement, portabilité RGPD
**And** `supabase db diff` reste clean après migration

---

### Story 10.4 : Audit Trail Admin — Policies Complètes, Indexes & Rétention

En tant qu'Admin,
Je veux que le journal d'audit soit pleinement opérationnel avec des policies RLS strictes, des indexes performants, une durée de conservation configurable et une interface de consultation,
Afin de démontrer la conformité RGPD et de retracer tout incident de sécurité.

**Note** : La table `audit_logs` est créée en Story 1.2 (Foundation) avec le schéma complet. Cette story ajoute les policies complètes, indexes, table de rétention, UI et purge.

**Acceptance Criteria:**

**Given** la table `audit_logs` existante (Story 1.2) avec RLS activé et policy `tenant_isolation` de base
**When** la migration Story 10.4 est exécutée
**Then** les policies RLS complètes sont ajoutées :
```sql
-- Remplace "insert_only_base" par un jeu de policies complet et immuable
DROP POLICY IF EXISTS "insert_only_base" ON audit_logs;

CREATE POLICY "admin_read" ON audit_logs
  FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "insert_only" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "no_update" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON audit_logs FOR DELETE USING (false);

-- Index pour filtrage UI performant
CREATE INDEX IF NOT EXISTS audit_logs_tenant_user
  ON audit_logs (tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity
  ON audit_logs (tenant_id, entity_type, entity_id);

-- Durée de conservation configurable par tenant (défaut 5 ans)
CREATE TABLE tenant_retention_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id),
  retention_years INTEGER NOT NULL DEFAULT 5 CHECK (retention_years >= 5),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenant_retention_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_retention_settings
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_write" ON tenant_retention_settings
  FOR ALL USING (current_user_role() = 'admin');
```

**And** une Edge Function `purge-expired-audit-logs` (planifiée mensuellement via `pg_cron`) supprime les entrées dont `created_at < now() - (retention_years || ' years')::INTERVAL` — seule exception autorisée à l'immuabilité
**And** l'UI "Journal d'Audit" permet de filtrer par : utilisateur (`user_id`), action, type d'entité (`entity_type`), plage de dates
**And** l'export du journal est disponible en CSV via l'Edge Function `export-audit-logs` (tracé dans `audit_logs` lui-même : `action = 'audit_exported'`)
**And** une `INSERT INTO audit_logs` est effectuée systématiquement par toutes les RPCs sensibles : `suspend_user`, `revoke_consent`, `submit_gdpr_request`, `bulk_assign_group_members`, `admin_message_sent`, `anomaly_resolved`
**And** FR99–FR100 sont couverts : audit trail complet filtrable, conservation ≥ 5 ans indépendante des données enfants
**And** `supabase db diff` reste clean après migration

---

### Story 10.5 : Exports Conformes

En tant qu'Admin,
Je veux générer des exports de données filtrées par consentements et anonymisées pour les usages inter-implantations ou réglementaires,
Afin de partager des données en toute légalité et conformité RGPD.

**Acceptance Criteria:**

**Given** un Admin sur l'écran "Exports"
**When** il configure un export (type, période, périmètre : implantation(s) sélectionnées)
**Then** un job d'export est créé dans `export_jobs` :
```sql
CREATE TABLE export_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  requested_by  UUID NOT NULL REFERENCES profiles(user_id),
  export_type   TEXT NOT NULL
    CHECK (export_type IN (
      'attendance_report',
      'evaluation_report',
      'mastery_report',
      'gdpr_personal_data',
      'cross_implantation_anonymous'
    )),
  filters       JSONB NOT NULL DEFAULT '{}',  -- {from, to, implantation_ids, group_ids}
  status        TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','ready','failed','expired')),
  file_url      TEXT,
  file_format   TEXT NOT NULL DEFAULT 'csv' CHECK (file_format IN ('csv','json')),
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON export_jobs
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON export_jobs
  FOR ALL USING (current_user_role() = 'admin');
```

**And** l'Edge Function `generate-export` traite les jobs en file :
  - `cross_implantation_anonymous` : aucun nom de joueur/coach — uniquement IDs hachés (SHA-256 + sel tenant), agrégats numériques
  - `gdpr_personal_data` : données de l'enfant filtrées par `consents.granted = true` — champs non consentis exclus
  - Fichier stocké sur Supabase Storage (bucket privé), lien signé 48h inséré dans `export_jobs.file_url`
  - `expires_at = now() + INTERVAL '48 hours'`

**And** le lien expire automatiquement — un cron `expire-export-jobs` passe `status = 'expired'` et supprime le fichier Storage après `expires_at`
**And** chaque export est tracé dans `audit_logs` (`action = 'export_generated'`, `metadata = {export_type, filters}`)
**And** FR-R7–FR-R8 sont couverts : exports conformes filtrés par consentements + anonymisation inter-implantations
**And** `supabase db diff` reste clean après migration

---

## Epic 11 : Grades Coach & Partenariats Clubs

Le système de grades récompense la progression pédagogique des coaches (Bronze → Argent → Or → Platine) avec un historique immuable et des permissions de contenu adaptées au grade. Les partenariats clubs permettent à des clubs partenaires d'accéder à une partie du référentiel pédagogique avec des droits configurables et un journal d'accès complet.
**FRs couverts :** FR61–FR67
**Dépendances :** Epic 2 (RBAC), Epic 3 (référentiel)

### Story 11.1 : Grades Coach & Historique Immuable

En tant qu'Admin,
Je veux attribuer et consulter les grades pédagogiques d'un coach (Bronze/Argent/Or/Platine) avec un historique complet et immuable,
Afin de valoriser la progression et de conditionner l'accès au contenu avancé au niveau atteint.

**Acceptance Criteria:**

**Given** la migration Story 11.1 est exécutée
**When** les tables sont créées
**Then** le schéma de grades est :
```sql
CREATE TYPE coach_grade_level AS ENUM ('bronze','silver','gold','platinum');

CREATE TABLE coach_grades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  coach_id     UUID NOT NULL REFERENCES profiles(user_id),
  grade_level  coach_grade_level NOT NULL,
  awarded_by   UUID NOT NULL REFERENCES profiles(user_id),
  awarded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Immuable : historique append-only
ALTER TABLE coach_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON coach_grades
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_insert" ON coach_grades
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND awarded_by = auth.uid());
CREATE POLICY "read_own_or_admin" ON coach_grades
  FOR SELECT USING (coach_id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "no_update" ON coach_grades FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON coach_grades FOR DELETE USING (false);

-- Vue grade courant (dernière attribution par coach)
CREATE VIEW coach_current_grade AS
SELECT DISTINCT ON (tenant_id, coach_id)
  tenant_id, coach_id, grade_level, awarded_by, awarded_at, notes
FROM coach_grades
ORDER BY tenant_id, coach_id, awarded_at DESC;

-- Helper RLS : grade du user courant
CREATE OR REPLACE FUNCTION current_user_grade()
RETURNS coach_grade_level LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT grade_level
  FROM coach_current_grade
  WHERE tenant_id = current_tenant_id() AND coach_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION current_user_grade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_grade() TO authenticated;
```

**And** l'Admin attribue un grade via l'UI "Profil Coach → Attribuer un grade" — un nouveau `coach_grades` est inséré (l'ancien reste dans l'historique)
**And** l'historique complet est visible dans l'onglet "Grades" du profil coach : liste chronologique grade/date/attribué par/notes
**And** une notification push est envoyée au coach lors de l'attribution : "Félicitations ! Vous avez obtenu le grade [grade_level]"
**And** chaque attribution est tracée dans `audit_logs` (`action = 'coach_grade_awarded'`)
**And** FR61–FR62 sont couverts : grades immuables + historique complet
**And** `supabase db diff` reste clean après migration

---

### Story 11.2 : Permissions de Contenu par Grade

En tant que Coach,
Je veux accéder au contenu du référentiel pédagogique correspondant à mon grade (Bronze : contenu de base ; Platine : contenu avancé complet),
Afin que l'accès aux ressources avancées soit conditionné à la progression réelle.

**Acceptance Criteria:**

**Given** un Coach connecté avec un grade attribué (via `coach_current_grade`)
**When** il navigue dans le référentiel (thèmes, situations, critères, quiz)
**Then** il ne voit que le contenu dont `required_grade_level` est ≤ à son grade courant :

```sql
-- Colonne de grade minimum sur les thèmes et situations
ALTER TABLE themes ADD COLUMN required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';
ALTER TABLE situations ADD COLUMN required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';

-- Ordre des grades pour comparaison
CREATE OR REPLACE FUNCTION grade_rank(g coach_grade_level) RETURNS INT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE g
    WHEN 'bronze'   THEN 1
    WHEN 'silver'   THEN 2
    WHEN 'gold'     THEN 3
    WHEN 'platinum' THEN 4
  END;
$$;

-- RLS étendue sur themes : filtre par grade si Coach
CREATE POLICY "grade_access_themes" ON themes
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('admin')
      OR grade_rank(required_grade_level) <= grade_rank(current_user_grade())
    )
  );

CREATE POLICY "grade_access_situations" ON situations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() IN ('admin')
      OR grade_rank(required_grade_level) <= grade_rank(current_user_grade())
    )
  );
```

**And** l'Admin peut configurer le `required_grade_level` de chaque thème et situation depuis le back-office référentiel (Story 3 UI)
**And** un contenu avec `required_grade_level = 'gold'` est affiché "verrouillé" (cadenas + "Requis : grade Or") pour un coach Bronze/Argent — visible mais non accessible
**And** lors de l'attribution d'un nouveau grade (Story 11.1), les restrictions RLS sont immédiatement effectives (stateless : calculé à chaque requête via `current_user_grade()`)
**And** FR63–FR64 sont couverts : permissions de contenu dynamiques par grade, mise à jour immédiate
**And** `supabase db diff` reste clean après migration

---

### Story 11.3 : Partenariats Clubs

En tant qu'Admin,
Je veux configurer des partenariats avec d'autres clubs (accès partiel à notre référentiel, niveau d'accès configurable) et consulter le journal des accès partenaires,
Afin de partager notre expertise pédagogique dans un cadre maîtrisé et traçable.

**Acceptance Criteria:**

**Given** la migration Story 11.3 est exécutée
**When** les tables sont créées
**Then** le schéma de partenariats est :
```sql
CREATE TYPE club_access_level AS ENUM (
  'read_catalogue',   -- thèmes + situations publics uniquement
  'read_bronze',      -- contenu grade Bronze
  'read_silver',      -- contenu grade Argent et inférieur
  'full_read'         -- tout le contenu du tenant partenaire
);

CREATE TABLE club_partnerships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),  -- tenant hôte (qui partage)
  partner_name    TEXT NOT NULL,
  partner_tenant_id UUID REFERENCES tenants(id),         -- NULL si club externe non-inscrit
  access_level    club_access_level NOT NULL DEFAULT 'read_catalogue',
  active_from     DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until    DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE club_partnerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON club_partnerships
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_manage" ON club_partnerships
  FOR ALL USING (current_user_role() = 'admin');

-- Journal des accès partenaires
CREATE TABLE club_access_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id   UUID NOT NULL REFERENCES club_partnerships(id),
  accessor_id      UUID NOT NULL REFERENCES profiles(user_id),
  resource_type    TEXT NOT NULL,  -- 'theme' | 'situation' | 'quiz_question'
  resource_id      UUID NOT NULL,
  accessed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE club_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read" ON club_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_partnerships cp
      WHERE cp.id = partnership_id AND cp.tenant_id = current_tenant_id()
    )
  );
```

**And** l'accès partenaire est conditionné à `active_from <= CURRENT_DATE AND (active_until IS NULL OR active_until >= CURRENT_DATE)` — vérifié à chaque requête (aucun cache côté serveur)
**And** chaque accès partenaire à un contenu est automatiquement loggé dans `club_access_logs` via un trigger `AFTER SELECT` sur les vues partenaires (ou via RPC dédiée `log_partner_access()`)
**And** l'Admin voit le tableau de bord partenariats : liste des clubs, niveau d'accès, date d'expiration, nombre d'accès sur 30 jours
**And** la modification du `access_level` ou de `active_until` est immédiatement effective (stateless RLS) — aucune action supplémentaire requise
**And** chaque création/modification de partenariat est tracée dans `audit_logs` (`action = 'partnership_created'` / `'partnership_updated'`)
**And** FR65–FR67 sont couverts : partenariats configurables + journal d'accès + mise à jour immédiate des droits
**And** `supabase db diff` reste clean après migration
