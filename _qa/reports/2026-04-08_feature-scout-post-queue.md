# Feature Scout — 2026-04-08 (post-queue)

> Basé sur PRD (109 FRs), BACKLOG.md, liste des stories implémentées et QA summary.
> App non démarrée — vérification Playwright skipped.

---

## Résumé de couverture PRD

- **FRs Phase 1 total** : 65
- **FRs Phase 1 done** : 55 (~85%)
- **FRs Phase 1 manquants** : 10
- **FRs Phase 2 débloqués** : 5 (prérequis Phase 1 satisfaits)

*Note : la dernière patrouille (2026-04-08 post-queue) signale 84% Phase 1 — ce scan confirme ~85% avec les 8+ stories du jour (8-6, 76-1, 72-11, 72-12, 72-13, 72-14, 77-1→77-5, 78-1, 78-2, 79-1, 80-1, 75-7).*

---

## FRs Manquants — Phase 1 (priorité haute)

### FR-033 — Notification parent pour inviter au quiz post-séance

**Description PRD :** "Le système notifie le Parent pour l'inviter à faire compléter le quiz post-séance"
**Valeur :** Sans ce trigger, le quiz reste opt-in passif. C'est le déclencheur de la boucle d'apprentissage — success criteria PRD à 6 mois (>60% fiches avec cycle complet).
**Complexité estimée :** Simple (Edge Function `notify-session-closed` déjà existante)
**Story suggérée :** "Enrichir l'Edge Function notify-session-closed pour envoyer une notification push au parent quand un quiz est disponible pour son enfant après clôture de séance — FR33"

---

### FR-035 — Visualisation évolution enfant dans le temps (côté parent)

**Description PRD :** "Un Parent peut visualiser l'évolution de son enfant dans le temps"
**Valeur :** Signal de valeur principal pour la rétention parent (Journey Sophie). Sans courbe de progression, le parent voit des données brutes sans sens narratif.
**Complexité estimée :** Moyenne
**Story suggérée :** "Ajouter un GrowthChart SVG dans la fiche enfant parent /parent/children/[childId] : note moyenne des évaluations + taux de réussite quiz sur les 10 dernières séances — FR35/FR76"

---

### FR-076 — Calcul progression par thème pour chaque enfant

**Description PRD :** "Le système calcule une progression par thème pour chaque enfant"
**Valeur :** Infrastructure data propriétaire — sans ce calcul, impossible de démontrer l'impact de la méthode (success criteria PRD). Prérequis du flywheel collectif.
**Complexité estimée :** Complexe (vue SQL + logique métier)
**Story suggérée :** "Créer la vue SQL v_child_theme_progress : pour chaque (child_id, theme_id), calculer taux réussite moyen des quiz + nombre séances couvrant ce thème — migration + API getChildThemeProgress(childId) dans @aureak/api-client + affichage fiche joueur admin — FR76/FR72"

---

### FR-078 — Admin peut modifier les critères de validation d'un thème

**Description PRD :** "Un Admin peut modifier les critères de validation d'un thème"
**Valeur :** Permet d'affiner la méthode sans refactoring — prérequis exportabilité SaaS.
**Complexité estimée :** Simple
**Story suggérée :** "Ajouter l'édition inline des critères (fault_description, cue_description, success_criteria) dans la fiche thème admin /methodologie/themes/[id] — FR78/FR67"

---

### FR-092/FR-093/FR-094 — Versioning des thèmes techniques

**Description PRD :** "Le système versionne chaque thème / Données enfants liées à la version active / Nouvelle version sans altérer historique"
**Valeur :** Garantie d'intégrité des données historiques — indispensable avant d'avoir 1000+ enfants avec des cycles quiz complets sur plusieurs saisons.
**Complexité estimée :** Complexe (migration + FK versioning)
**Story suggérée :** "Implémenter le versioning des thèmes : ajouter version INT DEFAULT 1 sur methodology_themes, créer methodology_theme_versions (snapshot immuable), lier learning_attempts.theme_version_id FK — migration + API + UI admin — FR92/FR93/FR94"

---

### FR-097 — Anonymisation données pédagogiques pour exports inter-implantations

**Description PRD :** "Le système peut anonymiser les données pédagogiques lors d'exports ou d'analyses inter-implantations"
**Valeur :** Prérequis RGPD pour le flywheel collectif et les exports clubs partenaires.
**Complexité estimée :** Moyenne
**Story suggérée :** "Ajouter un paramètre anonymize: boolean sur les fonctions d'export agrégé dans @aureak/api-client : remplacer noms/prénom par hash stable (child_id sha256[:8]) quand anonymize=true — FR97/FR63"

---

