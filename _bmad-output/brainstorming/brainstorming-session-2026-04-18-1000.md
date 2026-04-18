---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Architecture informationnelle de la section Développement — sous-catégories, placement clubs partenaires/associés, périmètre prospection/marketing/partenariat'
session_goals: 'Hiérarchiser la section Développement avec sous-sections claires (prospection clubs+gardiens, marketing, partenariats/sponsors) et définir la frontière avec Académie'
selected_approach: 'ai-recommended'
techniques_used: ['Morphological Analysis', 'Role Playing', 'Decision Tree Mapping']
ideas_generated: ['39 idées structurantes']
context_file: ''
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitateur:** Jeremydevriendt
**Date:** 2026-04-18

## Session Overview

**Sujet :** Architecture informationnelle de la section "Développement" du dashboard admin Aureak
**Objectifs :** Trouver la meilleure hiérarchie pour prospection (clubs + gardiens), marketing, et partenariats/sponsors — avec une frontière claire vs. Académie

### Contexte initial

La sidebar actuelle : Dashboard, Activités, Méthodologie, Académie, Événements, Développement, Performances.
Chaque section existante a une logique claire sauf Développement qui manque de structure interne.

Insight clé posé dès le setup : un club peut vivre dans deux contextes mentaux — opérationnel (Académie) vs. croissance (Développement). L'organisation par **intention utilisateur** prime sur l'organisation par objet.

### Première décision validée

- Académie > Clubs = fiche club adaptée selon statut (partenaire/associé/prospect converti)
- Développement > Prospection = pipeline commercial (clubs pas encore signés)

## Technique Selection

**Approche :** AI-Recommended Techniques

**Techniques recommandées :**
1. **Morphological Analysis** — cartographier toutes les combinaisons possibles (sections × utilisateurs × contenus)
2. **Role Playing** — incarner les utilisateurs réels (commercial, coach, manager) pour tester la navigation
3. **Decision Tree Mapping** — structurer l'arborescence finale de Développement

## Technique Execution Results

### Morphological Analysis — Matrice des axes

**4 axes identifiés :**

| Axe | Options |
|---|---|
| Sous-sections sidebar | Prospection, Marketing, Partenariat (remplacent "Développement") |
| Qui utilise | Commercial, Scout, Coach, Manager, Marketeur, Admin/Fondateur |
| Type de contenu | Pipeline CRM, Documents imprimables, Fiches contacts, Stats/KPI, Médias, Réseaux sociaux |
| Cycle de vie | Prospect → Contact → Négociation → Converti → Actif |

### Role Playing — 5 scénarios explorés

1. **Julien le commercial** → Pipeline clubs multi-contacts, mapping organisationnel, handoff fondateur, attribution multi-contributeur
2. **Sophie la scout** → Recherche/ajout gardien terrain mobile-first, note scout, invitation séance gratuite
3. **Pipeline entraîneurs** → 4 étapes simples (identifié → info → formation → actif), recommandation par les coachs
4. **Lucas le marketeur** → Médiathèque centralisée (photos coachs → validation admin), structure placeholder pour réseaux sociaux/blog/pub
5. **Section Partenariat** → Sponsors = parrainage enfant, ambassadeurs, récap clubs partenaires (vue business)

### Decision Tree Mapping — Arborescence finale validée

```
Dashboard
Activités
Méthodologie
Académie
  ├── Joueurs
  ├── Coachs
  ├── Scouts
  ├── Managers
  ├── Commerciaux    ← nouveau
  ├── Marketeurs     ← nouveau
  ├── Clubs
  └── Implantations
Événements
Prospection           ← remplace "Développement"
  ├── Clubs
  ├── Gardiens
  └── Entraîneurs
Marketing             ← nouveau
  ├── Médiathèque
  ├── Réseaux sociaux
  ├── Blog / Site
  └── Publicité
Partenariat           ← nouveau
  ├── Sponsors
  ├── Ambassadeurs
  └── Clubs partenaires
Performances
```

## Idées générées — Inventaire complet (39)

