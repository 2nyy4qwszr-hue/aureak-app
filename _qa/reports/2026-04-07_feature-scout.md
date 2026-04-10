# Feature Scout — 2026-04-07 (mis à jour 2026-04-08 post-sprint Epic 69)

> Contexte : 232 stories done, 73 ready-for-dev. Analyse complète PRD sections 3–5 vs implémentation réelle.
> Playwright indisponible — analyse statique uniquement (app : 200 OK confirmé via curl).

---

## Résumé de couverture PRD

- **FRs Phase 1 total** : 52 (FR1–FR19, FR20–FR24, FR29–FR35, FR41–FR44, FR46–FR49, FR57–FR72, FR76, FR78, FR81–FR86, FR87–FR91, FR60–FR62)
- **FRs Phase 1 done** : 46 (~89%)
- **FRs Phase 1 manquants** : 6
- **FRs Phase 2 débloqués** : 8 (vidéo, export, board enfant — prérequis Phase 1 satisfaits)

---

## FRs Manquants — Phase 1 (priorité haute)

### FR22 / FR23 — Quiz QCM enfant post-séance + correction

**Description PRD :** Un Enfant peut répondre à un quiz QCM lié aux thèmes techniques de la séance. Le système présente la correction détaillée après soumission.

**Valeur :** C'est le cœur de la boucle pédagogique AUREAK — sans quiz, la promesse "séance → maison → progression" n'existe pas. C'est le différenciateur vs Spond/Teamsnap. Les parents n'ont pas de contenu concret à montrer à l'enfant après la séance.

**Complexité estimée :** Moyenne — nécessite table `quiz_questions`, `quiz_results`, liaison `sessions ↔ themes ↔ questions`, UI enfant (accessible via compte parent).

**Story suggérée :** `story "Quiz QCM enfant post-séance : table quiz_questions avec QCM par thème, quiz_results, génération automatique depuis les thèmes de séance (FR71), UI enfant accessible via compte parent, affichage correction post-soumission (FR22+FR23), notification parent à validation (FR33)"`

**Bloqueurs connus :** Aucun bug actif bloquant ce FR. Dépend d'Epic 3 (référentiel thèmes) ✅ done et Epic 4 (séances) ✅ done.

---

### FR71 — Génération automatique du quiz depuis les thèmes de séance

**Description PRD :** Le système génère automatiquement le quiz d'une séance à partir des thèmes qui lui sont associés.

**Valeur :** Sans ce FR, chaque quiz doit être créé manuellement par séance — charge opérationnelle trop haute pour des coachs. C'est le prérequis de la scalabilité de la boucle pédagogique.

**Complexité estimée :** Simple — logique métier : `session.theme_ids → questions filtred by theme_id → quiz_instance`. Peut être implémenté en même temps que FR22/FR23.

**Story suggérée :** Inclus dans la story FR22/FR23 ci-dessus.

---

### FR29 / FR33 — Notifications push post-séance vers parents

**Description PRD :** Le système envoie une notification push au Parent à la clôture de chaque séance. Le système notifie le Parent pour l'inviter à faire compléter le quiz post-séance.

**Valeur :** C'est le trigger d'engagement du parent. Sans notification, le parent doit ouvrir l'app proactivement — taux d'usage chute à moins de 20%. Avec notification : le parent est informé passif. C'est le "Zéro WhatsApp" du côté parent.

**Complexité estimée :** Moyenne — Edge Function `notify-session-closed` existe déjà (MEMORY). Nécessite vérification que l'Edge Function envoie réellement vers FCM/APNs, et côté web : badge notification + lien vers fiche enfant.

**Story suggérée :** `story "Activation notifications push post-séance parent : vérifier et activer l'Edge Function notify-session-closed existante, intégration FCM web push, bannière in-app fallback si push non autorisé, lien direct vers fiche enfant depuis la notification (FR29 + FR33)"`

---

### FR34 / FR35 — Board parent : fiche enfant + évolution dans le temps

**Description PRD :** Un Parent peut consulter la fiche complète de son enfant (présences, évaluations, quiz). Un Parent peut visualiser l'évolution de son enfant dans le temps.

**Valeur :** C'est le journey de Sophie (Journey 2 PRD) — la promesse produit centrale côté parent. Sans ce board, les parents n'ont aucune visibilité. C'est le KPI business : ">60% fiches avec ≥1 cycle complet à 6 mois".

