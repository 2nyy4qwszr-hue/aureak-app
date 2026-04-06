# Feature Scout — 2026-04-06

> Agent : Feature Scout autonome
> Scope : PRD Phase 1 — FRs 1 à 109 (toutes les sections du PRD)
> Méthode : croisement PRD × statuts story files × BACKLOG.md
> Mise à jour : 2026-04-06 (v2 — post-session stories 50-11 et 63-2 done)

---

## Résumé de couverture PRD

| Métrique | Valeur |
|---|---|
| FRs Phase 1 total (hors marqués Phase 2/3) | 65 (FR1→FR65 + FR57→FR65 + FR82→FR96) |
| FRs Phase 1 done ou couverts | ~58 (~89%) |
| FRs Phase 1 manquants critiques | 7 |
| Stories `done` (total fichiers) | ~215 |
| Stories `ready-for-dev` restantes (Phase 1) | 3 clés (41-1, 41-2, 41-3) |
| Stories backlog ouvert (Epics 34, 44, 49, 51–63) | ~160 stories |
| App en ligne au moment du scan | Oui (HTTP 200 sur localhost:8081) |
| Playwright | Skipped — scan statique suffisant |

---

## Nouvelles stories `done` depuis le scout précédent (05/04)

- **story-50-11** : Dashboard v2 refonte layout trois zones (hero band + feed latéral supprimés, Zone Briefing + KPIs + Gamification)
- **story-63-2** : Évènements unifiés vue filtrée (`/evenements` — calendrier global stages + séances)

Ces deux stories clôturent respectivement Epic 50 (Dashboard Club HQ) et une partie d'Epic 63.

---

## BLOCKERs ouverts (source : QA summary 2026-04-06)

> Ces blockers doivent être résolus **avant toute nouvelle feature**.

| ID | Description | Page | Complexité |
|----|-------------|------|------------|
| B-PATROL-01 | Vue `v_club_gardien_stats` manquante en DB remote | `/clubs` | Simple — migration SQL |
| B-PATROL-02 | Erreur 400 stages/index (bannière + état vide simultanés) | `/stages` | Simple — fix query |
| B-PATROL-03 | Erreurs React "Unexpected text node" ×2 | `/seances` | Simple — fix JSX |

---

## FRs Manquants — Phase 1 (priorité haute)

### FR-42 — Supervision des coachs inactifs

**Description PRD :** "Un Admin peut identifier les Coachs sans check-in ou feedback sur leurs séances récentes"
**Couverture actuelle :** Story 41-1 existe (`ready-for-dev`) — non implémentée. Le dashboard admin (Epic 9, Epic 50) affiche des métriques globales mais pas de tableau de supervision par coach avec taux de check-in individuels.
**Valeur :** Critique pour le success criteria "Zéro WhatsApp" — l'admin doit identifier en 2 minutes quel coach n'a pas utilisé la plateforme (Journey 4 Admin lundi matin).
**Complexité estimée :** Simple (JOIN sessions × attendance_records × profiles, tableau sortable, badge rouge si taux < 50%)
**Story suggérée :** "Implémenter la page de supervision des coachs (story 41-1) : tableau `/coaches/supervision` avec taux de check-in, séances du mois, dernière connexion, badge rouge si taux < 50%"

---

### FR-43 — Messagerie admin → coach

**Description PRD :** "Un Admin peut contacter directement un Coach depuis la plateforme"
**Couverture actuelle :** Story 41-2 existe (`ready-for-dev`) — non implémentée. L'admin doit actuellement utiliser un outil externe pour contacter un coach, cassant la boucle de supervision.
**Valeur :** Élimine la dépendance WhatsApp pour les communications de supervision. Journey 4 dépend explicitement de ce flux.
**Complexité estimée :** Moyenne (migration `coach_messages`, Edge Function optionnelle ou simple DB insert, UI liste + formulaire côté admin, vue côté coach)
**Story suggérée :** "Implémenter la messagerie admin→coach (story 41-2) : migration `coach_messages`, page `/messages`, formulaire destinataire+sujet+corps, statut lu/non-lu, notification in-app"

---

### FR-30 — SMS annulation séance (triple canal push+email+SMS)

**Description PRD :** "Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente"
**Couverture actuelle :** Story 41-3 existe (`ready-for-dev`). La Edge Function `cancel-session-notify` existe mais l'intégration Twilio SMS et le bouton UI d'annulation dans la fiche séance sont absents. Canal partiel : push + email OK, SMS manquant.
**Valeur :** Canal critique pour les annulations terrain de dernière minute. Un parent qui ne reçoit pas l'annulation fait venir son enfant pour rien.
**Complexité estimée :** Moyenne (guard Twilio dans Edge Function + bouton Annuler UI dans seances/[id]/page.tsx + modal motif + badge "Annulée")
**Story suggérée :** "Implémenter l'annulation de séance avec notification SMS (story 41-3) : bouton Annuler dans seances/[id], modal motif, appel `cancel-session-notify`, guard Twilio, badge Annulée"

