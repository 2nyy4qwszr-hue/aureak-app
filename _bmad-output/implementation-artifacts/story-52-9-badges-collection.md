# Story 52-9 — Badges collection fiche joueur

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P2
**Dépend de** : story-52-6 (tabs structure)

---

## Story

En tant qu'admin, je veux voir une grille de badges sur la fiche joueur, avec les badges débloqués affichés en couleur et les badges verrouillés en gris transparent avec tooltip, afin de valoriser les accomplissements des joueurs et les engager dans leur progression.

---

## Acceptance Criteria

1. **AC1 — 10 badges statiques** : La grille affiche exactement 10 badges définis en dur dans le code (data statique — table future story 59-4) :
   1. `Première saison` (icône 🏆) — débloqué si `totalSaisons >= 1`
   2. `Vétéran 3 saisons` (icône 🌟) — débloqué si `totalSaisons >= 3`
   3. `Vétéran 5 saisons` (icône 👑) — débloqué si `totalSaisons >= 5`
   4. `Premier stage` (icône ⛺) — débloqué si `totalStages >= 1`
   5. `Stagiaire confirmé` (icône 🎯) — débloqué si `totalStages >= 3`
   6. `Académicien` (icône 🎓) — débloqué si `academyStatus` ∈ {ACADÉMICIEN, ANCIEN}
   7. `Capitaine` (icône 🦁) — débloqué si `totalSaisons >= 4 && totalStages >= 2`
   8. `Assidu` (icône ✅) — débloqué si `in_current_season = true && totalSaisons >= 2`
   9. `Élite` (icône ⚡) — débloqué si tier calculé = `Elite`
   10. `Légende` (icône 🏅) — débloqué si `totalSaisons >= 7`

2. **AC2 — Badges débloqués** : Icône emoji 48px, couleur pleine, ombre `gamification.badge.unlockedShadow` (`0 0 8px rgba(193,172,92,0.5)`), label 11px centré.

3. **AC3 — Badges verrouillés** : Icône emoji 48px, filtre `gamification.badge.lockedFilter` (`grayscale(100%)`), opacité `gamification.badge.lockedOpacity` (0.35), label en italique gris.

4. **AC4 — Tooltip au hover** : Sur Platform web, un hover sur un badge (débloqué ou verrouillé) affiche un tooltip avec le nom du badge + description courte (ex : "Vétéran 3 saisons — A participé à au moins 3 saisons à l'académie"). Implémenté via `title` HTML attribute sur le container web.

5. **AC5 — Composant BadgeGrid exporté** : `BadgeGrid` exporté depuis `@aureak/ui` avec props `{ badges: BadgeItem[]; size?: 'sm' | 'md' }` où `BadgeItem = { id: string; label: string; description: string; icon: string; unlocked: boolean }`.

6. **AC6 — Calcul badges** : La fonction `computePlayerBadges(joueur): BadgeItem[]` est dans `@aureak/business-logic/playerStats.ts`, exportée depuis `index.ts`.

7. **AC7 — Grille responsive** : La grille est `flexDirection: 'row'`, `flexWrap: 'wrap'`, gap `space.md`. 5 badges par ligne sur desktop, 4 sur tablet, 3 sur mobile. Chaque badge item fait `gamification.badge.size.lg` (64px) de largeur avec label en dessous.

---

## Tasks

- [x] **T1** — Créer `aureak/packages/ui/src/BadgeGrid.tsx` :
  - Import tokens `gamification`, `colors`, `space`, `fonts` depuis `@aureak/theme`
  - `BadgeItem` type défini localement ou importé depuis `@aureak/types`
  - Grille `View` flex-wrap
  - `BadgeCell` composant interne : icône emoji + label + style débloqué/verrouillé
  - Sur web : `title` prop sur le container pour tooltip natif HTML

- [x] **T2** — Exporter `BadgeGrid` depuis `aureak/packages/ui/src/index.ts`

- [x] **T3** — Ajouter `BadgeItem` type dans `aureak/packages/types/src/entities.ts`

- [x] **T4** — Dans `aureak/packages/business-logic/src/playerStats.ts` :
  - `BADGE_DEFINITIONS: BadgeDefinition[]` — tableau des 10 badges avec condition
  - `computePlayerBadges(joueur: JoueurListItem | ChildAcademyStatusData): BadgeItem[]`
  - Exporter depuis `index.ts`

- [x] **T5** — Dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` :
  - Importer `BadgeGrid`, `computePlayerBadges`
  - Positionner `<BadgeGrid badges={computePlayerBadges(joueur)} />` dans le tab `Académie`, sous la XPBar
  - Titre de section `SectionTitle` : "Collection de badges"

- [x] **T6** — QA : opacité et grayscale passent par `gamification.badge.lockedOpacity` et `gamification.badge.lockedFilter` — pas de valeurs hardcodées.

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/BadgeGrid.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — ajouter export BadgeGrid |
| `aureak/packages/types/src/entities.ts` | Modifier — ajouter BadgeItem type |
| `aureak/packages/business-logic/src/playerStats.ts` | Modifier — ajouter computePlayerBadges |
| `aureak/packages/business-logic/src/index.ts` | Modifier — ajouter export |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — ajouter BadgeGrid dans tab Académie |

---

## Notes techniques

- Les emojis comme icônes badges sont intentionnels pour cette story (data statique). Story 59-4 remplacera par des SVG dédiés uploadables.
- `title` HTML attribute fonctionne en React Native for Web via le composant `View` — tester que l'attribut est bien rendu dans le DOM.
- Les conditions de badge utilisent `JoueurListItem` depuis la liste, ou les champs de `ChildAcademyStatusData` + `ChildDirectoryEntry` depuis la fiche. Utiliser un type union simple basé sur les champs requis.
- `generateAcademyBadges` existe déjà dans `@aureak/business-logic` — vérifier si elle peut être réutilisée ou si `computePlayerBadges` est complémentaire (badges gamifiés vs badges académiques).
