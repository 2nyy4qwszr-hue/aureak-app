---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
visionStatement: "AUREAK est le système qui relie terrain, data et pédagogie pour faire progresser sans jamais perdre l'exigence."
classification:
  projectType: Vertical SaaS + Performance Data Platform
  domain: Sports EdTech
  complexity: High (évolutif)
  projectContext: greenfield
  doubleMoteur:
    - Opérationnel terrain
    - Contrôle qualité méthode
  pillars:
    - Infrastructure data propriétaire
    - Méthode standardisée et embarquée
    - Moteur de progression traçable
    - Architecture exportable (SaaS futur)
    - Effet benchmark & standardisation inter-implantations
inputDocuments:
  - product-brief-Application Aureak-2026-03-02.md
  - AUREAK_PRD.md
workflowType: 'prd'
---

# Product Requirements Document - Application Aureak

**Author:** Jeremydevriendt
**Date:** 2026-03-02

## Executive Summary

AUREAK est une plateforme Vertical SaaS + Performance Data Platform conçue **pour l'Académie AUREAK**, structure spécialisée dans la formation du gardien de but. Elle relie trois couches — opérations terrain, data de progression, contenu pédagogique — pour industrialiser une méthode propriétaire développée sur 13 ans et la déployer sur un réseau multi-implantations sans dégradation qualitative.

**Problème central :** l'Académie AUREAK opère avec une méthodologie pédagogique riche mais aucune infrastructure numérique pour en assurer la continuité. La croissance dilue la qualité. Les coachs travaillent de mémoire. Les parents n'ont pas de visibilité. Les enfants n'ont pas de boucle d'apprentissage après la séance. La data ne s'accumule pas.

**Utilisateurs :** coachs (assistants 16-21 ans, seniors 21-50 ans), parents (CSP+, investis dans la progression de leur enfant), enfants — répartition actuelle : 60% de 8-13 ans (Foot 5 / Foot 8), 35% de 13-18 ans (Foot 11), 5% de 18-25 ans (Senior). Secondaires : admin académie, clubs partenaires/associés (lecture limitée), clubs communs (accès minimal).

**Plan de croissance :** société constituée, passage de 1 à 3 implantations puis doublement annuel, cap 1 000 gardiens. La plateforme est le prérequis technique de cette trajectoire.

---

### What Makes This Special

AUREAK inverse la courbe de qualité à l'échelle via deux moteurs :

**Moteur 1 — Amplification pédagogique :** chaque séance génère une boucle d'apprentissage qui prolonge le coaching au-delà du terrain (quiz → exercice filmé → retour coach). La connaissance du gardien double sans ajouter de temps de séance.

**Moteur 2 — Flywheel collectif :** chaque coach apporte son expertise, chaque enfant apporte ses patterns d'apprentissage. La plateforme agrège et propage cette intelligence à tout le réseau. Plus le réseau grandit, plus la méthode s'affine pour tous.

**Différenciateur :** aucune solution générique (Spond, Teamsnap) n'embarque de contenu pédagogique propriétaire ni de boucle d'apprentissage post-séance. AUREAK n'est pas un outil de gestion adapté au sport — c'est une infrastructure construite autour d'une méthode. La méthode est le produit ; la plateforme est son vecteur de scalabilité.

**Lock-in coach :** les coachs accumulent dans la plateforme des actifs (retours vidéo, historique corrections, progressions de leurs groupes) inaccessibles hors AUREAK. Mécanisme de rétention et signal de qualité.

**Vision :** *"AUREAK est le système qui relie terrain, data et pédagogie pour faire progresser sans jamais perdre l'exigence."*

---

## Project Classification

| Attribut | Valeur |
|---|---|
| **Type** | Vertical SaaS + Performance Data Platform |
| **Domaine** | Sports EdTech — mineurs 8-18 ans (95%), RGPD |
| **Complexité** | High (évolutif) |
| **Contexte** | Greenfield |
| **Double moteur** | Opérationnel terrain · Contrôle qualité méthode |
| **5 piliers** | Infrastructure data propriétaire · Méthode standardisée · Progression traçable · Architecture exportable · Effet benchmark inter-réseau |

---

## Success Criteria

### User Success

**Coach — adoption terrain**
- >95% des séances enregistrées avec check-in numérique à 3 mois
- >70% des coachs actifs (consultation retours/vidéos groupe) à 6 mois
- Zéro message WhatsApp de présences envoyé au responsable de site après 6 semaines

**Parent — engagement profond**
- >60% des fiches enfants avec ≥1 cycle évaluation complet (quiz → feedback coach) à 6 mois
- Le cycle complet est le proxy de valeur réelle : pas le téléchargement, le parcours terminé

**Enfant — participation active**
- Taux de soumission vidéo : indicateur d'engagement profond (enfant qui soumet = enfant qui cherche un résultat)
- Pari pédagogique réussi : quasi-totalité des enfants avec accès utilisent la fonctionnalité d'évaluation

### Business Success

| Horizon | Objectif | Indicateur |
|---|---|---|
| 3 mois | Adoption terrain complète | 100% séances avec check-in numérique |
| 6 mois | Engagement parent actif | >60% fiches avec ≥1 cycle complet |
| 12 mois | Croissance académie | 150+ adhérents (vs 110 actuels) |
| 12 mois | Rétention saison | ≥80% adhérents re-inscrits |
| 12 mois | Revenus complémentaires | Inscriptions stages via plateforme |

### Technical Success

- **Disponibilité globale** : ≥95% — objectif évolutif vers 100%
- **Sync offline** : ≥90% fiable avec alerte utilisateur explicite sur tout échec — aucune perte silencieuse de données
- **Performance mobile** : temps d'ouverture dans la moyenne acceptable des apps terrain (pas de lag bloquant sur le terrain)
- **Intégrité données** : toute erreur de synchronisation remonte une alerte — jamais de perte silencieuse
- **Sécurité** : aucune fuite de données mineurs, accès strictement contrôlé par rôle

### Compliance Milestones

