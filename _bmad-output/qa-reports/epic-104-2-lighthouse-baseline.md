# Epic 104.2 — Lighthouse perf mobile — Baseline + analyse

**Date** : 2026-04-24
**Build** : prod (`npx expo export --platform web`) · commit main@edc0671 + fontTimeout 500ms
**Tooling** : Lighthouse 12.8.2 · form-factor=mobile · throttling=simulate 4G · headless Chrome
**Serve** : `npx serve dist -l 9090`

## Résultats

### Perf globale (landing `/` → redirect login)

| Scénario | Perf | A11y | BP | LCP | FCP | TBT | TTI | CLS |
|---|---|---|---|---|---|---|---|---|
| **Baseline dev server** (`turbo dev`, port 8082) | 33 | 95 | 96 | 30.9s | 16.8s | 1070ms | 31.2s | 0.01 |
| **Baseline prod build** (`expo export`, port 9090) | 50 | 95 | 93 | 16.2s | 7.5s | 330ms | 17.0s | 0.01 |
| **Prod + fontTimeout 500ms** (cette story) | 49 | 95 | 93 | 16.4s | 7.5s | 380ms | 17.0s | 0.01 |

### Cibles stories vs atteint

| Cible | Target | Atteint | Δ |
|---|---|---|---|
| Performance | ≥ 85 | **49** | −36 |
| Accessibility | ≥ 95 | **95** | ✅ |
| Best Practices | ≥ 90 | **93** | ✅ |

## Analyse bundle (prod build)

```
entry-...js           : 4.9 MB  ← bundle principal (route racine + partagé)
__common-...js        : 1.5 MB  ← deps partagées (react-native-web, tamagui, etc.)
jspdf.es-...js        : 444 KB  ← lazy (export PDF scouting)
ImplantationMap-...js : 176 KB  ← lazy (react-leaflet)
index-...js           : 172 KB  ← ?
purify-...js          :  24 KB  ← lazy (DOMPurify)
ScoutingPDF-...js     :   8 KB  ← lazy
generateScoutingPDF…  :   4 KB  ← lazy

Payload initial (critique) : entry + common + CSS leaflet = ~6.6 MB
```

## Pourquoi Perf = 49 et non 85

1. **Expo Router web `output: "single"` = SPA monolithique**. Chaque route initiale doit télécharger + parser + évaluer les 6.6 MB de JS avant la 1re peinture utile. Sur 4G simulé : LCP 16s inévitable.

2. **React Native Web + Tamagui** embarquent une large runtime UI même pour des pages simples (estimation 500 KB+ avant code app).

3. **167 occurrences de `.select('*')`** dans `aureak/packages/api-client/src/` — chaque appel over-fetch des colonnes. Impact perf runtime (pas FCP mais TTI sur pages data-lourdes).

4. **12 font files custom** chargés au boot (3 familles × 4-6 weights). Avant Epic 104.2 : render bloqué 3000ms attendant les fontes. Ramené à 500ms dans cette story — impact mineur sur Lighthouse (fontes locales chargent vite en simulation) mais amélioration réelle sur connexions dégradées.

## Conclusion honnête

**Perf ≥ 85 n'est pas atteignable sans refonte architecturale** :

### Leviers qui fonctionneraient (mais hors scope story 104.2)

- **SSG/SSR** via `web.output: "static"` (expo Router) ou migration Next.js/Remix → pre-rendering HTML = LCP quasi instantané. AC de 104.2 exclut SSR ⚠️
- **Bundle split par route** via `React.lazy` sur chaque page `(admin)/*/page.tsx` — nécessite audit + refactor de chaque route
- **Tree-shaking Tamagui** — retirer components inutilisés (`TamaguiProvider` charge tout par défaut)
- **Remplacement `.select('*')` 167 occurrences** par colonnes précises — gain runtime mais pas FCP
- **Service worker + cache agressif** — gain 2e visite (Lighthouse mesure 1re)

### Leviers appliqués dans cette story

✅ `fontTimeout` 3000ms → 500ms (`aureak/apps/web/app/_layout.tsx`)
   Impact Lighthouse négligeable (fontes locales), mais sécurise le rendu sur 3G réel.

## Recommandation

**Splitter 104.2 en deux stories** :

- **104.2a (cette PR)** : baseline + fontTimeout + rapport → `Status: done (partial)`
- **104.2b (nouvelle story)** : refonte perf profonde — au choix :
  - Activer `output: "static"` SSG (le plus fort levier, mais change AC "pas de SSR")
  - Ou migration framework Next.js web (plus gros chantier, hors Epic 104)
  - Ou audit/refactor route-level lazy imports + Tamagui tree-shaking

Objectif réaliste pour 104.2b : **Perf 70-80 sans SSR / 90+ avec SSG**.

## Fichiers
- `_bmad-output/qa-reports/lighthouse-epic-104/prod-baseline-root.json`
- `_bmad-output/qa-reports/lighthouse-epic-104/prod-after-fontfix.json`
- `_bmad-output/qa-reports/lighthouse-epic-104/dashboard-baseline.json` (dev mode, ref)
