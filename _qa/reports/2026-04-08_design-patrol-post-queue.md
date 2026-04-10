# Design Patrol — 2026-04-08 (post-queue)

> Mode : **Playwright live** (APP_STATUS=200, PLAYWRIGHT_STATUS=ready) — APP_URL=http://localhost:8082
> Scope : pages admin (dashboard, children, seances, stages, clubs, methodologie, profile)
> Référence : `_agents/design-vision.md` — 12 principes, 6 anti-patterns BLOCKER

---

## Résumé

- Pages scannées : 7 (live Playwright)
- BLOCKER détectés : 4
- WARNING détectés : 6
- Pages conformes : 3 (stages, methodologie hub, seances liste)

---

## Dérives par page

### /dashboard

🔴 **BLOCKER** — Bento grid absent : layout flex au lieu de grid CSS
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
→ Observé (Playwright) : `gridCount: 0` — la page utilise exclusivement `display: flex` avec `className="dashboard-3col"`. Aucun `display: grid` dans le DOM. La tile hero col1 (fond `#2A2827`, photo gardien, gradient overlay) est absente.
→ Attendu : `display: grid`, `gridTemplateColumns: '1.5fr 1fr 1.15fr'`, `gridTemplateRows: '1fr 1fr 0.75fr'`, gap 12px — prototype validé `desktop-admin-bento-v2.html`
→ Principe(s) violé(s) : #2 (bento cards), #10 (home screen DLS)

---

### /profile

🔴 **BLOCKER** — Erreur API critique : colonne `profiles.avatar_url` inexistante
→ Fichier : `aureak/apps/web/app/(admin)/profile/page.tsx`
→ Observé (Playwright console) : `[admin-profile] getAdminProfile profile error: {code: 42703, message: column profiles.avatar_url does not exist}` — 4 requêtes en 400. Page rendue partiellement avec avatar fallback orange et données manquantes.
→ Attendu : Zéro erreur console. Le schéma DB ne contient pas `avatar_url` dans `profiles` — la requête `select=user_id,tenant_id,display_name,avatar_url,created_at` est invalide.
→ Sévérité montée à BLOCKER car bloque l'affichage des données profil

---

### /analytics

🔴 **BLOCKER** — Couleur bleue hardcodée `#3B82F6` et ambre `#F59E0B` hors tokens
→ Fichier : `aureak/apps/web/app/(admin)/analytics/page.tsx`
→ Observé : `const CHARGE_AMBER = '#F59E0B'` et `const CLUBS_BLUE = '#3B82F6'` — bleu = anti-pattern absolu
→ Attendu : `colors.accent.gold` ou token neutre pour la section Clubs, `colors.status.attention` pour Charge

---

### /implantations

🔴 **BLOCKER** — Dégradé vert hardcodé `#1a472a` hors palette + `#FFFFFF` hardcodé
→ Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`
→ Observé : `background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)'` (l. 296) + `color: '#FFFFFF'` (l. 303, 311, 329, 332, 335, 337)
→ Attendu : Token terrain ou `TERRAIN_GRADIENT_DARK` depuis `@aureak/theme`, `colors.text.primary` pour le texte

---

### /children

⚠️ **WARNING** — Couleurs hardcodées `rgba(80,80,80,0.75)` et `rgba(10,10,10,0.90)` sur les cards joueurs
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx` (l. 747, 756, 765, 771)
→ Observé : Styles `infoLabel`, `infoLabelCenter`, `infoValue`, `infoSubLabel` utilisent des rgba hardcodés au lieu de `colors.text.muted`, `colors.text.primary`, `colors.text.subtle`
→ Attendu : Utiliser les tokens `@aureak/theme` existants

⚠️ **WARNING** — `rgba(212,175,55,0.30)` hardcodé dans `clubLogoFallback` (l. 733)
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx`
→ Observé : Couleur gold personnalisée non-token. Le gold officiel est `colors.accent.gold` = `#C1AC5C`
→ Attendu : `colors.accent.gold + '4D'` ou token `colors.accent.goldLight`

---

### /seances/[sessionId]/edit

⚠️ **WARNING** — 7 couleurs hardcodées hors tokens (persistant)
→ Fichier : `aureak/apps/web/app/(admin)/seances/[sessionId]/edit.tsx`
→ Observé : `'#94A3B8'`, `'#DC2626'`, `'#FEE2E2'`, `'#FECACA'`, `'#FEF3C7'`, `'#FDE68A'`, `'#92400E'`
→ Attendu : `colors.accent.red`, `colors.status.errorBg`, `colors.status.warningBg`, `colors.text.subtle`

---

### /attendance

