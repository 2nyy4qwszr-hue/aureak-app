# Design Patrol — 2026-04-06

> App status : **200 OK** — app démarrée, Playwright utilisé pour /dashboard (focus story 50-11)
> Analyse mixte : Playwright screenshot + DOM evaluation + lecture statique code
> Screenshot : `_qa/patrol_dashboard.png`

---

## Résumé

- Pages scannées : 7 (dashboard, children, séances, clubs, clubs/[id], évaluations, stages, _layout)
- BLOCKER détectés : **5** (3 nouveaux sur dashboard — story 50-11, 2 déjà connus)
- WARNING détectés : **10** (7 sur dashboard, 3 transversaux)
- Pages conformes : 0 (dérives mineures sur toutes les pages, structure globale respectée)

### Focus story 50-11 — Dashboard refonte layout 3 zones

**BLOCKERS dashboard : 3**
**WARNINGS dashboard : 7**

Le layout 3 zones est structurellement conforme (fond beige #F3EFE7, cards blanches, sidebar dark). Les dérives concernent : la date card (fond dark non validé), les gradients verts hardcodés, et le CountdownTile dark en Zone 3.

---

## Dérives par page

---

### /dashboard — FOCUS story 50-11 (Playwright + analyse statique)

> Playwright screenshot pris — `_qa/patrol_dashboard.png`
> DOM évalué : fond container `colors.light.primary` ✅, 11 cards `.aureak-card` avec `rgb(255,255,255)` ✅, date card `rgb(26,26,26)` = `colors.dark.surface` ⚠️

**Conformités confirmées :**
- ✅ Fond général beige #F3EFE7 (`colors.light.primary`) — conforme
- ✅ Cards KPI blanches (`colors.light.surface`) — conforme
- ✅ Sidebar dark #111111 — conforme
- ✅ Zéro `backdrop-filter` / glassmorphism — conforme
- ✅ Gold accent `#C1AC5C` bien présent sur borders top des tiles — conforme
- ✅ Bento grid 3 colonnes responsive avec breakpoints — conforme
- ✅ Shadows `shadows.sm`/`md` sur cards — conforme

---

#### 🔴 BLOCKER 1 — Date card fond `colors.dark.surface` (#1A1A1A) dans Zone 1 Briefing (non validé)

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — composant `BriefingDuJour`, ligne 187
→ Observé DOM Playwright : `rgb(26, 26, 26)` — confirmé
→ Attendu : `design-vision.md` valide UN SEUL fond sombre = "Hero card background → #2A2827 (brun-gris chaud)". La date card utilise `colors.dark.surface` = `#1A1A1A` (noir pur) qui n'est pas dans la liste des tiles validées. La Zone 1 est une zone briefing lumineuse.
→ Correction : adopter `#2A2827` (cohérent hero) OU fond `colors.light.surface` avec `borderTop: 3px solid gold` (pattern standard). Décision design requise.

#### 🔴 BLOCKER 2 — Gradients verts terrain hardcodés hors tokens (`TERRAIN_GRADIENT` + `ImplantationCard` header)

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — lignes 26 et 638
→ Observé :
  - `const TERRAIN_GRADIENT = 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 60%, #1a472a 100%)'`
  - `background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)'` (ImplantationCard)
→ Attendu : violation CLAUDE.md §2 — styles uniquement via `@aureak/theme`. Ces verts (#1a472a / #1B4332 / #40916C) ne figurent pas dans `tokens.ts`. À extraire vers `colors.terrain.*` dans le theme package.
→ Note visuelle : le vert forêt est cohérent avec l'identité terrain football (design-vision Bloc 1), mais doit passer par un token nommé.

#### 🔴 BLOCKER 3 — `CountdownTile` fond sombre hardcodé en Zone 3 Performance (tiles autorisées = fond blanc)

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ligne 847
→ Observé : `background: 'linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)'`
→ Attendu : Zone 3 "Performance & Gamification" est entièrement en cards blanches. Le CountdownTile est la SEULE tile dark de cette zone, créant une rupture visuelle non cohérente avec `LeaderboardTile`, `AcademyScoreTile`, `StreakTile` (tous blancs). De plus, le gradient hardcode `#1A1A1A` hors token.
→ Correction : soit tokeniser et aligner sur `#2A2827` (seul fond sombre validé), soit adopter fond blanc avec accent gold.

---

#### ⚠️ WARNING 1 — Police `Geist` (body) au lieu de `Montserrat` — 18 occurrences

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — lignes 292, 912, 915, 1149, 1210, 1246, 1253, 1283, 2481, 2505, 2796, 3021, 3054, 3066, 3082, 3095, 3177, 3192
→ Observé : `fontFamily: 'Geist, sans-serif'` / `'Geist, system-ui, sans-serif'` sur le container principal (`S.container`), AnomalyPill, Toast, modals boutons, focus badge, section title reset button
→ Attendu : depuis `design-vision.md` décision Story 45.1, Montserrat remplace Geist pour TOUT le texte UI. `tokens.ts` confirme `body: 'Montserrat'`. `Geist Mono` reste valide pour chiffres tabulaires (`typography.stat`).
→ Impact : l'effet visuel reste acceptable car Geist ≈ Montserrat en apparence, mais c'est une dérive systémique qui se propagera.

#### ⚠️ WARNING 2 — `colors.text.primary` (#FFFFFF blanc) sur surfaces potentiellement claires

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — lignes 651, 1253, 1275, 2750–2761, 3174
→ Observé : `color: colors.text.primary` sur KPI Implantations (fond TERRAIN_GRADIENT vert) et bouton "Marquer résolu" (fond `colors.status.success` = #10B981 émeraude)
→ Attendu : `colors.text.primary = #FFFFFF` est défini "sur fond sombre". Sur fond vert moyen (#2d6a4f ou #10B981), le blanc passe mais reste un risque de contraste insuffisant selon les niveaux WCAG AA. Utiliser `colors.text.dark` (#18181B) pour garantir le contraste.

#### ⚠️ WARNING 3 — 21 erreurs console JS au chargement complet du dashboard

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — multiple useEffect API calls
→ Observé Playwright : 21 erreurs console (0 warnings sur navigation, 21 errors sur screenshot complet)
→ Attendu : 0 erreur console (CLAUDE.md §4). À investiguer — vraisemblablement des rejets API en local (données manquantes) mais pourraient masquer des erreurs UI réelles non guardées.

#### ⚠️ WARNING 4 — `AureakText` absent du dashboard (3200 lignes, 0 occurrences)

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
→ Observé : 0 occurrences de `AureakText` — tous les textes utilisent `<div>` ou `<span>` avec `fontFamily` inline
→ Attendu : `design-vision.md` principe 11 — "Typographie : `AureakText` uniquement". Le composant `AureakText` existe dans `@aureak/ui` et gère les variants `typography.*` automatiquement. Son absence oblige chaque dev à copier-coller les fontSize/fontWeight/fontFamily manuellement.

#### ⚠️ WARNING 5 — `LeaderboardTile` : border manquante sur la card

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — lignes 1804–1811
→ Observé : `LeaderboardTile` n'a pas de `border: 1px solid ${colors.border.light}` — seuls `background`, `borderRadius`, `boxShadow`, `padding`, `minHeight` sont présents
→ Attendu : pattern card standard = `border: 1px solid ${colors.border.light}` (présent sur toutes les autres tiles). La card flotte sans délimitation claire sur fond beige.

#### ⚠️ WARNING 6 — WeatherWidget accent bleu `colors.status.info` (#60A5FA) sur border top

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ligne 1423
→ Observé : `borderTop: 3px solid ${colors.status.info}` → `#60A5FA` (bleu ciel)
→ Attendu : `design-vision.md` "Gold #C1AC5C uniquement" pour accents premium de tiles. Le bleu est un anti-pattern design-vision Aureak Admin. Remplacer par `colors.accent.gold`.

#### ⚠️ WARNING 7 — Sparklines simulées avec données fictives (TODO non résolu)

→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` — lignes 991–999
→ Observé : `// TODO(50.x): remplacer par données historiques réelles depuis l'API` — les sparklines de tous les KPIs sont des données déterministes simulées (fonction `simulateSpark`)
→ Attendu : les sparklines affichent des tendances "fausses" à l'utilisateur. Risque de décision métier basée sur des données inventées. Story de backlog à ouvrir.

---

### /(admin)/children

🔴 **BLOCKER** — Palette avatar hardcodée avec bleu (#3B82F6) et violet (#8B5CF6) comme accents dominants
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx` ligne 100
→ Observé : `const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']`
→ Attendu : Palette limitée aux couleurs du DS — violet (#8B5CF6) et bleu (#3B82F6) sont des anti-patterns pour Aureak Admin (dégradés bleus/violets = BLOCKER design-vision). À remplacer par variantes de gold, beige, terre.
→ Impact : affiché sur TOUS les avatars joueurs dont l'ID tombe dans ces cases (environ 2/7 ≈ 28% des joueurs ont un avatar violet ou bleu)

🔴 **BLOCKER** — Tier pill "Prospect" avec couleur hardcodée grise non-tokenisée ET "Elite" avec fond très sombre `#2A2006`
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx` lignes 26–29
→ Observé :
  - `Prospect` : `bg: '#E8E8E8'`, `textColor: '#555555'`, `borderColor: '#CCCCCC'` — hors tokens
  - `Elite` : `bg: '#2A2006'` — fond quasi-noir sur page light = bascule visuelle choquante
→ Attendu : utiliser `colors.light.muted` / `colors.text.muted` / `colors.border.light` pour Prospect ; pour Elite = fond gold avec texte dark (jamais fond noir sur page beige)

⚠️ **WARNING** — Transition hover manquante sur les cards joueurs en mode liste
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx`
→ Détail : les `Pressable` list items n'ont pas de `transition` CSS déclarée. Seul le `PlayerCard` component l'a peut-être, mais le mode liste utilise des rows RN natifs sans hover state visible.

---

### /(admin)/séances

✅ Import tokens corrects : `colors, space, shadows, radius` depuis `@aureak/theme`.
✅ NavBar et emptyState avec `shadows.sm` conforme.

⚠️ **WARNING** — `fontFamily: 'System'` hardcodé dans clubs/page.tsx (aussi référencé ici via composants partagés)
→ Fichier : `aureak/apps/web/app/(admin)/clubs/page.tsx` ligne 450
→ Observé : `fontFamily: 'System'`
→ Attendu : `fontFamily: 'Montserrat, sans-serif'` ou token typographie

---

### /(admin)/clubs (liste)

✅ Import tokens corrects. Pagination utilise `colors.border.light`, `colors.light.surface`.
✅ `ClubCard` a hover state avec `hovered && s.cardHover`.

🔴 **BLOCKER** — `fontFamily: 'System'` hardcodé sur le composant page principale
→ Fichier : `aureak/apps/web/app/(admin)/clubs/page.tsx` ligne 450
→ Observé : `fontFamily: 'System'` — probablement sur le placeholder search ou un input natif
→ Attendu : `'Montserrat, sans-serif'` — rupture de la cohérence typographique Montserrat (Story 45.1)

⚠️ **WARNING** — Ombre hardcodée non-token sur les cards clubs liste
→ Fichier : `aureak/apps/web/app/(admin)/clubs/page.tsx` ligne 563
→ Observé : `boxShadow: '0 2px 8px rgba(0,0,0,0.10)'`
→ Attendu : `shadows.sm` depuis `@aureak/theme`

⚠️ **WARNING** — Couleur hardcodée `#3d2b00` sur le stat count des ClubCards
→ Fichier : `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` ligne 235
→ Observé : `color: '#3d2b00'` — brun gold foncé commenté "cohérent avec référence visuelle"
→ Attendu : token `colors.accent.gold` dégradé ou `colors.text.dark` — pas de couleur hardcodée même justifiée

---

### /(admin)/clubs/[clubId]

🔴 **BLOCKER** — Accents bleu (#60a5fa) et violet (#a78bfa) utilisés comme couleurs principales de sections
→ Fichier : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` lignes 135–136, 277, 295, 975, 1006, 1015, 1074
→ Observé :
  - `'Stagiaire': '#60a5fa'` (bleu hardcodé)
  - `backgroundColor: '#60a5fa'` (avatar "Joueurs actuellement")
  - `backgroundColor: '#a78bfa'` (avatar "Coachs liés")
  - `accent="#60a5fa"` et `accent="#a78bfa"` passés aux KPI cards
→ Attendu : Utiliser `colors.entity.club` (#60A5FA est déjà un token — mais sa présence comme couleur dominante de section est un anti-pattern design-vision "dégradés bleus = non"). Revoir avec gold ou neutre.
→ Note : `colors.entity.club` = `#60A5FA` dans les tokens — token validé mais l'usage dépasse les badges (KPI accents = trop dominant)

⚠️ **WARNING** — Couleur hardcodée `#3D3420` sur bouton upload logo
→ Fichier : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` ligne 903
→ Observé : `color: logoUploading ? '#9E9E9E' : '#3D3420'`
→ Attendu : `colors.text.dark` / `colors.text.muted`

---

### /(admin)/évaluations

✅ Import tokens corrects.

⚠️ **WARNING** — `backgroundColor: colors.text.dark` utilisé comme fond de chip actif
→ Fichier : `aureak/apps/web/app/(admin)/evaluations/index.tsx` lignes 545–546
→ Observé : `chipActive: { backgroundColor: colors.text.dark, borderColor: colors.text.dark }`
→ Attendu : `colors.accent.gold` ou `colors.dark.surface` — le noir pur `#18181B` comme fond de chip actif sur page beige est visuellement agressif et incohérent avec la DA Light Premium

⚠️ **WARNING** — Constante `PLAYER_B_COLOR = '#3B82F6'` hardcodée pour comparaison joueurs
→ Fichier : `aureak/apps/web/app/(admin)/evaluations/comparison/page.tsx` ligne 17
→ Observé : bleu Tailwind `#3B82F6` pour le joueur B dans la vue comparaison
→ Attendu : utiliser `colors.entity.club` (token existant pour bleu) ou `colors.status.info`

---

### /(admin)/stages

⚠️ **WARNING** — Couleurs statut `#4ade80` (vert) et `#f87171` (rouge) hardcodées
→ Fichier : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` lignes 26–28
→ Observé : `en_cours: '#4ade80'`, `annulé: '#f87171'`
→ Attendu : `colors.entity.stage` (#4ADE80 est déjà un token) et `colors.status.absent` / `colors.accent.red`

→ Fichier : `aureak/apps/web/app/(admin)/stages/index.tsx` ligne 132
→ Observé : `backgroundColor: '#FEF2F2'` pour errorBox
→ Attendu : pattern token — pas de couleur de fond d'erreur hardcodée

---

### /(admin)/_layout (sidebar)

✅ Sidebar dark `colors.background.primary` (#1A1A1A) conforme.
✅ Gold stripe top `colors.accent.gold` conforme.
✅ `themeColors` hook correctement implémenté pour contenu principal.
✅ Console guards `process.env.NODE_ENV !== 'production'` présents sur tous les catch.

---

### Résultats grep transversaux

**backdrop-filter** : **Aucune occurrence** — conforme, zéro glassmorphism détecté. ✅

**border-radius > 24px (excessif)** : Aucun radius > 24px détecté. `borderRadius: 12` est le maximum observé en dehors des cercles d'avatars (50%). ✅

**Couleurs `#334155` (dark blue slate)** :
→ Fichier : `aureak/apps/web/app/(admin)/exports/index.tsx` lignes 152–153
→ Observé : `border: '1px solid #334155'` sur select et input — couleur slate-700 hors-tokens
→ Attendu : `colors.border.light` ou `colors.border.dark`

**Violet `#6366f1` (indigo) dans méthodologie** :
→ Fichier : `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/SectionCriteres.tsx` lignes 69–71
→ Observé : `backgroundColor: '#6366f115'`, `color: '#6366f1'`, `border: '1px solid #6366f140'`
→ Attendu : utiliser `colors.accent.gold` ou token méthodologie dédié — l'indigo/violet est un anti-pattern design-vision Aureak

---

## Actions recommandées

### Dashboard — story 50-11 (BLOCKERs prioritaires)

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 — BLOCKER | /dashboard | `dashboard/page.tsx` l.187 | Date card `colors.dark.surface` → décision design : `#2A2827` (cohérent hero) ou fond blanc + gold border |
| P1 — BLOCKER | /dashboard | `dashboard/page.tsx` l.26 + 638 | Extraire `TERRAIN_GRADIENT` et gradient ImplantationCard header vers tokens `colors.terrain.*` dans `@aureak/theme` |
| P1 — BLOCKER | /dashboard | `dashboard/page.tsx` l.847 | `CountdownTile` gradient dark → tokeniser `#2A2827` (seul fond sombre validé) ou basculer en fond blanc |
| P2 — WARNING | /dashboard | `dashboard/page.tsx` ×18 | `'Geist, sans-serif'` → `'Montserrat, sans-serif'` (remplacement global via grep/replace) |
| P2 — WARNING | /dashboard | `dashboard/page.tsx` l.1423 | `colors.status.info` WeatherWidget border → `colors.accent.gold` |
| P2 — WARNING | /dashboard | `dashboard/page.tsx` l.1804 | Ajouter `border: 1px solid ${colors.border.light}` à `LeaderboardTile` |
| P3 — WARNING | /dashboard | `dashboard/page.tsx` l.991 | TODO sparklines → ouvrir story pour API données historiques |

### Transversal — dérives hors dashboard

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 — BLOCKER | /children | `children/index.tsx` l.100 | Remplacer palette avatars — supprimer `#8B5CF6` et `#3B82F6`, garder gold/terres/verts |
| P1 — BLOCKER | /children | `children/index.tsx` l.29 | Pill Elite `#2A2006` → gold ; Pill Prospect → `colors.light.muted` |
| P1 — BLOCKER | /clubs/[clubId] | `clubs/[clubId]/page.tsx` l.975–1015 | Accents KPI bleu `#60a5fa` / violet `#a78bfa` trop dominants → gold ou neutre |
| P1 — BLOCKER | /clubs | `clubs/page.tsx` l.450 | `fontFamily: 'System'` → `'Montserrat, sans-serif'` |
| P2 — WARNING | /methodologie/themes | `SectionCriteres.tsx` l.69 | `#6366f1` indigo → gold ou token `colors.methodology.criteria` |
| P2 — WARNING | /evaluations | `evaluations/index.tsx` l.545 | `chipActive.backgroundColor: colors.text.dark` → `colors.accent.gold` |
| P2 — WARNING | /clubs | `clubs/page.tsx` l.563 | Shadow hardcodée → `shadows.sm` |
| P2 — WARNING | /exports | `exports/index.tsx` l.152 | Border `#334155` → `colors.border.light` |
| P2 — WARNING | /stages | `stages/[stageId]/page.tsx` l.26 | `#4ade80` → `colors.entity.stage` ; `#f87171` → `colors.accent.red` |

---

## Pages conformes ✅

Aucune page n'est 100% conforme — mais les dérives sont **contenues et corrigeables** :
- La structure globale (fond beige, sidebar dark, gold accent) est respectée partout.
- Zéro glassmorphism, zéro `backdrop-filter` détecté.
- Zéro `border-radius > 24px` détecté.
- Toutes les pages importent `@aureak/theme` tokens.
- Console guards bien présents dans `_layout.tsx` et pages principales.

---

## Top 3 dérives les plus critiques

### 1. Date card `colors.dark.surface` (#1A1A1A) dans Zone 1 Briefing — /dashboard

→ Page : `/dashboard`
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` (ligne 187, `BriefingDuJour`)
→ Pourquoi critique : confirmé Playwright DOM. Fond quasi-noir #1A1A1A posé directement sur le fond beige #F3EFE7 de Zone 1. Rupture visuelle immédiate au chargement de la page la plus visitée. Non répertorié dans les tiles validées de `design-vision.md` — seul le Hero tile `#2A2827` est autorisé en fond sombre. C'est le premier élément que l'admin voit chaque matin.

### 2. Palette avatar violette/bleue sur /children — 28% des joueurs

→ Page : `/(admin)/children`
→ Fichier : `aureak/apps/web/app/(admin)/children/index.tsx` (ligne 100, `const COLORS`)
→ Pourquoi critique : violet `#8B5CF6` et bleu `#3B82F6` sont des anti-patterns absolus design-vision Aureak Admin ("dégradés violets/bleus = BLOCKER"). Environ 2 joueurs sur 7 affichent un avatar bleu ou violet. L'annuaire joueurs est une page centrale du workflow quotidien admin.

### 3. Gradients verts terrain hardcodés dans le dashboard (hors tokens `@aureak/theme`)

→ Page : `/dashboard`
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` (lignes 26 et 638)
→ Pourquoi critique : double violation — CLAUDE.md §2 (styles hors tokens) ET risque de dérive "cheap/inachevé" identifié par design-vision. Le vert forêt (#1a472a / #2d6A4f / #40916C) est visuellement cohérent avec l'identité terrain mais non tokenisé, ce qui rend impossible la cohérence future si le design terrain évolue. Le TERRAIN_GRADIENT est également réutilisé en KPI card "Implantations" (ligne 2755).

---

## Statut conformité globale

| Critère design-vision | Statut |
|----------------------|--------|
| Fond beige #F3EFE7 (light.primary) | ✅ Conforme |
| Cards blanches #FFFFFF | ✅ Conforme |
| Sidebar dark #111111 | ✅ Conforme |
| Gold #C1AC5C uniquement (accent) | ⚠️ Partiel — bleu info sur WeatherWidget |
| Zéro backdrop-filter / glassmorphism | ✅ Conforme |
| Zéro border-radius > 24px | ✅ Conforme |
| Zéro gradient violet/bleu | ⚠️ Partiel — bleu sur WeatherWidget |
| Police Montserrat unique | ⚠️ Partiel — Geist body sur 18 occurrences dashboard |
| Shadows tokens (sm/md/lg) | ✅ Conforme (sauf LeaderboardTile border manquante) |
| Tokens `@aureak/theme` exclusivement | 🔴 3 gradients hardcodés (terrain + countdown) |

---

*Rapport généré le 2026-04-06 — Design Patrol autonome*
*App : http://localhost:8081 — 200 OK — Playwright actif*
*Focus : story 50-11 dashboard refonte layout 3 zones*
