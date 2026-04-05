# Story 52-7 — XP bar animée fiche joueur

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P2
**Dépend de** : story-52-6 (header + tabs refacto)

---

## Story

En tant qu'admin, je veux voir une barre de progression XP animée sur la fiche d'un joueur, indiquant son niveau et son avancement vers le niveau suivant, afin de visualiser sa progression globale dans l'académie de façon gamifiée.

---

## Acceptance Criteria

1. **AC1 — XP calculé** : Le score XP est calculé depuis les données disponibles sans table dédiée :
   - Base : `totalSaisons * 200`
   - Bonus présence : `totalStages * 50`
   - Bonus saison courante : `in_current_season ? 100 : 0`
   - Bonus ancienneté : `totalSaisons >= 5 ? 300 : 0`
   - Ce calcul est dans `computePlayerXP(joueur: JoueurListItem | ChildDirectoryEntry): number` dans `@aureak/business-logic/playerStats.ts`

2. **AC2 — Affichage niveau** : Le niveau résolu (bronze/argent/or/platine/diamant/légende) via `resolveLevel(xp)` est affiché comme label `"Niveau : Or"` avec la couleur du niveau (`gamification.levels[tier].color`).

3. **AC3 — Barre animée** : La barre XP est une `View` de hauteur `gamification.xp.barHeight` (8px), border-radius `gamification.xp.barRadius` (4px), fond track `gamification.xp.trackColor`. La fill width est animée de 0% à `fillPercent%` en `gamification.animations.xpFill` (0.6s ease) via `Animated.Value` au montage.

4. **AC4 — Fill percent** : `fillPercent = ((xp - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100`, clampé 0–100.

5. **AC5 — Jalons visuels** : 4 jalons à 25%, 50%, 75%, 100% représentés par de petits traits verticaux (1px × 12px, couleur `colors.border.light`) sur la track. Celui correspondant au prochain jalon dépassé est gold.

6. **AC6 — Composant exporté** : `XPBar` exporté depuis `@aureak/ui` avec props `{ xp: number; maxXp: number; level: string; levelColor: string; animated?: boolean }`.

7. **AC7 — Tokens exclusifs** : Toutes les valeurs (couleurs, hauteur, radius, animation duration) viennent de `gamification.*` tokens — aucune valeur hardcodée.

---

## Tasks

- [x] **T1** — `XPBar.tsx` créé dans `packages/ui/src/`
- [x] **T2** — Exporté depuis `packages/ui/src/index.ts`
- [x] **T3** — `computePlayerXP` ajouté dans `playerStats.ts` + export `index.ts`
- [x] **T4** — `XPBar` intégré dans tab Académie de `page.tsx`
- [x] **T5** — `resolveLevel` importé depuis `@aureak/theme` ✅

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/XPBar.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — ajouter export XPBar |
| `aureak/packages/business-logic/src/playerStats.ts` | Modifier — ajouter computePlayerXP |
| `aureak/packages/business-logic/src/index.ts` | Modifier — ajouter export computePlayerXP |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — ajouter XPBar dans tab Académie |

---

## Notes techniques

- `resolveLevel` est déjà défini et exporté dans `aureak/packages/theme/src/tokens.ts` — importer depuis `@aureak/theme`.
- `Animated.Value` de React Native fonctionne en web via React Native for Web.
- L'argument `joueur` de `computePlayerXP` peut accepter `JoueurListItem` ou `ChildDirectoryEntry` — utiliser un type union ou une interface commune limitée aux champs `totalSaisons`, `totalStages`, `in_current_season`.
- Story 59-1 (future) remplacera ce calcul proxy par une vraie table `player_xp_events`.
