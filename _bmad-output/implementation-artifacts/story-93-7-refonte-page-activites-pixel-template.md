# Story 93.7 — Refonte page Activités : alignement pixel-près sur le template

Status: done

## Metadata

- **Epic** : 93 — Premium UX Upgrade
- **Story ID** : 93.7
- **Story key** : `93-7-refonte-page-activites-pixel-template`
- **Priorité** : P1 (clôture Epic 93 — alignement final)
- **Dépendances** : 93-1 → 93-6 done (composants existants à étendre/refondre).
- **Source de vérité unique** : `/tmp/aureak-template/` extrait du zip `_bmad-output/design-references/Template - page admin Dashboard.zip` :
  - `admin.css` — TOUS les styles CSS (lignes 251-700 pour la chrome admin)
  - `shell.jsx` — Topbar + breadcrumbs + icon-btn + actions
  - `app.jsx` — page-header + subtabs + StatsHero + Toolbar + SessionsTable
  - `activites.jsx` — Toolbar (chips scope + segmented) + NextSessionHero + table
  - `assets/colors_and_type.css` — tokens
- **Effort estimé** : **L (~6-8h)** — refactor large mais final ; après cette story, `/activites` doit être pixel-près du template.

## Pourquoi cette story (justification)

Les stories 93-1 → 93-6 ont implémenté incrémentalement des **bouts** du template (header eyebrow, hero card dark, subtabs counts, NextSessionHero…) mais sans audit visuel complet. Résultat : à chaque itération de nouveaux écarts apparaissent, jamais de convergence.

**Capture utilisateur post-93-6 → 8 catégories d'écarts résiduels** :

