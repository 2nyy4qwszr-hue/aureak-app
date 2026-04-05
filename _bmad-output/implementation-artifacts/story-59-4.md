# Story 59-4 — Gamification : 20 badges système définition + UI débloqués/verrouillés

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P1 — richesse système récompenses

---

## Contexte & objectif

L'Epic 12 (migration 00106) a créé la table `badge_definitions` avec 5 badges MVP seedés. Cette story définit les 20 badges officiels du système Aureak via une migration SQL de seed, améliore le composant `BadgeGrid` pour afficher l'état débloqué/verrouillé avec design premium, et intègre la grille dans la fiche joueur admin.

---

## Dépendances

- Story 12-1 `done` — table `badge_definitions` et `player_badges` existantes (migration 00106)
- Story 59-1 `done` — `XpEventType` disponible pour référencer les sources de badges

---

## Acceptance Criteria

1. **AC1 — Migration seed 20 badges** : La migration `00119_badges_definitions.sql` insère (via `INSERT ... ON CONFLICT DO NOTHING`) les 20 badges dans `badge_definitions` pour le tenant par défaut ou via un marqueur `is_system = true`. Les 20 badges couvrent :
   - **Assiduité** : `ASSIDU_5` (5 présences), `ASSIDU_20` (20 présences), `CENTENAIRE` (100 présences)
   - **Progression** : `PREMIER_PAS` (1er thème acquis), `PROGRESSIF` (5 thèmes), `EXPERT` (15 thèmes)
   - **Performance** : `STAR_SEANCE` (note ≥ 9), `PERFECTIONNISTE` (3 notes ≥ 8 consécutives), `MVP_SEMAINE`
   - **Stages** : `STAGIAIRE` (1er stage), `VETERAN_STAGE` (5 stages)
   - **Social** : `CAPITAINE` (badge coach award), `FAIR_PLAY` (badge coach award)
   - **Série** : `SERIE_5` (streak 5 séances), `SERIE_10` (streak 10), `INVINCIBLE` (streak 20)
   - **Spéciaux** : `AMBASSADEUR` (badge manuel admin), `PIONNIER` (1er de l'académie à débloquer), `LEGENDAIRE` (tous niveaux atteints), `SAISON_OR` (top 3 leaderboard fin saison)
   Chaque badge a : `code`, `label`, `description`, `points` (5–200), `icon_url` (chemin relatif `/badges/[code].svg`).

2. **AC2 — Composant BadgeGrid amélioré** : `aureak/packages/ui/src/BadgeGrid.tsx` accepte props `{ badges: BadgeDefinition[], unlockedIds: Set<string>, size?: 'sm' | 'md' | 'lg' }`. Les badges débloqués ont `gamification.badge.unlockedShadow` + opacity 1. Les badges verrouillés ont `gamification.badge.lockedOpacity` (0.35) + `gamification.badge.lockedFilter` (grayscale 100%). Taille icône via `gamification.badge.size[size]`.

3. **AC3 — Tooltip badge** : Au survol (hover) d'un badge, un tooltip affiche `label` + `description` + points XP + statut ("Débloqué le JJ/MM/AAAA" ou "Verrouillé — Condition : ..."). Le tooltip utilise les tokens `colors.light.surface`, `shadows.md`, `radius.card`.

4. **AC4 — Intégration fiche joueur admin** : La page `children/[childId]/page.tsx` reçoit une section "Badges & Achievements" après les informations de base. Elle charge `listBadgeDefinitions()` + `listPlayerBadges(childId)` et passe au `BadgeGrid`. Les badges débloqués sont en premier (tri), verrouillés en second.

5. **AC5 — API badges** : `aureak/packages/api-client/src/gamification/badges.ts` exporte `listBadgeDefinitions(tenantId?)` et `listPlayerBadges(childId)`. Types `BadgeDefinition` et `PlayerBadge` ajoutés ou vérifiés dans `@aureak/types/src/entities.ts`.

6. **AC6 — Compteur résumé** : Au-dessus de la grille, un compteur "X / 20 badges débloqués" en `typography.h3`, couleur `colors.accent.gold` si X ≥ 10, sinon `colors.text.dark`.

7. **AC7 — Règles de code** : Aucune couleur hardcodée. Tous les opacités et filtres viennent de `gamification.badge.*`. Console guards sur les fetch d'erreur.

---

## Tasks

- [x] **T1** — Écrire `supabase/migrations/00130_badges_definitions.sql` : INSERT des 20 badges avec `ON CONFLICT DO NOTHING`
- [x] **T2** — Section badges enrichie inline dans `children/[childId]/page.tsx` (BadgeGrid existant + nouvelle section système)
- [x] **T3** — Créer `aureak/packages/api-client/src/gamification/badges.ts` : `listBadgeDefinitions`, `listPlayerBadges`
- [x] **T4** — Types `BadgeDefinition`, `PlayerBadge` déjà existants dans `@aureak/types/src/entities.ts` — vérifiés
- [x] **T5** — Intégrer section "Badges & Achievements" dans `children/[childId]/page.tsx`
- [x] **T6** — QA scan : tokens, console guards, try/finally
- [x] **T7** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Les `icon_url` pointent vers `/badges/[CODE].svg` dans le Storage public Supabase ou assets statiques — les fichiers SVG eux-mêmes ne sont PAS créés dans cette story (hors scope). Le composant affiche un fallback emoji ou initial du code si l'URL ne charge pas.
- La migration 00119 utilise `INSERT ... ON CONFLICT (tenant_id, code) DO NOTHING` — les badges existants (5 MVP d'Epic 12) ne sont pas écrasés.
- `BadgeGrid.tsx` existe peut-être déjà dans `@aureak/ui` — lire avant de modifier.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00119_badges_definitions.sql` | Créer |
| `aureak/packages/ui/src/BadgeGrid.tsx` | Créer ou modifier |
| `aureak/packages/api-client/src/gamification/badges.ts` | Créer ou modifier |
| `aureak/packages/types/src/entities.ts` | Modifier — BadgeDefinition, PlayerBadge |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — section badges |
