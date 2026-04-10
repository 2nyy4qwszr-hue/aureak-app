# Feature Scout — 2026-04-08 (post-Epic 75)

> Contexte : Post-sprint Epic 75 (stories 75-1, 75-4, 75-6 done). Mise à jour du scout du 08/04 matin.
> App : localhost:8081 non démarrée — analyse statique uniquement. Playwright skipped.
> Angle : impact des 3 stories `done` (75-1 bug completionStatus, 75-4 police évals, 75-6 Quiz QCM) sur la couverture PRD.

---

## Résumé de couverture PRD

- **FRs Phase 1 total** : 62
- **FRs Phase 1 implémentés (pleinement)** : 46 (~74%)
- **FRs Phase 1 partiels** : 6 (~10%)
- **FRs Phase 1 manquants** : 10 (~16%)
- **Couverture effective (done + partiel)** : ~84%
- **FRs Phase 2 débloqués** : 8 (inchangé)

> Delta vs scout 08/04 matin : +2 FRs passés de manquants → done (FR22/FR23 via story 75-6 ; FR57 amélioré via 75-1 qui corrigeait le stat card). Couverture passe de 81% → 84%.

---

## FRs Manquants — Phase 1 (priorité haute)

### FR10 — Vue coach : séances du jour (filtrées sur ses implantations)

**Description PRD :** Un Coach peut consulter la liste de ses séances du jour avec groupe, lieu et heure.

**Valeur :** Cœur du Sprint A MVP — adoption terrain dépend de cette vue. Sans filtre "mes séances du jour" le coach navigue parmi 50+ séances. KPI : ">95% séances avec check-in numérique à 3 mois".

**État réel :** Route `/coach/` avec layout. Routes `(coach)/coach/sessions/` présentes mais sans filtre `session_coaches.coach_id = auth.user.id` + date du jour. Aucun dashboard coach dédié.

**Complexité estimée :** Simple

**Story suggérée :** `story "Dashboard coach terrain : page /coach/home avec séances du jour filtrées sur coach_id = auth.user (via session_coaches JOIN), affichage groupe + lieu + heure + statut, bouton accès direct fiche séance → présences (FR10 + FR11)"`

---

### FR18 — Notification rappel J+1 données non synchronisées

**Description PRD :** Le système envoie une notification de rappel au Coach le lendemain si des données restent non synchronisées.

**Valeur :** Journey de Théo (Journey 3 PRD) — sans rappel J+1, un coach oublie de resynchroniser. Résultat : enfant marqué absent par erreur. Confiance dans le système détruite.

**État réel :** Edge Function `detect-anomalies` existe. Aucune fonction de rappel J+1 présences non-sync. Story 5-6 `done` (UX offline) mais sans cron de rappel.

**Complexité estimée :** Moyenne (cron Supabase + Edge Function)

**Story suggérée :** `story "Rappel J+1 données non synchronisées : Edge Function check-pending-sync déclenchée via pg_cron à 8h, identifie session_attendances avec status='pending' de la veille, envoie push FCM + inapp_notification au coach concerné (FR18)"`

---

### FR24 — Coach consulte résultats quiz de son groupe

**Description PRD :** Un Coach peut consulter les résultats de quiz de l'ensemble de son groupe.

**Valeur :** Permet au coach d'identifier les thèmes non maîtrisés avant la séance suivante. Ferme la boucle coach → pédagogie.

**État réel :** Story 75-6 (`done`) a implémenté l'UI quiz enfant. Backend `learning.ts` opérationnel. Aucune UI coach pour voir les résultats agrégés par groupe.

**Complexité estimée :** Simple (données disponibles via learning_mastery)

**Story suggérée :** `story "Vue coach résultats quiz groupe : section dans fiche séance /seances/[sessionId], tableau joueurs × score quiz + taux maîtrise par thème, appel listGroupQuizResults(sessionId, groupId) — aucune migration, données learning_mastery prêtes (FR24)"`

---

### FR29 / FR33 — Notifications push post-séance vers parents

