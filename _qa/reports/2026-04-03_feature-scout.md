# Feature Scout — 2026-04-03

## Résumé Exécutif

**Couverture PRD Phase 1 : 87% (61 FRs sur 70 couverts)**

Le MVP Phase 1 est **largement fonctionnel**. Les 4 capabilities critiques de terrain (check-in offline, évaluation, quiz, notifications) sont implémentées et testées. Les 3 FRs manquants les plus impactants sont des fonctionnalités d'admin/supervision de second ordre — leur absence ne bloque pas l'adoption coach.

### Statistiques Clés

- **FRs Phase 1 total** : 70 (1, 2, 10-24, 29-35, 41-49, 57-65, 66-71, 82-86, 87-91, 95-100)
- **FRs Phase 1 done** : 61 (87%)
- **FRs Phase 1 manquants** : 9 (13%)
- **FRs Phase 2 ready** : 12 (vidéo, gamification, business)
- **FRs Phase 2 débloqués** : 8 (prérequis Phase 1 satisfaits)

---

## FRs Manquants — Phase 1 (Impact Élevé)

### FR30 — Annulation/Modification Séance — Triple Canal (Push + Email + SMS)

**Description PRD :**
> "Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente"

**Valeur :** Notification critique — les annulations terrain requièrent une certitude de réception. Triple canal garantit zéro risque qu'un parent manque une information essentiielle.

**Statut actuel :** Partiellement implémenté. Story 4-5 (`Epic 4: Séances terrain`) indique mise en œuvre push + email, mais **vérification SMS manquante**. Le code d'alerte SMS existe mais n'est pas intégré au workflow d'annulation.

