# Story 20.3 : Admin Theme Page UX Refactor + Theme Tabs Simplification

Status: done

## Story

En tant qu'administrateur Aureak,
je veux que la page Thèmes affiche 5 colonnes sur desktop, permette de réordonner les thèmes par glisser-déposer, supporte une catégorie par thème, et que la page interne d'un thème regroupe ses onglets en 7 onglets pédagogiquement logiques,
afin d'améliorer la lisibilité, l'organisation et la structure pédagogique de l'interface d'administration.

## Acceptance Criteria

**PARTIE 1 — Page Thèmes (liste)**

1. La grille de cards affiche **5 colonnes** sur les écrans larges (≥ 1400px), 4 colonnes entre 1200–1400px, 3 entre 900–1200px, 2 entre 640–900px, 1 en dessous.
2. Les cards peuvent être **réordonnées par drag & drop** — l'ordre persisté en base via le champ `order_index` de la table `themes`.
3. Chaque thème supporte un champ **`category`** (TEXT nullable). Les valeurs exemples : `positionnement`, `prise_de_balle`, `plongeon`, `deplacement`, `jeu_au_pied`, `sortie_aerienne`, `1v1`, `tir`.
4. La catégorie est affichée sur la ThemeCard (badge distinct du badge Bloc existant).
5. Le bouton "Nouveau thème" est **correctement aligné** dans le header — pas de débordement sur petits écrans (header en flex-wrap si nécessaire).
6. La fonctionnalité de **recherche/filtre par Bloc** (story 20-1) est conservée intégralement sans régression.
7. La migration DB est **idempotente** (`ADD COLUMN IF NOT EXISTS`), non-destructive (colonnes nullable).
8. L'ordre de `listThemes()` tient compte de `order_index` en priorité (ASC, nulls en dernier), puis `name` en secondaire.

**PARTIE 2 — Page interne d'un thème (onglets)**

9. La sidebar de la page thème affiche **exactement 7 onglets** (au lieu de 11).
10. Onglet **"Terrain"** — inchangé, affiche `SectionPageTerrain`.
11. Onglet **"Identité pédagogique"** — affiche `SectionIdentite` + `SectionVisionPedagogique` empilés verticalement.
12. Onglet **"Séquences pédagogiques"** — affiche `SectionSequences` + `SectionCriteres` + `SectionMiniExercices` empilés verticalement.
13. Onglet **"Quiz & Connaissances"** — affiche `SectionQuiz`.
14. Onglet **"Savoir-faire & Évaluation"** — affiche `SectionSavoirFaire` + `SectionEvalVideo` empilés verticalement.
15. Onglet **"Badges & Progression"** — affiche `SectionBadge`.
16. Onglet **"Ressources"** — affiche `SectionRessources`.
17. Aucun composant Section existant n'est modifié (seul `page.tsx` change).
18. Les props passées aux sections sont identiques à l'implémentation actuelle.

## Tasks / Subtasks

### T1 — Migration DB + types + API (AC: 2, 3, 7, 8)

- [x] T1.1 — Créer `supabase/migrations/00070_themes_order_category.sql`
  ```sql
  ALTER TABLE themes
    ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS category    TEXT;
  ```
- [x] T1.2 — Dans `aureak/packages/types/src/entities.ts` : ajouter à `Theme`
  ```ts
  orderIndex : number          // position drag&drop (Story 20-3)
  category   : string | null   // catégorie pédagogique (Story 20-3)
  ```
- [x] T1.3 — Dans `aureak/packages/api-client/src/referentiel/themes.ts`, dans `mapTheme()` :
  ```ts
  orderIndex : r.order_index ?? 0,
  category   : r.category ?? null,
  ```
- [x] T1.4 — Dans `UpdateThemeParams`, ajouter :
  ```ts
  orderIndex?: number
  category?  : string | null
  ```
- [x] T1.5 — Dans `updateTheme()`, mapper les nouveaux champs :
  ```ts
  if (params.orderIndex !== undefined) payload.order_index = params.orderIndex
  if (params.category   !== undefined) payload.category    = params.category
  ```
- [x] T1.6 — Ajouter la fonction dédiée `updateThemeOrder(id, orderIndex)` :
  ```ts
  export async function updateThemeOrder(
    id        : string,
    orderIndex: number
  ): Promise<{ error: unknown }> {
    const { error } = await supabase
      .from('themes')
      .update({ order_index: orderIndex })
      .eq('id', id)
    return { error }
  }
  ```
