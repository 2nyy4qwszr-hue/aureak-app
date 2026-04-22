# Story 92.1 — Hub Partenariat (2 onglets : Sponsors, Clubs Partenaires)

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 92 — Partenariat
- **Story ID** : 92.1
- **Story key** : `92-1-partenariat-sidebar-page-hub`
- **Priorité** : P2
- **Dépendances** : Epic 86 done ✅ (item sidebar `partenariat` déjà configuré → `href: '/partenariat'` dans `lib/admin/nav-config.ts:58`)
- **Source** : brainstorming 2026-04-18 idée #31 (Section Partenariat = structure posée, contenu à venir)
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (1 NavBar + 1 layout + 2 pages placeholder, aucune migration, aucun type, aucune API)

## Story

En tant qu'admin,
je veux une section Partenariat structurée avec 2 onglets (Sponsors, Clubs partenaires),
afin d'organiser les activités de partenariat depuis un hub centralisé cohérent avec les hubs Académie, Marketing et Prospection.

## Acceptance Criteria

1. La route `/partenariat` affiche un hub avec une `PartenariatNavBar` à 2 onglets
2. Onglets dans l'ordre : **SPONSORS | CLUBS PARTENAIRES**
3. Chaque onglet redirige vers sa sous-route (`/partenariat/sponsors`, `/partenariat/clubs`)
4. Le layout suit le pattern `AcademieNavBar` existant (onglets horizontaux, `ScrollView` + `Pressable`, indicateur actif gold `colors.accent.gold`)
5. Chaque page placeholder affiche un empty state "Bientôt disponible" + icône centrée + fond `colors.light.primary`
6. La route racine `/partenariat` redirige automatiquement vers `/partenariat/sponsors`
7. L'item sidebar Partenariat (déjà configuré en Epic 86 → `href: '/partenariat'`) continue de fonctionner sans modification de `lib/admin/nav-config.ts`
8. **Cohabitation historique** : la page existante `(admin)/partnerships/index.tsx` (Story 11.3 Epic 11) reste accessible telle quelle — aucune modification ni suppression dans cette story. La refonte vers `/partenariat/clubs` est couverte par Story 92.3.

## Tasks / Subtasks

