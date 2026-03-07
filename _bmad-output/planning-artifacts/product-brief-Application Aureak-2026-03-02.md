---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - AUREAK_PRD.md
date: 2026-03-02
author: Jeremydevriendt
---

# Product Brief: Application Aureak

## Executive Summary

AUREAK est une plateforme de gestion d'académie de football construite autour d'une méthodologie pédagogique propriétaire développée sur 13 ans, spécialisée dans la formation du gardien de but. Elle digitalise et prolonge chaque séance au-delà du terrain — de la prise de présence au quiz post-entraînement, du feedback coach au tableau de bord parent, de la collection de badges techniques au suivi de progression long terme. Le tout sécurisé pour les mineurs, utilisable en offline sur le terrain, et conçu pour opérer sur plusieurs implantations.

---

## Core Vision

### Problem Statement

Les académies de football spécialisées disposent d'une méthodologie pédagogique élaborée, mais n'ont aucune infrastructure numérique pour en assurer la continuité. Aujourd'hui, les coachs gèrent les présences sur papier ou WhatsApp, n'ont aucun moyen structuré de collecter le retour d'apprentissage des enfants après séance, ne peuvent pas tracer la progression technique individuelle contre des critères définis, et perdent la continuité avec les parents entre deux entraînements. Le travail pédagogique réalisé sur le terrain s'évapore dès que l'enfant rentre chez lui.

### Problem Impact

- Les coachs ne peuvent ni prouver ni mesurer l'efficacité de leur méthode dans le temps
- Les enfants n'ont aucune visibilité sur leur propre progression — pas de boucle d'engagement après le terrain
- Les parents reçoivent peu de retour, ce qui réduit la confiance et la valeur perçue de l'académie
- La direction n'a pas de données agrégées sur la qualité de coaching, les présences ou les résultats d'apprentissage
- En cas d'incident (annulation, blessure, absence), la communication est fragmentée entre WhatsApp, SMS et email

### Why Existing Solutions Fall Short

Les outils comme Spond, Teamsnap ou les logiciels génériques de gestion de club gèrent l'agenda et les présences, mais :
- N'embarquent aucun contenu pédagogique lié à la séance (thèmes, critères, objectifs d'apprentissage)
- Ne proposent aucune validation post-séance de la connaissance (quiz → badge → exercice filmé)
- N'offrent aucune évaluation technique structurée contre un curriculum propriétaire
- Ne sont pas conçus pour le contrôle d'accès multi-rôles nécessaire dans une académie multi-sites avec des mineurs

### Proposed Solution

Une plateforme sur mesure qui prolonge la séance AUREAK au-delà du terrain : check-in → évaluation coach → quiz enfant → exercice de self-coaching filmé → retour technique coach → progression visible par le parent. Tout cela sécurisé, offline-capable, et déployable sur plusieurs implantations.

### Key Differentiators

1. **Méthodologie embarquée** — Construit autour de 13 ans de curriculum propriétaire AUREAK, pas un outil générique adapté après coup
2. **Boucle d'apprentissage complète** — Seule plateforme qui ferme la boucle coach → enfant → parent de la séance à la maison : présence → évaluation → quiz → exercice filmé → instruction technique
3. **Progression adaptée à l'âge** — Parcours distincts par catégorie (U5, U8, U11, pro) reflétant les stades de développement réels
4. **Expertise fondateur** — Construit par un ancien joueur professionnel, 13 ans d'expérience en coaching, réseau actif dans les clubs de haut niveau belges et français
5. **Offline-first terrain** — Conçu pour les environnements d'entraînement réels où la connectivité est aléatoire

---

## Target Users

### Primary Users

**Persona 1 — Théo, l'Assistant Coach (18 ans)**

Étudiant en éducation physique, passionné de football, il a lui-même été gardien jusqu'à 16 ans. Il coache le groupe U8 le mercredi soir et le samedi matin. Bénévole avec une petite compensation, il est encore en formation sur la méthodologie AUREAK.

