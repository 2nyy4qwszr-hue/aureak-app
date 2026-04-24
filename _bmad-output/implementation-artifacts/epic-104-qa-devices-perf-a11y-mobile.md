# Epic 104 — QA devices + perf + a11y mobile

Status: ready-for-dev

## Metadata

- **Epic ID** : 104
- **Nom** : QA devices + perf + a11y mobile
- **Scope** : Valider empiriquement que l'admin mobile-first (Epics 100-103) fonctionne sur un échantillon représentatif d'appareils réels, atteint la cible de performance (Lighthouse mobile 85+), respecte les standards d'accessibilité touch (WCAG AA, touch targets 44px).
- **Prédécesseurs** : Epics 100 + 101 + 102 + 103
- **Source** : Décision produit 2026-04-22 — validation finale avant proclamer "admin mobile-first livré".
- **Durée estimée** : ~3-5 jours dev (3 stories).
- **Out of scope** : corrections UI profondes découvertes à ce stade (reportées en stories 103.X.a ou post-Epic 103).

## Objectif produit

1. **Matrix devices testée** : iPhone SE (petit écran), iPhone 14 (standard), Android Pixel/Samsung mid-range, iPad (tablette). Chaque device teste ~10 golden paths.
2. **Lighthouse mobile 85+** sur les 5 pages les plus consultées (dashboard, activités, performance, académie, prospection).
3. **A11y mobile** : touch targets ≥ 44×44px partout, contrastes WCAG AA, focus visible au clavier (y compris Bluetooth mobile), gestures (swipe close bottom sheet).

## Stories

- **[104.1](story-104-1-matrix-devices-golden-paths.md)** — Matrix devices tests golden paths (M)
- **[104.2](story-104-2-lighthouse-perf-mobile.md)** — Lighthouse perf mobile + optim images/bundle (M)
- **[104.3](story-104-3-a11y-touch-targets-gestures.md)** — A11y mobile : touch targets + contrastes + gestures (S)

## Ordre d'implémentation

1. **104.1** (découvre les bugs à corriger en premier)
2. **104.2** (perf — une fois bugs UI corrigés)
3. **104.3** (a11y — passe finale)

## Risques

| Risque | Mitigation |
|---|---|
| Découvertes bloquantes (ex. drawer cassé sur Android < 8) | Ouvrir stories correctives post-103 ; ne pas les fusionner dans 104 |
| Lighthouse 85+ pas atteignable sans lazy images | Story 104.2 inclut lazy loading + bundle splitting |
| Matrix devices : pas de physique dispo | Utiliser Browserstack / Saucelabs en fallback (coût faible) ou Chrome DevTools device emulation + iPhone via macOS Simulator |

## Références

- Targets Lighthouse : Performance 85+, Accessibility 95+, Best Practices 90+, SEO pas critique admin
- WCAG AA : contraste 4.5:1 texte, 3:1 UI components
- Touch target : Apple HIG 44×44, Material Design 48×48
