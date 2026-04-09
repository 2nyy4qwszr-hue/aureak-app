# Story 82.4 : Thèmes table + Fix dropdown + Fix tab underline + Spacing Activités

Status: done

## Story

En tant qu'admin,
je veux que la page Thèmes affiche une table comme Entraînements,
que les dropdowns de méthodologie s'affichent correctement,
que les onglets s'affichent comme ceux d'Activités Séances,
et que le spacing d'Activités Séances soit cohérent avec Méthodologie.

## Acceptance Criteria

### A — Thèmes : table
1. La page Thèmes remplace la grille CSS `PremiumThemeCard` par une table identique au pattern `EntraînementsTable` de la page Entraînements.
2. Colonnes de la table : NUMÉRO (orderIndex), TITRE (theme.name), BLOC (ThemeGroup.name), MÉTAPHORE (dot vert si count > 0), VIDÉO (dot vert si séquence avec coachVideoUrl existe), STATUT (theme.isCurrent).
3. La colonne PDF affiche "—" (placeholder — donnée non disponible à ce niveau).
4. Un clic sur une ligne navigue vers `/methodologie/themes/${theme.themeKey}`.
5. Les filtres GLOBAL / BLOC (dropdown) restent identiques — le filtre par groupe fonctionne sur la table.
6. Les StatCards (1 card par ThemeGroup) restent en place et fonctionnent comme filtre cliquable.
7. Le drag&drop grid est supprimé (`dragIndex`, `hoverIndex`, `handleDrop`, `updateThemeOrder`, import `useWindowDimensions`, import `PremiumThemeCard`, le bloc `<div draggable>`) — la réorganisation drag&drop n'est plus disponible dans cette vue.
8. Les données MÉTAPHORE et VIDÉO sont chargées en parallèle avec les thèmes via `Promise.all` : une requête Supabase directe `from('theme_metaphors').select('theme_id')` pour grouper les counts, et `from('theme_sequences').select('theme_id, coach_video_url').not('coach_video_url', 'is', null)` pour les thèmes avec vidéo. Ces requêtes sont faites DIRECTEMENT dans le composant page (pas dans api-client — simple et localisé).

### B — Fix dropdown z-index (tous les pages méthodologie)
9. Le dropdown MÉTHODE/THÈME/BLOC s'affiche correctement par-dessus le reste quand on clique, même après un scroll.
10. `filtresRow` dans `seances/index.tsx`, `programmes/index.tsx`, et `themes/index.tsx` reçoit `zIndex: 9999`.

### C — Fix tab underline (tous les pages méthodologie)
11. Le soulignement or sous l'onglet actif s'affiche correctement (positionné sous le libellé).
12. Dans `seances/index.tsx`, `programmes/index.tsx`, et `themes/index.tsx` : le `Pressable` de chaque tab reçoit `style={st.tabItem}` avec `{ position: 'relative', paddingBottom: 10 }`, et `tabLabel` perd son `paddingBottom: 10`.

### D — Spacing Activités Séances
13. La section contenu de `activites/page.tsx` (`scrollContent`) reçoit `maxWidth: 1200, alignSelf: 'center', width: '100%'` pour s'aligner avec le comportement centré des pages Méthodologie sur grand écran.

## Tasks / Subtasks

- [x] T1 — API : requêtes metaphors + sequences dans la page thèmes (AC: 8)
  - [x] T1.1 — Ajouter `useState<Set<string>>` pour `themeIdsWithMetaphors` et `themeIdsWithVideo`
  - [x] T1.2 — Dans `loadData`, ajouter en parallèle :
    ```ts
    const [t, g, meta, vids] = await Promise.all([
      listThemes(),
      listThemeGroups(),
      supabase.from('theme_metaphors').select('theme_id').is('deleted_at', null),
      supabase.from('theme_sequences').select('theme_id').not('coach_video_url', 'is', null),
    ])
    setThemeIdsWithMetaphors(new Set((meta.data ?? []).map((r: {theme_id: string}) => r.theme_id)))
    setThemeIdsWithVideo(new Set((vids.data ?? []).map((r: {theme_id: string}) => r.theme_id)))
    ```
  - [x] T1.3 — Importer `supabase` depuis `@aureak/api-client` (déjà importé via autres fonctions — vérifier) → ATTENTION : si `supabase` n'est pas directement exporté par `@aureak/api-client`, utiliser `listMetaphorsByTheme` groupé OU passer par une API dédiée. Dans ce cas, charger les métaphores de tous les thèmes via Promise.all sur `listMetaphorsByTheme` serait trop coûteux ; utiliser une seule requête groupée.

  > NOTE IMPORTANT (T1.3) : Si `supabase` n'est pas exporté par `@aureak/api-client`, créer 2 petites fonctions dans `@aureak/api-client/src/referentiel/themes.ts` :
  > - `listThemeIdsWithMetaphors(): Promise<string[]>` — `select('theme_id').from('theme_metaphors').is('deleted_at', null)`
  > - `listThemeIdsWithVideo(): Promise<string[]>` — `select('theme_id').from('theme_sequences').not('coach_video_url', 'is', null)`
  > Et les exporter dans `index.ts`.