*Journée type :* Il regarde les capsules vidéo et la fiche de séance sur son téléphone dans le bus. Sur le terrain, il pose son téléphone au bord pour pouvoir y revenir pendant les exercices. Il tente de retenir mentalement qui était là. À la fin, il envoie un message WhatsApp au responsable de site avec les présences — souvent approximatives.

*Ce qui le stresse :* Ne pas maîtriser assez bien l'exercice pour le corriger en live. Oublier des présences. Ne pas savoir si son groupe progresse vraiment.

*Ce qui l'enthousiasme :* Les retours vidéo des enfants — pouvoir voir leurs gestes à l'avance pour préparer ses corrections ciblées avant même d'arriver sur le terrain.

*Besoin clé :* Une guidance claire, accessible depuis le terrain, avec des rappels visuels des exercices et des retours concrets sur ses groupes.

---

**Persona 2 — Marc, le Coach Senior (34 ans)**

Ex-joueur de niveau régional reconverti depuis 8 ans dans le coaching de gardiens. Il enchaîne 3 séances d'affilée le samedi — U5, U8, U11. Rémunéré selon son ancienneté et ses formations validées dans l'académie. Il connaît la méthode AUREAK sur le bout des doigts mais peaufine en permanence la correction technique.

*Journée type :* 1h de préparation max le matin — il relit les thèmes, revoit les critères. Sur le terrain, il gère tout de tête : présences, états de forme des enfants, notes de séance. Après 3 séances d'affilée, il doit restituer toutes les présences de mémoire au responsable du site. C'est là que ça se perd.

*Ce qui le stresse :* La charge mémorielle après 3 groupes consécutifs. Ne pas avoir de trace structurée de l'évolution technique de chaque enfant pour ajuster sa pédagogie.

*Ce qui l'enthousiasme :* Voir les exercices filmés par les enfants chez eux — ça lui permet d'affiner son œil critique et de personnaliser ses retours.

*Besoin clé :* Check-in présences en quelques secondes, notes rapides par enfant pendant ou après la séance, et accès aux vidéos des enfants avant le prochain entraînement.

---

**Persona 3 — Sophie, la Maman Investie (41 ans)**

Indépendante, organisée, elle suit de près le parcours de son fils Lucas (12 ans, foot à 8). Elle regarde les séances depuis le bord du terrain, le plus souvent. Elle ne comprend pas toujours tous les aspects techniques du poste de gardien, mais elle voit la progression de son fils dans sa confiance et sa prestance.

*Ce qu'elle attend d'AUREAK :* Un encadrement sérieux et bienveillant. Des retours concrets sur le comportement et l'effort de Lucas — pas seulement un résultat sportif. Elle veut que son fils se sente bien dans ce rôle, qu'il gagne en assurance.

*Ce qui la frustre aujourd'hui :* Peu de retour entre les séances. Si Lucas a eu une bonne séance ou une moins bonne, elle ne le sait que par ce qu'il lui raconte. Elle ne sait pas où il en est dans sa progression.

*Moment "aha" :* Recevoir une notification après chaque séance avec l'évaluation coach de Lucas et voir son badge technique débloqué. Se sentir dans la boucle sans devoir demander.

*Besoin clé :* Tableau de bord simple, notifications post-séance, accès aux vidéos autorisées, communication fluide avec le staff via un système de tickets.

---

**Persona 4 — Les Enfants (4 segments selon la méthode)**

| Segment | Âge | Format | Moteur principal |
|---|---|---|---|
| **Foot à 5** | 8-9 ans | Découverte | Fun, jeu, premier contact avec le poste |
| **Foot à 8** | 10-13 ans | Apprentissage | Être bon, être à l'aise dans le but, progresser parmi ses pairs |
| **Foot à 11** | 14-18 ans | Compétition | Progresser sérieusement, esprit de compétition croissant |
| **Senior** | 18+ ans | Performance | Semi-pro / pro, excellence technique |

