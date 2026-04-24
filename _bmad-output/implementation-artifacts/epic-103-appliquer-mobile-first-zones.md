# Epic 103 — Appliquer mobile-first aux 10 zones admin

Status: ready-for-dev

## Metadata

- **Epic ID** : 103
- **Nom** : Appliquer mobile-first aux 10 zones admin
- **Scope** : Décliner les primitives mobile-first (Epic 100 nav + Epic 101 data + Epic 102 forms) sur chaque zone admin. 1 story par zone, ordre par usage mobile réel.
- **Prédécesseurs** : Epic 100 + Epic 101 + Epic 102
- **Source** : Décision produit 2026-04-22.
- **Durée estimée** : ~15-20 jours dev (10 stories, efforts S/M/L).
- **Out of scope** : création de nouvelles features (juste adaptation responsive), refonte design system (tokens inchangés), QA matrix devices (Epic 104).

## Objectif produit

Toutes les pages admin (~70 pages) s'adaptent automatiquement au breakpoint actif :
- **Mobile** (< 640) : stack cards, filtres bottom sheet, FAB, actions sticky, wizard multi-step
- **Tablette** (640-1024) : layout intermédiaire (2 cols + drawer nav)
- **Desktop** (> 1024) : layout actuel préservé

## Ordre d'implémentation (par usage mobile réel)

Raison : prioriser les zones consultées en mobilité (dashboard/KPI → consultation) avant les zones CRUD (édition mobile rare).

| Rang | Story | Zone | Usage mobile |
|---|---|---|---|
| 1 | **[103.1](story-103-1-mobile-dashboard.md)** | **Dashboard** | ⭐⭐⭐ consultation rapide (KPIs bento) |
| 2 | **[103.2](story-103-2-mobile-activites.md)** | **Activités** | ⭐⭐⭐ pouls terrain (séances jour) |
| 3 | **[103.9](story-103-9-mobile-performance.md)** | **Performance** | ⭐⭐⭐ KPIs hub + sous-pages consultation |
| 4 | **[103.10](story-103-10-mobile-administration.md)** | **Administration** | ⭐⭐ tickets/messages (notifs mobile) |
| 5 | **[103.8](story-103-8-mobile-partenariat.md)** | **Partenariat** | ⭐⭐ consultation sponsors/clubs |
| 6 | **[103.7](story-103-7-mobile-marketing.md)** | **Marketing** | ⭐⭐ médiathèque (upload mobile) |
| 7 | **[103.3](story-103-3-mobile-methodologie.md)** | **Méthodologie** | ⭐ bibliothèque pédagogique (desktop prioritaire) |
| 8 | **[103.5](story-103-5-mobile-evenements.md)** | **Événements** | ⭐ planning événements (consultation) |
| 9 | **[103.6](story-103-6-mobile-prospection.md)** | **Prospection** | ⭐ CRM (édition rare mobile) |
| 10 | **[103.4](story-103-4-mobile-academie.md)** | **Académie** | ⭐ CRUD joueurs/coaches (édition rare mobile) |

## Stories (listes détaillées dans les fichiers individuels)

- **[103.1](story-103-1-mobile-dashboard.md)** — Dashboard responsive (bento → stack) (M)
- **[103.2](story-103-2-mobile-activites.md)** — Activités (3 pages) (M)
- **[103.3](story-103-3-mobile-methodologie.md)** — Méthodologie (5 pages) (L)
- **[103.4](story-103-4-mobile-academie.md)** — Académie (10 pages) (L)
- **[103.5](story-103-5-mobile-evenements.md)** — Événements (6 pages) (M)
- **[103.6](story-103-6-mobile-prospection.md)** — Prospection (9 pages) (L)
- **[103.7](story-103-7-mobile-marketing.md)** — Marketing (5 pages) (M)
- **[103.8](story-103-8-mobile-partenariat.md)** — Partenariat (3 pages) (S)
- **[103.9](story-103-9-mobile-performance.md)** — Performance (hub + 5 + 2 comparaisons) (M)
- **[103.10](story-103-10-mobile-administration.md)** — Administration (hub + 15 pages) (L)

## Principes d'exécution

- **Aucun changement fonctionnel** — 100% adaptation layout responsive.
- **Réutiliser Epic 100/101/102** — pas de composants custom par zone (sauf si nécessaire et justifié).
- **Conformité CLAUDE.md** maintenue : tokens, try/finally, console guards, api-client.
- **QA Playwright viewport** 375×667 (iPhone SE) + 768×1024 (iPad) + 1440×900 (desktop) sur chaque story.
- **Commit par story** avec message `feat(epic-103-<N>): mobile-first <zone>`.

## Risques

| Risque | Mitigation |
|---|---|
| Chaque zone a ses spécificités (maps, charts, editors complexes) | Accepter que certains composants restent desktop-only (ex. TacticalEditor, ImplantationMap) et afficher un message "Disponible en version desktop" sur mobile |
| Drift entre zones (chacune implémente différemment) | Revue croisée : toutes les stories référencent `DataCard`, `FilterSheet`, `FormLayout` explicitement |
| Scope explosion — une zone prend 2x prévu | Découper en story 103.X.a/b si besoin (ex. Académie liste + détail séparés) |

## Références

- Composants livrables Epic 100 : drawer, topbar mobile, nav secondaires scrollables
- Composants livrables Epic 101 : `DataCard`, `FilterSheet`, FAB, infinite scroll, states
- Composants livrables Epic 102 : `FormLayout`, inputs, wizard, modals sheets
- Breakpoints : `< 640 | 640-1024 | > 1024`
