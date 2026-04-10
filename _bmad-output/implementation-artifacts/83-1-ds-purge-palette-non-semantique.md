# Story 83.1 : DS — Purge palette non-sémantique

**Status:** todo
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §2, §9 (règle d'or : un seul accent)
**Deps:** aucune

## Contexte

Le site homepage impose **un seul accent couleur** (gold `#C1AC5C`) + noir/blanc/neutres. L'app viole cette règle avec : `entity` (stage/club/coach), `phase` (activation/development/conclusion), `methodologyMethodColors` (7 couleurs), `gamification.statBands`, `accent.red` pour CTAs. Status colors (rouge/vert/ambre) restent autorisées **uniquement pour la sémantique d'erreur / feedback système**.

## Description

Nettoyer `packages/theme/src/tokens.ts` pour retirer ou restreindre les couleurs non-sémantiques qui créent du bruit visuel. Remplacer par gold/neutre + différenciation via typo, icônes, ou label.

## Acceptance Criteria

- **AC1** — `colors.entity` (stage/club/coach) supprimé du token. Les usages existants basculent sur neutre `zinc-500` + label ou icône différenciante.
- **AC2** — `colors.phase` (activation/development/conclusion) supprimé. Les phases séance se distinguent via label Poppins uppercase + hairline gold, plus de fond coloré.
- **AC3** — `methodologyMethodColors` conservé **uniquement** pour les graphes/charts de progression (donnée quantitative). Supprimé des cards et listes → gold pour l'accent, neutre pour le reste.
- **AC4** — `colors.accent.red` (`#E05252`) supprimé. Tout CTA destructif bascule sur pattern noir `#111` + label explicite ("Supprimer définitivement"). `status.errorText` reste pour erreurs de formulaire.
- **AC5** — `colors.gamification.statBands` (high/medium/low) : `medium` reste gold, `high` devient gold + icône ↑, `low` reste `status.errorText` (sémantique négative OK).
- **AC6** — Grep `rg "entity\.(stage|club|coach)|\.phase\.(activation|development|conclusion)|accent\.red"` retourne 0 match dans `apps/` et `packages/`.
- **AC7** — Lint passe, typecheck passe (`cd aureak && npx tsc --noEmit`).
- **AC8** — Commit message : `refactor(theme): purge palette non-sémantique — align site DS`

## Tasks

- [ ] T1 — Audit des usages actuels : `rg "colors\.entity|colors\.phase|accent\.red|statBands"` → liste exhaustive des fichiers impactés
- [ ] T2 — Migrer chaque usage fichier par fichier (pattern de remplacement dans le commit log)
- [ ] T3 — Supprimer les tokens obsolètes de `tokens.ts`
- [ ] T4 — Typecheck + lint + QA post-edit (§3 CLAUDE.md)
- [ ] T5 — Screenshot Playwright d'1 écran représentatif avant/après pour validation visuelle

## Notes

- Ne PAS toucher à `status.*` (present/absent/attention/success/warning/errorBg/etc.) — ce sont des couleurs sémantiques justifiées.
- Ne PAS toucher à `playerTiers` ni `terrain` (cas spécifiques métier isolés).
- Si un usage est ambigu, marquer `// TODO(83.1): décision produit` et continuer.
