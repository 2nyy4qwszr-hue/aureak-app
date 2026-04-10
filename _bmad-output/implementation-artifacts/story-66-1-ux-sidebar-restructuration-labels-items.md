# Story 66.1 : UX — Sidebar admin : restructuration labels et items

Status: done

## Story

En tant qu'admin,
je veux que le menu latéral reflète la terminologie et la structure décidée par Jeremy,
afin que la navigation soit cohérente avec le vocabulaire du projet.

## Acceptance Criteria

1. Le nav item "Tableau de bord" est renommé en "Dashboard"
2. Dans le groupe "Activité", seul "Activités" (href `/activites`) reste visible — Séances, Présences, Évaluations sont retirés du menu (les routes restent fonctionnelles)
3. Le label du groupe "Académie" devient "Méthode"
4. Le label du groupe "Structure" devient "Académie"
5. La cloche de notification (NotificationBadge / NotificationProvider) est retirée du sidebar — le composant peut rester dans le code mais ne doit plus être rendu dans la sidebar
6. En mode collapsed (52px), les icônes restantes sont bien proportionnées : taille 20×20, padding centré, aucun débordement ni troncature
7. Les groupes Évènements, Développement, Performance restent inchangés

## Tasks / Subtasks

- [x] T1 — Modifier NAV_GROUPS dans `_layout.tsx` (AC: 1, 2, 3, 4)
  - [x] T1.1 — Renommer nav item : `label: 'Tableau de bord'` → `label: 'Dashboard'`
  - [x] T1.2 — Dans le groupe label `'Activité'`, retirer les 3 items : Séances (`/seances`), Présences (`/presences`), Évaluations (`/evaluations`) — garder uniquement `{ label: 'Activités', href: '/activites', Icon: CalendarDaysIcon }`
  - [x] T1.3 — Changer le label du groupe `'Académie'` → `'Méthode'`
  - [x] T1.4 — Changer le label du groupe `'Structure'` → `'Académie'`
  - [x] T1.5 — Mettre à jour `ITEM_SHORTCUTS` : supprimer les entrées `/seances`, `/presences`, `/evaluations` (les raccourcis ne sont plus pertinents pour ces routes non affichées dans le sidebar)

- [x] T2 — Retirer la notification du sidebar (AC: 5)
  - [x] T2.1 — Localiser le rendu de `<NotificationBadge />` dans le JSX du sidebar (chercher `NotificationBadge` dans `_layout.tsx`)
  - [x] T2.2 — Commenter ou supprimer ce rendu uniquement dans le sidebar — ne pas toucher aux providers ni aux composants eux-mêmes

- [x] T3 — Corriger les icônes en mode collapsed (AC: 6)
  - [x] T3.1 — Localiser le style des items en mode collapsed dans `_layout.tsx` (chercher `sidebarCollapsed` + rendu icône)
  - [x] T3.2 — S'assurer que le conteneur icône a `width: 20, height: 20` et que le Pressable wrapper a `alignItems: 'center', justifyContent: 'center'` avec `paddingHorizontal: 0`
  - [x] T3.3 — Vérifier qu'en mode collapsed la largeur sidebar est bien 52px et que chaque item occupe toute la largeur sans overflow

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer sur `/dashboard` → vérifier que l'item sidebar affiche "Dashboard"
  - [x] T4.2 — Vérifier que le groupe "Activité" ne contient plus que "Activités"
  - [x] T4.3 — Vérifier les labels groupes : "Méthode" et "Académie" corrects
  - [x] T4.4 — Vérifier qu'aucune cloche notification n'est visible dans le sidebar
  - [x] T4.5 — Réduire la sidebar → vérifier que les icônes sont bien centrées et proportionnées

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — NAV_GROUPS cible

État cible après modification (extrait) :

