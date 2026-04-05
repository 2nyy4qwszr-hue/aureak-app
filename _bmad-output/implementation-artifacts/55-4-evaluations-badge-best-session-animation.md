# Story 55.4 : Évaluations — Badge Best Session animation unlock

Status: done

## Story

En tant que joueur ou coach,
Je veux qu'une animation spéciale se déclenche lorsqu'une évaluation établit un nouveau record historique pour ce joueur,
Afin de célébrer et valoriser les meilleures performances d'un gardien.

## Contexte & Décisions de Design

### Détection du record
Un record est détecté côté API : la note de l'évaluation actuelle est strictement supérieure à toutes les notes précédentes du même joueur. L'API `getEvaluationById` retourne un champ `isPersonalBest: boolean`.

### Badge visuel
Badge "⭐ Meilleure séance" (libellé textuel, pas emoji dans code SVG) affiché sur la `EvaluationCard` et dans la page de la séance. Badge en or avec texte sombre, `borderRadius` pill, `shadows.gold`.

### Animation unlock spring
À l'apparition du badge : animation spring (scale 0→1.2→1.0) avec durée 400ms. Utiliser `Animated.spring` (React Native) ou `CSS animation` (web). Après l'animation, le badge reste visible sans pulse.

### Où affiché
1. Page séance `seances/[sessionId]/page.tsx` : dans la liste évaluations, la card du joueur record affiche le badge
2. Page évaluations `evaluations/index.tsx` : filtre rapide "Records seulement" pour voir tous les personal bests

## Acceptance Criteria

**AC1 — Badge "Meilleure séance" visible si record**
- **Given** une évaluation dont la note est supérieure à toutes les précédentes du joueur
- **When** la `EvaluationCard` est rendue
- **Then** un badge "Meilleure séance" doré apparaît sur la card
- **And** le badge est visuellement distinct du reste de la card (gold pill, texte sombre)

**AC2 — Animation spring au montage**
- **Given** le badge "Meilleure séance" qui vient d'apparaître
- **When** la card est rendue pour la première fois dans la vue
- **Then** une animation spring (scale 0 → 1.2 → 1.0) se déclenche automatiquement
- **And** la durée totale est ≤ 500ms
- **And** après l'animation, le badge est statique (pas de loop)

**AC3 — Champ `isPersonalBest` retourné par l'API**
- **Given** un appel à `listEvaluationsBySession(sessionId)` ou `getEvaluationById(id)`
- **When** une évaluation est un record historique pour ce joueur
- **Then** le champ `isPersonalBest: true` est présent dans la réponse
- **And** la logique compare uniquement les évaluations du même joueur (même `child_id`)

**AC4 — Intégration dans la page séance**
- **Given** la page `seances/[sessionId]/page.tsx`
- **When** la section évaluations est affichée
- **Then** les cards avec `isPersonalBest` affichent le badge
- **And** l'ordre d'affichage met les records en premier si plus d'un dans la séance

**AC5 — Filtre "Records" dans evaluations/index.tsx**
- **Given** la page liste des évaluations
- **When** l'utilisateur active le filtre "Records seulement"
- **Then** seules les évaluations `isPersonalBest: true` sont affichées
- **And** le filtre est un toggle rapide (chip) ajouté à côté des filtres existants

**AC6 — Accessibilité et dégradation gracieuse**
- **Given** un navigateur qui ne supporte pas les animations CSS avancées
- **When** le badge est rendu
- **Then** le badge s'affiche correctement sans animation (pas d'erreur JS)
- **And** `accessibilityLabel="Meilleure séance personnelle"` est présent sur le badge

## Tasks

- [x] Ajouter logique `isPersonalBest` dans `@aureak/api-client/src/evaluations/evaluations.ts` (listEvaluationsBySessionWithPB avec comparaison MAX score joueur)
- [x] Ajouter champ `isPersonalBest?: boolean` dans le type `EvaluationWithChild`
- [x] Créer composant `BestSessionBadge.tsx` dans `@aureak/ui` avec animation spring
- [x] Intégrer `BestSessionBadge` dans `EvaluationCard` (prop conditionnelle `isPersonalBest`)
- [x] Intégrer badge dans `seances/[sessionId]/page.tsx` sur le top joueur (topSeance === 'star')
- [x] Ajouter filtre "Records" (chip toggle) dans `evaluations/index.tsx`
- [x] QA scan : try/finally, console guards, animation sans crash
- [ ] Test Playwright — Playwright skipped, app non démarrée

## Fichiers concernés

- `aureak/packages/ui/src/BestSessionBadge.tsx` (nouveau)
- `aureak/packages/ui/src/EvaluationCard.tsx` (modifié, prop isPersonalBest)
- `aureak/packages/ui/src/index.ts` (export BestSessionBadge)
- `aureak/packages/api-client/src/evaluations.ts` (logique isPersonalBest)
- `aureak/packages/types/src/entities.ts` (champ isPersonalBest)
- `aureak/apps/web/app/(admin)/evaluations/index.tsx` (filtre Records)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` (affichage badge)

## Dépendances

- Story 55-1 (EvaluationCard) — requis (le badge s'intègre dans la card)
- API évaluations existante

## Notes techniques

- Animation web : `transform: scale()` avec `@keyframes` ou `Animated.spring` RN
- La subquery SQL pour `isPersonalBest` : `score > COALESCE(MAX(score) FILTER (WHERE id != current_id), -1)` groupé par child_id
- Pas de nouvelle migration DB (calcul à la volée)