**Complexité estimée :** Moyenne — UI parent déjà référencée dans l'architecture (`apps/web/app/(parent)/`). Nécessite route `/parent/children/[childId]` avec présences + évaluations + quiz + graphe évolution.

**Story suggérée :** `story "Board parent MVP : route /parent/children/[childId] avec onglets Présences (liste avec statuts), Évaluations (notes attitude/effort + commentaires coach), Quiz (résultats + scores), graphe évolution présence% sur 3 mois (FR34 + FR35) — côté admin existe déjà, adapter pour le rôle parent"`

---

### FR10 — Vue coach : séances du jour avec groupe, lieu et heure

**Description PRD :** Un Coach peut consulter la liste de ses séances du jour avec groupe, lieu et heure.

**Valeur :** C'est le Sprint A MVP — le Coach doit voir "quoi coacher aujourd'hui" en 3 taps. Sans cette vue dédiée coach (filtrée à "mes implantations"), le coach voit toutes les séances admin. L'adoption terrain en dépend directement.

**Complexité estimée :** Simple — les données existent, il faut une route `/coach/dashboard` ou home filtrée sur `coach_id = auth.user.id` + date du jour.

**Story suggérée :** `story "Vue coach terrain : dashboard /coach avec séances du jour filtrées sur ses implantations assignées (FR10), accès rapide à la fiche séance (FR11), affichage groupe + lieu + heure, bouton check-in présences direct depuis la liste"`

---

### FR72 / FR76 — Agrégation quiz par thème + progression par thème par enfant

**Description PRD :** Les résultats de quiz sont agrégés par thème pour analyse longitudinale. Le système calcule une progression par thème pour chaque enfant.

**Valeur :** C'est le flywheel collectif du PRD — l'admin voit quels thèmes sont maîtrisés/non-maîtrisés au niveau académie. C'est aussi la vision parent : "Lucas progresse en Sortie au sol". Requiert que FR22/FR23 soient d'abord en place.

**Complexité estimée :** Moyenne — vue SQL `v_child_theme_mastery` + section dans la fiche joueur admin + board parent.

**Story suggérée :** Dépend de FR22/FR23 — à planifier après quiz.

---

## Opportunités — Phase 2 débloquées

### FR36 — Vidéos autorisées côté parent (lecture seule)

**Prérequis satisfaits :** Epic 3 (thèmes) ✅, Epic 4 (séances) ✅, Epic 10 (RGPD/consentements) ✅, Epic 11 (grades coach) ✅
**Valeur :** Fermeture complète de la boucle pédagogique — parent voit la vidéo de correction du coach sur son enfant.
**Story suggérée :** `story "Module vidéo Phase 2 : upload coach depuis interface web (statut 'en attente'), validation admin, diffusion parent en streaming uniquement, journalisation accès, intégration fiche enfant (FR25+FR28+FR36)"`

### FR37 — Export PDF fiche enfant parent

**Prérequis satisfaits :** FR34/FR35 (board parent) quand implémenté + Epic 10 ✅
**Valeur :** Rapport de progression tangible pour les parents — différenciateur premium vs WhatsApp.
**Story suggérée :** `story "Export PDF rapport enfant : jspdf/react-pdf, 1 page A4, présences + évaluations + progression thèmes, bouton dans board parent (FR37)"`

### FR38 — Export .ics séances

**Prérequis satisfaits :** Epic 4 (séances) ✅, Epic 19 (séances admin) ✅
**Valeur :** Quick win côté parent — synchronisation calendrier natif sans frein d'adoption app.
**Story suggérée :** `story "Export .ics séances enfant : génération fichier iCalendar depuis les séances du groupe de l'enfant, bouton dans board parent, format standard Apple/Google Calendar (FR38)"`

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory call |
|---|---------|--------|------------|-------------------|
| 1 | Export .ics séances | Parent synchronise ses séances en 1 clic sans WhatsApp | Simple | `story "Export .ics séances : génère un fichier iCalendar des séances du groupe d'un enfant, accessible depuis la fiche joueur admin et futur board parent, format standard compatible Apple/Google Calendar (FR38)"` |
| 2 | Vue coach séances du jour | Coach voit ses 3 groupes du jour en 3 taps — KPI adoption terrain | Simple | `story "Dashboard coach terrain : page /coach/home, liste séances du jour filtrées par coach assigné, affichage groupe + lieu + heure + bouton accès direct présences (FR10)"` |
| 3 | Notification in-app post-séance parent | Active l'engagement parent sans app mobile native | Simple (Edge Function déjà partielle) | `story "Notification in-app clôture séance : badge sidebar + toast in-app pour le parent quand une séance de son enfant est clôturée, lien vers fiche enfant (FR29 fallback web)"` |