- [x] T1.7 — Dans `listThemes()`, changer l'ordre :
  ```ts
  .order('order_index', { ascending: true, nullsFirst: false })
  .order('name',        { ascending: true })
  ```
- [x] T1.8 — Exporter `updateThemeOrder` dans `aureak/packages/api-client/src/index.ts`
- [x] T1.9 — Dans `CreateThemeParams`, ajouter `category?: string | null` et mapper dans `createTheme()`

### T2 — Page Thèmes : 5 colonnes + drag&drop + category badge (AC: 1, 2, 3, 4, 5, 6, 7, 8)

- [x] T2.1 — Dans `themes/index.tsx`, mettre à jour le calcul de colonnes :
  ```ts
  const gridColumns = width < 640 ? 1
    : width < 900  ? 2
    : width < 1200 ? 3
    : width < 1400 ? 4
    : 5
  ```
- [x] T2.2 — Implémenter le drag & drop HTML5 (zéro dépendance externe) :
  - Ajouter states : `dragIndex: number | null` + `hoverIndex: number | null`
  - Maintenir un state local `orderedThemes: Theme[]` (initialisé depuis `visibleThemes` triés par `orderIndex`)
  - Wrapper chaque ThemeCard dans un `<div>` avec `draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`
  - Voir pattern ci-dessous dans Dev Notes T2
- [x] T2.3 — Persister l'ordre après drop : appeler `updateThemeOrder(id, newIndex)` pour chaque thème dont l'`orderIndex` a changé (loop sur `orderedThemes`)
- [x] T2.4 — Mettre à jour `orderedThemes` localement (optimistic) sans rechargement réseau
- [x] T2.5 — Mettre à jour `ThemeCard.tsx` pour afficher le badge `category` si défini :
  - Ajouter `category?: string | null` aux props
  - Afficher un badge `category` sous le badge Bloc (positionné dans le `body`, pas sur la bannière) avec style distinct (fond bleu clair / `colors.light.muted` + bordure `colors.border.light`)
- [x] T2.6 — Corriger l'alignement du bouton "Nouveau thème" : dans `styles.header`, ajouter `flexWrap: 'wrap'` et `rowGap: space.sm` pour éviter le débordement sur petits écrans
- [x] T2.7 — Passer `category={theme.category}` dans l'appel `ThemeCard` depuis `themes/index.tsx`

### T3 — Page thème : refonte des onglets (AC: 9–18)

- [x] T3.1 — Dans `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` :
  Remplacer le type `TabId` :
  ```ts
  type TabId =
    | 'terrain'
    | 'identite-pedagogique'
    | 'sequences-pedagogiques'
    | 'quiz-connaissances'
    | 'savoir-faire-eval'
    | 'badges-progression'
    | 'ressources'
  ```
- [x] T3.2 — Remplacer la constante `TABS` :
  ```ts
  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'terrain',                label: 'Terrain',                  icon: '🖨️' },
    { id: 'identite-pedagogique',   label: 'Identité pédagogique',     icon: '📋' },
    { id: 'sequences-pedagogiques', label: 'Séquences pédagogiques',   icon: '📖' },
    { id: 'quiz-connaissances',     label: 'Quiz & Connaissances',     icon: '🧠' },
    { id: 'savoir-faire-eval',      label: 'Savoir-faire & Évaluation',icon: '🏠' },
    { id: 'badges-progression',     label: 'Badges & Progression',     icon: '🏅' },
    { id: 'ressources',             label: 'Ressources',               icon: '📁' },
  ]
  ```
