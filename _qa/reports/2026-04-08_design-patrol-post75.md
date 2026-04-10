# Design Patrol — 2026-04-08 (post-epic-75)

## Résumé

- Pages scannées : 9 (dashboard, children, seances, stages, clubs, methodologie, activites, presences, seances/new)
- BLOCKER détectés : 2
- WARNING détectés : 4
- Pages conformes : 4 (stages, clubs, methodologie, seances/new)

---

## Dérives par page

### /dashboard

🔴 **BLOCKER** — Hero tile bento absente
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/index.tsx`
→ Observé : Layout 3 colonnes de cards blanches uniformes — aucune tile hero avec fond `#2A2827` + photo gardien + stats overlay
→ Attendu : Bento asymétrique avec tile hero Col 1 rows 1-2 (fond `#2A2827`, photo opacity 0.55, gradient bas) — Principe 2 et 10 de la design-vision + prototype `_agents/design-references/desktop-admin-bento-v2.html`

---

### /profils (404) et /groupes (404)

🔴 **BLOCKER** — Page 404 fond noir dominant (anti-pattern DARK DOMINANT)
→ Fichier : Expo Router 404 fallback (non personnalisé dans `apps/web/app/+not-found.tsx` ou équivalent)
→ Observé : `background-color: rgb(0, 0, 0)` — noir pur sur toute la page, texte blanc
→ Attendu : Fond `#F0EBE1` ou `#FFFFFF`, texte `#18181B` — anti-pattern "DARK DOMINANT" éliminatoire

---

### /seances/[sessionId]/page.tsx

⚠️ **WARNING** — Couleurs hardcodées massives hors tokens
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
→ Observé : `const HEADER_BG = '#1A1A1A'`, `const HEADER_WHITE = '#FFFFFF'`, `'#FEF3C7'`, `'#92400E'`, `'#F59E0B' + '30'`, `'#D1FAE5'`, `'#065F46'`, `presenceRate >= 80 ? '#10B981' : '#F59E0B' : '#E05252'`
→ Attendu : Utiliser `colors.text.dark`, `colors.light.primary`, `colors.status.warning`, `colors.status.success`, `colors.status.warningBg` etc. depuis `@aureak/theme`

⚠️ **WARNING** — Couleurs hardcodées hors tokens
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx`
→ Observé : `'#94A3B8'`, `'#DC2626'`, `'#FEE2E2'`, `'#FECACA'`, `'#FEF3C7'`, `'#FDE68A'`, `'#92400E'`
→ Attendu : Utiliser tokens `colors.accent.red` / `colors.status.*` / `colors.border.*` depuis `@aureak/theme`

---

### /children/[childId]

⚠️ **WARNING** — Couleurs hardcodées ponctuelles
→ Fichier : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
→ Observé : `'#ffffff'` (l. 446), `'#10B981'` et `'#9E9E9E'` inline (l. 2072-2073), `'#FFFFFF'` dans viewToggleIconActive (children/index.tsx l. 1823)
→ Attendu : `colors.text.primary` / `colors.status.success` / `colors.text.muted` depuis `@aureak/theme`

---

### packages/ui — AttendanceHeatmap + HeatmapGrid

⚠️ **WARNING** — Couleurs statut hardcodées dans composants UI partagés
→ Fichiers : `aureak/packages/ui/src/AttendanceHeatmap.tsx`, `aureak/packages/ui/src/HeatmapGrid.tsx`
→ Observé : `'#059669'`, `'#E05252'`, `'#F59E0B'`, `'#E5E2DA'`, `'#F5E6C0'`, `'#B45309'`, `'#6B7280'`
→ Attendu : Centraliser dans `colors.status.*` et `colors.accent.*` depuis `@aureak/theme` — les packages partagés doivent être zéro hardcode

---

## Actions recommandées

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 | /404 | `app/+not-found.tsx` (à créer/vérifier) | Créer une page 404 custom fond `#F0EBE1`, icône, bouton retour — anti-pattern DARK DOMINANT |
| P1 | /dashboard | `app/(admin)/dashboard/index.tsx` | Ajouter hero tile bento `#2A2827` + photo gardien + 3 stats overlay (prototype validé dans `_agents/design-references/desktop-admin-bento-v2.html`) |
| P2 | /seances/[id] | `seances/[sessionId]/page.tsx` | Remplacer `HEADER_BG='#1A1A1A'` et toutes les couleurs hardcodées par tokens `@aureak/theme` |
| P2 | /seances/[id] | `seances/[sessionId]/edit.tsx` | Remplacer `#DC2626`, `#FEE2E2`, etc. par `colors.accent.red`, `colors.status.*` |
| P3 | /children | `children/[childId]/page.tsx` + `children/index.tsx` | Remplacer `'#ffffff'`, `'#10B981'`, `'#9E9E9E'` hardcodés par tokens |
| P3 | packages/ui | `AttendanceHeatmap.tsx`, `HeatmapGrid.tsx` | Centraliser couleurs statut dans `colors.status.*` — zéro hardcode dans packages partagés |

---

## Pages conformes

- `/seances` (calendrier) — fond, cards et tokens corrects
- `/stages` — fond `#F3EFE7`, cards blanches, radius corrects
- `/clubs` — cards conformes, pas de dark dominant
- `/methodologie` — sections cards blanches conformes, progress bar gold token
- `/activites` (séances + presences) — StatCards utilise `colors.accent.goldDark` (token), pas de hardcode

---

## Console

- 1 erreur JS persistante : `Invalid style property of "textDecoration"` (source: Expo RN Web)
- 24 warnings Expo Router : fichiers helpers/composants exposés comme routes (pas de `default export`) — non bloquant design mais à nettoyer
