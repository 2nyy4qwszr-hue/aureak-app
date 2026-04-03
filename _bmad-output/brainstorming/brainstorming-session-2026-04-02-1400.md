---
stepsCompleted: [setup, technique-selection, phase-1-assumption-reversal]
inputDocuments: []
session_topic: 'Refonte UX gestion des séances admin — planification en masse, dashboard, annulations'
session_goals: 'Générer des idées innovantes pour améliorer la gestion des séances de l'académie Aureak : planification saisonnière, dashboard opérationnel, gestion des annulations et tampons'
selected_approach: 'Assumption Reversal → Five Whys → SCAMPER'
techniques_used: ['assumption-reversal']
ideas_generated: 11
context_file: ''
---

# Brainstorming Session — Refonte UX Gestion des Séances Admin

**Facilitateur:** Jeremydevriendt
**Date:** 2026-04-02

---

## Contexte Métier

### Structure des 6 méthodes pédagogiques (toutes flexibles)
| Méthode | Modules | Séances/module | Total séances |
|---------|---------|----------------|---------------|
| Goal & Player | 2 | 15 | ~30 |
| Technique | 8 | variable (modules 1-3 = 2 séances, 4-8 = 3 séances) | ~22 |
| Situationnel | 15 | 2 | 30 |
| Performance | variable | variable | ~30 |
| Décisionnel | variable | variable | ~30 |
| Perfectionnement | dimanche | variable | ~30 |

**Total saison** : ~170 séances par groupe/implantation

### Règles métier clés découvertes
- **Reporter** = séance annulée, les suivantes avancent pour remplir le slot
- **Décaler** = tout le programme se décale (ex: congé scolaire)
- **Tampon** = max 3 slots par saison, activation conditionnelle (si dette > 0), invisibles aux parents jusqu'à activation
- **Plafond** : si 4 dettes mais 3 tampons → la 4e dette reste en suspens (pas automatiquement perdue)
- **Gouvernance** : seul l'admin annule. Absence coach ≠ annulation automatique → remplacement obligatoire
- **Parents** : voient les dates fixes (pas les numéros de module) — les réorganisations sont transparentes

---

## Techniques Sélectionnées

