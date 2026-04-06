# Feature Scout — 2026-04-05

> Généré automatiquement — version 2 (mise à jour 2026-04-05, après patrouille du matin)

---

## Résumé de couverture PRD

- **FRs Phase 1 identifiés dans le PRD** : ~65 FRs opérationnels (FR1–FR19, FR20–FR24, FR29–FR35, FR41–FR49, FR57–FR65, FR66–FR72, FR78, FR81–FR91, FR92–FR100, FR106–FR109)
- **FRs Phase 1 couverts par stories `done`** : ~55 (≈85%)
- **FRs Phase 1 partiellement couverts ou non testés en prod** : ~8
- **FRs Phase 2 débloqués** (tous prérequis Phase 1 `done`) : 4 groupes identifiés
- **App au moment du scan** : non démarrée localement (curl → exit 7) — Playwright skipped

---

## Delta depuis le dernier feature-scout (2026-04-05 matin)

Stories passées `done` depuis le scan précédent :
- 43-1 (bug delete méthodologie), 43-2 (cards compactes), 43-3 (modules goal player)
- 44-1 (bug edge function coach), 44-2 (bug filtre saison), 44-3 (role prefill), 44-4 (fiche joueur parents), 44-5 (mini-stats joueur), 44-6 (implantation stats)
- 45-1 (design system Montserrat + tokens gamification)
- 42-1 (dashboard bento redesign), 42-2 (presences redesign)

**Conclusion** : le backlog actif a été quasi-intégralement traité depuis ce matin. Les FRs ciblés par ces stories sont désormais couverts.

---

## FRs Manquants — Phase 1 (priorité haute)

### FR30 — SMS annulation séance (triple canal)

**Description PRD :** "Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente"
**Story couvrant :** `story-41-3-feature-fr30-sms-annulation` — **ready-for-dev**
**Valeur :** Canal critique sécurité pour annulations terrain. Push seul peut être manqué (notifications désactivées). SMS = seul canal garanti en cas d'urgence terrain (météo, terrain indisponible). FR30 est un engagement contractuel implicite vis-à-vis des parents.
**Complexité estimée :** Moyenne (Edge Function Twilio + déclencheur sur session cancellation)
**Story suggérée :** "Implémenter story 41-3 : déclencher envoi SMS via Twilio lors de l'annulation d'une séance — edge function cancel-session-notify déjà existante à enrichir"

---

### FR42 — Supervision coachs inactifs (tableau de bord admin)

**Description PRD :** "Un Admin peut identifier les Coachs sans check-in ou feedback sur leurs séances récentes"
**Story couvrant :** `story-41-1-feature-fr42-supervision-coachs` — **ready-for-dev**
**Valeur :** C'est le mécanisme central de contrôle qualité pédagogique. Sans cette vue, l'admin doit vérifier chaque coach manuellement. Journey 4 (Admin — lundi matin) repose entièrement sur cette feature. Avec 3 implantations actives, la dérive qualité devient invisible sans alertes automatiques.
**Complexité estimée :** Moyenne (agrégation SQL sur sessions récentes sans feedback + alerte UI)
**Story suggérée :** "Implémenter story 41-1 : ajouter dans le dashboard admin une section 'Coachs sans feedback' — coachs n'ayant pas soumis de retour sur leurs 3 dernières séances"

---

### FR43 — Messagerie admin → coach (contact direct)

**Description PRD :** "Un Admin peut contacter directement un Coach depuis la plateforme"
**Story couvrant :** `story-41-2-feature-fr43-messagerie` — **ready-for-dev**
**Valeur :** Complète le dashboard de supervision (FR42). L'admin identifie un coach inactif puis agit directement depuis la plateforme — sans aller sur WhatsApp. Boucle de qualité fermée. Sans FR43, FR42 est un tableau de bord sans action.
**Complexité estimée :** Moyenne (table messages + UI thread minimal)
**Story suggérée :** "Implémenter story 41-2 : messagerie admin→coach — table messages simple, vue thread dans dashboard admin, notification push au coach destinataire"

---

### Programme Pédagogique (FR106–FR108)