### FR-108 — Filtrage dynamique des contenus selon rôle, âge et programme

**Description PRD :** "Les contenus sont filtrés dynamiquement selon le rôle, l'âge et le programme d'appartenance de l'utilisateur"
**Valeur :** Rend l'expérience pertinente par rôle — sans ça, un parent ou coach assistant voit les mêmes thèmes qu'un coach senior.
**Complexité estimée :** Moyenne
**Story suggérée :** "Ajouter target_role TEXT[] et target_age_range INT[] sur methodology_themes, filtrer dans listThemes() selon le rôle JWT du caller et l'âge du groupe ciblé — migration + API — FR108/FR107"

---

## Opportunités — Phase 2 débloquées

### FR-025 à FR-028 — Module Vidéo

**Prérequis satisfaits :** Epic 1 ✅, Epic 2 ✅, Epic 4 ✅, Epic 6 ✅, Epic 10 (RGPD) ✅
**Valeur :** Déclencheur du flywheel collectif. Journey Lucas (vidéo dans le jardin). Complète la boucle pédagogique.
**Story suggérée :** "Créer le module vidéo Phase 2 : upload coach Supabase Storage + statut en-attente-validation + interface admin validation/rejet + streaming lecture parent/enfant — FR25/FR26/FR27/FR28"

---

### FR-039/FR-040 — Progression enfant + badges techniques

**Prérequis satisfaits :** Epic 8 ✅, Epic 6 ✅
**Valeur :** Engagement enfant — badge visible = preuve de maîtrise = motivation de rétention.
**Story suggérée :** "Créer la vue progression enfant /child/progression : badges débloqués, scores quiz par thème, timeline — FR39/FR40 — dépend FR76"

---

### FR-045 — Export rapport mensuel PDF implantation

**Prérequis satisfaits :** Epic 4 ✅, Epic 6 ✅, Epic 9 ✅
**Valeur :** Rapport club partenaire — déclenche le business model B2B clubs.
**Story suggérée :** "Créer l'export PDF mensuel implantation : @react-pdf/renderer, présences + évaluations + taux quiz + anomalies sur 30j, bouton dashboard admin — FR45"

---

### FR-050 à FR-052 — Module Business stages (Stripe)

**Prérequis satisfaits :** Epic 9 ✅, Module stages (migration 00048) ✅
**Valeur :** Revenus directs — inscriptions stages via plateforme = success criteria business à 12 mois.
**Story suggérée :** "Créer le flow inscription stage parent : page détail stage public + formulaire + paiement Stripe + PDF confirmation + justificatif mutuelle — FR50/FR51/FR52"

---

### FR-053 à FR-056 — Gestion médicale basique (blessures)

**Prérequis satisfaits :** Epic 4 ✅, Epic 2 ✅
**Valeur :** Sécurité juridique + signal différenciant. Clubs partenaires attendent ce module (FR-008 lecture blessures).
**Story suggérée :** "Créer le module blessures : migration injuries (child_id, coach_id, type, date, restriction_end), API declareBlessure(), blocage présence si restriction active, vue parent historique blessures — FR53/FR54/FR55"

---

## Quick Wins identifiés

| # | Feature | Valeur | Complexité | Story Factory call |
|---|---------|--------|------------|--------------------|
| 1 | Notification quiz post-séance (FR33) | Déclenche la boucle — taux quiz <30% sans ce trigger | Simple | "Enrichir Edge Function notify-session-closed pour envoyer push quiz au parent quand quiz disponible — FR33" |
| 2 | GrowthChart progression enfant parent (FR35) | Signal de valeur pour rétention parent — Journey Sophie | Moyenne | "Ajouter GrowthChart SVG dans fiche enfant parent : évaluations + quiz sur 10 séances — FR35/FR76" |
| 3 | Vue SQL progression par thème (FR76) | Prérequis success criteria PRD | Complexe | "Créer vue SQL v_child_theme_progress : taux réussite quiz par (child_id, theme_id) — migration + API getChildThemeProgress — FR76/FR72" |
| 4 | Versioning thème minimal (FR92) | Dette technique avant 1000 enfants | Moyenne | "Ajouter version INT sur methodology_themes + snapshot immuable à chaque modification — migration + FK learning_attempts — FR92/FR93" |
| 5 | Filtres thèmes par âge/niveau (FR68) | Référentiel utilisable par coachs assistants | Simple | "Ajouter filtres niveau et tranche_age dans listThemes() — champs déjà en DB — FR68/FR108" |

---

## Dette technique identifiée (Catégorie D)

