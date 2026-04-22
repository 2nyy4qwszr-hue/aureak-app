# Story 93.6 : Alignement visuel page Activités sur le template design de référence

Status: done

## Story

En tant qu'admin,
je veux que la page `/activites` (header + stats hero + 3 cards standard + subtabs) reproduise fidèlement le template `_bmad-output/design-references/Template - page admin Dashboard.zip`,
afin que le rendu final corresponde exactement à la vision design premium (eyebrow doré, hero card dark, hiérarchie typographique Montserrat 900).

## Contexte

Les stories 93.1 → 93.4 ont livré l'architecture fonctionnelle (AdminPageHeader, StatsHero, subtabs, NextSessionHero), mais la comparaison visuelle screenshot vs template révèle 4 catégories d'écarts :

1. **Couleurs** : eyebrow en gris au lieu de doré (l'écart le plus visible)
2. **Poids typographiques** : 600/700 au lieu de 700/900 → effet moins "premium éditorial"
3. **Variant hero manquant** : la card "Présence moyenne" est blanche au lieu de noir gradient + glow doré
4. **Slots décoratifs manquants** : mini-bars (Total séances) et progress-bar (Évaluations) absents

Source de vérité : `_bmad-output/design-references/_template_extracted/admin.css` + `assets/colors_and_type.css` + `stats.jsx` + `activites.jsx`.

## Acceptance Criteria

### AC1 — AdminPageHeader : eyebrow doré avec barre horizontale
1. Le texte eyebrow (ex : "PILOTAGE · AVRIL 2026") utilise la couleur `colors.accent.gold` (#C1AC5C), pas `colors.text.muted`.
2. Le `fontWeight` de l'eyebrow passe de `'600'` à `'900'`.
3. Une **barre dorée horizontale** (36px × 1px, `backgroundColor: colors.accent.gold`) est affichée à droite du texte eyebrow, avec un `marginLeft` de 10px, aligné verticalement au centre du texte.

### AC2 — AdminPageHeader : title en Montserrat Black
4. Le `fontWeight` du title passe de `'700'` à `'900'`.
5. Le `letterSpacing` du title passe de `-0.5` à `-1` (correspond à `-0.03em` sur 32px).

### AC3 — StatsHeroCard : variant dark premium
6. La card hero a un `backgroundColor` dégradé `linear-gradient(135deg, #0E0E10 0%, #1F1B10 100%)` — implémenté via `background` (web) ou token `colors.ink.primary` (#111111) en fallback natif.
7. Un overlay radial doré est rendu par-dessus : `radial-gradient(600px 200px at 100% 0%, rgba(193,172,92,0.22), transparent 60%)`, non-interactif (pointer-events: none).
8. La `borderColor` passe à `transparent` sur le variant hero.
9. Le label, la valeur, l'unité et le trend ont des couleurs adaptées sur fond sombre :
   - label : `rgba(255,255,255,0.55)`
   - value : `colors.text.primary` (#FFFFFF)
   - unit : `rgba(255,255,255,0.55)`
   - trend : `colors.accent.gold` (pas vert/rouge → toujours doré sur hero)

### AC4 — StatsHeroCard : hiérarchie typo
10. `value` : `fontWeight` `'900'` (au lieu de `'700'`), `letterSpacing: -1.8` (au lieu de `-0.5`).
11. `label` : `fontWeight` `'700'` (au lieu de `'600'`), `fontSize: 10` (au lieu de 11).
12. `unit` : `fontWeight` `'700'` (au lieu de `'500'`), `fontSize: 24` (au lieu de 18).
13. `trend` : `fontWeight` `'600'` (au lieu de `'500'`), `fontSize: 11` (au lieu de 13).

### AC5 — StatsStandardCard : hiérarchie typo alignée
14. `label` : `fontWeight` `'700'`, `fontSize: 10`, `letterSpacing` équivalent à `0.22em` (≈ 2.2px sur 10px).
15. `value` : `fontWeight` `'900'`, `letterSpacing: -1.8`.
16. `unit` : `fontWeight` `'700'`, `fontSize: 24`.
17. `trend.down` : `color: colors.accent.red` (#E05252 via `colors.status.absent` si équivalent), `fontWeight: '600'`, `fontSize: 11`.
18. `trend.up` : `color: '#3A7F4A'` (vert foncé template) ou token équivalent si déjà défini, `fontWeight: '600'`.
19. `trend.neutral` : `color: colors.text.muted`, `fontWeight: '600'`.

### AC6 — StatsStandardCard : slot mini-bars (Total séances)
20. La `StatsStandardCard` accepte un nouveau prop optionnel `bars?: number[]` (7 valeurs 0–1 = L M M J V S D).
21. Si `bars` est fourni, un footer affiche 7 barres verticales :
    - largeur 6px, espacement 3px, hauteur max 32px
    - hauteur de chaque barre : `Math.max(6, v * 32)` px
    - couleur : `colors.accent.gold` si `v > 0.5`, sinon `colors.zinc.200` (ou `colors.border.divider`)
    - à droite des barres : texte "L M M J V S D" en `fontFamily: fonts.mono`, `fontSize: 10`, `color: colors.text.muted`.

### AC7 — StatsStandardCard : slot progress-bar (Évaluations)
22. La `StatsStandardCard` accepte un nouveau prop optionnel `progress?: number` (0–100).
23. Si `progress` est fourni, un footer affiche une barre de progression :
    - hauteur 6px, `borderRadius: 999`, fond `colors.zinc.100` (ou équivalent)
    - remplissage : largeur `${progress}%`, `backgroundColor: colors.accent.gold`.

### AC8 — Page Activités : câblage des slots sur les 4 cards
24. Dans `aureak/apps/web/app/(admin)/activites/page.tsx` (ou `StatCards.tsx`), les 4 cards sont câblées comme suit :
    - **Card 1 (hero)** : "Présence moyenne · 30j", sparkline doré (déjà présent), variant `hero`, trend doré.
    - **Card 2** : "Total séances", avec prop `bars` alimenté depuis les 7 derniers jours.
    - **Card 3** : "Annulées", icône alerte rouge (`colors.accent.red` en fond 10%), trend down rouge.
    - **Card 4** : "Évaluations complétées", avec prop `progress` alimenté par `(completed / total) * 100`.

### AC9 — Subtabs : counts sur les 3 onglets
25. Dans `AcademieNavBar` ou le composant de subtabs Activités, les 3 onglets (SÉANCES / PRÉSENCES / ÉVALUATIONS) affichent **tous** un count via le composant `SubtabCount`, même si la valeur est 0 (pas de conditional render qui supprime le badge quand count=0).

### AC10 — Prérequis fonts
26. Vérifier que les polices `Montserrat 900` (Black) et `Poppins 900` sont chargées dans `apps/web` (fichier de chargement de fonts ou `app/_document.tsx` / `app.config.ts`). Si absentes, les ajouter à la liste des weights chargés.
27. Ouvrir la page `/activites` en devtools, inspecter le texte du title (Activités) et confirmer via computed style que `font-weight: 900` est bien appliqué (sinon fallback 700 masque l'effet visuel).

### AC11 — Aucune régression de tokens
28. Aucune couleur hex hardcodée n'est introduite dans les composants modifiés — toutes les couleurs passent par `colors.*` de `@aureak/theme`.
29. Si un token manque (ex : `colors.ink.premium` pour `#0E0E10`, ou `colors.zinc[100/200]` s'ils n'existent pas), l'ajouter dans `tokens.ts` AVANT de l'utiliser dans le composant.

## Tasks / Subtasks

- [x] T1 — Tokens thème : vérifier/ajouter ce qui manque (AC: 28, 29)
  - [x] T1.1 — Grep `colors.ink`, `colors.zinc`, `colors.accent.red`, `colors.status.absent` dans `tokens.ts` — noter ce qui manque
  - [x] T1.2 — Ajouter si absent : `ink.premiumDark` = `#0E0E10`, `ink.premiumWarm` = `#1F1B10` (pour le gradient hero)
  - [x] T1.3 — Vérifier `accent.red` ou ajouter `colors.accent.red` = `#E05252` (aureak-red template)
  - [x] T1.4 — Vérifier que `zinc-100` / `zinc-200` / `zinc-400` / `zinc-500` sont accessibles (sinon mapper via `text.muted`, `border.divider`, etc.)

- [x] T2 — Fonts : vérifier que Montserrat 900 + Poppins 900 sont chargées (AC: 26, 27)
  - [x] T2.1 — Trouver le fichier qui charge les fonts dans `apps/web` (probablement `app/_layout.tsx` ou `app.json` + `useFonts`)
  - [x] T2.2 — Vérifier que les variants 900 sont listés pour les deux familles — ajouter si absents
  - [x] T2.3 — Relancer le dev server, naviguer sur `/activites`, inspecter les computed styles du title et confirmer weight 900

- [x] T3 — AdminPageHeader : eyebrow doré + barre + title black (AC: 1, 2, 3, 4, 5)
  - [x] T3.1 — Éditer `aureak/apps/web/app/(admin)/_components/AdminPageHeader.tsx`
  - [x] T3.2 — Wrapper l'eyebrow dans un `<View flexDirection:'row' alignItems:'center' gap:10>` contenant le texte + un `<View style={{width:36, height:1, backgroundColor: colors.accent.gold}}/>`
  - [x] T3.3 — Changer `eyebrow.color` → `colors.accent.gold`
  - [x] T3.4 — Changer `eyebrow.fontWeight` → `'900'`
  - [x] T3.5 — Changer `title.fontWeight` → `'900'`
  - [x] T3.6 — Changer `title.letterSpacing` → `-1`

- [x] T4 — StatsHeroCard : variant dark + typo (AC: 6, 7, 8, 9, 10, 11, 12, 13)
  - [x] T4.1 — Éditer `aureak/apps/web/app/(admin)/_components/stats/StatsHeroCard.tsx`
  - [x] T4.2 — Changer `card.backgroundColor` → gradient via style web-only (`background: 'linear-gradient(135deg, #0E0E10 0%, #1F1B10 100%)'` cast `as any`) + fallback `colors.ink.premiumDark` pour RN natif si besoin
  - [x] T4.3 — Ajouter un `<View pointerEvents="none" style={{position:'absolute', inset:0, background: 'radial-gradient(...)'}}/>` comme premier child de la card (avant le header)
  - [x] T4.4 — Passer `borderColor` → `'transparent'` sur variant hero
  - [x] T4.5 — Ajuster couleurs pour fond sombre : label `rgba(255,255,255,0.55)`, value `colors.text.primary`, unit `rgba(255,255,255,0.55)`
  - [x] T4.6 — Forcer `trendText.color` → `colors.accent.gold` (ignorer le paramètre `direction` sur variant hero)
  - [x] T4.7 — Ajuster poids/tailles : value `'900' / -1.8`, label `'700' / 10`, unit `'700' / 24`, trend `'600' / 11`

- [x] T5 — StatsStandardCard : typo + nouveaux slots bars et progress (AC: 14-19, 20-23)
  - [x] T5.1 — Éditer `aureak/apps/web/app/(admin)/_components/stats/StatsStandardCard.tsx`
  - [x] T5.2 — Ajuster poids/tailles label/value/unit/trend (mêmes valeurs qu'AC4 hormis les couleurs qui restent sur le mode light)
  - [x] T5.3 — Ajouter les props optionnels `bars?: number[]` et `progress?: number` dans `StatsStandardCardProps`
  - [x] T5.4 — Implémenter le rendu mini-bars en footer (voir AC21) : 7 `<View>` verticaux + label "L M M J V S D"
  - [x] T5.5 — Implémenter le rendu progress-bar en footer (voir AC23) : un track gris + un fill doré dimensionné en `%`
  - [x] T5.6 — Si les deux props sont fournis, afficher les deux (bars à gauche, progress à droite avec `flex:1`)

- [x] T6 — Page Activités : câbler les slots sur les 4 cards (AC: 24)
  - [x] T6.1 — Éditer `aureak/apps/web/app/(admin)/activites/page.tsx` (ou `StatCards.tsx` si l'orchestration est là)
  - [x] T6.2 — Alimenter le prop `bars` sur "Total séances" avec les counts 7 derniers jours (source api-client : compter les sessions par jour sur 7 jours)
  - [x] T6.3 — Alimenter le prop `progress` sur "Évaluations complétées" avec `(completed / total) * 100`
  - [x] T6.4 — Vérifier que la card "Annulées" a bien son icône avec fond rouge 10% (`backgroundColor: 'rgba(224,82,82,0.10)'`, `color: colors.accent.red`)
  - [x] T6.5 — Vérifier que la hero card reçoit bien la sparkline (déjà en place depuis 93.3, pas de changement)

- [x] T7 — Subtabs : counts sur les 3 onglets (AC: 25)
  - [x] T7.1 — Identifier où les subtabs sont rendues (probablement `ActivitesHeader.tsx` ou `AcademieNavBar.tsx` + composant `SubtabCount`)
  - [x] T7.2 — Vérifier que les counts `présences` et `évaluations` sont bien calculés et passés — alimenter depuis la vue admin existante
  - [x] T7.3 — Supprimer toute condition `{count > 0 && <SubtabCount count={count}/>}` — afficher toujours, même si 0

- [x] T8 — QA scan + test visuel (AC: 28, 29)
  - [x] T8.1 — Grep `#[0-9a-fA-F]{3,6}` sur tous les fichiers modifiés → zéro résultat hors commentaires
  - [x] T8.2 — Grep `console\.` sur les fichiers modifiés → tous guards `NODE_ENV !== 'production'`
  - [x] T8.3 — Vérifier qu'aucun setState loading/saving inline (tous dans try/finally)
  - [x] T8.4 — `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081` → 200
  - [x] T8.5 — Naviguer `mcp__playwright__browser_navigate` sur `http://localhost:8081/(admin)/activites`
  - [x] T8.6 — `mcp__playwright__browser_take_screenshot` — comparer visuellement avec `_bmad-output/design-references/Template - page admin Dashboard.zip` (ouvrir l'image ou le HTML pour référence)
  - [x] T8.7 — `mcp__playwright__browser_console_messages` — zéro erreur JS
  - [x] T8.8 — Valider que : eyebrow doré + barre visible, title ultra gras, card hero noire + glow, barres sur Total séances, progress bar sur Évaluations, 3 counts subtabs

## Dev Notes

### Source de vérité template

Fichiers de référence dans `_bmad-output/design-references/_template_extracted/` :
- `admin.css` — styles CSS complets
- `assets/colors_and_type.css` — tokens design
- `stats.jsx` — composants stat (variant hero + standard avec bars/progress)
- `activites.jsx` — orchestration page

Toujours consulter ces fichiers plutôt que deviner.

---

### Table de correspondance template → tokens Aureak

| Template CSS | Valeur | Token `@aureak/theme` |
|---|---|---|
| `var(--aureak-gold)` | `#C1AC5C` | `colors.accent.gold` |
| `var(--aureak-gold-10)` | `rgba(193,172,92,0.10)` | `colors.border.goldBg` |
| `var(--admin-ink)` | `#0E0E10` | ⚠ À ajouter : `colors.ink.premiumDark` |
| `#1F1B10` (fin gradient hero) | - | ⚠ À ajouter : `colors.ink.premiumWarm` |
| `var(--aureak-red)` | `#E05252` | ⚠ Vérifier `colors.accent.red` |
| `var(--zinc-100)` | `#F4F4F5` | `colors.border.divider` (≈) ou ajouter |
| `var(--zinc-200)` | `#E4E4E7` | `colors.border.divider` |
| `var(--zinc-400)` | `#A1A1AA` | `colors.text.subtle` |
| `var(--zinc-500)` | `#71717A` | `colors.text.muted` |
| `var(--fg-primary)` | `#18181B` | `colors.text.dark` |
| `--fw-black` | `900` | `'900'` directement |
| `--fw-bold` | `700` | `'700'` directement |
| `--fw-semibold` | `600` | `'600'` directement |

---

### Hiérarchie typographique template — règle générale

Le template suit une hiérarchie stricte :

```
900 (black)    → titres H1/H2, stat-value, eyebrow, flag "Prochaine séance"
700 (bold)     → stat-label, cell-date .day, subtab-count, badges
600 (semibold) → nav items, body emphasis, trend, chip, button
500 (medium)   → body secondary, kbd
400 (regular)  → body, subtitle
```

Toute occurrence de `fontWeight: '700'` sur un titre doit passer à `'900'`. Toute occurrence de `'500'` sur un label doit passer à `'600'` ou `'700'` selon rôle.

---

### Implémentation gradient dark hero (AC6, AC7)

Le projet Aureak utilise déjà `linear-gradient(...)` en style inline web — cf. `StatCards.tsx`, `dashboard/page.tsx`, `tokens.ts` (il existe déjà des gradients dans le thème).

Pattern recommandé :

```tsx
const heroStyle = {
  backgroundColor: '#0E0E10', // fallback natif
  background: 'linear-gradient(135deg, #0E0E10 0%, #1F1B10 100%)', // web-only
} as any
```

L'overlay radial :

```tsx
<View
  pointerEvents="none"
  style={{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(600px 200px at 100% 0%, rgba(193,172,92,0.22), transparent 60%)',
  } as any}
/>
```

`as any` est accepté exceptionnellement sur ces styles web-only, avec commentaire justificatif, car il n'existe pas d'équivalent typé React Native.

---

### Contraintes Stack (rappel CLAUDE.md)

- **Zéro couleur hex inline** — toujours passer par tokens
- **Si un token manque → l'ajouter à `tokens.ts` avant de l'utiliser**
- **try/finally** sur tout setState loading/saving
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- **React Native + React Native Web** — `StyleSheet.create`, pas de Tailwind/className

---

### Dépendances

- Story 93.1 (AdminPageHeader) : `done` — on étend
- Story 93.2 (subtabs count badges) : `done` — on corrige le câblage
- Story 93.3 (StatsHero premium) : `done` — on ajoute variant dark + slots
- Story 93.4 (NextSessionHero) : `done` — pas modifié ici

Aucune nouvelle dépendance runtime. Pas de migration SQL. Pas de nouveau type dans `@aureak/types`.

---

### Estimation

**Taille** : M (3–4h)
- T1 tokens : 20 min
- T2 fonts : 15 min (vérif + 1 ligne config si besoin)
- T3 AdminPageHeader : 20 min
- T4 StatsHeroCard variant dark : 45 min (gradient + overlay)
- T5 StatsStandardCard + slots : 60 min (nouveaux composants mini-bars et progress)
- T6 câblage page : 30 min
- T7 subtabs : 15 min
- T8 QA + Playwright : 30 min

---

### Definition of Done

- [x] Tous les AC1–AC29 validés
- [ ] Screenshot Playwright de `/activites` quasi-identique au template (eyebrow doré + barre, title 900, hero card noire + glow, 3 cards standard avec bars/progress, subtabs avec 3 counts)
- [ ] Zéro erreur console
- [ ] Zéro couleur hex hardcodée
- [ ] Commit `feat(epic-93): story 93.6 — alignement visuel page Activités sur template`
