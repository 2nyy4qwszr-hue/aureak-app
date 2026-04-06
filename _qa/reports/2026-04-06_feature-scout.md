# Feature Scout — 2026-04-06

> Agent : Feature Scout autonome
> Scope : PRD Phase 1 — FRs 1 à 65 (sections 1 à 7 du PRD)
> Méthode : croisement PRD × statuts story files × BACKLOG.md

---

## Résumé de couverture PRD

| Métrique | Valeur |
|---|---|
| FRs Phase 1 total | 65 (FR1→FR65, hors FRs Phase 2 marqués) |
| FRs Phase 1 done ou couverts | ~58 (~89%) |
| FRs Phase 1 manquants critiques | 7 |
| Stories `done` (non-story- prefix) | 137 fichiers |
| Stories `done` (story- prefix) | 70 fichiers |
| Stories `ready-for-dev` restantes | 3 (63-1, 63-2, 63-3) |
| Stories sans statut (backlog ouvert) | ~160 stories |
| App en ligne au moment du scan | Non — Playwright skipped |

---

## Note sur les Epics 49–63 (session du 5 avril 2026)

Les epics suivants ont été intégralement implémentés lors de la session du 5 avril :
- **Epic 50** : Dashboard Club HQ (10 stories — hero band, KPIs, countdown, live feed, météo, focus mode)
- **Epic 59** : Gamification XP & Achievements (10 stories — XP ledger, badges, leaderboard, milestones)
- **Epic 60** : Analytics Stats Room (8 stories — charts, heatmap, classements, PDF export, realtime)
- **Epic 61** : Mobile & Dark Mode (6 stories — dark mode, HUD, PWA, offline cache)
- **Epic 62** : Polish & Micro-interactions (6 stories — favicon, skeletons, empty states, tooltips)

Ces stories portent `Status: done` dans leurs fichiers. Total session : ~40 stories `done` en un jour.

---

## FRs Manquants — Phase 1 (priorité haute)

### FR-42 — Supervision des coachs inactifs

**Description PRD :** "Un Admin peut identifier les Coachs sans check-in ou feedback sur leurs séances récentes"
**Couverture actuelle :** La story 41-1 existe (`ready-for-dev`) mais n'est pas implémentée. Le dashboard admin (Epic 9, Epic 50) affiche des métriques globales mais pas de tableau de supervision par coach avec taux de check-in individuels.
**Valeur :** Critique pour l'objectif success criteria "Zéro WhatsApp" — l'admin doit voir en 2 minutes quel coach n'a pas utilisé la plateforme.
**Complexité estimée :** Simple (requête JOIN existante, tableau sortable, badge rouge si taux < 50%)
**Story suggérée :** "Implémenter la page de supervision des coachs (story 41-1) : tableau `/coaches/supervision` avec taux de check-in, séances du mois, dernière connexion, mise en évidence rouge si taux < 50%"

---

### FR-43 — Messagerie admin → coach

**Description PRD :** "Un Admin peut contacter directement un Coach depuis la plateforme"
**Couverture actuelle :** Story 41-2 existe (`ready-for-dev`) mais pas implémentée. La messagerie interne est absente — l'admin doit actuellement utiliser un outil externe pour contacter un coach.
**Valeur :** Élimine la dépendance WhatsApp pour les communications de supervision. Journey 4 (Admin lundi matin) dépend explicitement de cette feature.
**Complexité estimée :** Moyenne (migration `coach_messages`, Edge Function ou simple DB, UI liste + formulaire)
**Story suggérée :** "Implémenter la messagerie admin→coach (story 41-2) : migration `coach_messages`, page `/messages`, formulaire destinataire+sujet+corps, statut lu/non-lu"

---

### FR-30 — SMS annulation séance (triple canal push+email+SMS)

