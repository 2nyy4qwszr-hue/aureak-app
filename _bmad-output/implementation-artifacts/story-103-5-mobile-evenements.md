# Story 103.5 — Événements mobile-first (hub + 5 sous-pages)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.5
- **Story key** : `103-5-mobile-evenements`
- **Priorité** : P2
- **Dépendances** : Epic 100 + 101 + 102 · Epic 97.10 (restructuration déjà appliquée)
- **Effort estimé** : M (~1j — 6 pages)

## Story

As an admin,
I want que les 6 pages Événements (hub + 5 types : stages, tournois, fun-days, detect-days, séminaires) s'adaptent mobile-first,
So que je puisse consulter planning événements depuis le terrain.

## Contexte

Pages (post-Epic 97.10) :
- `/evenements` — hub vue d'ensemble
- `/evenements/{stages,tournois,fun-days,detect-days,seminaires}` — 5 sous-pages

## Acceptance Criteria

1. **Hub `/evenements`** : 5 cartes type avec count → stack mobile, grid desktop.

2. **5 sous-pages** :
   - DataCard événements par type
   - FilterSheet : statut (planifié/terminé/annulé), période, implantation
   - FAB "+ Nouvel événement" contextualisé au type

3. **Détail événement** : via modal ou page. Si modal → ResponsiveModal (102.4).

4. **EvenementsHeader (5 tabs)** : déjà scrollable horizontal post-100.2.

5. **Tokens `@aureak/theme` uniquement**.

6. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

7. **Test Playwright** :
   - Viewport 375×667 sur 6 URLs
   - Nav secondaire scrollable
   - FAB fonctionnel

8. **Non-goals** :
   - **Pas de refonte fonctionnelle** (création événements flow inchangé)

## Tasks / Subtasks

- [ ] **T1 — Hub** (AC #1)
- [ ] **T2 — 5 sous-pages** (AC #2)
- [ ] **T3 — Détail événement** (AC #3)
- [ ] **T4 — QA** (AC #5-7)

## Dev Notes

- Pages : `app/(admin)/evenements/**/*`
- Composants : `components/admin/evenements/{EvenementsContent,EvenementsHeader}`

## References

- Epic 97.10 (restructuration déjà mergée)