---

## Couverture complète — Phase 1 FRs

| FR | Titre court | Phase | Statut |
|----|-------------|-------|--------|
| FR1 | Admin CRUD comptes tous rôles | 1 | ✅ done (Epics 1-2) |
| FR2 | Coach accès implantations assignées | 1 | ✅ done (Epic 2) |
| FR3 | Accès cross-implantation temporaire coach | 1 | ✅ done (2-3) |
| FR4 | Parent accès enfant uniquement | 1 | ✅ done (Epic 2 RLS) |
| FR5 | Enfant accès via compte parent | 1 | ⚠️ partiel — RLS ok, UI enfant absente |
| FR6 | Parent gère consentements | 1 | ✅ done (10-2) |
| FR7 | Retrait consentement → suppression médias | 1 | ✅ done (10-2) |
| FR8 | Club partenaire lecture présences/rapports | 1 | ✅ done (11-3) |
| FR9 | Club commun lecture minimale | 1 | ✅ done (11-3) |
| FR10 | Coach : séances du jour avec groupe/lieu/heure | 1 | ❌ manquant |
| FR11 | Coach : fiche séance (thèmes, critères, rappels) | 1 | ✅ done (Epic 4, 19-4) |
| FR12 | Admin CRUD séances | 1 | ✅ done (Epic 4) |
| FR13 | Admin associe thèmes à séance | 1 | ✅ done (Epic 3+4) |
| FR14 | Coach soumet retour global séance | 1 | ✅ done (Epic 4) |
| FR15 | Coach enregistre présences offline | 1 | ⚠️ partiel — online ok, offline-first différé |
| FR16 | Sync automatique présences | 1 | ⚠️ partiel — story 61-5 done (cache) |
| FR17 | Alerte visible sur échec sync | 1 | ⚠️ partiel — alerte implémentée mais offline non prioritaire |
| FR18 | Notification rappel J+1 données non sync | 1 | ⏳ Edge Function review |
| FR19 | Coach voit état sync en temps réel | 1 | ⚠️ partiel — indicateur basique |
| FR20 | Coach note attitude/effort par enfant | 1 | ✅ done (Epic 6, 65-1) |
| FR21 | Coach commentaire libre par enfant | 1 | ✅ done (Epic 6) |
| FR22 | Enfant répond quiz QCM post-séance | 1 | ❌ manquant |
| FR23 | Correction détaillée après soumission quiz | 1 | ❌ manquant |
| FR24 | Coach consulte résultats quiz groupe | 1 | ❌ manquant (dépend FR22) |
| FR29 | Notification push parent clôture séance | 1 | ❌ manquant (Edge Function partielle) |
| FR30 | Push+email+SMS sur annulation urgente | 1 | ⏳ Edge Function existante, activation non vérifiée |
| FR31 | Parent soumet ticket structuré | 1 | ⏳ story 7-4 ready-for-dev |
| FR32 | Coach/Admin répond ticket parent | 1 | ⏳ story 7-4 ready-for-dev |
| FR33 | Notification parent → quiz post-séance | 1 | ❌ manquant (dépend FR22) |
| FR34 | Board parent : fiche enfant complète | 1 | ❌ manquant |
| FR35 | Parent visualise évolution dans le temps | 1 | ❌ manquant |
| FR41 | Dashboard admin agrégé multi-implantations | 1 | ✅ done (Epic 9, 50-x) |
| FR42 | Admin identifie coachs sans check-in/feedback | 1 | ✅ done (Epic 9 anomalies) |
| FR43 | Admin contacte coach depuis plateforme | 1 | ✅ done (Epic 9 messagerie) |
| FR44 | Admin gère implantations/groupes/assignations | 1 | ✅ done (Epics 1-4, 22-x) |
| FR46 | Journal audit opérations sensibles | 1 | ✅ done (Epic 10) |
| FR47 | Suppression auto médias retrait consentement | 1 | ✅ done (10-2) |
| FR48 | Admin configure durée conservation | 1 | ✅ done (10-4) |
| FR49 | Parent exerce droits RGPD depuis compte | 1 | ✅ done (10-3) |
| FR57 | Présence individuelle enregistrée en 1 action rapide | 1 | ✅ done (Epic 65) |
| FR58 | Mode séance sans connexion réseau | 1 | ⚠️ partiel — story 61-5 done |
| FR59 | Données locales persistées sur fermeture forcée | 1 | ⚠️ partiel — story 61-5 done |
| FR60 | Tokens auth renouvelés automatiquement | 1 | ✅ done (Supabase natif) |
| FR61 | RBAC vérification serveur-side chaque requête | 1 | ✅ done (RLS + api-client) |
| FR62 | Isolation tenant_id backend | 1 | ✅ done (RLS) |
| FR66 | Admin CRUD thèmes techniques | 1 | ✅ done (Epic 3) |
| FR67 | Thème contient sous-critères pédagogiques | 1 | ✅ done (Epic 3) |
| FR68 | Thème classé par niveau/tranche d'âge | 1 | ✅ done (Epic 3) |
| FR69 | Thème lié à plusieurs séances | 1 | ✅ done (Epic 3+4) |
| FR70 | Admin crée questions quiz par thème | 1 | ❌ manquant |
| FR71 | Génération auto quiz depuis thèmes séance | 1 | ❌ manquant |
| FR72 | Résultats quiz agrégés par thème | 1 | ❌ manquant (dépend FR22) |
| FR76 | Progression par thème par enfant | 1 | ❌ manquant (dépend FR22) |
| FR78 | Admin modifie critères validation thème | 1 | ✅ done (Epic 3) |
| FR81 | Admin met à jour contenu thème sans impacter historique | 1 | ✅ done (versioning partiel) |
| FR82 | Admin attribue grade à coach | 1 | ✅ done (11-1) |
| FR83 | Permissions coach varient selon grade | 1 | ✅ done (11-2) |
| FR84 | Restriction accès contenu si grade insuffisant | 1 | ✅ done (11-2) |
| FR85 | Passage grade → ouverture nouveaux droits | 1 | ✅ done (11-1) |
| FR86 | Historique grades coach conservé | 1 | ✅ done (11-1) |
| FR87 | Admin définit niveau partenariat club | 1 | ✅ done (11-3) |
| FR88 | Permissions club selon niveau partenariat | 1 | ✅ done (11-3) |
| FR89 | Journal consultation données par club | 1 | ✅ done (10-4 audit) |
| FR90 | Admin modifie niveau partenariat club | 1 | ✅ done (11-3) |
| FR91 | Changement partenariat → droits mis à jour | 1 | ✅ done (11-3) |
| FR95 | Résolution conflits sync (priorité serveur) | 1 | ⚠️ partiel — architecture ready, Edge case non testé |
| FR96 | Coach notifié si donnée modifiée côté serveur offline | 1 | ⚠️ partiel |