**Phase 1 :** Assumption Reversal (✅ En cours — Assumption #6 prochaine)
**Phase 2 :** Five Whys
**Phase 3 :** SCAMPER

---

## IDEAS GÉNÉRÉES

### Phase 1 — Assumption Reversal

#### Assumptions de départ
1. ~~Les séances ont des dates fixes~~ → RETOURNEMENT : modèle de saison réutilisable (template)
2. ~~Les tampons sont planifiés en avance~~ → RETOURNEMENT : slots tampon conditionnels activés à la demande
3. ~~On peut annuler autant de séances qu'on veut~~ → RETOURNEMENT : plafond de 3 tampons + dette suspendue
4. ~~Les annulations sont invisibles~~ → RETOURNEMENT : communication proactive tampon = rassurance
5. ~~Le dashboard sert à l'admin~~ → RETOURNEMENT : dashboard club séparé (données filtrées)
6. (prochaine)

#### Idées générées

**[Planification #1] — Modèle de Saison Réutilisable**
Une "template" de saison définit l'ordre des modules et méthodes. Elle s'applique à un groupe/implantation et génère automatiquement les séances. Chaque nouvelle saison = dupliquer le template + ajuster les dates de début. Gain : 0 re-saisie, cohérence pédagogique garantie.

**[Planification #2] — Slot Tampon Conditionnel**
Les 3 slots tampons n'existent pas dans le calendrier tant qu'il n'y a pas de dette. À l'annulation qui crée une dette, le système propose d'activer le tampon suivant disponible. L'admin confirme. Le slot apparaît alors côté parent comme "séance de rattrapage".

**[Planification #3] — Règle des 3 Tampons — Plafond de dette**
Maximum 3 dettes récupérables par saison. Si une 4e annulation survient : la séance est marquée "dette suspendue" (perdue de facto mais comptabilisée). Fin de saison = rapport de dettes non récupérées → input pour la saison suivante.

**[Communication #4] — Tampon = Rassurance Proactive**
Quand un tampon s'active, les parents reçoivent un message : "La séance du [DATE ANNULÉE] sera rattrapée le [DATE TAMPON]. Aucune action de votre part." Pas d'inquiétude, pas de question. Le tampon est un signal de qualité de service.

**[Gouvernance #5] — Annulation = Domaine Exclusif Admin**
L'interface coach ne contient PAS de bouton "Annuler séance". Si un coach est absent, il signale son absence → l'admin reçoit une alerte "Coach absent — action requise" → l'admin choisit : trouver un remplaçant, reporter, ou activer tampon.

**[Gouvernance #6] — Remplacement Coach = Processus Autonome**
Quand l'admin cherche un remplaçant, il voit la liste des coachs disponibles ce jour-là (pas de conflit dans leur agenda). Il peut assigner en 1 clic. Le coach remplaçant reçoit une notif push avec les détails de la séance.

**[Dashboard #7] — Vue Implantation → Groupe → Historique Séances**
Le dashboard admin agrège : par implantation, par groupe, l'historique des séances passées. Pour chaque séance : statut (tenu/annulé/tampon), coachs présents, nb d'enfants présents, méthode utilisée. Tri chronologique inversé.

**[Dashboard #8] — Fiche Séance = Carte d'Identité Opérationnelle**
Chaque séance passée est une "fiche" : date, durée, groupe, méthode, module, coachs présents/absents, liste présences enfants, notes coach, indicateurs de qualité (% présence, évaluation rapide). Clickable depuis le dashboard.

**[Dashboard #9] — Radar d'Assiduité Enfant — Absences Consécutives**
Le dashboard détecte automatiquement les enfants avec N absences consécutives (seuil configurable : 2, 3...) et les remonte en alerte visuelle. Drill-down : voir les dates exactes des absences. Action rapide : contacter le parent depuis la fiche.

**[Dashboard #10] — Blessure Liée à l'Absence**
Si un enfant est marqué "blessé" dans la fiche injury, ses absences ne comptent pas dans le radar d'assiduité. Le dashboard distingue "absent" vs "absent blessé". Les blessures actives remontent dans une section dédiée avec date estimée de retour.

**[Dashboard #11] — Club Dashboard Séparé — Données Filtrées**
Un dashboard distinct pour les clubs (pas le dashboard admin principal). Le club voit UNIQUEMENT ses propres enfants (ceux liés au club dans `club_directory_child_links`). Données visibles : nb d'enfants actifs, taux de présence global, absences récentes. Les enfants sans club ou d'un autre club = invisibles totalement. Confidentialité garantie par RLS.

**[Coach UX #12] — Autonomie Situationnel : Pool de Séances avec Cooldown**
Pour la méthode Situationnel uniquement, le coach choisit librement l'entraînement à faire parmi un pool disponible. Mais l'entraînement choisi est "gelé" pour ce groupe pendant 30-40 séances après usage. Le pool affiche clairement ce qui est disponible vs ce qui est en cooldown (avec date de retour disponibilité). Objectif : variété pédagogique garantie, jamais de répétition récente.

**[Coach UX #13] — Méthodes avec Autonomie vs Cycle Imposé**
Matrice d'autonomie par méthode :
- Goal & Player : cycle imposé (ordre séquencé)
- Technique : cycle imposé (8 modules séquencés)
- Situationnel : pool libre avec cooldown
- Performance, Décisionnel, Perfectionnement : à définir (probablement mixte)
L'interface coach affiche le "mode" de la méthode du jour : "📋 Séance imposée" vs "🎯 Choix libre".

**[Coach UX #14] — Niveau Coach : Apprenti vs Expérimenté**
Un coach marqué "apprenti" suit TOUJOURS le cycle imposé, même pour Situationnel. Après une période de montée en compétence (configurable), il passe "expérimenté" et débloque le choix libre. L'admin gère le niveau dans la fiche coach. Transition visible et explicite — pas automatique.

**[Coach Mobile #15] — App Séance du Jour : Tout en Un**
Le coach ouvre l'app, voit directement "Ma séance de ce soir" avec :
- Groupe + implantation + heure
- L'entraînement à réaliser (ou le choix à faire si Situationnel)
- Liste des enfants du groupe avec statut (présent / absent / blessé)
- Case à cocher au fur et à mesure des arrivées (pas de batch à la fin)
Tout ça sans navigation — 1 clic depuis la home.

**[Coach Mobile #16] — Fiche Enfant Contextuelle en Séance**
Pendant la séance, en tapant sur un enfant : fiche résumée. Points acquis (✅), points en cours (⚠️), erreurs récurrentes signalées (🔴). Ces données sont issues des évaluations des séances précédentes. Le coach voit en 10 secondes "ah oui, lui il travaille encore le bas de corps". Continuité garantie même si le coach ne l'a pas vu depuis 3 semaines.

**[Coach Mobile #17] — Continuité Multi-Coach sans Perte de Contexte**
Plusieurs coachs dans une implantation, rotation possible. La fiche enfant est partagée entre tous les coachs autorisés. Les notes/signaux sont attribués au coach qui les a saisis (avec date). Le coach qui prend en main une séance voit le contexte de ses collègues — comme un dossier patient partagé dans un cabinet médical.

**[Parent UX #18] — Parent Signale le Contexte d'une Absence**
Le parent peut, depuis l'app, ajouter un contexte sur une absence à venir ou passée : "match de foot ce soir", "compétition nationale le 15/03", "voyage scolaire". Ce contexte apparaît dans la fiche de présence côté coach (icône 📌 + tooltip). L'absence est toujours comptée, mais le coach comprend pourquoi — et le radar d'assiduité peut distinguer "absent sans raison" vs "absent avec motif légitime".

**[Admin UX #19] — Vue Cartes : 3 Niveaux de Densité**
La vue principale des séances = grille de cartes. Chaque carte = une séance. 3 modes de densité :
- **Compact** : date, groupe, statut (✅/❌/⏳) — vue planning rapide
- **Standard** : + méthode, nb présents/absents, coach
- **Détaillé** : + module, notes, indicateurs qualité
Switcher entre modes sans rechargement. La densité préférée est mémorisée par utilisateur.

**[Admin UX #20] — Filtres Combinables sur la Vue Séances**
Filtre en cascade : Implantation → Groupe → Méthode → Statut (tenu/annulé/tampon) → Période. Chaque filtre réduit les résultats suivants. La combinaison de filtres est sauvegardable comme "vue favorite" (ex: "Templiers — Situationnel — Ce mois-ci"). Gain : zéro navigation répétitive pour les vues récurrentes.

---

## Synthèse en cours...

**[Intelligence #21] — Escalade Coach Débrief : Push → Push → Admin**
Si le coach n'a pas rempli le débrief d'une séance :
- T+24h : Push automatique au coach ("Débrief manquant — 2 minutes suffisent")
- T+48h : Deuxième push
- T+72h sans réponse : Alerte admin ("Coach [X] — 3 relances ignorées — séance du [DATE]")
Le débrief est obligatoire, non optionnel. L'escalade admin = signal managérial, pas juste technique.

**[Intelligence #22] — Seuils d'Absence Enfant : Automatique puis Personnel**
- 1-2 absences consécutives : notification automatique au parent (push/email)
- 3 absences consécutives : alerte dans le dashboard admin + action manuelle suggérée "Prendre contact personnellement"
L'admin décide de l'action : appel, message WhatsApp, etc. Le système ne contacte pas directement — il délègue à l'humain pour le contact personnel. La distinction automatique vs personnel est volontaire.

**[Intelligence #23] — Blessure = Absence Qualifiée**
Si l'enfant est marqué "blessé" (via fiche injury), ses absences sont qualifiées "absent blessé" — elles ne déclenchent PAS les alertes d'assiduité automatiques. Le compteur repart à zéro à la reprise. Dashboard montre séparément : absences non qualifiées (préoccupantes) vs absences blessure (informatives).

**[Intelligence #24] — Métriques de Qualité Coach**
Pour chaque coach : taux de remplissage débrief, taux de présence (séances animées vs prévues), délai moyen de remplissage présences. Ces métriques sont visibles par l'admin dans la fiche coach — pas un ranking public, juste un outil de suivi managérial. Seuils configurables pour déclencher un suivi.

**[Coach UX #25] — Débrief en 60 Secondes : Friction Zéro**
USP de l'académie = zéro préparation coach. Le débrief doit préserver cette philosophie : aussi rapide que possible. Structure minimale obligatoire :
1. Confirmation séance réalisée (1 tap)
2. Présences déjà marquées pendant la séance → pré-remplies
3. 2-3 signaux rapides optionnels par enfant (emoji ou chip : ✅ bon / ⚠️ à revoir / 🔴 problème)
4. Note libre optionnelle (texte court ou vocal)
Pas de formulaire long. Pas de champs obligatoires au-delà de la confirmation. Le système extrait les métriques depuis les présences, pas depuis le débrief.

**[Coach UX #26] — Contenu Séance Disponible en 1 Tap à 30min Avant**
Le coach ouvre l'app 30 min avant. La séance du jour est mise en avant. Il voit l'entraînement complet : objectifs pédagogiques, description, variantes, matériel nécessaire, durée. Tout est là, pas besoin de chercher. Le coach qui fait ça pour la 5e fois survole. Le coach débutant a tous les détails. Un seul écran, deux publics.

**[Pédagogie #27] — Signal Technique : Erreur Observée + Critère de Réussite**
Le coach, pendant ou après la séance, crée un signal technique sur un enfant spécifique :
- **Erreur observée** : "Prise de balle — index non rentrés vers l'intérieur"
- **Critère de réussite** : "Index rentrés vers l'intérieur lors de la réception"
Ce signal est lié à la séance (date, méthode, contexte) et s'ajoute au profil technique de l'enfant. Il est distinct d'une simple note — c'est une observation pédagogique structurée et actionnable.

**[Pédagogie #28] — Push Parent : "Le Coach a Noté un Point de Vigilance"**
Quand le coach crée un signal technique sur un enfant, les parents de cet enfant reçoivent une notification push (si activée) :
> "🎯 Coach [Prénom] a noté un point de vigilance pour Pierre : *Index à rentrer lors de la réception ballon*. Critère de réussite : index pointés vers l'intérieur."
Le parent voit le message, comprend ce que le coach travaille, peut renforcer à la maison. La trace reste dans l'app — historique consultable. Pas de notation chiffrée — un signal qualitatif concret.

**[Pédagogie #29] — Profil Technique Longitudinal par Enfant**
Tous les signaux techniques cumulés par enfant forment un profil évolutif :
- Signaux actifs (en cours de travail)
- Signaux résolus (marqués "acquis" par un coach lors d'une séance ultérieure)
- Signaux archivés (anciens, plus pertinents)
L'admin et les coachs voient ce profil complet. Le parent voit une version allégée (ses propres signaux + résolus). Ce profil est l'actif pédagogique le plus précieux de l'académie — il survit aux changements de coach.

**[Pédagogie #30] — Badge Critère de Réussite : Signal Positif Macro**
Plutôt que de détailler chaque aspect positif (usine à gaz), le signal positif se déclenche sur un **critère macro acquis** : "Pierre a validé le badge Prise de Balle". Un badge = un critère de réussite globalement maîtrisé, pas une micro-observation. Quand le coach le décerne, le parent reçoit la notif. Peu fréquent = fort impact. La granularité fine reste interne (notes coach) — seul le badge est partagé avec le parent.
*Note : concept à affiner — connexion possible avec Epic 12 (Quêtes/Badges) déjà dans le backlog.*

*[À DÉFINIR PLUS TARD] — Signaux positifs détaillés vs macro-badges : l'utilisateur n'a pas encore de position claire. Ne pas architecturer avant d'avoir plus de matière.*

---

## ✅ Phase 1 Terminée — 30 Idées Assumption Reversal

## Phase 2 — Five Whys

### Five Whys #1 — Le débrief obligatoire

**Insight :** Le débrief n'est pas un formulaire — c'est la **preuve d'exécution du programme**. La valeur réelle = le delta entre "prévu" et "réalisé". Le système doit calculer ce delta automatiquement (séance planifiée vs module réellement effectué), pas demander au coach de l'expliquer par écrit.

→ **Implication design :** Afficher "prévu vs réalisé" comme métrique centrale, pas comme champ texte libre.

### Five Whys #2 — La règle des 3 tampons

**Insight :** Le tampon n'est pas une contrainte technique — c'est un **instrument de confiance** avec les parents. La dette suspendue doit être visible et expliquée en fin de saison (rapport transparent). Le bilan de saison doit mentionner explicitement les séances non rattrapées — pas pour se justifier, mais pour maintenir la confiance.

→ **Implication design :** Rapport de fin de saison par groupe = séances prévues / réalisées / rattrapées / dettes suspendes. Généré automatiquement.

---

## ✅ Phase 2 Terminée — Five Whys

## Phase 3 — SCAMPER (idées retenues)

**[SCAMPER-M #31] — Rapport de Fin de Saison PDF Automatique**
En fin de saison, le système génère automatiquement un PDF par groupe :
- Séances prévues / réalisées / rattrapées (tampons) / dettes suspendues
- Progression par méthode (modules complétés)
- Signaux techniques résolus sur la saison
- Taux de présence moyen du groupe
- Comparaison N vs N-1 si données disponibles
Envoyé automatiquement aux parents concernés. Téléchargeable depuis l'admin. Zéro saisie manuelle.

**[SCAMPER-P #32] — Attestation Fiscale Participation Sport (Belgique)**
Les présences enregistrées dans le système permettent de générer une attestation officielle de participation par enfant, par saison. En Belgique, les activités sportives pour enfants peuvent ouvrir des droits fiscaux (déduction frais de garde/sport). PDF généré en 1 clic depuis la fiche enfant ou en masse depuis l'admin. Valeur ajoutée immédiate pour les parents.

**[SCAMPER-E #33] — Annulation = 1 Action → Tout Automatique**
Quand l'admin annule une séance, une seule action déclenche la chaîne complète :
1. Statut séance → "annulé"
2. Push automatique aux parents ("La séance du [DATE] est annulée")
3. Calcul de la dette (+1)
4. Si tampon disponible et dette > 0 → proposition d'activation
5. Si tampon activé → push parents ("Séance de rattrapage le [DATE]")
6. Calendrier mis à jour
Zéro emails manuels. Zéro oubli. L'admin confirme l'annulation, le reste est automatique.

---

## ✅ Phase 3 SCAMPER Terminée

**SESSION COMPLÈTE — 33 idées générées**
