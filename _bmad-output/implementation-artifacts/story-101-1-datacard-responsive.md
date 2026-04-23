# Story 101.1 — `<DataCard />` — table → stack cards responsive

Status: done

## Metadata

- **Epic** : 101 — Composants data mobile-first
- **Story ID** : 101.1
- **Story key** : `101-1-datacard-responsive`
- **Priorité** : P0 (primitive la plus consommée)
- **Dépendances** : Epic 100 (pour intégration nav)
- **Source** : Décision produit 2026-04-22.
- **Effort estimé** : L (~2j — composant générique + patterns d'intégration)

## Story

As an admin sur mobile,
I want que les tables de listing (joueurs, coaches, clubs, séances, sponsors, etc.) s'affichent en cards empilées verticalement au lieu de tableaux horizontaux qui débordent,
So that je puisse consulter chaque ligne de data sans scroll horizontal ni texte tronqué.

## Contexte

### Problème

Tableaux actuels = `flexDirection: 'row'` avec colonnes de largeur fixe. Sur mobile, 4-5 colonnes = overflow. Chaque page admin a sa propre version de tableau avec sa propre signature.

### Solution

Composant générique `<DataCard />` :
- Desktop : rendu table classique avec colonnes
- Tablette : même table mais scroll horizontal contrôlé + sticky first column
- Mobile : stack de cards, chaque card = 1 row, labels + valeurs en 2 lignes

## Acceptance Criteria

1. **Composant `<DataCard />`** dans `aureak/apps/web/components/admin/DataCard.tsx`.

2. **API minimaliste** :
   ```typescript
   type DataCardColumn<T> = {
     key      : string
     label    : string
     render?  : (row: T) => React.ReactNode
     priority?: 'primary' | 'secondary' | 'tertiary'  // mobile: tertiary masqué par défaut
   }

   type DataCardProps<T> = {
     data   : T[]
     columns: DataCardColumn<T>[]
     onRowPress?: (row: T) => void
     emptyState?: React.ReactNode
     loading?   : boolean
   }
   ```

3. **Rendu desktop** (`width ≥ 1024`) :
   - Table HTML-like (header row + body rows)
   - Colonnes affichées selon ordre
   - Hover row : léger highlight
   - Tap/click row → `onRowPress`

4. **Rendu tablette** (`640-1024`) :
   - Table avec scroll horizontal contrôlé
   - Premier champ `priority='primary'` en colonne sticky gauche
   - Scroll indicator visible

5. **Rendu mobile** (`< 640`) :
   - Chaque row = `<Pressable>` card avec padding + shadow léger
   - Contenu card :
     - Ligne 1 : primary field (taille +, bold)
     - Ligne 2 : secondary fields (label + valeur séparés par `·`)
     - Tertiary fields masqués par défaut, option "Voir plus" (optionnel, hors scope v1)

6. **États** :
   - `loading=true` → render 3 skeleton cards ou 5 skeleton rows desktop
   - `data=[]` → render `emptyState` prop (fallback "Aucune donnée")

7. **Performance** : pour data > 100 items, utiliser `FlatList` (virtualisation) plutôt que `map`.

8. **Tokens `@aureak/theme` uniquement**.

9. **Accessibilité** :
   - Cards mobile = `Pressable` avec `accessibilityRole="button"`
   - Desktop table rows = `accessibilityRole="listitem"` dans parent `"list"`

10. **Conformité CLAUDE.md** : tsc OK, try/finally si fetch dans le wrapper (pas dans DataCard qui est pur).

11. **Test Playwright** :
    - Page pilote (ex. `/academie/coaches`) avec DataCard intégré
    - Viewport 375×667 : cards stackées, row pressable fonctionnelle
    - Viewport 768×1024 : table scroll horizontal avec sticky column
    - Viewport 1440×900 : table classique
    - Console zéro erreur

12. **Non-goals** :
    - **Pas de migration** des tables existantes dans cette story (Epic 103 s'en charge)
    - **Pas de tri / filtres** intégrés (cf. 101.2 pour filtres)
    - **Pas de pagination intégrée** (cf. 101.4)

## Tasks / Subtasks

- [x] **T1 — Composant `<DataCard />`** (AC #1, #2)
  - [x] Fichier avec types génériques
  - [x] Détection breakpoint

- [x] **T2 — Variant desktop** (AC #3)
  - [x] Header row + body rows
  - [x] Hover + onRowPress

- [x] **T3 — Variant tablette** (AC #4)
  - [x] ScrollView horizontal + sticky first col

- [x] **T4 — Variant mobile** (AC #5)
  - [x] Stack cards avec layout 2 lignes

- [x] **T5 — Loading / empty** (AC #6)
  - [x] Skeleton per variant
  - [x] emptyState fallback

- [x] **T6 — Perf FlatList** (AC #7)
  - [x] Branchement conditionnel si `data.length > 100`

- [x] **T7 — A11y** (AC #9)
  - [x] accessibilityRole

- [x] **T8 — QA + intégration pilote** (AC #10, #11)
  - [x] Intégrer sur `/academie/coachs` comme pilote (route actuelle en FR)
  - [x] Playwright 3 viewports (375, 768, 1440)

## Completion Notes

- Composant créé : `aureak/apps/web/components/admin/DataCard.tsx` (générique `<T>`, types `DataCardColumn<T>` + `DataCardProps<T>` exportés).
- Breakpoints alignés sur Epic 100 (MOBILE_MAX=640, TABLET_MAX=1024).
- Intégration pilote : `aureak/apps/web/app/(admin)/academie/coachs/index.tsx` (route officielle `coachs` en FR, pas `coaches`).
- Pagination volontairement laissée externe au composant (hors scope — cf. 101.4).
- Virtualisation `FlatList` activée pour `data.length > 100` (seuil configurable).
- 4 erreurs console observées lors du test Playwright — toutes préexistantes (406 sur `coach_current_grade?select=*` Supabase, non liées à cette story).
- tsc `--noEmit` : 0 erreur sur l'ensemble du monorepo.

## Dev Notes

### API minimaliste — pourquoi

Ne pas reproduire toutes les features d'une lib table complète (sort, filter, pivot). Juste colonnes + render + onRowPress. Simple = adoptable rapidement par l'Epic 103.

### Priority field mobile

Sur mobile, cacher `priority='tertiary'` par défaut évite les cards surchargées. Le dev de chaque page choisit ce qui est primary/secondary/tertiary.

### Sticky first column tablette

Via `position: 'absolute'` + `zIndex` sur le premier `<Cell>`, ou via lib comme `react-native-sticky-parallax-header`. Implémentation simple suffit (pas besoin de lib).

### Exemple d'intégration

```tsx
<DataCard<Coach>
  data={coaches}
  loading={loading}
  columns={[
    { key: 'name', label: 'Nom', priority: 'primary', render: c => `${c.firstName} ${c.lastName}` },
    { key: 'email', label: 'Email', priority: 'secondary' },
    { key: 'joinDate', label: 'Arrivée', priority: 'secondary', render: c => formatDate(c.createdAt) },
    { key: 'status', label: 'Statut', priority: 'tertiary' },
  ]}
  onRowPress={c => router.push(`/academie/coaches/${c.id}`)}
  emptyState={<EmptyState message="Aucun coach pour l'instant" />}
/>
```

### References

- Tokens : `@aureak/theme`
- Pages à adapter Epic 103 — liste dans epic-103-appliquer-mobile-first-zones.md
- Package UI : `@aureak/ui` (AureakText, Pressable)