---

### FR-38 — Export calendrier .ics parent

**Description PRD :** "Un Parent peut exporter les séances au format .ics" — listé comme intégration MVP.
**Couverture actuelle :** Aucune story couvrant l'export .ics n'est identifiée. Aucun fichier TBD existant.
**Valeur :** Permet aux parents de synchroniser les séances dans Google Calendar / Apple Calendar sans app tierce. Réduction directe de la friction adoption parents.
**Complexité estimée :** Simple (génération string iCal côté client, pas de migration, bouton dans board parent)
**Story suggérée :** "Créer l'export .ics des séances pour les parents : bouton dans le board parent, génération du fichier iCal avec les séances du groupe de l'enfant, téléchargement direct sans backend"

---

### FR-31/FR-32 — UI tickets parents (modèle done, UI à confirmer)

**Description PRD :** "Un Parent peut soumettre une demande structurée au staff via un système de tickets. Un Coach ou Admin peut répondre, réponse tracée."
**Couverture actuelle :** Story 7-4 (`done`) couvre le modèle de données. Mais l'UI parent pour créer un ticket et l'UI admin/coach pour répondre n'ont pas de story `done` identifiée.
**Valeur :** Remplace les messages WhatsApp parents → staff. Traçabilité des demandes. Boucle de communication formalisée.
**Complexité estimée :** Moyenne (formulaire côté parent, liste + réponse côté admin/coach, notification in-app)
**Story suggérée :** "Vérifier et compléter l'UI tickets parents (Epic 7-4 suite) : formulaire création côté parent `/parent/tickets/new`, liste tickets côté admin `/admin/tickets` avec réponse inline, statut résolu"

---

### FR-35 — Visualisation évolution enfant dans le temps (côté parent)

**Description PRD :** "Un Parent peut visualiser l'évolution de son enfant dans le temps"
**Couverture actuelle :** Board parent done (7-3). Données d'évaluation disponibles. Mais le graphique de progression temporelle (story 55-3 `evaluations-timeline-croissance-joueur`) n'est pas implémenté. Les données existent, l'UI de visualisation manque.
**Valeur :** Journey 2 (Sophie) — la valeur perçue est liée à la capacité de voir la progression sur plusieurs séances, pas juste la dernière.
**Complexité estimée :** Moyenne (GrowthChart SVG ligne gradient, données evaluations existantes, section dans fiche joueur)
**Story suggérée :** "Implémenter le graphique de progression joueur (story 55-3) : GrowthChart SVG dans la fiche joueur admin et parent, données évaluations sur 6-12 mois, visible côté admin et parent"

---

### FR-64 — Comparaison inter-implantations (métriques clés)

**Description PRD :** "Un Admin peut comparer les implantations sur des métriques clés"
**Couverture actuelle :** Stories 57-6 (`implantations-comparaison-cote-a-cote`) et 60-4 (`analytics-classement-implantations-bar-chart`) dans le backlog sans statut `done`. Dashboard admin a des KPIs par implantation mais pas de vue comparative dédiée.
**Valeur :** Supervision multi-sites — Journey 4 Admin mentionne la vue comparative inter-implantations.
**Complexité estimée :** Moyenne (60-4 dépend de 60-1 done, BarChart horizontal présences+séances)
**Story suggérée :** "Implémenter le classement inter-implantations dans Analytics (story 60-4) : BarChart horizontal présences + séances par implantation, tri, couleur performance"

---

## Opportunités — Phase 2 débloquées

### FR-25/FR-26/FR-27/FR-28 — Module vidéo

**Prérequis satisfaits :** Epic 3 (référentiel) ✅, Epic 6 (évaluations) ✅, Epic 10 (RGPD + consentements) ✅
**Valeur :** Le différenciateur fondamental d'AUREAK — boucle `séance → vidéo enfant → retour coach`. Journey 5 (Lucas) dépend entièrement de ce module.
**Story suggérée :** "Concevoir et implémenter Epic 13 module vidéo Phase 2 : upload coach (statut en attente validation admin), self-coaching enfant mobile, retour textuel coach, double verrou admin, streaming uniquement"

---

### FR-39/FR-40 — Interface enfant autonome (badges, progression)