**Description PRD :** "Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente"
**Couverture actuelle :** Story 41-3 existe (`ready-for-dev`) mais pas implémentée. La Edge Function `cancel-session-notify` existe mais l'intégration Twilio SMS et le bouton UI d'annulation de séance sont absents.
**Valeur :** Canal critique pour les annulations terrain de dernière minute. Un parent qui ne reçoit pas la notification fait venir son enfant pour rien.
**Complexité estimée :** Moyenne (Twilio guard dans Edge Function + bouton UI + modal confirmation)
**Story suggérée :** "Implémenter l'annulation de séance avec notification SMS (story 41-3) : bouton Annuler dans seances/[id], modal motif, appel `cancel-session-notify`, guard Twilio, badge Annulée"

---

### FR-31/FR-32 — Système de tickets parents

**Description PRD :** "Un Parent peut soumettre une demande structurée au staff via un système de tickets encadrés. Un Coach ou Admin peut répondre aux tickets parents, réponse tracée."
**Couverture actuelle :** Story 7-4 (`done`) couvre le modèle de données. Mais l'UI parent pour soumettre un ticket et l'UI admin/coach pour répondre restent à confirmer comme complètes.
**Valeur :** Remplace les messages WhatsApp parents → staff. Traçabilité des demandes.
**Complexité estimée :** Moyenne (si le modèle est en place, l'UI est le travail restant)
**Story suggérée :** "Vérifier et compléter l'UI des tickets parents (Epic 7-4) : formulaire de création côté parent, vue des tickets côté admin/coach avec réponse, statut résolu"

---

### FR-64 — Comparaison inter-implantations

**Description PRD :** "Un Admin peut comparer les implantations sur des métriques clés"
**Couverture actuelle :** Les stories 57-6 (`implantations-comparaison-cote-a-cote`) et 60-4 (`analytics-classement-implantations-bar-chart`) existent mais sont sans statut (pas encore implémentées). Le dashboard admin a des KPIs par implantation mais pas de vue comparative.
**Valeur :** Clé pour la supervision multi-sites — Journey 4 (Admin lundi matin) mentionne la vue comparative.
**Complexité estimée :** Moyenne (57-6 + 60-4 dépendent de stories parentes déjà done)
**Story suggérée :** "Implémenter le classement inter-implantations dans Analytics (story 60-4) : BarChart horizontal présences+séances par implantation, tri, couleur performance"

---

### FR-35 — Visualisation évolution enfant dans le temps (côté parent)

**Description PRD :** "Un Parent peut visualiser l'évolution de son enfant dans le temps"
**Couverture actuelle :** Story 7-3 (`done`) couvre le board parent basique. Mais une timeline/graphique de progression (story 55-3 `evaluations-timeline-croissance-joueur`) n'est pas implémentée. L'évolution dans le temps est absente de l'UI parent.
**Valeur :** Journey 2 (Sophie) — la valeur perçue par le parent est directement liée à sa capacité de voir la progression au fil du temps, pas juste la dernière séance.
**Complexité estimée :** Moyenne (GrowthChart SVG ligne gradient, données evaluations existantes)
**Story suggérée :** "Implémenter le graphique de progression joueur (story 55-3) : GrowthChart SVG dans la fiche joueur, données d'évaluations sur 6-12 mois, visible côté admin et parent"

---

### FR-38 — Export calendrier .ics parent

**Description PRD :** "Un Parent peut exporter les séances au format .ics" — marqué MVP dans la liste des intégrations.
**Couverture actuelle :** Aucune story couvrant l'export .ics n'est identifiée comme `done`. Ce FR est listé comme priorité MVP dans les intégrations (section Intégrations du PRD).
**Valeur :** Permet aux parents de synchroniser les séances dans Google Calendar / Apple Calendar sans app tierce. Réduction friction adoption parents.
**Complexité estimée :** Simple (génération string iCal côté client ou Edge Function, téléchargement)
**Story suggérée :** "Créer l'export .ics des séances pour les parents : bouton dans le board parent, génération du fichier iCal avec les séances du groupe de l'enfant, téléchargement direct"

---

## FRs Phase 2 débloqués (opportunités moyen terme)

### FR-25/FR-26/FR-27/FR-28 — Module vidéo

**Prérequis satisfaits :** Epic 3 (référentiel) ✅, Epic 6 (évaluations) ✅, Epic 10 (RGPD + consentements) ✅
**Valeur :** Le différenciateur fondamental d'AUREAK — la boucle `séance → vidéo enfant → retour coach`. Journey 5 (Lucas) dépend entièrement de ce module.
**Story suggérée :** "Concevoir et implémenter Epic 13 module vidéo Phase 2 : upload coach (en attente validation admin), self-coaching enfant, retour textuel coach, double verrou admin, streaming uniquement"

---

### FR-39/FR-40 — Interface enfant autonome (badges, progression)

**Prérequis satisfaits :** Epic 8 (quiz, badges, streaks) ✅, Epic 12 (gamification) ✅, Epic 59 (XP) ✅
**Valeur :** Journey 5 (Lucas) — l'enfant voit ses badges, son XP, ses résultats de quiz. Le moteur est prêt (Epic 12 + 59 done), il manque l'interface dédiée enfant.
**Story suggérée :** "Créer l'interface enfant autonome : tableau de bord avec badges débloqués, XP bar, résultats quiz récents, streaks de présence — accessible via compte parent ou login dédié 15+ ans"

---

### FR-50/FR-51/FR-52 — Module business stages (Stripe)

**Prérequis satisfaits :** Epic 13 (séances v2) ✅, module stages (migration 00048) ✅
**Valeur :** Success criteria business — "Inscriptions stages via plateforme" à 12 mois.
**Story suggérée :** "Implémenter les inscriptions et paiements de stages via Stripe : page publique stage, formulaire inscription parent, intégration Stripe Checkout, génération confirmation PDF"

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory call |
|---|---------|--------|------------|-------------------|
| 1 | Supervision coachs (FR-42) | Élimine le WhatsApp de supervision — KPI succès projet | Simple | "Implémenter la page de supervision des coachs (story 41-1) : tableau `/coaches/supervision` avec taux de check-in, séances du mois, dernière connexion, badge rouge si taux < 50%" |
| 2 | Export .ics parent (FR-38) | Synchronisation calendrier natif, réduction friction adoption parents | Simple | "Créer l'export .ics des séances pour les parents : bouton board parent, génération iCal avec séances du groupe de l'enfant, téléchargement direct" |
| 3 | Annulation séance + SMS (FR-30) | Canal critique annulations terrain — Journey 4 Admin dépend de ce flux | Moyenne | "Implémenter l'annulation de séance avec notification SMS (story 41-3) : bouton Annuler dans seances/[id], modal motif, appel cancel-session-notify, guard Twilio, badge Annulée" |

---

## Couverture complète — FRs Phase 1

| FR | Titre court | Phase | Statut |
|----|-------------|-------|--------|
| FR-1 | Admin gère comptes tous rôles | 1 | ✅ done (2-1, 2-2) |
| FR-2 | Coach accès implantations assignées uniquement | 1 | ✅ done (2-2 RBAC/RLS) |
| FR-3 | Accès cross-implantation temporaire coach | 1 | ✅ done (2-3) |
| FR-4 | Parent accès données ses enfants uniquement | 1 | ✅ done (2-2, 7-3) |
| FR-5 | Enfant via compte parent jusqu'à 15-16 ans | 1 | ✅ done (8-3 deferred/mobile) |
| FR-6 | Parent gère consentements | 1 | ✅ done (10-2) |
| FR-7 | Retrait consentement → suppression médias | 1 | ✅ done (10-2) |
| FR-8 | Club partenaire lecture présences/blessures | 1 | ✅ done (11-3) |
| FR-9 | Club commun lecture minimale | 1 | ✅ done (11-3) |
| FR-10 | Coach consulte séances du jour | 1 | ✅ done (4-1, 4-2) |
| FR-11 | Coach accède fiche séance (thèmes, critères) | 1 | ✅ done (4-1, 3-1→3-6) |
| FR-12 | Admin crée/modifie/archive séances | 1 | ✅ done (4-2, 19-4, 19-5) |
| FR-13 | Admin associe thèmes à séance | 1 | ✅ done (3-1, 4-2) |
| FR-14 | Coach soumet retour global séance | 1 | ✅ done (6-4) |
| FR-15 | Coach enregistre présences offline | 1 | ✅ done (5-1→5-6) |
| FR-16 | Sync automatique présences locales | 1 | ✅ done (5-4) |
| FR-17 | Alerte visible échec sync | 1 | ✅ done (5-6) |
| FR-18 | Rappel J+1 données non synchronisées | 1 | ✅ done (5-6, 7-1) |
| FR-19 | Coach consulte état sync temps réel | 1 | ✅ done (5-6) |
| FR-20 | Coach note attitude/effort enfant | 1 | ✅ done (6-1, 6-4) |
| FR-21 | Coach ajoute commentaire libre par enfant | 1 | ✅ done (6-1, 6-4) |
| FR-22 | Enfant répond quiz QCM séance | 1 | ✅ done (8-2) |
| FR-23 | Correction détaillée après quiz | 1 | ✅ done (8-2) |
| FR-24 | Coach consulte résultats quiz groupe | 1 | ✅ done (8-5) |
| FR-29 | Notification push parent clôture séance | 1 | ✅ done (7-2) |
| FR-30 | Push + email + SMS annulation urgente | 1 | ⚠️ partiel — push/email OK, SMS manquant (story 41-3 ready-for-dev) |
| FR-31 | Parent soumet ticket structuré | 1 | ⏳ modèle done (7-4), UI à confirmer |
| FR-32 | Coach/Admin répond tickets, réponse tracée | 1 | ⏳ modèle done (7-4), UI à confirmer |
| FR-33 | Notification parent → quiz post-séance | 1 | ✅ done (7-2) |
| FR-34 | Parent consulte fiche complète enfant | 1 | ✅ done (7-3, 8-5) |
| FR-35 | Parent visualise évolution enfant dans le temps | 1 | ⚠️ partiel — données OK, graphique manquant (story 55-3 non implémentée) |
| FR-41 | Dashboard agrégé multi-implantations | 1 | ✅ done (9-1→9-5, Epic 50) |
| FR-42 | Admin identifie coachs inactifs | 1 | ❌ manquant — story 41-1 ready-for-dev |
| FR-43 | Admin contacte coach depuis plateforme | 1 | ❌ manquant — story 41-2 ready-for-dev |
| FR-44 | Admin gère implantations/groupes/assignations | 1 | ✅ done (9-4, 18-x) |
| FR-57 | Check-in individuel en 1 action rapide | 1 | ✅ done (5-x) |
| FR-58 | Mode séance fonctionnel sans réseau | 1 | ✅ done (5-1→5-6) |
| FR-59 | Données locales persistantes (fermeture forcée) | 1 | ✅ done (5-2 event-sourcing) |
| FR-60 | Tokens auth renouvelés automatiquement | 1 | ✅ done (2-1 Supabase Auth) |
| FR-61 | RBAC vérifié à chaque requête côté serveur | 1 | ✅ done (2-2 RLS) |
| FR-62 | Isolation par tenant_id | 1 | ✅ done (1-2 migrations) |
| FR-63 | Données inter-implantations anonymisées | 1 | ✅ done (10-5 exports conformes) |
| FR-64 | Admin compare implantations métriques clés | 1 | ⚠️ partiel — stories 57-6 + 60-4 sans statut |
| FR-65 | Détection automatique anomalies | 1 | ✅ done (9-5 detect-anomalies Edge Function) |
| FR-66 | Admin crée/modifie/archive thème technique | 1 | ✅ done (3-1, Epic 24) |
| FR-67 | Thème contient sous-critères pédagogiques | 1 | ✅ done (3-2) |
| FR-68 | Thème classé par niveau et tranche d'âge | 1 | ✅ done (3-6) |
| FR-69 | Thème lié à plusieurs séances | 1 | ✅ done (3-1, 4-2) |
| FR-70 | Admin crée questions quiz associées à thème | 1 | ✅ done (3-5) |
| FR-71 | Génération automatique quiz séance | 1 | ✅ done (3-5, 8-2) |
| FR-72 | Résultats quiz agrégés par thème | 1 | ✅ done (8-5) |
| FR-76 | Progression par thème par enfant | 1 | ✅ done (8-1, 8-4) |
| FR-78 | Admin modifie critères validation thème | 1 | ✅ done (3-2, Epic 24) |
| FR-81 | Mise à jour contenu pédagogique sans impacter historique | 1 | ✅ done (FR92→FR94, versionning) |
| FR-82 | Admin attribue grade à coach | 1 | ✅ done (11-1) |
| FR-83 | Permissions coach varient selon grade | 1 | ✅ done (11-1, 11-2) |
| FR-84 | Accès contenu restreint si grade insuffisant | 1 | ✅ done (11-2) |
| FR-85 | Passage grade → nouveaux droits automatiques | 1 | ✅ done (11-1) |
| FR-86 | Historique grades coach | 1 | ✅ done (11-1) |
| FR-87 | Admin définit niveau partenariat club | 1 | ✅ done (11-3) |
| FR-88 | Permissions club varient selon partenariat | 1 | ✅ done (11-3) |
| FR-89 | Journalisation consultation données par club | 1 | ✅ done (10-4 audit trail) |
| FR-90 | Admin modifie niveau partenariat à tout moment | 1 | ✅ done (11-3) |
| FR-91 | Changement partenariat → droits mis à jour auto | 1 | ✅ done (11-3) |
| FR-92/93/94 | Versioning thèmes techniques | 1 | ✅ done (FR92-94 dans 3-x) |
| FR-95/96 | Gestion conflits sync + notification coach | 1 | ✅ done (5-4) |
| FR-38 | Export .ics parent | MVP | ❌ manquant — aucune story existante |

---

## Catégorie D — Dette technique identifiée

| # | Problème | Page concernée | Impact |
|---|---------|----------------|--------|
| D-1 | Stories 32-41 (UX polish, back buttons, tokens, forms) sans statut — backlog de ~36 stories UX non implémentées | Global | Moyen — stabilité UX, navigation sans back button |
| D-2 | Stories 49-2, 49-3, 49-4, 49-5, 49-6, 49-7 sans statut — bugfixes et UX abril 2026 non faits | Séances, Présences, Dashboard | Élevé — bugs actifs en production |
| D-3 | Stories 52-58 (Player Cards, Séances, Présences, Implantations, Méthodologie) sans statut — 47 stories backlog design premium | Admin | Moyen — valeur visuelle |
| D-4 | PATROL 2026-04-05 : 4 BLOCKERs et 4 WARNINGs toujours ouverts (QA summary) | À identifier | Élevé — blockers non résolus |

---

## Verdict final

**Phase 1 couverture :** ~89% des FRs Phase 1 sont implémentés (58/65).

**Top 3 FRs manquants Phase 1 :**
1. **FR-42** — Supervision coachs (tableau taux check-in, coachs inactifs) → `story 41-1`
2. **FR-30** — SMS annulation séance (triple canal push+email+SMS complet) → `story 41-3`
3. **FR-38** — Export .ics parent (aucune story existante, à créer)

**Top 2 Quick Wins :**
1. **Story 41-1 supervision coachs** — 1 journée, zéro migration, valeur directe sur KPI "zéro WhatsApp admin" — `story "Implémenter la page de supervision des coachs (story 41-1)"`
2. **Export .ics parent** — 0.5 journée, génération iCal côté client, valeur directe adoption parents — `story "Créer l'export .ics des séances pour les parents"`

**Priorité absolue avant Phase 2 :** résoudre les 4 BLOCKERs du PATROL 2026-04-05 (QA summary ligne `PATROL 2026-04-05 | ✅ PASS | ⏳ EN COURS | 4 BLOCKERs`).
