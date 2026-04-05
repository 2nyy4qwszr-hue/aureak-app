# Story 51.5 : Breadcrumb animé avec retour cliquable

Status: done

## Story

En tant qu'administrateur,
Je veux voir un fil d'Ariane clair au-dessus du contenu de chaque page indiquant ma position dans la hiérarchie de navigation, et pouvoir cliquer sur n'importe quel niveau pour revenir directement à cette page,
Afin de naviguer efficacement dans les pages profondes (ex: `/children/[id]`, `/clubs/[id]`, `/seances/[id]`) sans perdre le contexte.

## Contexte & Décisions de Design

### Positionnement
Le breadcrumb s'affiche dans la zone de contenu principale, en haut de chaque page, avant le contenu (`<Slot />`). Il est intégré dans `_layout.tsx` comme composant permanent (affiché sur toutes les pages sauf le dashboard root `/dashboard`).

### Extraction du chemin
Le breadcrumb est généré depuis `usePathname()` en splitant le path sur `/` et en appliquant une map de labels humains. Les segments dynamiques (UUIDs) sont résolus via un context ou laissés avec un fallback "Détail".

### Animation
Transition `slide-left` sur le changement de pathname (la liste des segments s'anime latéralement). Implémentée via React Native `Animated` ou simplement via opacity + translateX.

### Résolution des labels
Une map statique `ROUTE_LABELS` mappe les segments de route vers des labels lisibles :
```
'children'     → 'Joueurs'
'clubs'        → 'Clubs'
'seances'      → 'Séances'
'presences'    → 'Présences'
'methodologie' → 'Méthodologie'
'stages'       → 'Stages'
// UUIDs (segments de 36 chars) → 'Détail' (résolvable via context)
```

### Design
- Fond transparent (s'intègre sur `colors.light.primary`)
- Séparateur : `›` en `colors.text.subtle`
- Dernier segment (page actuelle) : `colors.text.dark`, fontWeight 600, non cliquable
- Segments précédents : `colors.text.muted`, cliquables, hover underline

## Acceptance Criteria

**AC1 — Breadcrumb visible sur toutes les pages sauf le dashboard root**
- **Given** l'admin navigue sur `/children`, `/clubs/[id]`, `/seances/[id]/attendance`
- **When** la page est rendue
- **Then** un fil d'Ariane apparaît en haut de la zone de contenu
- **And** sur `/dashboard` → le breadcrumb n'est pas affiché (page racine)

**AC2 — Segments cliquables avec navigation**
- **Given** l'admin est sur `/clubs/abc-123/page`
- **When** il voit le breadcrumb "Clubs › Détail"
- **Then** "Clubs" est cliquable et navigue vers `/clubs`
- **And** "Détail" (segment actif) n'est pas cliquable

**AC3 — Labels humains lisibles**
- **Given** le path est `/methodologie/seances/[id]`
- **When** le breadcrumb est rendu
- **Then** il affiche "Méthodologie › Entraînements › Détail" (labels humains, pas les segments raw)
- **And** les UUIDs sont remplacés par "Détail" ou par un label résolu depuis un `BreadcrumbContext`

**AC4 — Animation sur changement de page**
- **Given** l'admin navigue d'une page à l'autre
- **When** le pathname change
- **Then** les segments du breadcrumb s'animent avec un fade + légère transition
- **And** l'animation dure 200ms maximum

**AC5 — Séparateur visuel cohérent**
- **Given** le breadcrumb est rendu avec plusieurs niveaux
- **When** l'admin le voit
- **Then** les segments sont séparés par `›` en `colors.text.subtle`
- **And** pas de séparateur après le dernier segment

**AC6 — Responsive : masqué sur mobile**
- **Given** le viewport est < 768px
- **When** le breadcrumb est évalué
- **Then** il n'est pas rendu (mobile n'a pas assez d'espace horizontal)

**AC7 — Context de résolution des labels dynamiques**
- **Given** une page de détail charge une entité (joueur, club, séance)
- **When** le nom de l'entité est connu
- **Then** la page peut mettre à jour le `BreadcrumbContext` pour afficher le vrai nom dans le breadcrumb
- **And** le context expose `setBreadcrumbLabel(segment: string, label: string)`

## Tasks / Subtasks

- [x] Task 1 — Context `BreadcrumbContext`
  - [x] 1.1 Créer `aureak/apps/web/app/contexts/BreadcrumbContext.tsx`
  - [x] 1.2 Context : `labels: Record<string, string>`, `setLabel(segment: string, label: string): void`
  - [x] 1.3 Provider wrappé dans `_layout.tsx`

- [x] Task 2 — Fonction utilitaire `parseBreadcrumbs(pathname, labels)`
  - [x] 2.1 Créer `aureak/apps/web/app/utils/breadcrumbs.ts`
  - [x] 2.2 Split pathname sur `/`, filtrer les segments vides
  - [x] 2.3 Map ROUTE_LABELS statique pour les segments connus
  - [x] 2.4 Pour les UUIDs (test : length === 36 && regex UUID) → chercher dans `labels` context, fallback "Détail"
  - [x] 2.5 Retourner `Array<{ label: string, href: string, isActive: boolean }>`

- [x] Task 3 — Composant `Breadcrumb.tsx`
  - [x] 3.1 Créer `aureak/apps/web/components/Breadcrumb.tsx`
  - [x] 3.2 Utiliser `usePathname()` + `BreadcrumbContext` pour calculer les segments
  - [x] 3.3 Ne pas rendre si pathname === '/dashboard' ou segments.length <= 1
  - [x] 3.4 Ne pas rendre si `isMobile` (prop ou `useWindowDimensions`)
  - [x] 3.5 Rendu : `XStack` horizontal avec segments + séparateurs
  - [x] 3.6 Segment cliquable : `Pressable` → `router.push(href)`, texte `colors.text.muted`, hover underline
  - [x] 3.7 Segment actif : `Text` non-pressable, `colors.text.dark`, `fontWeight="600"`
  - [x] 3.8 Séparateurs `›` en `colors.text.subtle`
  - [x] 3.9 Animation : `useEffect` sur `pathname` → Animated.timing opacity 0→1, translateX -8→0, durée 200ms

- [x] Task 4 — Intégration dans `_layout.tsx`
  - [x] 4.1 Wrapper le layout dans `<BreadcrumbProvider>`
  - [x] 4.2 Insérer `<Breadcrumb />` dans la zone contenu principale, après `<ActiveSessionBar />`, avant `<ErrorBoundary>`
  - [x] 4.3 Guard `!isMobile` sur `<Breadcrumb />` (AC6)

- [x] Task 5 — Map ROUTE_LABELS
  - [x] 5.1 Documenter dans `breadcrumbs.ts` les mappings pour toutes les routes actuelles
  - [x] 5.2 Couvrir : dashboard, children, clubs, seances, presences, evaluations, methodologie, themes, situations, stages, groups, implantations, coaches, users, access-grants, tickets, audit, anomalies, messages, grade-permissions, analytics, settings, school-calendar, new, edit, attendance, football, history, planning

- [x] Task 6 — QA
  - [x] 6.1 `npx tsc --noEmit` → 0 erreur
  - [x] 6.2 Analyse statique navigation profonde : `/children/[id]` → "Joueurs › Détail" correct
  - [x] 6.3 Zéro className confirmé

## Dev Notes

### Structure de `parseBreadcrumbs`

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseBreadcrumbs(
  pathname: string,
  dynamicLabels: Record<string, string>
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []
  let accPath = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accPath += '/' + seg
    const isActive = i === segments.length - 1
    const label = UUID_REGEX.test(seg)
      ? (dynamicLabels[seg] ?? 'Détail')
      : (ROUTE_LABELS[seg] ?? seg)

    items.push({ label, href: accPath, isActive })
  }

  return items
}
```

### Utilisation du context dans une page de détail

```typescript
// Dans children/[childId]/page.tsx — après chargement du joueur
const { setLabel } = useBreadcrumbContext()
useEffect(() => {
  if (child?.displayName) setLabel(childId, child.displayName)
}, [child, childId])
```

### Animation RN Web

```typescript
const opacity    = useRef(new Animated.Value(0)).current
const translateX = useRef(new Animated.Value(-8)).current

useEffect(() => {
  Animated.parallel([
    Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
    Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
  ]).start()
}, [pathname])
```

## File List

### New Files
- `aureak/apps/web/app/components/Breadcrumb.tsx` — composant fil d'Ariane
- `aureak/apps/web/app/contexts/BreadcrumbContext.tsx` — context résolution labels dynamiques
- `aureak/apps/web/app/utils/breadcrumbs.ts` — `parseBreadcrumbs()` + `ROUTE_LABELS` map

### Modified Files
- `aureak/apps/web/app/(admin)/_layout.tsx` — `<BreadcrumbProvider>` + rendu `<Breadcrumb />`

## Dev Agent Record

- [x] Story créée le 2026-04-04
- [x] Dépendances : aucune bloquante (peut être implémentée indépendamment)
- [x] Implémentée le 2026-04-05 par Amelia (Dev Agent BMAD)
  - tsc 0 erreur, Gate1 PASS, Gate2 SKIPPED (app non démarrée)
  - Commit : feat(epic-51): story 51.5 — breadcrumb animé cliquable

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