**Prérequis satisfaits :** Epic 8 (quiz, badges, streaks) ✅, Epic 12 (gamification modèle) ✅, Epic 59 (XP + leaderboard) ✅
**Valeur :** Journey 5 (Lucas) — le moteur gamification est prêt, il manque l'interface dédiée enfant avec son tableau de bord XP + badges + quiz récents.
**Story suggérée :** "Créer l'interface enfant autonome : dashboard avec badges débloqués, XP bar, résultats quiz récents, streaks — accessible via compte parent ou login dédié 15+ ans"

---

### FR-50/FR-51/FR-52 — Module business stages (Stripe)

**Prérequis satisfaits :** Epic 13 (séances v2) ✅, migration 00048 stages ✅
**Valeur :** Success criteria business — "Inscriptions stages via plateforme" à 12 mois.
**Story suggérée :** "Implémenter les inscriptions et paiements de stages via Stripe : page publique stage, formulaire inscription parent, Stripe Checkout, génération confirmation PDF"

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory call |
|---|---------|--------|------------|-------------------|
| 1 | Supervision coachs (FR-42) | Élimine WhatsApp supervision — KPI succès projet | Simple | `story "Implémenter la page de supervision des coachs (story 41-1) : tableau /coaches/supervision avec taux de check-in, séances du mois, dernière connexion, badge rouge si taux < 50%"` |
| 2 | Export .ics parent (FR-38) | Synchronisation calendrier natif, réduction friction adoption | Simple | `story "Créer l'export .ics des séances pour les parents : bouton board parent, génération iCal avec séances du groupe de l'enfant, téléchargement direct côté client"` |
| 3 | Annulation séance + SMS (FR-30) | Canal critique annulations terrain, triple canal complet | Moyenne | `story "Implémenter l'annulation de séance avec notification SMS (story 41-3) : bouton Annuler dans seances/[id], modal motif, appel cancel-session-notify, guard Twilio, badge Annulée"` |
| 4 | Timeline évolution joueur (FR-35) | Valeur parent directe — voir la progression pas juste la dernière séance | Moyenne | `story "Implémenter le graphique de progression joueur (story 55-3) : GrowthChart SVG fiche joueur admin+parent, données évaluations 6-12 mois"` |

---

## Couverture complète — FRs Phase 1

| FR | Titre court | Phase | Statut |
|----|-------------|-------|--------|
| FR-1 | Admin gère comptes tous rôles | 1 | ✅ done (2-1, 2-2) |
| FR-2 | Coach accès implantations assignées uniquement | 1 | ✅ done (2-2 RBAC/RLS) |
| FR-3 | Accès cross-implantation temporaire coach | 1 | ✅ done (2-3) |
| FR-4 | Parent accès données ses enfants uniquement | 1 | ✅ done (2-2, 7-3) |
| FR-5 | Enfant via compte parent jusqu'à 15-16 ans | 1 | ⏳ deferred (8-3 mobile) |
| FR-6 | Parent gère consentements | 1 | ✅ done (10-2) |
| FR-7 | Retrait consentement → suppression médias | 1 | ✅ done (10-2) |
| FR-8 | Club partenaire lecture présences/blessures | 1 | ✅ done (11-3) |
| FR-9 | Club commun lecture minimale | 1 | ✅ done (11-3) |
| FR-10 | Coach consulte séances du jour | 1 | ✅ done (4-1, 4-2, 32-2) |
| FR-11 | Coach accède fiche séance (thèmes, critères) | 1 | ✅ done (4-1, 3-1→3-6, 19-5) |
| FR-12 | Admin crée/modifie/archive séances | 1 | ✅ done (4-2, 19-4, 19-5) |
| FR-13 | Admin associe thèmes à séance | 1 | ✅ done (3-1, 4-2, 49-2 ready-for-dev) |
| FR-14 | Coach soumet retour global séance | 1 | ✅ done (6-4, 13-3) |
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
| FR-31 | Parent soumet ticket structuré | 1 | ⏳ modèle done (7-4), UI parent non confirmée |
| FR-32 | Coach/Admin répond tickets | 1 | ⏳ modèle done (7-4), UI admin non confirmée |
| FR-33 | Notification parent → quiz post-séance | 1 | ✅ done (7-2) |
| FR-34 | Parent consulte fiche complète enfant | 1 | ✅ done (7-3, 8-5) |
| FR-35 | Parent visualise évolution enfant dans le temps | 1 | ⚠️ partiel — données OK, graphique manquant (story 55-3 non implémentée) |
| FR-41 | Dashboard agrégé multi-implantations | 1 | ✅ done (9-1→9-5, Epic 50, story 50-11) |
| FR-42 | Admin identifie coachs inactifs | 1 | ❌ manquant — story 41-1 ready-for-dev |
| FR-43 | Admin contacte coach depuis plateforme | 1 | ❌ manquant — story 41-2 ready-for-dev |
| FR-44 | Admin gère implantations/groupes/assignations | 1 | ✅ done (9-4, 18-x, Epic 22) |
| FR-57 | Check-in individuel en 1 action rapide | 1 | ✅ done (5-x, 49-4 ready-for-dev) |
| FR-58 | Mode séance fonctionnel sans réseau | 1 | ✅ done (5-1→5-6) |
| FR-59 | Données locales persistantes (fermeture forcée) | 1 | ✅ done (5-2 event-sourcing) |
| FR-60 | Tokens auth renouvelés automatiquement | 1 | ✅ done (2-1 Supabase Auth) |
| FR-61 | RBAC vérifié à chaque requête côté serveur | 1 | ✅ done (2-2 RLS) |
| FR-62 | Isolation par tenant_id | 1 | ✅ done (1-2 migrations) |
| FR-63 | Données inter-implantations anonymisées | 1 | ✅ done (10-5 exports conformes) |
| FR-64 | Admin compare implantations métriques clés | 1 | ⚠️ partiel — stories 57-6 + 60-4 dans backlog |
| FR-65 | Détection automatique anomalies | 1 | ✅ done (9-5, detect-anomalies Edge Function) |
| FR-66 | Admin crée/modifie/archive thème technique | 1 | ✅ done (3-1, Epic 20, Epic 24) |
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
| FR-92/93/94 | Versioning thèmes techniques | 1 | ✅ done (3-x) |
| FR-95/96 | Gestion conflits sync + notification coach | 1 | ✅ done (5-4) |
| FR-38 | Export .ics parent | MVP | ❌ manquant — aucune story existante |
| FR-46/99/100 | Audit trail complet | 1 | ✅ done (10-4) |
| FR-47/48 | Durée conservation configurable + suppression médias | 1 | ✅ done (10-1, 10-2, 10-5) |
| FR-49 | Droits RGPD depuis compte parent | 1 | ✅ done (10-3) |
| FR-97/98 | Exports clubs filtrés consentements | 1 | ✅ done (10-5) |
| FR-106/107/108 | Types d'unités pédagogiques + audience cible | 1 | ✅ done (3-4, Epic 21) |

