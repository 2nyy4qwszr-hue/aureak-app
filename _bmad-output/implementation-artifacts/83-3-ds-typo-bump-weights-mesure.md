# Story 83.3 : DS — Typo weights & mesure de lecture

**Status:** todo
**Epic:** 83 — DS Alignment Site Homepage
**Source:** `_bmad-output/design-references/DESIGN-SYSTEM-HOMEPAGE.md` §3
**Deps:** aucune

## Contexte

Le site homepage impose **Montserrat 900 (black) systématique** sur tous les titres avec tracking `-0.01em`, line-height 1.1. Body Poppins 400 avec `line-height: 1.75` et `max-w-[50ch]` (mesure de lecture optimale). L'app utilise des poids trop légers (h1=700, h2=600, h3=600) → titres "plats" comparés au site.

## Description

Aligner les tokens `typography.*` sur les poids et paramètres du site. Ajouter `maxWidth` sur les tokens body pour contraindre la mesure de lecture.

## Acceptance Criteria

- **AC1** — `typography.display` : weight `900`, letterSpacing `-0.4` (≈ `-0.01em`), lineHeight `1.1` (inchangé).
- **AC2** — `typography.h1` : weight `900` (au lieu de `700`), letterSpacing `-0.3`.
- **AC3** — `typography.h2` : weight `900` (au lieu de `600`), letterSpacing `-0.2`.
- **AC4** — `typography.h3` : weight `800` (au lieu de `600`).
- **AC5** — `typography.bodyLg` et `body` : ajouter `maxWidth: 560` (≈ 50ch à 16px) pour les paragraphes longs. Token optionnel, appliqué via prop explicite.
- **AC6** — `typography.body` : lineHeight `27` (= 15 × 1.75) au lieu de `26`. `bodyLg` : `28` conservé.
- **AC7** — Les composants `<Text variant="h1|h2|h3">` de `@aureak/ui` utilisent automatiquement les nouveaux poids.
- **AC8** — Audit visuel : 3 écrans (dashboard, liste joueurs, fiche joueur) → titres nettement plus lourds, body identique en densité d'info.
- **AC9** — Typecheck + QA + Playwright screenshot. Commit : `refactor(theme): bump typography weights to site DS`

## Tasks

- [ ] T1 — Mettre à jour `tokens.ts` (typography)
- [ ] T2 — Vérifier que Montserrat 800/900 est bien chargé dans `apps/web` (_layout.tsx) et `apps/mobile`
- [ ] T3 — Si 800 manquant → ajouter les fichiers TTF / adapter la config expo-font
- [ ] T4 — Grep des composants `<H1>`, `<H2>` custom qui hardcodent un weight → migrer sur Text variant
- [ ] T5 — Screenshot avant/après + validation visuelle