**Description PRD :** Le système envoie une notification push au Parent à la clôture de chaque séance. Le système notifie le Parent pour faire compléter le quiz post-séance.

**Valeur :** Trigger d'engagement passif du parent. Sans notification, taux d'usage estimé < 20%. Objectif fondamental : "zéro WhatsApp de fin de séance".

**État réel :** Edge Function `notify-session-closed` existe (MEMORY). Web push FCM non intégré. Aucun badge in-app côté parent. Story 75-6 a créé la route quiz — mais sans trigger de notification le parent ne sait pas que le quiz l'attend.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Notifications push post-séance parent : activer l'Edge Function notify-session-closed vers FCM web push, badge in-app sidebar parent + toast 'Séance terminée pour [enfant]' + lien fiche enfant, notification secondaire 'Quiz disponible' 30min après clôture si quiz non soumis (FR29 + FR33)"`

---

### FR34 / FR35 — Board parent : onglet évaluations + graphe évolution

**Description PRD :** Un Parent peut consulter la fiche complète de son enfant (présences, évaluations, quiz). Un Parent peut visualiser l'évolution de son enfant dans le temps.

**Valeur :** Journey de Sophie (Journey 2 PRD) — promesse centrale côté parent. Critère de succès business : ">60% fiches avec ≥1 cycle complet".

**État réel :** Route `/parent/children/[childId]/` avec onglets (presences, football-history, badges, consents, progress, sessions). Onglet `progress` affiche mastery. Manque : évaluations coach (attitude/effort + commentaires) et graphe évolution temporelle présences/quiz.

**Complexité estimée :** Simple-Moyenne

**Story suggérée :** `story "Board parent — onglet Évaluations + graphe évolution : dans /parent/children/[childId], ajouter onglet 'Évaluations' (listEvaluationsByChild côté parent) avec attitude+effort+commentaire coach par séance, ajouter graphe linéaire SVG présence% sur 3 mois dans onglet 'Progression' — aucune migration (FR34 + FR35)"`

---

### FR30 — Push + email + SMS sur annulation urgente terrain

**Description PRD :** Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente.

**Valeur :** Canal critique — un parent non informé d'une annulation terrain = situation de crise. Triple canal = zéro information manquée.

**État réel :** Edge Function `cancel-session-notify` existe. SMS Twilio non intégré/activé. Email Resend partiellement configuré.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Annulation terrain triple canal : activer cancel-session-notify avec SMS Twilio (TWILIO_ACCOUNT_SID/AUTH_TOKEN dans .env), template SMS 160 chars, email Resend avec CTA, push FCM — tester avec séance statut 'annulée' (FR30)"`

---

### FR31 / FR32 — Tickets structurés parent ↔ admin/coach

**Description PRD :** Un Parent peut soumettre une demande structurée au staff. Un Coach ou Admin peut répondre aux tickets, réponse tracée.

**Valeur :** Remplace les messages WhatsApp informels par un canal auditable. Signal de qualité académie.

**État réel :** Story 7-4 `ready-for-dev`. Route `/tickets/` côté admin incomplète. Route parent `/parent/tickets/` absente.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Tickets parent : route /parent/tickets/new avec catégories (absence, question, signalement), submission → inapp_notifications coach/admin, réponse depuis /tickets/[ticketId] admin, statut ouvert/traité (FR31 + FR32)"`

---

### FR70 / FR71 — Admin crée questions quiz + génération auto depuis thèmes

**Description PRD :** Un Admin peut créer des questions de quiz associées à un thème. Le système génère automatiquement le quiz d'une séance à partir des thèmes.

**Valeur :** Condition nécessaire pour que le quiz enfant (FR22 — now done via 75-6) soit alimenté en questions réelles. Sans contenu, la feature quiz reste vide.

**État réel :** Tables `quiz_questions` créées (Epic 3 done). UI admin pour créer des questions dans `/methodologie/themes/[themeId]` absente. La génération auto du quiz dépend de `session_themes` JOIN `quiz_questions`.

