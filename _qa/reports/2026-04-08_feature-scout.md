# Feature Scout — 2026-04-08

> Contexte : Sprint 2026-04-08 complet (Epic 75 done : 75-1, 75-3, 75-4, 75-5, 75-6 ; story 34-3 done). Mise à jour consolidée post-sprint.
> App : localhost:8081 non démarrée — analyse statique uniquement. Playwright skipped.
> Base de comparaison : feature-scout-post75.md du même jour. Delta net = +0 FR (story 34-3 = design pur, 75-3 = UX pur).

---

## Résumé de couverture PRD

- **FRs Phase 1 total** : 62
- **FRs Phase 1 implémentés (pleinement)** : 46 (~74%)
- **FRs Phase 1 partiels** : 6 (~10%)
- **FRs Phase 1 manquants** : 10 (~16%)
- **Couverture effective (done + partiel)** : **~84%**
- **FRs Phase 2 débloqués** : 8

> Story 34-3 (redesign entraînements) et 75-3/75-5 (UX/design) n'ouvrent aucun nouveau FR. La couverture reste à 84% depuis le sprint Epic 75.

---

## FRs Manquants — Phase 1 (priorité haute)

### FR10 — Vue coach : séances du jour filtrées sur ses implantations

**Description PRD :** Un Coach peut consulter la liste de ses séances du jour avec groupe, lieu et heure.

**Valeur :** Cœur du Sprint A MVP — adoption terrain dépend de cette vue. KPI : ">95% séances avec check-in numérique à 3 mois". Sans ce filtre, le coach navigue dans 50+ séances non filtrées.

**Complexité estimée :** Simple

**Blockers connus :** aucun — données disponibles via `session_coaches JOIN sessions`

**Story suggérée :** `story "Dashboard coach terrain : page /coach/home avec séances du jour filtrées sur coach_id = auth.user (via session_coaches JOIN), affichage groupe + lieu + heure + statut, bouton accès direct fiche séance → présences (FR10 + FR11)"`

---

### FR18 — Notification rappel J+1 données non synchronisées

**Description PRD :** Le système envoie une notification de rappel au Coach le lendemain si des données restent non synchronisées.

**Valeur :** Journey 3 (Théo, PRD) — sans rappel J+1, coach oublie de resynchroniser. Enfant marqué absent par erreur. Confiance détruite.

**Complexité estimée :** Moyenne (cron Supabase + Edge Function)

**Story suggérée :** `story "Rappel J+1 données non synchronisées : Edge Function check-pending-sync déclenchée via pg_cron à 8h, identifie session_attendances status='pending' de la veille, envoie push FCM + inapp_notification au coach concerné (FR18)"`

---

### FR24 — Coach consulte résultats quiz de son groupe

**Description PRD :** Un Coach peut consulter les résultats de quiz de l'ensemble de son groupe.

**Valeur :** Ferme la boucle pédagogique côté coach. Story 75-6 a livré l'UI quiz enfant — le coach doit maintenant voir l'agrégé groupe pour adapter sa prochaine séance.

**Complexité estimée :** Simple (données dans `learning_mastery`, aucune migration)

**Story suggérée :** `story "Vue coach résultats quiz groupe : section dans fiche séance /seances/[sessionId], tableau joueurs × score quiz + taux maîtrise par thème, appel listGroupQuizResults(sessionId, groupId) — aucune migration, données learning_mastery prêtes (FR24)"`

---

### FR29 / FR33 — Notifications push post-séance + rappel quiz parent

**Description PRD :** Notification push au Parent à la clôture de séance. Notification invitant à faire compléter le quiz 30 min après clôture.

**Valeur :** Trigger engagement passif du parent. Sans notification, usage estimé < 20%. Story 75-6 (quiz enfant) est morte sans ce déclencheur.

**Complexité estimée :** Moyenne (Edge Function `notify-session-closed` existe — activation + FCM web push)

**Story suggérée :** `story "Notifications push post-séance parent : activer l'Edge Function notify-session-closed vers FCM web push, badge in-app sidebar parent + toast 'Séance terminée pour [enfant]' + lien fiche enfant, notification secondaire 'Quiz disponible' 30min après clôture si quiz non soumis (FR29 + FR33)"`

---

### FR34 / FR35 — Board parent : évaluations coach + graphe évolution

**Description PRD :** Parent consulte fiche complète enfant (présences + évaluations + quiz). Parent visualise l'évolution dans le temps.

**Valeur :** Journey 2 (Sophie, PRD) — promesse centrale côté parent. Critère succès business : ">60% fiches avec ≥1 cycle complet".

**État réel :** Routes parent avec onglets présences/badges/progress/consents/sessions existent. Manque : onglet Évaluations (attitude/effort/commentaires coach) + graphe SVG évolution temporelle.

