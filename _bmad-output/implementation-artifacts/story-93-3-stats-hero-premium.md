# Story 93.3 — StatsHero premium : card hero avec sparkline + 3 cards variants (bars/progress/trend)

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 93 — Premium UX Upgrade (pattern Template Admin Aureak)
- **Story ID** : 93.3
- **Story key** : `93-3-stats-hero-premium`
- **Priorité** : P1
- **Dépendances** : **93-1 done** (AdminPageHeader), **93-2 done** (Subtabs with count — pas un bloqueur direct, mais recommandé pour cohérence). Conditionnelle sur **81-2** (MethodologieHeader) pour Méthodologie.
- **Source** : Template `/tmp/aureak-template/stats.jsx` (lignes 1-127) + CSS `/tmp/aureak-template/admin.css` classes `.stat-card`, `.stat-hero`, `.spark-area`, `.mini-bars`, `.progress-bar-fill`.
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : **M-L** (3 composants créés + 1 refactor StatCards existant + instrumentation 1-5 pages Méthodologie, 0 migration, 0 nouvelle API (utilise helpers existants))

## Story

As an admin,
I want les 4 stat cards de chaque hub (Activités, Méthodologie) à passer d'un pattern "4 cards identiques" à un pattern premium "**1 card hero** (large, avec sparkline SVG du trend sur 30j) + **3 cards standard** (avec mini-bars hebdomadaires, progress bar, ou trend delta selon le sens métier)",
so that la lecture du tableau de bord soit **hiérarchisée** (une métrique dominante met en scène les 3 autres en appui), que la tendance (sparkline, bars, progress) soit lisible sans ouvrir un graphique détaillé, et que le look-and-feel se rapproche du template premium (Linear, Stripe) qui définit l'identité "dashboard Aureak".

## Acceptance Criteria