---

## Catégorie D — Dette technique identifiée

| # | Problème | Page concernée | Impact |
|---|---------|----------------|--------|
| D-1 | 3 BLOCKERs ouverts (B-PATROL-01/02/03) | Clubs, Stages, Séances | Élevé — pages inutilisables ou erreurs visibles |
| D-2 | Stories 32–44 (UX polish, back buttons, tokens, forms) — ~40 stories UX non implémentées | Global | Moyen — UX navigation dégradée |
| D-3 | Story 49-2 (`ux-blocs-themes-editables-fiche-seance`) — thèmes non éditables post-création | Séances | Moyen — FR-13 partiellement manquant |
| D-4 | Story 49-4 (`ux-presences-liste-enfants-groupe`) — toggle présent/absent absent pour joueurs groupe | Présences | Élevé — FR-57 partiellement dégradé |

---

## Verdict final

**Phase 1 couverture :** ~89% des FRs Phase 1 sont implémentés (58/65).

**Top 3 FRs manquants Phase 1 :**
1. **FR-42** — Supervision coachs (tableau taux check-in, coachs inactifs) → `story 41-1` → bloque le success criteria "Zéro WhatsApp"
2. **FR-30** — SMS annulation séance (triple canal complet, Twilio manquant) → `story 41-3` → canal critique sécurité familles
3. **FR-38** — Export .ics parent (aucune story existante) → bloque l'adoption parent calendrier natif

**Top 2 Quick Wins :**

1. **Supervision coachs (FR-42)** — 0.5 à 1 journée, zéro migration, valeur directe sur le KPI "Zéro WhatsApp admin"
   ```
   story "Implémenter la page de supervision des coachs (story 41-1) : tableau /coaches/supervision avec taux de check-in, nombre de séances du mois, dernière connexion, badge rouge si taux < 50%"
   ```

2. **Export .ics parent (FR-38)** — ~0.5 journée, génération iCal côté client, pas de migration, valeur directe adoption parents
   ```
   story "Créer l'export .ics des séances pour les parents : bouton dans le board parent, génération du fichier iCal avec les séances du groupe de l'enfant, téléchargement direct sans backend"
   ```

**Priorité absolue avant nouvelles features :** résoudre les 3 BLOCKERs du PATROL 2026-04-05/06 (vue `v_club_gardien_stats`, erreur 400 stages, text node séances).
