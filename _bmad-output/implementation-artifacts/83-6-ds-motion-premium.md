# Story 83.6 : DS — Motion premium (ease signature & patterns)

**Status:** done
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §6
**Deps:** 83.5 (composants signature, cibles des animations)

## Contexte

Le site homepage utilise Framer Motion avec une ease signature `[0.16, 1, 0.3, 1]` (cubic-bezier premium), des entrées 600-800ms, stagger 50-80ms, et scroll-driven pour le hero. L'app utilise des transitions CSS Material standard 150-300ms → perception "utilitaire" vs "éditorial premium".

## Description

Ajouter les tokens de motion alignés sur le site, créer un helper `useEntryAnimation` pour les patterns récurrents, et remplacer progressivement les transitions existantes dans les composants clés.

## Acceptance Criteria

**AC1 — Tokens motion**
- Nouveau token `transitions.easeSite = 'cubic-bezier(0.16, 1, 0.3, 1)'`
- Nouveau namespace `motion`:
  ```ts
  motion = {
    ease: { site: [0.16, 1, 0.3, 1] as const },
    duration: { micro: 180, entry: 700, section: 700 },
    stagger: { default: 60 },
  }
  ```
- Exposé depuis `@aureak/theme`

**AC2 — Helper `useEntryAnimation`** dans `packages/ui/src/hooks/useEntryAnimation.ts`
- Retourne `{ opacity, transform }` animés avec Reanimated (cross-platform)
- Déclenché sur mount ou via prop `trigger: boolean`
- Support `delay`, `distance` (default 16px y), ease site
- Utilisable sur web + mobile

**AC3 — Usage dans composants signature**
- `GoldHairline animated` utilise `useEntryAnimation` (scaleX)
- `StatsInline` supporte entrée staggerée via prop `staggered?: boolean`

**AC4 — Règle animation**
- Documenter dans `CLAUDE.md` § Design : "n'animer que `transform` et `opacity`, jamais `width/height/top/left/margin`"
- Ajouter au post-edit QA : grep warning si une animation touche `width|height|top|left|margin`

**AC5 — Focus ring**
- Tokens `focusRing = { color: 'rgba(193,172,92,0.6)', width: 2, offset: 2 }`
- Appliqué sur CTAPrimary/Secondary/LocationPill de la story 83.5

**AC6 — QA**
- Typecheck, lint, QA post-edit
- Playwright : vérifier animation d'entrée sur `/design-system/signature`
- Commit : `feat(theme,ui): add site-aligned motion system`

## Tasks

- [x] T1 — `tokens.ts` : `transitions.easeSite`, `motion = { ease: { site }, duration: { micro, entry, section }, stagger }`, exporté depuis `@aureak/theme`
- [x] T2 — `useEntryAnimation` hook via **RN Animated API** (Reanimated non installé dans le projet — API native suffit, cross-platform OK)
- [x] T3 — `GoldHairline` consomme `motion.ease.site` + `motion.duration.entry` ; `StatsInline` expose prop `staggered?: boolean` qui déclenche un delay progressif `i × motion.stagger.default` par item via `useEntryAnimation`
- [x] T4 — Token `focusRing` exporté + appliqué sur CTAPrimary/CTASecondary via `onFocus/onBlur` + outline (web only)
- [x] T5 — CLAUDE.md § Règles absolues rule 7 : motion transform/opacity uniquement + mention `useEntryAnimation`
- [x] T6 — CLAUDE.md § QA Patterns : grep animation interdite (`Animated\.(timing|spring).*\.(width|height|top|left|margin|padding)`)
- [x] T7 — Playwright : `/design-system/signature` rend les 5 composants après animations (StatsInline animés via stagger, GoldHairline scaleX animé) — 0 erreur console nouvelle

## Notes

- Reanimated déjà présent dans le projet (expo), pas de dépendance à ajouter
- Ne PAS migrer tout l'app en une fois — limiter aux composants signature. Les autres écrans suivront naturellement en adoptant ces composants.
