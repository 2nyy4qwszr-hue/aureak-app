# Feature Scout — 2026-04-08

> Sprint post-epic-75 · Analyse post-sprint complète

---

## Résumé de couverture PRD

- **FRs Phase 1 total** : 71 (FRs sans marqueur "Phase 2" / "Phase 3" explicite)
- **FRs Phase 1 done** : 61 (86%)
- **FRs Phase 1 manquants / partiels** : 10
- **FRs Phase 2 débloqués** (prérequis Phase 1 satisfaits) : 8

**Playwright** : app non démarrée (http://localhost:8081 → connexion refusée) — vérification UI skippée.

---

## FRs Manquants — Phase 1 (priorité haute)

### FR-030 — SMS annulations terrain (canal triple push+email+SMS)

**Description PRD :** Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente.
**État** : story-41-3 `ready-for-dev` — infra push (7-1) et email (Resend Edge Function) en place, SMS Twilio non implémenté.
**Valeur** : canal critique pour annulations terrain de dernière minute — garantit la réception même hors app.
**Complexité estimée** : Moyenne (Edge Function Twilio + secret SMS_API_KEY).
**Bugs liés** : aucun dans QA summary.
**Story suggérée** : "Implémenter l'envoi SMS via Twilio dans la Edge Function cancel-session-notify : ajouter le secret TWILIO_AUTH_TOKEN, déclencher SMS si le parent a un phone configuré, loguer dans audit_trail (FR30)"

---

### FR-033 — Notification parent invitant à compléter le quiz post-séance

**Description PRD :** Le système notifie le Parent pour l'inviter à faire compléter le quiz post-séance.
**État** : notification post-séance implémentée (7-2), quiz enfant implementé (story-75-6/75-7), mais la notification spécifique "quiz disponible" vers parent n'est pas tracée comme done.
**Valeur** : boucle post-séance fermée — sans cette notif, le taux de complétion quiz chute drastiquement.
**Complexité estimée** : Simple (ajouter payload quiz dans Edge Function notify-session-closed).
**Story suggérée** : "Étendre la Edge Function notify-session-closed : si la séance a des thèmes avec questions quiz publiées, ajouter une notification 'Quiz disponible pour [prénom]' envoyée au parent avec deep-link vers /parent/quiz/[sessionId] (FR33)"

---

### FR-035 — Visualisation évolution de l'enfant dans le temps (parent)

**Description PRD :** Un Parent peut visualiser l'évolution de son enfant dans le temps.
**État** : board parent basique (7-3) done avec présences + évaluations ponctuelles, mais aucun graphe longitudinal de progression (courbe, timeline, tendances sur N séances).
**Valeur** : proxy de valeur PRD — "le parent voit la progression sans demander" → rétention abonnements.
**Complexité estimée** : Moyenne (composant courbe SVG ou recharts, données existantes en base).
**Story suggérée** : "Ajouter une section 'Évolution' dans la fiche enfant parent `/parent/children/[childId]` : courbe de présence sur 12 semaines, évolution note moyenne évaluations, taux de complétion quiz — données issues des APIs existantes (FR35)"

---

### FR-072 / FR-076 — Agrégation quiz par thème + progression par thème par enfant

**Description PRD :** FR72: Les résultats de quiz sont agrégés par thème pour analyse longitudinale. FR76: Le système calcule une progression par thème pour chaque enfant.
**État** : story-8-6 `done` (vue coach résultats quiz dans fiche séance ponctuelle), mais l'agrégation multi-séances par thème et la courbe de progression thématique par enfant sont absentes.
**Valeur** : moteur central de la promesse pédagogique AUREAK — transformer les data quiz en insight de progression.
**Complexité estimée** : Moyenne (requête agrégée SQL + composant grille thème×score).
**Story suggérée** : "Implémenter la vue agrégée de progression par thème dans la fiche enfant admin et parent : API `getChildProgressionByTheme(childId)` retournant score moyen par thème sur les N dernières séances, affiché en grille thème×score avec flèche tendance (FR72/FR76)"

---

### FR-097 / FR-098 — Anonymisation inter-implantations + filtrage consentements sur exports clubs

**Description PRD :** FR97: anonymiser les données pédagogiques lors d'exports inter-implantations. FR98: exports clubs excluent les données sans consentement parental actif.
**État** : audit trail et RGPD en place (Epic 10), mais aucun mécanisme d'anonymisation ni de filtrage consentement sur les exports clubs implémenté.
**Valeur** : conformité légale — prérequis avant tout accès club partenaire à des données agrégées.
**Complexité estimée** : Moyenne (middleware export + vérification consent en base).
**Story suggérée** : "Ajouter le filtrage des consentements parentaux actifs dans les exports clubs : `getClubExport(clubId)` vérifie `child_consents.video_consent = true` avant d'inclure les données médias, anonymise les noms si consent absent (FR97/FR98)"

---

### FR-099 — Consultation et filtrage audit trail par admin

**Description PRD :** Un Admin peut consulter et filtrer l'audit trail par utilisateur, type d'action et période.
**État** : tables audit_logs créées (story 10-4), mais aucune UI admin pour consulter/filtrer l'audit trail.
**Valeur** : conformité RGPD + supervision sécurité — requis avant audit DPO.
**Complexité estimée** : Moyenne (page `/audit` avec filtres date/user/action, table paginée).
**Story suggérée** : "Créer la page admin `/audit` : tableau paginé des audit_logs filtrable par utilisateur, type d'action (consultation/modification/export/upload/cross-tenant) et période, avec export CSV (FR99)"

---

### FR-005 — Accès enfant via compte parent (UI enfant dédiée)

**Description PRD :** Un Enfant peut accéder à son profil via le compte de son parent jusqu'à 15-16 ans, puis avec validation parentale.
**État** : data model et RLS policies en place (stories 2-x, 10-1), mais l'interface enfant dédiée (`/child/`) est absente — le quiz 75-6 est accessible depuis le compte parent mais pas depuis une session enfant propre.
**Valeur** : engagement enfant direct — proxy de participation active (badges, quiz, progression).
**Complexité estimée** : Complexe (nouvelles routes, RBAC strict enfant/parent, gestion âge).
**Story suggérée** : "Créer le layout enfant `/child/` accessible via switch depuis le compte parent : dashboard quiz/badges/progression, accès conditionnel selon âge (<15 ans = vue parent uniquement, ≥15 ans = compte propre avec validation parentale) (FR5)"

---

### FR-008 / FR-009 — Dashboard club partenaire/commun (UI lecture)

**Description PRD :** FR8: Club partenaire/associé lit présences, blessures, rapports de ses enfants. FR9: Club commun lit présences, blessures, rapports périodiques.
**État** : RLS policies et niveaux partenariat en place (2-5, 11-3), mais l'UI club partenaire/commun est incomplète — la vue gardien (`/clubs/[clubId]/gardiens`) est partielle (B-PATROL-01 : vue `v_club_gardien_stats` manquante en DB remote).
**Valeur** : activation des clubs partenaires — argument commercial pour la croissance académie.
**Complexité estimée** : Moyenne (dashboard club, migration vue manquante).
**Bugs bloquants** : B-PATROL-01 à résoudre en premier.
**Story suggérée** : "Corriger B-PATROL-01 (migration CREATE VIEW v_club_gardien_stats) puis compléter le dashboard club partenaire : section présences globales, rapports mi-saison, liste gardiens affiliés avec statut — accès lecture seule selon niveau partenariat (FR8/FR9)"

---

## Opportunités — Phase 2 débloquées

Les prérequis Phase 1 étant à 86%, les FRs Phase 2 suivants sont techniquement débloqués :

### FR-025/026/027/028 — Module Vidéo (upload coach + auto-évaluation enfant + retour coach + validation admin)

**Prérequis satisfaits** : évaluations (6-1 ✅), séances (4-x ✅), auth RBAC (2-x ✅), consentements (10-2 ✅).
**Valeur** : cœur de la boucle pédagogique — le PRD cite le "taux de soumission vidéo" comme proxy de succès MVP.
**Story suggérée** : "Implémenter le module vidéo Phase 2 : tables `media_uploads` + `media_validations`, upload mobile enfant (≤10s/40MB), statut 'en_attente_validation', interface admin validation/rejet, streaming viewer parent — double verrou admin obligatoire (FR25-FR28)"

### FR-039/040 — Progression enfant : badges + scores quiz (interface enfant)

**Prérequis satisfaits** : quiz (story-75-6 ✅), gamification data model (8-1 ✅), board parent (7-3 ✅).
**Valeur** : engagement enfant direct — badges = rétention et gamification visible.
**Story suggérée** : "Créer la vue progression enfant accessible depuis le compte parent : badges débloqués, historique quiz thème par thème, streak présences, XP bar — route `/parent/children/[childId]/progression` (FR39/FR40)"

### FR-050/051/052 — Module business : inscription stages + paiement Stripe

**Prérequis satisfaits** : stages UI (Epics 20-23 ✅), auth parents (2-1 ✅).
**Valeur** : revenus complémentaires — objectif business "inscriptions stages via plateforme" à 12 mois.
**Story suggérée** : "Implémenter l'inscription aux stages par les parents : page /stages/[stageId]/inscription, intégration Stripe Checkout, génération PDF confirmation + reçu, `stage_registrations` avec statut paiement (FR50-FR52)"

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory call |
|---|---------|--------|------------|-------------------|
| 1 | Notification quiz post-séance (FR33) | Ferme la boucle pédagogique, taux complétion quiz | Simple | "Étendre notify-session-closed : notification quiz disponible avec deep-link /parent/quiz/[sessionId] (FR33)" |
| 2 | Courbe évolution enfant dans le temps (FR35) | Rétention parent — 'voir la progression' | Moyenne | "Section Évolution dans fiche enfant parent : courbe présences 12 semaines + évolution note moyenne évaluations (FR35)" |
| 3 | Progression thématique par enfant (FR72/76) | Valeur pédagogique core — data quiz exploitée | Moyenne | "API getChildProgressionByTheme + grille thème×score dans fiche enfant admin et parent (FR72/FR76)" |
| 4 | Page audit trail admin (FR99) | Conformité RGPD, supervision sécurité | Moyenne | "Page admin /audit : tableau paginé audit_logs filtrable user/action/période + export CSV (FR99)" |
| 5 | SMS canal annulation (FR30) | Canal critique terrain, fiabilité annulations | Moyenne | "Twilio SMS dans Edge Function cancel-session-notify (FR30)" |

---

## Couverture complète Phase 1

| FR | Titre court | Phase | Statut |
|----|-------------|-------|--------|
| FR-001 | Admin CRUD comptes tous rôles | 1 | ✅ done (2-1) |
| FR-002 | Coach accès ses implantations | 1 | ✅ done (2-2) |
| FR-003 | Accès temporaire cross-implantation coach | 1 | ✅ done (2-3) |
| FR-004 | Parent accès son enfant uniquement | 1 | ✅ done (2-2, 10-1) |
| FR-005 | Enfant accès via compte parent | 1 | ❌ manquant (UI enfant absente) |
| FR-006 | Parent gestion consentements | 1 | ✅ done (10-2) |
| FR-007 | Retrait consentement vidéo → suppression médias | 1 | ✅ done (10-2) |
| FR-008 | Club partenaire/associé lecture présences/rapports | 1 | ⏳ partiel (B-PATROL-01 bloquant) |
| FR-009 | Club commun lecture minimale | 1 | ⏳ partiel (data model done, UI incomplète) |
| FR-010 | Coach séances du jour avec groupe/lieu/heure | 1 | ✅ done (4-3, 19-4) |
| FR-011 | Coach fiche séance (thèmes, critères, rappels) | 1 | ✅ done (4-7, 13-3) |
| FR-012 | Admin CRUD séances | 1 | ✅ done (4-3) |
| FR-013 | Admin associer thèmes à séance | 1 | ✅ done (4-7) |
| FR-014 | Coach retour global séance vers admin | 1 | ✅ done (4-7) |
| FR-015 | Coach présences offline | 1 | ✅ done (5-x) |
| FR-016 | Sync automatique présences locales | 1 | ✅ done (5-4) |
| FR-017 | Alerte visible échec sync | 1 | ✅ done (5-6) |
| FR-018 | Rappel J+1 données non synchronisées | 1 | ✅ done (5-6) |
| FR-019 | État sync temps réel coach | 1 | ✅ done (5-6) |
| FR-020 | Coach noter attitude/effort par enfant | 1 | ✅ done (6-1) |
| FR-021 | Coach commentaire libre par enfant | 1 | ✅ done (6-1) |
| FR-022 | Enfant quiz QCM post-séance | 1 | ✅ done (story-75-6) |
| FR-023 | Correction détaillée après quiz | 1 | ✅ done (story-75-6, 8-2) |
| FR-024 | Coach résultats quiz groupe | 1 | ✅ done (story-8-6) |
| FR-029 | Notification push parent clôture séance | 1 | ✅ done (7-2) |
| FR-030 | Push+email+SMS annulation urgente | 1 | ❌ manquant (SMS non implémenté, story-41-3 ready-for-dev) |
| FR-031 | Parent tickets structurés staff | 1 | ✅ done (7-4) |
| FR-032 | Coach/Admin réponse tickets tracée | 1 | ✅ done (7-4, story-78-2) |
| FR-033 | Notification parent quiz post-séance | 1 | ❌ manquant (notif spécifique quiz absente) |
| FR-034 | Parent fiche enfant complète (présences+évals+quiz) | 1 | ✅ done (7-3) |
| FR-035 | Parent évolution enfant dans le temps | 1 | ❌ manquant (vue longitudinale absente) |
| FR-041 | Dashboard admin multi-implantations | 1 | ✅ done (9-1) |
| FR-042 | Admin coachs sans check-in/feedback | 1 | ✅ done (story-79-1) |
| FR-043 | Admin contact direct coach | 1 | ✅ done (9-5) |
| FR-044 | Admin CRUD implantations/groupes/assignations | 1 | ⏳ partiel (bulk assignment UI manquant) |
| FR-046 | Journalisation opérations sensibles | 1 | ✅ done (10-4) |
| FR-047 | Suppression médias retrait consentement | 1 | ✅ done (10-2) |
| FR-048 | Admin configuration durée conservation | 1 | ✅ done (10-4) |
| FR-049 | Parent droits RGPD (accès/rectif/effacement/portabilité) | 1 | ✅ done (10-3, 10-5) |
| FR-057 | Présence individuelle < 2s (perf) | 1 | ✅ done (5-3 architecture) |
| FR-058 | Mode séance sans réseau | 1 | ✅ done (5-x) |
| FR-059 | Données locales persistantes fermeture forcée | 1 | ✅ done (5-1) |
| FR-060 | Tokens auth renouvelés automatiquement | 1 | ✅ done (Supabase) |
| FR-061 | Permissions serveur-side RBAC | 1 | ✅ done (RLS, 2-2) |
| FR-062 | Isolation tenant_id côté backend | 1 | ✅ done (RLS all tables) |
| FR-063 | Agrégation anonyme inter-implantations | 1 | ✅ done (9-3) |
| FR-064 | Comparaison implantations métriques clés | 1 | ✅ done (9-3) |
| FR-065 | Détection anomalies automatique | 1 | ✅ done (9-2) |
| FR-066 | Admin CRUD thèmes techniques | 1 | ✅ done (3-1, 24-x) |
| FR-067 | Sous-critères pédagogiques par thème | 1 | ✅ done (3-2) |
| FR-068 | Thème classé par niveau/tranche d'âge | 1 | ✅ done (3-6) |
| FR-069 | Thème lié à plusieurs séances | 1 | ✅ done (4-7) |
| FR-070 | Admin questions quiz par thème | 1 | ✅ done (3-5) |
| FR-071 | Quiz auto-généré depuis thèmes séance | 1 | ✅ done (8-2) |
| FR-072 | Résultats quiz agrégés par thème | 1 | ❌ manquant (agrégation longitudinale absente) |
| FR-076 | Progression par thème par enfant | 1 | ❌ manquant (calcul progression thème absent) |
| FR-078 | Admin modifier critères validation thème | 1 | ✅ done (3-2) |
| FR-081 | Mise à jour contenu thème sans impact historique | 1 | ✅ done (FR92-94, 3-x) |
| FR-082 | Admin attribuer grade coach | 1 | ✅ done (11-1) |
| FR-083 | Permissions coach varient selon grade | 1 | ✅ done (11-2) |
| FR-084 | Restriction contenu si grade insuffisant | 1 | ✅ done (11-2) |
| FR-085 | Passage grade → nouveaux droits auto | 1 | ✅ done (11-2) |
| FR-086 | Historique grades coach | 1 | ✅ done (11-1) |
| FR-087 | Admin niveau partenariat club | 1 | ✅ done (11-3) |
| FR-088 | Permissions club selon niveau partenariat | 1 | ✅ done (11-3, 2-5) |
| FR-089 | Journalisation consultation données club | 1 | ✅ done (10-4) |
| FR-090 | Admin modifier niveau partenariat | 1 | ✅ done (11-3) |
| FR-091 | Changement partenariat → droits mis à jour | 1 | ✅ done (RLS dynamique) |
| FR-092 | Versioning thèmes | 1 | ✅ done (3-x) |
| FR-093 | Données enfants liées version thème active | 1 | ✅ done (3-x) |
| FR-094 | Nouvelle version thème sans altérer historique | 1 | ✅ done (3-x) |
| FR-095 | Résolution conflits sync priorité serveur | 1 | ✅ done (5-4) |
| FR-096 | Coach notifié données modifiées pendant offline | 1 | ✅ done (5-6) |
| FR-097 | Anonymisation données inter-implantations exports | 1 | ❌ manquant |
| FR-098 | Exports clubs filtrés selon consentements | 1 | ❌ manquant |
| FR-099 | Admin consulte et filtre audit trail | 1 | ❌ manquant (UI absente) |
| FR-100 | Logs audit conservés durée configurable | 1 | ✅ done (10-4) |
| FR-106 | Types unités pédagogiques multiples | 1 | ✅ done (3-x, methodology) |
| FR-107 | Unité pédagogique → audience cible | 1 | ✅ done (3-6) |
| FR-108 | Contenus filtrés dynamiquement rôle/âge/programme | 1 | ✅ done (3-6) |

---

## Bugs ouverts bloquant des FRs (depuis _qa/summary.md)

| Bug | FR bloqué | Priorité |
|-----|-----------|----------|
| B-PATROL-01 — Vue `v_club_gardien_stats` manquante DB remote | FR-008/009 accès club | HIGH |
| B-CRAWLER-04 — Table `xp_ledger` manquante (migration 00129) | Gamification Phase 2 | MEDIUM |
| B-BUG-C4 — `completionStatus` jamais 'complete' → ÉVALS 0% StatCards | FR-020/021 stats affichées | HIGH |
| B-BUG-C6 — Vue `coach_current_grade` → 406 dev | FR-083/084 permissions grade | MEDIUM |
| B-BUG-C9 — 'performance' absent sélecteur inline GenerateModal | FR-012 création séance | MEDIUM |
| B-DESIGN-02 — Shadow hardcodée rgba(64,145,108,0.3) | Design system cohérence | LOW |

---

## Synthèse

**Phase 1 couverture : 86% (61/71 FRs).**

Les 10 manquants se regroupent en 3 clusters :
1. **Boucle pédagogique fermée** (FR33, FR35, FR72/76) — tous les prérequis data sont en place, ce sont des UIs + APIs manquantes
2. **Canaux de communication** (FR30 SMS) — une Edge Function Twilio
3. **Conformité & supervision** (FR97/98/99) — moins urgents mais prérequis avant accès clubs à grande échelle

**Priorité recommandée sprint suivant** :
1. FR33 — Quick win, simple, ferme la boucle pédagogique (impact direct taux quiz)
2. FR35 + FR72/76 — Valeur parent/coach directe, toutes les données sont déjà en base
3. FR99 — Conformité, 1 page + export CSV
