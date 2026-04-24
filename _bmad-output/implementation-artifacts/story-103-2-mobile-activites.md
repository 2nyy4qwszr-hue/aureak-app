# Story 103.2 — Activités mobile-first (3 pages)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.2
- **Story key** : `103-2-mobile-activites`
- **Priorité** : P1
- **Dépendances** : Epic 100 + 101 + 102
- **Effort estimé** : M (~1-1.5j — 3 pages + intégration composants)

## Story

As an admin,
I want que les 3 pages Activités (séances, présences, évaluations) s'adaptent mobile-first — DataCard stack, FilterSheet bottom sheet, FAB pour action primaire —,
So que je puisse consulter le pouls du terrain et gérer les séances/présences depuis mon téléphone.

## Contexte

Pages :
- `/activites` (hub = séances)
- `/activites/presences`
- `/activites/evaluations`

`ActivitesHeader` (nav secondaire 3 tabs) déjà adapté en 100.2.

## Acceptance Criteria

1. **Page séances** (`/activites`) :
   - `<DataCard />` pour la liste des séances
   - `<FilterSheet />` pour filtres (période, coach, implantation, statut)
   - `<PrimaryAction label="Nouvelle séance" />` → FAB mobile / header desktop
   - States loading/empty/error

2. **Page présences** (`/activites/presences`) :
   - Tableau présences → cards mobile (date + coach + taux %)
   - FilterSheet pour période / implantation
   - Export CSV conservé mais accessible via menu mobile

3. **Page évaluations** (`/activites/evaluations`) :
   - Tableau évaluations → cards mobile
   - FilterSheet pour période / type
   - Détail évaluation : navigation vers modal (ResponsiveModal 102.4) ou page détail

4. **Tokens `@aureak/theme` uniquement**.

5. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

6. **Test Playwright** :
   - Viewport 375×667 sur 3 pages : DataCard cards stackées, tap Filtres → sheet slide up, FAB bas-droite
   - Viewport 1440×900 : layout inchangé, tables classiques

7. **Non-goals** :
   - **Pas de modification logique métier** (filtres / tri / export inchangés)
   - **Pas de nouveau KPI ou visualisation**

## Tasks / Subtasks

- [x] **T1 — Page séances** (AC #1)
- [x] **T2 — Page présences** (AC #2)
- [x] **T3 — Page évaluations** (AC #3)
- [x] **T4 — QA** (AC #4-6)

## Dev Notes

- Pages : `app/(admin)/activites/{page,presences/page,evaluations/page}.tsx`
- Composants Activités : `components/admin/activites/{ActivitesHeader,ActivitesToolbar,TableauSeances,...}`

## References

- Story 100.2 (nav secondaire scrollable)
- Story 101.1 (DataCard)
- Story 101.2 (FilterSheet)
- Story 101.3 (FAB)