**Complexité estimée :** Simple-Moyenne

**Story suggérée :** `story "Board parent — onglet Évaluations + graphe évolution : dans /parent/children/[childId], ajouter onglet 'Évaluations' (listEvaluationsByChild côté parent) avec attitude+effort+commentaire coach par séance, ajouter graphe linéaire SVG présence% sur 3 mois dans onglet 'Progression' — aucune migration (FR34 + FR35)"`

---

### FR70 / FR71 — Admin crée questions quiz + génération auto depuis thèmes

**Description PRD :** Admin crée questions de quiz par thème. Le système génère automatiquement le quiz d'une séance depuis ses thèmes.

**Valeur :** Condition nécessaire pour alimenter story 75-6 (quiz enfant) en contenu réel. Sans questions admin, la feature quiz reste vide en production.

**Complexité estimée :** Simple (tables `quiz_questions` créées Epic 3, UI admin absente uniquement)

**Story suggérée :** `story "Admin — gestion questions quiz par thème : dans /methodologie/themes/[themeId], section 'Questions quiz' avec CRUD (question + 4 choix + bonne réponse + explication), API createQuizQuestion/listQuizQuestions/deleteQuizQuestion dans api-client — aucune migration, tables prêtes (FR70 + FR78)"`

---

### FR5 — Flux UI basculement contexte parent → enfant

**Description PRD :** Un Enfant peut accéder à son profil via le compte de son parent jusqu'à 15-16 ans.

**Valeur :** Journey 5 (Lucas) — la route quiz /child/quiz existe (75-6 done) mais le mécanisme de passage contexte parent→enfant est absent. La feature est inaccessible dans le flux réel.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Accès enfant depuis compte parent : bouton 'Vue enfant' dans /parent/children/[childId], stockage enfant_id dans sessionStorage, redirect /child/quiz+badges+progress avec enfant_id, retour bouton 'Vue parent' — sans compte séparé jusqu'à 15 ans (FR5)"`

---

### FR30 — Triple canal push+email+SMS sur annulation terrain

**Description PRD :** Push + email + SMS aux Parents en cas d'annulation ou modification urgente.

**Valeur :** Canal critique — parent non informé d'une annulation = crise. Edge Function `cancel-session-notify` existe, SMS Twilio non activé.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Annulation terrain triple canal : activer cancel-session-notify avec SMS Twilio (TWILIO_ACCOUNT_SID/AUTH_TOKEN dans .env), template SMS 160 chars, email Resend avec CTA, push FCM — tester avec séance statut 'annulée' (FR30)"`

---

### FR31 / FR32 — Système de tickets parent ↔ admin/coach

**Description PRD :** Parent soumet demande structurée. Coach/Admin répond, tracé.

**Valeur :** Remplace WhatsApp informel par canal auditable. Story 7-4 `ready-for-dev` depuis plusieurs semaines.

**Complexité estimée :** Moyenne

**Story suggérée :** `story "Tickets parent : route /parent/tickets/new avec catégories (absence, question, signalement), submission → inapp_notifications coach/admin, réponse depuis /tickets/[ticketId] admin, statut ouvert/traité (FR31 + FR32)"`

---

### FR72 — Résultats quiz agrégés par thème (longitudinal)

**Description PRD :** Résultats quiz agrégés par thème pour analyse longitudinale.

**Valeur :** Flywheel collectif PRD — admin voit les thèmes non maîtrisés à l'échelle de l'académie. Différenciateur vs concurrents.

**Complexité estimée :** Moyenne (dépend de données quiz réelles)

**Story suggérée :** À planifier après activation des questions quiz (FR70/FR71 first).

---

## Opportunités — Phase 2 débloquées (prérequis Phase 1 satisfaits)

### FR36 — Vidéos autorisées côté parent (lecture seule)

**Prérequis satisfaits :** Epics 3 ✅, 4 ✅, 10 ✅, 11 ✅, auth ✅
**Valeur :** Boucle d'apprentissage post-séance complète (Journey 1+5 PRD). Différenciateur #1 vs Spond/Teamsnap.
**Story suggérée :** `story "Module vidéo Phase 2 : upload coach statut 'en attente', validation admin, streaming parent lecture seule via Supabase Storage signed URLs (FR25+FR28+FR36)"`

### FR37 — Export PDF fiche enfant côté parent

**Prérequis satisfaits :** Epic 10 ✅, FR34 partiel
**Valeur :** Document justificatif pour clubs, assurances, parents CSP+.
**Story suggérée :** `story "Export PDF rapport enfant : jspdf A4, présences+évals+progression, bouton board parent /parent/children/[childId] (FR37)"`

### FR38 — Export .ics séances côté parent

**Prérequis satisfaits :** Epics 4 ✅, 19 ✅
**Story suggérée :** `story "Export .ics séances : iCalendar depuis séances groupe enfant, bouton fiche joueur admin (FR38)"`