- [x] T2 — Thèmes : remplacer grille par table (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] T2.1 — Supprimer les imports : `useWindowDimensions`, `BlocsManagerModal` (garder le bouton "Gérer les blocs" → importer depuis le même fichier ou inline), `PremiumThemeCard`, `updateThemeOrder`
  - [x] T2.2 — Supprimer les états : `dragIndex`, `hoverIndex`, la fonction `handleDrop`
  - [x] T2.3 — Remplacer le bloc contenu (`{!loading && visibleThemes.length > 0 && <View display='grid'>...}`) par une `ThemesTable` inline (même pattern que `EntraînementsTable` dans `seances/index.tsx`) :
    ```
    Colonnes : NUMÉRO (52px) | TITRE (flex:1) | BLOC (120px) | MÉTAPHORE (70px) | VIDÉO (60px) | STATUT (60px)
    ```
  - [x] T2.4 — Colonne NUMÉRO : `theme.orderIndex ?? '—'`
  - [x] T2.5 — Colonne TITRE : `theme.name`
  - [x] T2.6 — Colonne BLOC : `groupMap[theme.groupId ?? ''] ?? '—'`
  - [x] T2.7 — Colonne MÉTAPHORE : `<View style={[st.statusDot, { backgroundColor: themeIdsWithMetaphors.has(theme.id) ? colors.status.present : colors.border.light }]} />`
  - [x] T2.8 — Colonne VIDÉO : `<View style={[st.statusDot, { backgroundColor: themeIdsWithVideo.has(theme.id) ? colors.status.present : colors.border.light }]} />`
  - [x] T2.9 — Colonne STATUT : dot vert si `theme.isCurrent`
  - [x] T2.10 — Ligne cliquable → `router.push('/methodologie/themes/${theme.themeKey}')`
  - [x] T2.11 — Supprimer `BlocsManagerModal` de la page si drag&drop supprimé (le bouton "Gérer les blocs" RESTE dans le header — juste ne plus inclure le Modal si plus nécessaire, sinon garder)
  - [x] T2.12 — Ajouter style `statusDot: { width: 8, height: 8, borderRadius: 4 }` (copie de seances/index.tsx)
  - [x] T2.13 — Garder le `BlocsManagerModal` et son bouton header — ne pas supprimer cette fonctionnalité

- [x] T3 — Fix dropdown zIndex (AC: 9, 10)
  - [x] T3.1 — `seances/index.tsx` : ajouter `zIndex: 9999` au style `filtresRow`
  - [x] T3.2 — `programmes/index.tsx` : ajouter `zIndex: 9999` au style `filtresRow`
  - [x] T3.3 — `themes/index.tsx` : ajouter `zIndex: 9999` au style `filtresRow`

- [x] T4 — Fix tab underline (AC: 11, 12)
  - [x] T4.1 — `seances/index.tsx` : ajouter style `tabItem: { position: 'relative', paddingBottom: 10 }` ; appliquer `style={st.tabItem}` au Pressable de chaque tab ; supprimer `paddingBottom: 10` de `tabLabel`
  - [x] T4.2 — `programmes/index.tsx` : même correction
  - [x] T4.3 — `themes/index.tsx` : même correction

- [x] T5 — Spacing Activités (AC: 13)
  - [x] T5.1 — Dans `activites/page.tsx`, `scrollContent` : ajouter `maxWidth: 1200, alignSelf: 'center', width: '100%'`

- [x] T6 — QA (AC: tous)
  - [x] T6.1 — Grep `PremiumThemeCard\|useWindowDimensions\|dragIndex\|hoverIndex` dans `themes/index.tsx` → 0 occurrence
  - [x] T6.2 — Grep `zIndex.*9999` dans `filtresRow` de seances/programmes/themes → présent
  - [x] T6.3 — Grep `tabItem` dans seances/programmes/themes → présent
  - [x] T6.4 — Grep `#[0-9a-fA-F]` dans les fichiers modifiés → 0 couleur hex introduite

## Dev Notes

### Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Remplacer grille par table + fix dropdown + fix tabs |
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Fix dropdown zIndex + fix tab underline |
| `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` | Fix dropdown zIndex + fix tab underline |
| `aureak/apps/web/app/(admin)/activites/page.tsx` | maxWidth sur scrollContent |
| `aureak/packages/api-client/src/referentiel/themes.ts` | Si supabase non exporté : 2 nouvelles fonctions |
| `aureak/packages/api-client/src/index.ts` | Si nouvelles fonctions : exporter |

### Référence pattern table (`seances/index.tsx`)

Copier les styles : `tableWrapper`, `tableHeader`, `thText`, `tableRow`, `methodCircle`, `methodPicto`, `numText`, `titleText`, `dashText`, `statusDot`, `deleteBtn`, `deleteBtnLabel`

### Note sur le supabase client

Vérifier si `supabase` est exporté par `@aureak/api-client`. Si oui, appeler directement dans la page. Si non, créer 2 fonctions API dans `referentiel/themes.ts` :
```ts
export async function listThemeIdsWithMetaphors(): Promise<string[]> {
  const { data } = await supabase
    .from('theme_metaphors')
    .select('theme_id')
    .is('deleted_at', null)
  return (data ?? []).map((r: { theme_id: string }) => r.theme_id)
}

export async function listThemeIdsWithVideo(): Promise<string[]> {
  const { data } = await supabase
    .from('theme_sequences')
    .select('theme_id')
    .not('coach_video_url', 'is', null)
  return (data ?? []).map((r: { theme_id: string }) => r.theme_id)
}
```

### Fichiers à NE PAS modifier
- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/` — pages détail non impactées
- `aureak/apps/web/app/(admin)/methodologie/themes/new.tsx` — non impacté
- `supabase/migrations/` — changement UI + queries légères uniquement

### Multi-tenant
Les requêtes directes Supabase utilisent RLS (tenant isolation automatique). Sans impact métier.
