# Bug Crawler (Analyse statique) — 2026-04-08

> Patrouille post-sprint : analyse statique des fichiers modifiés.
> Distinct du rapport runtime `2026-04-08_bug-crawler.md` (crawl Playwright).

## Périmètre

Fichiers analysés :
- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx`
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`
- `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx`
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx`
- `aureak/packages/theme/src/tokens.ts`
- `aureak/apps/web/app/(admin)/dashboard/page.tsx`

---

## CRITICAL

Aucun.

---

## HIGH

- [HIGH] Valeur de tendance hardcodée `+2.4%` affichée comme donnée réelle — `StatCards.tsx:71` — Badge "trend" affiché dans la Card 1 (Présence Moyenne) avec la valeur statique `+2.4%` qui ne varie jamais, quelle que soit la vraie tendance. L'utilisateur voit une métrique présentée comme dynamique qui est en réalité fictive.

---

## MEDIUM

- [MEDIUM] Absence d'état de chargement dans `FiltresScope` — `FiltresScope.tsx:37-75` — Les trois `useEffect` de chargement (implantations, groupes, joueurs) effectuent des appels API sans aucun état `loading`/`setLoading`. Les dropdowns restent vides sans aucun indicateur de chargement en attente. Si l'API est lente, l'UX laisse croire qu'il n'y a pas de données. Pas de risque de crash, mais UX dégradée et potentiellement confondante.

- [MEDIUM] Badge "Record" hardcodé sur la card Annulées — `StatCards.tsx:98` — La card 3 affiche systématiquement le badge "Record" (fond ambre) quel que soit le nombre réel de séances annulées. Ce badge ne reflète aucune logique métier conditionnelle.

---

## OK

- `ActivitesHeader.tsx` — conforme (composant présentationnel pur, aucun state async)
- `PseudoFiltresTemporels.tsx` — conforme (composant présentationnel pur, aucun state async)
- `aureak/packages/theme/src/tokens.ts` — conforme (fichier de constantes, aucune logique)
- `StatCards.tsx` — conforme sur try/finally (ligne 37-50) et console guard (ligne 47)
- `FiltresScope.tsx` — conforme sur console guards (lignes 43, 59, 72) et catch non silencieux
- `dashboard/page.tsx` — conforme sur tous les blocs async :
  - `load()` : try/finally `setLoading` ✓
  - `fetchUpcoming` : try/finally `setLoadingUpcoming` ✓
  - `loadCounts` : try/finally `setLoadingCounts` ✓
  - `loadStreaks` : try/finally `setLoadingStreaks` ✓
  - `loadTodaySessions` : try/finally `setLoadingTodaySessions` ✓
  - `loadUpcomingStages` : try/finally `setLoadingStages` ✓
  - `loadLeaderboard` : try/finally `setLoadingLeaderboard` ✓
  - `loadScore` : try/finally `setLoadingAcademyScore` ✓
  - `loadTrophy` : try/finally `setLoadingTrophy` ✓
  - `WeatherWidget.load()` : try/finally `setLoadingWeather` ✓ (le `return` interne à `try` déclenche quand même `finally`)
  - `SeasonTrophyTileInner.handleExport` : try/finally `setIsExporting` ✓
  - `AnomalyModal.handleResolveInModal` : try/finally `setResolving` ✓
  - Tous les `console.*` sous guard `NODE_ENV !== 'production'` ✓
  - Aucun import Supabase direct (tout via `@aureak/api-client`) ✓

---

## Chiffres

- CRITICAL : 0
- HIGH : 1
- MEDIUM : 2
- Fichiers conformes : 6 (tous conformes sur les règles CLAUDE.md obligatoires)
