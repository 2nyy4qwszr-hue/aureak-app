# Story 63.1 : Refactoring sidebar admin — 7 items max, renommages, ⚙️ Admin caché

Status: done

Epic: 63 — Navigation refactoring orientée usage

## Story

En tant qu'admin Aureak,
je veux une sidebar avec maximum 7 sections claires orientées usage (pas structure technique),
afin de trouver rapidement ce dont j'ai besoin sans charge cognitive inutile.

## Acceptance Criteria

1. La sidebar affiche exactement 7 sections dans cet ordre : Dashboard, Activité, Académie, Structure, Évènements, Développement, Performance.
2. La section "Administration" (Utilisateurs, Permissions, Accès temporaires, Journal d'audit, Tickets support, Anomalies, Messages coaches) est accessible uniquement via une icône ⚙️ positionnée en bas de sidebar — elle n'apparaît plus dans le menu principal.
3. Les renommages sont effectifs : "Opérations" → split Dashboard/Activité, "Méthodologie" → "Académie", "Gestion" → "Structure", "Analytics" → "Performance".
4. Toutes les routes existantes sont conservées sans modification (`/seances`, `/children`, `/analytics`, etc.) — seul le label et le groupe changent.
5. Les raccourcis clavier existants (`ITEM_SHORTCUTS`) sont mis à jour pour refléter la nouvelle structure.
6. Le clic sur ⚙️ ouvre un panneau ou une dropdown listant les items Administration — navigable comme le menu actuel.
7. Les badges dynamiques existants (story 51.4) continuent de fonctionner sur les sections Activité.
8. Sur mobile (< 768px), la sidebar collapsée affiche uniquement les icônes des 7 sections + le ⚙️ en bas.
9. La section "Développement" est présente avec les items Prospection, Marketing, Partenariats — les routes correspondantes sont de simples stubs (page "Bientôt disponible") si non encore créées.

## Tasks / Subtasks

- [x] T1 — Mettre à jour `NAV_GROUPS` dans `_layout.tsx` (AC: 1, 2, 3, 4)
  - [x] T1.1 — Remplacer `NAV_GROUPS` par la nouvelle structure en 7 groupes (voir Dev Notes)
  - [x] T1.2 — Retirer le groupe "Administration" de `NAV_GROUPS`
  - [x] T1.3 — Ajouter le groupe "Développement" avec 3 items stub
  - [x] T1.4 — Mettre à jour `ITEM_SHORTCUTS` pour les nouvelles routes

- [x] T2 — Ajouter le bouton ⚙️ Admin en bas de sidebar (AC: 2, 6)
  - [x] T2.1 — Créer un state `adminPanelOpen: boolean` dans `AdminLayoutInner`
  - [x] T2.2 — Ajouter un `HoverablePressable` avec `KeyIcon` en bas de sidebar (au-dessus du toggle dark mode)
  - [x] T2.3 — Afficher un panneau flottant (position absolute, bottom: 120, left: sidebarWidth+8) contenant les 8 items Administration quand `adminPanelOpen === true`
  - [x] T2.4 — Fermer le panneau au clic extérieur (overlay transparent `position: fixed`)
  - [x] T2.5 — Utiliser `KeyIcon` existant (SettingsIcon absent de @aureak/ui)

- [x] T3 — Créer les routes stub Développement (AC: 9)
  - [x] T3.1 — Créer `aureak/apps/web/app/(admin)/developpement/index.tsx` (re-export page)
  - [x] T3.2 — Créer `aureak/apps/web/app/(admin)/developpement/page.tsx` (hub 3 cartes)
  - [x] T3.3 — Créer `aureak/apps/web/app/(admin)/developpement/prospection/index.tsx` + `page.tsx`
  - [x] T3.4 — Créer `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx` + `page.tsx`
  - [x] T3.5 — Créer `aureak/apps/web/app/(admin)/developpement/partenariats/index.tsx` + `page.tsx`

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — NAV_GROUPS restructuré : 7 sections, Administration absent du menu principal
  - [x] T4.2 — Panneau Admin flottant avec 8 items, déclenché par KeyIcon ⚙️
  - [x] T4.3 — Navigation depuis le panneau : `router.push(item.href)` + fermeture panneau
  - [x] T4.4 — Routes `/developpement/*` et `/evenements` créées avec pages stub
  - [x] T4.5 — Badges `navBadges.presencesUnvalidated` et `navBadges.sessionsUpcoming24h` préservés sur les items Activité
  - [x] T4.6 — `npx tsc --noEmit` → 0 erreur ✅

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx` (pattern existant)
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`**
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Nouvelle structure `NAV_GROUPS`

Remplacer le tableau existant (lignes 105–159 de `_layout.tsx`) par :

```tsx
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Tableau de bord', href: '/dashboard', Icon: HomeIcon },
    ],
  },
  {
    label: 'Activité',
    items: [
      { label: 'Séances',     href: '/seances',     Icon: CalendarIcon },
      { label: 'Présences',   href: '/presences',   Icon: CheckSquareIcon },
      { label: 'Évaluations', href: '/evaluations', Icon: StarIcon },
    ],
  },
  {
    label: 'Académie',
    items: [
      { label: 'Entraînements', href: '/methodologie/seances',    Icon: BookOpenIcon },
      { label: 'Thèmes',        href: '/methodologie/themes',     Icon: TagIcon },
      { label: 'Situations',    href: '/methodologie/situations', Icon: LayersIcon },
    ],
  },
  {
    label: 'Structure',
    items: [
      { label: 'Joueurs',       href: '/children',      Icon: UsersIcon },
      { label: 'Coachs',        href: '/coaches',       Icon: UserCheckIcon },
      { label: 'Groupes',       href: '/groups',        Icon: GridIcon },
      { label: 'Implantations', href: '/implantations', Icon: MapPinIcon },
      { label: 'Clubs',         href: '/clubs',         Icon: ShieldIcon },
    ],
  },
  {
    label: 'Évènements',
    items: [
      { label: 'Tous les évènements', href: '/evenements', Icon: TargetIcon },
    ],
  },
  {
    label: 'Développement',
    items: [
      { label: 'Prospection',  href: '/developpement/prospection',  Icon: SearchIcon },
      { label: 'Marketing',    href: '/developpement/marketing',    Icon: BarChartIcon },
      { label: 'Partenariats', href: '/developpement/partenariats', Icon: ShieldIcon },
    ],
  },
  {
    label: 'Performance',
    items: [
      { label: 'Stats globales',    href: '/analytics',              Icon: BarChartIcon },
      { label: 'Par implantation',  href: '/analytics/implantation', Icon: PieChartIcon },
    ],
  },
]

// Séparé — accessible via ⚙️ uniquement
const ADMIN_ITEMS: NavItem[] = [
  { label: 'Utilisateurs',        href: '/users',                    Icon: UserIcon },
  { label: 'Accès temporaires',   href: '/access-grants',            Icon: KeyIcon },
  { label: 'Tickets support',     href: '/tickets',                  Icon: MessageSquareIcon },
  { label: 'Journal d\'audit',    href: '/audit',                    Icon: SearchIcon },
  { label: 'Calendrier scolaire', href: '/settings/school-calendar', Icon: CalendarDaysIcon },
  { label: 'Anomalies',           href: '/anomalies',                Icon: AlertTriangleIcon },
  { label: 'Messages coaches',    href: '/messages',                 Icon: ChatIcon },
  { label: 'Permissions grades',  href: '/grade-permissions',        Icon: LockIcon },
]
```

---

### T2 — Panneau Admin flottant

Pattern : bouton en bas de sidebar, panneau positionné en absolute.

```tsx
const [adminPanelOpen, setAdminPanelOpen] = useState(false)

// Bouton ⚙️ en bas de sidebar (juste au-dessus du toggle dark mode)
<HoverablePressable
  onPress={() => setAdminPanelOpen(v => !v)}
  style={{
    padding          : 10,
    borderRadius     : radius.md,
    backgroundColor  : adminPanelOpen ? colors.surface3 : 'transparent',
    alignItems       : 'center',
  }}
>
  <KeyIcon size={18} color={adminPanelOpen ? colors.gold : colors.text.muted} />
  {sidebarExpanded && (
    <Text style={{ color: colors.text.muted, fontSize: 12, marginLeft: 8 }}>Admin</Text>
  )}
</HoverablePressable>

// Panneau flottant — rendu dans un Portal ou en position absolute dans le sidebar container
{adminPanelOpen && (
  <>
    {/* overlay transparent pour fermer */}
    <Pressable
      onPress={() => setAdminPanelOpen(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 99 } as any}
    />
    {/* panneau */}
    <View style={{
      position       : 'absolute' as any,
      bottom         : 120,
      left           : sidebarWidth + 8,
      backgroundColor: colors.surface2,
      borderRadius   : radius.lg,
      borderWidth    : 1,
      borderColor    : colors.border.gold,
      padding        : 8,
      minWidth       : 220,
      zIndex         : 100,
      ...shadows.md,
    }}>
      {ADMIN_ITEMS.map(item => (
        <NavItemRow key={item.href} item={item} onPress={() => { router.push(item.href); setAdminPanelOpen(false) }} />
      ))}
    </View>
  </>
)}
```

---

### T3 — Pages stub Développement

Pattern pour chaque page stub :

```tsx
// aureak/apps/web/app/(admin)/developpement/page.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'

export default function DeveloppementPage() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🚀</Text>
        <Text style={styles.title}>Développement</Text>
        <Text style={styles.sub}>Cette section est en cours de développement.</Text>
        <Text style={styles.sub}>Prospection, Marketing et Partenariats arrivent bientôt.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light.primary },
  card      : { backgroundColor: colors.light.surface, borderRadius: radius.lg, padding: space[8], alignItems: 'center', maxWidth: 400 },
  icon      : { fontSize: 48, marginBottom: space[4] },
  title     : { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: space[2] },
  sub       : { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 22 },
})
```

---

### Mise à jour `ITEM_SHORTCUTS`

```tsx
const ITEM_SHORTCUTS: Record<string, string> = {
  '/dashboard'                    : 'G D',
  '/seances'                      : 'G S',
  '/presences'                    : 'G P',
  '/evaluations'                  : 'G E',
  '/children'                     : 'G J',
  '/clubs'                        : 'G C',
  '/methodologie/seances'         : 'G A',   // Académie
  '/evenements'                   : 'G V',   // Évènements
  '/analytics'                    : 'G R',   // peRformance
  '/developpement/prospection'    : 'G X',
}
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | NAV_GROUPS + ADMIN_ITEMS + ⚙️ panneau |
| `aureak/apps/web/app/(admin)/developpement/page.tsx` | Créer | Hub Développement stub |
| `aureak/apps/web/app/(admin)/developpement/index.tsx` | Créer | Re-export page |
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | Créer | Stub |
| `aureak/apps/web/app/(admin)/developpement/prospection/index.tsx` | Créer | Re-export |
| `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` | Créer | Stub |
| `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx` | Créer | Re-export |
| `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx` | Créer | Stub |
| `aureak/apps/web/app/(admin)/developpement/partenariats/index.tsx` | Créer | Re-export |

### Fichiers à NE PAS modifier

- `aureak/packages/ui/src/icons/` — icônes SVG non impactées
- `aureak/apps/web/components/CommandPalette.tsx` — logic séparée
- `supabase/migrations/` — aucune migration nécessaire

---

### Dépendances à protéger

- Story 51.4 utilise `NavBadgeCounts` pour les badges → ne pas modifier les clés `seances` et `presences` dans l'objet
- Story 51.7 utilise l'animation collapse sidebar → ne pas modifier `sidebarWidth` state
- Story 51.3 utilise `CommandPalette` → les hrefs dans `NAV_GROUPS` sont utilisés pour le search → mettre à jour les labels

---

### Multi-tenant

Pas de changement de logique tenant — navigation uniquement.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `radius.lg` et `radius.sm` inexistants → remplacés par `radius.cardLg` et `radius.xs`
- `colors.surface2` inexistant → remplacé par `colors.background.surface`
- `shadows.md` est une string CSS → utilisé via `boxShadow: shadows.md` (pas de spread)
- `SettingsIcon` absent de `@aureak/ui` → `KeyIcon` utilisé à la place

### Completion Notes List

- NAV_GROUPS restructuré en 7 groupes orientés usage (Dashboard, Activité, Académie, Structure, Évènements, Développement, Performance)
- ADMIN_ITEMS séparé (8 items) accessible via bouton KeyIcon en bas de sidebar
- Panneau flottant avec overlay transparent pour fermeture au clic extérieur
- Panneau se ferme aussi au changement de route (useEffect pathname)
- Routes stub créées pour /developpement (hub + 3 sous-routes) et /evenements
- Badges navBadges.presencesUnvalidated et sessionsUpcoming24h préservés sur section Activité
- ITEM_SHORTCUTS mis à jour avec les nouvelles routes
- tsc --noEmit → 0 erreur

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/developpement/page.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/index.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/prospection/index.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx` | Créé |
| `aureak/apps/web/app/(admin)/developpement/partenariats/index.tsx` | Créé |
| `aureak/apps/web/app/(admin)/evenements/page.tsx` | Créé |
| `aureak/apps/web/app/(admin)/evenements/index.tsx` | Créé |