- [ ] Task 1 — `PartenariatNavBar` composant (AC: #1, #2, #4)
  - [ ] Créer `aureak/apps/web/components/admin/partenariat/PartenariatNavBar.tsx`
  - [ ] 2 onglets dans l'ordre : SPONSORS (`/partenariat/sponsors`), CLUBS PARTENAIRES (`/partenariat/clubs`)
  - [ ] Pattern exact de `AcademieNavBar` : `useRouter`, `usePathname`, `ScrollView horizontal`, `Pressable`, `borderBottomColor: colors.accent.gold` pour actif
  - [ ] Styles : `@aureak/theme` tokens uniquement (`colors`, `space`)
  - [ ] Pas de `SubtabCount` dans cette story (pas de counts tant que 92.2 et 92.3 n'ont pas livré les data)

- [ ] Task 2 — Layout partenariat (AC: #1, #6)
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/_layout.tsx` avec `PartenariatNavBar` + `Slot`
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/page.tsx` avec `<Redirect href="/partenariat/sponsors" />`
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/index.tsx` (re-export de `./page`)

- [ ] Task 3 — Page placeholder Sponsors (AC: #5)
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/sponsors/page.tsx` — empty state "Sponsors — bientôt disponible"
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/sponsors/index.tsx` (re-export)

- [ ] Task 4 — Page placeholder Clubs Partenaires (AC: #5)
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/clubs/page.tsx` — empty state "Clubs partenaires — bientôt disponible"
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/clubs/index.tsx` (re-export)

- [ ] Task 5 — Validation (AC: tous)
  - [ ] Démarrer `npx turbo dev --filter=web` et vérifier `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/partenariat` ≈ 200
  - [ ] Naviguer sur `/partenariat` → redirigé vers `/partenariat/sponsors`
  - [ ] Cliquer SPONSORS puis CLUBS PARTENAIRES → bon contenu placeholder affiché, bordure gold sur onglet actif
  - [ ] `npx tsc --noEmit` OK
  - [ ] Vérifier via `grep -rn "setLoading(false)\|setSaving(false)" aureak/apps/web/app/(admin)/partenariat/` — aucune occurrence hors `finally {}`
  - [ ] Vérifier que l'ancienne page `(admin)/partnerships/index.tsx` (Story 11.3) continue de rendre correctement sans erreur console

## Dev Notes

### ⚠️ Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet` — pas de `<div>`, pas de Tailwind
- Styles UNIQUEMENT via `@aureak/theme` tokens (`colors`, `space`) — jamais de couleurs hardcodées
- Routing Expo Router : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
- Pas de fichier non-route sous `app/` : `PartenariatNavBar.tsx` vit dans `aureak/apps/web/components/admin/partenariat/` (ADR 005), importé depuis `_layout.tsx`
- Pas de migration, pas de types, pas d'API-client (story UI-only)

---

### T1 — PartenariatNavBar (copier-coller pattern AcademieNavBar)

Pattern de référence : `aureak/apps/web/components/admin/academie/AcademieNavBar.tsx`.

```tsx
'use client'
// Story 92.1 — PartenariatNavBar : barre de navigation horizontale du hub Partenariat
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const TABS = [
  { key: 'sponsors', label: 'SPONSORS',          href: '/partenariat/sponsors' },
  { key: 'clubs',    label: 'CLUBS PARTENAIRES', href: '/partenariat/clubs'    },
] as const

export function PartenariatNavBar() {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.container}
      >
        {TABS.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as never)}
              style={({ pressed }) => [
                s.tab,
                isActive && s.tabActive,
                pressed && !isActive && s.tabPressed,
              ] as never}
            >
              <AureakText
                variant="label"
                style={[
                  s.tabLabel,
                  isActive ? s.tabLabelActive : s.tabLabelInactive,
                ] as never}
              >
                {tab.label}
              </AureakText>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor  : colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  container: {
    paddingHorizontal: space.md,
    flexDirection    : 'row',
    alignItems       : 'stretch',
    gap              : space.xs,
  },
  tab: {
    paddingVertical  : 14,
    paddingHorizontal: space.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive       : { borderBottomColor: colors.accent.gold },
  tabPressed      : { opacity: 0.7 },
  tabLabel        : { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabLabelActive  : { color: colors.text.dark, opacity: 1 },
  tabLabelInactive: { color: colors.text.dark, opacity: 0.5 },
})
```

Référence : `aureak/apps/web/components/admin/academie/AcademieNavBar.tsx:1-113` — copier-coller puis réduire à 2 tabs.

---

### T2 — Layout avec Slot + Redirect racine

```tsx
// aureak/apps/web/app/(admin)/partenariat/_layout.tsx
'use client'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { PartenariatNavBar } from '../../../components/admin/partenariat/PartenariatNavBar'

export default function PartenariatLayout() {
  return (
    <View style={s.wrapper}>
      <PartenariatNavBar />
      <View style={s.content}>
        <Slot />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.light.primary },
  content: { flex: 1 },
})
```

```tsx
// aureak/apps/web/app/(admin)/partenariat/page.tsx
import { Redirect } from 'expo-router'
export default function PartenariatIndex() {
  return <Redirect href="/partenariat/sponsors" />
}
```

```tsx
// aureak/apps/web/app/(admin)/partenariat/index.tsx
export { default } from './page'
```

Référence layout : `aureak/apps/web/app/(admin)/academie/_layout.tsx` (wrapper + Slot + contexte).

---

### T3–T4 — Pages placeholder (copier-coller)

```tsx
// aureak/apps/web/app/(admin)/partenariat/sponsors/page.tsx
'use client'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

export default function PartenariatSponsorsPage() {
  return (
    <View style={s.container}>
      <AureakText variant="heading1" style={s.title}>Sponsors</AureakText>
      <AureakText variant="body" style={s.subtitle}>Bientôt disponible</AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex             : 1,
    alignItems       : 'center',
    justifyContent   : 'center',
    padding          : space.xl,
    backgroundColor  : colors.light.primary,
  },
  title   : { marginBottom: space.sm, color: colors.text.dark },
  subtitle: { color: colors.text.muted },
})
```

Dupliquer à l'identique pour `clubs/page.tsx` en remplaçant le titre par "Clubs partenaires".

Les `index.tsx` dans chaque sous-dossier : `export { default } from './page'`.

---

### Design

**Type design** : `polish` (structure posée, pas de redesign visuel, aucune ref PNG).

Tokens à utiliser :
```tsx
import { colors, space } from '@aureak/theme'

backgroundColor  : colors.light.primary     // fond page placeholder
backgroundColor  : colors.light.surface     // fond NavBar
borderBottomColor: colors.accent.gold       // indicateur actif NavBar
color            : colors.text.dark         // label actif
color            : colors.text.muted        // texte "Bientôt disponible"
borderBottomColor: colors.border.light      // bordure base NavBar
paddingHorizontal: space.md                 // NavBar container
padding          : space.xl                 // page placeholder
```

Principes design à respecter :
- Cohérence hub : aligner sur le pattern visuel `AcademieNavBar` / `MarketingNavBar` (Story 91.1) / `ProspectionNavBar` (Story 88.1) — même hauteur, même typographie, même indicateur gold
- Lumineux : fond clair (`colors.light.primary`), jamais de fond sombre

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/components/admin/partenariat/PartenariatNavBar.tsx` | CRÉER | NavBar 2 onglets, pattern AcademieNavBar |
| `aureak/apps/web/app/(admin)/partenariat/_layout.tsx` | CRÉER | Layout NavBar + Slot |
| `aureak/apps/web/app/(admin)/partenariat/page.tsx` | CRÉER | Redirect → `/partenariat/sponsors` |
| `aureak/apps/web/app/(admin)/partenariat/index.tsx` | CRÉER | Re-export `./page` |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/page.tsx` | CRÉER | Placeholder empty state |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/app/(admin)/partenariat/clubs/page.tsx` | CRÉER | Placeholder empty state |
| `aureak/apps/web/app/(admin)/partenariat/clubs/index.tsx` | CRÉER | Re-export |

### Fichiers à NE PAS modifier

- `aureak/apps/web/lib/admin/nav-config.ts` — item Partenariat déjà configuré en Epic 86 (`href: '/partenariat'`)
- `aureak/apps/web/app/(admin)/_layout.tsx` — sidebar dynamique déjà fonctionnelle
- `aureak/apps/web/app/(admin)/partnerships/index.tsx` — page Epic 11 Story 11.3, refonte couverte par 92.3 uniquement
- `aureak/packages/api-client/src/admin/partnerships.ts` — API Story 11.3 intacte, réutilisée par 92.3

---

### Dépendances à protéger

- Stories 88.1, 91.1 utilisent le même pattern hub (NavBar + Slot) — ne pas modifier leurs fichiers
- `AcademieNavBar` est importé par `components/admin/academie/PeopleListPage.tsx` : ne pas renommer ni déplacer le fichier source, **copier** son contenu dans le nouveau `PartenariatNavBar.tsx`

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern NavBar : `aureak/apps/web/components/admin/academie/AcademieNavBar.tsx` lignes 1-113
- Pattern layout : `aureak/apps/web/app/(admin)/academie/_layout.tsx`
- Pattern hub similaire Marketing : `_bmad-output/implementation-artifacts/story-91-1-marketing-sidebar-page-hub.md`
- Pattern hub similaire Prospection : `_bmad-output/implementation-artifacts/story-88-1-prospection-sidebar-page-hub.md`
- Nav config (à ne pas toucher) : `aureak/apps/web/lib/admin/nav-config.ts:58`

---

### Multi-tenant

Aucune requête Supabase dans cette story (UI-only). RLS hors scope.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
