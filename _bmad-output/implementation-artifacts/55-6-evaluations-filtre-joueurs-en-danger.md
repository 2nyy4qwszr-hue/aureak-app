# Story 55.6 : Évaluations — Filtre joueurs en danger

Status: done

## Story

En tant que coach ou administrateur,
Je veux identifier rapidement les joueurs qui ont eu une note inférieure à 5 sur leurs 3 dernières séances consécutives,
Afin d'intervenir proactivement auprès des gardiens en difficulté avant que la situation ne s'aggrave.

## Contexte & Décisions de Design

### Critère "en danger"
Un joueur est "en danger" si et seulement si ses 3 dernières évaluations (triées par date DESC) ont toutes une note < 5.0. Le seuil est paramétrable en constante (`DANGER_THRESHOLD = 5.0`, `DANGER_STREAK = 3`).

### Affichage alerte
- Dans `evaluations/index.tsx` : section "Alertes" en haut de page, fond rouge pâle (`colors.accent.red` opacité 0.1), avec la liste des joueurs en danger
- Dans `children/index.tsx` : filtre rapide "En danger" (chip rouge) dans la barre de filtres
- Card joueur en danger : bordure rouge gauche 3px, badge "Alerte" rouge pill

### Données
API `listDangerousPlayers(tenantId)` retournant les joueurs avec 3+ évaluations consécutives < seuil.

## Acceptance Criteria

**AC1 — Section alertes dans evaluations/index.tsx**
- **Given** des joueurs avec 3 dernières évaluations < 5.0
- **When** la page `evaluations/` est chargée
- **Then** une section "Alertes joueurs" apparaît en haut avec fond rouge pâle
- **And** chaque joueur en danger est listé avec son nom, sa dernière note et le nombre de séances consécutives sous le seuil

**AC2 — Badge "Alerte" rouge sur la card joueur**
- **Given** un joueur en danger dans la liste évaluations
- **When** sa card ou sa ligne est affichée
- **Then** un badge rouge "Alerte" est visible sur sa card
- **And** une bordure gauche rouge 3px accentue l'urgence visuellement

**AC3 — Filtre "En danger" dans children/index.tsx**
- **Given** la page liste des joueurs
- **When** l'utilisateur clique sur le chip de filtre "En danger"
- **Then** seuls les joueurs avec statut de danger sont affichés
- **And** le chip passe à l'état actif (fond rouge) pour indiquer le filtre actif

**AC4 — Calcul correct 3 séances consécutives**
- **Given** un joueur avec les notes [4.2, 4.8, 4.5] sur ses 3 dernières séances
- **When** l'API est appelée
- **Then** ce joueur apparaît dans la liste "en danger"
- **And** un joueur avec [4.2, 6.1, 4.5] (moyenne < 5 mais pas consécutif) n'apparaît PAS

**AC5 — Section masquée si aucun joueur en danger**
- **Given** aucun joueur avec 3 évaluations consécutives < 5
- **When** la page évaluations est chargée
- **Then** la section "Alertes" est masquée (pas d'espace vide inutile)
- **And** un message "Aucune alerte active" s'affiche si l'utilisateur a explicitement activé le filtre

**AC6 — Lien vers fiche joueur**
- **Given** la section alertes avec un joueur listé
- **When** l'admin clique sur le nom du joueur
- **Then** il est redirigé vers `children/[childId]` la fiche joueur
- **And** la section évaluations de la fiche est scrollée automatiquement au focus

## Tasks

- [x] Créer `listDangerousPlayers(tenantId)` dans `@aureak/api-client/src/evaluations.ts` (window SQL des 3 dernières éval. par joueur)
- [x] Ajouter type `DangerousPlayer = { childId, displayName, lastScore, streakCount }` dans `@aureak/types`
- [x] Ajouter section alertes dans `evaluations/index.tsx` (fond rouge pâle, liste joueurs)
- [x] Badge "Alerte" rouge sur EvaluationCard si joueur en danger (prop `isDangerous`)
- [x] Ajouter chip filtre "En danger" dans `children/index.tsx` barre filtres
- [x] Lien cliquable vers fiche joueur depuis la section alertes
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : vérifier section alertes visible avec données de test (app non démarrée)

## Fichiers concernés

- `aureak/packages/api-client/src/evaluations.ts` (nouvelle fn listDangerousPlayers)
- `aureak/packages/types/src/entities.ts` (type DangerousPlayer)
- `aureak/apps/web/app/(admin)/evaluations/index.tsx` (section alertes)
- `aureak/packages/ui/src/EvaluationCard.tsx` (prop isDangerous)
- `aureak/apps/web/app/(admin)/children/index.tsx` (filtre "En danger")

## Dépendances

- Story 55-1 (EvaluationCard) — requis pour la prop isDangerous
- API évaluations existante avec tri chronologique

## Notes techniques

- SQL window function : `ROW_NUMBER() OVER (PARTITION BY child_id ORDER BY created_at DESC)` pour isoler les 3 dernières
- CTE avec HAVING : garder seulement les child_id dont les 3 dernières ont toutes score < 5
- Constantes : `DANGER_THRESHOLD = 5.0` et `DANGER_STREAK = 3` définis dans le fichier API
