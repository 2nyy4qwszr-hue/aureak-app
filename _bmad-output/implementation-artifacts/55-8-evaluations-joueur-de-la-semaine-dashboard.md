# Story 55.8 : Évaluations — Joueur de la semaine tile dashboard

Status: done

## Story

En tant qu'administrateur,
Je veux voir une tile "Joueur de la semaine" sur le dashboard avec le joueur ayant obtenu la meilleure note lors d'une séance dans les 7 derniers jours,
Afin de mettre en valeur les meilleures performances et créer un sentiment de compétition positive.

## Contexte & Décisions de Design

### Sélection du joueur de la semaine
L'API `getPlayerOfWeek(tenantId)` retourne :
- Le joueur avec la note la plus haute dans une séance des 7 derniers jours
- En cas d'égalité : le plus jeune joueur
- Si aucune évaluation cette semaine : retourner `null`

### Tile dashboard
Position : dans la grille bento du dashboard, section "Highlights" ou après les KPI cards.
Contenu de la tile :
- Titre "Joueur de la semaine"
- Photo joueur (grand format, format portrait)
- Nom en gras
- Note obtenue (grande, style EvaluationCard gold)
- Nom de la séance + date
- Animation confetti au chargement (si nouveau joueur depuis la dernière visite)

### Animation confetti
Confetti simple : 20 particules colorées (gold, blanc, vert) qui tombent depuis le haut de la tile sur 1.5s à l'apparition. Utiliser `Animated` RN ou CSS keyframes. Pas de librairie externe.

### Persistance "vu"
Stocker dans `localStorage` l'ID du dernier joueur de la semaine vu. Si le joueur change, déclencher les confetti. Sinon, pas d'animation au rechargement.

## Acceptance Criteria

**AC1 — Tile joueur de la semaine visible sur le dashboard**
- **Given** des évaluations dans les 7 derniers jours
- **When** le dashboard est chargé
- **Then** une tile "Joueur de la semaine" affiche le joueur avec la meilleure note
- **And** la tile montre : photo (ou initiales), nom, note, nom séance, date

**AC2 — Sélection correcte du meilleur joueur**
- **Given** plusieurs évaluations dans la semaine
- **When** `getPlayerOfWeek` est appelé
- **Then** le joueur avec la note la plus haute est retourné
- **And** en cas d'égalité, le plus jeune (birth_date la plus récente) est sélectionné

**AC3 — Animation confetti au nouveau joueur**
- **Given** un joueur de la semaine différent du dernier vu (localStorage)
- **When** le dashboard est chargé
- **Then** une animation confetti de 1.5s se déclenche sur la tile
- **And** l'ID du joueur est sauvegardé dans localStorage après l'animation
- **And** au rechargement, si même joueur, aucun confetti

**AC4 — Tile absente si aucune évaluation cette semaine**
- **Given** aucune évaluation dans les 7 derniers jours
- **When** le dashboard est chargé
- **Then** la tile n'est pas affichée (pas d'espace vide)
- **And** aucune erreur console

**AC5 — Note affichée en style gold premium**
- **Given** la tile joueur de la semaine
- **When** elle est rendue
- **Then** la note s'affiche en grand (fontSize ≥ 48) avec couleur `colors.accent.gold`
- **And** un badge "Meilleure note semaine" doré est visible sous la note

**AC6 — Navigation vers fiche joueur**
- **Given** la tile joueur de la semaine
- **When** l'admin clique sur la tile
- **Then** il est redirigé vers `children/[childId]/page.tsx`

## Tasks

- [x] Créer `getPlayerOfWeek(tenantId)` dans `@aureak/api-client/src/dashboard.ts`
- [x] Requête SQL : MAX(score) sur séances des 7 derniers jours + JOIN child_directory
- [x] Ajouter type `PlayerOfWeek = { childId, displayName, photoUrl?, score, sessionName, sessionDate }` dans `@aureak/types`
- [x] Créer composant `PlayerOfWeekTile.tsx` dans `@aureak/ui`
- [x] Animation confetti (Animated RN) dans le composant
- [x] Logique localStorage "déjà vu" pour conditionner l'animation
- [x] Intégrer `PlayerOfWeekTile` dans `dashboard/page.tsx`
- [x] Masquage si `getPlayerOfWeek` retourne null
- [x] Navigation clic → fiche joueur
- [x] QA scan : try/finally, console guards, localStorage accessible uniquement côté client
- [ ] Test Playwright : screenshot tile sur le dashboard (app non démarrée)

## Fichiers concernés

- `aureak/packages/api-client/src/dashboard.ts` (nouvelle fn getPlayerOfWeek)
- `aureak/packages/types/src/entities.ts` (type PlayerOfWeek)
- `aureak/packages/ui/src/PlayerOfWeekTile.tsx` (nouveau)
- `aureak/packages/ui/src/index.ts` (export)
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` (intégration tile)

## Dépendances

- API dashboard existante dans `@aureak/api-client/src/dashboard.ts`
- Story 55-1 (EvaluationCard styles) recommandée pour cohérence visuelle

## Notes techniques

- `localStorage` : accès dans `useEffect` uniquement (éviter SSR errors)
- Confetti CSS : `@keyframes fall` avec `translateX` aléatoire + `translateY` de -20px à +100%
- 20 particules : `Array.from({length: 20}, (_, i) => ...)` avec délais aléatoires
- La requête SQL utilise `NOW() - INTERVAL '7 days'` comme borne basse