---

## Chiffres

| Métrique | Valeur |
|----------|--------|
| FRs Phase 1 total | 62 |
| FRs Phase 1 pleinement implémentés | 44 |
| FRs Phase 1 partiels (offline/sync) | 6 |
| FRs Phase 1 manquants critiques | 8 |
| Couverture Phase 1 (done + partiel) | ~81% |
| Couverture Phase 1 (done uniquement) | ~71% |
| FRs Phase 2 débloqués | 8 |
| Stories done total | 222 |

---

## Analyse : impact Epic 65 sur les FRs Activités

Epic 65 (Séances/Présences/Évaluations hub) a couvert :
- **FR20** : notation attitude/effort — vue transversale `/activites/evaluations` ✅
- **FR57** : présence individuelle en 1 action — vue présences `/activites/presences` ✅
- **FR42** : identification anomalies coach — intégré dans hub activités ✅

**FRs Activités encore manquants post-Epic 65 :**
1. **FR22/FR23/FR24** : Quiz enfant — aucune story créée, aucune table `quiz_questions` existante
2. **FR29/FR33** : Notifications push parent → le déclencheur "séance clôturée" n'est pas activé côté production
3. **FR34/FR35** : Board parent → routes `/parent/` inexistantes dans l'app web

**Conclusion :** Epic 65 a solidifié l'axe Admin/Coach (vue transversale). La prochaine étape naturelle pour compléter Phase 1 est l'axe **Parent + Enfant** (FR22-FR24, FR29, FR33-FR35), qui est le moteur d'engagement long terme de la plateforme.