- **DPO désigné** : avant lancement public — personne ou cabinet externe mandaté pour la conformité RGPD
- **AIPD conduite** : Analyse d'Impact sur la Protection des Données à réaliser avant traitement à grande échelle de données mineurs
- **Consentements parentaux** : système de collecte et de retrait en place dès le MVP

### Measurable Outcomes

Le PRD est un succès quand, à 12 mois :
1. Les coachs n'ont plus besoin de WhatsApp pour les présences
2. Les parents voient la progression de leur enfant sans demander
3. L'académie dispose d'une base de données terrain exploitable pour affiner la méthode
4. La croissance de 1 à 3 implantations n'a pas dégradé la qualité pédagogique mesurable

---

## Product Scope

### MVP — Minimum Viable Product

1. **Gestion des séances** : identification entraînement du jour, fiche séance, thèmes techniques
2. **Check-in présences** : digital, offline-first, sync différée avec alerte sur échec
3. **Évaluation coach post-séance** : signal attitude/effort par enfant, commentaire libre
4. **Quiz enfant post-séance** : QCM lié aux thèmes, validation = notification parent
5. **Board parent basique** : notifications post-séance, fiche enfant (présences + quiz)
6. **Auth & rôles** : Admin / Coach / Parent / Enfant — accès enfant via parent jusqu'à 15-16 ans

### Growth Features (Post-MVP)

- Module vidéo : upload mobile, self-coaching filmé, retour technique coach
- Gamification : badges techniques, cartes Goal & Player, collection
- Multi-implantations avancées : accès clubs partenaires/associés
- Module business : boutique, stages, dons
- Formation coach : capsules techniques et situationnelles
- Suivi médical complet et gestion documents

### Vision (Future)

- Analyse match + tagging manuel puis automatisé
- Dashboard benchmark inter-réseau (effet flywheel collectif)
- IA analyse gestuelle
- Avatar animé IA par enfant
- Architecture SaaS exportable vers d'autres académies

---

## User Journeys

### Journey 1 — Marc, samedi matin *(Coach senior — chemin de succès)*

Marc arrive au complexe à 9h15. Trois groupes consécutifs devant lui : U5 à 9h30, U8 à 11h, U11 à 12h30. Avant l'app : un carnet froissé, un groupe WhatsApp et une charge mémorielle qui s'accumule sur 5 heures.

Il ouvre AUREAK sur le parking. En 3 taps : Entraînement 12, U5, thème "Sortie au sol", critères chargés. Il installe le matériel. Les enfants arrivent — check-in en quelques secondes par tap, téléphone dans la main, mode offline. Pendant la séance, il jette un œil à l'écran pour le rappel de l'exercice 3 sans interrompre le flow.

Fin de la 3e séance, 14h15. 25 enfants sur 3 groupes. Il complète les feedbacks en 8 minutes : attitude + effort + 2-3 commentaires ciblés. Il appuie sur "Terminer". Tout remonte : présences, évaluations, notes. Les 25 parents reçoivent une notification. Le responsable de site voit les présences sans un WhatsApp.

Le soir, en 10 minutes, Marc regarde les vidéos soumises par 3 enfants de son U11. Il voit des choses qu'il n'aurait jamais captées en séance. Il arrive au prochain entraînement avec des corrections ciblées déjà préparées.

*Capabilities révélées :* session management · check-in offline · évaluation rapide · sync background · notifications push · consultation vidéo asynchrone

---

### Journey 2 — Sophie, mardi soir *(Parent — découverte de la progression)*

Sophie n'a pas pu assister à l'entraînement de Lucas ce soir — réunion professionnelle. Elle se demande comment ça s'est passé.

Notification AUREAK à 19h47 : "Entraînement terminé pour Lucas." Elle ouvre l'app. Présent ✓. Attitude ⭐⭐⭐, goût à l'effort ⭐⭐. Commentaire coach : *"Bonne sortie basse ce soir, manque de concentration en fin de séance."* Lucas a complété son quiz (7/10). Badge débloqué.

Lucas monte en voiture. Pour la première fois, Sophie peut dire précisément : *"Le coach a dit que ta sortie basse était bonne. La question 3 du quiz, c'était quoi ?"* La conversation change. Elle ne devine plus. Elle dialogue avec du concret.

Six mois plus tard, Sophie renouvelle l'inscription sans hésitation. Ce n'est plus juste une activité. C'est un suivi.

*Capabilities révélées :* notification post-séance · board parent · fiche enfant (présences + évaluation + quiz) · visualisation progression

---

### Journey 3 — Théo, terrain extérieur *(Assistant coach — cas limite : sync offline échouée)*

Théo coache un U8 sur un terrain extérieur, couverture réseau médiocre. Il fait ses check-ins en offline — l'app stocke localement, tout s'affiche normalement.

Fin de séance : "Synchroniser." Erreur réseau. Alerte orange : *"8 présences enregistrées localement — synchronisation en attente."* Il ne perd rien. Mais il oublie de relancer quand il retrouve du réseau.

Le lendemain matin, notification : *"⚠️ Données séance du 02/03 non synchronisées. Ouvrir pour finaliser."* 1 tap — sync complète. Les présences remontent. Aucun enfant marqué absent par erreur.

Théo comprend que l'app "garde tout". Sa confiance dans le système s'ancre.

*Capabilities révélées :* stockage offline local · alerte sync visible · notification de rappel différée · indicateur de statut sync

---

### Journey 4 — Jeremydevriendt, lundi matin *(Admin — supervision qualité méthode)*

Lundi 9h. Trois implantations actives ce weekend. Il n'était pas sur tous les terrains.

Dashboard admin : Implantation A — 3 séances, présence 87%, 100% feedbacks complétés ✓. Implantation B — 2 séances, présence 72%, 1 coach sans feedback. Implantation C — complète, taux quiz enfants 65%.

Il identifie l'écart : coach X, implantation B, n'a pas utilisé la plateforme. Message direct depuis l'app. Semaine suivante : 100% feedbacks complétés.

Sans l'app, cette dérive aurait duré des semaines. Maintenant : 2 minutes le lundi matin.

*Capabilities révélées :* dashboard admin multi-implantations · métriques agrégées · alertes inactivité coach · vue comparative inter-implantations

