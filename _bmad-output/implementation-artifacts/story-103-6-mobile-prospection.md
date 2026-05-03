# Story 103.6 — Prospection mobile-first (9 pages)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.6
- **Story key** : `103-6-mobile-prospection`
- **Priorité** : P2
- **Dépendances** : Epic 100 + 101 + 102 · Epic 97.4/97.11 (déjà mergés)
- **Effort estimé** : L (~1.5j — 9 pages CRM)

## Story

As un commercial ou admin sur le terrain,
I want que les 9 pages Prospection (hub, clubs/gardiens/entraineurs × liste/détail, attribution, ressources) s'adaptent mobile-first,
So que je puisse consulter les pipelines et ajouter/éditer un prospect depuis mon téléphone en déplacement.

## Contexte

Pages (post-Epic 97.4) :
- `/prospection` — hub
- `/prospection/{clubs,gardiens,entraineurs}` — 3 listes
- `/prospection/{clubs,entraineurs}/[id]` — 2 détails
- `/prospection/gardiens/ajouter` — formulaire
- `/prospection/attribution`
- `/prospection/ressources`

## Acceptance Criteria

1. **Hub `/prospection`** : cartes pipelines → stack mobile, grid desktop.

2. **3 listes** (clubs, gardiens, entraîneurs) :
   - DataCard prospects
   - FilterSheet : statut pipeline, commercial assigné, période
   - FAB "+ Nouveau" contextuel

3. **2 pages détail** (club, entraîneur) :
   - Layout sections (infos, historique contact, notes) stack mobile
   - Actions : édition, reassign, changement status → menus ou ResponsiveModal

4. **Formulaire ajouter gardien** (`/prospection/gardiens/ajouter`) :
   - FormWizard (102.3) multi-step mobile
   - FormLayout single-column + sticky actions

5. **Attribution** (`/prospection/attribution`) :
   - Outil admin, accès mobile acceptable mais non prioritaire
   - Layout scrollable adapté

6. **Ressources** : simple DataCard.

7. **ProspectionNavBar (3 tabs)** : déjà scrollable post-100.2.

8. **Tokens `@aureak/theme` uniquement**.

9. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

10. **Test Playwright** :
    - Viewport 375×667 sur 9 URLs
    - Test scenario mobile : ouvrir détail gardien → consulter → retour liste

11. **Non-goals** :
    - **Pas de refonte CRM logic** (pipelines, statuts)
    - **Pas de nouveau composant métier**

## Tasks / Subtasks

- [ ] **T1 — Hub** (AC #1)
- [ ] **T2 — 3 listes** (AC #2)
- [ ] **T3 — 2 détails** (AC #3)
- [ ] **T4 — Formulaire ajouter gardien** (AC #4)
- [ ] **T5 — Attribution + Ressources** (AC #5, #6)
- [ ] **T6 — QA** (AC #8-10)

## Dev Notes

- Pages : `app/(admin)/prospection/**/*`
- Composants : `components/admin/prospection/{ProspectionNavBar,AdminFilters,ClubCard,ContactForm,...}`

## References

- Epic 97.4 (migration URL)
- Epic 97.11 (template)
- Stories 100/101/102