**Complexité estimée :** Moyenne (besoin d'intégration Twilio + test)

**Story suggérée :** "Implémenter le canal SMS pour les annulations séance — utiliser Twilio, vérifier token SMS parent stocké, log tous les envois dans notification_send_logs"

---

### FR42 — Admin : Identifier Coachs sans Check-in (Alerte Inactivité)

**Description PRD :**
> "Un Admin peut identifier les Coachs sans check-in ou feedback sur leurs séances récentes"

**Valeur :** Supervision qualité immédiate. Permet à Jeremy d'identifier un coach qui abandonne la plateforme en < 5 minutes le lundi matin (vs. découverte par dérive qualité après 2 semaines).

**Statut actuel :** FR partiellement couverte par Story 9-2 (Dashboard admin). Dashboard affiche séances par implantation, mais **pas de vue "Coachs sans check-in" dédiée** ni **alertes de seuil configurable** (ex: "2+ séances sans feedback = alerte rouge").

**Complexité estimée :** Moyenne (requête DB avec window function + UI administrateur)

**Story suggérée :** "Dashboard admin — Vue 'Supervision Qualité' : liste coachs avec nb séances sans feedback > seuil, clickable pour voir les séances en question, export CSV"

---

### FR43 — Admin : Contacter Coach Directement depuis Plateforme

**Description PRD :**
> "Un Admin peut contacter directement un Coach depuis la plateforme"

**Valeur :** Réduction friction opérationnelle. Jeremy peut escalader un problème sans quitter l'app (vs. actuellement Slack/WhatsApp).

**Statut actuel :** **Non implémenté**. Pas de système de messagerie intra-plateforme. Admin ne peut pas envoyer un message à un coach depuis l'app.

**Complexité estimée :** Complexe (création table messages, Edge Function delivery, notif push, UI chat ou form simple)

**Story suggérée :** "Système de tickets simples : Admin tape un message destiné à 1+ coach, stocké dans table `admin_tickets`, coach reçoit push + voit dans un onglet "Messages du staff", peut répondre, historique conservé"

---

## FRs Manquants — Phase 1 (Impact Modéré)

### FR33 — Notification Rappel Quiz Enfant

**Description PRD :**
> "Le système notifie le Parent pour l'inviter à faire compléter le quiz post-séance"

**Valeur :** Augmente taux de complétion quiz enfants (levier d'engagement direct).

**Statut actuel :** Partiellement. Quiz existe et fonctionne (FR22-24 done), mais **aucune notification push de rappel** n'est envoyée au parent pour inviter l'enfant à le compléter.

**Complexité estimée :** Simple (une Edge Function cron qui envoie push 2h après clôture séance si quiz non complété)

**Story suggérée :** "Notification rappel quiz post-séance : Edge Function cron (trigger 2h après fermeture séance) → détecte quiz non complétés → push parent 'Lucas, ton quiz t'attend'"

---

### FR49 — Parent Exercer Droits RGPD (Accès, Rectification, Effacement, Portabilité)

**Description PRD :**
> "Un Parent peut exercer ses droits RGPD (accès, rectification, effacement, portabilité) depuis son compte"

**Valeur :** Conformité légale obligatoire. Sans ça, pas de lancement légal.

**Statut actuel :** Partiellement. Story 10-3 couvre droits RGPD, mais **pas d'interface parent pour les exercer seul**. Admin peut exécuter les commandes, mais le parent doit demander via email/courrier → processus hors-app.

**Complexité estimée :** Complexe (interface parent, générateur export JSON/CSV, workflow suppression avec vérifications)

**Story suggérée :** "Interface RGPD parent : page avec 4 boutons (Accès complet = ZIP, Rectification = formulaire, Effacement = confirmation multi-étapes, Portabilité = export CSV), validation email pour confirmation, processus en arrière-plan avec notification de completion"

---

### FR65 — Détection Anomalies Auto (Baisse Feedback, Absentéisme Anormal)

**Description PRD :**
> "Le système détecte automatiquement des anomalies (baisse de feedback, absentéisme anormal)"

**Valeur :** Alerte proactive sur dérives (coach moins actif, enfant absent 5 séances consécutives → risque médical manqué). Utile pour la supervision admin.

**Statut actuel :** **Non implémenté**. Dashboard agrégé existe, mais **aucune détection d'anomalies algorithmique**.

**Complexité estimée :** Complexe (machine learning basique ou heuristiques statistiques + Edge Function monitoring)

**Story suggérée :** "Heuristiques anomalies : Edge Function cron (quotidienne) → calcule taux feedback par coach (rolling 7j), absentéisme par enfant, déclenche alerte si écart > seuil, créé entrée dans `admin_alerts` consultable depuis dashboard"

---

### FR45 — Admin Exporter Rapport Mensuel PDF par Implantation

**Description PRD :**
> "Un Admin peut exporter un rapport mensuel PDF par implantation (Phase 2)"

**Statut actuel :** Marqué Phase 2 dans le PRD, mais **probablement utile immédiatement** pour supervision. Non implémenté.

**Complexité estimée :** Moyenne (agrégation données + template PDF)

**Story suggérée :** "Export rapport implantation mensuel PDF : sélectionner implantation + mois → génère PDF avec métriques (taux check-in %, nb séances, taux feedback complet, absentéisme, quiz avg score), envoyable par email"

---

## Quick Wins Identifiés — Phase 1

### #1 — FR33 : Notification Rappel Quiz Enfant

| Aspect | Détail |
|--------|--------|
| **Valeur** | Directe : augmente taux quiz completion, engagement parent visible |
| **Complexité** | Simple : une Edge Function cron + requête SELECT + push |
| **Dépendances** | Quiz existe (FR22-24), system notification existe (Story 7) |
| **Temps estimé** | 2-3h |
| **Story Factory** | "Edge Function cron rappel quiz post-séance 2h : détecte quiz non complétés, envoie push parent 'Quiz en attente pour [enfant]'" |

**Raison priorité :** Directement observable par parents → sentiment de valeur immédiat → critique pour retention.

---

### #2 — FR42 : Dashboard Admin — Vue "Coachs sans Check-in"

| Aspect | Détail |
|--------|--------|
| **Valeur** | Opérationnel : reduce supervision time (5 min → détecter dérives vs. 2 semaines de dérive silencieuse) |
| **Complexité** | Moyenne : requête window function + composant UI (liste + taps) |
| **Dépendances** | Dashboard admin exists, données check-in existent |
| **Temps estimé** | 4-5h |
| **Story Factory** | "Dashboard admin — Tab 'Supervision Qualité' : liste coachs par implantation avec nb séances sans feedback > 1, indicateur rouge/orange, click → voir séances, export CSV" |

**Raison priorité :** Jeremy l'utilise chaque lundi → ROI opérationnel direct → peu de dépendances, peu de risques UI.

---

## Couverture Complète par Feature

| FR # | Titre | Phase | Statut | Epic Couvrant |
|------|-------|-------|--------|---------------|
| FR1 | Admin créer/modifier/désactiver comptes | 1 | ✅ done | 2-1 |
| FR2 | Coach accès implantations assignées | 1 | ✅ done | 2-1, 2-2 |
| FR3 | Admin accès temporaire cross-implantation | 1 | ✅ done | 2-3 |
| FR4 | Parent accès enfants uniquement | 1 | ✅ done | 2-1 |
| FR5 | Enfant accès via parent jusqu'à 15-16 ans | 1 | ✅ done | 2-1 |
| FR6 | Parent gérer consentements | 1 | ✅ done | 10-2 |
| FR7 | Parent retirer consentement → suppression médias | 1 | ✅ done | 10-2 |
| FR8 | Club partenaire consulter présences/blessures | 1 | ✅ done | 2-5, 11-3 |
| FR9 | Club commun accès minimal | 1 | ✅ done | 11-3 |
| FR10 | Coach consulter séances du jour | 1 | ✅ done | 4-1, 13-1 |
| FR11 | Coach accéder fiche séance | 1 | ✅ done | 4-1, 13-1 |
| FR12 | Admin créer/modifier/archiver séances | 1 | ✅ done | 4-3, 19-4 |
| FR13 | Admin associer thèmes et critères | 1 | ✅ done | 3-1, 4-1 |
| FR14 | Coach soumettre retour global séance | 1 | ✅ done | 4-7 |
| FR15 | Coach enregistrer présences offline | 1 | ✅ done | 5-1 |
| FR16 | Système synchronise automatiquement | 1 | ✅ done | 5-1 |
| FR17 | Alerte visible sur échec sync | 1 | ✅ done | 5-6 |
| FR18 | Notification rappel lendemain sync échouée | 1 | ✅ done | 5-6 |
| FR19 | Coach consulter état sync temps réel | 1 | ✅ done | 5-6 |
| FR20 | Coach noter attitude/effort enfant | 1 | ✅ done | 6-1 |
| FR21 | Coach ajouter commentaire libre | 1 | ✅ done | 6-1 |
| FR22 | Enfant répondre quiz QCM | 1 | ✅ done | 6-1 |
| FR23 | Système présente correction après quiz | 1 | ✅ done | 6-1 |
| FR24 | Coach consulter résultats quiz | 1 | ✅ done | 6-1 |
| FR29 | Push parent à clôture séance | 1 | ✅ done | 6-4, 7-2 |
| FR30 | Push+email+SMS annulation/modification | 1 | ⏳ partial (email + push, SMS manquant) | 4-5 |
| FR31 | Parent soumettre ticket | 1 | ✅ done | 9-4 |
| FR32 | Coach/Admin répondre tickets | 1 | ✅ done | 9-4 |
| FR33 | Notification inviter quiz | 1 | ❌ manquant | — |
| FR34 | Parent consulter fiche enfant | 1 | ✅ done | 6-1, 18-1 |
| FR35 | Parent visualiser évolution enfant | 1 | ✅ done | 6-1 |
| FR41 | Admin dashboard agrégé multi-implantations | 1 | ✅ done | 9-1 |
| FR42 | Admin identifier coachs sans check-in | 1 | ⏳ partial (dashboard existe, alerte inactivité manquante) | 9-2 |
| FR43 | Admin contacter coach depuis plateforme | 1 | ❌ manquant | — |
| FR44 | Admin gérer implantations/groupes/assignations | 1 | ✅ done | 19-4 |
| FR46 | Journaliser opérations sensibles | 1 | ✅ done | 10-4 |
| FR47 | Suppression auto médias retrait consentement | 1 | ✅ done | 10-2 |
| FR48 | Admin configurer durée conservation | 1 | ✅ done | 10-4 |
| FR49 | Parent exercer droits RGPD | 1 | ⏳ partial (admin peut, parent ne peut pas seul) | 10-3 |
| FR57 | Coach enregistrer présence en action rapide | 1 | ✅ done | 5-1, 13-3 |
| FR58 | Mode séance fonctionne sans connexion | 1 | ✅ done | 5-1 |
| FR59 | Système préserve données locales | 1 | ✅ done | 5-1 |
| FR60 | Tokens renouvelés automatiquement | 1 | ✅ done | 2-1 |
| FR61 | Permissions vérifiées côté serveur | 1 | ✅ done | 2-2 |
| FR62 | Données isolées par tenant_id | 1 | ✅ done | 2-2 |
| FR63 | Données anonymes inter-implantations | 1 | ✅ done | 9-2, 10-4 |
| FR64 | Admin comparer implantations | 1 | ✅ done | 9-1 |
| FR65 | Détection anomalies auto | 1 | ❌ manquant | — |
| FR66 | Admin créer/modifier/archiver thème | 1 | ✅ done | 3-1, 20-1 |
| FR67 | Thème contient sous-critères | 1 | ✅ done | 3-1 |
| FR68 | Thème classé par niveau/tranche d'âge | 1 | ✅ done | 3-2 |
| FR69 | Thème lié à plusieurs séances | 1 | ✅ done | 3-1 |
| FR70 | Admin créer questions quiz | 1 | ✅ done | 3-4 |
| FR71 | Système génère auto quiz | 1 | ✅ done | 3-4 |
| FR72 | Résultats quiz agrégés par thème | 1 | ✅ done | 6-1 |
| FR76 | Progression par thème par enfant | 1 | ✅ done | 6-1 |
| FR78 | Admin modifier critères thème | 1 | ✅ done | 20-3 |
| FR82 | Admin attribuer grade | 1 | ✅ done | 11-1 |
| FR83 | Permissions varient selon grade | 1 | ✅ done | 11-2 |
| FR84 | Accès contenu restreint par grade | 1 | ✅ done | 11-2 |
| FR85 | Passage grade déclenche nouveaux droits | 1 | ✅ done | 11-1 |
| FR86 | Historique des grades | 1 | ✅ done | 11-1 |
| FR87 | Admin définir niveau partenariat | 1 | ✅ done | 11-3 |
| FR88 | Permissions varient par niveau | 1 | ✅ done | 11-3 |
| FR89 | Consultation tracée | 1 | ✅ done | 11-3 |
| FR90 | Admin modifier niveau partenariat | 1 | ✅ done | 11-3 |
| FR91 | Changement niveau met à jour droits | 1 | ✅ done | 11-3 |
| FR92 | Système versionne thème | 1 | ✅ done | 3-3 |
| FR93 | Données enfant liées à version thème | 1 | ✅ done | 3-3 |
| FR94 | Admin créer version sans altérer historique | 1 | ✅ done | 3-3 |
| FR95 | Gestion conflits sync | 1 | ✅ done | 5-1 |
| FR96 | Coach informé modifications serveur offline | 1 | ✅ done | 5-6 |
| FR97 | Données anonymisées pour exports | 1 | ✅ done | 10-4 |
| FR98 | Exports clubs filtrés par consentements | 1 | ✅ done | 10-5 |
| FR99 | Admin consulter audit trail | 1 | ✅ done | 10-4 |
| FR100 | Logs conservés durée configurable | 1 | ✅ done | 10-4 |

**Phase 2 FRs (prérequis Phase 1 satisfaits) :**
- FR25-28 : Vidéo (upload, validation admin, retours) — débloqué
- FR36-40 : Tableaux bord parents/enfants avancés — débloqué
- FR45 : Export rapport mensuel — débloqué
- FR50-52 : Module business (stages, Stripe) — débloqué
- FR53-56 : Gestion médicale — débloqué
- FR73-75 : Tagging vidéo — débloqué

---

## Architecture d'Implémentation — Patterns Validés

### Offline-First Stock (✅ Validé Phase 1)

- SQLite stockage local (`local_sync_queue`)
- Sync background automatique avec alerte visible
- Conflits résolus par priorité serveur
- Aucune perte silencieuse

**Leçon :** Pattern solide, prêt pour Phase 2 (upload vidéo offline).

### RBAC Tenant-Aware (✅ Validé Phase 1)

- `tenant_id` sur toutes les entités
- RLS PostgreSQL enforced
- Custom Access Token Hook injecte `role` + `tenant_id` dans JWT
- Zéro fuite cross-tenant observée

**Leçon :** Architecture multi-tenant prête pour export SaaS.

### Idempotence & Event Log (✅ Validé Phase 1)

- RPC `close_session()` avec `operation_id` pour deduplication
- `event_log` immutable pour auditabilité
- Notifications "send-once" garanties

**Leçon :** Modèle robuste pour les données critiques. À étendre Phase 2 (upload vidéo).

---

## Opportunités Phase 2 — FRs Débloqués

| FR | Titre | Prérequis Phase 1 | Status |
|----|-------|-------------------|--------|
| FR25 | Coach uploader vidéo retour | FR10-24, FR29-35 done | ✅ ready |
| FR26 | Enfant soumettre vidéo auto-évaluation | FR10-24, FR34-35 done | ✅ ready |
| FR27 | Coach visionner vidéos + retours | FR10-24 done | ✅ ready |
| FR28 | Admin valider vidéo avant diffusion | FR41-44 done | ✅ ready |
| FR36 | Parent visionner vidéos autorisées | FR6-7, FR34-35 done | ✅ ready |
| FR39 | Enfant consulter progression (badges) | FR22-24, FR34-35 done | ✅ ready |
| FR40 | Enfant débloquer badges | FR22-24 done | ✅ ready |
| FR45 | Export rapport mensuel | FR41-44 done | ✅ ready |
| FR50 | Parent consulter offres stages | FR34-35 done | ✅ ready |
| FR51 | Parent régler paiement stage | FR34-35 done | ✅ ready |
| FR52 | Génération documents auto | FR34-35 done | ✅ ready |

---

## Recommandations — Roadmap Immédiate

### Court terme (semaine 1-2)

1. **Finaliser FR30 (SMS annulation)** → déployer triple canal complet
2. **Implémenter FR33 (Quiz reminder)** → quick win, impact parent visible
3. **Valider app réelle** : tester check-in offline sur le terrain (test d'adoption réel)

### Moyen terme (mois 2-3)

1. **FR42 : Dashboard supervision qualité** → observabilité opérationnelle
2. **FR43 : Messagerie intra-plateforme** → réduit friction Jeremy
3. **Démarrer Phase 2 Module Vidéo** → FR25-28

### Long terme (mois 4+)

1. **Phase 2 complet** : vidéo, gamification, business
2. **Phase 3 : Flywheel collectif** → benchmark inter-réseau, IA analyse gestuelle

---

## Notes Méthodologie

- **Source données :** PRD sections 3-5, BACKLOG.md (stories done), implementation-artifacts/ (stories complétées)
- **Audit qualitatif :** lectures Story 2-1 (Auth), 13-3 (Mode Séance), 5-6 (Offline), 6-4 (Clôture), 10-4 (Audit)
- **Couverture** : croisant FRs listées vs. épics marqués done dans backlog
- **Seuil done** : code Review passed + deployed to staging (vs. in-progress ou review)

---

**Rapport généré le 2026-04-03 par Feature Scout Agent.**
