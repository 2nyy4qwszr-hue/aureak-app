# Story 59-6 — Gamification : Score académie global KPI

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P1 — visibilité direction académie

---

## Contexte & objectif

Créer un KPI composite "Niveau Académie" qui condense en un seul score (0–100) trois dimensions : taux de présence, progression des joueurs (XP), et activité opérationnelle (séances validées). Ce score est affiché en hero tile sur le dashboard admin avec niveau textuel, jauge animée, et tendance hebdomadaire.

---

## Dépendances

- Story 59-1 `done` — `xp_ledger` et `getXpProgression()` disponibles
- Epic 4 séances `done` — table `sessions` et `attendances` disponibles
- Story 49-5 (dashboard bento redesign) — si done, intégrer dans la grille ; sinon, ajouter tile en haut du dashboard existant

---

## Acceptance Criteria

1. **AC1 — Fonction API getAcademyScore()** : `getAcademyScore(seasonId?: string)` dans `aureak/packages/api-client/src/gamification/academy-score.ts` retourne `AcademyScoreResult` : `{ score: number (0–100), level: 'Débutante' | 'En développement' | 'Confirmée' | 'Excellence' | 'Élite', components: { presenceRate: number, progressionScore: number, activityScore: number }, trend: number (delta vs semaine précédente), computedAt: string }`. Chaque composante est calculée sur la saison courante.

2. **AC2 — Calcul du score** : La formule est documentée en commentaire dans le fichier API :
   - `presenceRate` = (présences validées / total présences attendues) × 100, pondération 40%
   - `progressionScore` = (joueurs ayant gagné ≥1 XP ce mois / total joueurs actifs) × 100, pondération 35%
   - `activityScore` = (séances validées ce mois / séances planifiées ce mois) × 100, pondération 25%
   - `score = presenceRate * 0.4 + progressionScore * 0.35 + activityScore * 0.25`, arrondi entier
   - Seuils niveau : 0–39 = "Débutante", 40–59 = "En développement", 60–74 = "Confirmée", 75–89 = "Excellence", 90–100 = "Élite"

3. **AC3 — Tile hero dashboard** : La tile "Niveau Académie" occupe la position haute du dashboard. Elle affiche : le score en grand (`typography.display`, taille 48px), le label de niveau en `typography.h2`, la jauge circulaire ou linéaire (couleur = `gamification.levels[resolvedLevel].color`), les 3 composantes en mini-stats en dessous. La tendance affiche `+X pts` vert ou `-X pts` rouge depuis la semaine précédente.

4. **AC4 — Jauge animée** : La jauge (barre ou arc) s'anime à l'entrée avec `gamification.xp.xpFill` (0.6s ease). La couleur de remplissage reflète le niveau : bronze pour < 40, argent pour 40–59, or pour 60–74, platine pour 75–89, diamant/légende pour ≥ 90. Couleurs depuis `gamification.levels.*`.

5. **AC5 — Mini-stats composantes** : Trois pills sous la jauge : "📅 Présence X%" | "📈 Progression X%" | "✓ Activité X%". Background `colors.light.muted`, bordure `colors.border.light`, texte `typography.caption`.

6. **AC6 — Loading & erreur** : Skeleton de la tile en chargement (rectangle `colors.light.muted` animé pulse). En cas d'erreur API, afficher "Score indisponible" avec bouton Réessayer discret.

7. **AC7 — Règles code** : Console guards sur erreur fetch. try/finally sur setLoading. Aucune couleur hardcodée — tout via tokens.

---

## Tasks

- [x] **T1** — Créer `aureak/packages/api-client/src/gamification/academy-score.ts` avec `getAcademyScore()`
- [x] **T2** — Ajouter type `AcademyScoreResult` dans `@aureak/types/src/entities.ts`
- [x] **T3** — Intégrer tile hero dans `aureak/apps/web/app/(admin)/dashboard/page.tsx`
- [x] **T4** — Implémenter jauge animée inline (CSS keyframes) avec couleurs depuis `gamification.levels`
- [x] **T5** — QA scan : formule documentée, tokens, console guards
- [x] **T6** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Si les tables nécessaires (attendances, sessions) n't ont pas de données en dev, le score retourne 0 gracieusement.
- La requête `getAcademyScore` peut être gourmande — utiliser une RPC SQL si les JOINs deviennent complexes.
- Le `seasonId` par défaut = saison courante (logique héritée de la vue `v_child_academy_status`, migration 00068).

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/gamification/academy-score.ts` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — AcademyScoreResult |
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier — tile hero score |