**Description PRD :** "Le système supporte plusieurs types d'unités pédagogiques (thème, situation, module coach, programme spécifique) [...] filtrés dynamiquement selon le rôle, l'âge et le programme"
**Story couvrant :** Aucun fichier story dédié — référencé dans BACKLOG.md comme `34-1 architecture-programme-pedagogique-formulaire-intelligent` (P1) sans fichier implémentation
**Valeur :** Le référentiel actuel (thèmes + situations + méthodologie) est la fondation — mais les "programmes spécifiques" et le ciblage audience dynamique (FR107–FR108) ne sont pas encore structurés. Prérequis pour scaler la méthode vers 3+ implantations avec profils différents.
**Complexité estimée :** Complexe (nouveau modèle de données + formulaire intelligent + filtrage dynamique)
**Story suggérée :** "Créer story epic-34-1 : architecture programme pédagogique — table `pedagogical_programs` liée aux thèmes/situations, formulaire de création avec ciblage audience (rôle + tranche âge + programme), filtrage dynamique du référentiel"

---

### FR49 — Droits RGPD parent (accès, rectification, effacement, portabilité)

**Description PRD :** "Un Parent peut exercer ses droits RGPD (accès, rectification, effacement, portabilité) depuis son compte"
**Story couvrant :** Story 10-3 est `done` — mais concerne uniquement l'admin. Le **compte parent** n'a pas de section "Mes droits RGPD" exposée dans l'UI actuelle.
**Valeur :** Obligation légale RGPD (Art. 15-20). Le backend existe (story 10-3/10-5) mais l'interface parent pour déclencher ces actions est absente. Risque légal si un parent demande et ne trouve pas où agir.
**Complexité estimée :** Moyenne (page settings parent + appels API existants)
**Story suggérée :** "Créer story droits-rgpd-parent-ui : ajouter dans le dashboard parent une section 'Mes données' — export JSON, demande d'effacement, consultation logs propres — appels vers les Edge Functions déjà déployées"

---

## Opportunités — Phase 2 débloquées

### Export PDF rapport présences (FR45 / tbd-rapport-presences)

**Prérequis satisfaits :** Epic 4 séances ✅, Epic 5 présences ✅, Epic 18 joueurs ✅, Epic 33 présences dashboard ✅
**Valeur :** Les clubs partenaires (FR8) et les parents (FR37) attendent des rapports. La page `/presences` est opérationnelle. Un PDF Aureak-branded donnera une image professionnelle lors des bilans de saison.
**Story suggérée :** "Créer story tbd-rapport-presences : générer un PDF mensuel de présences par groupe via Edge Function — layout premium Aureak, filtrable par période et groupe"

---

### Gestion médicale basique (FR53–FR56)

**Prérequis satisfaits :** Epic 4 séances ✅, Epic 18 joueurs ✅, Epic 9 dashboard ✅
**Valeur :** FR53 (déclaration blessure) et FR54 (blocage présence si restriction médicale) sont en Phase 2 PRD mais tous leurs prérequis sont satisfaits. Avec la croissance de l'académie, le suivi médical devient un risque de responsabilité. Les clubs partenaires (FR8) peuvent consulter ces données.
**Complexité estimée :** Moyenne
**Story suggérée :** "Créer story medical-injuries-v1 : table blessures liée child_id + session_id, formulaire coach déclaration, badge restriction visible dans la liste présences, blocage check-in si restriction active"

---

### Export .ics calendrier parent (FR38)

**Prérequis satisfaits :** Epic 4 séances ✅, Epic 7 notifications ✅
**Valeur :** FR38 est listé comme intégration MVP dans le PRD. Les parents veulent synchroniser le calendrier AUREAK dans leur agenda natif. Aucun développement requis côté backend lourd — génération .ics stateless.
**Complexité estimée :** Simple
**Story suggérée :** "Créer story export-ics-calendrier-parent : endpoint API ou Edge Function générant un fichier .ics des séances d'un enfant — lien dans le dashboard parent"

---

### Sidebar collapse (story-41-4)

