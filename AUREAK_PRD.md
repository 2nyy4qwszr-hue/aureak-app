# AUREAK – Cahier des charges produit

## 1. Vision générale

### Objectif
Développer une application centralisée pour l’académie AUREAK permettant de gérer et automatiser :

séances → présences → feedbacks → progression → vidéos → évaluations → analyse match → formation coach → marketing

L’application doit être :
- Sécurisée (mineurs / RGPD)
- Utilisable rapidement sur le terrain
- Offline-first
- Scalable (multi-implantations)
- Séparée entre moteur produit et contenu pédagogique

---

## 2. Utilisateurs & Rôles

### Rôles principaux

**Admin / Responsable Académie**
- Accès total
- Gestion permissions
- Gestion implantations
- Contrôle conformité et sécurité

**Coach**
- Accès limité à ses implantations
- Gestion séances
- Notes et feedback
- Upload vidéos
- Évaluations

**Parent**
- Accès aux informations de son enfant
- Calendrier
- Documents
- Notifications
- Tickets de demande

**Enfant**
- Accès à son profil
- Progression
- Quiz
- Journal
- Vidéos autorisées

---

## 3. Multi-implantations

Chaque implantation correspond à un club ou site d'entraînement.

### Grades club
- Club partenaire
- Club associé
- Club commun

### Règles d’accès coach
- Accès limité aux enfants de son implantation
- Accès temporaire possible (validation admin)
- Visibilité données parentales configurable selon grade

---

## 4. Sécurité & Conformité (Mineurs)

### Consentements parentaux
- Droit à l’image
- Autorisation diffusion (interne / réseaux)
- Autorisation analyse vidéo
- Retrait possible

### Rétention des données
- Durée conservation configurable
- Suppression automatique à échéance

### Journal d’audit
- Consultation
- Modification
- Export
- Upload vidéo

### Incidents
- Signalement blessure
- Problème comportement
- Problème matériel
- Problème sécurité

---

## 5. Gestion médicale & documents

### Blessures
- Déclaration
- Suivi
- Restrictions reprise
- Archivage profil enfant

### Documents
- Justificatifs stage
- Documents mutuelle
- Documents assurance
- Accès parent

---

## 6. Opérations terrain (Priorité MVP)

### Check-in rapide
- Présence en quelques secondes
- Mode offline
- Synchronisation différée
- QR check-in

### Notifications urgentes
- Annulation
- Terrain modifié
- Horaire changé
- Plan B météo

### Gestion matériel
- Signalement rapide
- Besoin remplacement
- Stock manquant

---

## 7. Communication Parent ↔ Staff

- Système de tickets encadré
- Pas de messagerie libre
- Demandes : absence, retard, question
- Réponses traçables
- Templates rapides

---

## 8. Fiche Enfant (Cœur système)

Chaque enfant possède :

- Identité
- Implantation
- Groupe
- Photo réelle
- Avatar animé
- Présences
- Feedback coach
- Vidéos liées
- Progression (badges, cartes)
- Quiz
- Journal de bord
- Blessures
- Documents

### Board Parent

- Calendrier
- Présences
- Commentaires
- Vidéos autorisées
- Documents
- Notifications

---

## 9. Avatar Enfant

- Photo réelle conservée
- Avatar animé selon DA AURÉAK
- Objectif : engagement & identité marque

---

## 10. Gestion des Séances

Chaque séance contient :
- Date
- Heure
- Lieu
- Implantation
- Groupe
- Coach

Fonctions coach :
- Valider présences
- État enfant (forme/blessure)
- Notes smiley
- Commentaires
- Note séance
- Retour admin

---

## 11. Vidéos

- Upload mobile
- Association séance / enfant
- Tagging rapide (tirs, 1v1, corners…)
- Segmentation manuelle v1
- Playlists automatiques
- Partage contrôlé (lien expirant)

---

## 12. Goal & Player (Gamification)

- Cartes liées aux ateliers
- Validation QR code
- Challenge mesurable
- Scores enregistrés
- Collection visible

Backlog :
- Capsules story débloquées

---

## 13. Bloc Technique

Base :
- ~32 séances
- 52 thèmes techniques

Déblocage :
- Séance validée → thèmes débloqués + badge

Évaluations :
- 1 gratuite
- Puis crédits
- Priorité : évaluation humaine coach
- IA plus tard

---

## 14. Bloc Situationnel (A11)

### Préparation séance
- Notification
- Capsule vidéo pro

### Analyse match premium
- Découpage séquences
- Tag actions
- Lien thème ↔ clip match

---

## 15. Quiz & Journal

Après séance :
- Quiz QCM jusqu’à validation
- Journal enfant audio/texte
- Feedback ressenti

Objectif : mémoire pédagogique

---

## 16. Analyse Match Data

- Base actions taguées
- Classification coach
- Liaison automatique thèmes
- Travail clips ciblés

---

## 17. Formation Coach

### Capsules techniques
- Critères
- Bons/mauvais exemples
- Correction

### Capsules situationnelles
- Placement
- Décision
- Mise en pratique

---

## 18. Suivi Coach

- Séances planifiées
- Formation continue hebdo
- Mini évaluations coach
- Progression coach

---

## 19. Grades Coach

- Début : accès limité
- Intermédiaire : accès annuel
- Avancé : création exercices

---

## 20. Retours Coach Produit

- Signalement problème contenu
- Notes adaptation
- Amélioration continue

---

## 21. Dashboard Coach

- Filtre enfants
- Consultation fiches
- Préparation séance
- Stats coach
- Rémunération estimée

---

## 22. Liaison Clubs (Option avancée)

- Partage partiel infos
- Export mensuel
- Validation admin obligatoire

---

## 23. Module Business

- Boutique
- Stages
- Codes affiliés coach
- Parrainage parent
- Dons
- Communication succès

---

## 24. Contrôle Qualité Coaching

- Preuve préparation
- Auto-évaluation coach
- Feedback parent/enfant (2 questions)
- Alertes implantation

---

## 25. Exigences techniques

- Web + mobile même base
- Offline-first
- Synchronisation fluide
- 1000+ joueurs
- RGPD complet
- Triggers automatiques

---

## 26. Roadmap

1. MVP Terrain
2. Board parent
3. Vidéo v1
4. Technique + évaluations
5. Situationnel
6. Formation coach
7. Marketing complet
8. IA progressive

---

## 27. Vision Produit vs Contenu

### Squelette produit
- Auth
- Séances
- Présences
- Vidéos
- Quiz
- Permissions
- Dashboards

### Contenu pédagogique
- Thèmes
- Cartes
- Grilles
- Capsules
- Exercices

Objectif futur : plateforme SaaS réutilisable.