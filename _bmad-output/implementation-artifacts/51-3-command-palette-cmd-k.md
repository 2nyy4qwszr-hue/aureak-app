# Story 51.3 : Command palette ⌘K recherche unifiée

Status: done

## Story

En tant qu'administrateur,
Je veux déclencher une palette de commandes via ⌘K (Mac) / Ctrl+K (Windows/Linux) pour rechercher des joueurs, clubs, séances et naviguer directement vers n'importe quelle page,
Afin d'accéder instantanément à n'importe quelle ressource sans toucher la souris ni connaître la structure de navigation.

## Contexte & Décisions de Design

### Inspiration
Le pattern "command palette" (style Linear, Figma, Vercel) est devenu un standard de productivité pour les outils pro. Aureak Admin est utilisé intensivement par quelques admins — ce feature multiplie la vitesse de navigation.

### Architecture
- Hook `useCommandPalette` gère l'état ouvert/fermé + query + résultats
- Composant `CommandPalette` (overlay modal) est rendu dans `_layout.tsx` au niveau root
- Recherche unifiée : joueurs (`child_directory`), clubs (`club_directory`), séances (`sessions`), pages de navigation (liste statique)

### Résultats groupés
Les résultats sont groupés par type avec header de groupe :
- **Navigation** — actions/pages statiques (ex: "Nouvelle séance", "Dashboard")
- **Joueurs** — résultats `child_directory` (nom, club, statut)
- **Clubs** — résultats `club_directory` (nom, province)
- **Séances** — résultats `sessions` (groupe, date, statut)

### Debounce
Recherche déclenchée après 150ms d'inactivité de frappe.

### Overlay
- Fond semi-transparent `colors.overlay.modal`
- Card centré : max-width 560px, radius=16, shadow gold
- Input en haut avec icône loupe
- Liste scrollable des résultats (max 320px de hauteur)
- Fermeture : Escape, clic outside

## Acceptance Criteria

**AC1 — Ouverture ⌘K / Ctrl+K**
- **Given** l'admin est sur n'importe quelle page admin
- **When** il appuie sur ⌘K (Mac) ou Ctrl+K (Windows/Linux)
- **Then** l'overlay command palette s'ouvre avec l'input focalisé automatiquement
- **And** si la palette est déjà ouverte → elle se ferme (toggle)

**AC2 — Fermeture Escape**
- **Given** la command palette est ouverte
- **When** l'admin appuie sur Escape
- **Then** la palette se ferme et le focus retourne à l'élément précédent

**AC3 — Navigation clavier dans les résultats**
- **Given** des résultats sont affichés
- **When** l'admin appuie sur `↓` ou `↑`
- **Then** le résultat sélectionné se déplace (highlight visuel `colors.accent.gold + '20'`)
- **And** `Enter` sur un résultat sélectionné → navigation vers la destination ou exécution de l'action

**AC4 — Recherche joueurs en temps réel**
- **Given** l'admin tape 2+ caractères
- **When** il tape le nom d'un joueur
- **Then** les résultats de `child_directory` s'affichent (max 5) avec nom, club actuel, statut académie
- **And** le clic/Enter navigue vers `/children/[childId]`

**AC5 — Recherche clubs**
- **Given** l'admin tape 2+ caractères correspondant à un club
- **When** les résultats sont affichés
- **Then** les clubs de `club_directory` apparaissent (max 5) avec nom et province
- **And** le clic/Enter navigue vers `/clubs/[clubId]`

**AC6 — Raccourcis de navigation statiques**
- **Given** la palette est ouverte (query vide ou avec texte)
- **When** l'admin tape le début d'une page (ex: "séan")
- **Then** des résultats de navigation statique apparaissent correspondant aux pages (ex: "Séances", "Nouvelle séance")
- **And** ces résultats sont toujours présents en premier quand la query est vide (top 6 actions fréquentes)

**AC7 — Résultats groupés avec headers**
- **Given** des résultats de plusieurs types sont retournés
- **When** l'admin voit la liste
- **Then** chaque groupe est précédé d'un header : "NAVIGATION", "JOUEURS", "CLUBS", "SÉANCES"
- **And** les headers sont en `colors.text.subtle`, `fontSize={10}`, uppercase

**AC8 — Empty state**
- **Given** l'admin a tapé 2+ caractères mais aucun résultat trouvé
- **When** la recherche est complète
- **Then** un message "Aucun résultat pour «{query}»" s'affiche avec un sous-texte d'aide

**AC9 — Loading state**
- **Given** la recherche est en cours
- **When** l'API n'a pas encore répondu
- **Then** un indicateur de chargement discret s'affiche (spinner ou skeleton rows)

**AC10 — Fermeture clic extérieur**
- **Given** la palette est ouverte
- **When** l'admin clique en dehors du modal
- **Then** la palette se ferme

## Tasks / Subtasks

- [x] Task 1 — Hook `useCommandPalette` dans `apps/web/hooks/`
  - [x] 1.1 Créer `aureak/apps/web/hooks/useCommandPalette.ts`
  - [x] 1.2 State : `isOpen: boolean`, `query: string`, `results: CommandResult[]`, `selectedIndex: number`, `isLoading: boolean`
  - [x] 1.3 Actions : `open()`, `close()`, `toggle()`, `setQuery(q)`, `selectNext()`, `selectPrev()`, `executeSelected()`
  - [x] 1.4 Debounce 150ms sur le query avant de déclencher la recherche
  - [x] 1.5 Listener keyboard `keydown` pour ⌘K/Ctrl+K → `toggle()`, Escape → `close()`, ↑↓ → `selectNext/Prev`, Enter → `executeSelected()`
  - [x] 1.6 Cleanup des listeners au unmount

