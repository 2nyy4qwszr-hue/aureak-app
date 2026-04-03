---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: 'Présences & Évaluations — dashboard, modification, workflow coach/admin'
session_goals: 'Générer des idées pour améliorer le module présences et évaluations : consultation, modification, combinaison présence+évaluation par groupe et par enfant (Epic 33)'
selected_approach: 'ai-recommended'
techniques_used: ['role-playing', 'question-storming', 'dream-fusion-laboratory']
ideas_generated: []
context_file: ''
---

# Brainstorming Session — Présences & Évaluations (Epic 33)

**Facilitateur:** Jeremydevriendt
**Date:** 2026-04-02

## Session Overview

**Topic:** Présences & Évaluations — dashboard, modification, workflow coach/admin
**Goals:** Améliorer le module présences et évaluations : consultation, modification, combinaison présence+évaluation par groupe et par enfant

---

## IDEAS GÉNÉRÉES

### Phase 1 — Role Playing (Admin / Coach / Parent)

**[Admin UX #1] — Vue Présences Multi-Granularité**
*Concept :* Vue présences avec 3 niveaux temporels commutables : Jour / Semaine / Mois, filtrée par implantation et groupe. En un coup d'œil : qui était là, qui manquait.
*Novelty :* La granularité temporelle est choisie par l'admin selon son besoin du moment.

**[Admin UX #2] — Carte Unifiée Séance/Présence/Évaluation**
*Concept :* Une seule carte par séance agrège les 3 dimensions — statut séance (tenu/annulé), présences (X/Y enfants), évaluation (débrief rempli/manquant). Tout en un clic.
*Novelty :* Plus de navigation entre 3 sections séparées — une carte = une réalité complète de la séance.

**[Admin UX #3] — Correction Présence Admin en Override**
*Concept :* Sur la fiche séance, l'admin peut modifier n'importe quelle présence enfant avec horodatage de la correction et auteur ("modifié par Admin le [DATE]"). Audit trail discret.
*Novelty :* Distinction claire entre "marqué par le coach" vs "corrigé par l'admin".

**[Admin UX #4] — Présence Coach Granulaire : Partiel**
*Concept :* Un coach peut être marqué "présent partiel" — arrivé en retard ou parti avant la fin. Admin coche : présent tout / présent partiel (heure début/fin) / absent. Si 2 coachs : gestion indépendante.
*Novelty :* La réalité terrain (coach parti à mi-séance) est modélisée, pas juste présent/absent binaire.

**[Admin UX #5] — Enfant Essai : Présence Ponctuelle Typée**
*Concept :* L'admin peut ajouter un enfant "hors groupe" avec le type "essai". Badge distinct (🔵 Essai vs ⚪ Académicien). Stats : "8 présents — 7 académiciens + 1 essai".
*Novelty :* La distinction essai/académicien est visible dans les stats sans polluer le roster permanent.

**[Admin UX #6] — Conversion Essai → Membre**
*Concept :* Si un enfant essai revient plusieurs fois → proposition admin : "Pierre a participé à 3 séances en essai — l'ajouter officiellement au groupe ?" Action 1 clic.
*Novelty :* Le flux commercial (essai → conversion) est natif dans l'outil.

**[Coach UX #7] — Double Check-In : Début + Fin de Séance**
*Concept :* Le coach fait 2 passages : à l'arrivée (marque présents) et à la fin (confirme + marque retards). Retard = 2 options : < 15 min ou > 15 min. Ultra-rapide.
*Novelty :* Le retard est une donnée pédagogique réelle, pas juste une note.

**[Coach UX #8] — Ajout Enfant Essai par Coach → Validation Admin**
*Concept :* Le coach peut ajouter un enfant essai (prénom/nom/âge) → log "essai en attente" → admin valide ou rejette.
*Novelty :* Le coach initie sans finaliser — séparation des responsabilités propre.

**[Workflow #9] — Présence + Évaluation = Un Seul Flux Unifié**
*Concept :* Après le double check-in, la même interface enchaîne vers l'évaluation. Pas deux pages séparées — une progression linéaire : marquer présents → évaluer.
*Novelty :* Supprime la rupture cognitive "maintenant je vais dans Évaluations".

**[Évaluation #10] — 3 Dimensions d'Évaluation par Enfant**
*Concept :* Pour chaque enfant, 3 axes : 🏟️ Terrain / 📚 Connaissances / 🤝 Savoir-faire. Notation rapide (chips), pas de texte obligatoire.
*Novelty :* Les 3 dimensions alimentent des profils différents (stats / quiz / badges techniques).

**[Parent UX #11] — Motif d'Absence Structuré**
*Concept :* Si absent, le parent renseigne le motif : Blessure / Match-Terrain / École / Voyage scolaire / Vacances / Autre. Visible par le coach (icône 📌) et intégré dans les stats.
*Novelty :* Les absences justifiées ne dégradent pas le score d'assiduité.

**[Badges #12] — Badge Présence Automatique**
*Concept :* Tout enfant marqué présent reçoit automatiquement le badge de présence. Pas d'action coach.
*Novelty :* La présence elle-même est valorisée.

**[Badges #13] — Badges Comportementaux Coach (Tap Unique) — CORRIGÉ**
*Concept :* Badges comportementaux attribuables en 1 tap par badge : 🎯 Réceptivité / 💪 Goût à l'effort / 🧠 Attitude (attitude du gardien, pas "latitude") / 👑 Prestance + badges thématiques à venir (capacité du thème, etc.). Nombre extensible, pas limité à 4. Entièrement optionnel.
*Novelty :* Architecture ouverte — nouveaux badges ajoutables sans refonte de l'interface.

**[Parent UX #14] — Récap Post-Séance Parent**
*Concept :* Push après séance : "Pierre était présent ✅ — Il a reçu : 🎯 Réceptivité + 💪 Effort". Si absent avec motif : "Absent (Match). Prochaine séance le [DATE]."
*Novelty :* Parent informé en 10 secondes sans ouvrir l'app.

### Phase 2 — Question Storming

**[Règles #15] — Fenêtres de Modification Basées sur 22h**
*Concept :* Toutes les présences et évaluations de la journée sont modifiables jusqu'à 22h (pas de fenêtre relative à la séance — un coach peut animer de 17h à 21h). Minimum : 1 des 2 coachs doit valider avant 22h. À minuit : gel automatique + alerte admin.
*Novelty :* Respecte la réalité d'un coach multi-séances le soir.

**[Workflow #16] — État Draft Persisté Localement**
*Concept :* Si le coach ferme l'app sans valider, état sauvegardé en draft. À la réouverture dans les 2h : "Débrief en cours pour [GROUPE]". Après 22h : draft expiré → alerte débrief manquant.
*Novelty :* Zéro perte de données si interruption terrain.

**[Multi-groupe #17] — Enfant Multi-Groupe : Présences Indépendantes**
*Concept :* Un enfant dans 2 groupes a 2 présences distinctes par semaine. Profil enfant agrège toutes ses présences cross-groupes. Badges s'accumulent de tous les groupes.
*Novelty :* La vue parent montre toutes les séances de l'enfant, quel que soit le groupe.

**[Badges #18] — Badges Comportementaux → Carburant des Quêtes Epic 12**
*Concept :* Les badges comportementaux alimentent les quêtes Epic 12. Ex : "Reçois le badge Effort 5 fois → débloque la Quête Guerrier". Badge présence = +1 streak automatique.
*Novelty :* 4 taps coach génèrent de la progression gamifiée pour l'enfant.

**[Workflow #19] — Minuit = Gel + Alerte Admin**
*Concept :* À minuit, séances non validées gelées. L'admin reçoit récap matinal : "3 séances du [DATE] sans débrief — Coachs : Martin, Dupont." Contrainte douce — l'admin arbitre.
*Novelty :* Gel sans blocage système — visibilité plutôt que punition.

### Phase 3 — Dream Fusion Laboratory

**[UX Présence #20] — Tap Simple + Long Press — CORRIGÉ**
*Concept :* Défaut = gris (non confirmé). 1 tap = vert (présent) — cas le plus fréquent, friction zéro. Long press = orange (retard). 2 taps rapides = rouge (absent). À la fin : enfants encore gris = alerte "non confirmé".
*Novelty :* Le cas dominant (présent) est le plus rapide. Les cas rares (retard, absent) demandent un geste délibéré — évite les erreurs accidentelles.

**[UX Badges #21] — Swipe Style pour les Badges — CORRIGÉ**
*Concept :* Flow badges après présences : enfants présents défilent un par un. Swipe gauche = passer (aucun badge). Sur la carte : chips de badges à cocher (Réceptivité, Effort, Attitude, Prestance + badges thématiques extensibles). Swipe droit = valider et suivant. Fin : "Envoyer tout".
*Correction :* "Latitude" → "Attitude" (attitude du gardien). Badges extensibles — pas limité à 4.
*Novelty :* Rythme fluide — 12 enfants traités en 2 minutes.

**[UX Photo #22] — Photo Souvenir de Groupe**
*Concept :* Coach prend photo de groupe en 1 tap → attachée à la fiche séance → visible par les parents le soir. V2 (future) : détection de visages → pré-remplissage présences automatique.
*Novelty :* Crée un rituel d'équipe + outil de présence intelligent à terme.

**[Carte Enfant #23] — Dos de Carte : Statut Évaluations**
*Concept :* Flip de la carte enfant → dos : prénom en grand, stats présence, statut évaluations (✅ Connaissance faite / ⚠️ Savoir-faire en cours / 🔴 Connaissance pas faite). Coach peut noter "pas fait — raison ?" depuis la carte.
*Novelty :* Coach acteur du suivi pédagogique complet, pas juste de la présence terrain.

---

## ✅ Session Terminée — 23 Idées
