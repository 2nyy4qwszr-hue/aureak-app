# Story 55.5 : Évaluations — Comparaison biais coach-à-coach

Status: done

## Story

En tant qu'administrateur,
Je veux voir si deux coachs notent différemment les mêmes joueurs (delta moyen par coach),
Afin de détecter des biais de notation systématiques et assurer une évaluation équitable et cohérente.

## Contexte & Décisions de Design

### Logique de détection de biais
Pour chaque paire (joueur, séance) où plusieurs coachs ont évalué le même joueur :
- Calculer le delta = note_coach_A - note_coach_B
- Agréger le delta moyen par coach sur toutes les occurrences communes
- Un delta moyen > 1.0 point = biais significatif (couleur orange), > 2.0 = rouge

### Tableau comparatif
Affiché sur la page `evaluations/` via un onglet "Analyse coachs" ou section dédiée. Colonnes :
- Coach (nom)
- Nb évaluations
- Note moyenne globale
- Delta moyen vs. référence (médiane groupe)
- Indicateur visuel (vert = neutre, orange = biais modéré, rouge = biais fort)

### Portée
Sélecteur de période (30j / 90j / toute la saison) pour filtrer les évaluations incluses dans l'analyse.

## Acceptance Criteria

**AC1 — Tableau biais par coach**
- **Given** des évaluations de plusieurs coachs sur des joueurs communs
- **When** l'admin accède à la section "Analyse coachs" dans les évaluations
- **Then** un tableau affiche chaque coach avec sa note moyenne et son delta vs. médiane groupe
- **And** le delta est coloré vert (< 0.5), orange (0.5–1.5), rouge (> 1.5)

**AC2 — Calcul delta correct**
- **Given** coach A avec moyenne 7.5 et médiane groupe 6.8
- **When** le tableau est calculé
- **Then** le delta affiché pour coach A est "+0.7" (avec signe)
- **And** un delta négatif indique que le coach note en-dessous de la médiane

**AC3 — Sélecteur période**
- **Given** la section analyse coachs
- **When** l'utilisateur change la période (30j / 90j / saison)
- **Then** le tableau se recalcule avec uniquement les évaluations dans la période
- **And** le chargement est indiqué par un skeleton/spinner

**AC4 — Seuil minimum évaluations**
- **Given** un coach avec moins de 5 évaluations dans la période
- **When** le tableau est affiché
- **Then** ce coach est affiché avec une note "Données insuffisantes" (< 5 éval.)
- **And** aucun delta n'est calculé pour lui (éviter les faux positifs)

**AC5 — Accès admin uniquement**
- **Given** un utilisateur avec rôle coach ou parent
- **When** il tente d'accéder à la section analyse coachs
- **Then** la section est masquée ou la route retourne une erreur d'autorisation
- **And** seul le rôle `admin` peut voir cette analyse

**AC6 — Export CSV du tableau**
- **Given** le tableau biais coachs affiché
- **When** l'admin clique sur "Exporter CSV"
- **Then** un fichier CSV est téléchargé avec les colonnes : coach, nb_eval, note_moyenne, delta_vs_mediane
- **And** le nom du fichier inclut la période sélectionnée et la date

## Tasks

- [x] Créer fonction API `getCoachEvaluationBias(period: '30d'|'90d'|'season')` dans `@aureak/api-client/src/evaluations.ts`
- [x] Requête SQL : regrouper par coach_id, calculer AVG(score) et delta vs. PERCENTILE_CONT(0.5)
- [x] Créer section "Analyse coachs" dans `evaluations/index.tsx` (onglet ou section accordéon)
- [x] Tableau avec colonnes : coach, nb_eval, note_moy, delta, indicateur couleur
- [x] Sélecteur période (30j/90j/saison) avec rechargement
- [x] Coloration delta (vert/orange/rouge) via seuils constants
- [x] Bouton export CSV (utiliser `window.URL.createObjectURL` + Blob)
- [x] Guard rôle admin (masquer section si rôle !== 'admin')
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : accéder section, vérifier tableau visible (app non démarrée)

## Fichiers concernés

- `aureak/packages/api-client/src/evaluations.ts` (nouvelle fn getCoachEvaluationBias)
- `aureak/apps/web/app/(admin)/evaluations/index.tsx` (nouvelle section/onglet)
- `aureak/packages/types/src/entities.ts` (type CoachBiasReport)

## Dépendances

- Évaluations existantes avec champ `coach_id` dans la table DB
- Rôles/auth via `useAuth` hook existant

## Notes techniques

- PERCENTILE_CONT dans PostgreSQL : `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score)` groupé par (child_id, session_id)
- Minimum 5 évaluations filtrées via `HAVING COUNT(*) >= 5`
- Pas de migration DB requise (calcul à la volée)