- [x] Task 2 — Type `CommandResult` dans `@aureak/types`
  - [x] 2.1 Ajouter dans `aureak/packages/types/src/entities.ts` : `CommandResultType` + `CommandResult`

- [x] Task 3 — Fonction de recherche unifiée dans `@aureak/api-client`
  - [x] 3.1 Créer `aureak/packages/api-client/src/admin/search.ts`
  - [x] 3.2 `searchUnified(query: string): Promise<UnifiedSearchResult>` — sans tenantId (RLS)
  - [x] 3.3 Players : `child_directory.ilike('display_name', '%{query}%')` → top 5
  - [x] 3.4 Clubs : `club_directory.ilike('nom', '%{query}%')` → top 5
  - [x] 3.5 Sessions : join `groups(name)` + filtre client → top 5
  - [x] 3.6 Exporter depuis `@aureak/api-client/src/index.ts`

- [x] Task 4 — Liste statique des actions de navigation
  - [x] 4.1 Créer `aureak/apps/web/app/constants/navCommands.ts`
  - [x] 4.2 `NAV_COMMANDS: CommandResult[]` — 14 routes principales
  - [x] 4.3 `DEFAULT_COMMANDS` = top 6, `filterNavCommands(q)` pour filtrage

- [x] Task 5 — Composant `CommandPalette.tsx`
  - [x] 5.1 Créer `aureak/apps/web/components/CommandPalette.tsx`
  - [x] 5.2 Overlay `colors.overlay.modal` fixed fullscreen zIndex=100
  - [x] 5.3 Card max-width 560, `colors.light.surface`, radius=16, `shadows.gold`
  - [x] 5.4 TextInput + icône loupe + placeholder
  - [x] 5.5 ScrollView maxHeight=320
  - [x] 5.6 `CommandResultItem` : icône + label + sublabel + badge type
  - [x] 5.7 Highlight `colors.accent.gold + '20'` sur selectedIndex
  - [x] 5.8 Headers de groupe uppercase muted
  - [x] 5.9 Empty state si query ≥ 2 et résultats vides
  - [x] 5.10 Pressable backdrop ferme la palette

- [x] Task 6 — Intégration dans `_layout.tsx`
  - [x] 6.1 `<CommandPalette />` rendu avant le `<XStack>` principal
  - [x] 6.2 Listener ⌘K dans `useCommandPalette` (capture phase, prioritaire)
  - [x] 6.3 `useKeyboardShortcuts` : Cmd+K retiré, pas de double-listener

- [x] Task 7 — QA
  - [x] 7.1 `npx tsc --noEmit` : 0 erreur
  - [x] 7.2 Console guard présent sur error handler (`useCommandPalette.ts` ligne 179)
  - [x] 7.3 Cleanup listeners vérifié (`removeEventListener` + `clearTimeout`)

## Dev Notes

### Gestion du keyboard listener (web only)

```typescript
// useCommandPalette.ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const triggerKey = isMac ? e.metaKey : e.ctrlKey
    if (triggerKey && e.key === 'k') {
      e.preventDefault()
      toggle()
    }
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowDown') selectNext()
    if (e.key === 'ArrowUp')   selectPrev()
    if (e.key === 'Enter')     executeSelected()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }
}, [isOpen])
```

### Pattern recherche avec debounce

```typescript
const debouncedQuery = useRef<ReturnType<typeof setTimeout> | null>(null)

const handleQueryChange = (q: string) => {
  setQuery(q)
  if (debouncedQuery.current) clearTimeout(debouncedQuery.current)
  if (q.length < 2) { setResults(filterNavCommands(q)); return }
  debouncedQuery.current = setTimeout(async () => {
    setIsLoading(true)
    try {
      const data = await searchUnified(q, tenantId)
      setResults(buildResults(data, q))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CommandPalette] search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, 150)
}
```

### Nota bene : coexistence avec `useKeyboardShortcuts`
Le hook `useKeyboardShortcuts` existant gère d'autres raccourcis (`G J`, `G S`, etc. — Story 51-6). S'assurer que le listener ⌘K de `useCommandPalette` est prioritaire et appelle `e.preventDefault()` pour éviter tout conflit.

## File List

### New Files
- `aureak/apps/web/app/components/CommandPalette.tsx` — overlay modal command palette
- `aureak/apps/web/app/hooks/useCommandPalette.ts` — state + keyboard + search logic
- `aureak/apps/web/app/constants/navCommands.ts` — liste statique actions/pages navigation
- `aureak/packages/api-client/src/admin/search.ts` — `searchUnified()`

### Modified Files
- `aureak/packages/types/src/entities.ts` — `CommandResult`, `CommandResultType`
- `aureak/packages/api-client/src/index.ts` — export `searchUnified`
- `aureak/apps/web/app/(admin)/_layout.tsx` — rendu `<CommandPalette />` au level root

## Dev Agent Record

- [ ] Story créée le 2026-04-04
- [ ] Dépendances : Story 51-1 (optionnel), Story 51-6 (à coordonner sur les keyboard listeners)

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
