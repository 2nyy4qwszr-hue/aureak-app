# Story 103.1 — Dashboard mobile-first (bento → stack responsive)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.1
- **Story key** : `103-1-mobile-dashboard`
- **Priorité** : P1 (zone la plus consultée en mobilité)
- **Dépendances** : Epic 100 + 101
- **Effort estimé** : M (~1j — adaptation layout bento existant)

## Story

As an admin consultant ses KPIs en mobilité,
I want que le dashboard bento admin s'adapte — cartes empilées verticalement sur mobile, grille 2-col tablette, bento 3-4 col desktop —,
So que je puisse consulter l'essentiel des KPIs académie d'un coup d'œil sur mon téléphone.

## Contexte

Page : `/dashboard` — bento layout validé (référence MEMORY.md `project_design_dashboard.md`). Contient ~8-12 cartes KPI (présence moyenne, séances du jour, etc.).

## Acceptance Criteria

1. **Layout responsive** :
   - Mobile (< 640) : cartes `width: 100%` stack vertical
   - Tablette (640-1024) : grid 2 colonnes
   - Desktop (> 1024) : bento existant inchangé

2. **Ordre des cartes mobile** : prioriser les KPIs les plus utiles (présence moyenne, séances du jour, alertes) en haut ; reporter les cartes secondaires en bas.

3. **Cartes individuelles** : chaque card adapte son padding et sa typo (titre +, stat énorme 48px mobile au lieu de 72px desktop).

4. **Topbar + sidebar** : consomme les composants Epic 100 (drawer, topbar compact).

5. **Tokens `@aureak/theme` uniquement** — 0 hex.

6. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

7. **Test Playwright** :
   - Viewport 375×667 : dashboard cartes stackées, sidebar fermée
   - Viewport 768×1024 : grid 2 cols
   - Viewport 1440×900 : bento inchangé

8. **Non-goals** :
   - **Pas de changement de data** (KPIs affichés identiques)
   - **Pas de nouveau KPI**

## Tasks / Subtasks

- [x] **T1 — Audit layout dashboard actuel**
- [x] **T2 — Media queries responsive** (via `useWindowDimensions`)
- [x] **T3 — Ordre cartes mobile**
- [x] **T4 — Adaptation taille cartes**
- [x] **T5 — QA** (Playwright 3 viewports)

## Dev Notes

- Page : `app/(admin)/dashboard/index.tsx` (et `page.tsx`)
- Composants cartes : probablement dans `components/admin/dashboard/` ou `stats/`
- Réutilise `<StatsStandardCard>` et `<StatsHero>` existants

## References

- MEMORY.md — règle "pas de topbar dashboard"
- Référence visuelle bento validée : image utilisateur 2026-04-22
- Composants stats : `components/admin/stats/`
