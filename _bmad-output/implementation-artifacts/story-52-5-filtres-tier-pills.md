# Story 52-5 — Filtres visuels par tier avec pills colorées

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P1
**Dépend de** : story-52-2 (PlayerTier défini), story-52-4 (vue galerie)

---

## Story

En tant qu'admin, je veux filtrer les joueurs par tier (Prospect/Académicien/Confirmé/Elite) via des pills colorées avec compteurs, afin d'explorer rapidement les segments de joueurs sans toucher aux filtres de statut existants.

---

## Acceptance Criteria

1. **AC1 — Row de pills** : Une ligne de pills horizontale scrollable s'affiche en tête de la zone de contenu (sous la barre de recherche existante) avec 5 pills : `Tous`, `Prospect`, `Académicien`, `Confirmé`, `Elite`.

2. **AC2 — Couleur par tier** :
   - `Tous` : fond `colors.light.muted`, texte `colors.text.dark`
   - `Prospect` : fond `#E8E8E8`, texte `#555`
   - `Académicien` : fond `colors.light.surface`, texte `colors.text.dark`, bordure `colors.border.light`
   - `Confirmé` : fond `#FFF8E8`, texte `#8A6800`, bordure `rgba(193,172,92,0.4)`
   - `Elite` : fond `#2A2006`, texte `#FFE566`, bordure `#C1AC5C`

3. **AC3 — Compteur par pill** : Chaque pill affiche le count du tier entre parenthèses : `Académicien (42)`. Le count est calculé depuis les données filtrées courantes (après application des filtres statut/saison existants).

4. **AC4 — Multi-sélection** : Les pills sont multi-sélectionnables (ex : `Prospect` + `Elite` simultanément). Cliquer sur une pill sélectionnée la déselectionne. Si aucune pill sélectionnée (ou `Tous`), tous les tiers sont affichés.

5. **AC5 — Indépendance des filtres** : Le filtre tier est indépendant et cumulatif avec les filtres existants (statut académie, saison, stage, année naissance, actif). Les deux filtres s'appliquent simultanément.

6. **AC6 — Persistance** : Les pills tier sélectionnées sont sauvegardées dans `localStorage` sous la clé `aureak_players_tier_filter` (tableau JSON).

7. **AC7 — Visibilité conditionnelle** : Les pills tier sont visibles dans les deux modes (galerie et liste). En mode liste, le filtre tier filtre le `academyStatus` converti en tier via `computePlayerTier`.

---

## Tasks

- [x] **T1** — Dans `children/index.tsx`, ajouter :
  - State `selectedTiers: PlayerTier[]` initialisé depuis `localStorage` ou `[]`
  - `useEffect` pour persister les tiers sélectionnés

- [x] **T2** — Calculer les compteurs par tier

- [x] **T3** — Ajouter `filteredByTier` dérivé, utilisé dans le rendu

- [x] **T4** — Implémenter le composant `TierPills` interne

- [x] **T5** — Définir `TIER_PILLS_CONFIG` array

- [x] **T6** — QA : `computePlayerTier` importé depuis `@aureak/business-logic`

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/index.tsx` | Modifier — ajouter pills tier + filtre |

---

## Notes techniques

- Importer `computePlayerTier` depuis `@aureak/business-logic` (story 52-2).
- Importer `PlayerTier` depuis `@aureak/types`.
- Les pills remplacent/complètent le filtre `AcadStatusFilter` existant — les deux coexistent (tier est une agrégation au-dessus du statut académie).
- Le scroll horizontal des pills garantit que toutes les 5 pills sont accessibles même sur mobile sans wrap.
