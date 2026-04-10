# Story 83.1 : Académie — Joueurs : Refonte DA (pattern Activités Séances) + Filtres

Status: done

## Story

En tant qu'admin,
je veux que la page Joueurs adopte la même DA que la page Activités Séances (header block, filtresRow gauche/droite, SegmentedToggle),
et que les filtres soient remplacés par : Statut, Année de naissance, Niveau (étoiles), Club (texte) + toggle AUREAK KEPER / PROSPECT,
afin d'obtenir une cohérence visuelle et des outils de filtrage pertinents pour la gestion de l'annuaire.

## Context

La page `aureak/apps/web/app/(admin)/children/index.tsx` dispose actuellement d'un système de filtres hétérogène (tier pills, onglets saisons, onglets stages, search bar) sans header block structuré. La DA d'Activités Séances (`activites/page.tsx` + `ActivitesHeader` + `FiltresScope` + `PseudoFiltresTemporels`) constitue le pattern cible.

### Pattern DA Activités Séances à reproduire

```
┌─────────────────────────────────────────────────────┐
│  ACADÉMIE                         [+ Nouveau joueur] │  ← headerTopRow
│  ───────────────────────────────────────────────────  │  ← bordure bottom
├─────────────────────────────────────────────────────┤
│  [Statut ▾] [Année ▾] [Niveau ▾] [Club ▾]  [AUREAK KEPER|PROSPECT]  │  ← filtresRow
├─────────────────────────────────────────────────────┤
│  Grille de cartes joueurs (inchangée)               │
└─────────────────────────────────────────────────────┘
```

- `filtresRow` = `flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'`
- Pills gauche : même style que `FiltresScope` (pillStyle avec gold si actif)
- Toggle droite : même `SegmentedToggle` que `PseudoFiltresTemporels`

### Sémantique du toggle AUREAK KEPER / PROSPECT

- **AUREAK KEPER** (défaut) = tous les joueurs ayant un lien avec l'académie :
  `computedStatus IN ['ACADÉMICIEN', 'NOUVEAU_ACADÉMICIEN', 'ANCIEN', 'STAGE_UNIQUEMENT']`
- **PROSPECT** = jamais passé par l'académie :
  `computedStatus === 'PROSPECT'`

### Filtres à implémenter

| Filtre | Type | Valeurs |
|--------|------|---------|
| Statut | Pill dropdown | Tous, ACADÉMICIEN, NOUVEAU_ACADÉMICIEN, ANCIEN, STAGE_UNIQUEMENT |
| Année  | Pill dropdown | Toutes, 2004→2018 (parsing `birthDate.slice(0,4)`) |
| Niveau | Pill dropdown | Tous, ★ (1), ★★ (2), ★★★ (3), ★★★★ (4), ★★★★★ (5) — filtre sur `teamLevelStars` |
| Club   | Pill + input inline | Texte libre → filtre `currentClub` contains (insensible casse) |

### Filtres à supprimer

- Tier pills (Tous / Prospect / Académicien / Confirmé / Elite)
- Onglets SEASON_TABS (Toutes / 1 saison / 2 saisons / 3+)
- Onglets STAGE_TABS (Tous / Aucun / 1 stage / 2 stages / 3+)
- Search bar inline actuelle (remplacée par pill Club)

La search bar de recherche nom (existante) peut rester dans le header ou être supprimée — voir AC #9.

## Acceptance Criteria

