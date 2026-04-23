# Epic 102 — Formulaires mobile-first

Status: ready-for-dev

## Metadata

- **Epic ID** : 102
- **Nom** : Formulaires mobile-first
- **Scope** : Livrer les primitives de formulaires (layout, inputs touch, wizard multi-step, modals full-screen mobile) qui s'adaptent mobile-first et que toutes les CRUD pages Epic 103 consommeront.
- **Prédécesseurs** : Epic 100 (nav mobile)
- **Source** : Décision produit 2026-04-22. Prérequis technique des CRUD Académie / Prospection / Administration.
- **Durée estimée** : ~5-7 jours dev (4 stories).
- **Out of scope** : application aux formulaires existants (Epic 103), data cards (Epic 101), perf (Epic 104).

## Objectif produit

1. **`<FormLayout />`** — wrapper qui organise labels, champs, erreurs en single-column mobile avec **actions sticky bottom** (boutons Enregistrer/Annuler collés au bas de l'écran), 2 colonnes desktop avec actions inline.
2. **Inputs touch-optimized** — hauteur min 44px, keyboard type adapté (email, tel, numeric, date), autocomplete attributs, focus ring visible.
3. **Multi-step forms mobile** — wizard 1 step = 1 écran avec progression, accordion toutes sections visibles desktop.
4. **Modals → full-screen sheets mobile** — les modals CRUD deviennent full-screen bottom sheets sur mobile (avec handle + close button explicite).

## Stories

- **[102.1](story-102-1-formlayout-wrapper-responsive.md)** — `<FormLayout />` wrapper — single-column mobile + sticky actions (M)
- **[102.2](story-102-2-inputs-touch-optimized.md)** — Inputs touch-optimized (tailles, clavier, autocomplete) (S)
- **[102.3](story-102-3-multi-step-wizard-mobile.md)** — Multi-step forms wizard mobile / accordion desktop (M)
- **[102.4](story-102-4-modals-fullscreen-sheet-mobile.md)** — Modals → full-screen sheets mobile (M)

## Ordre d'implémentation

1. **102.2** (inputs — base de tout formulaire)
2. **102.1** (FormLayout)
3. **102.4** (modals sheets)
4. **102.3** (wizard)

## Risques

| Risque | Mitigation |
|---|---|
| Wizard casse l'UX desktop où tout tient en une page | Détection breakpoint : wizard mobile, accordion desktop, 1 seul composant qui gère les 2 rendus |
| Sticky actions iOS Safari bug (zoom sur focus) | Test explicite iPhone + fix via `scrollIntoView` manuel au focus input |
| Modals full-screen mobile conflit avec drawer nav | Définir z-index strict (cf. Epic 100 risques) + fermer drawer si modal ouvre |

## Références

- Formulaires actuels : `/academie/joueurs/new`, `/academie/coaches/new`, sponsor form modal, ContactForm (prospection), GroupGeneratorModal, etc.
- Modals existants : cf. `components/admin/{partenariat,prospection,clubs}/` — `SponsorFormModal`, `ContactForm`, `GroupGeneratorModal`, etc.
- Package UI : `@aureak/ui`
- React Hook Form + Zod : déjà utilisés dans le projet
