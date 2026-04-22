# Story 98.2 — Template + titres sur les 5 pages Performance

Status: done

## Metadata

- **Epic** : 98 — Performance refonte
- **Story ID** : 98.2
- **Story key** : `98-2-template-performance-5-pages`
- **Priorité** : P1
- **Dépendances** : **97.3** (AdminPageHeader v2) + **98.1** (migration URL)
- **Source** : Audit UI 2026-04-22. Uniformisation template zone Performance.
- **Effort estimé** : M (~4-5h — 5 pages à adapter + éventuelle nav secondaire)

## Story

As an admin,
I want que les 5 pages Performance (charge, clubs, présences, progression, implantation) utilisent le template `<AdminPageHeader />` v2 avec titre = sous-section active et que la navigation entre elles soit cohérente,
So that la zone Performance est visuellement uniforme avec les autres zones admin.

## Contexte

### Pages cibles après 98.1

- `/performance/charge` — charge par coach
- `/performance/clubs` — analytics clubs
- `/performance/presences` — analytics présences
- `/performance/progression` — progression joueurs
- `/performance/implantation` — analytics implantations

### Titres

| URL | Titre |
|---|---|
| `/performance/charge` | "Charge coaches" |
| `/performance/clubs` | "Clubs" |
| `/performance/presences` | "Présences" |
| `/performance/progression` | "Progression" |
| `/performance/implantation` | "Implantations" |

### Nav secondaire

Pas de `PerformanceNavBar` existant à date. 2 options :
- **A** : Créer une nav secondaire de 5 onglets (pattern Activités/Méthodologie) — cohérent, mais travail supplémentaire
- **B** : Ne pas créer de nav secondaire, chaque page autonome — plus simple, mais navigation moins fluide

**Recommandation** : **A** si le scope reste maîtrisé (1-2h de plus). Sinon **B** et reporter A en story séparée.

## Acceptance Criteria

1. **Page `/performance/charge`** : `<AdminPageHeader title="Charge coaches" />`, retrait eyebrow/subtitle custom.

2. **Page `/performance/clubs`** : title "Clubs" (attention : différent de `/academie/clubs` qui est l'annuaire ; ici c'est analytics perf clubs).

3. **Page `/performance/presences`** : title "Présences" (différent de `/activites/presences`).

4. **Page `/performance/progression`** : title "Progression".

5. **Page `/performance/implantation`** : title "Implantations" (différent de `/academie/implantations`).

6. **Nav secondaire `PerformanceNavBar`** (optionnel selon recommandation) :
   - Composant dans `aureak/apps/web/components/admin/performance/PerformanceNavBar.tsx`
   - 5 onglets : Charge · Clubs · Présences · Progression · Implantations
   - Détection active via `usePathname()`
   - Counts optionnels via Context layout
   - Si non implémenté dans cette story, documenter décision en dev notes

7. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Retirer headers custom inline
   - Grep hex → 0 match

8. **try/finally + console guards**.

9. **Data** : api-client uniquement. Les fonctions analytics existent déjà (probablement dans `@aureak/api-client/admin/analytics/*`), les conserver telles quelles.

10. **Conformité CLAUDE.md** : tsc OK, tokens, Expo Router patterns.

11. **Test Playwright** :
    - 5 URLs chargent avec bon titre
    - Si nav secondaire : onglet actif correct
    - Console zéro erreur
    - Screenshots

12. **Non-goals explicites** :
    - **Pas de refonte des visualisations** (charts, tableaux) — juste header + cleanup
    - **Pas de migration URL** (98.1)
    - **Pas de refonte hub** (98.4)

## Tasks / Subtasks

- [ ] **T1 — Charge** (AC #1)
- [ ] **T2 — Clubs** (AC #2)
- [ ] **T3 — Présences** (AC #3)
- [ ] **T4 — Progression** (AC #4)
- [ ] **T5 — Implantation** (AC #5)
- [ ] **T6 — Nav secondaire (optionnel)** (AC #6)
  - [ ] Décider A/B, implémenter si A
- [ ] **T7 — Cleanup + QA** (AC #7-11)

## Dev Notes

### Distinguer contextes nommage similaires

Attention aux confusions utilisateur :
- `/performance/clubs` (analytics) ≠ `/academie/clubs` (annuaire) ≠ `/partenariat/clubs` (partenaires)
- `/performance/presences` (KPIs globaux) ≠ `/activites/presences` (opérationnel coach)
- `/performance/implantation` (analytics) ≠ `/academie/implantations` (liste)

Les titres doivent être **contextuels** mais éviter les confusions. Si le titre "Clubs" seul est ambigu, considérer "Performance clubs" ou "Analytics clubs" pour disambigüation.

**Décision recommandée** : garder titres courts ("Clubs", "Présences") — le contexte de zone (Performance) est indiqué par la sidebar. Si confusion utilisateur rapportée → pivoter titres contextuels.

### Pattern de référence

Activités + Méthodologie post-97.3.

### References

- Pages (post-98.1) : `app/(admin)/performance/`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
- Lib : `lib/admin/analytics/` (ou `performance/` si renommé en 98.1)