⚠️ **WARNING** — Typographie Geist résiduelle
→ Fichier : `aureak/apps/web/app/(admin)/attendance/index.tsx` (l. 471)
→ Observé : `fontFamily: 'Geist, sans-serif'` dans `webInputStyle`
→ Attendu : `fontFamily: 'Montserrat, sans-serif'` (Story 45.1)

---

### /methodologie/themes/[themeKey]

⚠️ **WARNING** — Typographie Geist sur pages thèmes (violation Story 45.1)
→ Fichier : `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` + sections
→ Observé : `fontFamily: 'Geist, sans-serif'` sur 15+ occurrences
→ Attendu : `fontFamily: 'Montserrat, sans-serif'` (Geist Mono uniquement pour chiffres tabulaires)

---

### /users/new

⚠️ **WARNING** — Typographie Geist résiduelle
→ Fichier : `aureak/apps/web/app/(admin)/users/new.tsx` (l. 667, 759, 774, 826)
→ Observé : `fontFamily: 'Geist, sans-serif'` sur 4 occurrences
→ Attendu : `fontFamily: 'Montserrat, sans-serif'`

---

### /partnerships

⚠️ **WARNING** — Couleur bleue dans chip stat
→ Fichier : `aureak/apps/web/app/(admin)/partnerships/index.tsx` (l. 191)
→ Observé : `backgroundColor: 'rgba(59,130,246,0.15)'` — bleu hors palette
→ Attendu : `colors.border.light` ou token neutre

---

### /stages ✅

Aucune dérive détectée — tokens respectés, fond `#F3EFE7`, cards blanches, layout conforme. Confirmé Playwright live.

### /methodologie (hub) ✅

Aucune dérive détectée — fond `colors.light.primary`, barre progression gold, cards blanches conformes. Confirmé Playwright live.

### /seances (liste principale) ✅

Aucune dérive détectée — fond correct, filtres/pills conformes, overlay modale `rgba(0,0,0,0.5)` acceptable. Confirmé Playwright live.

---

## Observations Playwright live complémentaires

| Page | Observation | Statut |
|------|-------------|--------|
| Dashboard | Fond `rgb(243,239,231)` = `#F3EFE7` ✅ Sidebar `rgb(26,26,26)` ✅ No backdrop-filter ✅ No topbar ✅ | Fond OK |
| Children | Cards joueurs : border-radius 55px sur avatar (cercle 110×110 — intentionnel) ✅ | Acceptable |
| Clubs | Cards clubs : border-radius 24px max ✅ No gradient ✅ No backdrop-filter ✅ | Conforme |
| Seances | Shadows cards : `rgba(0,0,0,0.06) 0px 1px 2px` — légères (tokens.sm = acceptable) ✅ | Conforme |
| Profile | 10 erreurs console — `profiles.avatar_url` colonne inexistante 🔴 | BLOCKER |

---

## Actions recommandées

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 | /profile | `profile/page.tsx` | Supprimer `avatar_url` de la requête profiles ou migrer le schéma |
| P1 | /analytics | `analytics/page.tsx` | Remplacer `#3B82F6` par token neutre, `#F59E0B` par `colors.status.attention` |
| P1 | /implantations | `implantations/index.tsx` | Remplacer gradient `#1a472a` + `#FFFFFF` hardcodés par tokens |
| P1 | /dashboard | `dashboard/page.tsx` | Implémenter le bento grid CSS (Epic 42) |
| P2 | /children | `children/index.tsx` | Remplacer `rgba(80,80,80,*)`, `rgba(10,10,10,*)`, `rgba(212,175,55,*)` par tokens |
| P2 | /seances/edit | `seances/[sessionId]/edit.tsx` | Remplacer 7 couleurs hardcodées par tokens |
| P3 | /methodologie/themes | `themes/[themeKey]/page.tsx` | Geist → Montserrat (Story 45.1) |
| P3 | /attendance | `attendance/index.tsx` | Geist → Montserrat dans webInputStyle |
| P3 | /users/new | `users/new.tsx` | Geist → Montserrat (4 occurrences) |
| P3 | /partnerships | `partnerships/index.tsx` | `rgba(59,130,246,0.15)` → `colors.border.light` |

---

## Blockers à signaler pour Morning Brief

1. **Profile `/profile`** — API error 400 `profiles.avatar_url does not exist` — page cassée en prod
2. **Dashboard `/dashboard`** — bento grid absent (flex au lieu de grid CSS) — prototype validé non implémenté depuis Epic 42
3. **Analytics `/analytics`** — couleur bleue `#3B82F6` = anti-pattern absolu
4. **Implantations `/implantations`** — gradient vert hors palette + `#FFFFFF` hardcodés

---

*Audit Playwright live — APP_STATUS=200. Scan réalisé le 2026-04-08.*
