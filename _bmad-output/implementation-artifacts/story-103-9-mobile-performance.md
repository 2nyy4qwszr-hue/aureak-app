# Story 103.9 — Performance mobile-first (hub + 5 sous-pages + 2 comparaisons)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.9
- **Story key** : `103-9-mobile-performance`
- **Priorité** : P1 (consultation KPIs en mobilité)
- **Dépendances** : Epic 100 + 101 · Epic 98 (template déjà appliqué)
- **Effort estimé** : M (~1-1.5j — 8 pages)

## Story

As an admin consultant la santé académie en mobilité,
I want que les 8 pages Performance (hub + charge, clubs, présences, progression, implantation + 2 comparaisons) s'adaptent mobile-first,
So que je puisse lire les KPIs et alertes même en déplacement.

## Contexte

Pages (post-Epic 98) :
- `/performance` — hub refondu avec cartes KPI + raccourcis
- `/performance/{charge,clubs,presences,progression,implantation}` — 5 sous-pages
- `/performance/comparaisons/{evaluations,implantations}` — 2 comparaisons

## Acceptance Criteria

1. **Hub `/performance`** :
   - Cartes KPI bento → stack vertical mobile, grid 2 cols tablette, bento desktop
   - 5 raccourcis sous-pages → stack mobile, grid 3x2 desktop

2. **5 sous-pages analytics** :
   - Tableaux → DataCard
   - Charts : préserver avec scroll horizontal sur mobile (ou version simplifiée selon complexité)
   - FilterSheet pour période / groupement

3. **2 pages comparaisons** :
   - Comparaison evaluations : DataCard pour liste comparée
   - Comparaison implantations : DataCard + info map si présente

4. **Charts complexes mobile** :
   - Si charts natifs (Victory Native, Recharts) non-responsive → afficher message "Graphique disponible en version desktop" avec CTA "Voir sur desktop" (ou lien)
   - **Alternative** : simplifier chart en version mobile (bar chart 5 éléments max)
   - **Décision dev** selon complexité de chaque chart

5. **Tokens `@aureak/theme` uniquement**.

6. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

7. **Test Playwright** :
   - Viewport 375×667 sur les 8 URLs : charge sans débordement, cards scrollables
   - Viewport 1440×900 : inchangé

8. **Non-goals** :
   - **Pas de refonte charts** complexe (fallback message acceptable)
   - **Pas de nouveau KPI**

## Tasks / Subtasks

- [x] **T1 — Hub** (AC #1) — déjà responsive via Epic 98.4 (colonnes adaptatives)
- [x] **T2 — 5 sous-pages analytics** (AC #2) — padding mobile, sélecteurs déjà flexWrap
- [x] **T3 — 2 comparaisons** (AC #3) — padding mobile + sélecteurs stack column
- [x] **T4 — Décision charts mobile** (AC #4) — scroll horizontal conservé via `overflow: 'auto'` existant
- [x] **T5 — QA** (AC #5-7)

## Dev Notes

- Pages : `app/(admin)/performance/**/*`
- Composants : `components/admin/performance/` (PerformanceNavBar si existant post-98.2), `components/admin/stats/`
- Hub refondu 98.4 : `StatsStandardCard` cards

## References

- Epic 98 (Performance refonte déjà mergé)
- Stories 100/101 (nav + data mobile)