---

### Journey 5 — Lucas, 12 ans *(Enfant — boucle d'apprentissage post-séance)*

20h, chambre de Lucas. Notification sur la tablette familiale : *"Ton quiz t'attend ! Thème : Sortie au sol."* 5 questions QCM. Il bloque sur la question 3 — position des mains. Il répond, soumet. 8/10. L'app lui montre la bonne réponse avec une illustration.

Il fait l'exercice filmé dans le jardin. Il soumet la vidéo. Deux jours plus tard, Marc commente : *"Position des mains top ! Travaille l'extension du bras gauche."* Lucas relit ça avant la prochaine séance.

Le geste est ancré. Pas en séance. Chez lui, à son rythme.

*Capabilities révélées :* quiz QCM avec correction · accès enfant via compte parent · upload vidéo mobile · retour coach asynchrone sur vidéo

---

### Journey Requirements Summary

| Capability | Révélée par |
|---|---|
| Session management (séance du jour, thèmes, rappel exercice) | Marc (J1) |
| Check-in offline avec stockage local | Marc (J1), Théo (J3) |
| Sync background + alerte sur échec + rappel différé | Théo (J3) |
| Évaluation rapide par enfant (attitude/effort + commentaire) | Marc (J1) |
| Notification push post-séance | Marc (J1), Sophie (J2) |
| Board parent : présences + évaluation + quiz | Sophie (J2) |
| Quiz QCM post-séance avec correction | Lucas (J5) |
| Accès enfant via compte parent | Lucas (J5) |
| Upload vidéo mobile + retour coach asynchrone | Marc (J1), Lucas (J5) |
| Dashboard admin multi-implantations + métriques agrégées | Admin (J4) |
| Alertes inactivité coach + vue comparative | Admin (J4) |

---

## Domain-Specific Requirements

### Conformité & Réglementaire (RGPD EU)

**Base légale**
- Traitement des données mineurs : base contractuelle (Art. 6(1)(b)) — l'inscription à l'académie implique le traitement des données de présence et de progression comme condition d'exécution du service. Le consentement au sens de l'Art. 7 n'est pas la base légale principale, ce qui évite le problème de retrait fragilisant le traitement.
- Droit à l'image / vidéos : base consentement explicite parental (Art. 6(1)(a)) — séparé du contrat d'inscription. Retrait possible sans quitter l'académie.

**DPO & AIPD**
- Désignation DPO (personne physique ou cabinet externe) **obligatoire avant lancement public** — traitement à grande échelle de données de mineurs classé "à risque élevé"
- AIPD (Analyse d'Impact sur la Protection des Données) à conduire avant le traitement généralisé — obligatoire au sens de l'Art. 35 RGPD pour les catégories sensibles impliquant des mineurs

**Gestion des consentements**
- Consentement parental requis pour : droit à l'image, autorisation vidéo interne, autorisation diffusion
- Interface de retrait consentement disponible en tout temps depuis le compte parent
- À la suppression consentement vidéo : suppression des médias (vidéos, photos), conservation des données structurées (présences, évaluations, résultats quiz) — données de progression légitimes au titre du contrat

**Rétention & suppression**
- Durée de conservation configurable par l'admin
- Suppression automatique des données médias à échéance ou sur retrait consentement
- Données structurelles (présences, évaluations) conservées selon durée légale contractuelle
- Journal d'audit de toutes les opérations sensibles : consultation, modification, export, upload vidéo

**Droits des personnes**
- Droit d'accès, rectification, effacement, portabilité — exercés via le compte parent
- Réponse sous 30 jours (délai légal RGPD)

---

### Contraintes Techniques

**Contrôle d'accès par rôle (RBAC)**

| Rôle | Périmètre |
|---|---|
| Admin | Accès total toutes implantations, validation vidéos vers enfants |
| Coach | Ses implantations uniquement, upload vidéo vers plateforme (pas vers enfants) |
| Parent | Données de son enfant uniquement, vidéos autorisées par admin |
| Enfant | Son profil, quiz, progression — accès via compte parent jusqu'à 15-16 ans |
| Club partenaire/associé | Lecture : présences, blessures, rapports mi-saison/fin de saison |
| Club commun | Lecture minimale : présences, blessures, rapports périodiques uniquement |

**Règles strictes sur les vidéos**

> ⚠️ **Règle critique — deux niveaux de protection :**
>
> 1. **Aucune vidéo ne peut être transmise aux enfants sans validation admin explicite** — toute vidéo (upload coach, contenu pédagogique) doit passer par une approbation admin avant d'être rendue visible côté enfant/parent
> 2. **Aucun upload coach n'est possible en direction directe des enfants** — les uploads coach arrivent sur la plateforme en statut "en attente de validation" ; c'est l'admin qui décide de la diffusion

- Vidéos : mode lecture seule, aucun téléchargement possible (streaming uniquement)
- Partage externe via lien expirant uniquement, validé par admin
- Journalisation de tous les accès vidéo

**Sécurité**
- Chiffrement en transit (TLS 1.2+) et au repos (AES-256 pour les médias)
- Sessions expirantes avec refresh token
- Aucune donnée personnelle exposée côté client sans authentification
- Isolation stricte des données entre implantations

**Offline-first**
- Stockage local persistant avec identifiant de session unique
- Indicateur de statut de synchronisation visible en permanence
- Alerte orange explicite sur tout échec de sync — aucune perte silencieuse de données
- Notification de rappel J+1 si des données restent non synchronisées

---

### Exigences d'Intégration

- **Push notifications** : APNs (iOS) + FCM (Android) — notifications critiques (annulation terrain, fin séance, données non synchronisées)
- **Email + SMS** : annulations terrain → canal triple (push + email + SMS) pour garantir la réception
- **Stockage médias** : service cloud avec CDN, streaming uniquement, pas de download direct
- **Infrastructure** : budget ~250€/mois, scale cible 1 000 adhérents (évolutif vers 5 000)

---

### Risques & Mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Fuite données mineurs | Critique / légal | RBAC strict, audit log, chiffrement, DPO désigné |
| Vidéo transmise sans validation | Critique / légal | Double verrou : upload en "attente" + validation admin obligatoire |
| Sync offline silencieuse échouée | Élevé / opérationnel | Alerte visible immédiate + rappel J+1 |
| Coach absent de la plateforme (dérive qualité) | Élevé / pédagogique | Dashboard admin : séances sans check-in / feedback visibles en temps réel |
| Retrait consentement partiel | Moyen / légal | Architecture données structurées / médias séparée dès le départ |
| Croissance trop rapide (scale) | Moyen / technique | Architecture stateless, infra cloud horizontalement scalable |

---

## Innovation & Novel Patterns

### Zones d'Innovation Détectées

**1. Méthodologie embarquée — non pas un outil adapté après coup**

Le différenciateur fondamental d'AUREAK n'est pas une feature, c'est un modèle inversé : là où Spond ou Teamsnap sont des outils génériques auxquels on essaie d'adapter un contenu pédagogique, AUREAK part de 13 ans de curriculum propriétaire et construit la plateforme comme vecteur de ce curriculum. La méthode est le produit. La plateforme est son vecteur de scalabilité.

Ce renversement est rare dans les Sports EdTech : les plateformes existent, les méthodes existent, mais leur fusion structurelle en un seul système ne s'est pas produite au niveau d'une académie spécialisée dans un poste.

**2. Boucle d'apprentissage post-séance fermée**

La boucle `check-in → évaluation coach → quiz enfant → exercice filmé → retour technique coach` n'existe dans aucun concurrent identifié dans ce segment. Elle transforme chaque séance de 1h en 3-4 jours de cycle d'apprentissage. La connaissance du gardien progresse sans ajouter du temps de terrain. Ce n'est pas une amélioration marginale de la gestion de club — c'est une augmentation de l'impact pédagogique par séance.

**3. Flywheel collectif d'intelligence méthodologique**

Chaque coach qui documente sa séance + chaque enfant qui soumet sa vidéo enrichit un corpus de données qui :
- identifie des patterns d'apprentissage par tranche d'âge
- affine les thèmes techniques via la data réelle de progression
- se propage à tout le réseau d'implantations

Plus le réseau grandit, plus la méthode s'affine pour tous. C'est un flywheel compétitif : la croissance augmente la qualité au lieu de la diluer. Ce mécanisme n'existe pas dans les outils génériques de club.

**4. Lock-in coach par accumulation d'actifs**

Un coach senior dans AUREAK accumule après 2-3 saisons : retours vidéo de ses groupes, historique de ses corrections, progressions détaillées de chaque enfant qu'il a coaché. Ces actifs sont inaccessibles hors de la plateforme. Ce n'est pas une contrainte — c'est une promesse de carrière : *"si tu veux être au top de la correction technique, c'est ici que tu construis ton capital."* Ce mécanisme est documenté dans le SaaS B2B (Salesforce, HubSpot) mais non exploité dans le sport éducatif amateur/semi-pro.

**5. Architecture exportable — plateforme SaaS ou méthode licenciée**

Si les données valident l'impact de la méthode à grande échelle (1 000+ gardiens), AUREAK devient licenciable : soit comme SaaS vers d'autres académies spécialisées (autres postes, autres sports), soit comme certification de méthode avec infrastructure. Le produit construit aujourd'hui est le prérequis technique de ce pivot.

---

### Contexte Marché & Paysage Concurrentiel

- **Outils génériques (Spond, Teamsnap, Pitchero)** : gestion agenda + présences, zéro contenu pédagogique, zéro boucle post-séance
- **Plateformes vidéo (Hudl, Veo)** : analyse vidéo avancée pour clubs compétitifs, pas de curriculum embarqué, pas d'accès mineurs encadré
- **LMS éducatifs (Moodle, Canvas)** : contenu pédagogique structuré mais aucune intégration terrain, aucun profil sportif
- **AUREAK** : combinaison inédite dans le segment académie spécialisée — terrain + pédagogie + data dans un système pensé pour les mineurs dès le départ

**Whitespace identifié :** aucune plateforme ne ferme la boucle terrain → maison → coach pour une académie sportive spécialisée avec curriculum propriétaire et contraintes RGPD mineurs.

---

### Approche de Validation

| Innovation | Signal de validation | Horizon |
|---|---|---|
| Boucle d'apprentissage post-séance | Taux de soumission vidéo enfant > 50% à 3 mois | MVP |
| Flywheel collectif | Corrélation observable entre volume data et précision des corrections coaches | 12 mois |
| Lock-in coach | Taux de rétention coaches saison N+1 > 85% | 12 mois |
| Méthodologie embarquée | 0 WhatsApp de présences à 6 semaines, coaches actifs sur vidéos | MVP |

---

### Risques Spécifiques aux Innovations

| Risque | Description | Mitigation |
|---|---|---|
| Résistance adoption coaches | L'outil ajoute une étape vs la simplicité actuelle | UX terrain ultra-rapide (check-in < 5 secondes), onboarding guidé |
| Flywheel vide au démarrage | Données insuffisantes au lancement pour enrichir la méthode | Démarrer avec les 110 adhérents existants — déjà suffisant pour les patterns de base |
| Vidéos enfants : friction parentale | Parents réticents à autoriser l'upload | Double opt-in clair, politique "view only, no download", validation admin systématique |
| Boucle post-séance abandonnée | Enfants ou parents ne complètent pas le quiz | Notification ciblée, quiz court (5 questions max), badge visible dès validation |

---

## Vertical SaaS + Performance Data Platform — Spécifications Techniques

### Vue d'ensemble du type de projet

AUREAK combine deux architectures : un **SaaS B2B multi-tenant** (gestion académie, données agrégées, benchmark inter-réseau) et une **application mobile terrain** (offline-first, check-in, évaluations). Les deux couches partagent le même backend mais exposent des UX radicalement distinctes selon le contexte d'usage.

---

### Architecture Multi-Tenant

**Modèle adopté : base unique avec isolation par `tenant_id`**

- Toutes les implantations partagent la même infrastructure de données
- Chaque entité (séance, présence, enfant, évaluation) est filtrée par `tenant_id` à chaque requête — aucune donnée cross-tenant sans autorisation explicite
- Accès temporaire inter-implantations : possible si l'admin accorde une permission explicite à un coach — logué en audit trail
- Ce modèle permet :
  - La data agrégée anonymisée entre implantations (benchmark inter-réseau)
  - Le dashboard admin multi-sites en temps réel
  - La scalabilité horizontale sans migration de bases

**Isolation garantie par :**
- RBAC tenant-aware à chaque appel API
- Middleware tenant filter côté serveur (jamais côté client)
- Audit log de tout accès cross-tenant

---

### Architecture Plateforme — Deux Contextes d'Usage Distincts

| Contexte | Interface | Cas d'usage |
|---|---|---|
| **Terrain (séance)** | Mobile React Native (iOS + Android) | Check-in, évaluation post-séance, sync offline |
| **Préparation / Analyse** | Web desktop | Fiche séance, consultation vidéos, dashboard admin, rapports |

**Décisions techniques :**
- **Cross-platform React Native** : iOS + Android depuis une seule codebase — pas d'iOS-only, 40-50% des utilisateurs sont sur Android
- **Web desktop** pour admin/coach hors-terrain : préparation des séances, consultation des vidéos enfants, analytics, gestion des permissions
- **PWA non retenu** pour le terrain : les contraintes offline et les permissions natives (notifications, stockage local) justifient une app native

---

### Modèle de Facturation (Interne + Futur SaaS)

**Phase actuelle : outil interne AUREAK**
- Aucune facturation externe aujourd'hui
- Architecture conçue "SaaS-ready" dès le départ : chaque enfant est une unité de compte (`per_child_unit`) même si non facturée

**Paiement des stages : via plateforme (Stripe)**
- Historique de paiement centralisé par enfant
- Génération automatique de documents (confirmation inscription, reçu, justificatif mutuelle)
- Prépare le modèle SaaS futur sans refactoring

**Vision SaaS long terme :** si les données valident l'impact de la méthode à grande échelle, le modèle `per_child_unit` est directement exportable vers d'autres académies clientes

---

### Liste des Intégrations

| Priorité | Intégration | Détail |
|---|---|---|
| **MVP** | Push notifications | APNs (iOS) + FCM (Android) |
| **MVP** | Email transactionnel | Annulations, notifications post-séance |
| **MVP** | SMS | Annulations terrain uniquement (canal critique) |
| **MVP** | Export calendrier `.ics` | Parents : synchronisation calendrier natif sans app tierce |
| **MVP** | Export PDF rapport parent | Rapport post-séance + progression enfant |
| **Growth** | Stripe paiements | Stages, boutique |
| **Growth** | Export PDF mensuel club | Rapport partenaire/associé/commun |
| **Future** | API clubs partenaires | Partage données contrôlé, validation admin obligatoire |
| **Future** | Stockage vidéo CDN | Streaming optimisé, pas de download |

**Principe d'intégration :** ne pas sur-intégrer au démarrage. Chaque intégration doit répondre à un besoin utilisateur documenté, pas à une anticipation.

---

### Considérations d'Implémentation

- **Offline-first obligatoire** : le mobile doit fonctionner sans réseau, synchronisation différée, aucune perte silencieuse
- **Scalabilité cible** : 1 000 adhérents (horizon 2-3 ans), architecture évolutive vers 5 000
- **API REST** côté backend — interface unique pour mobile + web
- **Séparation stricte** contenu pédagogique / moteur produit : les thèmes, critères et quiz sont des données configurables, pas du code hardcodé — prépare l'exportabilité SaaS

---

## Project Scoping & Phased Development

### Stratégie MVP & Philosophie

**Approche MVP : Opérationnel Terrain**

L'objectif du MVP n'est pas de démontrer la vision complète — c'est de faire disparaître le WhatsApp de fin de séance et de prouver que la plateforme tient sur le terrain. C'est le seuil minimum pour que les coachs l'adoptent. Tout le reste se construit sur cette base.

**Contexte de développement :** Solo developer — MVP doit être ruthlessly lean. Chaque feature ajoutée au MVP est une semaine de plus avant le premier usage réel.

**Séquence MVP :**
- **Sprint A (prioritaire)** : Check-in présences offline + évaluation coach post-séance → résout le problème terrain immédiat, valide l'adoption coach
- **Sprint B (enchaîné)** : Quiz enfant post-séance + board parent basique → active la boucle pédagogique, valide l'engagement parent

Si les deux sprints s'enchaînent proprement, ils forment un **MVP complet livrable ensemble**. Si Sprint A révèle des frictions inattendues, Sprint B est reporté sans risque — la valeur terrain est déjà délivrée.

---

### MVP — Phase 1 (Sprints A + B)

**Journeys utilisateurs couverts :**
- Marc (coach senior) — check-in 3 groupes consécutifs, évaluation rapide, sync background ✓
- Sophie (parent) — notification post-séance, fiche enfant, résultat quiz ✓
- Théo (assistant coach) — cas limite offline sync avec alerte ✓
- Lucas (enfant) — quiz QCM post-séance via compte parent ✓
- Admin — dashboard basique séances du jour (pas encore multi-implantations avancé)

**Capabilities must-have :**

| # | Capability | Sprint |
|---|---|---|
| 1 | Auth & rôles (Admin / Coach / Parent / Enfant) | A |
| 2 | Gestion séances (séance du jour, fiche, thèmes) | A |
| 3 | Check-in présences offline-first + sync différée + alerte échec | A |
| 4 | Évaluation coach post-séance (attitude/effort + commentaire) | A |
| 5 | Notification push post-séance vers parents | A |
| 6 | Quiz QCM enfant lié aux thèmes de séance | B |
| 7 | Board parent basique (présences + évaluation + quiz) | B |
| 8 | Accès enfant via compte parent (jusqu'à 15-16 ans) | B |

**Out of scope MVP (décision ferme) :**
- Upload vidéo — Phase 2
- Gamification (badges, cartes) — Phase 2
- Module stages / paiement Stripe — Phase 2
- Dashboard admin multi-implantations complet — Phase 2
- Gestion médicale / documents — Phase 2
- Formation coach — Phase 3+

---

### Post-MVP — Phase 2 (Growth)

Déclenché quand Sprint A + B validés sur le terrain (cible : >95% check-in numérique à 6 semaines).

- **Module vidéo** : upload mobile coach, self-coaching filmé enfant, retour coach asynchrone, double verrou admin
- **Gamification** : badges techniques, cartes Goal & Player, collection visible
- **Dashboard admin multi-implantations** : métriques agrégées, alertes inactivité, vue comparative
- **Module business** : inscription stages via plateforme, paiement Stripe, documents automatiques
- **Gestion médicale basique** : déclaration blessure, restrictions reprise, archivage fiche enfant
- **Export .ics + PDF** : calendrier parent, rapport enfant, rapport mensuel club

---

### Vision — Phase 3 (Expansion)

Déclenché quand 150+ adhérents actifs et au moins 2 implantations opérationnelles.

- Analyse match + tagging manuel → automatisé
- Dashboard benchmark inter-réseau (effet flywheel collectif)
- Avatar animé IA par enfant
- IA analyse gestuelle
- Architecture SaaS exportable vers autres académies spécialisées

---

### Stratégie de Mitigation des Risques

| Type | Risque principal | Mitigation |
|---|---|---|
| **Technique** | Sync offline complexe à fiabiliser (Sprint A) | Commencer par un stockage local simple (SQLite/AsyncStorage), sync naïve avec retry, alerte visible — ne pas sur-ingénier l'offline v1 |
| **Marché** | Coaches n'adoptent pas (friction trop haute) | Check-in ≤ 3 taps, jamais de blocage sans réseau, feedback immédiat — l'UX terrain est le produit |
| **Ressource** | Scope creep (solo dev) | Règle stricte : rien n'entre dans le MVP sans passer le test *"sans ça, le coach revient au WhatsApp ?"* |
| **RGPD** | DPO non désigné avant lancement | Lancer en beta fermée (110 adhérents connus, consentements collectés manuellement) le temps de désigner un DPO |

---

## Functional Requirements

### 1. Gestion des Utilisateurs & Accès

- **FR1** : Un Admin peut créer, modifier et désactiver les comptes de tous les rôles
- **FR2** : Un Coach peut accéder uniquement aux séances et données de ses implantations assignées
- **FR3** : Un Admin peut accorder un accès temporaire cross-implantation à un Coach, action journalisée
- **FR4** : Un Parent peut accéder aux données de son ou ses enfants uniquement
- **FR5** : Un Enfant peut accéder à son profil via le compte de son parent jusqu'à 15-16 ans, puis avec validation parentale
- **FR6** : Un Parent peut gérer les consentements (droit à l'image, vidéo, diffusion) depuis son compte
- **FR7** : Un Parent peut retirer un consentement vidéo, déclenchant la suppression automatique des médias associés
- **FR8** : Un Club partenaire/associé peut consulter en lecture les présences, blessures et rapports de ses enfants
- **FR9** : Un Club commun peut consulter en lecture minimale les présences, blessures et rapports périodiques
- **FR60** : Les tokens d'authentification sont renouvelés automatiquement sans interruption utilisateur
- **FR61** : Les permissions sont vérifiées à chaque requête côté serveur (RBAC serveur-side)
- **FR62** : Les données sont isolées par `tenant_id` avec filtrage obligatoire côté backend

---

### 2. Opérations Terrain & Présences

- **FR10** : Un Coach peut consulter la liste de ses séances du jour avec groupe, lieu et heure
- **FR11** : Un Coach peut accéder à la fiche de séance (thèmes techniques, critères, rappels d'exercices)
- **FR12** : Un Admin peut créer, modifier et archiver des séances (date, heure, lieu, implantation, groupe, coach)
- **FR13** : Un Admin peut associer des thèmes techniques et critères pédagogiques à une séance
- **FR14** : Un Coach peut soumettre un retour global sur une séance à destination de l'admin
- **FR15** : Un Coach peut enregistrer les présences des enfants en mode hors-ligne
- **FR16** : Le système synchronise automatiquement les présences locales dès que le réseau est disponible
- **FR17** : Le système alerte le Coach de manière visible lors de tout échec de synchronisation
- **FR18** : Le système envoie une notification de rappel au Coach le lendemain si des données restent non synchronisées
- **FR19** : Un Coach peut consulter l'état de synchronisation de ses données en temps réel
- **FR57** : Un Coach peut enregistrer une présence individuelle en une seule action rapide *(seuil de performance en NFR)*
- **FR58** : Le mode séance fonctionne intégralement sans connexion réseau
- **FR59** : Le système préserve toutes les données locales même en cas de fermeture forcée de l'app
- **FR95** : Le système gère les conflits de synchronisation selon une règle définie (priorité serveur par défaut)
- **FR96** : Le Coach est informé lorsqu'une donnée a été modifiée côté serveur pendant son mode offline

---

### 3. Évaluation & Boucle Pédagogique

- **FR20** : Un Coach peut noter l'attitude et l'effort de chaque enfant à l'issue d'une séance
- **FR21** : Un Coach peut ajouter un commentaire libre par enfant après une séance
- **FR22** : Un Enfant peut répondre à un quiz QCM lié aux thèmes techniques de la séance
- **FR23** : Le système présente à l'Enfant la correction détaillée après soumission du quiz
- **FR24** : Un Coach peut consulter les résultats de quiz de l'ensemble de son groupe
- **FR25** : Un Coach peut uploader une vidéo de retour technique associée à un enfant ou une séance *(Phase 2)*
- **FR26** : Un Enfant peut soumettre une vidéo d'auto-évaluation depuis l'app mobile *(Phase 2)*
- **FR27** : Un Coach peut visionner les vidéos soumises par les enfants et y ajouter un retour textuel *(Phase 2)*
- **FR28** : Un Admin peut valider ou rejeter toute vidéo coach avant sa diffusion — aucune transmission sans validation admin *(Phase 2)*
- **FR101** : Un Admin peut définir, par thème/exercice, une durée maximale de vidéo d'auto-évaluation *(Phase 2)*
- **FR102** : Lors de l'enregistrement, l'app affiche un compteur et stoppe automatiquement la capture à la durée maximale *(Phase 2)*
- **FR103** : Le système refuse l'upload si la durée dépasse la limite configurée (cas import ou fichier externe) *(Phase 2)*
- **FR104** : Un Coach/Admin peut définir un gabarit d'évaluation pour une vidéo (angle recommandé, consigne, points à vérifier) *(Phase 2)*
- **FR72** : Les résultats de quiz sont agrégés par thème pour analyse longitudinale
- **FR76** : Le système calcule une progression par thème pour chaque enfant

---

### 4. Référentiel Technique & Contenu Pédagogique

- **FR66** : Un Admin peut créer, modifier et archiver un thème technique
- **FR67** : Un thème peut contenir des sous-critères pédagogiques détaillés (mains, timing, posture, regard…)
- **FR68** : Un thème peut être classé par niveau et tranche d'âge
- **FR69** : Un thème peut être lié à plusieurs séances
- **FR70** : Un Admin peut créer des questions de quiz associées à un thème spécifique
- **FR71** : Le système génère automatiquement le quiz d'une séance à partir des thèmes qui lui sont associés
- **FR73** : Une vidéo peut être taguée par thème et sous-critère *(Phase 2)*
- **FR74** : Le système peut afficher toutes les vidéos associées à un thème donné *(Phase 2)*
- **FR75** : Un Coach peut filtrer les vidéos d'un enfant par thème technique *(Phase 2)*
- **FR77** : Un badge peut être déclenché automatiquement par la validation d'un thème *(Phase 2)*
- **FR78** : Un Admin peut modifier les critères de validation d'un thème
- **FR79** : Un thème peut contenir un module pédagogique destiné aux coachs *(Phase 3)*
- **FR80** : Un Coach peut consulter les capsules pédagogiques liées à un thème *(Phase 3)*
- **FR81** : Un Admin peut mettre à jour le contenu pédagogique d'un thème sans impacter l'historique des données enfants
- **FR105** : Le système associe chaque vidéo à un thème + version du thème + sous-critère *(Phase 2)*
- **FR106** : Le système supporte plusieurs types d'unités pédagogiques (thème, situation, module coach, programme spécifique)
- **FR107** : Chaque unité pédagogique est associée à une audience cible (rôle, tranche d'âge, programme)
- **FR108** : Les contenus sont filtrés dynamiquement selon le rôle, l'âge et le programme d'appartenance de l'utilisateur
- **FR109** : Une vidéo peut être associée à n'importe quel type d'unité pédagogique *(Phase 2)*
- **FR92** : Le système versionne chaque thème technique
- **FR93** : Les données enfants restent liées à la version du thème active au moment de la séance
- **FR94** : Un Admin peut créer une nouvelle version d'un thème sans altérer l'historique existant

---

### 5. Communication & Notifications

- **FR29** : Le système envoie une notification push au Parent à la clôture de chaque séance de son enfant
- **FR30** : Le système envoie push + email + SMS aux Parents en cas d'annulation ou modification urgente
- **FR31** : Un Parent peut soumettre une demande structurée au staff via un système de tickets encadrés
- **FR32** : Un Coach ou Admin peut répondre aux tickets parents, réponse tracée
- **FR33** : Le système notifie le Parent pour l'inviter à faire compléter le quiz post-séance

---

### 6. Tableaux de Bord Utilisateur

- **FR34** : Un Parent peut consulter la fiche complète de son enfant (présences, évaluations, quiz)
- **FR35** : Un Parent peut visualiser l'évolution de son enfant dans le temps
- **FR36** : Un Parent peut visionner les vidéos autorisées de son enfant, en lecture seule *(Phase 2)*
- **FR37** : Un Parent peut exporter un rapport PDF de la fiche de son enfant *(Phase 2)*
- **FR38** : Un Parent peut exporter les séances au format `.ics` *(Phase 2)*
- **FR39** : Un Enfant peut consulter sa progression (badges, scores quiz, feedbacks) *(Phase 2)*
- **FR40** : Un Enfant peut débloquer des badges techniques en validant les critères d'une séance *(Phase 2)*

---

### 7. Supervision Admin, Qualité & Benchmark

- **FR41** : Un Admin peut consulter un tableau de bord agrégé multi-implantations
- **FR42** : Un Admin peut identifier les Coachs sans check-in ou feedback sur leurs séances récentes
- **FR43** : Un Admin peut contacter directement un Coach depuis la plateforme
- **FR44** : Un Admin peut gérer les implantations, groupes et assignations coach/enfant
- **FR45** : Un Admin peut exporter un rapport mensuel PDF par implantation *(Phase 2)*
- **FR63** : Le système peut agréger anonymement les données inter-implantations pour analyse collective
- **FR64** : Un Admin peut comparer les implantations sur des métriques clés
- **FR65** : Le système détecte automatiquement des anomalies (baisse de feedback, absentéisme anormal)

---

### 8. Grades Coach

- **FR82** : Un Admin peut attribuer un grade à un Coach
- **FR83** : Les permissions d'un Coach varient dynamiquement selon son grade
- **FR84** : Le système restreint l'accès à certains contenus si le grade du Coach est insuffisant
- **FR85** : Le passage de grade déclenche automatiquement l'ouverture de nouveaux droits
- **FR86** : Le système conserve l'historique des grades d'un Coach

---

### 9. Gestion des Clubs & Partenariats

- **FR87** : Un Admin peut définir le niveau de partenariat d'un Club (partenaire/associé, commun)
- **FR88** : Les permissions de consultation d'un Club varient selon son niveau de partenariat
- **FR89** : Le système journalise toute consultation de données par un Club
- **FR90** : Un Admin peut modifier le niveau de partenariat d'un Club à tout moment
- **FR91** : Le changement de niveau de partenariat met à jour automatiquement les droits d'accès

---

### 10. Gestion Médicale *(Phase 2)*

- **FR53** : Un Coach peut déclarer une blessure avec type, date et restriction de reprise
- **FR54** : Le système empêche l'enregistrement d'une présence active si une restriction médicale est en cours
- **FR55** : Un Parent peut consulter l'historique des blessures de son enfant
- **FR56** : Un Admin peut exporter un rapport des blessures par implantation

---

### 11. Conformité & Intégrité des Données

- **FR46** : Le système journalise toutes les opérations sensibles (consultation, modification, export, upload, accès cross-tenant)
- **FR47** : Le système supprime automatiquement les médias lors du retrait d'un consentement parental
- **FR48** : Un Admin peut configurer la durée de conservation des données par type d'entité
- **FR49** : Un Parent peut exercer ses droits RGPD (accès, rectification, effacement, portabilité) depuis son compte
- **FR97** : Le système peut anonymiser les données pédagogiques lors d'exports ou d'analyses inter-implantations
- **FR98** : Les exports clubs excluent automatiquement toute donnée non autorisée selon les consentements parentaux actifs
- **FR99** : Un Admin peut consulter et filtrer l'audit trail par utilisateur, type d'action et période
- **FR100** : Le système conserve les logs d'audit pour une durée configurable, indépendante de la durée de conservation des données enfants

---

### 12. Module Business *(Phase 2)*

- **FR50** : Un Parent peut consulter les offres de stages et s'y inscrire depuis la plateforme
- **FR51** : Un Parent peut régler le paiement d'un stage via la plateforme (Stripe)
- **FR52** : Le système génère automatiquement les documents d'inscription, reçus et justificatifs mutuelle

---

## Non-Functional Requirements

### Performance

| Critère | Cible | Contexte |
|---|---|---|
| Enregistrement présence individuelle (online) | < 2 secondes | Terrain, coach en mouvement |
| Enregistrement présence individuelle (offline) | Immédiat | Pas de latence réseau |
| Chargement liste des séances du jour | < 2 secondes sur 4G | Ouverture app au parking |
| Démarrage à froid de l'app | < 3 secondes sur appareil mid-range | iPhone 11 / Samsung A54 comme référence |
| Temps de réponse API | < 300ms au 95e percentile | Toutes les routes API applicatives |
| Livraison notification push post-séance | < 60 secondes après déclenchement | |
| Livraison notification critique (annulation) | < 30 secondes | Push + email + SMS en parallèle |
| Génération export PDF | < 5 secondes | Rapport parent ou club |

---

### Sécurité

- Toutes les communications chiffrées en transit (TLS 1.2 minimum)
- Données au repos chiffrées (AES-256 pour les médias)
- Tokens d'accès : durée max 24h — tokens de rafraîchissement : 30 jours
- RBAC appliqué côté serveur à chaque requête — jamais de vérification uniquement côté client (FR61)
- Isolation `tenant_id` : zéro fuite de données cross-tenant tolérée (FR62)
- Vidéos : streaming uniquement, aucun endpoint de téléchargement direct exposé
- Logs d'accès vidéo : toute consultation tracée avec horodatage et identité utilisateur
- Paiements Stripe : conformité PCI-DSS déléguée à Stripe — aucune donnée carte stockée côté plateforme

---

### Fiabilité & Résilience

- Disponibilité globale ≥ 95% (objectif évolutif vers 99% à Phase 2)
- Taux de succès synchronisation offline ≥ 90% — tout échec déclenche une alerte visible
- Zéro perte silencieuse de données — toute erreur de sync remonte une alerte utilisateur
- Données locales persistantes : survie à une fermeture forcée de l'app (FR59)
- Résolution des conflits de sync : priorité serveur par défaut — Coach notifié en cas de divergence (FR95, FR96)
- Notifications de rappel J+1 si données non synchronisées (FR18)

---

### Scalabilité

- Support de 1 000 utilisateurs actifs simultanés (horizon 2-3 ans)
- Architecture horizontalement scalable jusqu'à 5 000 utilisateurs sans refactoring majeur
- Modèle multi-tenant supporte jusqu'à 50 implantations sans dégradation
- Requêtes base de données optimisées pour le filtrage systématique par `tenant_id`
- Médias (vidéos) servis via CDN — découplés de l'infrastructure applicative

---

### Vidéo & Médias *(Phase 2)*

- **NFR-V1** : Durée max vidéo d'auto-évaluation ≤ 10 secondes par défaut, configurable par thème/exercice (FR101)
- **NFR-V2** : Poids max par vidéo ≤ 40 MB — compression automatique côté mobile avant upload
- **NFR-V3** : Upload d'une vidéo de 10s en ≤ 60 secondes sur 4G au 95e percentile
- **NFR-V4** : Lecture côté parent et enfant en streaming uniquement — aucun endpoint de téléchargement (FR36)
- **NFR-V5** : Purge automatique des vidéos selon consentement parental actif et durée de conservation configurée (FR47, FR48)

---

### Conformité RGPD

- Consentement parental collecté et archivé avant tout traitement de données de l'enfant
- Droit à l'effacement exécuté dans un délai ≤ 30 jours (médias supprimés dans les 24h)
- Exportabilité des données : format structuré exploitable (JSON ou CSV) sur demande
- Données inter-implantations : anonymisées systématiquement avant tout agrégat ou export (FR97)
- Exports clubs : filtrés automatiquement selon les consentements parentaux actifs (FR98)
- Principe de minimisation : aucune donnée collectée au-delà de la finalité déclarée
- Logs d'audit conservés minimum 5 ans, indépendamment des données enfants (FR100)

---

### Intégrité des Données

- Toutes les opérations de synchronisation sont transactionnelles — écriture partielle rejetée et rejouée
- Versioning des thèmes : les données enfants restent liées à la version active au moment de la séance (FR92-FR94)
- Toute modification de thème pédagogique est non-destructive — historique préservé
- Journal d'audit immuable — entrées non modifiables par les utilisateurs standard (FR99)

---

### Accessibilité Terrain

- Contraste d'affichage : WCAG AA minimum — lisibilité en plein soleil
- Taille des zones tactiles : ≥ 44px — utilisable avec des doigts en mouvement
- Indicateur de connectivité/sync : toujours visible dans l'interface mobile
- Pas de dépendance exclusive à la couleur pour transmettre un état
