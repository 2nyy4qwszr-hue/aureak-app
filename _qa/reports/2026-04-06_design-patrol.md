# Design Patrol — 2026-04-06

> App status : **SKIPPED — app non démarrée** (curl → code 000). Analyse 100% statique via lecture de code.
> Relancer avec `cd aureak && npx turbo dev --filter=web`

---

## Résumé

- Pages scannées (statique) : 7 (dashboard, children, séances, clubs, clubs/[id], évaluations, stages, _layout)
- BLOCKER détectés : **4**
- WARNING détectés : **9**
- Pages conformes : **0** (dérives mineures sur toutes les pages auditées)

---

## Dérives par page

---

### /dashboard

✅ Structure globale conforme : HeroBand `#2A2827` (token HERO_BG), fond bento `#F0EBE1`, cards blanches, shadows tokens.

⚠️ **WARNING** — Couleurs hardcodées terrain non-tokenisées
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes 27–28
→ Observé : `const HERO_BG = '#2A2827'` et `const TERRAIN_GRADIENT = 'linear-gradient(135deg, #1a472a ...'`
→ Attendu : Constantes locales acceptables (commentées comme telles) mais idéalement à ajouter dans `@aureak/theme` tokens pour cohérence future.

⚠️ **WARNING** — KPI card "Joueurs actifs" utilise un fond dégradé sombre `linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)`
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` ligne 703
→ Observé : dégradé sombre hardcodé pour tile leaderboard
→ Attendu : token `colors.dark.surface` ou HERO_BG + cardStyle override via prop dédiée

⚠️ **WARNING** — Couleur hardcodée dans tile ImplantationCard header
→ Fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx` ligne 494
→ Observé : `background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)'`
→ Attendu : constante nommée ou token terrain dans `@aureak/theme` — accepté visuellement (terrain vert validé) mais non-tokenisé

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

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 — BLOCKER | /children | `children/index.tsx` l.100 | Remplacer `avatarBgColor` COLORS palette — supprimer `#8B5CF6` et `#3B82F6`, garder gold/terres/verts |
| P1 — BLOCKER | /children | `children/index.tsx` l.29 | Pill `Elite` : fond `#2A2006` → gold + texte dark ; Pill `Prospect` → tokens `colors.light.muted` |
| P1 — BLOCKER | /clubs/[clubId] | `clubs/[clubId]/page.tsx` l.975–1015 | Revoir accents KPI bleu `#60a5fa` / violet `#a78bfa` — trop dominants, remplacer par gold ou neutre |
| P1 — BLOCKER | /clubs | `clubs/page.tsx` l.450 | `fontFamily: 'System'` → `'Montserrat, sans-serif'` |
| P2 — WARNING | /methodologie/themes | `SectionCriteres.tsx` l.69 | `#6366f1` indigo → token gold ou créer token `colors.methodology.criteria` |
| P2 — WARNING | /evaluations | `evaluations/index.tsx` l.545 | `chipActive.backgroundColor: colors.text.dark` → `colors.accent.gold` |
| P2 — WARNING | /clubs | `clubs/page.tsx` l.563 | Shadow hardcodée → `shadows.sm` token |
| P2 — WARNING | /exports | `exports/index.tsx` l.152 | Border `#334155` → `colors.border.light` |
| P2 — WARNING | /stages | `stages/[stageId]/page.tsx` l.26 | `#4ade80` → `colors.entity.stage` ; `#f87171` → `colors.accent.red` |
| P3 | /dashboard | `dashboard/page.tsx` l.703 | Dégradé `#2A2827→#1A1A1A` leaderboard → tokeniser ou nommer explicitement |
| P3 | /children | `children/index.tsx` l.27 | Tier Prospect hardcodé → tokens |
| P3 | /clubs/[clubId] | `clubs/[clubId]/page.tsx` l.903 | `#3D3420` → `colors.text.dark` |

---

## Pages conformes ✅

Aucune page n'est 100% conforme — mais les dérives sont **contenues et corrigeables** :
- La structure globale (fond beige, sidebar dark, gold accent) est respectée partout.
- Zéro glassmorphism, zéro `backdrop-filter` détecté.
- Zéro `border-radius > 24px` détecté.
- Toutes les pages importent `@aureak/theme` tokens.
- Console guards bien présents dans `_layout.tsx` et pages principales.

---

## Top 3 dérives critiques

1. **Palette avatar violette/bleue sur /children** — 28% des avatars affichent bleu ou violet, couleurs explicitement interdites par la design-vision Aureak Admin. Impact visuel fort, corrigeable en 10 min.

2. **Accents bleu/violet comme couleurs de section dans /clubs/[clubId]** — `#60a5fa` et `#a78bfa` passés en `accent` aux KPI cards contaminent 2 sections entières. Donne une impression "app générique Tailwind" à rebours du premium gold Aureak.

3. **Indigo `#6366f1` dans Méthodologie/SectionCritères** — couleur explicitement anti-pattern (dégradé violet = BLOCKER design-vision). Visible dans le module méthodologie qui est fréquemment utilisé.

---

*Rapport généré le 2026-04-06 — Design Patrol autonome (analyse statique, Playwright skipped — app non démarrée)*
