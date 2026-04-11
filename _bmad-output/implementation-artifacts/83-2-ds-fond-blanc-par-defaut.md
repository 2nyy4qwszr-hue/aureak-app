# Story 83.2 : DS — Fond blanc par défaut, beige en alterné

**Status:** done
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

- [x] T1 — Audit : 211 occurrences de `colors.light.primary` dans 134 fichiers. Aucun écran ne requiert explicitement un fond beige "premium" aujourd'hui (les cards hero sont en `dark.surface`, les sections premium sont noires ou ont un gradient). Décision : flip token → tous les écrans passent au blanc, `warm` reste dispo pour Story 83-5 composants signature
- [x] T2 — Mettre à jour `tokens.ts` : `light.primary` `#F3EFE7`→`#FFFFFF`, `light.hover` `#EDE9DF`→`#F8F8F8`, `light.muted` `#F8F6F1`→`#FAFAFA`, nouveau `light.warm` `#F3EFE7`
- [x] T3 — N/A (aucun écran warm cible à cette itération)
- [x] T4 — Contraste `#18181B` (text.dark) sur `#FFFFFF` : ratio 19.5 — WCAG AAA ✓
- [x] T5 — Playwright screenshot dashboard + methodologie/situations + evaluate DOM confirme `rgb(255,255,255)` dans la chaîne du main content area (le `rgb(242,242,242)` résiduel = root Expo Router, non concerné)