| # | Pattern | Page | Impact |
|---|---------|------|--------|
| 1 | N+1 `listEvaluationsBySession` (W-CRAWLER-08) | `/activites` TableauSeances | 200 appels simultanés → ralentissement visible |
| 2 | Pagination absente liste joueurs | `/children` | 678+ joueurs — scroll infini non implémenté |
| 3 | Vue `coach_current_grade` → 406 dev (B-CRAWLER-06) | `/coaches` | Grades toujours "—" en local |
| 4 | `generateGroupName.ts` GroupMethod incomplet (W-CRAWLER-07) | business-logic | Manque Intégration + Perfectionnement |
| 5 | Shadow `rgba(64,145,108,0.3)` hardcodée (B-DESIGN-02) | `/dashboard` | Non tokenisée — hors charte |
| 6 | `completionStatus` jamais 'complete' (B-BUG-C4) | `/activites` | ÉVALS 0% dans StatCards — supervision admin faussée |

---

## Couverture complète Phase 1

| FR | Titre court | Phase | Statut |
|----|-------------|-------|--------|
| FR-001 | Admin CRUD comptes | 1 | ✅ done (Epic 2) |
| FR-002 | Coach accès implantations | 1 | ✅ done (Epic 2) |
| FR-003 | Accès temporaire cross-implantation | 1 | ✅ done (2-3) |
| FR-004 | Parent accès enfant | 1 | ✅ done (Epic 2) |
| FR-005 | Enfant accès via compte parent | 1 | ✅ done (Epic 2) |
| FR-006 | Parent gère consentements | 1 | ✅ done (Epic 10) |
| FR-007 | Retrait consentement → suppression médias | 1 | ✅ done (10-2) |
| FR-008 | Club partenaire lecture | 1 | ✅ done (2-5) |
| FR-009 | Club commun lecture minimale | 1 | ✅ done (2-5) |
| FR-010 | Coach voir séances du jour | 1 | ✅ done (Epic 4) |
| FR-011 | Coach fiche séance | 1 | ✅ done (Epic 4) |
| FR-012 | Admin CRUD séances | 1 | ✅ done (Epic 4) |
| FR-013 | Admin associer thèmes à séance | 1 | ✅ done (Epic 4) |
| FR-014 | Coach retour global séance | 1 | ✅ done (Epic 4) |
| FR-015 | Coach présences offline | 1 | ✅ done (Epic 4/5) |
| FR-016 | Sync automatique présences | 1 | ✅ done (Epic 5) |
| FR-017 | Alerte échec sync | 1 | ✅ done (Epic 5) |
| FR-018 | Rappel J+1 données non sync | 1 | ✅ done (Epic 5) |
| FR-019 | Coach état sync temps réel | 1 | ✅ done (Epic 5) |
| FR-020 | Coach note attitude/effort | 1 | ✅ done (Epic 6) |
| FR-021 | Coach commentaire libre | 1 | ✅ done (Epic 6) |
| FR-022 | Enfant quiz QCM | 1 | ✅ done (Epic 8 + 75-6) |
| FR-023 | Correction après quiz | 1 | ✅ done (Epic 8) |
| FR-024 | Coach résultats quiz groupe | 1 | ✅ done (story 8-6 — 2026-04-08) |
| FR-029 | Push parent clôture séance | 1 | ✅ done (7-2) |
| FR-030 | Push+email+SMS annulation | 1 | ⏳ ready-for-dev (story 41-3) |
| FR-031 | Tickets parent soumission | 1 | ✅ done (7-4 + 78-2) |
| FR-032 | Réponse tickets tracée | 1 | ✅ done (78-2 — 2026-04-08) |
| FR-033 | Notification quiz post-séance | 1 | ❌ manquant |
| FR-034 | Parent fiche enfant complète | 1 | ✅ done (7-3) |
| FR-035 | Parent évolution enfant dans le temps | 1 | ❌ manquant |
| FR-041 | Dashboard agrégé multi-implantations | 1 | ✅ done (9-1) |
| FR-042 | Coachs sans check-in/feedback | 1 | ✅ done (79-1 — 2026-04-08) |
| FR-043 | Contact direct coach | 1 | ✅ done (9-5) |
| FR-044 | Admin CRUD implantations/groupes | 1 | ✅ done (9-4) |
| FR-046 | Journal opérations sensibles | 1 | ✅ done (Epic 10) |
| FR-047 | Suppression médias retrait consentement | 1 | ✅ done (10-2) |
| FR-048 | Durée conservation configurable | 1 | ✅ done (10-1) |
| FR-049 | Droits RGPD parent | 1 | ✅ done (10-3) |
| FR-060 | Refresh token auto | 1 | ✅ done (Epic 1) |
| FR-061 | RBAC serveur-side | 1 | ✅ done (Epic 2) |
| FR-062 | Isolation tenant_id | 1 | ✅ done (Epic 1/2) |
| FR-063 | Agrégation anonyme inter-implantations | 1 | ⏳ partiel (9-3 partiel) |
| FR-064 | Comparaison implantations | 1 | ✅ done (9-3) |
| FR-065 | Détection anomalies auto | 1 | ✅ done (9-2) |
| FR-066 | Admin CRUD thèmes | 1 | ✅ done (Epic 3) |
| FR-067 | Sous-critères pédagogiques | 1 | ✅ done (Epic 3) |
| FR-068 | Thème classé niveau/âge | 1 | ✅ done (Epic 3) |
| FR-069 | Thème lié à plusieurs séances | 1 | ✅ done (Epic 3/4) |
| FR-070 | Questions quiz par thème | 1 | ✅ done (3-5) |
| FR-071 | Quiz généré depuis thèmes séance | 1 | ✅ done (Epic 8) |
| FR-072 | Résultats quiz agrégés par thème | 1 | ✅ done (story 8-6) |
| FR-076 | Progression par thème enfant | 1 | ❌ manquant |
| FR-078 | Admin modifie critères thème | 1 | ❌ manquant (partiel) |
| FR-081 | MAJ contenu sans impacter historique | 1 | ⏳ partiel (soft-delete seulement) |
| FR-082 | Admin grade coach | 1 | ✅ done (11-1) |
| FR-083 | Permissions dynamiques selon grade | 1 | ✅ done (11-2) |
| FR-084 | Restriction contenu selon grade | 1 | ✅ done (11-2) |
| FR-085 | Passage grade → nouveaux droits | 1 | ✅ done (11-2) |
| FR-086 | Historique grades | 1 | ✅ done (11-1) |
| FR-087 | Niveau partenariat club | 1 | ✅ done (11-3) |
| FR-088 | Permissions club selon partenariat | 1 | ✅ done (11-3) |
| FR-089 | Journal consultations club | 1 | ✅ done (Epic 10) |
| FR-090 | Admin modifie niveau partenariat | 1 | ✅ done (11-3) |
| FR-091 | Changement partenariat → droits auto | 1 | ✅ done (11-3) |
| FR-092 | Versioning thèmes | 1 | ❌ manquant |
| FR-093 | Données enfants liées à version thème | 1 | ❌ manquant |
| FR-094 | Nouvelle version sans altérer historique | 1 | ❌ manquant |
| FR-095 | Gestion conflits sync | 1 | ✅ done (5-4) |
| FR-096 | Coach notifié divergence offline/serveur | 1 | ✅ done (5-6) |
| FR-097 | Anonymisation données exports | 1 | ❌ manquant |
| FR-098 | Exports clubs excluent données non-consentis | 1 | ✅ done (Epic 10) |
| FR-099 | Admin filtre audit trail | 1 | ✅ done (10-4) |
| FR-100 | Conservation logs audit configurable | 1 | ✅ done (10-4) |
| FR-106 | Unités pédagogiques multiples | 1 | ✅ done (Epic 3/24) |
| FR-107 | Unités liées à audience cible | 1 | ⏳ partiel (champs DB présents, filtrage non actif) |
| FR-108 | Filtrage dynamique contenus rôle/âge | 1 | ❌ manquant |