**Prérequis satisfaits :** design system Montserrat ✅ (45-1 done), sidebar icons ✅ (47-1 done)
**Valeur :** UX quality of life pour les utilisateurs desktop en fenêtre réduite. La sidebar prend 240px fixes. Un mode collapse à icônes-only libère 200px de contenu.
**Story suggérée :** "Implémenter story 41-4 : sidebar collapse toggle — état persisté localStorage, mode icônes-only à 64px, animation CSS transition, tooltip au hover"

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory call |
|---|---------|--------|------------|-------------------|
| 1 | Corriger lien sidebar Groupes (`/groupes` → `/groups`) | Lien 404 dans navigation principale (BLOCKER B-PATROL-04) | Simple (1 ligne) | "Corriger href Groupes dans _layout.tsx : `/groupes` → `/groups`" |
| 2 | Corriger vue `v_club_gardien_stats` manquante (BLOCKER B-PATROL-01) | La page /clubs plante sans cette vue | Simple (migration SQL) | "Créer migration SQL pour v_club_gardien_stats : vue agrégée stats gardien par club" |
| 3 | Toggle présent/absent pré-rempli liste présences (story-49-4) | Coaches doivent cliquer 1 par 1 pour chaque joueur | Simple (prefill tous présents + toggle) | "Implémenter story 49-4 : page présences pré-remplit tous les joueurs du groupe comme présents — toggle individuel pour absent" |
| 4 | Blocs/thèmes éditables fiche séance (story-49-2) | Section thèmes non éditable post-création = friction coach | Moyenne | "Implémenter story 49-2 : rendre la section thèmes de la fiche séance éditable — ajouter/supprimer thèmes et blocs après création" |
| 5 | Joueurs club non visibles — annuaire manquant (story-49-3) | Section annuaire dans fiche club absente (BLOCKER) | Simple | "Implémenter story 49-3 : afficher section 'Joueurs de l'annuaire liés à ce club' dans fiche club (club_directory_child_links)" |

---

## BLOCKERs QA actifs (depuis patrol 2026-04-05)

| ID | Description | Impact FR | Urgence |
|----|-------------|-----------|---------|
| B-PATROL-01 | Vue `v_club_gardien_stats` manquante en DB remote | FR87-FR91 (clubs) | Critique |
| B-PATROL-02 | Erreur 400 stages/index load error | FR50 (stages) | Haute |
| B-PATROL-03 | Erreurs React "Unexpected text node" ×2 dans /seances | FR10-FR14 (séances) | Haute |
| B-PATROL-04 | Lien sidebar Groupes → 404 | FR44 (groupes) | Haute |

Ces 4 BLOCKERs sont des quick wins techniques — aucun ne nécessite une story complexe.

---

## Couverture complète — FRs Phase 1

