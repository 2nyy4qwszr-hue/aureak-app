# Story 32.1 : Gestion des Annulations & Tampons de Séances

Status: done

## Story

En tant qu'admin de l'académie,
Je veux pouvoir annuler une séance en déclenchant automatiquement la chaîne complète (notification parents + calcul dette + activation tampon optionnelle),
Afin de gérer les imprévus sans friction administrative tout en maintenant la confiance des parents sur le respect du programme.

## Contexte Métier

- **Reporter** = séance annulée, les séances suivantes avancent pour remplir le slot (le programme reprend dans l'ordre)
- **Décaler** = tout le programme se décale d'un slot (ex: congé scolaire connu d'avance — pas de dette créée)
- **Tampon** = slot de rattrapage conditionnel, max 3 par saison, invisible aux parents jusqu'à activation
- **Plafond** : si dette > 3 tampons → la dette supplémentaire est "suspendue" (non perdue, visible en bilan)
- **Gouvernance** : seul l'admin peut annuler — absence coach ≠ annulation automatique

## Acceptance Criteria

**AC1 — Annulation avec Reporter**
- **When** l'admin annule une séance avec le mode "Reporter"
- **Then** la séance passe au statut `cancelled`
- **And** une dette est créée (+1 sur le compteur dette du groupe/saison)
- **And** si un slot tampon est disponible (dette ≤ 3 et tampon non épuisé) → proposition d'activation immédiate
- **And** une notification push est envoyée aux parents du groupe ("Séance du [DATE] annulée")

**AC2 — Annulation avec Décaler**
- **When** l'admin annule avec le mode "Décaler" (ex : congé scolaire)
- **Then** toutes les séances futures du groupe sont décalées d'un slot
- **And** aucune dette n'est créée
- **And** notification push aux parents ("Programme décalé d'une semaine — prochaine séance le [DATE]")

**AC3 — Activation Tampon**
- **When** l'admin active un slot tampon
- **Then** une séance de rattrapage est créée à la date du tampon
- **And** la dette est décrémentée (-1)
- **And** le tampon passe au statut `activated`
- **And** notification push aux parents ("Séance de rattrapage le [DATE] — aucune action requise")
- **And** les parents voient la séance de rattrapage dans leur calendrier

**AC4 — Plafond 3 Tampons**
- **When** la dette dépasse le nombre de tampons disponibles (max 3)
- **Then** la dette supplémentaire est marquée `suspended` (visible admin uniquement)
- **And** aucun tampon supplémentaire n'est proposé
- **And** le compteur dette affiche : "3/3 tampons utilisés — 1 dette suspendue"

**AC5 — Alerte Absence Coach**
- **When** un coach signale son absence via l'app
- **Then** l'admin reçoit une alerte "Coach [NOM] absent — séance [DATE] [GROUPE] — action requise"
- **And** l'admin choisit : assigner un remplaçant, reporter, ou décaler
- **And** aucune annulation n'est créée automatiquement

**AC6 — Rapport de Fin de Saison**
- **When** l'admin génère le rapport de fin de saison
- **Then** un PDF est produit par groupe : séances prévues / réalisées / rattrapées / dettes suspendues
- **And** le document est téléchargeable et envoyable aux parents

## Tasks / Subtasks

- [ ] Task 1 — Migration Supabase (numéro à définir selon dernière migration)
  - [ ] 1.1 Colonne `cancellation_type ENUM('reporter','decaler') NULLABLE` sur `sessions`
  - [ ] 1.2 Table `session_buffers` : id, group_id, season_id, date, status (available/activated/expired)
  - [ ] 1.3 Table `season_debt` : group_id, season_id, debt_count, suspended_count
  - [ ] 1.4 RLS : admin CRUD, coach lecture seule ses groupes

- [ ] Task 2 — Types TypeScript `@aureak/types`
  - [ ] 2.1 `CancellationType`, `BufferStatus`, `SessionDebt` dans `entities.ts`

- [ ] Task 3 — API `@aureak/api-client`
  - [ ] 3.1 `cancelSession(sessionId, type: CancellationType)` — annule + calcule dette
  - [ ] 3.2 `activateBuffer(bufferId)` — active tampon + push parents
  - [ ] 3.3 `shiftSessionsForward(groupId, fromDate)` — décalage programme
  - [ ] 3.4 `getGroupDebt(groupId, seasonId)` — retourne dette + tampons restants
  - [ ] 3.5 `reportCoachAbsence(sessionId, coachId)` — crée alerte admin

- [ ] Task 4 — UI Admin `apps/web/app/(admin)/seances/`
  - [ ] 4.1 Modal annulation : choix Reporter / Décaler + confirmation
  - [ ] 4.2 Indicateur dette/tampons par groupe (badge visible sur la carte séance)
  - [ ] 4.3 Page gestion tampons : liste tampons par groupe/saison, activation manuelle
  - [ ] 4.4 Alerte inbox coach absent → actions rapides (remplaçant / reporter / décaler)
  - [ ] 4.5 Génération rapport fin de saison (PDF ou page imprimable)

- [ ] Task 5 — Notifications
  - [ ] 5.1 Push "séance annulée" → parents du groupe
  - [ ] 5.2 Push "rattrapage activé" → parents du groupe
  - [ ] 5.3 Push "programme décalé" → parents du groupe
  - [ ] 5.4 Alerte admin "coach absent" (in-app)

## Dev Notes

### Règles métier critiques
- Le mode "Décaler" ne crée jamais de dette — c'est une réorganisation préventive
- Le tampon n'est jamais visible côté parent tant que `status = 'available'`
- La chaîne annulation → notification est atomique (try/finally obligatoire)
- Maximum 3 tampons par saison par groupe — configurable en settings admin à terme

### Dépendances
- Requiert que `sessions`, `groups`, `seasons` existent (Stories 4.1, 9.4 — done)
- Notifications via Edge Function `send-notification` existante

### FRs couverts
- FR liés à la gestion des présences/séances (Epic 4)
- Nouveau : logique tampon = FR nouveau issu brainstorming 2026-04-02
