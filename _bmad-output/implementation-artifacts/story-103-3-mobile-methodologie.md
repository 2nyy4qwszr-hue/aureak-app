# Story 103.3 — Méthodologie mobile-first (5 pages)

Status: ready-for-dev

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.3
- **Story key** : `103-3-mobile-methodologie`
- **Priorité** : P2 (desktop-prioritaire mais responsive nécessaire)
- **Dépendances** : Epic 100 + 101 · Epic 93.5 (template déjà appliqué)
- **Effort estimé** : L (~1.5j — 5 pages dont StatsHero sparkline)

## Story

As an admin consultant la bibliothèque pédagogique,
I want que les 5 pages Méthodologie (entraînements, programmes, thèmes, situations, évaluations) s'adaptent mobile-first,
So que je puisse au moins consulter la bibliothèque pédagogique depuis mon téléphone (même si l'édition reste desktop-first).

## Contexte

Pages :
- `/methodologie/seances` — entraînements + StatsHero
- `/methodologie/programmes`
- `/methodologie/themes`
- `/methodologie/situations`
- `/methodologie/evaluations`

## Acceptance Criteria

1. **Page entraînements** (`/methodologie/seances`) :
   - StatsHero : hero card + cards stack mobile, grid desktop
   - DataCard entraînements
   - FilterSheet : méthode (7 méthodes)
   - FAB "+ Nouvel entraînement"

2. **4 autres pages** (programmes, themes, situations, evaluations) :
   - Même pattern : header v2, DataCard, FilterSheet, FAB si applicable
   - Contenu simplifié, pas de StatsHero

3. **MethodologieHeader (nav secondaire 5 tabs)** : déjà scrollable horizontal post-100.2.

4. **Fiches détail** (ex. thème détail `/methodologie/themes/[themeKey]`) :
   - Layout adapté : contenu scrollable, actions sticky ou menu dropdown mobile
   - Modals édition → ResponsiveModal (102.4)

5. **Éditeurs complexes** (ex. TacticalEditor dans situations) :
   - Si pas réalisable mobile → afficher message "Édition disponible en version desktop" avec CTA lien
   - Consultation (lecture seule) possible mobile

6. **Tokens `@aureak/theme` uniquement**.

7. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

8. **Test Playwright** :
   - Viewport 375×667 sur 5 URLs : DataCard stackée, FAB visible
   - Fiche détail consultable

9. **Non-goals** :
   - **Pas de refonte éditeurs complexes** (tactical editor, etc.) — desktop-only acceptable
   - **Pas de refonte data flow**

## Tasks / Subtasks

- [ ] **T1 — Entraînements + StatsHero** (AC #1)
- [ ] **T2 — 4 autres pages** (AC #2)
- [ ] **T3 — Fiches détail** (AC #4)
- [ ] **T4 — Fallback éditeurs** (AC #5)
- [ ] **T5 — QA** (AC #6-8)

## Dev Notes

- Pages : `app/(admin)/methodologie/**/*`
- Composants : `components/admin/methodologie/{MethodologieHeader,...}`
- Fiches détail existantes : `themes/[themeKey]`, `situations/[situationKey]`, `programmes/[programmeId]`

## References

- Epic 93 (template Méthodologie déjà mergé)
- Stories 100/101/102
