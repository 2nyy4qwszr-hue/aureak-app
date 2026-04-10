# Story 83.4 : DS — Spacing sections premium (py-24 mini)

**Status:** todo
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §4
**Deps:** aucune

## Contexte

Le site homepage utilise `py-24` minimum (96px), `py-32` (128px) ou `py-40` (160px) pour les sections premium. L'app : `sectionPaddingY: { mobile: 24, desktop: 32 }` → **3× trop serré** → rend l'UI dense et "productivity app" au lieu d'éditorial.

Note : l'app admin reste dense par nature (tables, listes), donc le bump s'applique surtout aux **sections hero, landing, empty states, onboarding, détail joueur**, pas aux tables elles-mêmes.

## Description

Ajouter de nouveaux tokens `layout.section*` spécifiques aux écrans éditoriaux. Les écrans "data-dense" (listes, tables) gardent leur padding actuel renommé `layout.dense*`.

## Acceptance Criteria

- **AC1** — Nouveaux tokens dans `layout` :
  - `sectionPaddingY.editorial: { mobile: 64, desktop: 120 }` (≈ py-16 / py-30)
  - `sectionPaddingY.standard: { mobile: 32, desktop: 64 }` (nouveau niveau intermédiaire)
  - `sectionPaddingY.dense: { mobile: 16, desktop: 24 }` (= ancien `sectionPaddingY` renommé, pour tables/listes)
- **AC2** — `sectionPaddingY` (sans namespace) supprimé ou devient alias de `standard` pour migration.
- **AC3** — Paragraphes longs contraints à `max-w-[560px]` (50ch) via token `layout.proseMaxWidth = 560`.
- **AC4** — Les écrans éditoriaux identifiés (liste en T1) basculent sur `editorial`. Les tables admin gardent `dense`.
- **AC5** — Typecheck + QA + Playwright screenshot empty state. Commit : `refactor(theme): add editorial spacing tokens`

## Tasks

- [ ] T1 — Lister les écrans éditoriaux candidats (dashboard hero, onboarding, fiche joueur header, empty states) → décision case par case
- [ ] T2 — Mettre à jour `tokens.ts`
- [ ] T3 — Migration progressive : max 5 écrans dans cette story, reste en follow-up si besoin
- [ ] T4 — Vérifier sur mobile que l'air ajouté ne casse pas la lisibilité (scroll OK)
- [ ] T5 — Screenshots avant/après
