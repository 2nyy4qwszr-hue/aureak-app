# Epic 109 — Design tokens & harmonisation des tableaux admin

Status: ready-for-dev
Date: 2026-04-25

## Contexte

Lors du refactor MR #10 (`refactor(methodologie): tableaux + filtres alignés sur design activités/seances`), le hook auto-fix pré-push a flaggé un risque : les tableaux et filtres de l'admin (`activites/*`, `methodologie/*`, `prospection/*`, `academie/*`, `evaluations/*`, etc.) partagent des patterns visuels (table card avec border, header muted, rows alternés, pagination ‹ ›, segmented toggle, select natif label uppercase) mais sans tokens formalisés. Chaque page redéfinit ses styles localement → drift inévitable, désalignement visuel, multiplication de variantes proches mais pas identiques.

Le refactor méthodologie a introduit `methodologieFilters.tsx` (composants `MetSegmented`, `MetSelect`, `MetPagination`, hook `usePagination`) — c'est un bon premier pas, mais cantonné à la zone méthodologie. L'objectif de cet epic est de **promouvoir ces composants au niveau du package `@aureak/ui`** et d'**harmoniser les ~20 tableaux admin** existants.

## Objectif

Un seul jeu de tokens et de composants pour TOUS les tableaux admin, garantissant :
- Cohérence visuelle stricte (header muted, rows alternés, pagination, etc.)
- Réduction du code dupliqué (≈ -1500 lignes attendu sur l'ensemble du repo)
- Évolutivité : un changement de design = 1 seul endroit à modifier
- Accessibilité : un seul endroit pour gérer focus/keyboard nav/aria

## Périmètre

### Tokens à formaliser dans `@aureak/theme`
- `tableTokens.{wrapperBorderRadius, wrapperBorderColor, headerBg, headerPadding, rowMinHeight, rowAlternateBg, paginationBg, ...}`
- `filterTokens.{selectFieldGap, selectLabelSize, segmentedBg, segmentedActiveBg, ...}`

### Composants à promouvoir vers `@aureak/ui` (ou `@aureak/ui-admin` si besoin de séparation)
- `<DataTable>` — wrapper card + header muted + rows alternés
- `<DataTableColumn>` — colonne typée (width, flex, align, render)
- `<DataTablePagination>` — footer pagination
- `<FilterBar>` — wrapper flex pour filtres
- `<SelectFilter>` — label uppercase + select natif
- `<SegmentedFilter>` — toggle muted bg + active surface
- `<usePagination>` — hook utilitaire

### Pages à migrer (par lot)
**Lot 1 — déjà refactorées (à migrer vers tokens centraux)** :
- `methodologie/seances`, `methodologie/programmes`, `methodologie/themes`, `methodologie/situations`, `methodologie/evaluations`
- `activites/seances` (canonique référence)

**Lot 2 — autres pages activités/évaluations** :
- `activites/evaluations`, `activites/presences`
- `evaluations/index`

**Lot 3 — administration & prospection** :
- `prospection/gardiens` (utilise `ProspectTable`)
- `coach-prospection` (utilise `CoachProspectTable`)
- `administration/conformite/rgpd-prospects`
- `administration/utilisateurs/waitlist`

**Lot 4 — académie & enfants** :
- `academie/joueurs` (utilise `PeopleListPage`)
- `children/[childId]`

**Lot 5 — composants partagés** :
- `components/admin/DataCard.tsx`
- `components/admin/prospection/ProspectTable.tsx`
- `components/admin/coach-prospection/CoachProspectTable.tsx`
- `components/admin/activites/TableauSeances.tsx` (canonique)
- `components/admin/methodologie/methodologieFilters.tsx` → à supprimer après migration vers `@aureak/ui`
- `components/admin/academie/PeopleListPage.tsx`

## Stories

- [ ] **109-1** — Audit + design des tokens & API composants
  - Inventaire exhaustif des variantes existantes (badges, avatars, méthode circle, status dot, etc.)
  - Spec des tokens `tableTokens` et `filterTokens`
  - Spec API des composants `<DataTable>`, `<FilterBar>`, etc.
  - Validation visuelle avec maquettes (Stitch ?) — **VALIDATION HUMAINE OBLIGATOIRE avant 109-2**
- [ ] **109-2** — Tokens dans `@aureak/theme` + composants dans `@aureak/ui`
  - Ajoute `tableTokens` + `filterTokens` à `tokens.ts`
  - Crée les composants `<DataTable>`, `<DataTableColumn>`, `<DataTablePagination>`, `<FilterBar>`, `<SelectFilter>`, `<SegmentedFilter>`, `<usePagination>`
  - Tests unitaires Vitest sur les composants
  - **STOP avant migration** : vérification visuelle d'un POC sur 1 page
- [ ] **109-3** — Migration Lot 1 (méthodologie 5 pages + `activites/seances`)
  - Remplace `methodologieFilters.tsx` par les composants `@aureak/ui`
  - Refactor `TableauSeances.tsx` pour utiliser `<DataTable>`
  - Suppression du module `methodologieFilters.tsx`
- [ ] **109-4** — Migration Lot 2 (autres activités + évaluations)
- [ ] **109-5** — Migration Lot 3 (administration + prospection)
- [ ] **109-6** — Migration Lot 4 (académie + enfants)
- [ ] **109-7** — Cleanup final + retrospective tokens
  - Suppression code dupliqué résiduel
  - Mise à jour `architecture.md` + ADR sur les tokens tableaux
  - Snapshot visuel via Playwright pour régression future

## Non-scope

- Refonte du design lui-même (cet epic harmonise l'existant, ne le change pas)
- Mobile responsive (couvert par epic 103) — les tokens doivent juste être compatibles
- Tableaux côté Parent / Coach / Club (cet epic = admin only ; suite v1.1)
- Composants NON-tableau (cards, modales, formulaires) — hors scope

## Risques

- **Régressions visuelles** : la migration touche ~20 pages. Mitigation : Playwright snapshots avant/après par lot.
- **Tokens trop rigides** : certains tableaux ont des spécificités (avatars, badges méthode, etc.). API `<DataTable>` doit accepter `renderCell` custom pour ces cas.
- **Big-bang vs incrémental** : on choisit incrémental (lots 1→4) pour limiter le rayon de blast.

## Dépendances

- Aucune dépendance bloquante (tous les composants sources existent déjà).
- Recommandation : faire valider 109-1 (specs) par humain AVANT 109-2 (impl), pour éviter retravail.