1. **Topbar admin manquante** : breadcrumbs `Aureak Admin / Pilotage / Activités` + icon-btn (notif/settings) + actions Exporter/Nouvelle séance en haut droit.
2. **Boutons icon en rond** : `border-radius: 999px` ou `10px` selon type — actuellement carrés 8px.
3. **"Nouvelle séance" dans la Topbar** (haut), pas dans la NavBar (bas).
4. **Subtab actif** : underline noir → doit être underline **gold** + texte fg-primary (subtle change but defining).
5. **Toolbar filtres** : chips scope (Toutes/Implantation/Groupe/Joueur/Coach) + bouton Filtres + segmented temporal (Aujourd'hui/À venir/Passées) — tout en 1 row, look pill premium.
6. **Switching cards/table** selon temporal : `today` vide → `<NextSessionHero/>`, `upcoming/past` → table.
7. **Typographie boutons/filtres trop grasse** : actuellement 700, le template utilise 500-600 sur chips/btn et 700 uniquement sur segmented.
8. **Border-radius standardisé** : `icon-btn 10px`, `btn 999px (pill)`, `chip 999px`, `segmented 999px`.

Cette story livre l'**alignement complet et final** sur ces 8 axes, avec mappage CSS → composant pour chaque AC.

## Définition de "DONE" visuel

**Side-by-side screenshot Playwright /activites + screenshot template HTML** doivent être visuellement quasi-identiques. C'est la Definition of Done principale — pas seulement TSC/lint. Acceptation produit obligatoire avant `review`.

## Acceptance Criteria

### AC1 — AdminTopbar : nouveau composant global

1. Créer `aureak/apps/web/app/(admin)/_components/AdminTopbar.tsx` :
   - **Container** : `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 16`, `paddingHorizontal: 36`, `paddingVertical: 16`, `backgroundColor: 'rgba(255,255,255,0.85)'` (ou token `colors.overlay.lightTopbar` à ajouter), `borderBottomWidth: 1`, `borderBottomColor: colors.border.divider`, `position: 'sticky'`, `top: 0`, `zIndex: 20`.
   - **Note** : `backdrop-filter: blur(12px)` n'est pas RN — fallback solide acceptable.
2. Props :
   ```typescript
   type AdminTopbarProps = {
     breadcrumbs : string[]                              // ex: ['Aureak Admin', 'Pilotage', 'Activités']
     actions?    : { label: string; onPress: () => void; variant: 'gold' | 'outline' }[]
     showNotifDot?: boolean                              // dot doré sur l'icône notif
   }
   ```
3. **Rendu Breadcrumbs** :
   - Container `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 8`.
   - Chaque segment : `fontSize: 12`, `fontWeight: '500'`, `letterSpacing: 0.02em`, `fontFamily: fonts.body`, `color: colors.text.muted`.
   - Séparateurs `/` : `color: colors.text.subtle` (ou `colors.text.faint` à ajouter).
   - **Dernier segment (current)** : `color: colors.text.dark`, `fontWeight: '600'`.
4. **Rendu Actions** (à droite, `marginLeft: 'auto'`) :
   - 2 icon-btn (notification + settings) : `width: 36`, `height: 36`, `borderRadius: 10`, `backgroundColor: 'transparent'`, `borderWidth: 1`, `borderColor: 'transparent'`. Sur hover/active → `backgroundColor: colors.light.muted` (zinc-100), `color: colors.text.dark`.
   - Si `showNotifDot === true` → dot 7×7px `colors.accent.gold` borderRadius 999, position absolue top:8 right:9, border 2px white.
   - Séparateur vertical 1×24px `colors.border.divider` margin 0 6px.
   - Bouton "Exporter" : variant `outline` → `borderRadius: 999`, `paddingHorizontal: 18`, `paddingVertical: 10`, `borderWidth: 1`, `borderColor: colors.border.light` (zinc-300), `backgroundColor: colors.light.surface`, label `colors.text.dark`, `fontSize: 13`, `fontWeight: '600'`.
   - Bouton "Nouvelle séance" : variant `gold` → mêmes dims que outline mais `backgroundColor: colors.accent.gold`, label `#1a1406` (ou token `colors.text.onGold` à ajouter), `boxShadow: '0 4px 16px rgba(193,172,92,0.30)'`.

### AC2 — Intégration AdminTopbar globalement

5. Dans `aureak/apps/web/app/(admin)/_layout.tsx`, rendre `<AdminTopbar>` au-dessus du `<Slot/>` (au-dessus de toute page admin).
6. Pour la première itération, breadcrumbs **statiques par route** : un helper `getBreadcrumbs(pathname)` qui retourne `['Aureak Admin', 'Pilotage', 'Activités']` selon `pathname.startsWith('/activites')`.
7. Actions **par défaut** sur `/activites` : `[{ label: 'Exporter', variant: 'outline', onPress: noop }, { label: '+ Nouvelle séance', variant: 'gold', onPress: () => router.push('/(admin)/seances/new') }]`. La fonction `getTopbarActions(pathname)` est extensible par hub.
8. **Important** : retirer le bouton "+ Nouvelle séance" de `ActivitesHeader` (il est désormais dans la Topbar) — éviter le doublon.

### AC3 — Subtab actif : style gold underline + count

9. Dans `ActivitesHeader.tsx`, modifier le rendu d'un tab actif :
   - **Texte actif** : `color: colors.text.dark` (pas gold), `fontWeight: '600'`.
   - **Texte inactif** : `color: colors.text.muted`, `fontWeight: '600'`.
   - Hover inactif → `color: colors.text.dark`.
   - **Underline** : `position: 'absolute'`, `left: 12`, `right: 12`, `bottom: -1`, `height: 2`, `backgroundColor: colors.accent.gold`, `borderRadius: 2px 2px 0 0`.
   - **Padding interne** : `padding: 14px 20px`.
   - Tabs container : `borderBottomWidth: 1`, `borderBottomColor: colors.border.divider`, `marginTop: 8`.
10. **SubtabCount** sur tab actif : `backgroundColor: colors.border.gold` (rgba 193,172,92,0.20), `color: '#6b5d2a'` (ou ajout token `colors.accent.goldDarkText`). Tab inactif : `backgroundColor: colors.light.muted` (zinc-100), `color: colors.text.subtle`. fontFamily `fonts.mono`, `fontSize: 10`, `fontWeight: '500'`, `padding: 2px 7px`, `borderRadius: 999`.

### AC4 — Toolbar refonte : chips scope + bouton Filtres + segmented temporal

11. Créer `aureak/apps/web/app/(admin)/activites/components/ActivitesToolbar.tsx` (remplace `FiltresScope` + `PseudoFiltresTemporels` côté affichage — la logique state reste).
12. **Container** : `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 10`, `paddingVertical: 12px 6px 6px`, `flexWrap: 'wrap'`.
13. **Chips scope** (gauche) : 5 chips alignés.
    - `Toutes` (chip-gold) : actif par défaut, `backgroundColor: colors.accent.gold`, `color: '#1a1406'` quand actif. Inactif : `borderColor: colors.border.light`, `color: colors.text.subtle`, `backgroundColor: colors.light.surface`.
    - `Implantation`, `Groupe`, `Joueur`, `Coach` : chips standards avec dropdown chevron `▾` à droite (`fontSize: 12`, `color: colors.text.muted`, marginLeft: 2).
    - **Style chip** : `paddingHorizontal: 14`, `paddingVertical: 8`, `borderRadius: 999`, `borderWidth: 1`, `fontSize: 13`, `fontWeight: '500'`, `fontFamily: fonts.body`. Hover → border `colors.text.subtle`, color `colors.text.dark`. Actif → `backgroundColor: colors.text.dark`, `color: colors.text.primary`, `borderColor: colors.text.dark`.
14. **Bouton Filtres** (droite, avant segmented) : icon Filter + label "Filtres" même style chip non actif.
15. **Segmented temporal** :
    - Container : `paddingAll: 4`, `backgroundColor: colors.light.muted` (zinc-100), `borderRadius: 999`, `gap: 2`.
    - 3 boutons "Aujourd'hui" / "À venir" / "Passées" : `paddingHorizontal: 16`, `paddingVertical: 7`, `borderRadius: 999`, `fontSize: 11`, `fontWeight: '700'`, `letterSpacing: 0.14em`, `textTransform: 'uppercase'`.
    - Inactif : `color: colors.text.muted`, `backgroundColor: 'transparent'`. Hover → `color: colors.text.dark`.
    - **Actif** : `backgroundColor: colors.light.surface`, `color: colors.text.dark`, `boxShadow: '0 1px 3px rgba(0,0,0,0.06)'`.
16. Dans `/activites/page.tsx`, remplacer `<FiltresScope value=…/> + <PseudoFiltresTemporels value=…/>` par `<ActivitesToolbar scope=… temporal=… onScopeChange=… onTemporalChange=… />`.

### AC5 — Page header redesign (alignement template)

17. Dans `AdminPageHeader.tsx` :
    - **Container** : `flexDirection: 'row'`, `alignItems: 'flex-end'` (pas `flex-start`), `gap: 24`, `marginBottom: 8`.
    - Subtitle `marginTop: 10` (pas `space.xs`), `fontSize: 14`, `lineHeight: 1.6` (~22px), `maxWidth: '56ch'` ou `520px`.
    - Title `fontSize: 'clamp(2rem, 3.2vw, 2.6rem)'` → en RN approximé à `fontSize: 38` desktop / `32` mobile via `useWindowDimensions`. Actuellement 32 fixe → augmenter à 38 desktop pour respecter le clamp template.
    - `letterSpacing: -0.03em` → en absolute = `-1.14` sur 38px → utiliser `-1`.

### AC6 — Switching cards/table sur temporal filter

18. Dans `TableauSeances.tsx` (l'orchestrateur de la table actuelle) :
    - Si `temporalFilter === 'today'` ET liste vide → rendre `<NextSessionHero/>` (déjà OK depuis 93-4).
    - Si `temporalFilter === 'today'` ET liste non vide → rendre **liste de cards séances du jour** (nouveau composant `<TodaySessionCards/>`) au lieu de la table standard.
    - Si `temporalFilter === 'upcoming'` ou `'past'` → rendre la table standard actuelle.
19. Créer `aureak/apps/web/app/(admin)/activites/components/TodaySessionCards.tsx` :
    - 1 card par séance du jour, layout flex column (mobile) ou row (desktop).
    - Card : `backgroundColor: colors.light.surface`, `borderRadius: 16`, `padding: space.lg`, `borderWidth: 1`, `borderColor: colors.border.divider`, contenant : flag "EN COURS" / "AUJOURD'HUI", titre séance, time-range, coach, group, attendance count, CTA "Ouvrir".
    - Si une seule séance aujourd'hui → utilise `<NextSessionHero session={...} />` directement (cohérence visuelle).
    - Si 2+ séances → grid de cards plus compactes.

### AC7 — Standardisation boutons : radius + weights

20. **Audit grep** sur `apps/web/app/(admin)/_components/`, `activites/`, `academie/` :
    - `borderRadius: 8` → garder uniquement sur input/select. Sur boutons : passer à `999` (pill template) si call-to-action, `10` si icon-btn carré.
    - `fontWeight: '700'` sur labels boutons → réduire à `'600'` (template-spec) sauf pour stat values + titles + tabs actifs.
21. Boutons concernés :
    - `AdminPageHeader periodBtn` / `actionBtn` → `borderRadius: 999`, label `'600'`.
    - `ActivitesHeader newBtn` → **supprimé** (déplacé en Topbar AC2).
    - `NextSessionHero ctaPrimary` / `ctaSecondary` → `borderRadius: 999`.
    - `SubtabCount badge` → `borderRadius: 999` (déjà conforme), confirme `fontWeight: '500'` (pas 600).

### AC8 — Tokens à ajouter / vérifier

22. Vérifier dans `aureak/packages/theme/src/tokens.ts` :
    - `colors.overlay.lightTopbar` = `'rgba(255,255,255,0.85)'` — ajouter (Topbar fond translucide)
    - `colors.text.faint` = `'#D4D4D8'` (zinc-300) — ajouter (séparateurs breadcrumbs)
    - `colors.text.onGold` = `'#1a1406'` — ajouter (label sur fond gold)
    - `colors.accent.goldDarkText` = `'#6b5d2a'` — ajouter (count actif sur fond gold-20)
    - `colors.light.zinc50` = `'#FAFAFA'` — ajouter (table thead bg) si pas existant via `colors.light.muted`
23. Tous les composants modifiés utilisent **uniquement** ces tokens — zéro hex hardcodé.

### AC9 — Icons : utiliser des icônes vectorielles

24. Pour les icon-btn (notification, settings, filter, exporter) — utiliser `react-native-svg` via `@aureak/ui` (icons existants à grep) ou emoji fallback temporaire.
25. **Acceptable temporairement** : emojis 🔔 ⚙ 📥 ⊞ avec `fontSize: 16`, color `colors.text.muted`. Future story dédiée pourra migrer vers icônes SVG propres.

### AC10 — Definition of Done visuelle

26. Screenshot Playwright `/activites` desktop ≥ 1280px largeur.
27. Screenshot template HTML (ouvrir `_bmad-output/design-references/Template - page admin Dashboard.zip` extrait, fichier `Activit�s - Admin Aureak.html`).
28. Comparaison side-by-side validée par produit (Jérémy) avant passage en `review`. **C'est la condition principale** — les 25 AC précédents ne suffisent pas à fermer la story sans cette validation.

### AC11 — QA + conformité

29. `cd aureak && npx tsc --noEmit` = EXIT 0.
30. Aucun hex hardcodé dans les composants modifiés (rgba autorisé uniquement si tokenisé).
31. Aucun setState loading/saving sans try/finally.
32. Console JS vierge (hors AbortError pré-existants — voir story 94-1).

### AC12 — Topbar masquée sur mobile (<768px)

33. Dans `AdminTopbar.tsx`, utiliser `useWindowDimensions()` :
    - **Width < 768px** : Topbar entière masquée (`if (width < 768) return null`).
    - **Width ≥ 768px** : rendu normal (breadcrumbs + actions).
34. Justification : sur mobile, l'écran est trop étroit pour les breadcrumbs + 4 boutons. Le bouton "+ Nouvelle séance" reste accessible via le `ActivitesHeader` qui sera **conservé sur mobile uniquement** :
    - `ActivitesHeader` : si `width < 768px` → garde le bouton "+ Nouvelle séance" (fallback).
    - Si `width ≥ 768px` → bouton retiré (déplacé dans Topbar — AC2/T4).
35. Test : naviguer `/activites` à 500px → pas de Topbar, mais bouton "+ Nouvelle séance" toujours visible dans la NavBar des subtabs.

### AC13 — Eyebrow letterSpacing exact template

36. Dans `AdminPageHeader.tsx`, eyebrow `letterSpacing` = **2.5** (correspondance exacte template `0.22em` sur fontSize 11px = 2.42px ≈ 2.5).
37. Actuellement `letterSpacing: 1` → trop serré. Le template a un effet "espacé éditorial premium" très distinctif.

### AC14 — Audit espacements page (alignement template)

38. Dans `_layout.tsx` ou wrapper page admin :
    - **Padding container page** : `padding: '32px 36px 64px'` (top horizontal bottom) — template `.page` ligne 354. Si actuellement `space.lg` (24) → **passer à 32 horizontal et 64 bottom** explicitement.
    - **Gap entre sections** : `gap: 24` (template `var(--d-section-gap)` = 24px). Vérifier que les blocs (header, subtabs, stats, toolbar, table) ont bien `marginTop: 24` ou via container `gap: 24`.
39. Vérifier que la max-width container = `1600px` centré (template `.page { max-width: 1600px; margin: 0 auto }`) — actuellement potentiellement absent.

### AC15 — Cards "plus fluides" (interprétation)

40. **Interprétation par défaut** (à confirmer par produit) : "fluides" = effet **plus aéré + bordure moins marquée + animation subtile** :
    - **Border** : `borderColor: colors.border.divider` actuel reste, mais sur **hover** → `borderColor: colors.text.subtle` (zinc-300) avec transition douce 0.2s (template `.stat-card:hover { border-color: var(--zinc-300) }`).
    - **Padding interne** : passer de `space.lg` (24) à `space.lg + 4 = 28` ? **NON** — le template utilise `var(--d-stat-p)` qui est **24px en mode comfortable**, donc **on garde 24**. L'effet "fluide" vient probablement du contraste : padding généreux + bordures fines + ombre subtile.
    - **Box-shadow** : confirmer que `shadows.sm` est appliqué partout (déjà présent en 93-3).
    - **Border-radius** : `16px` partout (déjà via `radius.card` = 16). OK.
    - **Transition** : `transition: 'border-color 0.2s, transform 0.2s'` sur les `stat-card` — à ajouter si possible (RN Web supporte `transition` via inline style).
41. Si l'interprétation est incorrecte → fallback validation produit pendant T12 (screenshot side-by-side, demander avis).

## Tasks / Subtasks

- [ ] **T1 — Tokens** (AC: 22, 23)
  - [ ] Ajouter à `tokens.ts` : `colors.overlay.lightTopbar`, `colors.text.faint`, `colors.text.onGold`, `colors.accent.goldDarkText`.
  - [ ] Vérifier `colors.light.zinc50` (sinon ajouter ou mapper sur `colors.light.muted`).

- [ ] **T2 — AdminTopbar composant** (AC: 1, 2, 3, 4)
  - [ ] Créer `(admin)/_components/AdminTopbar.tsx`.
  - [ ] Props `breadcrumbs`, `actions`, `showNotifDot`.
  - [ ] Rendu breadcrumbs avec séparateurs.
  - [ ] Rendu actions (icon-btn ronds + boutons pill outline/gold).

- [ ] **T3 — Helper getBreadcrumbs + getTopbarActions** (AC: 5, 6, 7)
  - [ ] Créer `(admin)/_components/topbar-config.ts` :
    ```typescript
    export function getBreadcrumbs(pathname: string): string[] { ... }
    export function getTopbarActions(pathname: string, router: ...): TopbarAction[] { ... }
    ```
  - [ ] Switch case sur pathname pour `/activites`, `/methodologie`, `/academie`, etc.

- [ ] **T4 — Intégration AdminTopbar dans `_layout.tsx`** (AC: 5, 8)
  - [ ] Modifier `(admin)/_layout.tsx` pour rendre `<AdminTopbar>` global.
  - [ ] Retirer `+ Nouvelle séance` de `ActivitesHeader.tsx` (déplacé en Topbar).

- [ ] **T5 — Subtab style gold underline** (AC: 9, 10)
  - [ ] Modifier `ActivitesHeader.tsx` : couleur tab actif = `colors.text.dark`, underline = `colors.accent.gold` 2px borderRadius 2.
  - [ ] Modifier `SubtabCount.tsx` : badge actif `colors.border.gold` bg + `goldDarkText` color, inactif `colors.light.muted` bg + `text.subtle` color, fontFamily `fonts.mono`.

- [ ] **T6 — ActivitesToolbar** (AC: 11-16)
  - [ ] Créer `(admin)/activites/components/ActivitesToolbar.tsx`.
  - [ ] Implémenter chips scope (5 chips dont Toutes en gold-active, autres standard avec dropdown chevron).
  - [ ] Implémenter bouton Filtres.
  - [ ] Implémenter segmented temporal 3 boutons (background zinc-100, actif white + shadow).
  - [ ] Brancher dans `/activites/page.tsx`, retirer `<FiltresScope>` + `<PseudoFiltresTemporels>`.

- [ ] **T7 — AdminPageHeader ajustements** (AC: 17)
  - [ ] `alignItems: 'flex-end'`, subtitle `marginTop: 10` `lineHeight` ajusté.
  - [ ] Title `fontSize: 38` desktop (vs 32 actuel) via `useWindowDimensions`.

- [ ] **T8 — Switching cards/table** (AC: 18, 19)
  - [ ] Créer `(admin)/activites/components/TodaySessionCards.tsx`.
  - [ ] Modifier `TableauSeances.tsx` pour switcher sur `temporalFilter === 'today'` non-vide → cards.
  - [ ] Si une seule séance → utiliser `<NextSessionHero>` (déjà existant 93-4).

- [ ] **T9 — Standardisation boutons** (AC: 20, 21)
  - [ ] Grep `borderRadius: 8` dans composants admin → adapter (999 sur boutons CTA, 10 sur icon-btn carré).
  - [ ] Grep `fontWeight: '700'` sur labels boutons → réduire à '600' (sauf titles/values/tabs actifs).

- [ ] **T10 — Icons placeholder emoji** (AC: 24, 25)
  - [ ] Utiliser emojis 🔔 ⚙ 📥 ⊞ temporairement dans Topbar (icônes SVG = future story).

- [ ] **T11 — QA technique** (AC: 29-32)
  - [ ] `npx tsc --noEmit` = EXIT 0.
  - [ ] Grep `#[0-9a-fA-F]` dans fichiers modifiés → 0.
  - [ ] Vérifier consoles vides hors AbortError pré-existants.

- [ ] **T12 — Validation visuelle** (AC: 26, 27, 28) — **BLOCKER**
  - [ ] Lancer dev server.
  - [ ] Screenshot Playwright `/activites` à 1440px largeur.
  - [ ] Ouvrir le HTML template extrait + screenshot.
  - [ ] Comparer side-by-side. **Demander validation Jérémy avant passage `review`.**

- [ ] **T13 — Topbar mobile + eyebrow letterSpacing + espacements page** (AC: 33-39)
  - [ ] AdminTopbar : `useWindowDimensions` → return null si width < 768.
  - [ ] ActivitesHeader : conserver bouton "+ Nouvelle séance" si width < 768.
  - [ ] AdminPageHeader eyebrow : `letterSpacing: 2.5`.
  - [ ] Layout page : padding `32px 36px 64px`, gap sections `24`, max-width `1600`.

- [ ] **T14 — Cards "fluides" (hover transition + audit padding)** (AC: 40, 41)
  - [ ] StatsHeroCard / StatsStandardCard : ajouter `transition: 'border-color 0.2s, transform 0.2s'` (web only via `as any`).
  - [ ] Hover state → `borderColor: colors.text.subtle` (RN Web supporte les pseudo-states limités → utiliser `Pressable`'s `pressed` ou laisser CSS web hover).
  - [ ] Vérifier padding intérieur = 24 (déjà OK via `space.lg`).
  - [ ] Si validation produit retourne "fluides = autre chose" → ajustement à faire en T12.

## Mappage CSS template → tokens Aureak (référence rapide)

| Sélecteur CSS template | Valeur | Token Aureak |
|---|---|---|
| `var(--aureak-gold)` | `#C1AC5C` | `colors.accent.gold` |
| `var(--aureak-gold-10)` | `rgba(193,172,92,0.10)` | `colors.border.goldBg` |
| `var(--aureak-gold-20)` | `rgba(193,172,92,0.20)` | `colors.border.gold` (≈ 0.25) |
| `var(--admin-ink)` | `#0E0E10` | `colors.ink.premiumDark` |
| `var(--zinc-50)` | `#FAFAFA` | `colors.light.muted` ou `colors.light.zinc50` (à confirmer) |
| `var(--zinc-100)` | `#F4F4F5` | `colors.light.muted` (≈) |
| `var(--zinc-200)` | `#E4E4E7` | `colors.border.divider` |
| `var(--zinc-300)` | `#D4D4D8` | `colors.text.faint` (à ajouter) |
| `var(--zinc-400)` | `#A1A1AA` | `colors.text.subtle` |
| `var(--zinc-500)` | `#71717A` | `colors.text.muted` |
| `var(--fg-primary)` | `#18181B` | `colors.text.dark` |
| `var(--aureak-red)` | `#E05252` | `colors.accent.red` |
| `rgba(255,255,255,0.85)` | translucide blanc | `colors.overlay.lightTopbar` (à ajouter) |
| `rgba(193,172,92,0.30)` shadow gold | shadow CTA gold | inline ok (shadow) |

## Definition of Done (récap)

- [ ] AC1-32 validés
- [ ] Screenshot side-by-side validé par produit
- [ ] TSC EXIT 0
- [ ] Aucun hex hardcodé
- [ ] Console vierge hors AbortError pré-existants
- [ ] Commit `feat(epic-93): story 93.7 — refonte page Activités pixel-près template`

## Dev Notes

### Stratégie d'implémentation : top-down

1. **D'abord la chrome** (Topbar globale) — AC1-4. C'est ce qui a le plus d'impact visuel immédiat.
2. **Puis le header de page** (AC5, 7) — alignement title + subtitle.
3. **Puis les subtabs** (AC3) — fix du gold underline.
4. **Puis la Toolbar** (AC4) — la pièce la plus complexe, refonte chips + segmented.
5. **Puis le switching layout** (AC6) — cards vs table selon temporal.
6. **Standardisation boutons** (AC7) en passe de finition.
7. **Validation visuelle** (AC10) en blocker final.

### Pourquoi Topbar globale au layout vs par page

- Le template a une Topbar **persistante** sur toutes les pages admin (cf. `shell.jsx` Topbar appelée dans `app.jsx` racine).
- Mettre dans `_layout.tsx` = 1 seul rendu, breadcrumbs adaptés via pathname.
- Permet d'éviter l'oubli sur des pages futures.

### Risques identifiés

- **Risque 1** : Les modifs de `_layout.tsx` affectent toutes les pages admin → bug potentiel sur Académie/Méthodologie/Dashboard. Mitigation : screenshot smoke-test sur 3-4 pages admin différentes après merge.
- **Risque 2** : Le bouton "+ Nouvelle séance" déplacé de NavBar à Topbar → si une autre page admin a son propre bouton action via `ActivitesHeader`, fix nécessaire. Limité ici à `/activites/*` qui partage le même bouton.
- **Risque 3** : La typographie `clamp()` n'existe pas en RN → approximation par breakpoint.

### References

- Template extrait : `/tmp/aureak-template/admin.css` (lignes 251-700 chrome admin), `shell.jsx` (Topbar 87-117), `app.jsx` (page-header 70-99 + subtabs 87-99), `activites.jsx` (Toolbar 4-44 + SessionsTable 100-105).
- Stories Epic 93 antérieures : 93-1 → 93-6 (composants à étendre).
- Story 94-1 : couvre les AbortError résiduels (en parallèle, pas bloquant).
- Composants existants : `AdminPageHeader.tsx`, `SubtabCount.tsx`, `ActivitesHeader.tsx`, `StatsHero.tsx`, `NextSessionHero.tsx`, `TableauSeances.tsx`, `FiltresScope.tsx`, `PseudoFiltresTemporels.tsx`.

### Process futur (post-93-7)

À partir de cette story, **toute story design admin** doit :

1. **Mappage CSS template → tokens explicite** dans les AC (pas "appliquer le template" en abstrait).
2. **Screenshot side-by-side dans Definition of Done** — validation produit obligatoire avant `review`.
3. **Audit grep typo+couleurs** dans les Tasks (pas juste le composant nouveau, mais aussi les composants impactés indirectement).

C'est ce qui manquait sur 93-1 → 93-6 et qui a causé la frustration. **93-7 instaure le pattern.**

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_(à compléter)_

### Completion Notes List

_(à compléter — noter tokens ajoutés, composants nouveaux, screenshots produits, validation produit reçue)_

### File List

_(à compléter — attendu : 4 créés, ~6 modifiés)_

**Attendus création :**
- `aureak/apps/web/app/(admin)/_components/AdminTopbar.tsx`
- `aureak/apps/web/app/(admin)/_components/topbar-config.ts`
- `aureak/apps/web/app/(admin)/activites/components/ActivitesToolbar.tsx`
- `aureak/apps/web/app/(admin)/activites/components/TodaySessionCards.tsx`

**Attendus modification :**
- `aureak/packages/theme/src/tokens.ts` (4 tokens)
- `aureak/apps/web/app/(admin)/_layout.tsx` (intégration Topbar)
- `aureak/apps/web/app/(admin)/_components/AdminPageHeader.tsx` (alignItems + title size)
- `aureak/apps/web/app/(admin)/_components/SubtabCount.tsx` (style gold actif)
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` (retrait bouton + style underline gold)
- `aureak/apps/web/app/(admin)/activites/page.tsx` (utilise nouvelle Toolbar)
- `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` (switching cards/table)
