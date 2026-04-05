# Story 59-10 — Gamification : Season trophy fin de saison

**Epic** : 59 — Gamification XP & Achievements
**Status** : done
**Priority** : P2 — moment de clôture saison

---

## Contexte & objectif

En fin de saison académique, générer dynamiquement un trophée visuel personnalisé pour l'académie : SVG paramétrique avec le nom de la saison, le score académie, le top 3 joueurs, et les badges collectifs. Le trophée est exportable en PNG. Il est affiché dans une tile du dashboard quand la saison est marquée `is_current = false` ET qu'une nouvelle saison est active.

---

## Dépendances

- Story 59-3 `done` — `getXPLeaderboard()` disponible (top 3 joueurs)
- Story 59-6 `done` — `getAcademyScore()` disponible (score global saison)
- Story 59-4 `done` — badges débloqués disponibles
- Tables `academy_seasons` disponibles (migrations antérieures)

---

## Acceptance Criteria

1. **AC1 — Composant SeasonTrophy** : `aureak/packages/ui/src/SeasonTrophy.tsx` accepte props `{ season: { label: string, startDate: string, endDate: string }, academyScore: number, top3: { rank: number, name: string, xp: number }[], badgeCount: number, ref?: React.Ref<SVGSVGElement> }`. Rendu : SVG inline 600×400px avec fond `colors.light.primary`, cadre doré `colors.accent.gold`, trophée SVG central, nom de saison en `typography.display` (taille 28), score académie, podium top 3 en bas, compteur badges.

2. **AC2 — SVG paramétrique** : Le SVG est 100% généré côté client via JSX React (pas d'image statique). Les éléments paramétriques : couleur du trophée selon le score (bronze < 60, argent 60–79, or 80–89, platine/diamant ≥ 90 — via `gamification.levels`), nom de saison dynamique, XP top 3 dynamiques, date de fin de saison dynamique. Aucun texte hardcodé sauf les labels UI ("Saison", "Score académie", "Champions").

3. **AC3 — Export PNG** : La fonction utilitaire `exportTrophyAsPng(svgElement: SVGSVGElement, filename: string): Promise<void>` dans `aureak/packages/ui/src/utils/exportSvgToPng.ts` :
   1. Sérialise le SVG en chaîne via `new XMLSerializer().serializeToString(svg)`
   2. Crée un `Blob` avec `type: 'image/svg+xml'`
   3. Charge dans un `Image` via `URL.createObjectURL(blob)`
   4. Dessine sur `<canvas>` 600×400
   5. `canvas.toBlob()` → `URL.createObjectURL` → `<a download>` click
   6. `URL.revokeObjectURL()` cleanup

4. **AC4 — Bouton export dans la tile** : La tile dashboard "Trophée de saison" affiche le `SeasonTrophy` en preview (50% de la taille réelle via `transform: scale(0.5)`) et un bouton "Télécharger le trophée" (variant `secondary` du composant `Button`, icône download). Le clic appelle `exportTrophyAsPng`. Le bouton affiche un spinner pendant l'export et redevient normal ensuite (try/finally).

5. **AC5 — Condition d'affichage** : La tile n'est visible que si une saison précédente terminée existe (`is_current = false, end_date < CURRENT_DATE`). La logique est dans `getSeasonTrophyData(seasonId?)` qui retourne `null` si aucune saison éligible. La tile est masquée (`display: none` ou `return null`) si les données sont null.

6. **AC6 — Chargement asynchrone des données** : La tile charge séquentiellement : `getSeasonTrophyData()` → si non null → `getAcademyScore(seasonId)` + `getXPLeaderboard(3, seasonId)` en parallèle (`Promise.all`). Skeleton pendant le chargement. Erreur silencieuse (tile masquée en cas d'échec).

7. **AC7 — Règles code** : `exportTrophyAsPng` expose toutes les erreurs canvas/blob via `if (process.env.NODE_ENV !== 'production') console.error(...)`. try/finally sur le state `isExporting`. Pas de dépendance externe (html2canvas ou similaire) — SVG → Canvas natif uniquement.

---

## Tasks

- [x] **T1** — Créer `aureak/packages/ui/src/SeasonTrophy.tsx` : SVG JSX paramétrique complet
- [x] **T2** — Créer `aureak/packages/ui/src/utils/exportSvgToPng.ts` : logique export canvas
- [x] **T3** — Créer `aureak/packages/api-client/src/gamification/season-trophy.ts` : `getSeasonTrophyData()`
- [x] **T4** — Ajouter type `SeasonTrophyData` dans `@aureak/types/src/entities.ts`
- [x] **T5** — Intégrer tile "Trophée de saison" dans `dashboard/page.tsx`
- [x] **T6** — Exporter `SeasonTrophy` et `exportTrophyAsPng` depuis `@aureak/ui`
- [x] **T7** — QA scan : pas de dépendance externe, tokens, console guards, try/finally export
- [x] **T8** — Cocher tasks, mettre Status: done

---

## Notes techniques

- Le SVG JSX dans React doit utiliser des attributs camelCase (`strokeWidth`, `textAnchor`, `dominantBaseline`) et non les attributs SVG snake_case.
- L'export PNG via Canvas peut échouer sur certains navigateurs avec des images cross-origin dans le SVG — ne pas inclure d'images externes dans le SVG pour éviter ce cas.
- La font Montserrat peut ne pas s'afficher dans le canvas export (les polices web ne sont pas disponibles dans l'export canvas sans embedding) — utiliser Arial/sans-serif en fallback dans le SVG pour l'export.
- `ref` passé au `<svg>` via `React.forwardRef` pour que la tile parente puisse appeler `exportTrophyAsPng(svgRef.current, ...)`.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/SeasonTrophy.tsx` | Créer |
| `aureak/packages/ui/src/utils/exportSvgToPng.ts` | Créer |
| `aureak/packages/api-client/src/gamification/season-trophy.ts` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — SeasonTrophyData |
| `aureak/packages/ui/src/index.ts` | Modifier — export SeasonTrophy, exportTrophyAsPng |
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier — tile trophée saison |