- [x] T3.3 — Changer `activeTab` initial : `useState<TabId>('terrain')`
- [x] T3.4 — Remplacer `renderSection()` — pattern pour les onglets fusionnés (voir Dev Notes T3)
- [x] T3.5 — Supprimer le `showSep` / `isCore` logic de la sidebar (plus de séparateur ni de gras spécial)
- [x] T3.6 — Vérifier que les 11 imports de sections en haut du fichier sont tous conservés (aucun n'est supprimé)

### T4 — Validation et tests manuels (AC: tous)

- [x] T4.1 — Vérifier la grille 5 cols sur écran ≥ 1400px, 4 cols à 1200–1400px, 3/2/1 sur plus petits
- [x] T4.2 — Drag & drop : réordonner 2–3 thèmes, recharger la page → ordre persisté en base
- [x] T4.3 — Vérifier badge category affiché sur ThemeCard quand défini
- [x] T4.4 — Vérifier filtre Bloc (story 20-1) toujours fonctionnel après refacto
- [x] T4.5 — Vérifier bouton "Nouveau thème" sur petite fenêtre : pas de débordement
- [x] T4.6 — Page thème : vérifier les 7 onglets dans la sidebar
- [x] T4.7 — Onglet "Identité pédagogique" : vérifier que SectionIdentite ET SectionVisionPedagogique sont affichées
- [x] T4.8 — Onglet "Séquences pédagogiques" : vérifier que 3 sections sont affichées (Séquences + Critères + Mini-exercices)
- [x] T4.9 — Onglet "Savoir-faire & Évaluation" : vérifier les 2 sections
- [x] T4.10 — Vérifier qu'aucune donnée existante n'est perdue (colonnes nullable, non-destructif)

---

## Dev Notes

### Stack admin web — rappel critique

**Ce projet n'utilise PAS Tailwind.** Le stack est :
- **React Native Web** (`View`, `Pressable`, `ScrollView`, `Image`, `StyleSheet` depuis `react-native`) dans `themes/index.tsx`
- **HTML natif** (`<div>`, `<button>`) dans `themes/[themeKey]/page.tsx` (déjà établi)
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : `AureakButton`, `AureakText`, `Badge`, `Card`, `Input`

Ne pas introduire `className`, `tw()`, `clsx`, ni Tailwind.

---

### T1 — Migration 00070

Prochaine migration disponible : **00070** (la dernière est 00069_themes_image_url.sql).

```sql
-- supabase/migrations/00070_themes_order_category.sql
ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category    TEXT;
```

Idempotente. `order_index` a un DEFAULT 0, `category` est nullable sans default. Aucune contrainte CHECK imposée — les valeurs de catégorie sont libres (pas d'enum DB car les catégories sont évolutives).

---

### T2 — Pattern drag & drop HTML5 (zéro lib externe)

La grille utilise déjà le hack `display: 'grid' as never` sur un `View` RN Web. Pour le DnD, wrapper les cards dans des `<div>` HTML standards qui supportent nativement les événements drag. Le `View` parent du grid peut rester, mais chaque item est un `<div>` :

```tsx
// State dans ThemesPage
const [dragIndex,     setDragIndex]     = useState<number | null>(null)
const [orderedThemes, setOrderedThemes] = useState<Theme[]>([])

// Init orderedThemes depuis les themes chargés
useEffect(() => {
  const sorted = [...themes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  setOrderedThemes(sorted)
}, [themes])

// Filtre appliqué sur orderedThemes (pas sur themes direct)
const visibleThemes = selectedGroupId
  ? orderedThemes.filter(t => t.groupId === selectedGroupId)
  : orderedThemes

// Handler reorder
const handleDrop = async (dropIndex: number) => {
  if (dragIndex === null || dragIndex === dropIndex) return
  const reordered = [...visibleThemes]
  const [moved] = reordered.splice(dragIndex, 1)
  reordered.splice(dropIndex, 0, moved)
  // Optimistic update
  setOrderedThemes(reordered)
  // Persist — ne mettre à jour que les items dont l'index a changé
  await Promise.all(
    reordered.map((t, i) => {
      if (t.orderIndex !== i) return updateThemeOrder(t.id, i)
    }).filter(Boolean)
  )
}

// Rendu grid
<View style={{ display: 'grid', gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, gap: space.lg } as never}>
  {visibleThemes.map((theme, index) => (
    <div
      key={theme.id}
      draggable
      onDragStart={() => setDragIndex(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(index)}
      onDragEnd={() => setDragIndex(null)}
      style={{ opacity: dragIndex === index ? 0.5 : 1, cursor: 'grab', transition: 'opacity 0.15s' }}
    >
      <ThemeCard
        theme={theme}
        groupName={groupMap[theme.groupId ?? ''] ?? null}
        category={theme.category ?? null}
        onPress={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
        onManage={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
      />
    </div>
  ))}
</View>
```

**Important** : `onDragOver` doit appeler `e.preventDefault()` pour autoriser le drop.

---

### T2 — Badge Category dans ThemeCard

Le badge `category` doit être **distinct** du badge Bloc (qui est sur la bannière). Le badge category s'affiche dans le `body` de la card, entre le titre et la meta :

```tsx
// Nouvelles props ThemeCard
type Props = {
  theme    : Theme
  groupName: string | null
  category?: string | null   // ← nouveau
  onPress  : () => void
  onManage : () => void
}

// Rendu dans body (après AureakText name)
{props.category && (
  <View style={s.categoryBadge}>
    <AureakText style={s.categoryBadgeText}>{props.category}</AureakText>
  </View>
)}

// Styles
categoryBadge: {
  alignSelf       : 'flex-start',
  backgroundColor : colors.light.muted,
  borderWidth     : 1,
  borderColor     : colors.border.light,
  borderRadius    : 6,
  paddingHorizontal: 6,
  paddingVertical  : 2,
  marginTop        : 2,
},
categoryBadgeText: {
  fontSize  : 10,
  color     : colors.text.subtle,   // plus discret que le badge Bloc gold
  fontWeight: '500',
} as never,
```

---

### T3 — renderSection() avec onglets fusionnés

Le pattern pour les onglets groupés : wrapper multi-sections dans une `<div>` flex-column avec `gap: 32`. Les props des sections restent **identiques** à l'implémentation actuelle de `page.tsx`.

```tsx
const renderSection = () => {
  switch (activeTab) {
    case 'terrain':
      return <SectionPageTerrain theme={theme} criteria={criteria} tenantId={tenantId} />

    case 'identite-pedagogique':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SectionIdentite theme={theme} groups={groups} onUpdate={t => setTheme(t)} />
          <SectionVisionPedagogique themeId={theme.id} tenantId={tenantId} />
        </div>
      )

    case 'sequences-pedagogiques':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SectionSequences themeId={theme.id} tenantId={tenantId} criteria={criteria} />
          <SectionCriteres themeId={theme.id} tenantId={tenantId} criteria={criteria} onCriteriaChange={setCriteria} />
          <SectionMiniExercices themeId={theme.id} tenantId={tenantId} criteria={criteria} />
        </div>
      )

    case 'quiz-connaissances':
      return <SectionQuiz themeKey={themeKey ?? ''} themeId={theme.id} />

    case 'savoir-faire-eval':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SectionSavoirFaire themeId={theme.id} tenantId={tenantId} criteria={criteria} />
          <SectionEvalVideo themeId={theme.id} tenantId={tenantId} criteria={criteria} />
        </div>
      )

    case 'badges-progression':
      return <SectionBadge themeId={theme.id} tenantId={tenantId} />

    case 'ressources':
      return <SectionRessources themeId={theme.id} tenantId={tenantId} />

    default:
      return null
  }
}
```

**Aucun import à supprimer** — tous les 11 imports de sections restent en haut du fichier.

---

### Fichiers à modifier / créer

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00070_themes_order_category.sql` | **Créer** |
| `aureak/packages/types/src/entities.ts` | Modifier — ajouter `orderIndex`, `category` à `Theme` |
| `aureak/packages/api-client/src/referentiel/themes.ts` | Modifier — mapper + `updateThemeOrder` + `listThemes` order |
| `aureak/packages/api-client/src/index.ts` | Modifier — exporter `updateThemeOrder` |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Modifier — 5 cols + DnD + category badge |
| `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx` | Modifier — prop `category` + badge |
| `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` | Modifier — 7 onglets fusionnés |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/sections/*.tsx` — aucun composant Section n'est touché
- `aureak/apps/web/app/(admin)/methodologie/_components/BlocsManagerModal.tsx` — pas toucher
- `aureak/apps/web/app/(admin)/methodologie/situations/index.tsx` — pas toucher
- `aureak/apps/web/app/(admin)/methodologie/themes/new.tsx` — pas toucher (sauf si T1.9 le nécessite — ajouter le champ category dans le formulaire est OPTIONNEL pour cette story)
- Toute autre page admin

---

### Régression story 20-1 et 20-2 à protéger

**Story 20-1** a ajouté dans `themes/index.tsx` :
- `selectedGroupId` state + barre de filtre Blocs
- `loadData()` + `BlocsManagerModal`

**Story 20-2** a créé `ThemeCard.tsx` + grid responsive.

**Tout cela doit être conservé.** Le DnD s'intègre en parallèle du filtre — le filtre agit sur `orderedThemes` pour produire `visibleThemes`.

**Attention** : Si l'utilisateur filtre par Bloc ET réordonne, la persistance doit tenir compte de l'ordre global, pas seulement de l'ordre dans le filtre actuel. Simplification acceptable : persister les indices de `visibleThemes` uniquement (l'ordre des thèmes d'autres blocs reste inchangé).

---

### Design tokens utilisés

```tsx
import { colors, space, shadows, radius, transitions } from '@aureak/theme'

// Badge category (discret, différent du badge Bloc gold)
backgroundColor  : colors.light.muted
borderColor      : colors.border.light
color            : colors.text.subtle

// Badge Bloc (inchangé, sur bannière)
backgroundColor  : colors.accent.gold + '20'
borderColor      : colors.accent.gold + '60'
color            : colors.accent.gold

// Drag en cours
opacity          : 0.5
cursor           : 'grab'
```

---

### Multi-tenant

- `listThemes()` et `updateThemeOrder()` filtrent via RLS Supabase — aucun `tenantId` à passer en paramètre.
- `updateTheme()` (pour `category`) idem — RLS couvre la sécurité tenant.

### Project Structure Notes

- Migration 00070 suit le naming `NNNNN_description.sql`
- `updateThemeOrder` exporté via `api-client/src/index.ts` (pattern établi par stories précédentes)
- Le DnD utilise des `<div>` HTML natifs dans un fichier React Native Web — c'est cohérent avec `page.tsx` qui utilise déjà des `<div>` et `<button>` natifs. Le fichier `themes/index.tsx` reste un mélange RN/HTML, comme d'autres pages admin.
- Le `as never` cast sur `display: 'grid'` dans RN reste nécessaire.

### References

- Story 20-2 (ThemeCard + grid) : `_bmad-output/implementation-artifacts/20-2-methodologie-themes-cards-visual-upgrade.md`
- Story 20-1 (filtre Blocs) : `_bmad-output/implementation-artifacts/20-1-methodologie-ux-simplification-blocs-taxonomie.md`
- Type `Theme` : `aureak/packages/types/src/entities.ts` lignes 119–134
- API themes : `aureak/packages/api-client/src/referentiel/themes.ts`
- Page thèmes actuelle : `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx`
- ThemeCard actuelle : `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx`
- Page thème actuelle (11 onglets) : `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx`
- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern grid RN Web : `aureak/apps/web/app/(admin)/children/index.tsx` (display: 'grid' as never)
- Pattern divs HTML admin : `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` (uses `<div>`, `<button>`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1: Migration 00070 créée (`order_index INTEGER DEFAULT 0`, `category TEXT` nullable). `orderIndex` + `category` ajoutés au type `Theme`. `mapTheme()`, `UpdateThemeParams`, `updateTheme()`, `CreateThemeParams`, `createTheme()` mis à jour. Nouvelle fonction `updateThemeOrder()` ajoutée et exportée. `listThemes()` ordonne par `order_index ASC nulls last`, puis `name ASC`.
- T2: `themes/index.tsx` — 5 niveaux de colonnes (1/2/3/4/5), DnD HTML5 natif (zéro lib externe) via `<div draggable>`, `orderedThemes` state optimistic, persistance via `updateThemeOrder`. Header `flexWrap: 'wrap'` pour fix bouton overflow. `category` passé à ThemeCard.
- T3: `ThemeCard.tsx` — prop `category?: string | null` ajoutée. Badge category discret (fond `colors.light.muted`) dans le body, distinct du badge Bloc gold sur la bannière.
- T4: `themes/[themeKey]/page.tsx` — 11 onglets → 7 onglets fusionnés. `TabId` réduit à 7 valeurs. `TABS` simplifié. `renderSection()` retourne des wrappers `<div flexColumn gap:32>` pour les onglets fusionnés. `showSep`/`isCore` supprimés. Tous les 11 imports de sections conservés.
- Aucune erreur TypeScript introduite (erreurs préexistantes dans d'autres fichiers non touchés).
- Code Review fixes : `loadData` — gestion d'erreur avec `errorMsg` state + message rouge affiché. `handleDrop` — rollback `previousOrdered` si `updateThemeOrder` échoue. `hoverIndex` state ajouté — outline gold sur item cible pendant drag. Curseur `grabbing` pendant drag actif. `categoryBadgeText` corrigé `colors.text.muted` → `colors.text.subtle`.

### File List

| Fichier | Statut |
|---------|--------|
| `supabase/migrations/00070_themes_order_category.sql` | Créé |
| `aureak/packages/types/src/entities.ts` | Modifié — `orderIndex` + `category` ajoutés à `Theme` |
| `aureak/packages/api-client/src/referentiel/themes.ts` | Modifié — mapper, `updateThemeOrder`, `listThemes` order, params |
| `aureak/packages/api-client/src/index.ts` | Modifié — export `updateThemeOrder` |
| `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` | Modifié — 5 cols, DnD, orderedThemes, category, flexWrap header |
| `aureak/apps/web/app/(admin)/methodologie/_components/ThemeCard.tsx` | Modifié — prop category + badge |
| `aureak/apps/web/app/(admin)/methodologie/themes/[themeKey]/page.tsx` | Modifié — 7 onglets fusionnés |
