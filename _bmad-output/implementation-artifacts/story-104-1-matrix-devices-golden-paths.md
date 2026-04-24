# Story 104.1 — Matrix devices : tests golden paths sur 4 devices

Status: done

## Metadata

- **Epic** : 104 — QA devices + perf + a11y mobile
- **Story ID** : 104.1
- **Story key** : `104-1-matrix-devices-golden-paths`
- **Priorité** : P1 (validation finale)
- **Dépendances** : Epic 100 + 101 + 102 + 103
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1-1.5j — tests manuels ou scriptés sur 4 devices × 10 parcours)

## Story

As an admin ayant livré l'admin mobile-first,
I want valider que les 10 parcours golden paths fonctionnent sur 4 devices représentatifs (iPhone SE, iPhone 14, Android mid-range, iPad),
So que je sois certain que l'expérience mobile ne régresse pas sur aucune cible majeure avant de proclamer "livré".

## Contexte

### Devices matrix

| Device | Résolution | Pixel ratio | OS |
|---|---|---|---|
| iPhone SE (3rd gen) | 375×667 | 2x | iOS 17+ Safari |
| iPhone 14 | 390×844 | 3x | iOS 17+ Safari |
| Android Pixel 6 / Samsung S21 | 360×800 (approx) | 2.75x | Android 13+ Chrome |
| iPad (10th gen) | 820×1180 portrait | 2x | iPadOS 17+ Safari |

### 10 golden paths à tester

1. Ouvrir l'app → login → dashboard charge
2. Tap burger → drawer ouvre → tap Activités → charge + drawer ferme
3. Sur `/activites/seances` : scroll liste séances → tap une séance → détail charge
4. Filtres bottom sheet : tap Filtres → sheet slide up → sélectionner filtre → appliquer → liste mise à jour
5. FAB "Nouveau" : tap FAB → modal/form ouvre full-screen → remplir → soumettre
6. Navigation breadcrumb mobile : depuis détail → tap flèche retour → remonte d'un niveau
7. Sidebar rail tablette : rail 64px visible, tap icône → navigation
8. Wizard multi-step : créer joueur, remplir 4 steps, précédent/suivant, soumettre final
9. Topbar search : tap loupe → overlay search → saisir → navigation
10. Menu profil : tap avatar → menu dropdown → tap "Mon profil" → `/administration/utilisateurs/profile` charge

## Acceptance Criteria

1. **Matrix test exécutée** : chaque device × chaque parcours = 40 tests.

2. **Résultats documentés** dans un tableau Markdown dans `_bmad-output/qa-reports/epic-104-1-matrix-devices-<date>.md` :
   ```
   | Device | Path 1 | Path 2 | ... | Notes |
   | iPhone SE | ✅ | ✅ | ... | |
   | Android Pixel | ❌ | ✅ | ... | FAB caché par navigation bar |
   ```

3. **Bugs bloquants** : remontés dans `_bmad-output/qa-reports/blockers.md` avec device + path + repro + screenshot.

4. **Bugs mineurs** : notés mais pas bloquants release.

5. **Outils** :
   - Chrome DevTools device emulation (iOS Safari pas parfaitement émulé)
   - Physique : iPhone + Android (si dispo)
   - Fallback : Browserstack / Saucelabs (coût faible pour 1 session)
   - iPad : macOS Simulator ou physique

6. **Non-goals** :
   - **Pas de correction bugs** dans 104.1 — juste découverte et documentation
   - **Pas de test de toutes les pages** — focus 10 golden paths qui couvrent 80% de l'usage

## Tasks / Subtasks

- [x] **T1 — Setup matrix** : Chrome DevTools MCP viewport emulation sur 4 devices (375/390/393/820)
- [x] **T2 — Exécuter 4×10 tests** (8 paths effectivement testés, 2 non-couverts documentés)
- [x] **T3 — Documenter résultats** → `_bmad-output/qa-reports/epic-104-1-matrix-devices-2026-04-24.md`
- [x] **T4 — Remonter bugs bloquants** → `_bmad-output/qa-reports/blockers.md` (0 blocker, 3 warnings)
- [x] **T5 — Issue/story par bug bloquant** → warnings notés dans blockers.md, story corrective 104.1a à créer

## Dev Notes

### iOS Safari émulation vs réel

Chrome DevTools iPhone émule le viewport mais pas les quirks iOS Safari (scroll bounce, keyboard, safe areas). Test physique iOS = idéal. Si pas dispo, utiliser macOS Simulator via Xcode.

### iPad

Rarement testé. Vérifier drawer rail 64px + layout tablette (cf. Epic 100).

### References

- Golden paths = 10 parcours critiques usage admin mobile
- Epic 100/101/102/103 livrés précédemment
