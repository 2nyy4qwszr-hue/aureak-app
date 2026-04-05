# Story 59-3 — Gamification : Leaderboard académie top 10

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P1 — engagement communautaire

---

## Contexte & objectif

Afficher un classement des 10 meilleurs joueurs de l'académie sur la saison courante, avec podium visuel or/argent/bronze et indicateur d'évolution hebdomadaire (flèche haut/bas/stable). Cette tile s'intègre dans le dashboard admin (`(admin)/dashboard`).

---

## Dépendances

- Story 59-1 `done` — table `xp_ledger` et `player_xp_progression` disponibles
- Epic 12 `done` (phase 2) ou : la requête peut se baser sur `player_points_ledger` existant (migration 00106) si `xp_ledger` n'est pas encore disponible — la story assume 59-1 done

---

## Acceptance Criteria

1. **AC1 — Fonction API getXPLeaderboard** : `getXPLeaderboard(limit: number = 10, seasonId?: string)` dans `aureak/packages/api-client/src/gamification/xp.ts` retourne `LeaderboardEntry[]`. Type `LeaderboardEntry` : `{ rank: number, childId: string, displayName: string, avatarUrl: string | null, totalXp: number, xpThisWeek: number, levelTier: string, evolution: 'up' | 'down' | 'stable' }`. Requête : somme des `xp_delta` de `xp_ledger` groupée par `child_id`, jointure sur `profiles` pour `display_name` et `avatar_url`, triée par `total_xp DESC`, limitée à `limit`.

2. **AC2 — Tile Leaderboard dans dashboard** : La page `aureak/apps/web/app/(admin)/dashboard/page.tsx` reçoit une tile "Classement" de taille 2×2 unités (bento grid). Elle affiche les 10 entrées. Les 3 premières lignes ont un fond premium : #1 = fond `colors.accent.gold` + médaille SVG or, #2 = fond `#9BA0A7` + médaille argent, #3 = fond `#CD7F32` + médaille bronze. Lignes 4–10 = fond `colors.light.surface`.

3. **AC3 — Indicateur évolution** : L'évolution hebdomadaire est basée sur `xpThisWeek` vs `xpThisWeek` de la semaine précédente (calculé via deux plages `created_at` dans la requête). Affichage : ▲ vert `colors.status.success` si > 0, ▼ rouge `colors.accent.red` si < 0, — gris `colors.text.subtle` si stable. La flèche est un caractère Unicode ou un SVG inline minimal.

4. **AC4 — État vide et chargement** : Si aucune donnée XP (leaderboard vide), la tile affiche "Aucun joueur classé cette saison" centré avec icône trophée. Pendant le chargement, 3 lignes skeleton (`colors.light.muted`, `radius.card`, animation pulse CSS). Erreur : message discret en bas de tile.

5. **AC5 — Lien vers fiche joueur** : Chaque ligne du leaderboard est cliquable → navigation vers `/(admin)/children/[childId]`. Curseur pointer, hover `colors.light.hover`.

6. **AC6 — Tokens exclusifs** : Aucune couleur hardcodée. Les couleurs de podium (`#C1AC5C`, `#9BA0A7`, `#CD7F32`) sont référencées via `gamification.levels.gold.color`, `gamification.levels.silver.color`, `gamification.levels.bronze.color`.

7. **AC7 — Console guards** : Toute gestion d'erreur dans `getXPLeaderboard` et le composant porte `if (process.env.NODE_ENV !== 'production') console.error(...)`.

---

## Tasks

- [x] **T1** — Ajouter `getXPLeaderboard()` dans `aureak/packages/api-client/src/gamification/xp.ts`
- [x] **T2** — Ajouter type `LeaderboardEntry` dans `@aureak/types/src/entities.ts`
- [x] **T3** — Créer composant `LeaderboardTile` inline dans `dashboard/page.tsx`
- [x] **T4** — Intégrer la tile dans la grille bento du dashboard admin
- [x] **T5** — QA scan : tokens, console guards, try/finally sur fetch
- [x] **T6** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Si la story 49-5 (design dashboard bento) n'est pas done, intégrer la tile dans la structure existante sans restructurer le dashboard complet.
- `xpThisWeek` = somme XP des 7 derniers jours. `xpPrevWeek` = 7 jours d'avant. Évolution = comparaison des deux.
- La requête peut utiliser une RPC Supabase pour la performance si la logique devient complexe (2 fenêtres temporelles + JOIN).

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/api-client/src/gamification/xp.ts` | Modifier — ajout getXPLeaderboard |
| `aureak/packages/types/src/entities.ts` | Modifier — ajout LeaderboardEntry |
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier — ajout tile leaderboard |
