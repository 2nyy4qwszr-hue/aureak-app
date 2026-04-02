# Story 33.1 : Dashboard Admin Présences

Status: done

## Story

En tant qu'admin de l'académie,
Je veux un dashboard présences complet avec vue cartes cliquables par séance, correction inline des présences et gestion des enfants essai,
Afin de pouvoir intervenir directement sur les données sans dépendre des coachs et d'avoir une vision claire de l'assiduité par groupe et implantation.

## Contexte Métier

- La page présences actuelle est en lecture seule — aucune modification possible
- L'admin doit pouvoir corriger ce que les coachs oublient ou se trompent
- Les enfants "essai" viennent gratuitement découvrir l'académie — fréquent — doivent être tracés séparément des académiciens
- Les corrections admin sont traçables (audit trail) — pas de modification silencieuse
- Un coach peut être présent partiellement (arrivé en retard, parti avant la fin)

## Acceptance Criteria

**AC1 — Vue Présences Multi-Granularité**
- **When** l'admin accède au dashboard présences
- **Then** il peut commuter entre 3 vues temporelles : Jour / Semaine / Mois
- **And** les filtres Implantation et Groupe sont disponibles en cascade
- **And** la vue Jour affiche toutes les séances du jour avec leur statut de présence
- **And** la vue Semaine / Mois affiche un agrégat (taux de présence par groupe)

**AC2 — Carte Séance Unifiée Cliquable**
- **When** l'admin voit la liste des séances
- **Then** chaque séance est une carte affichant : statut séance (tenu/annulé/tampon), nb présents/absents, statut débrief (rempli/manquant), méthode, groupe
- **And** un clic ouvre la fiche détaillée de la séance

**AC3 — Fiche Séance : Correction Présence Inline**
- **When** l'admin ouvre une fiche séance
- **Then** il voit la liste de tous les enfants du groupe avec leur statut (présent/absent/retard/non confirmé)
- **And** il peut modifier le statut de n'importe quel enfant
- **And** chaque modification enregistre : auteur (admin), horodatage, valeur précédente → audit trail
- **And** un indicateur visuel distingue "marqué par coach" vs "corrigé par admin"

**AC4 — Gestion Présence Coach Granulaire**
- **When** l'admin consulte la fiche séance
- **Then** il voit les coachs assignés avec leur statut : présent tout / présent partiel / absent
- **And** pour "présent partiel" : saisie de l'heure d'arrivée ou de départ
- **And** si 2 coachs : gestion indépendante pour chacun

**AC5 — Ajout Enfant Essai par l'Admin**
- **When** l'admin veut ajouter un enfant hors-groupe à une séance
- **Then** il peut rechercher dans `child_directory` ou saisir prénom/nom si inconnu
- **And** l'enfant est ajouté avec le type `essai` (badge 🔵 distinct de ⚪ Académicien)
- **And** les stats de la séance affichent : "8 présents — 7 académiciens + 1 essai"
- **And** l'enfant essai n'est pas ajouté au roster permanent du groupe

**AC6 — Conversion Essai → Membre**
- **When** un enfant essai a participé à 3 séances ou plus
- **Then** une suggestion apparaît dans le dashboard : "Pierre — 3 essais — Ajouter au groupe ?"
- **And** l'admin peut convertir en 1 clic (choisit le groupe cible)
- **And** l'historique des essais est conservé dans son profil

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase
  - [ ] 1.1 Colonne `attendance_type ENUM('member','trial') DEFAULT 'member'` sur `session_attendance`
  - [ ] 1.2 Table `attendance_corrections` : session_id, child_id, corrected_by, old_status, new_status, corrected_at
  - [ ] 1.3 Colonne `coach_presence_type ENUM('full','partial','absent')` + `partial_start` + `partial_end` sur table coach/session join
  - [ ] 1.4 Vue `v_session_presence_summary` : agrège présences par séance avec counts member/trial

- [ ] Task 2 — Types TypeScript `@aureak/types`
  - [ ] 2.1 `AttendanceType`, `CoachPresenceType`, `AttendanceCorrection`, `SessionPresenceSummary`

- [ ] Task 3 — API `@aureak/api-client`
  - [ ] 3.1 `listSessionsWithPresence(filters)` — cartes séances avec stats agrégées
  - [ ] 3.2 `getSessionAttendanceDetail(sessionId)` — liste enfants + statuts + coachs
  - [ ] 3.3 `correctAttendance(sessionId, childId, status, adminId)` — correction + audit trail
  - [ ] 3.4 `updateCoachPresence(sessionId, coachId, type, partialStart?, partialEnd?)`
  - [ ] 3.5 `addTrialAttendance(sessionId, childDirectoryId | trialData)` — ajout essai
  - [ ] 3.6 `convertTrialToMember(childId, groupId)` — conversion essai → membre
  - [ ] 3.7 `listTrialConversionSuggestions()` — enfants essai ≥ 3 séances

- [ ] Task 4 — UI Admin `apps/web/app/(admin)/presences/`
  - [ ] 4.1 Page dashboard présences : toggle Jour/Semaine/Mois + filtres cascade
  - [ ] 4.2 Composant `SessionPresenceCard` : statut, counts, débrief, méthode
  - [ ] 4.3 Drawer fiche séance : liste enfants avec statuts éditables inline
  - [ ] 4.4 Section coachs : présence partielle avec horaires
  - [ ] 4.5 Modal ajout enfant essai : search child_directory + création rapide
  - [ ] 4.6 Bandeau suggestions conversion essai → membre

## Dev Notes

### Audit trail
- Toute correction admin génère une ligne dans `attendance_corrections`
- L'indicateur visuel "corrigé par admin" est non-intrusif (icône discrète + tooltip)
- L'admin ne peut pas supprimer l'audit trail

### Essai vs Membre
- `attendance_type = 'trial'` ne modifie pas `group_members`
- Les stats de présence distinguent les deux types dans les compteurs
- La conversion essai→membre crée une entrée dans `group_members` avec date d'entrée = aujourd'hui

### Dépendances
- Requiert `sessions`, `session_attendance`, `groups`, `group_members`, `child_directory` existants
- Story 32.1 pour les statuts séance (annulé/tampon)