1. **Header block** : `headerBlock` avec `headerTopRow` (titre "ACADÉMIE" 24px/700/Montserrat/letterSpacing 0.5 + bouton "+ Nouveau joueur" gold à droite) — identique à `ActivitesHeader` visuellement.
2. **`filtresRow`** : `flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm, zIndex: 9999` — même que `activites/page.tsx`.
3. **Filtre Statut** : pill dropdown avec options [Tous, ACADÉMICIEN, NOUVEAU_ACADÉMICIEN, ANCIEN, STAGE_UNIQUEMENT]. Label pill = "Statut ▾" si non actif, valeur sélectionnée si actif. Pill gold si actif.
4. **Filtre Année** : pill dropdown avec options [Toutes, 2004, 2005, …, 2018]. Filtre sur `parseInt(item.birthDate?.slice(0,4))`. Label pill = "Année ▾" si non actif, année sélectionnée si actif. Pill gold si actif.
5. **Filtre Niveau** : pill dropdown avec options [Tous, ★, ★★, ★★★, ★★★★, ★★★★★]. Filtre sur `item.teamLevelStars`. Label pill = "Niveau ▾" si non actif, étoiles si actif. Pill gold si actif.
6. **Filtre Club** : pill avec input texte inline (TextInput dans dropdown, identique au picker Joueur dans `FiltresScope`). Filtre client-side sur `item.currentClub?.toLowerCase().includes(search)`. Label = "Club ▾" si vide, valeur saisie si non vide. Pill gold si non vide.
7. **Toggle AUREAK KEPER / PROSPECT** : `SegmentedToggle` identique à `PseudoFiltresTemporels` (bordure, overflow hidden, paddingH lg, paddingV 8, fond gold si actif). Options : `AUREAK_KEPER` (label "AUREAK KEPER") et `PROSPECT` (label "PROSPECT"). Valeur par défaut : `AUREAK_KEPER`.
8. **Combinaison des filtres** : logique ET entre tous les filtres actifs + toggle. Le toggle pré-filtre la liste avant application des autres filtres.
9. **Search bar nom** : la `TextInput` de recherche par nom existante est déplacée dans le `headerTopRow` entre le titre et le bouton, ou supprimée si elle fait doublon — au choix de l'implémenteur. Si conservée, largeur max 200px.
10. **Anciens filtres supprimés** : `TIER_PILLS_CONFIG`, `SEASON_TABS`, `STAGE_TABS`, `TierFilterKey`, `SeasonFilter`, `StageFilter`, `loadTierFilter()`, `TIER_FILTER_STORAGE_KEY` et leurs états sont retirés.
11. **Grille de cartes inchangée** : le composant `PremiumJoueurCard`, les helpers `PhotoAvatar`, `JoueurCard`, la logique de pagination et le split-screen desktop ne sont pas modifiés.
12. **Tokens uniquement** : aucune couleur hardcodée — tout via `@aureak/theme`.
13. **Console guards** : tout `console.error/log` est wrappé `if (process.env.NODE_ENV !== 'production')`.
14. **try/finally** : les états de chargement restent dans le pattern try/finally existant — pas de regression.

## Tasks / Subtasks

- [ ] 1. Supprimer les états et constantes des anciens filtres (tier, season, stage) dans `children/index.tsx`
- [ ] 2. Ajouter les nouveaux états de filtre : `statutFilter`, `anneeFilter`, `niveauFilter`, `clubSearch`, `toggleMode` (AUREAK_KEPER | PROSPECT)
- [ ] 3. Créer le `headerBlock` (headerTopRow + titre + bouton Nouveau joueur) en haut de la page, style identique à `ActivitesHeader`
- [ ] 4. Créer les 4 pill-dropdowns (Statut, Année, Niveau, Club) avec la logique d'ouverture/fermeture mutuellement exclusive
- [ ] 5. Créer le `SegmentedToggle` AUREAK KEPER / PROSPECT (style copié de `PseudoFiltresTemporels`)
- [ ] 6. Assembler le `filtresRow` : pills gauche + toggle droite, `justifyContent: 'space-between'`
- [ ] 7. Brancher la logique de filtrage client-side combiné (toggle → statut → année → niveau → club → search nom si conservée)
- [ ] 8. QA scan : grep try/finally et console guards sur `children/index.tsx`

## Dependencies

- Aucune migration DB
- Aucune modification `@aureak/api-client` (filtrage client-side uniquement)
- Aucune modification `@aureak/types` ou `@aureak/theme`
- `PseudoFiltresTemporels` et `FiltresScope` sont des références de DA — ne pas les modifier

## Files to Modify

- `aureak/apps/web/app/(admin)/children/index.tsx` — refonte header + filtres uniquement

## Commit

```
feat(epic-83): story 83.1 — Académie Joueurs refonte DA + filtres Statut/Année/Niveau/Club
```