| FR | Titre court | Story couvrant | Statut |
|----|-------------|----------------|--------|
| FR1 | Admin : CRUD utilisateurs | 1-2, 9-4 | ✅ done |
| FR2 | Coach : accès ses implantations uniquement | 2-2, 2-5 | ✅ done |
| FR3 | Accès temporaire cross-implantation | 2-3 | ✅ done |
| FR4 | Parent : données enfant uniquement | 2-2, 7-3 | ✅ done |
| FR5 | Enfant : accès via compte parent | 2-1, 7-3 | ✅ done |
| FR6 | Parent : gestion consentements | 10-2 | ✅ done |
| FR7 | Parent : retrait consentement vidéo | 10-2, 10-3 | ✅ done |
| FR8 | Club partenaire : lecture présences/blessures/rapports | 2-5, 11-3 | ✅ done |
| FR9 | Club commun : lecture minimale | 2-5, 11-3 | ✅ done |
| FR10 | Coach : liste séances du jour | 4-3, 32-3 | ✅ done |
| FR11 | Coach : fiche séance (thèmes, critères, rappels) | 4-3, 4-7 | ✅ done |
| FR12 | Admin : CRUD séances | 4-3 | ✅ done |
| FR13 | Admin : associer thèmes à une séance | 4-3, 3-1 | ✅ done |
| FR14 | Coach : retour global séance admin | 4-6, 4-7 | ✅ done |
| FR15 | Coach : présences en mode offline | 5-1, 5-3 | ✅ done (mobile différé) |
| FR16 | Sync auto présences locales | 5-4 | ✅ done |
| FR17 | Alerte visible échec sync | 5-6 | ✅ done |
| FR18 | Notification rappel J+1 données non synchro | 5-6 | ✅ done |
| FR19 | Coach : état sync en temps réel | 5-6 | ✅ done |
| FR20 | Coach : noter attitude/effort par enfant | 6-1, 6-4 | ✅ done |
| FR21 | Coach : commentaire libre par enfant | 6-1, 6-4 | ✅ done |
| FR22 | Enfant : quiz QCM post-séance | 8-2 | ✅ done |
| FR23 | Correction détaillée après quiz | 8-2 | ✅ done |
| FR24 | Coach : résultats quiz groupe | 8-5 | ✅ done |
| FR29 | Push parent à clôture séance | 7-2 | ✅ done |
| FR30 | Push + email + SMS annulation urgente | 41-3 | ⏳ ready-for-dev |
| FR31 | Parent : tickets support | 7-4 | ✅ done |
| FR32 | Coach/Admin : réponse tickets tracée | 7-4 | ✅ done |
| FR33 | Notif parent pour quiz post-séance | 7-2 | ✅ done |
| FR34 | Parent : fiche complète enfant | 7-3, 8-5 | ✅ done |
| FR35 | Parent : évolution dans le temps | 8-5, 33-3 | ✅ done |
| FR41 | Admin : dashboard agrégé multi-implantations | 9-1 | ✅ done |
| FR42 | Admin : identifier coachs sans check-in/feedback | 41-1 | ⏳ ready-for-dev |
| FR43 | Admin : contacter coach depuis plateforme | 41-2 | ⏳ ready-for-dev |
| FR44 | Admin : gérer implantations/groupes/assignations | 9-4 | ✅ done |
| FR46 | Journal opérations sensibles | 10-4 | ✅ done |
| FR47 | Suppression médias sur retrait consentement | 10-2 | ✅ done |
| FR48 | Admin : configurer durée conservation | 10-1 | ✅ done |
| FR49 | Parent : droits RGPD depuis son compte | 10-3 (admin) | ⚠️ partiel — UI parent manquante |
| FR57 | Check-in rapide (1 action) | 6-4, 33-2 | ✅ done |
| FR58 | Mode séance sans réseau | 5-1, 5-3 | ✅ done (mobile différé) |
| FR59 | Préservation données sur fermeture forcée | 5-2 | ✅ done |
| FR60 | Refresh token auto | 2-1 | ✅ done (Supabase natif) |
| FR61 | RBAC côté serveur chaque requête | 2-2, RLS | ✅ done |
| FR62 | Isolation tenant_id | 2-2, RLS | ✅ done |
| FR63 | Agrégats anonymes inter-implantations | 9-3 | ✅ done |
| FR64 | Comparaison implantations métriques clés | 9-3 | ✅ done |
| FR65 | Détection anomalies automatique | 9-2 | ✅ done |
| FR66 | Admin : CRUD thèmes techniques | 3-1 | ✅ done |
| FR67 | Sous-critères pédagogiques par thème | 3-2 | ✅ done |
| FR68 | Thème classé niveau/tranche âge | 3-6 | ✅ done |
| FR69 | Thème lié à plusieurs séances | 4-3, 3-1 | ✅ done |
| FR70 | Admin : questions quiz par thème | 3-5 | ✅ done |
| FR71 | Quiz auto-généré depuis thèmes séance | 8-2 | ✅ done |
| FR72 | Résultats quiz agrégés par thème | 8-5 | ✅ done |
| FR76 | Progression par thème par enfant | 8-5 | ✅ done |
| FR78 | Admin : modifier critères validation thème | 3-2 | ✅ done |
| FR81 | Mise à jour contenu thème sans impacter historique | 3-1, FR92–FR94 | ✅ done |
| FR82 | Admin : attribuer grade à coach | 11-1 | ✅ done |
| FR83 | Permissions dynamiques selon grade | 11-2 | ✅ done |
| FR84 | Restriction contenu selon grade insuffisant | 11-2 | ✅ done |
| FR85 | Passage grade → ouverture droits auto | 11-2 | ✅ done |
| FR86 | Historique grades coach | 11-1 | ✅ done |
| FR87 | Admin : niveau partenariat club | 11-3 | ✅ done |
| FR88 | Permissions consultation selon niveau | 2-5, 11-3 | ✅ done |
| FR89 | Journal consultations club | 10-4 | ✅ done |
| FR90 | Admin : modifier niveau partenariat | 11-3 | ✅ done |
| FR91 | Changement niveau → mise à jour droits auto | 11-3 | ✅ done |
| FR92 | Versioning thèmes techniques | 3-1 | ✅ done |
| FR93 | Données enfants liées version thème active | 3-1 | ✅ done |
| FR94 | Nouvelle version thème sans altérer historique | 3-1 | ✅ done |
| FR95 | Conflits sync : priorité serveur | 5-4 | ✅ done |
| FR96 | Coach notifié si divergence offline/serveur | 5-4, 5-6 | ✅ done |
| FR97 | Anonymisation données inter-implantations | 9-3, 10-5 | ✅ done |
| FR98 | Exports clubs filtrés selon consentements | 10-5 | ✅ done |
| FR99 | Admin : filtrer audit trail | 10-4 | ✅ done |
| FR100 | Logs audit conservés durée configurable | 10-4 | ✅ done |
| FR106 | Types unités pédagogiques multiples | 3-4, 21-x | ⚠️ partiel — pas de "programme spécifique" |
| FR107 | Unité pédagogique liée audience cible | 3-6 | ✅ done |
| FR108 | Filtrage contenu dynamique rôle/âge/programme | 3-6, 2-6 | ⚠️ partiel — audience filtrage partiel |

