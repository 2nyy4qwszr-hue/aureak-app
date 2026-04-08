# Design Patrol — 2026-04-08 (Post-Sprint)

## Résumé

- Pages scannées : 7 (dashboard, children/joueurs, activités/séances, séances, stages, clubs, méthodologie)
- BLOCKER détectés : 3
- WARNING détectés : 5
- Pages conformes : 2 (clubs, stages)

---

## Dérives par page

### /dashboard

🔴 **BLOCKER** — Layout non-conforme au design validé (bento grid)
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
→ Observé : Layout 3-colonnes flex (`Story 67.1`) — colonne gauche 280px / centre flex / droite 240px. Aucune tile hero pleine hauteur avec photo gardien. Fond `#F3EFE7` (correct) mais structure complètement différente du prototype validé.
→ Attendu : Bento grid asymétrique (design-vision.md §Dashboard — 3 colonnes `1.5fr / 1fr / 1.15fr` / 3 rangées / gap 12px / tile hero Col1 rows 1-2 fond `#2A2827` avec photo overlay). Prototype de référence : `_agents/design-references/desktop-admin-bento-v2.html`

⚠️ **WARNING** — Gradient dark sur tile "Prochaine séance"
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx:843`
→ Observé : `linear-gradient(135deg, colors.dark.hover 0%, colors.dark.surface 100%)` sur une tile content (pas la hero) — fond sombre `#2A2A2A → #1A1A1A` sur fond light.
→ Attendu : Fond `colors.light.surface` (`#FFFFFF`) avec `shadows.md` pour les tiles secondaires. Seule la hero tile peut avoir un fond sombre.

---

### /children (Joueurs)

✅ Palette correcte : `rgb(243,239,231)` fond, `rgb(255,255,255)` cards blanches, `rgb(193,172,92)` gold — conforme.
✅ PlayerCard FUT-style : cohérent avec design-vision (Card Joueur pattern, tiers visuels, fond travaillé).
✅ Aucun backdrop-filter détecté.

⚠️ **WARNING** — Couleur hardcodée
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx:1816`
→ Observé : `color: '#FFFFFF'` — icône active vue toggle.
→ Attendu : `colors.text.primary` ou `colors.accent.ivory`

---

### /activites (Séances hub)

✅ Palette correcte, fond beige `#F3EFE7`, cards blanches.
✅ Gradient gold sur stat bar : `linear-gradient(90deg, colors.accent.gold, colors.accent.goldPale)` — conforme.
✅ Aucun backdrop-filter.

---

### /seances

✅ Page conforme visuellement — fond beige, sidebar dark, gold accents.

🔴 **BLOCKER** — Couleurs hardcodées massives dans edit.tsx
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx`
→ Observé : 12 couleurs hex directes : `'#94A3B8'`, `'#92400E'`, `'#DC2626'`, `'#FEE2E2'`, `'#FECACA'`, `'#FEF3C7'`, `'#FDE68A'`, `'#FEF3C7'` — couleurs hors tokens pour états d'erreur et équipe.
→ Attendu : `colors.status.absent` pour rouge erreur, `colors.status.warningBg` pour fond ambre, `colors.border.light` pour FEE2E2 → tokens `@aureak/theme` uniquement.

🔴 **BLOCKER** — Couleurs hardcodées dans les composants séances
→ Fichier : `aureak/apps/web/app/(admin)/seances/_components/YearView.tsx:83-101`
→ Observé : `backgroundColor: '#3B82F6'` (bleu), `'#10B981'` (vert), `'#F59E0B'` (ambre), `'#DC2626'` (rouge) — 4 dots statuts calendrier non-tokenisés.
→ Attendu : `colors.status.info`, `colors.status.success`, `colors.status.warning`, `colors.status.absent`

→ Fichier : `aureak/apps/web/app/(admin)/seances/_components/WeekView.tsx:20-22`
→ Observé : `LOAD_COLOR_LOW = '#10B981'`, `LOAD_COLOR_MEDIUM = '#F59E0B'`, `LOAD_COLOR_HIGH = '#EF4444'` — constantes locales hardcodées.
→ Attendu : `colors.status.success`, `colors.status.warning`, `colors.status.absent`

→ Fichier : `aureak/apps/web/app/(admin)/seances/_components/SessionCard.tsx:177`
→ Observé : `color: '#DC2626'` pour texte "Annulée".
→ Attendu : `colors.status.absent`

---

### /stages

✅ Page conforme — fond `#F3EFE7`, cards blanches, badges statut gold/vert/bleu. Aucun backdrop-filter. Aucune dérive détectée.