**Complexité estimée :** Simple

**Story suggérée :** `story "Admin — gestion questions quiz par thème : dans /methodologie/themes/[themeId], section 'Questions quiz' avec CRUD (question + 4 choix + bonne réponse + explication), API createQuizQuestion/listQuizQuestions/deleteQuizQuestion dans api-client — aucune migration, tables prêtes (FR70 + FR78)"`

---

### FR5 — UI enfant accessible via compte parent

**Description PRD :** Un Enfant peut accéder à son profil via le compte de son parent jusqu'à 15-16 ans.

**Valeur :** Journey 5 (Lucas, 12 ans) — route quiz maintenant accessible (75-6 done), mais le mécanisme de "basculer en vue enfant" depuis le compte parent n'existe pas. La route quiz existe mais reste inaccessible dans le flux réel.

**État réel :** Routes `(child)/child/` existent (quiz done via 75-6, badges, progress, avatar). Mécanisme de passage contexte parent→enfant absent.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Accès enfant depuis compte parent : bouton 'Vue enfant' dans /parent/children/[childId], stockage enfant_id dans sessionStorage, redirect /child/quiz+badges+progress avec enfant_id, retour bouton 'Vue parent' — sans compte séparé jusqu'à 15 ans (FR5)"`

---

### FR72 / FR76 — Agrégation quiz par thème + progression par thème

**Description PRD :** Les résultats de quiz sont agrégés par thème pour analyse longitudinale. Le système calcule une progression par thème par enfant.

**Valeur :** Flywheel collectif du PRD — admin voit les thèmes non maîtrisés à l'échelle. Parent voit "Lucas progresse en Sortie au sol". Différenciateur vs concurrents.

**État réel :** Données dans `learning_mastery`. Story 75-6 done fournit les scores bruts. Vue `progress/index.tsx` dans board parent existe mais incomplète. Aucune vue admin agrégée cross-enfants.

**Complexité estimée :** Moyenne (dépend de données quiz réelles en production)

**Story suggérée :** À planifier après activation des questions quiz (FR70/FR71).

---

## Quick Wins identifiés (top 3 post-Epic 75)

| # | Feature | Valeur | Complexité | Story Factory |
|---|---------|--------|------------|---------------|
| 1 | Vue coach résultats quiz groupe | Quiz 75-6 done → donner au coach la vue d'ensemble → boucle coach fermée | Simple | `story "Vue coach résultats quiz groupe dans fiche séance : tableau joueurs × score + taux maîtrise thème, listGroupQuizResults(sessionId) (FR24)"` |
| 2 | Admin CRUD questions quiz par thème | Sans contenu le quiz 75-6 reste vide — débloque la valeur pédagogique réelle | Simple | `story "Admin CRUD questions quiz par thème : section dans /methodologie/themes/[themeId], 4 choix + bonne réponse + explication, API createQuizQuestion (FR70+FR71)"` |
| 3 | Board parent onglet Évaluations | Données dispo, effort = affichage seulement — complète la fiche enfant promise dans le PRD | Simple | `story "Board parent onglet Évaluations : listEvaluationsByChild dans /parent/children/[childId], attitude+effort+commentaire coach par séance (FR34 partiel)"` |

---

## Opportunités Phase 2 débloquées (prérequis Phase 1 satisfaits)

| FR | Titre | Prérequis satisfaits | Story Factory |
|----|-------|---------------------|---------------|
| FR36 | Vidéos autorisées côté parent (lecture seule) | Epics 3+4+10+11 ✅ | `story "Module vidéo Phase 2 : upload coach statut 'en attente', validation admin, streaming parent (FR25+FR28+FR36)"` |
| FR37 | Export PDF fiche enfant parent | Epic 10 ✅ + FR34 partiel | `story "Export PDF rapport enfant : jspdf A4, présences+évals+progression, bouton board parent (FR37)"` |
| FR38 | Export .ics séances parent | Epics 4+19 ✅ | `story "Export .ics séances : iCalendar depuis séances groupe enfant, bouton fiche joueur admin (FR38)"` |
| FR39 | Enfant consulte sa progression | Epic 8 ✅ + story 75-6 ✅ | `story "UI enfant progression : /child/progress avec badges+scores quiz+feedbacks, accessible via compte parent (FR39)"` |

