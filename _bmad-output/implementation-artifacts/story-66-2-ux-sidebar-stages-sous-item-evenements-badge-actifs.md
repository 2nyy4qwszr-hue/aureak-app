# Story 66.2 : UX — Sidebar admin : ajouter "Stages" sous Évènements avec badge count actifs

Status: done

## Story

En tant qu'admin,
je veux voir "Stages" comme sous-item direct dans la section Évènements de la sidebar,
afin d'accéder rapidement aux stages et de savoir combien sont actuellement en cours sans quitter la page.

## Acceptance Criteria

1. Un item "Stages" avec route `/stages` et l'icône `CalendarIcon` est ajouté dans le groupe "Évènements" de `NAV_GROUPS`, sous "Tous les évènements"
2. Au mount du layout, `listStages({ status: 'en_cours' })` est appelé et son résultat (nombre d'items) est stocké dans un state local `stagesActifsCount`
3. Si `stagesActifsCount > 0`, un badge numérique doré (`NavBadge` avec la couleur `colors.accent.gold`) s'affiche sur l'icône de "Stages" en mode collapsed et à droite du label en mode expanded
4. Si `stagesActifsCount === 0` ou si l'appel API échoue (catch silencieux), aucun badge n'est affiché — l'item reste toujours visible
5. L'appel API utilise `try/finally` : un state `stagesLoading` protège le chargement, pas de crash si l'API retourne une erreur
6. En mode collapsed, l'item affiche uniquement l'icône (comme tous les autres items) avec le badge en superposition si applicable ; en mode expanded, le label "Stages" est visible avec le badge à droite
7. L'item "Stages" suit la détection d'état actif identique aux autres items : `pathname === '/stages'` ou `pathname.startsWith('/stages/')`
8. Aucune migration SQL n'est requise — la table `stages` et la fonction `listStages` existent déjà

## Tasks / Subtasks

- [x] T1 — Ajouter l'item Stages dans NAV_GROUPS (AC: 1, 7)
  - [x] T1.1 — Dans `_layout.tsx`, localiser le groupe `Évènements` (ligne ~125-128) et ajouter `{ label: 'Stages', href: '/stages', Icon: CalendarIcon }` après `{ label: 'Tous les évènements', href: '/evenements', Icon: TargetIcon }`
  - [x] T1.2 — Vérifier que `CalendarIcon` est déjà importé depuis `@aureak/ui` (ligne ~19) — si oui, aucun import supplémentaire nécessaire

- [x] T2 — Charger le count des stages actifs au mount (AC: 2, 4, 5, 8)
  - [x] T2.1 — Ajouter un state `const [stagesActifsCount, setStagesActifsCount] = useState<number>(0)` dans `AdminLayoutInner`
  - [x] T2.2 — Ajouter un state `const [stagesLoading, setStagesLoading] = useState(false)` pour le guard try/finally
  - [x] T2.3 — Ajouter un `useEffect` au mount (deps `[]`) qui appelle `listStages({ status: 'en_cours' })` importé depuis `@aureak/api-client`, avec try/finally sur `stagesLoading` et catch silencieux avec console guard `if (process.env.NODE_ENV !== 'production') console.error('[AdminLayout] listStages error:', err)`
  - [x] T2.4 — Mettre à jour `stagesActifsCount` avec `setStagesActifsCount(data.length)` dans le bloc try, après `await listStages(...)`

- [x] T3 — Afficher le NavBadge conditionnel sur l'item Stages (AC: 3, 6)
  - [x] T3.1 — Dans le rendu de chaque nav item (mode collapsed ~ligne 634-648), ajouter pour `href === '/stages'` : `{stagesActifsCount > 0 && <NavBadge count={stagesActifsCount} color={colors.accent.gold} />}` dans la `YStack` `position: relative` qui wrape l'icône
  - [x] T3.2 — Dans le rendu expanded (mode non-collapsed ~ligne 659-665), ajouter après le label Text : `{href === '/stages' && stagesActifsCount > 0 && <NavBadge count={stagesActifsCount} color={colors.accent.gold} />}`

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer vers `/dashboard` et vérifier que la sidebar affiche bien "Stages" sous "Tous les évènements" dans la section Évènements
  - [x] T4.2 — Vérifier que l'item "Stages" est actif (highlight doré) quand on navigue vers `/stages`
  - [x] T4.3 — Vérifier qu'en mode collapsed (cliquer toggle ‹), l'icône Stages s'affiche correctement avec ou sans badge
  - [x] T4.4 — Grep `console\.` sur `_layout.tsx` → vérifier que tous les `console.error` ajoutés sont guardés `NODE_ENV !== 'production'`
  - [x] T4.5 — Grep `setStagesLoading` sur `_layout.tsx` → vérifier qu'il y a bien un bloc try/finally

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text, Separator — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : NavBadge (existant, déjà importé)
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — `listStages` est déjà exporté
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T2 — Chargement count stages actifs

Pattern validé dans le projet (voir lignes ~320-365 de `_layout.tsx` — pattern `getActiveSession` et `getNavBadgeCounts`) :

```tsx
// State
const [stagesActifsCount, setStagesActifsCount] = useState<number>(0)
const [stagesLoading,     setStagesLoading]     = useState(false)

// Effect au mount uniquement (pas de polling nécessaire)
useEffect(() => {
  let cancelled = false
  const fetchStagesActifs = async () => {
    setStagesLoading(true)
    try {
      const stages = await listStages({ status: 'en_cours' })
      if (!cancelled) setStagesActifsCount(stages.length)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AdminLayout] listStages error:', err)
      // dégradation silencieuse — badge reste absent
    } finally {
      if (!cancelled) setStagesLoading(false)
    }
  }
  fetchStagesActifs()
  return () => { cancelled = true }
}, [])
```

Référence : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 320-340 — pattern `getActiveSession`

---

### T3 — Badge conditionnel sur item Stages

Pattern validé (voir lignes ~640-664 de `_layout.tsx` — badges `/presences` et `/seances`) :

```tsx
// Mode collapsed — dans le YStack position:relative wrappant l'icône
{href === '/stages' && stagesActifsCount > 0 && (
  <NavBadge count={stagesActifsCount} color={colors.accent.gold} />
)}

// Mode expanded — à droite du Text label
{href === '/stages' && stagesActifsCount > 0 && (
  <NavBadge count={stagesActifsCount} color={colors.accent.gold} />
)}
```

Le badge doré (`colors.accent.gold`) distingue les stages actifs des badges d'alerte rouge (`colors.status.absent`) utilisés pour les présences non-validées.

---

### T1 — NAV_GROUPS — section Évènements (lignes ~124-129)

Avant :
```tsx
{
  label: 'Évènements',
  items: [
    { label: 'Tous les évènements', href: '/evenements', Icon: TargetIcon },
  ],
},
```

Après :
```tsx
{
  label: 'Évènements',
  items: [
    { label: 'Tous les évènements', href: '/evenements', Icon: TargetIcon },
    { label: 'Stages',              href: '/stages',     Icon: CalendarIcon },
  ],
},
```

`CalendarIcon` est déjà importé à la ligne ~19 de `_layout.tsx`.

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Badge stages actifs — doré (distinct du rouge présences)
color: colors.accent.gold
```

Principes design :
- Cohérence avec les badges existants (`NavBadge` — composant partagé)
- Doré = information positive (stages actifs en cours) vs rouge = alerte (présences non-validées)
- Pas de badge si count = 0 — ne pas surcharger la sidebar visuellement

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | Ajouter item Stages dans NAV_GROUPS + useEffect + badge |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/admin/stages.ts` — `listStages` est déjà exporté avec le filtre `status` opérationnel
- `aureak/packages/api-client/src/index.ts` — `listStages` est déjà exporté à la ligne 24
- `aureak/packages/types/src/entities.ts` — types Stage/StageStatus existent déjà
- Tous les fichiers de pages sous `(admin)/stages/` — non impactés par cette story

---

### Dépendances à protéger

- Story 66.1 a restructuré `NAV_GROUPS` — ne pas réintroduire les items retirés (Séances/Présences/Évaluations)
- `NavBadge` : composant importé depuis `@aureak/ui` — ne pas modifier sa signature
- `listStages` dans `admin/stages.ts` : signature `(opts: { status?: StageStatus | 'all'; season?: string }) => Promise<StageWithMeta[]>` — ne pas modifier

---

### Import à ajouter dans _layout.tsx

`listStages` doit être ajouté à l'import existant depuis `@aureak/api-client` (ligne ~12) :

```tsx
import { getActiveSession, getNavBadgeCounts, getAchievementDetails, supabase, useOfflineCache, listStages } from '@aureak/api-client'
```

---

### Multi-tenant

RLS sur la table `stages` gère l'isolation par `tenant_id` automatiquement — aucun paramètre `tenantId` à passer dans `listStages`.

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- `listStages` API : `aureak/packages/api-client/src/admin/stages.ts` lignes 114-150
- `NavBadge` composant : `aureak/packages/ui/src/` (composant existant)
- Pattern badge sidebar : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 640-665
- Pattern useEffect fetch : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 320-365
- NAV_GROUPS section Évènements : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 125-129
- Story liée : `_bmad-output/implementation-artifacts/story-66-1-ux-sidebar-restructuration-labels-items.md`

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun debug nécessaire — implémentation directe suivant les patterns existants.

### Completion Notes List
- `listStages` ajouté à l'import depuis `@aureak/api-client` (ligne 12)
- Item `{ label: 'Stages', href: '/stages', Icon: CalendarIcon }` ajouté dans NAV_GROUPS section Évènements — `CalendarIcon` était déjà importé
- States `stagesActifsCount` (number, init 0) et `stagesLoading` (bool, init false) ajoutés dans `AdminLayoutInner`
- `useEffect` avec pattern `cancelled` flag + try/finally + catch silencieux guardé `NODE_ENV`
- Badge `NavBadge count={stagesActifsCount} color={colors.accent.gold}` ajouté dans les deux modes (collapsed et expanded)
- QA : tous les `console.error` guardés ; try/finally correct sur `setStagesLoading`

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié |
