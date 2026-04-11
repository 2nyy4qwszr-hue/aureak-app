# Story 83.4 : DS — Spacing sections premium (py-24 mini)

**Status:** done
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

- [x] T1 — Audit : `layout.sectionPaddingY` n'avait **aucun consommateur** dans le code (0 grep). La plupart des écrans utilisent `space.xl` / `space.xxl` inline. Candidats éditoriaux théoriques : empty states, onboarding hero, fiche joueur header — mais aucun n'utilisait le token. Migration concrète limitée à EmptyState pour valider l'API
- [x] T2 — `tokens.ts` : `sectionPaddingY` restructuré en `{ editorial, standard, dense }` + nouveau `proseMaxWidth: 560`
- [x] T3 — EmptyState.tsx migré sur `layout.sectionPaddingY.editorial.mobile` (64px, identique à `space.xl*2` — pas de régression). Autres écrans laissés en follow-up, leur migration doit être décidée par écran visuellement (pas mécanique)
- [x] T4 — Valeurs mobile ≤ 64 → scroll OK sur viewport 375×667
- [x] T5 — Pas de rupture visible car EmptyState garde 64px mobile ; aucun écran ne bump jusqu'à ce qu'on touche desktop. Screenshot commun avec 83-2