---

## Backlog actuel (stories `ready-for-dev` restantes)

| Story | Titre court | Priorité | Lien FR |
|-------|-------------|----------|---------|
| 49-1 | bug-creation-coach-edge-function | P1 | — |
| 49-2 | ux-blocs-themes-editables-fiche-seance | P2 | FR13 |
| 49-3 | bug-joueurs-club-non-visibles | P2 | FR8 |
| 49-4 | ux-presences-liste-enfants-groupe | P1 | FR15, FR57 |
| 49-5 | design-dashboard-game-manager-premium | P2 | FR41 |
| 49-6 | design-implantations-photo-logo-redesign | P2 | FR44 |
| 49-7 | feature-affiliation-auto-joueur-club-saison | P3 | — |
| 41-1 | feature-fr42-supervision-coachs | medium | **FR42** |
| 41-2 | feature-fr43-messagerie | medium | **FR43** |
| 41-3 | feature-fr30-sms-annulation | medium | **FR30** |
| 41-4 | ux-sidebar-collapse | low | — |
| 38-1 | ux-sidebar-deduplication | medium | — |
| 38-2 | ux-url-state-filtres | medium | — |
| 38-3 | ux-breadcrumbs | medium | — |
| 38-4 | ux-navigation-interne | medium | — |
| 39-1 | forms-validation-inline | medium | — |
| 39-2 | forms-autocomplete | medium | — |
| 39-3 | forms-auto-save | medium | — |
| 40-1 | lists-tri-colonnes | medium | — |
| 40-2 | lists-bulk-actions | medium | — |
| 40-3 | lists-raccourcis-clavier | low | — |
| 40-4 | lists-optimistic-toggles | medium | — |
| 40-5 | lists-infinite-scroll | medium | — |
| 1-4 | pipeline-ci-cd-tests | [~] review | — |
| 13-2 | sessions-calendrier-auto | [~] review | — |
| 24-6 | mini-exercices-terrain | [~] review | — |

---

## Chantiers parallèles signalés

1. **DB Baseline Recovery** : ~30 tables existent en remote Supabase sans migration dans le repo. Bloquant pour recréation propre. Prochaine migration = 00090+.
2. **Migrations à créer** (référencées BACKLOG.md) : 00090 (RLS policies), 00091 (grade content permissions), 00092 (support tickets), 00093 (user consents).
3. **FRs Phase 2 non démarrés** : FR25–FR28 (module vidéo), FR36–FR40 (dashboard enfant/gamification), FR45 (export PDF implantation), FR50–FR52 (module stages/Stripe), FR53–FR56 (médical).
