# Story 83.2 : DS — Fond blanc par défaut, beige en alterné

**Status:** todo
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §7
**Deps:** 83.1 (recommandé mais non bloquant)

## Contexte

Le site homepage utilise `#FFFFFF` pur comme fond global. Le beige `#F3EFE7` est réservé aux **sections alternées** (surface warm) pour respiration. L'app admin inverse la logique : beige partout par défaut → perçu comme "daté" par rapport au site.

## Description

Inverser la sémantique des tokens `colors.light.*` : blanc pur devient la surface principale admin, beige devient une surface alternée optionnelle nommée `colors.light.warm`.

## Acceptance Criteria

- **AC1** — `colors.light.primary` = `#FFFFFF` (au lieu de `#F3EFE7`).
- **AC2** — Nouveau token `colors.light.warm = '#F3EFE7'` pour sections alternées explicites.
- **AC3** — `colors.light.hover` recalibré sur `#F8F8F8` (gris très léger) au lieu de `#EDE9DF`.
- **AC4** — `colors.light.muted` = `#FAFAFA` (neutre) pour table headers / panels.
- **AC5** — Le fond principal de l'admin web (`apps/web/app/_layout` + routes admin) affiche `#FFFFFF` par défaut après la migration.
- **AC6** — Les écrans qui bénéficient visuellement du beige (hero cards, sections "premium") basculent explicitement sur `colors.light.warm` — liste à établir en T1.
- **AC7** — Typecheck + QA post-edit passent. Playwright snapshot d'1 écran dashboard admin.
- **AC8** — Commit : `refactor(theme): invert light surfaces — white default, warm alternate`

## Tasks

- [ ] T1 — Audit : lister tous les écrans qui utilisent `colors.light.primary` comme fond → décider `white` vs `warm` pour chaque
- [ ] T2 — Mettre à jour `tokens.ts`
- [ ] T3 — Adapter les écrans ciblés sur `warm`
- [ ] T4 — Vérifier contrastes text.dark (`#18181B`) sur nouveau fond blanc → OK WCAG AAA
- [ ] T5 — Screenshot avant/après dashboard + 1 écran liste
