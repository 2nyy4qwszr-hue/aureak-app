# Story 62.3 : Polish — Skeleton loading uniforme partout

Status: done

## Story

En tant qu'utilisateur de l'app Aureak,
Je veux voir des skeletons de chargement shimmer cohérents sur toutes les pages qui n'en ont pas encore,
Afin d'éviter les sauts de layout et vivre une expérience de chargement fluide et professionnelle.

## Acceptance Criteria

**AC1 — Composant `Skeleton` unifié dans `@aureak/ui`**
- **Given** un développeur importe `Skeleton` depuis `@aureak/ui`
- **When** il l'utilise avec des props `width`, `height`, `borderRadius`
- **Then** un bloc gris animé shimmer s'affiche (animation `linear-gradient` de gauche à droite, 1.5s infini)

**AC2 — Variantes prédéfinies**
- **And** des variantes sont disponibles : `<Skeleton.Text lines={3} />` (blocs texte), `<Skeleton.Card />` (card complète 120px), `<Skeleton.Avatar size={40} />` (cercle), `<Skeleton.Row />` (ligne de liste 48px)

**AC3 — Shimmer conforme au design system**
- **And** la couleur de base est `colors.light.hover` (`#EBEBEB`), le shimmer va de `#EBEBEB` vers `#F5F5F5` puis `#EBEBEB`
- **And** en dark mode (si `ThemeContext.isDark`), le shimmer utilise `colors.dark.hover` → `colors.dark.elevated`

**AC4 — Skeleton sur clubs/index**
- **And** la page `clubs/index.tsx` affiche un skeleton de 6 cartes `<Skeleton.Card />` pendant le chargement des clubs

**AC5 — Skeleton sur stages/index**
- **And** la page `stages/index.tsx` affiche un skeleton de 3 cartes `<Skeleton.Card />` pendant le chargement des stages

**AC6 — Skeleton sur analytics/**
- **And** la page `analytics/page.tsx` affiche 4 `<Skeleton.Row height={60} />` pendant le chargement des KPIs
- **And** les pages `analytics/presences/page.tsx`, `analytics/clubs/page.tsx` affichent des skeletons adaptés (chart area = `<Skeleton width="100%" height={300} />`)

**AC7 — Skeleton sur coaches/**
- **And** si une page coaches existe dans l'app, elle affiche des skeletons de type Row pendant le chargement de la liste

## Tasks / Subtasks

- [ ] Task 1 — Créer `Skeleton.tsx` dans `@aureak/ui` (AC: #1, #2, #3)
  - [ ] 1.1 Composant de base `Skeleton({ width, height, borderRadius, style? })`
  - [ ] 1.2 CSS `@keyframes skeleton-shimmer` : gradient linéaire animé gauche→droite
  - [ ] 1.3 Sous-composants : `Skeleton.Text`, `Skeleton.Card`, `Skeleton.Avatar`, `Skeleton.Row`
  - [ ] 1.4 Dark mode : `useTheme()` pour adapter les couleurs shimmer
  - [ ] 1.5 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 2 — Intégrer dans `clubs/index.tsx` (AC: #4)
  - [ ] 2.1 Identifier l'état loading dans `clubs/index.tsx` (ou `clubs/page.tsx`)
  - [ ] 2.2 Rendu conditionnel : si loading → 6 × `<Skeleton.Card />` dans la grille existante

- [ ] Task 3 — Intégrer dans `stages/index.tsx` (AC: #5)
  - [ ] 3.1 Identifier l'état loading dans `stages/index.tsx` (ou `stages/page.tsx`)
  - [ ] 3.2 Rendu conditionnel : si loading → 3 × `<Skeleton.Card />`

- [ ] Task 4 — Intégrer dans `analytics/` (AC: #6)
  - [ ] 4.1 `analytics/page.tsx` : 4 × `<Skeleton.Row height={60} />` pour les KPIs
  - [ ] 4.2 `analytics/presences/page.tsx` : `<Skeleton width="100%" height={300} />` pour la zone chart
  - [ ] 4.3 `analytics/clubs/page.tsx` : idem pour le bar chart

- [ ] Task 5 — Intégrer dans coaches/ (AC: #7)
  - [ ] 5.1 Identifier la page liste des coaches et y ajouter les skeletons si absents

- [ ] Task 6 — QA scan
  - [ ] 6.1 Grep `isLoading && <Text>Chargement...` ou patterns similaires — remplacer par Skeleton
  - [ ] 6.2 Vérifier que le shimmer CSS respecte `prefers-reduced-motion`

## Dev Notes

### Animation shimmer CSS

```css
@keyframes skeleton-shimmer {
  0%   { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.skeleton {
  background: linear-gradient(90deg, #EBEBEB 25%, #F5F5F5 50%, #EBEBEB 75%);
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
}
```

### Composant de base

```typescript
// @aureak/ui/src/Skeleton.tsx
interface SkeletonProps {
  width       : number | string
  height      : number | string
  borderRadius?: number
  style?      : React.CSSProperties
}

function SkeletonBase({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useTheme()
  return (
    <div className="skeleton" style={{
      width, height,
      borderRadius,
      background: isDark
        ? `linear-gradient(90deg, ${colors.dark.hover} 25%, ${colors.dark.elevated} 50%, ${colors.dark.hover} 75%)`
        : `linear-gradient(90deg, #EBEBEB 25%, #F5F5F5 50%, #EBEBEB 75%)`,
      backgroundSize: '400px 100%',
      ...style,
    }} />
  )
}

SkeletonBase.Text  = ({ lines = 1 }: { lines?: number }) => (...)
SkeletonBase.Card  = () => <SkeletonBase width="100%" height={120} borderRadius={12} />
SkeletonBase.Avatar= ({ size = 40 }: { size?: number }) => <SkeletonBase width={size} height={size} borderRadius={size/2} />
SkeletonBase.Row   = ({ height = 48 }: { height?: number }) => <SkeletonBase width="100%" height={height} />

export const Skeleton = SkeletonBase
```

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```

## File List

- `aureak/packages/ui/src/Skeleton.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export Skeleton)
- `aureak/apps/web/app/(admin)/clubs/index.tsx` — modifier (skeletons)
- `aureak/apps/web/app/(admin)/stages/index.tsx` — modifier (skeletons)
- `aureak/apps/web/app/(admin)/analytics/page.tsx` — modifier (skeletons KPIs)
- `aureak/apps/web/app/(admin)/analytics/presences/page.tsx` — modifier (skeleton chart)
- `aureak/apps/web/app/(admin)/analytics/clubs/page.tsx` — modifier (skeleton chart)
