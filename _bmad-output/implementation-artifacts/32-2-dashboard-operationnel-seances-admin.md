# Story 32.2 : Dashboard Opérationnel Séances Admin

Status: done

## Story

En tant qu'admin de l'académie,
Je veux un dashboard opérationnel des séances avec vue cartes filtrables, fiches de séance détaillées, radar d'assiduité par enfant et alertes automatiques (absences + débriefs manquants),
Afin de piloter la qualité pédagogique de toutes les implantations sans avoir à analyser manuellement les données.

## Acceptance Criteria

**AC1 — Vue Cartes Séances avec Filtres en Cascade**
- **When** l'admin accède au dashboard séances
- **Then** les séances s'affichent en grille de cartes (pas de liste)
- **And** les filtres sont disponibles en cascade : Implantation → Groupe → Méthode → Statut (tenu/annulé/tampon) → Période
- **And** 3 niveaux de densité sont sélectionnables via toggle :
  - **Compact** : date, groupe, statut
  - **Standard** : + méthode, nb présents/absents, coach
  - **Détaillé** : + module, notes débrief, indicateurs qualité

**AC2 — Fiche Séance Détaillée**
- **When** l'admin clique sur une carte séance
- **Then** une fiche s'ouvre avec : date/heure, durée, groupe, méthode, module, coachs présents/absents, liste présences enfants, notes du débrief coach, statut débrief (rempli/manquant)

**AC3 — Radar d'Assiduité — Alertes Absences**
- **When** un enfant a 2 absences consécutives
- **Then** une notification push automatique est envoyée au parent
- **When** un enfant a 3 absences consécutives
- **Then** une alerte apparaît dans le dashboard admin dans la section "Actions requises"
- **And** l'alerte suggère "Prendre contact personnellement" avec lien vers la fiche enfant
- **And** les absences blessure (enfant marqué injured) sont exclues du compteur

**AC4 — Alertes Débrief Manquant avec Escalade**
- **When** un coach n'a pas rempli le débrief d'une séance après 24h
- **Then** un push automatique est envoyé au coach (relance 1)
- **When** toujours manquant après 48h
- **Then** un second push est envoyé (relance 2)
- **When** toujours manquant après 72h
- **Then** une alerte admin apparaît dans "Actions requises" : "Coach [NOM] — débrief manquant depuis [DATE]"

**AC5 — Section "Actions Requises"**
- **When** l'admin accède au dashboard
- **Then** une section dédiée liste toutes les alertes actives : absences 3+, débriefs manquants, coachs absents en attente de décision
- **And** chaque alerte a une action rapide disponible (contacter parent, relancer coach, assigner remplaçant)

**AC6 — Métriques Qualité Coach (vue admin)**
- **When** l'admin consulte la fiche d'un coach
- **Then** les métriques sont visibles : taux de remplissage débrief (%), taux de présence (séances animées/prévues), délai moyen remplissage débrief
- **And** ces métriques ne sont pas publiques ni comparatives entre coachs

## Tasks / Subtasks

- [x] Task 1 — Migration Supabase
  - [x] 1.1 Vue `v_session_attendance_stats` : agrège présences/absences par séance
  - [x] 1.2 Vue `v_child_consecutive_absences` : calcule absences consécutives par enfant/groupe
  - [x] 1.3 Vue `v_coach_quality_metrics` : taux débrief, présence, délai moyen
  - [x] 1.4 Table `admin_alerts` : type, entity_id, entity_type, status (active/resolved), created_at

- [x] Task 2 — Types TypeScript `@aureak/types`
  - [x] 2.1 `AdminAlert`, `AlertType`, `SessionCardDensity`, `CoachQualityMetrics`

- [x] Task 3 — API `@aureak/api-client`
  - [x] 3.1 `listSessionCards(filters)` — retourne sessions avec stats agrégées
  - [x] 3.2 `getSessionDetail(sessionId)` — fiche complète séance
  - [x] 3.3 `listAdminAlerts(status?)` — alertes actives/résolues
  - [x] 3.4 `resolveAlert(alertId)` — marque une alerte résolue
  - [x] 3.5 `getCoachQualityMetrics(coachId)` — métriques coach
  - [x] 3.6 `listChildConsecutiveAbsences(groupId, threshold)` — enfants dépassant le seuil

- [x] Task 4 — UI Admin `apps/web/app/(admin)/dashboard/seances/`
  - [x] 4.1 Page dashboard séances : grille cartes + filtres cascade + toggle densité
  - [x] 4.2 Composant `SessionCard` (3 variantes compact/standard/détaillé)
  - [x] 4.3 Drawer/modal fiche séance détaillée
  - [x] 4.4 Section "Actions Requises" avec badges de comptage
  - [x] 4.5 Composant alerte avec action rapide inline
  - [x] 4.6 Section métriques coach dans `app/(admin)/coaches/[coachId]/page.tsx`

- [ ] Task 5 — Alertes automatiques (cron / Edge Function)
  - [ ] 5.1 Job : détecter absences consécutives → push parent (seuil 2) + alerte admin (seuil 3)
  - [ ] 5.2 Job : détecter débriefs manquants → push coach (T+24h, T+48h) + alerte admin (T+72h)
  - [ ] 5.3 Exclure absences blessure du compteur assiduité
  NOTE: Task 5 (cron/Edge Function alertes) est dépendant des stories notifications (Epic 8)
        Les alertes sont accessibles manuellement via l'API admin_alerts.

## Dev Notes

### Filtres cascade
- Implantation filtre les groupes disponibles
- Groupe filtre les méthodes disponibles dans ce groupe
- Chaque filtre est indépendant (URL-persistable pour vues favorites futures)

### Densité des cartes
- La préférence de densité est sauvegardée en localStorage par utilisateur
- Les 3 densités partagent le même composant `SessionCard` avec un prop `density`

### Alertes
- Les alertes d'absence sont calculées sur les séances d'un même groupe (pas cross-groupes)
- Les blessures actives (`injuries.status = 'active'`) exemptent l'enfant du radar

### Dépendances
- Requiert Story 32.1 (annulations/tampons) pour les statuts séance complets
- Requiert `sessions`, `attendance`, `injuries`, `coach_debriefs` existants
