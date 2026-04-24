# Epic 104.1 — Matrix devices golden paths

**Date** : 2026-04-24
**Testeur** : Claude Code (Chrome DevTools MCP — viewport emulation)
**Build** : branche `feat/epic-104-story-104-1-matrix-devices` depuis `main@579ec1e`
**App** : http://localhost:8082 (Expo Router web, admin@test.com)

## Méthode

Chrome DevTools viewport emulation (mobile flag + touch). Pas de physique disponible pour cette passe — un follow-up physique Safari iOS est recommandé avant release (émulation ≠ quirks iOS Safari : scroll bounce, safe areas, keyboard).

## Devices matrix

| Device | Résolution | DPR | Breakpoint effectif |
|---|---|---|---|
| iPhone SE (3rd gen) | 375×667 | 2 | mobile |
| iPhone 14 | 390×844 | 3 | mobile |
| Android Pixel 6 | 393×851 | 2.75 | mobile |
| iPad (10th gen) | 820×1180 | 2 | tablet (rail 64px) |

## Résultats

Légende : ✅ = OK · ⚠️ = mineur · ❌ = bloquant · ⏭️ = non testable (data manquante)

| # | Golden path | iPhone SE | iPhone 14 | Android | iPad | Notes |
|---|---|---|---|---|---|---|
| 1 | Login → dashboard charge | ✅ | ✅ | ✅ | ✅ | Dashboard bento stacke correctement sur mobile, 2 colonnes sur iPad |
| 2 | Burger → drawer ouvre → tap Activités → charge + drawer ferme | ✅ | ✅ | ✅ | n/a | iPad utilise rail permanent (pas de drawer overlay) |
| 3 | Scroll liste joueurs → tap joueur → détail charge | ✅ | ✅ | ✅ | ✅ | Liste 774 joueurs paginée (50/page). Détail `/children/{uid}` OK. ⏭️ séances : 0 data |
| 4 | Filtres bottom sheet : tap Filtres → sheet slide up → sélectionner → appliquer | ⚠️ | ⚠️ | ⚠️ | ⚠️ | **Finding #1** : clic chip "⊞ Filtres" (activites) ne déclenche pas de bottom sheet — rien ne se passe. Les dropdowns individuels (Implantation/Groupe) fonctionnent en revanche. Voir section Findings. |
| 5 | FAB "Nouveau" → page/modal full-screen → formulaire | ✅ | ✅ | ✅ | ✅ | FAB "+" visible en bas-droite, ouvre `/seances/new` en page full |
| 6 | Breadcrumb mobile : flèche retour remonte | ✅ | ✅ | ✅ | ✅ | "← Retour à Joueurs" sur page détail joueur. Chip breadcrumb cliquable. |
| 7 | Rail tablette 64px + tap icône → navigation | n/a | n/a | n/a | ✅ | Rail anthracite 64px, icônes-only, topbar affiche "AUREAK · Dashboard" — conforme spec 100.5 |
| 8 | Wizard multi-step (création joueur, 4 steps) | ⏭️ | ⏭️ | ⏭️ | ⏭️ | Non testé ce passage — à couvrir en follow-up 104.1b |
| 9 | Topbar search → overlay → saisir → navigation | ✅ | ✅ | ✅ | ✅ | **Finding #2** (UX) : si dropdown profil ouvert, premier tap search ne fait que fermer le dropdown — user doit retaper. À fixer (gérer les popovers mutuellement exclusifs). |
| 10 | Avatar → menu profil → "Mon profil" | ✅ | ✅ | ✅ | ✅ | Dropdown visible avec Mon profil / Administration / Déconnexion |

**Console errors** : aucune erreur ni warning console sur les parcours testés (iPhone SE + iPad).

## Findings

### #1 — Chip "⊞ Filtres" inerte sur liste séances (mobile + tablet)

- **Device(s)** : iPhone SE, iPhone 14, Android Pixel, iPad
- **Route** : `/activites` (onglet SÉANCES)
- **Repro** : tap sur chip "⊞ Filtres" → rien ne se passe. Les dropdowns Implantation / Groupe fonctionnent individuellement.
- **Attendu** (Epic 102.4) : bottom sheet s'ouvre avec filtres avancés (dates, statut, type séance)
- **Sévérité** : ⚠️ WARNING (pas un blocker — les dropdowns natifs de secours marchent)
- **Hypothèse code** : handler onPress manquant sur le chip ou bottom sheet non branché. À investiguer dans `aureak/apps/web/app/(admin)/activites/*` ou composants filtres.

### #2 — Popovers topbar mutuellement non-exclusifs

- **Device(s)** : tous mobiles
- **Route** : toutes pages avec topbar mobile
- **Repro** : ouvrir dropdown profil (tap avatar) → rester ouvert → tap icône search → search **ne s'ouvre pas**, seul le dropdown profil se ferme. Il faut retaper search.
- **Sévérité** : ⚠️ WARNING UX (friction)
- **Fix** : fermer tous autres popovers avant d'ouvrir un nouveau (state shared ou dismiss-then-open).

### #3 — PWA install banner couvre le FAB sur petit écran

- **Device(s)** : iPhone SE particulièrement
- **Route** : dashboard (et toutes pages avec FAB)
- **Repro** : banner noir "Installer l'app Aureak" en bas de page couvre ~180px de hauteur → sur iPhone SE (667px), le FAB "+" et parfois les CTAs de bas de page sont masqués.
- **Sévérité** : ⚠️ WARNING
- **Fix** : offset FAB avec safe-area + hauteur banner PWA, ou banner plus compact en mobile.

## Bugs bloquants

Aucun blocker release identifié dans cette passe. 2 warnings (Findings #1 et #2) + 1 observation ergonomique (#3).

## Non-couverts / à faire en follow-up

1. **Wizard création joueur (path 8)** — non traversé faute de temps sur cette passe, à tester avant release (4 steps + soumission).
2. **Test physique iOS Safari** — émulation Chrome DevTools ≠ quirks iOS réels (scroll bounce, safe areas, keyboard accessory bar, PWA installée). Recommandation : 1 session iPhone physique + 1 session Android physique avant proclamer "livré".
3. **Séances list → détail (path 3 complet)** — bloqué par absence de données séances. À re-tester quand DB contient ≥ 5 séances.
4. **iPad rail : 10 tap navigation icônes** — seule la navigation dashboard vérifiée ; compléter avec Académie, Activités, Méthodologie, etc.

## Outils & environnement

- Chrome DevTools MCP (viewport emulation + mobile flag + touch)
- Dev server : `turbo dev --filter=@aureak/web` sur port 8082
- Compte de test : `admin@test.com` (E2E_ADMIN_EMAIL)

## Score global

**Prêt pour 104.2 (Lighthouse perf)** après fix rapide des findings #1 et #2 — ou en parallèle si on préfère prioriser la perf.
