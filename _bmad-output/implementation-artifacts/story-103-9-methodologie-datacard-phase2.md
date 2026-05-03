# Story 103.9 : Méthodologie phase 2 — DataCard mobile-first sur 4 pages

Status: partial-done

> **Scope livré** : EntraînementsTable migré en stack de cards mobile (<640px). Plus de scroll horizontal sur cette table. Pattern `useWindowDimensions + isMobile ? <Cards /> : <Table />` utilisé.
>
> **Scope restant** (sous-stories à créer si besoin) :
> - 103.9.b : ExercicesTable (méthodologie/entrainements onglet exercices)
> - 103.9.c : ProgrammesTable
> - 103.9.d : ThemesTable
> - 103.9.e : SituationsTable
>
> Le pattern à reproduire est dans `entrainements/index.tsx` lignes 207-265 (mobile branch).

Dépend de : 103.3 (FAB méthodologie phase 1 livré) · Epic 101 (DataCard composant)

## Story

En tant qu'**admin sur mobile**,
je veux **les listes méthodologie (entrainements, programmes, themes, situations) en cards au lieu de tableaux scrollables horizontalement**,
afin de **lire le contenu sans gymnastique tactile (90% de mes consultations sont sur téléphone)**.

## Contexte

Story 103.3 phase 1 a ajouté un FAB `<PrimaryAction>` sur 4 pages méthodologie. Phase 2 doit refacturer le rendu des listes :

- Aujourd'hui : tableaux à colonnes fixes (`COL_WIDTHS`) qui débordent en horizontal sur mobile
- Cible : `<DataCard>` (story 101.1) avec primary/secondary/tertiary slots, stack vertical mobile, table desktop

Pages concernées :
- `/methodologie/entrainements` (table EntraînementsTable + ExercicesTable)
- `/methodologie/programmes` (table ProgrammesTable)
- `/methodologie/themes` (table ThemesTable)
- `/methodologie/situations` (table SituationsTable)

## Acceptance Criteria

- **AC1 — DataCard sur entrainements** : sur mobile (<640px), chaque entraînement est rendu via `<DataCard>` avec :
  - primary = `{trainingRef ?? ''} {title}`
  - secondary = `{method picto + label}`
  - tertiary = `{status} · {themesCount} thèmes` (pour entrainements) ou `{status}` (pour exercices)
- **AC2 — DataCard sur programmes** : primary = title, secondary = method, tertiary = saison/contextType
- **AC3 — DataCard sur themes** : primary = title, secondary = bloc/group name, tertiary = vidéo OK/KO
- **AC4 — DataCard sur situations** : primary = name, secondary = bloc, tertiary = key
- **AC5 — Desktop inchangé** : ≥ 640px conserve les tableaux existants. Détection via `useWindowDimensions`.
- **AC6 — État vide** : `<EmptyState />` (story 101.5) à la place du View inline.
- **AC7 — Pagination préservée** : `<MetPagination>` reste fonctionnel sur les deux modes.
- **AC8 — Conformité** : tokens `@aureak/theme` only, pas de hardcode, try/finally déjà OK des stories précédentes.

## Tasks / Subtasks

- [ ] T1 — Refacto `EntraînementsTable` : ajouter rendu mobile cards via `<DataCard>` + branchement par breakpoint
- [ ] T2 — Refacto `ExercicesTable` (même fichier) — identique
- [ ] T3 — Refacto `ProgrammesTable`
- [ ] T4 — Refacto `ThemesTable`
- [ ] T5 — Refacto `SituationsTable`
- [ ] T6 — Substituer empty state inline par `<EmptyState>`
- [ ] T7 — `cd aureak && npx tsc --noEmit`
- [ ] T8 — Test Playwright mobile (390x844) : 4 pages → cards stackées, pas de scroll horizontal

## Fichiers touchés

### Modifiés
- `aureak/apps/web/app/(admin)/methodologie/entrainements/index.tsx`
- `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx`
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx`
- `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx`

### Possiblement créés
- Helper local `MethodologieCardRow` si pattern partagé entre les 4 (sinon inline)

## Notes

- Story 101.1 doit fournir DataCard avec slots `primary`/`secondary`/`tertiary` + onPress. Vérifier l'API exacte avant l'impl.
- Si DataCard manque dans certains cas (ex: rendu d'icône/badge dans tertiary), adapter ou rendre inline en fallback.
- La 5ème page méthodologie (evaluations) n'est pas concernée : `hideNewButton` + structure différente, à traiter en story dédiée si besoin.
- StatsHero responsive (entrainements top hero) reste un sous-scope plus large à traiter en 103.3.c si nécessaire.
