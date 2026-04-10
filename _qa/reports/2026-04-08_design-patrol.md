# Design Patrol — 2026-04-08

## Résumé

- Pages scannées : 7 (dashboard, children, seances/activites, methodologie, stages, clubs, presences)
- Mode analyse : **statique** (APP_STATUS=000 — app non démarrée, Playwright skipped)
- BLOCKER détectés : 11
- WARNING détectés : 11
- Pages conformes : 2 (stages, clubs)

---

## Contexte de la patrouille

Analyse statique complète de `aureak/apps/web/app/(admin)/` + `aureak/packages/ui/`.
Référentiel : `_agents/design-vision.md` — 12 principes, 6 anti-patterns, palette `#F0EBE1` / `#FFFFFF` / `#C1AC5C`.
Décision typographie validée Story 45.1 : **Montserrat uniquement** (Geist Mono réservé `typography.stat`).

---

## Dérives par page

### /dashboard

🔴 **BLOCKER** — Card "GESTION DU JOUR" fond dark (`colors.dark.surface`) dans zone light
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx:179`
→ Observé : `backgroundColor: colors.dark.surface` (#1A1A1A) — fond dark sur card principale zone light
→ Attendu : Pattern "hero dark card" explicitement décidé (Story 50-11) — décision d'acceptation requise

🔴 **BLOCKER** — Gradient dark card "Prochaine séance" dans zone light
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx:842`
→ Observé : `linear-gradient(135deg, colors.dark.hover 0%, colors.dark.surface 100%)`
→ Attendu : Même statut — pattern hero intentionnel ou correction vers card gold accent

🔴 **BLOCKER** — Couleurs `'#FFFFFF'` hardcodées inline
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes 3142, 3145
→ Observé : `color: '#FFFFFF'` en style inline JSX direct
→ Correction : `color: colors.text.primary`

⚠️ **WARNING** — Concaténations hex sur tokens couleur (anti-pattern fragile)
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes 263, 264, 974
→ Observé : `colors.accent.gold + '1f'`, `colors.accent.gold + '40'`, `colors.accent.gold + '14'`
→ Correction : `colors.border.gold` / `colors.border.goldBg` selon contexte

⚠️ **WARNING** — KPIs vides sans CTA (W-PATROL-03 persistant)
→ Fichier : `dashboard/page.tsx`
→ Observé : "Taux de présence", "Taux de maîtrise" sans action possible si vide
→ Attendu : Lien vers création de séance ou message d'onboarding

---

### /children (Joueurs)

🔴 **BLOCKER** — Cards joueurs fond JPEG dark dans zone light (décision design requise)
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx:503-508`
→ Observé : Background image JPEG sombre FIFA-style sur cards 280×420px
→ Attendu : Pattern cohérent vision "premium gaming" — décision acceptation/dérogation requise

⚠️ **WARNING** — Couleurs `'#fff'` / `'#FFFFFF'` hardcodées
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx` lignes 132, 462, 1823
→ Correction : `colors.dark.text` (token blanc existant)

⚠️ **WARNING** — `rgba(212,175,55,0.30)` hardcodé (or inline)
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx:733`
→ Correction : `colors.border.goldBg` ou `colors.accent.gold + '4D'`

---

### /seances (Hub + Detail)

🔴 **BLOCKER** — Header dark `#1A1A1A` hardcodé dans fiche séance
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx:56`
→ Observé : `const HEADER_BG = '#1A1A1A'` — couleur non-token utilisée ligne 166
→ Correction : `colors.dark.surface` (token existant)

🔴 **BLOCKER** — Badge statut `#6366F1` (violet/indigo) hardcodé dans présences séance
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx:694`
→ Observé : `trial: { bg: '#6366F1' + '40', text: '#4F46E5', label: '👀 Essai' }`
→ Violation : dégradé violet/bleu = anti-pattern BLOCKER absolu charte
→ Correction : `colors.status.info` (bleu token validé) ou `colors.accent.gold`

⚠️ **WARNING** — Nombreux hex hardcodés présence statuts (`#10B981`, `#F59E0B`, `#E05252`, etc.)
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` lignes 322–323, 690–695, 733, 908, 989–1010
→ Observé : statuts de présence utilisent des hex directs au lieu de `colors.status.*`
→ Correction : `colors.status.present` / `colors.status.attention` / `colors.status.absent`

⚠️ **WARNING** — Couleurs hardcodées dans composants séances (`SessionCard`, `WeekView`, `WorkshopBlockEditor`)
→ Fichiers :
  - `_components/SessionCard.tsx:177` — `color: '#DC2626'`
  - `_components/WeekView.tsx:20-22` — `LOAD_COLOR_LOW/MEDIUM/HIGH` hex directs
  - `_components/WorkshopBlockEditor.tsx:276` — `#FCA5A5`, `#FEF2F2`
→ Correction : tokens `colors.status.absent`, `colors.status.present`, `colors.status.attention`