```typescript
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',        // inchangé — c'est déjà le label du groupe
    items: [
      { label: 'Dashboard', href: '/dashboard', Icon: HomeIcon },  // ← renommé
    ],
  },
  {
    label: 'Activité',
    items: [
      { label: 'Activités', href: '/activites', Icon: CalendarDaysIcon },  // ← seul item restant
      // Séances, Présences, Évaluations RETIRÉS du sidebar (routes toujours fonctionnelles)
    ],
  },
  {
    label: 'Méthode',          // ← anciennement 'Académie'
    items: [
      { label: 'Entraînements', href: '/methodologie/seances',    Icon: BookOpenIcon },
      { label: 'Thèmes',        href: '/methodologie/themes',     Icon: TagIcon },
      { label: 'Situations',    href: '/methodologie/situations', Icon: LayersIcon },
    ],
  },
  {
    label: 'Académie',         // ← anciennement 'Structure'
    items: [
      { label: 'Joueurs',       href: '/children',      Icon: UsersIcon },
      { label: 'Coachs',        href: '/coaches',       Icon: UserCheckIcon },
      { label: 'Groupes',       href: '/groups',        Icon: GridIcon },
      { label: 'Implantations', href: '/implantations', Icon: MapPinIcon },
      { label: 'Clubs',         href: '/clubs',         Icon: ShieldIcon },
    ],
  },
  // Évènements, Développement, Performance → INCHANGÉS
]
```

---

### T3 — Icônes mode collapsed

Le sidebar collapsed width = 52px. Le Pressable item doit avoir :

```tsx
// En mode collapsed
{
  width          : 52,
  paddingHorizontal: 0,
  alignItems     : 'center',
  justifyContent : 'center',
}

// L'icône elle-même
<Icon width={20} height={20} color={iconColor} />
```

Référence : `aureak/apps/web/app/(admin)/_layout.tsx` — chercher `sidebarWidth` et le rendu conditionnel `sidebarCollapsed ? ... : ...` dans les items.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | NAV_GROUPS + retrait notification + icônes collapsed |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/seances/` — les routes séances restent fonctionnelles
- `aureak/apps/web/app/(admin)/presences/` — idem
- `aureak/apps/web/app/(admin)/evaluations/` — idem
- `aureak/components/NotificationBadge.tsx` — ne pas supprimer le composant, juste ne plus le rendre dans le sidebar
- `ITEM_SHORTCUTS` peut être nettoyé mais n'est pas critique

---

### Dépendances à protéger

- Story 63.1 (sidebar refactoring — ADMIN_ITEMS cachés derrière ⚙️) — ne pas modifier `ADMIN_ITEMS`
- Story 51.7 (animation collapse smooth) — ne pas toucher à `toggleSidebar`, `sidebarCollapsed`, `labelsVisible`
- Story 51.4 (NavBadge sidebar polling) — ne pas modifier le polling `getNavBadgeCounts`

---

### Références

- Fichier cible : `aureak/apps/web/app/(admin)/_layout.tsx` — `NAV_GROUPS` lignes 108–163
- ITEM_SHORTCUTS : lignes 76–88
- Pattern sidebar collapsed : chercher `sidebarCollapsed` dans le JSX

---

### Multi-tenant

Non applicable — sidebar = navigation locale, aucune requête DB.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun debug log — changements purement cosmétiques/structurels dans NAV_GROUPS.

### Completion Notes List

- T1.1 : ligne 112 — `'Tableau de bord'` → `'Dashboard'`
- T1.2 : lignes 119-121 — Séances, Présences, Évaluations retirés du groupe Activité
- T1.3 : ligne 125 — groupe `'Académie'` → `'Méthode'`
- T1.4 : ligne 133 — groupe `'Structure'` → `'Académie'`
- T1.5 : lignes 79-81 — entrées `/seances`, `/presences`, `/evaluations` supprimées de ITEM_SHORTCUTS
- T2 : bloc `<NotificationBadge />` (+ YStack wrapper) commenté/supprimé du sidebar JSX (ligne ~572-582)
- T3 : icône collapsed passée à `size={20}`, conteneur YStack `width: 20, height: 20`, item YStack `paddingHorizontal: 0` + `alignItems/justifyContent: center` en mode collapsed

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié |
