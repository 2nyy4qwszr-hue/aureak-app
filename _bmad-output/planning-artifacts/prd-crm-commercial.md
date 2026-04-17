---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
visionStatement: "Les commerciaux voient en temps réel qui a contacté quel club, avec quel résultat. L'admin n'intervient que pour les décisions, plus pour le dispatch d'information."
differentiator: "Autonomie du commercial quand le terrain est libre, coordination automatique quand il ne l'est pas."
coreInsight: "Décharger l'admin du bruit informationnel (qui a contacté qui ?) pour qu'il se concentre sur les arbitrages."
implicitRule: "Pas de contact existant → liberté totale. Contact existant → consulter avant d'agir."
inputDocuments:
  - project-context.md
  - prd.md
  - product-brief-Application Aureak-2026-03-02.md
documentCounts:
  briefs: 1
  research: 0
  projectDocs: 2
workflowType: 'prd'
classification:
  projectType: Web App — module brownfield ultra-lean
  domain: General / Internal tooling
  complexity: Low
  projectContext: brownfield
  elicitationInsight: "Registre de contacts clubs partagé, pas un CRM. UX critique = 2 taps pour logger, 2 secondes pour vérifier."
---

# Product Requirements Document - CRM Commercial Clubs (Application Aureak)

**Author:** Jeremydevriendt
**Date:** 2026-04-16

## Executive Summary

Le module **Registre Commercial Clubs** est un outil de coordination interne ajouté à la plateforme Aureak. Il résout un problème concret : aujourd'hui, l'administrateur (Jeremydevriendt) est le seul point de passage pour savoir si un club a déjà été contacté par un commercial. Chaque demande transite par lui — c'est un goulot d'étranglement qui ralentit la prospection et crée un risque d'impairs (deux commerciaux contactent le même club sans le savoir).

**Utilisateurs :** commerciaux Aureak (nouveau rôle `commercial`) + administrateur existant.

**Problème :** absence de visibilité partagée sur les contacts clubs. Les commerciaux ne savent pas qui a déjà approché quel club, par quel intermédiaire, ni avec quel résultat. L'admin est sollicité pour chaque vérification.

**Solution :** un registre partagé en temps réel où chaque commercial voit immédiatement si un club a été contacté, par qui, via quel contact, et avec quel statut. Pas de contact existant → il prend l'initiative seul. Contact existant → il se coordonne avec le collègue et/ou remonte à l'admin pour arbitrage.

**Contrainte UX critique :** 2 taps pour logger un contact, 2 secondes pour vérifier un club. Si c'est plus lent ou plus compliqué, personne ne l'utilisera.

### What Makes This Special

- **Autonomie conditionnelle** — le commercial agit seul quand le terrain est libre, se coordonne quand il ne l'est pas. Pas de workflow imposé, pas de validation systématique.
- **Intelligence collective des angles d'attaque** — un contact bloqué via l'entraîneur des gardiens peut être débloqué par un autre commercial qui connaît le président. Le module rend visible ces alternatives.
- **Mémoire permanente** — tout l'historique survit au turnover. Un nouveau commercial ne repart jamais de zéro.
- **Admin libéré du bruit** — l'administrateur n'intervient plus pour le dispatch d'information, seulement pour les décisions stratégiques.

## Project Classification