---

### /clubs

✅ Page conforme — palette correcte, cards blanches, gold accents. `rgb(209,250,229)` et `rgb(254,226,226)` pour badges statut (mappent sur `colors.status.successBg` et `colors.status.absentBg` — conforme si issus des tokens). Aucun backdrop-filter.

---

### /methodologie

⚠️ **WARNING** — Fond sombre visible sous le ScrollView
→ Fichier : `aureak/apps/web/app/(admin)/methodologie/index.tsx`
→ Observé : La page `ScrollView` a `backgroundColor: colors.light.primary` (`#F3EFE7`) mais le wrapper outer layout (thème dark OS) affiche `rgb(26,26,26)` sur toute la hauteur restante quand le contenu est plus court que le viewport (805px wrapper, 474px content).
→ Attendu : La ScrollView devrait utiliser `flex: 1` + `minHeight: '100%'` ou le contenu doit remplir la hauteur. Alternative : forcer `minHeight: '100vh'` sur le contentContainerStyle.

⚠️ **WARNING** — Typographie Geist persistante (décision Story 45.1 non respectée)
→ Fichiers concernés : 19 fichiers dans `methodologie/` (67 occurrences de `fontFamily: 'Geist, sans-serif'` ou `'Geist Mono, monospace'`)
→ Principaux : `methodologie/themes/[themeKey]/page.tsx`, `sections/SectionPageTerrain.tsx`, `sections/SectionIdentite.tsx`, `sections/SectionEvalVideo.tsx`, `sections/SectionSavoirFaire.tsx`, `sections/SectionSequences.tsx`
→ Aussi dans : `profile/page.tsx`, `users/new.tsx`, `attendance/index.tsx`
→ Observé : `fontFamily: 'Geist, system-ui, sans-serif'` et `fontFamily: 'Geist Mono, monospace'` — ancienne famille
→ Attendu : `fontFamily: 'Montserrat, sans-serif'` (ou `Geist Mono` uniquement pour les chiffres tabulaires `typography.stat` — exception autorisée Story 45.1)

---

## Actions recommandées

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 | /dashboard | `dashboard/page.tsx` | Implémenter le bento grid validé (design-vision.md + prototype HTML) — story dédiée requise |
| P1 | /seances | `seances/[sessionId]/edit.tsx` | Remplacer 12 couleurs hardcodées par tokens `@aureak/theme` |
| P1 | /seances | `seances/_components/YearView.tsx` + `WeekView.tsx` + `SessionCard.tsx` | Remplacer constantes hex par `colors.status.*` |
| P2 | /methodologie | 19 fichiers `methodologie/**` | Migration `Geist → Montserrat` — story nettoyage typographie |
| P2 | /methodologie | `methodologie/index.tsx` | Ajouter `minHeight: '100%'` sur ScrollView contentContainerStyle |
| P3 | /dashboard | `dashboard/page.tsx:843` | Tile "Prochaine séance" — fond dark → `colors.light.surface` |
| P3 | /children | `children/index.tsx:1816` | `'#FFFFFF'` → `colors.text.primary` |

---

## Pages conformes ✅

- `/stages` — aucune dérive détectée
- `/clubs` — aucune dérive détectée
- `/activites` — conforme (gradient gold via tokens, palette correcte)
- `/children` — largement conforme (PlayerCard FUT-style, palette OK, 1 minor warning)
