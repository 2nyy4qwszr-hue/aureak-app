# Story 36-6 — Page fix: stages, anomalies, dashboard

**Epic:** 36
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant que mainteneur, je veux que `stages/[stageId]/page.tsx`, `anomalies/index.tsx`, `dashboard/comparison.tsx` et `players/[playerId]/page.tsx` utilisent des tokens `@aureak/theme` afin d'éliminer toutes les couleurs hardcodées restantes dans ces fichiers.

## Acceptance Criteria
- [ ] AC1: `stages/[stageId]/page.tsx` : `rgba(0,0,0,0.7)` remplacé par `colors.overlay.modal`.
- [ ] AC2: `anomalies/index.tsx` : `#3B82F6` remplacé par `colors.status.info`.
- [ ] AC3: `dashboard/comparison.tsx` : `rgba(76,175,80,0.07)` remplacé par token opacity (soit `colors.status.present` + opacité CSS, soit token dédié `colors.status.presentBg`).
- [ ] AC4: `players/[playerId]/page.tsx` : toutes les couleurs de signal (vert/rouge/jaune évaluation) remplacées par `colors.status.*` ; `#CE93D8` remplacé par `colors.status.injured` (dépend story-33-1).
- [ ] AC5: grep `rgba\(\|#3B82F6\|#CE93D8` dans les fichiers modifiés retourne 0 résultats.

## Tasks
- [ ] Lire `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` pour localiser `rgba(0,0,0,0.7)` et le remplacer par `colors.overlay.modal`.
- [ ] Lire `aureak/apps/web/app/(admin)/anomalies/index.tsx` pour localiser `#3B82F6` et le remplacer par `colors.status.info`.
- [ ] Lire `aureak/apps/web/app/(admin)/dashboard/comparison.tsx` pour localiser `rgba(76,175,80,0.07)` et le remplacer par le token approprié.
- [ ] Lire `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx` pour identifier les couleurs de signal et `#CE93D8` — remplacer par `colors.status.*`.
- [ ] QA scan : grep couleurs hardcodées restantes dans les 4 fichiers modifiés.
- [ ] QA scan : vérifier try/finally sur les state setters dans chaque fichier.

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`
  - `aureak/apps/web/app/(admin)/anomalies/index.tsx`
  - `aureak/apps/web/app/(admin)/dashboard/comparison.tsx`
  - `aureak/apps/web/app/(admin)/players/[playerId]/page.tsx`
- **Dépend de story-33-1** : tokens `colors.status.info`, `colors.status.injured`, `colors.status.present` etc.
- **Dépend de story-33-3** : token `colors.overlay.modal`.
- Pour `rgba(76,175,80,0.07)` : si pas de token `presentBg`, utiliser `colors.status.present + '12'` (hex opacity 7% ≈ `#12`) ou créer le token `colors.status.presentBg` dans story-33-1.
- `#CE93D8` = violet lilas = couleur blessure — token cible `colors.status.injured` (#CE93D8 ou token similaire à définir en story-33-1).