| Attribut | Valeur |
|---|---|
| **Type** | Web App — module brownfield responsive |
| **Domaine** | Internal tooling / coordination commerciale |
| **Complexité** | Low |
| **Contexte** | Brownfield — ajout à la plateforme Aureak existante |
| **Source de données** | `club_directory` (annuaire clubs existant) |
| **Nouveau rôle** | `commercial` (ajout à l'enum `user_role`) |

## Success Criteria

### User Success

**Commercial — adoption terrain**
- 100% des commerciaux actifs utilisent le registre avant chaque prise de contact club, dès la 2e semaine
- Chaque contact logué est visible par tous en temps réel — zéro délai, zéro action supplémentaire
- Ajouter un contact + note prend moins de 30 secondes

**Admin — désengorgement**
- Zéro message "est-ce que quelqu'un a déjà contacté ce club ?" reçu par l'admin après 3 semaines d'utilisation
- L'admin consulte le registre en lecture pour superviser, sans être sollicité pour le dispatch

### Business Success

| Horizon | Objectif | Indicateur |
|---|---|---|
| 2 semaines | Adoption complète | 100% des commerciaux ont logué au moins 1 contact |
| 1 mois | Zéro impair | Aucun doublon de contact sur un même club |
| 1 mois | Admin libéré | 0 messages de vérification reçus par l'admin |
| 3 mois | Mémoire collective | Tout nouveau commercial consulte le registre avant sa première démarche |

### Technical Success

- **Fiabilité** : le module fonctionne sans bug — pas de perte de données, pas de latence perceptible
- **Responsive** : utilisable confortablement sur mobile (navigateur) — les commerciaux sont en déplacement
- **Temps de chargement** : la liste clubs + statuts s'affiche en moins de 2 secondes

### Measurable Outcomes

Le module est un succès quand :
1. Les commerciaux ne passent plus par l'admin pour vérifier l'état d'un club
2. Aucun club n'est contacté en doublon par deux commerciaux
3. L'historique complet des contacts est consultable par tout commercial à tout moment

---

## Product Scope

### MVP — Minimum Viable Product

1. **Rôle `commercial`** dans l'auth + onboarding minimal
2. **Liste clubs** depuis `club_directory` — recherche par nom, filtre partenaire/associé grisé
3. **Fiche club** — badge statut (pas contacté / contacté / en cours), liste des contacts logués
4. **Ajout contact** — formulaire minimal : qui j'ai contacté (texte libre), date, note libre, statut
5. **Vue partagée** — tout commercial voit tous les contacts de tous les clubs en temps réel
6. **Vue admin** — la même vue en lecture, intégrée dans la section admin existante

**Out of scope MVP :**
- Notifications (email/push) quand un collègue ajoute un contact
- Export des données
- Statistiques / reporting
- Gestion de pipeline / funnel de conversion
- Contractualisation / signature

### Growth Features (Post-MVP)

- Notifications temps réel ("Mika vient d'ajouter un contact chez Tilleur")
- Filtres avancés (par statut, par commercial, par date de dernier contact)
- Export CSV pour reporting
- Historique d'activité par commercial (vue admin)

### Vision (Future)

- Intégration avec le module clubs partenaires/associés existant (conversion automatique du statut quand un club signe)
- Dashboard de prospection avec carte géographique
- Relances automatiques sur les clubs "en cours" sans activité depuis X jours

## User Journeys

### Journey 1 — Serge, mardi soir *(Commercial — chemin de succès : club libre)*

Serge rentre d'un match amical où il a croisé le directeur sportif de Biesme. Bonne discussion, le gars semble ouvert. Serge se dit : "je vais le rappeler demain pour lui parler d'Aureak."

Avant de décrocher le téléphone, il ouvre l'app sur son mobile. Recherche : "Biesme". Résultat : **aucun contact logué**. Le club est libre — Serge a le champ libre.

Il appelle le directeur sportif le lendemain. Bonne conversation, intéressé mais veut en parler au comité. Serge ouvre l'app, tape : "Directeur sportif — Jean-Marc Dupont — intéressé, attend retour comité". 20 secondes. C'est fait. Tous les autres commerciaux voient maintenant que Biesme est "en cours" via Serge.

*Capabilities révélées :* recherche club instantanée · vérification statut · ajout contact rapide · visibilité partagée temps réel

---

### Journey 2 — Serge, jeudi matin *(Commercial — cas de coordination : club déjà contacté)*

Serge connaît le président de Tilleur. Il ouvre l'app. Recherche : "Tilleur". Résultat : **Mika a contacté l'entraîneur des gardiens il y a 2 semaines — statut "en attente"**.

Serge voit que l'angle entraîneur des gardiens est déjà pris, et en attente. Mais lui a un contact différent — le président. Il appelle Mika directement : "T'en es où avec Tilleur ? Moi je connais le président, ça pourrait débloquer."

Mika lui explique que l'entraîneur des gardiens est intéressé mais ne peut pas décider seul. Serge et Mika se mettent d'accord : Serge approche le président pour avoir un appui interne. Il contacte l'admin pour valider cette approche.

Serge ajoute dans le registre : "Président — contact via Serge — en coordination avec Mika (entraîneur gardiens)". L'admin voit les deux lignes et suit la situation sans avoir été sollicité pour le dispatch initial.

*Capabilities révélées :* détection contact existant · identification de l'angle différent · historique multi-contacts par club · coordination entre commerciaux

---

### Journey 3 — Jeremydevriendt, lundi matin *(Admin — supervision)*

Lundi 9h. Jeremydevriendt ouvre la section commerciale dans l'admin. Vue globale : 47 clubs dans l'annuaire, 12 contactés cette semaine, 3 en attente depuis plus de 2 semaines, 32 jamais contactés.

Il repère Onhaye — "en attente" depuis 3 semaines, dernier contact par Mika. Il sait que Mika a du mal à avancer sur celui-là. Il peut décider de réattribuer ou de laisser courir.

Il voit aussi que Serge a logué 4 nouveaux contacts cette semaine — dont Biesme qui semble prometteur. Aucun doublon détecté. La machine tourne sans qu'il ait reçu un seul message de vérification.

*Capabilities révélées :* vue globale clubs + statuts · compteurs (contactés / en attente / jamais contactés) · détection des situations bloquées · suivi par commercial

---

### Journey 4 — Karim, jour 1 *(Nouveau commercial — mémoire collective)*

Karim rejoint l'équipe commerciale. Avant même son premier appel, il ouvre le registre. Il voit immédiatement : 15 clubs déjà contactés, 8 en cours, les notes de Serge et Mika sur chaque club. Il sait exactement où ne pas aller et où il y a de la place.

Il repère 5 clubs dans sa zone jamais contactés. Il commence par ceux-là — zéro risque de marcher sur les pieds de quelqu'un.

*Capabilities révélées :* mémoire collective accessible · onboarding sans formation · autonomie immédiate du nouveau commercial

---

### Journey Requirements Summary

| Capability | Révélée par |
|---|---|
| Recherche club par nom (instantanée) | Serge J1, J2 |
| Badge statut club (pas contacté / contacté / en cours) | Serge J1, J2, Karim J4 |
| Ajout contact rapide (< 30 sec) | Serge J1, J2 |
| Historique multi-contacts par club | Serge J2 |
| Visibilité partagée temps réel | Serge J1, J2, Admin J3, Karim J4 |
| Vue globale admin (compteurs, filtres) | Admin J3 |
| Détection clubs bloqués (en attente > X jours) | Admin J3 |
| Suivi d'activité par commercial | Admin J3 |
| Accès lecture immédiat pour nouveaux | Karim J4 |

---

## Domain-Specific Requirements

### Contraintes Techniques

**Contrôle d'accès par rôle (RBAC)**

| Rôle | Périmètre module commercial |
|---|---|
| Admin | Lecture complète tous clubs + tous contacts. Pas d'écriture (ce sont les commerciaux qui loggent) |
| Commercial | Lecture complète tous clubs + tous contacts. Écriture : ajout/modification de ses propres contacts uniquement |

**Données manipulées**
- Données clubs : issues de `club_directory` (lecture seule, pas de PII mineurs)
- Données contacts : noms + rôles de contacts adultes dans les clubs — pas de données sensibles RGPD mineurs
- Pas de vidéo, pas de données médicales, pas de données financières

### Contraintes d'Intégration

| Intégration | Détail |
|---|---|
| `club_directory` | Source de vérité pour la liste des clubs — lecture seule |
| `clubs` (portail auth) | Détecter les clubs déjà partenaires/associés via `partnership_access_level` |
| Auth existant | Ajout du rôle `commercial` à l'enum `user_role` |

### Risques & Mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Commercial n'utilise pas le registre | Élevé — doublons persistent | UX ultra-simple, onboarding en 1 minute, rappel verbal par l'admin |
| Données obsolètes (contact logué mais plus à jour) | Moyen — fausse information | Note libre permet de mettre à jour ; date visible sur chaque entrée |
| Perte de données | Élevé | Soft-delete uniquement, backup Supabase standard |

---

## Functional Requirements

### FR-1 : Rôle Commercial

- Ajout de `commercial` à l'enum `user_role` en DB
- Route group `(commercial)` dans Expo Router
- Layout commercial avec sidebar simplifiée (un seul item : "Clubs")
- Authentification standard via le flow existant

### FR-2 : Liste des Clubs

- Source : table `club_directory`
- Recherche par nom (texte libre, recherche instantanée)
- Chaque club affiche un **badge statut** :
  - 🟢 **Partenaire/Associé** — grisé, pas d'action possible (déjà acquis)
  - 🟡 **En cours** — au moins un contact logué avec statut "en cours" ou "en attente"
  - ⚪ **Pas contacté** — aucun contact logué
  - 🔴 **Pas de suite** — tous les contacts logués ont le statut "pas de suite"
- Compteurs visibles en haut : total clubs, contactés, en cours, jamais contactés

### FR-3 : Fiche Club

- En-tête : nom du club, ville, badge statut agrégé
- Si partenaire/associé : mention "Club partenaire Aureak" avec badge, pas d'ajout de contact
- Liste des contacts logués (tous commerciaux confondus) :
  - Nom du contact au club (texte libre)
  - Rôle au club (texte libre : président, directeur sportif, entraîneur gardiens…)
  - Commercial Aureak qui a logué
  - Date du contact
  - Statut : `premier_contact` | `en_cours` | `en_attente` | `pas_de_suite`
  - Note libre
- Bouton "Ajouter un contact" (visible pour les commerciaux)

### FR-4 : Ajout / Modification de Contact

- Formulaire minimal :
  - Nom du contact (texte libre, requis)
  - Rôle au club (texte libre, optionnel)
  - Statut (sélecteur : premier contact / en cours / en attente / pas de suite)
  - Note (texte libre, optionnel)
- Date = automatique (date du jour)
- Commercial = automatique (utilisateur connecté)
- Un commercial ne peut modifier que ses propres contacts
- Pas de suppression (soft-delete si nécessaire, mais pas de bouton supprimer en UI)

### FR-5 : Vue Admin

- Même vue que le commercial mais en lecture seule (pas d'ajout de contact)
- Intégrée dans la section `(admin)` existante — nouvel item sidebar "Commercial"
- Compteurs globaux en haut de page
- Filtre par commercial (dropdown)
- Filtre par statut
- Tri par date de dernier contact (clubs les plus récemment actifs en premier)

---

## Non-Functional Requirements

### Performance
- Liste clubs : < 2 secondes au chargement initial
- Recherche : filtrage côté client (la liste complète est chargée une fois)
- Ajout contact : retour visuel immédiat (optimistic update)

### Sécurité
- RLS sur les nouvelles tables : commerciaux = lecture tout + écriture own ; admin = lecture tout
- Pas de données sensibles mineurs dans ce module
- Soft-delete uniquement

### Compatibilité
- Web responsive : mobile-first (iPhone Safari, Chrome Android)
- Desktop : Chrome, Safari, Firefox
- Pas d'offline requis (les commerciaux consultent quand ils ont du réseau)

### Accessibilité
- Contraste suffisant sur les badges statut
- Formulaire accessible au clavier
- Labels explicites sur tous les champs

### Maintenabilité
- Conventions Aureak standard : `@aureak/api-client` pour l'accès DB, `@aureak/theme` pour les styles
- Code dans le monorepo existant, pas de package séparé

---

## Implementation Considerations

### Nouvelles Tables

```
commercial_contacts
  id              UUID PK
  club_directory_id UUID FK → club_directory.id
  commercial_id   UUID FK → auth.users.id
  contact_name    TEXT NOT NULL
  contact_role    TEXT
  status          commercial_contact_status ENUM
  note            TEXT
  contacted_at    TIMESTAMPTZ DEFAULT NOW()
  created_at      TIMESTAMPTZ DEFAULT NOW()
  updated_at      TIMESTAMPTZ DEFAULT NOW()
  deleted_at      TIMESTAMPTZ
```

```
Enum commercial_contact_status:
  premier_contact | en_cours | en_attente | pas_de_suite
```

### Routing

```
(commercial)/clubs/         → liste clubs + recherche
(commercial)/clubs/[id]/    → fiche club + contacts
(admin)/commercial/         → vue admin supervision
```

### Estimation

Module lean — 1 epic, 4-5 stories max :
1. Migration + types + api-client
2. Auth : rôle commercial + layout + routing
3. Liste clubs + recherche + badges statut
4. Fiche club + ajout contact
5. Vue admin