### FR39 — UI enfant : progression badges+scores+feedbacks

**Prérequis satisfaits :** Epic 8 ✅, story 75-6 ✅
**Story suggérée :** `story "UI enfant progression : /child/progress avec badges+scores quiz+feedbacks, accessible via compte parent (FR39)"`

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory |
|---|---------|--------|------------|---------------|
| 1 | Vue coach résultats quiz groupe | 75-6 done → donner au coach la vue agrégée groupe → boucle coach fermée | Simple | `story "Vue coach résultats quiz groupe dans fiche séance : tableau joueurs × score + taux maîtrise thème, listGroupQuizResults(sessionId) (FR24)"` |
| 2 | Admin CRUD questions quiz par thème | Sans contenu le quiz 75-6 reste vide en prod — débloque la valeur pédagogique réelle | Simple | `story "Admin CRUD questions quiz par thème : section dans /methodologie/themes/[themeId], 4 choix + bonne réponse + explication, API createQuizQuestion (FR70+FR71)"` |
| 3 | Board parent onglet Évaluations | Données dispo via listEvaluationsByChild, effort = affichage seulement — complète la fiche enfant promise dans PRD | Simple | `story "Board parent onglet Évaluations : listEvaluationsByChild dans /parent/children/[childId], attitude+effort+commentaire coach par séance (FR34 partiel)"` |

---

## Catégorie D — Dette technique impactant les features

| ID | Dette | Impact | Action |
|----|-------|--------|--------|
| B-BUG-C4 | `completionStatus` valeur `'fermée'` inexistante → ÉVALS 0% StatCards | FR20/FR21 illisibles côté admin | `story "Fix completionStatus : 'fermée' → 'réalisée'|'terminée' dans attendances.ts:94"` |
| B-BUG-C8 | `evalMap.get(scheduled_at)` clé UUID vs string → évaluations jamais affichées fiche enfant parent | FR34 partiellement cassé | 1 ligne fix `evalMap.get(session.id)` |
| B-CRAWLER-06 | Vue `coach_current_grade` → 406 en dev | FR83/FR84 grades illisibles localement | `supabase db push` migration 00091 |
| W-CRAWLER-08 | N+1 sur listEvaluationsBySession (200 appels) | Performance Activités dégradée — bloque adoption | Batch SQL unique |

---

## BLOCKERs ouverts impactant les features

| Blocker | FR impacté | Action requise |
|---------|-----------|----------------|
| B-PATROL-01 — Vue `v_club_gardien_stats` absente remote | FR89 clubs | `supabase db push` migration 00113 |
| B-CRAWLER-04 — Table `xp_ledger` absente remote | FR40 gamification Phase 2 | Push migration 00129 |
| Stories 75-2 / 75-5 open | UX coach contact + design heatmap | Backlog ready-for-dev |
| Story 65-7 — `recordedBy` vide | FR15 / FR57 présences | Fix 1 ligne `recordedBy: user.id` |

---

## Couverture complète Phase 1

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
| FR11 | Coach : fiche séance thèmes+critères | 1 | ✅ done |
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
| FR24 | Coach consulte résultats quiz groupe | 1 | ❌ manquant (FR22 now done → débloqué) |
| FR29 | Notification push parent clôture séance | 1 | ❌ manquant |
| FR30 | Push+email+SMS sur annulation urgente | 1 | ⚠️ partiel — Edge Function existe, SMS non activé |
| FR31 | Parent soumet ticket structuré | 1 | ⚠️ partiel — story 7-4 ready-for-dev |
| FR32 | Coach/Admin répond ticket parent | 1 | ⚠️ partiel — story 7-4 ready-for-dev |
| FR33 | Notification parent → quiz post-séance | 1 | ❌ manquant (dépend FR29) |
| FR34 | Board parent : fiche enfant complète | 1 | ⚠️ partiel — onglet évaluations manquant |
| FR35 | Parent visualise évolution dans le temps | 1 | ❌ manquant |
| FR41 | Dashboard admin agrégé multi-implantations | 1 | ✅ done |
| FR42 | Admin identifie coachs sans check-in/feedback | 1 | ✅ done |
| FR43 | Admin contacte coach depuis plateforme | 1 | ✅ done |
| FR44 | Admin gère implantations/groupes/assignations | 1 | ✅ done |
| FR46 | Journal audit opérations sensibles | 1 | ✅ done |
| FR47 | Suppression auto médias retrait consentement | 1 | ✅ done |
| FR48 | Admin configure durée conservation | 1 | ✅ done |
| FR49 | Parent exerce droits RGPD depuis compte | 1 | ✅ done |
| FR57 | Présence individuelle en 1 action rapide | 1 | ✅ done |
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