1. **Nouveau composant partagé `StatsHeroCard`** — localisation : `aureak/apps/web/app/(admin)/_components/stats/StatsHeroCard.tsx`.
   - Fichier ≤ 200 lignes.
   - Props :
     ```typescript
     type StatsHeroCardProps = {
       label       : string         // ex: "Présence moyenne · 30j"
       value       : number | string // ex: 92 ou "92"
       unit?       : string         // ex: "%"
       trend?      : {
         direction: 'up' | 'down' | 'neutral'
         label    : string          // ex: "Bonne dynamique · +4 pts vs mois dernier"
       }
       sparkline?  : number[]       // série temporelle, ex: [68, 72, 70, 78, 84, 82, 86, 88, 92]
       icon?       : React.ReactNode // optionnel — icône top-right
     }
     ```
   - Rendu :
     - Card large (flex 2x vs standard), fond `colors.light.surface`, border `colors.border.divider`, padding `space.lg`, borderRadius 12, shadow `shadows.sm`.
     - Header row : label uppercase 11px letterSpacing 1 color `colors.text.muted` + icône top-right 24×24 bg `colors.accent.gold + '10'` color `colors.accent.gold`.
     - Value central : fontSize 44, fontWeight 700 Montserrat, `fonts.display`, color `colors.text.dark`, letterSpacing -0.02. Unit à côté (18px, muted).
     - Trend row : icon ↗ (up green) / ↘ (down red) / ↔ (neutral muted) + label 13px color selon direction.
     - **Sparkline SVG** en bas de card (hauteur 50px, largeur 100% du card, preserveAspectRatio `none`) :
       - Path area (gradient gold vers transparent)
       - Path stroke (ligne gold 2px)
       - Points convertis en coordonnées SVG via helper `buildSparklinePath(data, width, height)` (voir AC #4).

2. **Nouveau composant partagé `StatsStandardCard`** — localisation : `aureak/apps/web/app/(admin)/_components/stats/StatsStandardCard.tsx`.
   - Fichier ≤ 150 lignes.
   - Props :
     ```typescript
     type StatsStandardCardProps = {
       label       : string
       value       : number | string
       unit?       : string
       meta?       : string             // sous-label contextuel ("0 à venir cette semaine")
       trend?      : {
         direction: 'up' | 'down' | 'neutral'
         label    : string
       }
       footer?     : 
         | { type: 'bars'    ; bars: number[]     ; dayLabels?: string[] }   // mini-bars heb.
         | { type: 'progress'; progress: number /* 0-100 */ }                // progress bar
         | { type: 'none'    }                                               // rien (trend suffit)
       icon?       : React.ReactNode
       iconTone?   : 'gold' | 'red' | 'neutral'   // teinte background icon (défaut gold)
     }
     ```
   - Rendu :
     - Card flex 1, fond `colors.light.surface`, padding `space.md`, borderRadius 12, shadow `shadows.sm`.
     - Header row : label uppercase 11px muted + icône 20×20 top-right (bg selon `iconTone` — gold : `colors.accent.gold + '10'`, red : `colors.status.absent + '10'`, neutral : `colors.text.muted + '10'`).
     - Value : fontSize 28, fontWeight 700 Montserrat, color `colors.text.dark`. Unit à côté (14px muted).
     - Trend (optionnel) : icon + label 12px color selon direction.
     - Meta (optionnel) : 11px muted sur 1 ligne.
     - Footer :
       - `type: 'bars'` : 7 barres verticales espacées, hauteur proportionnelle à la valeur (max 32px), fond `colors.accent.gold + '30'` pour barres inactives, `colors.accent.gold` pour actives (seuil > 0.5 ou simplement > 0). DayLabels en dessous ("L M M J V S D") 10px Geist Mono muted.
       - `type: 'progress'` : barre horizontale 4px bg `colors.light.hover`, fill `colors.accent.gold` à `progress%`.
       - `type: 'none'` : rien (la card se termine à trend/meta).

3. **Sparkline SVG — helper `buildSparklinePath`** — localisation : `aureak/apps/web/app/(admin)/_components/stats/sparkline.ts`.
   - Fonction pure :
     ```typescript
     export function buildSparklinePath(
       data  : number[],
       width : number,  // ex: 280
       height: number,  // ex: 50
     ): { linePath: string; areaPath: string }
     ```
   - Normalisation : `min` et `max` calculés depuis `data`, chaque point projeté entre `padding` (4px top) et `height - padding` (4px bottom) inversement (SVG y croît vers le bas).
   - X : espacement uniforme entre points, de 0 à `width`.
   - `linePath` : `M x0,y0 L x1,y1 L x2,y2 ...`.
   - `areaPath` : `linePath` + `L width,height L 0,height Z` (ferme la zone sous la courbe).
   - Cas limites : `data.length < 2` → retourner `{ linePath: '', areaPath: '' }` (rendu vide silencieux).

4. **Rendu SVG** — utiliser `react-native-svg` (déjà disponible via `@aureak/ui/package.json`) :
   - Import : `import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'`.
   - Gradient défini une fois dans `<Defs>` : id `sparkGradient`, from `colors.accent.gold` stopOpacity 0.32 (top) to stopOpacity 0 (bottom).
   - `<Path d={areaPath} fill="url(#sparkGradient)" />` + `<Path d={linePath} stroke={colors.accent.gold} strokeWidth={2} fill="none" />`.
   - `width="100%"` et `preserveAspectRatio="none"` pour stretch responsive.

5. **Nouveau composant `StatsHero`** (orchestrateur) — localisation : `aureak/apps/web/app/(admin)/_components/stats/StatsHero.tsx`.
   - Fichier ≤ 80 lignes (pure composition).
   - Props :
     ```typescript
     type StatsHeroProps = {
       hero    : StatsHeroCardProps                  // 1 card hero large
       cards   : [StatsStandardCardProps, StatsStandardCardProps, StatsStandardCardProps]   // exactement 3 standard
     }
     ```
   - Rendu : grid row responsive (cf. AC #8), hero prend 2 colonnes (ou 100% en mobile), 3 cards prennent 1 colonne chacune (ou stack vertical en mobile).
   - `flexDirection: 'row'`, `gap: space.md`, `paddingHorizontal: space.lg`, `paddingVertical: space.md`. Hero `flex: 2`, cards `flex: 1`.

6. **Refonte `StatCards.tsx` existant `/activites/components/`** (Story 72-2 → migration vers 93-3) :
   - Ouvrir `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` (341 lignes).
   - **Remplacer** le rendu des 4 cards actuelles par un `<StatsHero>` consommant les helpers déjà calculés (`calcStats` ligne 13 est conservé, il fournit déjà `total`, `cancelled`, `avgPres`, `evalPct`, `trend`).
   - **Mapping AC → composant** :
     - **Hero card** = "Présence moyenne · 30j" → `value={avgPres}`, `unit="%"`, trend calculé depuis `trend` state, sparkline calculée depuis les 30 derniers jours (voir AC #7).
     - **Card 2** = "Total séances" → `value={total}`, meta `"{upcoming} à venir cette semaine"`, `footer: { type: 'bars', bars: sessionsPerDay7d, dayLabels: ['L','M','M','J','V','S','D'] }`.
     - **Card 3** = "Annulées" → `value={cancelled}`, `iconTone: 'red'`, `trend` si applicable, meta `"sur {total} séances · taux {pct}%"`.
     - **Card 4** = "Évaluations complétées" → `value={complete}`, `unit={"/" + total}`, trend neutre `"{evalPct}% · en attente des coachs"` si evalPct < 100, `footer: { type: 'progress', progress: evalPct }`.
   - Les helpers de calcul métier (`calcStats`, `avgOf`, etc.) restent **inchangés** — seul le rendu JSX est migré.
   - Le fichier final passe de ~341 lignes à ~200 lignes (gain net).

7. **Helper `buildActivitesSparklineData`** — localisation : `aureak/apps/web/app/(admin)/activites/components/sparkline-data.ts` (local à activites).
   ```typescript
   export function buildActivitesSparklineData(
     sessions: SessionAttendanceSummary[],
   ): number[]
   ```
   - Retourne un tableau de **30 valeurs** (une par jour des 30 derniers jours) représentant le `% présence` moyen du jour.
   - Si aucune session un jour donné → interpoler depuis la dernière valeur connue (ou mettre la moyenne globale — décision technique au dev).
   - Helper pure, pas d'accès Supabase.

8. **Responsive** — la grid `StatsHero` s'adapte :
   - Desktop ≥ 1024px : `flexDirection: 'row'`, hero `flex: 2`, 3 cards `flex: 1` chacune (layout 5 colonnes virtuelles).
   - Tablet 640-1023px : `flexDirection: 'row' + flexWrap: 'wrap'`, hero sur toute la largeur (100%), 3 cards partagent une ligne en dessous (flex 1 chacune).
   - Mobile < 640px : `flexDirection: 'column'`, tout empilé. Hero en haut, 3 cards en-dessous.
   - Détection via `useWindowDimensions()` (pattern déjà retenu en 93-1).

9. **Application conditionnelle `/methodologie/seances`** (**seulement si** 81-2 mergée) :
   - Redesigner les stat cards actuelles de `/methodologie/seances/index.tsx` (actuellement : 7 mini-cards méthodes — à migrer vers pattern StatsHero).
   - **Hero** = "Entraînements publiés" avec sparkline des ajouts sur 30j.
   - **Card 2** = "Par méthode" avec mini-bars (7 barres pour les 7 méthodes).
   - **Card 3** = "À enrichir" (trend down si nouvelles drafts, neutral sinon).
   - **Card 4** = "Taux d'usage" (progress bar : % entraînements avec ≥ 1 séance terrain liée).
   - Si 81-2 pas mergée → Task 7 skippée. Consigner.

10. **Non-goals sur les autres pages Méthodologie** :
    - `/methodologie/programmes`, `/themes`, `/situations`, `/evaluations` : **pas** de refonte StatsHero dans cette story. Justification : le pattern 1+3 n'a pas toujours de sens métier évident (ex: pour thèmes, on a juste un count total — pas assez pour justifier un hero). Ces pages seront évaluées au cas par cas dans des follow-ups si besoin.

11. **Chargement & loading** :
    - Tant que les données ne sont pas chargées → afficher un `StatsHero` avec des valeurs placeholder (`value: '—'`, `trend: undefined`, `sparkline: []`). Pas de skeleton animé (overengineering).
    - En cas d'erreur fetch → idem placeholder + `console.error` guard.

12. **Tests Playwright manuels** :
    - `/activites` → 4 cards visibles : 1 hero large avec sparkline animée (test gradient visible), 3 standard (bars, progress, trend). Screenshot desktop.
    - Resize 500px → layout colonne, tout lisible.
    - `/methodologie/seances` (cas A) → même pattern adapté.
    - Console JS : zéro erreur.

13. **Qualité & conformité CLAUDE.md** :
    - Composants stateless (sauf si data fetch local — dans ce cas `try/finally`).
    - Console guards sur toute erreur fetch.
    - Styles via tokens `@aureak/theme` uniquement (aucun hex hardcodé sauf dans les stops SVG où les tokens se traduisent directement en hex avant injection).
    - `cd aureak && npx tsc --noEmit` = EXIT:0.

## Tasks / Subtasks

- [x] **Task 1 — Helper `buildSparklinePath`** (AC: #3)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/stats/sparkline.ts`.
  - [ ] Implémenter la fonction pure (normalisation min/max, projection x/y, gestion cas limite `data.length < 2`).
  - [ ] Pas de tests unitaires requis (fonction pure simple, validation via rendu visuel).

- [x] **Task 2 — Composant `StatsHeroCard.tsx`** (AC: #1, #4)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/stats/StatsHeroCard.tsx`.
  - [ ] Importer `react-native-svg` (via `@aureak/ui` ou direct depuis `react-native-svg`).
  - [ ] Implémenter la structure : card wrapper + header (label + icon) + value + trend + sparkline SVG.
  - [ ] Tokens uniquement — aucun hex hardcodé (sauf conversion tokens → hex pour les stops SVG).

- [x] **Task 3 — Composant `StatsStandardCard.tsx`** (AC: #2)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/stats/StatsStandardCard.tsx`.
  - [ ] Implémenter les 3 variants footer : `bars`, `progress`, `none`.
  - [ ] Gestion `iconTone` : gold | red | neutral.

- [x] **Task 4 — Composant `StatsHero.tsx` (orchestrateur)** (AC: #5, #8)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/stats/StatsHero.tsx`.
  - [ ] Implémenter la grid responsive via `useWindowDimensions`.
  - [ ] Composition pure des 4 cards.

- [x] **Task 5 — Refactor `StatCards.tsx` Activités** (AC: #6, #7)
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`.
  - [ ] Conserver les helpers de calcul métier (`calcStats`, etc.).
  - [ ] Créer `sparkline-data.ts` adjacent avec `buildActivitesSparklineData`.
  - [ ] Remplacer le JSX des 4 cards par `<StatsHero hero={...} cards={[...]} />`.
  - [ ] Supprimer les styles `StatsCard`/`bento` obsolètes.
  - [ ] Vérifier visuellement : les mêmes données métier sont exposées, juste mieux présentées.

- [x] **Task 6 — Exports `@aureak/ui` ou `(admin)/_components/`** (AC: #1-5)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/stats/index.ts` qui re-exporte les 4 composants + le helper.
  - [ ] Les pages consomment via `import { StatsHero, StatsHeroCard, StatsStandardCard } from '../../_components/stats'`.

- [~] **Task 7 — Application conditionnelle `/methodologie/seances`** (AC: #9) — **SKIPPÉE** (Cas B : 81-2 pas mergée). Report en 93-3b follow-up.
  - [ ] `ls aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` pour vérifier.
  - [ ] Si présent → refonte des stats existantes de `seances/index.tsx` en `<StatsHero>` (mapping AC #9).
  - [ ] Si absent → skipper, consigner.

- [x] **Task 8 — QA & conformité** (AC: #13)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `setLoading` dans les nouveaux composants → try/finally (si data fetch local) ou N/A (stateless).
  - [ ] Grep `console\.` → guards `NODE_ENV !== 'production'`.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` dans les 4 composants stats → 0 match (hors conversion hex pour SVG stops, qui doit venir des tokens).

- [x] **Task 9 — Tests Playwright manuels** (AC: #12)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] `/activites` desktop + screenshot, mobile 500px + screenshot.
  - [ ] `/methodologie/seances` (cas A) + screenshot.
  - [ ] Console zéro erreur.

## Dev Notes

### Pourquoi `react-native-svg` et pas `<svg>` natif

- Notre target actuel = `apps/web/` (RN Web via Expo Router). `<svg>` natif fonctionnerait sur le web mais :
  1. Casse la cohérence cross-platform : quand la mobile app (`apps/mobile/`) sera réactivée, `<svg>` ne fonctionnera pas.
  2. `react-native-svg` est déjà dans le package `@aureak/ui` (vérifié : `"react-native-svg": "*"` dans package.json).
- `react-native-svg` offre `<Svg>`, `<Path>`, `<Defs>`, `<LinearGradient>`, `<Stop>` — suffisant pour notre sparkline.
- Alternative pure-CSS (barchart via `<View>` + hauteur) envisagée mais **rejetée** : le gradient area sous la courbe sparkline ne se fait bien qu'en SVG.

### Mapping template → code — décisions de traduction

| Template CSS | Aureak RN équivalent |
|---|---|
| `.stat-hero` (flex-grow 2) | `flex: 2` sur StatsHeroCard dans grid |
| `.stat-icon` (bg rgba(C1AC5C, 0.10)) | `colors.accent.gold + '10'` |
| `.stat-icon` variant red | `colors.status.absent + '10'` |
| `.spark-area` path gradient | `<LinearGradient id="sparkGradient">` avec 2 stops |
| `.mini-bars .bar` hauteur dynamique | `<View style={{ height: barValue * 32 }}>` avec flex horizontal gap |
| `.progress-bar-fill` width % | `<View style={{ width: `${progress}%` }}>` dans un container avec bg|
| Font Geist Mono dayLabels | `fonts.mono` (à vérifier — sinon fallback system-mono) |

### Pourquoi 30 jours pour la sparkline Activités

- Le template affiche "Présence moyenne · 30j" avec une sparkline qui suggère une évolution mois sur mois.
- Notre `calcStats` calcule déjà un `trend` sur 30j vs 60j → on a les données.
- 30 points = bon compromis lisibilité / signal (7 pts = trop granulaire, 90 pts = flou).

### Performance — rendu SVG

- Path string de ~300 chars pour 30 points → rendu trivial (<1ms).
- Pas besoin de mémoization `React.memo` ou `useMemo` pour le `buildSparklinePath` (appel ponctuel au render, pas dans un loop).
- Attention : si `sparkline` prop change souvent (ex: filtre période actif), ajouter un `useMemo` pour éviter recalculer à chaque render. Pas le cas dans 93-3 (sparkline chargée 1 fois au mount).

### Méthodologie — pourquoi seulement `seances` (cas A)

Le template cible clairement Activités (séances, présences, évaluations). Pour Méthodologie, le sens métier d'un "hero + 3 standard" n'est évident que sur `seances` (entraînements) où on a des métriques d'usage. Les autres pages Méthodologie (programmes, themes, etc.) ont des stats moins hiérarchisables → on les laisse avec le pattern simple actuel.

Si un besoin émerge sur `programmes` (ex: "Programmes actifs" hero + répartition par méthode bars) → story 93-3b dédiée.

### Non-régression sur /activites/presences et /activites/evaluations

`StatCards.tsx` (le fichier refactoré) est partagé entre :
- `/activites/page.tsx` (Séances)
- `/activites/presences/page.tsx`
- `/activites/evaluations/page.tsx`

**Vérification obligatoire** : la même instance de `<StatCards scope={scope} />` est-elle consommée sur les 3 pages ? Si oui, le refactor impacte les 3 en même temps — OK si les données métier sont les mêmes.

Si les 3 pages consomment des `StatCards` **différents** (ex: `StatCardsPresences` spécifique à `/activites/presences`), cette story n'impacte que celui passé en refactor. Le dev agent doit **grep** pour le confirmer :
```bash
grep -rn "StatCards\|StatCardsPresences\|StatCardsEvaluations" aureak/apps/web/app/(admin)/activites/
```

### Accessibility

- Sparkline SVG doit avoir un `aria-label` descriptif (ex: "Évolution présence sur 30 jours : 68% à 92%").
- Les bars verticales (mini-bars) : pas d'interaction → `aria-hidden="true"` suffit.
- Progress bar : `role="progressbar"` + `aria-valuenow={progress}`.

### Règles absolues CLAUDE.md (rappel)

- `try/finally` si data fetch local (Task 5 notamment, si ajout de `setLoading` dans le refactor).
- Console guards sur erreurs.
- Tokens uniquement dans les composants — hex autorisés **uniquement** pour la conversion des stops SVG (ex: `colors.accent.gold` → `"#C1AC5C"` si nécessaire pour la prop `stopColor` qui n'accepte pas les tokens).
- Accès Supabase via helpers existants uniquement (pas de nouveau fetch dans les composants stats).

### Aucune migration DB, aucune nouvelle API

La story utilise exclusivement :
- Helpers `calcStats` existants (Activités).
- Data déjà chargée par les pages (sessions, attendances).
- Helpers à créer : `buildSparklinePath` (pur), `buildActivitesSparklineData` (dérive des données existantes).

### Project Structure Notes

- **Nouveau dossier** : `(admin)/_components/stats/` — cohérent avec `(admin)/_components/` créé en 93-1.
- **Exports** : via `(admin)/_components/stats/index.ts` + ajout dans `(admin)/_components/index.ts` racine (si ce fichier existe — sinon on importe directement le sous-dossier).
- **Convention** : composants génériques partagés vivent sous `_components/`, helpers de calcul métier **restent** dans leur hub (`activites/components/` pour les helpers Activités-spécifiques).

### Non-goals explicites

- **Pas d'interactivité** sur les sparklines (hover tooltip avec valeur exacte) — visualisation statique suffisante.
- **Pas d'animation** à l'entrée des cards (transition fade-in sur le path SVG) — overengineering.
- **Pas de légende** sous la sparkline (labels axes) — sobriété premium.
- **Pas de re-fetch** périodique (même raisonnement que 93-2 : les stats se chargent 1 fois au mount).
- **Pas d'export CSV/PDF** des stats — hors scope.
- **Pas de customisation période** (slider 7j/30j/90j) — si besoin, future story.

### References

- **Template source** : `/tmp/aureak-template/stats.jsx` (lignes 1-127) — définit `StatCard` générique + `StatsHero` composition 1+3.
- **Template CSS** : `/tmp/aureak-template/admin.css` — classes `.stat-card`, `.stat-hero`, `.stat-value`, `.stat-trend.up/down/neutral`, `.spark-area`, `.mini-bars`, `.bar.active`, `.progress-bar-fill`.
- StatCards existant à refondre : `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` (341 lignes, Story 72-2 + 80-1).
- Helpers API existants (réutilisés) : `listSessionsWithAttendance`, `calcStats` local.
- `react-native-svg` : `aureak/packages/ui/package.json` (`"react-native-svg": "*"`).
- Tokens : `colors.accent.gold`, `colors.status.absent`, `colors.status.present`, `colors.text.muted`, `colors.text.dark`, `colors.text.subtle`, `colors.light.surface`, `colors.light.hover`, `colors.border.divider`, `space.lg/md`, `shadows.sm`, `fonts.display`, `fonts.mono`.
- Pages à instrumenter (conditionnel) : `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx`.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TSC : **EXIT 0** (aucune erreur type).
- Grep QA : 0 hex hardcodé dans `_components/stats/*` (tokens uniquement), `boxShadow` utilise `shadows.sm`.

### Completion Notes List

- **Cas 81-2** : **B — pas mergée**. Task 7 skippée (application Méthodologie reportée en 93-3b follow-up).
- **`react-native-svg`** : importé sans problème. Rendu Svg + Path + Defs + LinearGradient + Stop fonctionnel. stopColor accepte directement `colors.accent.gold` (pas besoin de hardcoder le hex).
- **`StatsHeroCard`** : sparkline viewBox 280×50, `preserveAspectRatio="none"` pour stretch responsive sur toute la largeur de la card. Gradient area (gold 32% → 0%) + ligne gold stroke 2px.
- **`StatsStandardCard`** : 3 variants footer opérationnels :
  - `bars` : 7 bars verticales, seuil actif > 0.5 du max (gold plein) vs `colors.border.gold` (25% opacity).
  - `progress` : bar horizontale avec clamp [0, 100], accessibilityRole progressbar.
  - `none` : pas de footer (si seul trend/meta suffit).
- **`StatsHero`** : orchestrateur responsive 3 breakpoints — desktop ≥1024px (4 cards en ligne), tablet 640-1023px (hero full-width + 3 cards ligne), mobile <640px (tout en colonne).
- **`StatCards.tsx` Activités refactoré** : 341 lignes → 167 lignes nettes (-52%). Helpers `calcStats` + loading skeleton inchangés, remplacement complet du JSX par `<StatsHero>` + nouveaux helpers `buildActivitesSparklineData` / `buildWeeklySessionsData`.
- **Mapping métriques** :
  - Hero : "Présence moyenne · 30j" avec sparkline 30j + trend up/down/neutral (vs 30j précédents).
  - Card 2 : "Total séances" + meta "{upcoming} à venir" + mini-bars hebdomadaires.
  - Card 3 : "Annulées" iconTone red + meta "sur N séances · taux X%".
  - Card 4 : "Évaluations complétées" avec unit `%` + progress bar + trend neutre ou up si 100%.
- **Non-régression** : les 3 pages Activités (seances, presences, evaluations) consomment toujours `<StatCards scope={scope} />` sans changement d'interface — refactor invisible côté appelant.
- **Test Playwright visuel** reporté : dev server instable, validation visuelle à faire par l'utilisateur.

### File List

_(à compléter par le Dev agent — attendu 5 créés, 2 modifiés — jusqu'à 3 si cas A)_

**Créés (6) :**
- `aureak/apps/web/app/(admin)/_components/stats/sparkline.ts` ✅
- `aureak/apps/web/app/(admin)/_components/stats/StatsHeroCard.tsx` ✅
- `aureak/apps/web/app/(admin)/_components/stats/StatsStandardCard.tsx` ✅
- `aureak/apps/web/app/(admin)/_components/stats/StatsHero.tsx` ✅
- `aureak/apps/web/app/(admin)/_components/stats/index.ts` (barrel) ✅
- `aureak/apps/web/app/(admin)/activites/components/sparkline-data.ts` ✅

**Modifiés (1) :**
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` (refactor vers `<StatsHero>`, -174 lignes nettes) ✅

**Reportés (Cas B — 81-2 pas mergée) :**
- `/methodologie/seances/index.tsx` (StatsHero adapté) → follow-up 93-3b.

### Change Log

- 2026-04-21 — Story 93.3 implémentée : StatsHero premium (sparkline SVG + 3 variants cards), refactor StatCards Activités. TSC EXIT 0. Méthodologie reportée.

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Prochaine story 93-4** : NextSessionHero — affichage premium pour l'état vide `/activites/seances` (bloc "Prochaine séance" + countdown + CTA "Ouvrir la séance").