### Prospection (19 idées)
- #1 : Prospection tri-axe (Gardiens / Clubs / Entraîneurs)
- #2 : Référencement terrain par les coachs/scouts
- #8 : Pipeline commercial multi-contacts par club
- #9 : Détection du closer / décisionnaire
- #10 : Séparation commercial / fondateur dans le pipeline
- #11 : Attribution commerciale multi-contributeur
- #12 : Système de contribution avec horodatage
- #13 : Règles d'attribution configurables
- #14 : Bibliothèque de ressources commerciales
- #15 : Recherche + ajout gardien par le scout sur le terrain
- #16 : Note/évaluation scout rapide
- #17 : Visibilité données conditionnelle par rôle (RGPD)
- #18 : Invitation séance gratuite depuis l'app
- #19 : Funnel gardien complet (prospect → actif)
- #20 : Séance gratuite automatisée — place disponible
- #21 : Liste d'attente intelligente avec notification push
- #22 : Séance gratuite = usage unique, traçable
- #25 : Pipeline entraîneurs — 4 étapes
- #26 : Recommandation coach → prospect entraîneur

### Marketing (4 idées)
- #27 : Section Marketing = placeholder structuré pour le futur
- #28 : Médiathèque centralisée — coachs → admin/marketeur
- #29 : Pipeline contenu assisté par IA (vision future)
- #30 : Blog/site — rédaction admin depuis l'app

### Partenariat (3 idées)
- #31 : Section Partenariat = structure posée, contenu à venir
- #32 : Sponsor = lié à un enfant (parrainage)
- #33 : Récap clubs partenaires = vue synthétique

### Architecture (13 idées)
- #6 : Nouveaux rôles DB — commercial, manager, marketeur
- #7 : Multi-rôle avec switch
- #23 : Statuts du cycle de vie gardien dans child_directory
- #24 : Mobile-first pour tous les rôles terrain
- #34 : Permissions granulaires par section — admin-configurable
- #35 : Sidebar dynamique selon permissions
- #36 : Permissions = rôle de base + overrides individuels
- #37 : Académie = annuaire complet de toutes les personnes
- #38 : Fiche Commercial dans Académie → lien vers Prospection
- #39 : Fiche personne universelle avec onglet Accès

## Organisation en Stories

**7 epics créés, 23 stories au total :**

| Epic | Stories | Scope |
|---|---|---|
| **86 — Architecture Rôles & Permissions** | 86-1 → 86-4 | Fondation : rôles DB, multi-rôle, permissions, sidebar dynamique |
| **87 — Académie Commerciaux & Marketeurs** | 87-1 → 87-3 | Pages Académie + fiche personne universelle |
| **88 — Prospection Clubs (CRM)** | 88-1 → 88-6 | Hub + pipeline + attribution + ressources + closing |
| **89 — Prospection Gardiens (scout)** | 89-1 → 89-6 | Statut prospect + formulaire scout + invitation + liste attente |
| **90 — Prospection Entraîneurs** | 90-1 → 90-2 | Pipeline 4 étapes + recommandation coach |
| **91 — Marketing** | 91-1 → 91-2 | Hub + médiathèque |
| **92 — Partenariat** | 92-1 → 92-3 | Hub + sponsors + récap clubs |

**Ordre d'implémentation recommandé :** 86 → 88-1 + 91-1 + 92-1 (hubs en parallèle) → 87 → 88 → 89 → 90 → 91-2 → 92

## Session Summary

**Achievements :**
- 39 idées structurantes générées à travers 3 techniques
- Décision majeure : "Développement" éclate en 3 sections autonomes (Prospection, Marketing, Partenariat)
- 3 nouveaux rôles identifiés (commercial, manager, marketeur)
- Architecture permissions granulaires avec multi-rôle et switch de contexte
- 3 pipelines de prospection distincts (clubs, gardiens, entraîneurs) avec leurs spécificités
- Frontière claire Académie (opérationnel) vs Prospection (croissance)
- 23 stories prêtes pour le développement dans `_bmad-output/implementation-artifacts/`
