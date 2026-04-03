# Story 40-1 — Lists: tri colonnes interactif

**Epic:** 40
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux pouvoir trier les listes de clubs et de joueurs en cliquant sur les en-têtes de colonnes afin de trouver rapidement une entrée spécifique.

## Acceptance Criteria
- [ ] AC1: Dans `clubs/page.tsx`, les colonnes Nom, Province et Partenaire sont triables (ASC/DESC)
- [ ] AC2: Dans `children/index.tsx`, les colonnes Nom, Statut et Club sont triables (ASC/DESC)
- [ ] AC3: Un clic sur un en-tête de colonne déjà actif inverse la direction (ASC→DESC ou DESC→ASC)
- [ ] AC4: Un clic sur un nouvel en-tête reset à ASC
- [ ] AC5: L'en-tête actif affiche une icône chevron ↑ (ASC) ou ↓ (DESC)
- [ ] AC6: Les en-têtes non actifs affichent un chevron neutre ↕ en couleur muted
- [ ] AC7: Le tri est côté client (sur les données déjà chargées, pas de requête Supabase supplémentaire)
- [ ] AC8: Le tri est maintenu si l'utilisateur change le filtre de recherche

## Tasks
- [ ] Modifier `aureak/apps/web/app/(admin)/clubs/page.tsx` — ajouter state `sortKey: 'nom' | 'province' | 'is_partner'` et `sortDir: 'asc' | 'desc'`, dériver `sortedClubs` via `useMemo`, ajouter en-têtes cliquables avec chevrons
- [ ] Modifier `aureak/apps/web/app/(admin)/children/index.tsx` — même pattern avec `sortKey: 'display_name' | 'statut' | 'current_club'`
- [ ] Créer ou réutiliser une icône chevron (↑↓↕) — utiliser un caractère Unicode ou icône existante dans `@aureak/ui`
- [ ] Vérifier QA: `useMemo` avec dépendances correctes, aucune re-fetch inutile

## Dev Notes
- Fichiers à modifier:
  - `aureak/apps/web/app/(admin)/clubs/page.tsx`
  - `aureak/apps/web/app/(admin)/children/index.tsx`
- Pattern state:
  ```typescript
  const [sortKey, setSortKey] = useState<SortKey>('nom')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() =>
    [...data].sort((a, b) => {
      const val = (a[sortKey] ?? '') < (b[sortKey] ?? '') ? -1 : 1
      return sortDir === 'asc' ? val : -val
    }),
    [data, sortKey, sortDir]
  )
  ```
- Style en-tête actif: `colors.accent.gold` ou `colors.text.primary` bold
- Style en-tête inactif: `colors.text.muted`
- Chevrons: `↑` `↓` `↕` (Unicode) ou Feather icons `chevron-up`/`chevron-down`
- Pas de migration Supabase nécessaire
- Le tri s'applique après filtrage (combiner avec le state de recherche existant via useMemo chaîné)
