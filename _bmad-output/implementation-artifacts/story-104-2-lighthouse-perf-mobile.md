# Story 104.2 — Lighthouse perf mobile + optim images/bundle

Status: ready-for-dev

## Metadata

- **Epic** : 104 — QA devices + perf + a11y mobile
- **Story ID** : 104.2
- **Story key** : `104-2-lighthouse-perf-mobile`
- **Priorité** : P1
- **Dépendances** : 104.1 (bugs UI corrigés)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : M (~1-1.5j — optim lazy + bundle + images)

## Story

As an admin,
I want que les 5 pages admin les plus consultées atteignent un score Lighthouse mobile ≥ 85 sur Performance,
So que l'admin mobile charge rapidement même sur connexion 4G ou Wi-Fi dégradé.

## Contexte

### 5 pages cibles

1. `/dashboard` — page d'entrée
2. `/activites/seances` — consultation quotidienne
3. `/academie/joueurs` — gros listing (virtualisation)
4. `/performance` — hub KPIs
5. `/administration/communication/tickets` — notifs mobiles

### Cibles Lighthouse mobile

- **Performance** : ≥ 85
- **Accessibility** : ≥ 95 (traité en 104.3)
- **Best Practices** : ≥ 90
- **SEO** : non critique (admin auth only)

## Acceptance Criteria

1. **Mesures baseline** : Lighthouse mobile sur les 5 pages avant optim. Documentées dans `_bmad-output/qa-reports/epic-104-2-lighthouse-baseline.md`.

2. **Optimisations images** :
   - Conversion avatars PNG/JPG → WebP quand possible
   - `loading="lazy"` sur images below-the-fold
   - Image responsive via `srcset` (web)
   - Lazy import via `React.lazy` pour composants lourds (charts, maps)

3. **Bundle splitting** :
   - Vérifier que `expo-router` split les routes automatiquement
   - Lazy imports pour modals complexes, editors (TacticalEditor, ImplantationMap)
   - Mesurer size bundle initial desktop vs mobile

4. **Critical CSS / preload** :
   - Preload fonts principales (AureakText fonts)
   - Inline critical CSS si possible

5. **Data fetch optim** :
   - Vérifier que queries Supabase n'overfetch pas (select colonnes précises, pas `*` sur grosses tables)
   - Pagination correcte (101.4) — pas de chargement 678 clubs d'un coup

6. **Mesures après optim** : nouvelle passe Lighthouse, documentée dans `lighthouse-after.md`.

7. **Score cible atteint** :
   - Performance ≥ 85 mobile sur les 5 pages
   - Best Practices ≥ 90

8. **Non-goals** :
   - **Pas de SSR** (Expo Router web = client-side)
   - **Pas de CDN edge** (hors scope infra)
   - **Pas de service worker** offline (hors scope)

## Tasks / Subtasks

- [ ] **T1 — Baseline Lighthouse** (AC #1)
  - [ ] Générer rapports 5 pages
  - [ ] Identifier top 3 leviers

- [ ] **T2 — Optim images** (AC #2)
  - [ ] WebP conversion
  - [ ] Lazy loading

- [ ] **T3 — Bundle splitting** (AC #3)
  - [ ] Analyser bundle actuel (`expo build:analyze` ou équivalent)
  - [ ] React.lazy sur composants lourds

- [ ] **T4 — Critical ressources** (AC #4)
  - [ ] Preload fonts

- [ ] **T5 — Data fetch optim** (AC #5)
  - [ ] Grep `.select('*')` dans api-client → remplacer par colonnes précises
  - [ ] Vérifier pagination

- [ ] **T6 — Mesures après optim** (AC #6, #7)
  - [ ] Lighthouse re-run
  - [ ] Vérifier cibles atteintes

## Dev Notes

### Outil Lighthouse

`npx lighthouse http://localhost:8081/dashboard --only-categories=performance --preset=mobile --output=json --output-path=./report.json`

Throttling recommandé : 4G (simulated).

### Leviers courants

- **TBT (Total Blocking Time)** : bundle JS trop gros → split
- **LCP (Largest Contentful Paint)** : image hero lente → preload + WebP
- **CLS (Cumulative Layout Shift)** : images sans dimensions → `width`/`height` explicites
- **FID (First Input Delay)** : JS bloquant → défférer non-critiques

### Pièges Expo / RN Web

- `react-native-web` peut shipper beaucoup de code inutile — tree-shaking imparfait
- Fonts custom : doivent être préchargées

### References

- Lighthouse docs : https://developer.chrome.com/docs/lighthouse
- Expo Router bundle splitting doc