*Comportement digital :* Notifications et contenu pédagogique reçus uniquement via les parents jusqu'à 15-16 ans, puis accès direct avec validation parentale. Les quiz post-séance et les exercices filmés sont le lien entre le terrain et la maison — moteur d'engagement principal de l'enfant dans la plateforme.

---

### Secondary Users

**Admin / Responsable Académie** — Accès total. Gère les implantations, les permissions, la conformité, les rapports de qualité coaching et les données agrégées.

**Club Partenaire / Associé** — Accès lecture sur les données de leurs enfants : présences, blessures, rapports mi-saison et fin de saison. Même niveau d'accès pour les deux grades.

**Club Commun** — Accès minimal : présences, blessures, rapports périodiques uniquement. Aucun accès à la plateforme complète.

---

### User Journey — Marc (Coach Senior, séance type)

| Étape | Action | Point de friction actuel | Valeur AUREAK |
|---|---|---|---|
| **Préparation** | Relit thèmes + critères | Dispersé entre PDF, WhatsApp, mémoire | Fiche séance intégrée, capsules accessibles en un tap |
| **Arrivée terrain** | Consulte son téléphone | Jongle entre plusieurs apps | Vue séance unifiée, matériel à préparer |
| **Check-in** | Note les présences | De tête, risque d'oubli | QR check-in ou tap rapide, offline |
| **Pendant séance** | Rappel exercice | Reprend le téléphone, interrompt le flow | Rappel visuel discret par exercice |
| **Fin de séance** | Note état enfant + feedback | Mémorisation sur 3 groupes consécutifs | Smiley + commentaire par enfant en 10 secondes |
| **Après séance** | Remonte les présences | Message WhatsApp approximatif | Sync automatique au responsable de site |
| **J+1** | Regarde vidéos enfants | Inexistant aujourd'hui | Revoit les exercices filmés, prépare corrections ciblées |

---

## Success Metrics

### Ce que le succès signifie pour chaque utilisateur

**Coach — adoption réelle**
Un coach a adopté la plateforme quand :
- Toutes ses séances ont des présences enregistrées numériquement (pas de trou)
- Il consulte régulièrement les vidéos soumises par ses enfants entre deux séances
- Son œil de correcteur s'aiguise via les retours visuels — il note, il commente, il progresse

*Signe d'alerte inverse :* un coach dont les séances n'ont aucun check-in ou aucun feedback n'utilise pas la plateforme — l'admin peut le voir directement.

**Parent — engagement profond**
Un parent trouve de la valeur quand la fiche de son enfant contient des critères de correction remplis — cela signifie que le cycle complet a été réalisé : quiz → exercice filmé → retour coach. Ce n'est pas le téléchargement qui compte, c'est le parcours terminé.

**Enfant — participation active**
Un enfant est dans l'univers AUREAK quand il soumet une vidéo d'auto-évaluation. Ce geste volontaire indique qu'il veut aller jusqu'au bout — il cherche un résultat, pas juste une présence.

---

### Business Objectives

| Horizon | Objectif | Indicateur |
|---|---|---|
| **3 mois** | Adoption terrain complète | 100% des séances avec check-in numérique |
| **6 mois** | Engagement parent actif | >60% des fiches enfants avec ≥1 cycle évaluation complet |
| **12 mois** | Croissance académie | 150+ adhérents (vs 110 aujourd'hui, 70 début de saison dernière) |
| **12 mois** | Rétention saison | ≥80% des adhérents actuels re-inscrits la saison suivante |
| **Long terme** | Attractivité profils forts | Attirer des enfants à fort potentiel compétitif grâce à la réputation d'exigence |

---

### Key Performance Indicators

**Adoption & Usage**
- **Taux de check-in numérique** : % de séances avec présences enregistrées dans l'app (cible : >95% à 3 mois)
- **Taux d'activité coach** : % de coachs ayant consulté ≥1 vidéo enfant par mois (cible : >70% à 6 mois)
- **Taux de cycle complet** : % d'enfants avec ≥1 cycle quiz→vidéo→feedback complété par mois (cible : >50% à 6 mois, >75% à 12 mois)

**Impact pédagogique**
- **Taux de présence moyen** par groupe et par implantation — baseline à établir dès le lancement
- **Taux de soumission vidéo** : % d'enfants actifs ayant soumis ≥1 vidéo par mois (indicateur d'engagement profond)
- **Taux d'auto-évaluation** : si la quasi-totalité des enfants avec accès utilisent la fonctionnalité d'évaluation → le pari pédagogique est réussi