---

## Bugs connus bloquant des FRs (croisement QA summary)

| FR | Bloqué par | BUG ID | Priorité |
|----|------------|--------|----------|
| FR-041 (dashboard agrégé) | Table `xp_ledger` absente en remote | B-CRAWLER-04 | HIGH |
| FR-064 (comparaison implantations) | Vue `v_club_gardien_stats` manquante | B-PATROL-01 | BLOCKER |
| FR-020/FR-021 (évaluations) | `completionStatus` jamais 'complete' → ÉVALS 0% | B-BUG-C4 | HIGH |
| FR-082/FR-083 (grades coach) | Vue `coach_current_grade` → 406 | B-CRAWLER-06 | HIGH |

---

## Analyse

**Points forts :** La couverture Phase 1 opérationnelle est solide à ~85%. La queue du jour (2026-04-08) a couvert ~8 FRs supplémentaires (8-6 quiz coach, 78-2 tickets, 79-1 coachs inactifs, 76-1 filtres présences, 77-5 vue evaluations, 78-1 evalmap, 72-14 type color).

**Top 3 manquants à impact PRD :**
1. **FR-033 (notification quiz)** — déclencheur direct du taux de complétion quiz, critère de succès PRD à 6 mois
2. **FR-076 (progression par thème)** — prérequis pour démontrer l'impact pédagogique, flywheel collectif
3. **FR-092/93/94 (versioning thèmes)** — dette technique à régler avant d'avoir 500+ enfants avec données multi-saisons