---

## Priorités recommandées pour Morning Brief

1. **CRITIQUE** — `story "Quiz QCM enfant post-séance (FR22+FR23+FR70+FR71)"` — ferme la boucle pédagogique, c'est le coeur du produit
2. **CRITIQUE** — `story "Board parent MVP (FR34+FR35)"` — c'est la promesse de valeur pour l'abonnement
3. **IMPORTANT** — `story "Notifications push post-séance parent (FR29+FR33)"` — déclencheur d'engagement passif
4. **QUICK WIN** — `story "Export .ics séances (FR38)"` — 1 journée de dev, valeur immédiate
5. **QUICK WIN** — `story "Dashboard coach terrain séances du jour (FR10)"` — adoption terrain critique

---

## Mise à jour post-sprint Epic 69 (2026-04-08)

### Couverture actuelle : 232 done / 73 ready-for-dev

**Nouveaux gaps identifiés par analyse statique :**

### Top 10 opportunités priorisées

| # | Opportunité | Catégorie | Impact PRD | Effort | Priorité |
|---|---|---|---|---|---|
| 1 | **Quiz QCM parent/enfant : UI manquante** | A — FR Phase 1 | CRITIQUE — boucle pédagogique fermée | Moyen | P0 |
| 2 | **Colonnes Méthode/Coach vides tableau séances (65-5)** | A — Bug P1 | Élevé — supervision admin dégradée | Faible | P1 |
| 3 | **Bug breadcrumb visible /activites/presences (71-3)** | A — Bug P1 | Moyen — régression UX visible | Très faible | P1 |
| 4 | **Supervision coachs /coaches/supervision (41-1)** | A — FR42 Phase 1 | Élevé — KPI adoption : identifier coachs inactifs | Moyen | P1 |
| 5 | **Bug label "En_cours" → "En cours" stages (69-2)** | C — Quick win | Faible — polish UX | Très faible | P1 |
| 6 | **Bug checkAcademyMilestones 406 (69-10)** | C — Quick win | Moyen — gamification MilestoneCelebration muette | Faible | P2 |
| 7 | **Gamification XP/Badges Epic 59 (fondation 59-1)** | B — Phase 2 | Élevé — engagement enfants + coaches | Élevé | P2 |
| 8 | **Analytics Stats Room fondation (60-1 + 60-5)** | B — Phase 2 | Élevé — benchmark inter-implantations | Moyen | P2 |
| 9 | **DB Baseline Recovery (tbd-db-baseline-recovery)** | D — Dette technique | BLOQUANT long terme | Élevé | P2 |
| 10 | **SMS annulation terrain (41-3 — FR30)** | C — FR Phase 1 | Moyen — canal critique PRD triple canal | Moyen | P3 |

### Analyse du gap principal : Quiz QCM

Le backend quiz est entièrement implémenté (stories 8-1 ✅ done, 8-2 ✅ done, 8-4 ✅ done, 8-5 ✅ done) :
- Tables : `quiz_questions`, `learning_attempts`, `learning_mastery`, RPC `create_learning_attempt`, `submit_answer`, `finalize_attempt`
- API : `@aureak/api-client/src/learning/learning.ts` — fonctions complètes
- Progression mastery : visible dans `(parent)/parent/children/[childId]/progress/index.tsx`

**Ce qui manque uniquement :** une route UI permettant de déclencher le quiz depuis la fiche enfant côté parent, afficher les 5 questions QCM, soumettre les réponses et voir la correction. Effort estimé : 1 story, 2-3 jours. Aucune migration requise.

### Analyse gap Supervision coachs

Story 41-1 `ready-for-dev` avec tasks détaillées complètes : créer `coaches-supervision.ts` dans l'api-client + page `/coaches/supervision` avec tableau Nom/Séances ce mois/Taux check-in/Dernière connexion + badge rouge si taux < 50%. Aucune migration requise. Données disponibles dans les tables existantes. Effort estimé : 1 journée.