**Croissance business**
- **Nombre d'adhérents actifs** : suivi mensuel (70 → 110 cette saison, objectif 150+ à S+1)
- **Revenus stages** : nombre d'inscriptions aux stages via la plateforme
- **Rétention saison** : % d'adhérents re-inscrits d'une saison à l'autre

---

## MVP Scope

### Core Features (3 mois)

Le MVP est délibérément minimal : il résout le problème terrain immédiat sans surcharger le développement.

**1. Gestion des séances**
- Identification de la séance du jour (entraînement n°X)
- Fiche séance avec les thèmes techniques associés
- Navigation simple pour le coach depuis son téléphone

**2. Présences digitales**
- Check-in rapide par enfant, offline-first
- Synchronisation différée vers l'admin et le responsable de site
- Fin du WhatsApp de fin de séance

**3. Évaluation coach post-séance**
- Note rapide par enfant (attitude, effort — signal visuel, pas une cote)
- Commentaire libre optionnel
- Retour global sur la séance

**4. Quiz enfant post-séance**
- Quiz QCM lié aux thèmes techniques de la séance
- Validation = déclenchement de la notification parent
- Pas de vidéo, pas de badge complexe — juste le quiz

**5. Board parent basique**
- Notification post-séance avec résumé évaluation
- Accès à la fiche de leur enfant (présences + quiz)

**6. Authentification & rôles**
- Admin, Coach, Parent, Enfant
- RGPD mineurs : accès enfant via parent jusqu'à 15-16 ans

---

### Out of Scope pour le MVP

| Fonctionnalité | Phase cible |
|---|---|
| Upload et gestion vidéo | Phase 3 |
| Exercices de self-coaching filmés | Phase 3-4 |
| Gamification avancée (badges, cartes, Goal & Player) | Phase 4 |
| Formation coach (capsules techniques/situationnelles) | Phase 6 |
| Module business (boutique, stages, dons) | Phase 7 |
| Analyse match | Phase 5 |
| Avatar animé IA | Phase 4+ |
| Multi-implantations avancées (clubs partenaires) | Phase 2 |
| IA d'analyse gestuelle | Phase 8 |

---

### MVP Success Criteria

Le MVP est validé quand :
- >95% des séances ont des présences enregistrées numériquement après 6 semaines
- >80% des coachs actifs sur l'app dans le premier mois
- >50% des enfants complètent le quiz post-séance dans le premier mois
- Zéro WhatsApp de présences envoyé aux responsables de site

---

### Future Vision (2-3 ans)

**1. La data enfant comme actif central**
Aujourd'hui il n'y a aucun repère visuel consolidé sur un enfant. Dans 3 ans, en quelques clics l'admin voit : taux de présence, attentivité, goût à l'effort, niveau technique par critère, gabarit, perception. Cette base de données permet de composer des groupes cohérents, d'identifier les talents précoces, et de prouver l'impact de la méthodologie sur le long terme.

**2. Le lock-in coach comme avantage compétitif**
Un coach qui travaille chez AUREAK accumule au fil des saisons : retours vidéo de ses groupes, analyses de progression de ses enfants, historique de ses corrections. S'il quitte AUREAK, il perd tout cet actif. Ce n'est pas une contrainte — c'est une promesse : *"Si tu veux être dans le top du top, c'est chez AUREAK."* La plateforme devient un outil de rétention des meilleurs coachs et un signal de qualité pour les familles.

**Cap SaaS long terme** : si la méthode AUREAK prouve son impact via les données, la plateforme peut être proposée à d'autres académies spécialisées (autres postes, autres sports) qui veulent travailler avec la même exigence pédagogique.



