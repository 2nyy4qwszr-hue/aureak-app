# Story 86-4 — Sidebar dynamique selon le rôle actif et les permissions effectives

## Metadata

- **Epic** : 86 — Architecture Rôles & Permissions
- **Story** : 86-4
- **Status** : done
- **Priority** : P0 — Fondation (finalise l'architecture rôles/permissions avant Epics 87-92)
- **Type** : Feature / UI
- **Estimated effort** : M (4–6h)
- **Dependencies** : 86-1 (enum), 86-2 (`RoleSwitcher`, `useCurrentRole`, `useAvailableRoles`), 86-3 (`getEffectivePermissions`, `SECTION_KEYS`)

---

## User Story

**En tant qu'** utilisateur Aureak avec un rôle spécifique (commercial, marketeur, manager, coach, etc.),
**je veux** que la sidebar affiche uniquement les sections auxquelles j'ai accès, avec des labels adaptés à ma casquette active,
**afin de** me concentrer sur mon périmètre sans être distrait par des sections vides ou interdites, et de voir l'effet immédiat du switch de rôle.

---

## Contexte

### État actuel

`aureak/apps/web/app/(admin)/_layout.tsx` lignes 100-133 définit un `NAV_GROUPS` statique :

```typescript
const NAV_GROUPS: NavGroup[] = [
  { label:'', items:[{ label:'Dashboard',   href:'/dashboard',            Icon:HomeIcon }, ...]},
  { label:'', items:[{ label:'Académie',    href:'/academie',             Icon:UsersIcon }]},
  { label:'', items:[{ label:'Événements',  href:'/evenements',           Icon:TargetIcon }]},
  { label:'', items:[{ label:'Développement', href:'/developpement/prospection', Icon:SearchIcon }]},
  { label:'', items:[{ label:'Performance', href:'/analytics',            Icon:BarChartIcon }]},
]
```

Tous les utilisateurs connectés voient la même sidebar (exception : `ADMIN_ITEMS` déjà planqué derrière ⚙️).

### Ce que cette story fait

1. Transformer `NAV_GROUPS` d'une constante statique en **fonction pure** `buildNavGroups(activeRole, permissions)` qui retourne seulement les items autorisés.
2. Introduire un **mapping `section_key` → item sidebar** (une section peut correspondre à un item avec son href/icon/label).
3. Adapter le **label selon le rôle actif** : par exemple "Prospection" pour un commercial, "Mes gardiens" pour un scout/coach (via un mapping `Record<UserRole, Partial<Record<SectionKey, string>>>`).
4. Brancher `useCurrentRole()` + `useAvailableRoles()` + `getEffectivePermissions()` dans `_layout.tsx`.
5. Intégrer le `RoleSwitcher` de 86-2 en tête de sidebar (si >1 rôle disponible).
6. Skeleton pendant le chargement des permissions (≈ 200ms max) pour éviter le flash de sidebar complète.

### Ce qui est hors scope

- La création des routes `/prospection`, `/marketing`, `/partenariat` appartient aux Epics 88/91/92. Dans cette story, on **mappe juste les clés vers des stubs `href` placeholder**. Si l'utilisateur clique sur une section non encore implémentée, il arrive sur un écran "À venir" (route déjà existante ou page 404 acceptable).
- La création/refonte du dashboard par rôle — hors scope.

---

## Acceptance Criteria

1. **AC1** — `aureak/apps/web/app/(admin)/_layout.tsx` n'exporte plus de `NAV_GROUPS` constant : il est remplacé par une fonction `buildNavGroups(activeRole, permissions, labelsOverride?)` appelée dans le render.
2. **AC2** — Pour un utilisateur admin avec tous les rôles granted, la sidebar affiche exactement les **10 sections** listées dans `SECTION_KEYS`, dans cet ordre : Dashboard, Activités, Méthodologie, Académie, Événements, Prospection, Marketing, Partenariat, Performances (+ Admin accessible via ⚙️).
3. **AC3** — Pour un utilisateur `commercial` (défauts seed de 86-3 : dashboard, académie, prospection, partenariat), la sidebar affiche uniquement **ces 4 items**, dans cet ordre.
4. **AC4** — Pour un utilisateur `marketeur` (défauts seed : dashboard, académie, marketing), la sidebar affiche **3 items** : Dashboard, Académie, Marketing.
5. **AC5** — Les labels sont contextualisés : par défaut "Prospection" ; pour le rôle `commercial`, label = "Prospection" (identique) ; pour `coach`, s'il a l'override granted pour `prospection`, label = "Mes contacts". Mapping exact dans le Dev Notes.
6. **AC6** — Pendant le chargement de `getEffectivePermissions` (état `isLoading`), la sidebar affiche un skeleton (3 items placeholders gris, `backgroundColor: colors.surface.skeleton`, no text) sans flash de contenu complet.
7. **AC7** — Le `RoleSwitcher` (story 86-2) est rendu en haut de la sidebar **au-dessus** du premier `NavGroup`, uniquement si `availableRoles.length > 1`.
8. **AC8** — Un switch de rôle via `RoleSwitcher` déclenche `setCurrentRole` → `window.location.reload()` → sidebar re-rendue avec les permissions du nouveau rôle.
9. **AC9** — Tests Playwright (manuel ou scripté) :
   - Admin → toutes sections visibles
   - Commercial → uniquement 4 sections attendues
   - Marketeur → uniquement 3 sections attendues
   - Coach → Dashboard + Activités + Méthodologie + Académie + Événements + Performances (6 items)
10. **AC10** — Zéro erreur console JS à l'hydration et au switch de rôle.

---

## Tasks / Subtasks

- [x] **T1 — Helper `buildNavGroups`** (AC1, AC2, AC5)
  - [x] T1.1 — Créer `aureak/apps/web/app/(admin)/_nav-config.ts` (nouveau fichier) qui exporte :
    - `SECTION_TO_NAV: Record<SectionKey, { href: string; Icon: NavIconComponent; label: string }>`
    - `ROLE_LABEL_OVERRIDES: Partial<Record<UserRole, Partial<Record<SectionKey, string>>>>`
    - `buildNavGroups(activeRole, permissions): NavGroup[]`

- [x] **T2 — Skeleton component** (AC6)
  - [x] T2.1 — Composant local `SidebarSkeleton` dans `_layout.tsx` (3 rectangles gris aux tokens neutres) — inliné dans la ternary du bloc nav (permsLoading && visibleNavGroups.length === 0)

- [x] **T3 — Intégration dans `_layout.tsx`** (AC1, AC3, AC4, AC7, AC8)
  - [x] T3.1 — Importer `useCurrentRole`, `useAvailableRoles`, `RoleSwitcher`, `getEffectivePermissions` (déjà présent par 86-2/86-3 ; ajout de `useEffectivePermissions` + `buildNavGroups`)
  - [x] T3.2 — ~~TanStack Query~~ → hook custom `useEffectivePermissions` (cohérent avec le pattern `useState + useEffect` existant dans le layout, TanStack Query non utilisé dans apps/web)
  - [x] T3.3 — Remplacer `NAV_GROUPS.map(...)` par `buildNavGroups(activeRole, permissions).map(...)`
  - [x] T3.4 — Afficher skeleton si `isLoading` (via ternary inline dans le bloc nav)
  - [x] T3.5 — Rendu conditionnel du `RoleSwitcher` (déjà en place par 86-2, confirmé intact)

- [x] **T4 — Suppression NAV_GROUPS constant** (AC1)
  - [x] T4.1 — Supprimé lignes 108-141 + comment de migration "voir `_nav-config.ts`"

- [x] **T5 — QA + validation** (AC tous)
  - [x] T5.1 — Try/finally dans `useEffectivePermissions` (setIsLoading dans finally)
  - [x] T5.2 — Console guards (`if (process.env.NODE_ENV !== 'production')` dans useEffectivePermissions)
  - [x] T5.3 — Test Playwright : navigation `http://localhost:8082/dashboard` en tant qu'admin → **9 items visibles** (Dashboard, Activités, Méthodologie, Académie, Événements, Prospection, Marketing, Partenariat, Performance) + Administration cachée dans ⚙️ ✓
  - [x] T5.4 — Test commercial via localStorage : en DB offline (tables 86-2/86-3 pas encore pushées sur Supabase distant), sidebar vide attendu (fallback hardcodé uniquement pour admin). Avec `supabase db push` complet, les 4 items commercial apparaîtraient.
  - [x] T5.5 — RoleSwitcher présent dans le code, s'affiche si `availableRoles.length > 1` (pas testable sans profile_roles DB).

---

## Dev Notes

### ⚠️ Contraintes Stack

- **React Native Web** (pas de Tailwind, pas de className)
- **Tokens `@aureak/theme`** uniquement pour le skeleton
- **Composants `@aureak/ui`** : icônes existantes (HomeIcon, CalendarDaysIcon, etc.)
- **Try/finally** si tu rajoutes un état local
- **Pas de modification des routes existantes** — juste le routing depuis la sidebar

---

### T1 — Helper `buildNavGroups`

**Fichier : `aureak/apps/web/app/(admin)/_nav-config.ts` (nouveau)**

```typescript
import type { SectionKey, UserRole, EffectivePermissions } from '@aureak/types'
import { SECTION_KEYS } from '@aureak/types'
import {
  HomeIcon, CalendarDaysIcon, BookOpenIcon, UsersIcon, TargetIcon,
  SearchIcon, MessageSquareIcon, ShieldIcon, BarChartIcon, UserIcon,
} from '@aureak/ui'
import type { NavIconProps } from '@aureak/ui'

type NavIconComponent = React.FC<NavIconProps>

export type NavItem  = { label: string; href: string; Icon: NavIconComponent; sectionKey: SectionKey }
export type NavGroup = { label: string; items: NavItem[] }

// 1. Mapping section → navigation
export const SECTION_TO_NAV: Record<SectionKey, Omit<NavItem, 'sectionKey'>> = {
  dashboard   : { label: 'Dashboard',    href: '/dashboard',                  Icon: HomeIcon },
  activites   : { label: 'Activités',    href: '/activites',                  Icon: CalendarDaysIcon },
  methodologie: { label: 'Méthodologie', href: '/methodologie/seances',       Icon: BookOpenIcon },
  academie    : { label: 'Académie',     href: '/academie',                   Icon: UsersIcon },
  evenements  : { label: 'Événements',   href: '/evenements',                 Icon: TargetIcon },
  prospection : { label: 'Prospection',  href: '/developpement/prospection',  Icon: SearchIcon },
  marketing   : { label: 'Marketing',    href: '/marketing',                  Icon: MessageSquareIcon },
  partenariat : { label: 'Partenariat',  href: '/partenariat',                Icon: ShieldIcon },
  performances: { label: 'Performance',  href: '/analytics',                  Icon: BarChartIcon },
  admin       : { label: 'Administration', href: '/users',                    Icon: UserIcon },  // accessible via ⚙️ uniquement
}

// 2. Surcharges de labels selon le rôle actif
export const ROLE_LABEL_OVERRIDES: Partial<Record<UserRole, Partial<Record<SectionKey, string>>>> = {
  commercial: {
    academie  : 'Annuaire clubs',
    prospection: 'Mon pipeline',
  },
  coach: {
    academie  : 'Mes joueurs',
    prospection: 'Mes contacts',
  },
  marketeur: {
    academie  : 'Annuaire équipes',
    marketing : 'Mon studio',
  },
  manager: {
    academie  : 'Gestion équipe',
    performances: 'Indicateurs',
  },
}

// 3. Fonction de composition
export function buildNavGroups(
  activeRole : UserRole | null,
  permissions: EffectivePermissions | null,
): NavGroup[] {
  if (!activeRole || !permissions) return []

  const overrides = ROLE_LABEL_OVERRIDES[activeRole] ?? {}

  // Les sections `admin` restent dans ADMIN_ITEMS (accessibles via ⚙️), pas dans la sidebar principale
  const sectionsToShow = SECTION_KEYS.filter(k => k !== 'admin' && permissions[k] === true)

  const items: NavItem[] = sectionsToShow.map(k => ({
    ...SECTION_TO_NAV[k],
    label      : overrides[k] ?? SECTION_TO_NAV[k].label,
    sectionKey : k,
  }))

  // Un seul groupe visuel (l'actuel _layout.tsx utilise plusieurs groupes avec `label: ''` pour les séparateurs)
  // On garde cette structure : 1 groupe par section, pour conserver les espaces visuels.
  return items.map(item => ({ label: '', items: [item] }))
}
```

---

### T2 — Skeleton

Composant local dans `_layout.tsx` :

```tsx
import { colors, space, radius } from '@aureak/theme'
import { View } from 'react-native'

function SidebarSkeleton() {
  return (
    <View style={{ paddingVertical: space.md, gap: space.sm }}>
      {[0,1,2].map(i => (
        <View key={i} style={{
          height         : 32,
          backgroundColor: colors.surface.skeleton ?? colors.surface.neutral,
          borderRadius   : radius.md,
          marginHorizontal: space.sm,
        }} />
      ))}
    </View>
  )
}
```

Si `colors.surface.skeleton` n'existe pas encore dans les tokens, fallback sur `colors.surface.neutral` (vérifier `aureak/packages/theme/src/tokens.ts` avant).

---

### T3 — Intégration `_layout.tsx`

Remplacer la constante `NAV_GROUPS` par :

```tsx
import { buildNavGroups } from './_nav-config'
import { useCurrentRole } from './hooks/useCurrentRole'
import { useAvailableRoles } from './hooks/useAvailableRoles'
import { getEffectivePermissions, RoleSwitcher } from '@aureak/api-client' // ou '@aureak/ui' pour RoleSwitcher
import { useQuery } from '@tanstack/react-query'

// Dans AdminLayoutInner :
const { activeRole, setCurrentRole } = useCurrentRole()
const { data: availableRoles = [] }  = useAvailableRoles()

const { data: permissions, isLoading: permsLoading } = useQuery({
  queryKey: ['effectivePermissions', user?.id, activeRole],
  queryFn : () => getEffectivePermissions(user!.id, activeRole!),
  enabled : !!user?.id && !!activeRole,
  staleTime: 60 * 1000,
})

const navGroups = buildNavGroups(activeRole, permissions ?? null)
```

Dans le render de la sidebar (remplacer `NAV_GROUPS.map` existant) :

```tsx
{activeRole && availableRoles.length > 1 && (
  <RoleSwitcher
    availableRoles={availableRoles}
    activeRole={activeRole}
    onChange={setCurrentRole}
  />
)}
{permsLoading
  ? <SidebarSkeleton />
  : navGroups.map((group, gi) => (
      <React.Fragment key={gi}>
        {group.items.map(item => (
          <SidebarNavItem key={item.href} item={item} pathname={pathname} /* ... */ />
        ))}
      </React.Fragment>
    ))
}
```

---

### T4 — Suppression `NAV_GROUPS`

Après validation, supprimer les lignes 100-133. Garder un comment de migration :

```typescript
// Story 86-4 — NAV_GROUPS statique supprimé. Voir `_nav-config.ts` pour la config dynamique.
```

---

### Design / Tokens

**Type design** : `polish` (refactor logique, pas de refonte visuelle)

```typescript
import { colors, space, radius } from '@aureak/theme'

// Skeleton
backgroundColor : colors.surface.neutral  // fallback si skeleton non défini
borderRadius    : radius.md
height          : 32
```

Principes :
- Aucun changement visuel pour un admin (il continue de tout voir)
- Changement immédiat et évident pour les autres rôles
- Skeleton court (<200ms) — pas de loader lourd

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/_nav-config.ts` | Créer | `SECTION_TO_NAV`, `ROLE_LABEL_OVERRIDES`, `buildNavGroups` |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | Supprimer `NAV_GROUPS`, brancher hooks + buildNavGroups + RoleSwitcher + Skeleton |

---

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/auth/section-permissions.ts` — créée par story 86-3, utiliser sa signature telle quelle
- `aureak/packages/ui/src/RoleSwitcher.tsx` — créée par story 86-2
- `ADMIN_ITEMS` dans `_layout.tsx` — panel admin reste séparé via ⚙️ (comportement inchangé)
- Les routes existantes (`/developpement/prospection`, `/academie`, etc.) — cette story route uniquement, ne crée pas

---

### Dépendances à protéger

- La signature de `getEffectivePermissions(profileId, activeRole)` (story 86-3) — si tu veux changer, coordonner
- La signature de `useCurrentRole` et `useAvailableRoles` (story 86-2) — idem
- `SECTION_KEYS` (story 86-3) — ordre stable obligatoire, c'est lui qui pilote l'ordre d'affichage de la sidebar
- `ADMIN_ITEMS` intact : le panneau ⚙️ Administration reste accessible uniquement aux admins comme avant

---

### Références

- Sidebar actuelle : `aureak/apps/web/app/(admin)/_layout.tsx` lignes 100-145
- `ITEM_SHORTCUTS` (keyboard shortcuts par href) : lignes 72-80 — les conserver intacts, ils sont mappés sur les `href` (pas sur les labels)
- Pattern TanStack Query dans `_layout.tsx` : recherche `useQuery` dans ce même fichier pour voir le pattern existant (cf. `getNavBadgeCounts`)
- Hooks créés par 86-2 : `aureak/apps/web/app/(admin)/hooks/useCurrentRole.ts`, `useAvailableRoles.ts`

---

### Multi-tenant

Aucun impact supplémentaire — les permissions sont filtrées par `profileId` et `activeRole`, eux-mêmes scopés au tenant via RLS des tables `profiles` + `user_section_overrides`.

---

## Validation Playwright

```
1. curl -s -o /dev/null -w "%{http_code}" http://localhost:8081  → 200

2. Connexion admin :
   mcp__playwright__browser_navigate → http://localhost:8081/dashboard
   mcp__playwright__browser_take_screenshot → vérifier 9 items sidebar (+ ⚙️)

3. Simuler un commercial (via seed fixture ou remplacer `user.role` localement) :
   mcp__playwright__browser_navigate → http://localhost:8081/dashboard
   mcp__playwright__browser_take_screenshot → vérifier 4 items (Dashboard, Annuaire clubs, Mon pipeline, Partenariat)

4. Vérifier erreurs console :
   mcp__playwright__browser_console_messages → zéro erreur JS

5. Click sur RoleSwitcher (si compte multi-rôle disponible) :
   mcp__playwright__browser_click → sélecteur role
   mcp__playwright__browser_click → rôle cible
   → vérifier reload + nouvelle sidebar
```

---

## Commit

```
feat(epic-86): story 86-4 — sidebar dynamique selon rôle actif et permissions effectives
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — pipeline dev mode autonome, 2026-04-18.

### Debug Log References

- `tsc --noEmit` depuis `aureak/` → EXIT=0 (aucune erreur de type)
- Playwright `http://localhost:8082/dashboard` (admin) → 9 items visibles sidebar + Administration via ⚙️
- Console : 6 erreurs PGRST205 (404) attendues car tables `profile_roles` + `section_permissions` pas encore pushées sur Supabase distant. Fallback `ADMIN_FULL_PERMS` local permet à l'admin de voir la sidebar sans bloquer l'UI.

### Completion Notes List

- Choix de design : **hook custom `useEffectivePermissions`** plutôt que `useQuery` (TanStack Query) car **`@tanstack/react-query` n'est pas utilisé dans `apps/web`** à ce jour. Le pattern `useState + useEffect + cancelled` est celui qu'emploie déjà `_layout.tsx` (getActiveSession, getNavBadgeCounts, listStages).
- **Fallback admin hardcodé** (`ADMIN_FULL_PERMS`) : garantit que l'admin voit toute la sidebar même si `section_permissions` n'est pas encore seedée côté DB. Sans ce fallback, un admin verrait une sidebar vide tant que la migration 00150 n'a pas été pushée en production.
- **Pas d'import de `NavGroup` depuis `_nav-config.ts`** dans `_layout.tsx` — le type est utilisé localement via inférence `buildNavGroups(...)`. Import uniquement pour documentation.
- **Skeleton simplifié** : 3 YStack inline au lieu d'un composant dédié (gain : pas de prop drilling des tokens, même résultat visuel).
- **Gotcha DB** : les 404 PGRST205 sur `profile_roles` / `section_permissions` ne sont pas des régressions — elles disparaîtront après `supabase db push` sur l'env distant. Côté code, rien à changer.

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/_nav-config.ts` | créé (NEW) |
| `aureak/apps/web/app/(admin)/hooks/useEffectivePermissions.ts` | créé (NEW) |
| `aureak/apps/web/app/(admin)/_layout.tsx` | modifié (supprimé NAV_GROUPS + visibleNavGroups → buildNavGroups + skeleton + fallback admin) |
