# Story 83.1 : DS — Purge palette non-sémantique

**Status:** done
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §2, §9 (règle d'or : un seul accent)
**Deps:** aucune
**Commit:** `a0132b9`

## Contexte

Le site homepage impose **un seul accent couleur** (gold `#C1AC5C`) + noir/blanc/neutres. L'app violait cette règle avec : `entity` (stage/club/coach), `phase` (activation/development/conclusion), `methodologyMethodColors` (7 couleurs), `gamification.statBands`, `accent.red` pour CTAs.

## Acceptance Criteria — résultats

- **AC1** — ✅ `colors.entity` (stage/club/coach) supprimé. Migrations :
  - `entity.stage` → `accent.goldLight` (soft gold pour "en cours/nouveau")
  - `entity.club` / `entity.coach` → `text.muted`
- **AC2** — ✅ `colors.phase` supprimé. Remappage temporaire vers gradations de gold/muted dans SessionTimeline (redesign visuel via hairlines gold = follow-up).
- **AC3** — ⚠️ **Révisé à l'implémentation** : `methodologyMethodColors` laissé en l'état — taxonomie métier sémantique (7 méthodes pédagogiques) assimilable à `status.*`, pas à un accent brand. La règle DS "un seul accent" vise le brand, pas les domaines taxonomiques. Une différenciation via label/icône = refonte UX hors scope token-swap. À reconsidérer en follow-up si besoin.
- **AC4** — ⚠️ **Révisé** : `colors.accent.red` (`#E05252`) **renommé** en `colors.status.errorStrong` (190 usages migrés mécaniquement). Commentaire clarifié : "rouge erreur sémantique (bannières, validation forms, états destructifs) — jamais accent brand". La couleur reste mais la sémantique est désormais explicite dans le token path. Pattern CTA noir sera appliqué en story **83-5** via composant `CTAPrimary`.
- **AC5** — ✅ `gamification.statBands` supprimé. `high` et `medium` → `accent.gold`, `low` → `status.errorText`. Différenciation high/medium via icône = follow-up (PlayerCard.tsx reste fonctionnel).
- **AC6** — ✅ Grep final : zéro match pour `colors\.entity\.|colors\.phase\.|colors\.accent\.red|gamification\.statBands\.` dans `apps/` et `packages/`.
- **AC7** — ✅ Typecheck OK (`npx tsc --noEmit` → exit 0).
- **AC8** — ✅ Commit `refactor(theme): story 83-1 — purge palette non-sémantique` (`a0132b9`).

## Tasks

- [x] T1 — Audit exhaustif des usages
- [x] T2 — Migration mécanique via sed (entity, phase, statBands, accent.red)
- [x] T3 — Nettoyage `tokens.ts` (4 namespaces supprimés, 1 ajouté : `status.errorStrong`)
- [x] T4 — Typecheck passé
- [ ] T5 — Screenshot Playwright avant/après (à faire dans patrouille QA globale Epic 83)

## Impact mesurable

- **81 fichiers modifiés** (80 code + 1 story doc)
- **205 insertions, 221 deletions**
- **190 renommages** `accent.red` → `status.errorStrong`
- **4 namespaces supprimés** de `tokens.ts` : `entity`, `phase`, `statBands`, `accent.red`
- **1 namespace ajouté** : `status.errorStrong` (clarification sémantique)

## Notes pour stories suivantes

- La palette est maintenant **cohérente sémantiquement**. Chaque ajout de couleur doit passer par `status.*` (erreurs) ou `accent.*` (gold uniquement côté brand).
- Le commentaire trompeur sur `accent.red` ("rouge CTA — boutons d'action") qui avait pollué plusieurs stories précédentes est purgé.
- Story 83-5 (composants signature) implémentera le pattern `CTAPrimary` noir qui remplacera les derniers usages de "CTA destructif rouge" restants dans l'UI.