---

## BLOCKERs ouverts impactant les features

| Blocker | FR impacté | Action requise |
|---------|-----------|----------------|
| B-PATROL-01 — Vue `v_club_gardien_stats` absente remote | Clubs — FR89 | `supabase db push` migration 00113 |
| B-CRAWLER-04 — Table `xp_ledger` absente remote | Gamification — FR40 Phase 2 | Push migration 00129 |
| Stories 75-2 / 75-5 open | UX + Design | Backlog prêt à implémenter |
| Stories 73-2/73-3/73-4/73-6/73-7 open | Design polish | Backlog prêt à implémenter |
| Story 65-7 open — `recordedBy` vide | FR15 / FR57 | Bug présences, fix 1 ligne |

---

## Couverture complète Phase 1 (mise à jour post-Epic 75)

| FR | Titre court | Phase | Statut |
|----|-------------|-------|--------|
| FR1 | Admin CRUD comptes tous rôles | 1 | ✅ done |
| FR2 | Coach accès implantations assignées | 1 | ✅ done |
| FR3 | Accès cross-implantation temporaire coach | 1 | ✅ done |
| FR4 | Parent accès enfant uniquement | 1 | ✅ done |
| FR5 | Enfant accès via compte parent | 1 | ⚠️ partiel — flux UI parent→enfant absent |
| FR6 | Parent gère consentements | 1 | ✅ done |
| FR7 | Retrait consentement → suppression médias | 1 | ✅ done |
| FR8 | Club partenaire lecture présences/rapports | 1 | ✅ done |
| FR9 | Club commun lecture minimale | 1 | ✅ done |
| FR10 | Coach : séances du jour groupe/lieu/heure | 1 | ❌ manquant |
| FR11 | Coach : fiche séance (thèmes, critères) | 1 | ✅ done |
| FR12 | Admin CRUD séances | 1 | ✅ done |
| FR13 | Admin associe thèmes à séance | 1 | ✅ done |
| FR14 | Coach soumet retour global séance | 1 | ✅ done |
| FR15 | Coach enregistre présences offline | 1 | ⚠️ partiel — online ok, offline-first différé |
| FR16 | Sync automatique présences | 1 | ⚠️ partiel — story 61-5 done |
| FR17 | Alerte visible sur échec sync | 1 | ⚠️ partiel |
| FR18 | Notification rappel J+1 données non sync | 1 | ❌ manquant |
| FR19 | Coach voit état sync en temps réel | 1 | ⚠️ partiel |
| FR20 | Coach note attitude/effort par enfant | 1 | ✅ done |
| FR21 | Coach commentaire libre par enfant | 1 | ✅ done |
| FR22 | Enfant répond quiz QCM post-séance | 1 | ✅ done (story 75-6) |
| FR23 | Correction détaillée après soumission quiz | 1 | ✅ done (story 75-6) |
| FR24 | Coach consulte résultats quiz groupe | 1 | ❌ manquant (dépend FR22 — now done) |
| FR29 | Notification push parent clôture séance | 1 | ❌ manquant |
| FR30 | Push+email+SMS sur annulation urgente | 1 | ⚠️ partiel — Edge Function existe, SMS non activé |
| FR31 | Parent soumet ticket structuré | 1 | ⚠️ partiel — story 7-4 ready-for-dev |
| FR32 | Coach/Admin répond ticket parent | 1 | ⚠️ partiel — story 7-4 ready-for-dev |
| FR33 | Notification parent → quiz post-séance | 1 | ❌ manquant (dépend FR29) |
| FR34 | Board parent : fiche enfant complète | 1 | ⚠️ partiel — évals manquant |
| FR35 | Parent visualise évolution dans le temps | 1 | ❌ manquant |
| FR41 | Dashboard admin agrégé multi-implantations | 1 | ✅ done |
| FR42 | Admin identifie coachs sans check-in/feedback | 1 | ✅ done |
| FR43 | Admin contacte coach depuis plateforme | 1 | ✅ done |
| FR44 | Admin gère implantations/groupes/assignations | 1 | ✅ done |
| FR46 | Journal audit opérations sensibles | 1 | ✅ done |
| FR47 | Suppression auto médias retrait consentement | 1 | ✅ done |
| FR48 | Admin configure durée conservation | 1 | ✅ done |
| FR49 | Parent exerce droits RGPD depuis compte | 1 | ✅ done |
| FR57 | Présence individuelle en 1 action rapide | 1 | ✅ done (75-1 corrige stat card) |
| FR58 | Mode séance sans connexion réseau | 1 | ⚠️ partiel |
| FR59 | Données locales persistées fermeture forcée | 1 | ⚠️ partiel |
| FR60 | Tokens auth renouvelés automatiquement | 1 | ✅ done |
| FR61 | RBAC vérification serveur-side | 1 | ✅ done |
| FR62 | Isolation tenant_id backend | 1 | ✅ done |
| FR66 | Admin CRUD thèmes techniques | 1 | ✅ done |
| FR67 | Thème contient sous-critères pédagogiques | 1 | ✅ done |
| FR68 | Thème classé par niveau/tranche d'âge | 1 | ✅ done |
| FR69 | Thème lié à plusieurs séances | 1 | ✅ done |
| FR70 | Admin crée questions quiz par thème | 1 | ❌ manquant — UI admin absente |
| FR71 | Génération auto quiz depuis thèmes séance | 1 | ❌ manquant — logique métier absente |
| FR72 | Résultats quiz agrégés par thème | 1 | ❌ manquant (dépend données réelles) |
| FR76 | Progression par thème par enfant | 1 | ⚠️ partiel — progress/index.tsx partiel |
| FR78 | Admin modifie critères validation thème | 1 | ✅ done |
| FR81 | Admin met à jour contenu thème sans impact historique | 1 | ✅ done |
| FR82 | Admin attribue grade à coach | 1 | ✅ done |
| FR83 | Permissions coach varient selon grade | 1 | ✅ done |
| FR84 | Restriction accès contenu si grade insuffisant | 1 | ✅ done |
| FR85 | Passage grade → ouverture nouveaux droits | 1 | ✅ done |
| FR86 | Historique grades coach conservé | 1 | ✅ done |
| FR87 | Admin définit niveau partenariat club | 1 | ✅ done |
| FR88 | Permissions club selon niveau partenariat | 1 | ✅ done |
| FR89 | Journal consultation données par club | 1 | ✅ done |
| FR90 | Admin modifie niveau partenariat club | 1 | ✅ done |
| FR91 | Changement partenariat → droits mis à jour | 1 | ✅ done |
| FR95 | Résolution conflits sync (priorité serveur) | 1 | ⚠️ partiel |
| FR96 | Coach notifié si donnée modifiée offline | 1 | ⚠️ partiel |

---

## Synthèse delta (scout 08/04 matin → post-Epic 75)

| Métrique | Avant Epic 75 | Après Epic 75 |
|----------|--------------|---------------|
| FRs Phase 1 done | 44 (71%) | 46 (74%) |
| FRs Phase 1 partiels | 6 (10%) | 6 (10%) |
| FRs Phase 1 manquants | 12 (19%) | 10 (16%) |
| Couverture effective | 81% | 84% |

Stories Epic 75 qui ont fait avancer les FRs :
- **75-1** (completionStatus bug) : FR57 stat card évaluations maintenant correct
- **75-4** (police évals + données fictives) : qualité UI évals, pas de nouveau FR
- **75-6** (Quiz QCM UI) : FR22 + FR23 passés de ❌ manquant → ✅ done — débloque FR24 et FR39