---

### /activites (Présences + Evaluations)

🔴 **BLOCKER** — Card "Tendance Globale" fond dark dans zone light
→ Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx:154,184-185`
→ Observé : `cardDark.backgroundColor: colors.dark.surface` — #1A1A1A dans liste stat cards light
→ Correction : Card light + accent gold `borderColor: colors.accent.gold`

🔴 **BLOCKER** — Heatmap présences avec 5 couleurs hex hardcodées
→ Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx:67-71`
→ Observé : `#22c55e`, `#eab308`, `#f97316`, `#ef4444` inline
→ Correction : `colors.status.present` / `colors.status.attention` / `colors.status.absent`

🔴 **BLOCKER** — Couleur `#6e5d14` hardcodée (card Tendance Gold)
→ Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx:205-207`
→ Observé : `backgroundColor: '#6e5d14'` / `borderColor: '#6e5d14'`
→ Correction : `colors.accent.goldDark` (token existant)

🔴 **BLOCKER** — Police `Manrope` dans evaluations (violation décision Story 45.1)
→ Fichier : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
→ Lignes : 139, 759, 794, 800 — `fontFamily: 'Manrope'`
→ Correction : `fontFamily: 'Montserrat'` sur les 4 occurrences

🔴 **BLOCKER** — Badge violet `#7C3AED` hardcodé dans evaluations
→ Fichier : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx:387`
→ Observé : `badgeColor="#7C3AED"` — violet pur exclu de la charte Aureak
→ Correction : `colors.status.warningBg` (ambre) ou suppression badge "Record"

⚠️ **WARNING** — `GeistMono` sur sous-labels textuels dans StatCards
→ Fichier : `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx:236,245`
→ Observé : `fontFamily: 'GeistMono'` dans `statSub`, `statSubGreen` (labels non-tabulaires)
→ Correction : `fontFamily: 'Montserrat'` + `fontWeight: '500'`

⚠️ **WARNING** — `rgba(193,172,92,0.5)` hardcodé (presences + evaluations)
→ Fichiers : `presences/page.tsx:244`, `evaluations/page.tsx`
→ Observé : gold semi-transparent en dur (commentaire interne documente même le token correct)
→ Correction : `colors.border.goldSolid`

⚠️ **WARNING** — Badge "+12%" statique (valeur fictive) dans presences
→ Fichier : `aureak/apps/web/app/(admin)/activites/presences/page.tsx:162`
→ Observé : chiffre en dur, potentiellement trompeur
→ Correction : calculer via `stats` ou supprimer

⚠️ **WARNING** — Shadow hardcodée non-token dans FiltresScope
→ Fichier : `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx:269`
→ Observé : `boxShadow: '0 8px 24px rgba(0,0,0,0.12)'`
→ Correction : `shadows.lg`

---

### /methodologie

⚠️ **WARNING** — `Geist, sans-serif` utilisé dans plusieurs sections (violation typographie Montserrat)
→ Fichiers :
  - `methodologie/themes/[themeKey]/sections/SectionBadge.tsx:32,123,204,226`
  - `methodologie/themes/[themeKey]/sections/SectionSequences.tsx:33,42,210,349`
  - `methodologie/themes/[themeKey]/sections/SectionSavoirFaire.tsx:25,34,183,250`
→ Correction : `fontFamily: 'Montserrat, sans-serif'`

⚠️ **WARNING** — Couleurs badges tier hardcodées (Bronze/Argent/Élite/Master)
→ Fichier : `methodologie/themes/[themeKey]/sections/SectionBadge.tsx:16-20`
→ Observé : `'#CD7F32'`, `'#A8A9AD'`, `'#4FC3F7'`, `'#CE93D8'` — tokens `gamification.tiers.*` existent
→ Correction : utiliser `gamification.tiers.bronze.color`, `gamification.tiers.argent.color`, etc.

---

### /stages

✅ Page conforme.
- Fond : `colors.light.primary`
- Cards : tokens corrects
- Status badges via tokens `colors.accent.gold`, `colors.text.muted`, `colors.accent.red`

---

### /clubs

✅ Page conforme.
- Fond principal : `colors.light.surface`
- Cards : tokens corrects, filtres tokenisés

---

## Résumé des BLOCKERs

| ID | Description | Page | Fichier | Statut |
|----|-------------|------|---------|--------|
| B-DS-01 | Card "GESTION DU JOUR" fond dark zone light | `/dashboard` | `dashboard/page.tsx:179` | Connu Story 50-11, décision requise |
| B-DS-02 | Gradient dark card "Prochaine séance" | `/dashboard` | `dashboard/page.tsx:842` | Connu Story 50-11, décision requise |
| B-DS-03 | `'#FFFFFF'` hardcodé inline | `/dashboard` | `dashboard/page.tsx:3142,3145` | À corriger |
| B-DS-04 | Cards joueurs FIFA fond JPEG dark | `/children` | `children/index.tsx:503` | Décision design requise |
| B-DS-05 | `HEADER_BG = '#1A1A1A'` hardcodé | `/seances/[id]` | `seances/[sessionId]/page.tsx:56` | À corriger |
| B-DS-06 | Badge `#6366F1` violet/indigo (statut "essai") | `/seances/[id]` | `seances/[sessionId]/page.tsx:694` | BLOCKER absolu — violet interdit |
| B-DS-07 | Card "Tendance Globale" fond dark zone light | `/activites/presences` | `presences/page.tsx:154` | Persistant patrol 04-07 |
| B-DS-08 | Heatmap présences 5 hex hardcodés | `/activites/presences` | `presences/page.tsx:67-71` | À corriger |
| B-DS-09 | `#6e5d14` hardcodé card Tendance Gold | `/activites/presences` | `presences/page.tsx:205-207` | À corriger |
| B-DS-10 | Police `Manrope` (4 occurrences) | `/activites/evaluations` | `evaluations/page.tsx:139,759,794,800` | Violation Story 45.1 |
| B-DS-11 | Badge `#7C3AED` violet (anti-pattern absolu) | `/activites/evaluations` | `evaluations/page.tsx:387` | BLOCKER absolu — violet interdit |

