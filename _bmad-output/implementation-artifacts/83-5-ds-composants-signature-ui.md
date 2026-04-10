# Story 83.5 : DS — Composants signature dans @aureak/ui

**Status:** todo
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §5
**Deps:** 83.3 (typo weights), 83.1 (palette)

## Contexte

Le site possède 5 composants "signature" qui portent l'identité visuelle Aureak. Aucun n'existe dans `@aureak/ui`. Leur absence fait que les écrans app ne ressemblent pas au site, même avec la même palette.

## Description

Créer 5 composants dans `packages/ui/src/` avec une page de démo `/design-system/signature` dans `apps/web`. Tous les composants doivent être cross-platform (web + mobile via Tamagui ou conditionnel).

## Acceptance Criteria

**AC1 — `GoldHairline`**
- Ligne gold `#C1AC5C`, hauteur 1px, largeur par défaut 80px (configurable via prop `width`)
- Prop `animated?: boolean` → entrée `scaleX: 0 → 1` durée 700ms ease `[0.16,1,0.3,1]`
- Marge bottom 28px (`mb-7`) par défaut, configurable

**AC2 — `CTAPrimary`**
- Pill noir `#111111`, radius full, padding `20px 28px` desktop / `14px 20px` mobile
- Label Poppins 600 `14px`, blanc
- Flèche `→` dans cercle translucide `rgba(255,255,255,0.12)` 24×24
- Shadow `0 4px 24px rgba(0,0,0,0.13)`
- Hover scale 1.03, tap scale 0.97 (Reanimated ou Framer selon plateforme)
- Focus ring `rgba(193,172,92,0.6)` 2px offset 2px

**AC3 — `CTASecondary`**
- Variante ghost : transparent, border `1.5px solid #d4d4d8`, text `#3f3f46`
- Même géométrie pill que primary

**AC4 — `LocationPill`**
- Pill gold soft : bg `rgba(193,172,92,0.07)`, border `1px solid rgba(193,172,92,0.3)`, text `#C1AC5C`
- Dot gold 6×6 avant le label
- Label Poppins 600 uppercase `11px` tracking 0.08em
- Prop `children` pour le label

**AC5 — `StatsInline`**
- Liste horizontale de stats : valeur Montserrat 900 gold + label Poppins 400 `zinc-400`
- Divider vertical 1px `zinc-200` entre chaque item
- Prop `items: Array<{ value: string; label: string }>`
- Wrap sur mobile

**AC6 — `GrainOverlay`**
- SVG turbulence fractalNoise baseFrequency 0.85 (cf. design-system doc)
- `position: fixed inset: 0`, `pointer-events: none`, `opacity: 0.022`, `z-index: 50`
- `aria-hidden`
- Composant web-only (ignoré sur mobile RN)

**AC7 — Exports**
- Tous exposés depuis `packages/ui/src/index.ts`
- Types TS complets, pas de `any`

**AC8 — Page démo**
- `apps/web/app/(admin)/design-system/signature/page.tsx` affiche chaque composant avec exemples
- Accessible via URL pour review visuelle

**AC9 — QA**
- Typecheck + lint + QA post-edit passent
- Playwright : navigate `/design-system/signature` → screenshot → 0 erreur console
- Commit : `feat(ui): add site DS signature components`

## Tasks

- [ ] T1 — Créer `packages/ui/src/signature/GoldHairline.tsx`
- [ ] T2 — Créer `CTAPrimary.tsx` + `CTASecondary.tsx`
- [ ] T3 — Créer `LocationPill.tsx`
- [ ] T4 — Créer `StatsInline.tsx`
- [ ] T5 — Créer `GrainOverlay.tsx` (web only, no-op sur mobile)
- [ ] T6 — Exporter depuis `packages/ui/src/index.ts`
- [ ] T7 — Créer la page démo `design-system/signature`
- [ ] T8 — Tests Playwright + screenshot

## Notes

- Utiliser `Pressable` RN + `useAnimatedStyle` pour hover/tap cross-platform
- Si Framer Motion pas encore installé côté web → importer dans apps/web uniquement, pas dans le package ui (compat mobile)
