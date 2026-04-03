# Story 35-3 — Skeleton: fiches détail

**Epic:** 35
**Status:** ready-for-dev
**Priority:** low

## Story
En tant qu'admin, je veux voir un skeleton animé lors du chargement des fiches détail afin d'avoir un retour visuel clair sans texte "Chargement…" statique.

## Acceptance Criteria
- [ ] AC1: Un composant `DetailSkeleton` existe dans `@aureak/ui` avec un rectangle header (200×20) et 3 sections rectangles animés.
- [ ] AC2: `seances/[sessionId]/page.tsx` n'affiche plus `<AureakText>Chargement…</AureakText>` mais `<DetailSkeleton />`.
- [ ] AC3: `players/[playerId]/page.tsx` n'affiche plus `<AureakText>Chargement…</AureakText>` mais `<DetailSkeleton />`.
- [ ] AC4: `children/[childId]/page.tsx` n'affiche plus `<AureakText>Chargement…</AureakText>` mais `<DetailSkeleton />`.
- [ ] AC5: L'animation du skeleton utilise `Animated` de React Native (pulse fade 0.3→1→0.3, durée 1200ms, loop).
- [ ] AC6: Les couleurs du skeleton utilisent `colors.border.light` (fond) et `colors.light.hover` (shimmer) — aucune couleur hardcodée.

## Tasks
- [ ] Créer `aureak/packages/ui/src/DetailSkeleton.tsx` — composant avec rectangle header 200×20 + 3 sections rectangles (hauteur 80px chacune, gap 12px), animation Animated.loop pulse.
- [ ] Exporter `DetailSkeleton` depuis `aureak/packages/ui/src/index.ts`.
- [ ] Remplacer le bloc de chargement dans `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` (chercher `Chargement` ou état `loading && !session`) par `<DetailSkeleton />`.
- [ ] Remplacer le bloc de chargement dans `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx` par `<DetailSkeleton />`.
- [ ] Remplacer le bloc de chargement dans `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` par `<DetailSkeleton />`.
- [ ] QA scan : vérifier aucune couleur hardcodée dans `DetailSkeleton.tsx`.

## Dev Notes
- Fichiers à modifier:
  - `aureak/packages/ui/src/DetailSkeleton.tsx` (créer)
  - `aureak/packages/ui/src/index.ts`
  - `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
  - `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx`
  - `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- Pattern animation : `useRef(new Animated.Value(0.3))` + `Animated.loop(Animated.sequence([Animated.timing(...to 1), Animated.timing(...to 0.3)]))`
- Dépendances story : aucune — les tokens `colors.border.light` et `colors.light.hover` existent déjà
- Ne pas créer de nouvelle page ; le composant est purement visuel