## Résumé des WARNINGs

| ID | Description | Page | Fichier | Statut |
|----|-------------|------|---------|--------|
| W-DS-01 | Concaténations hex gold | `/dashboard` | `dashboard/page.tsx:263,264,974` | Nouveau |
| W-DS-02 | KPIs vides sans CTA | `/dashboard` | `dashboard/page.tsx` | Persistant |
| W-DS-03 | `'#fff'` hardcodé | `/children` | `children/index.tsx:132,462,1823` | Persistant |
| W-DS-04 | `rgba(212,175,55,0.30)` hardcodé | `/children` | `children/index.tsx:733` | Persistant |
| W-DS-05 | Hex statuts présence hardcodés | `/seances/[id]` | `seances/[sessionId]/page.tsx:322-1010` | À corriger |
| W-DS-06 | Hex dans composants séances | `/seances` | `SessionCard/WeekView/WorkshopBlockEditor` | À corriger |
| W-DS-07 | `GeistMono` sur labels textuels | `/activites` | `StatCards.tsx:236,245` | Persistant |
| W-DS-08 | `rgba(193,172,92,0.5)` hardcodé | `/activites` | `presences/page.tsx:244` | Persistant |
| W-DS-09 | Badge "+12%" statique | `/activites/presences` | `presences/page.tsx:162` | Persistant |
| W-DS-10 | Shadow non-token FiltresScope | `/activites` | `FiltresScope.tsx:269` | Persistant |
| W-DS-11 | `Geist, sans-serif` dans methodologie sections | `/methodologie` | `SectionBadge/Sequences/SavoirFaire.tsx` | Nouveau |

---

## Actions prioritaires

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 | `/activites/evaluations` | `evaluations/page.tsx:387` | `#7C3AED` → `colors.status.warningBg` — BLOCKER absolu violet |
| P1 | `/seances/[id]` | `seances/[sessionId]/page.tsx:694` | `#6366F1` → `colors.status.info` — BLOCKER absolu violet |
| P1 | `/activites/evaluations` | `evaluations/page.tsx:139,759,794,800` | `Manrope` → `Montserrat` (4 occurrences) |
| P1 | `/activites/presences` | `presences/page.tsx:67-71` | Heatmap hex → `colors.status.*` |
| P1 | `/activites/presences` | `presences/page.tsx:154,205-207` | cardDark + `#6e5d14` → card gold accent + `colors.accent.goldDark` |
| P2 | `/seances/[id]` | `seances/[sessionId]/page.tsx:56` | `'#1A1A1A'` → `colors.dark.surface` |
| P2 | `/dashboard` | `dashboard/page.tsx:3142,3145` | `'#FFFFFF'` → `colors.text.primary` |
| P2 | `/seances` | `SessionCard.tsx:177`, `WeekView.tsx:20-22` | Hex statuts → `colors.status.*` |
| P2 | `/methodologie` | `SectionBadge/Sequences/SavoirFaire.tsx` | `Geist` → `Montserrat` |
| P3 | `/activites` | `StatCards.tsx:236,245` | `GeistMono` → `Montserrat` pour labels textuels |
| P3 | `/activites` | `FiltresScope.tsx:269` | Shadow inline → `shadows.lg` |
| P3 | `/children` | `children/index.tsx:132,462,1823` | `'#fff'` → `colors.dark.text` |
| P3 (décision) | `/dashboard`, `/children` | — | Valider pattern "hero dark card" dans zone light (Story 50-11 + FIFA-card) |

---

## Pages conformes ✅

- `/stages` — aucune dérive détectée
- `/clubs` — aucune dérive majeure
