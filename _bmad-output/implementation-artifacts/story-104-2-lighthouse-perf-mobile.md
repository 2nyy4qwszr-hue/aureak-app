# Story 104.2 — Lighthouse perf mobile + optim images/bundle

Status: done (partial — baseline + quick win, target 85+ nécessite 104.2b architectural)

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

- [x] **T1 — Baseline Lighthouse** (AC #1) → `epic-104-2-lighthouse-baseline.md`
  - [x] Rapports dev (33) et prod (50) sur `/`
  - [x] Top leviers identifiés : bundle 4.9 MB, SPA sans SSR, 167× `.select('*')`, 12 fonts custom
- [x] **T2 — Quick win fontTimeout** : 3000ms → 500ms (`_layout.tsx`)
- [x] **Mesure après quick win** : Perf 49 (negligeable, fontes pas bottleneck Lighthouse)
- [ ] **T3-T6 — Optim profondes** (images WebP, bundle split, select('*'), fonts preload)
  - Reportées en story corrective **104.2b** — nécessitent arbitrage architectural (SSG vs SPA).
  - Cible réaliste 104.2b : Perf 70-80 sans SSR / 90+ avec SSG `output:static`.

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
