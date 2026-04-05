# Story 51.1 : Sidebar — Active state barre or gauche + icônes SVG custom

Status: done

## Story

En tant qu'administrateur,
Je veux que la sidebar affiche un indicateur visuel gold précis sur l'item actif et des icônes SVG cohérentes (non emoji) pour chaque entrée de navigation,
Afin d'avoir une expérience de navigation claire, premium et professionnelle conforme au design system Aureak.

## Contexte & Décisions de Design

### Problème actuel
La sidebar actuelle utilise des emojis (🏠, 📅, ✅…) comme icônes. Ces emojis :
- Sont rendus différemment selon l'OS/navigateur (manque de cohérence visuelle)
- Ne peuvent pas être stylisés (couleur, taille précise, opacité CSS fine)
- Donnent une apparence non-professionnelle incompatible avec le positionnement "Light Premium DA"

La barre gold gauche sur l'item actif est déjà implémentée via `borderLeftWidth={3}` et `borderLeftColor`. Cette story consolide et améliore ce pattern.

### Approche SVG
Chaque icône est un composant React Native SVG (via `react-native-svg`) exporté depuis `@aureak/ui/src/icons/`. Les icônes sont de taille `16×16` ou `18×18`, style "outline" cohérent (stroke-width=1.5), couleur reçue via prop.

### Labels séparateurs
Les labels de groupe (OPÉRATIONS, GESTION, etc.) passent en `textTransform: 'uppercase'` avec `colors.text.subtle` — plus discrets que l'actuel `colors.text.secondary`.

## Acceptance Criteria

**AC1 — Icônes SVG sur tous les items de navigation**
- **Given** la sidebar est rendue
- **When** l'utilisateur voit les items de navigation
- **Then** chaque item affiche une icône SVG (non emoji) cohérente avec son label
- **And** les icônes sont de taille 16×16px, stroke outline style, stroke-width=1.5

**AC2 — Active state barre or à gauche**
- **Given** l'utilisateur est sur une route active
- **When** il regarde l'item correspondant dans la sidebar
- **Then** une barre verticale or de 3px s'affiche à gauche de l'item (déjà présente, à consolider)
- **And** l'icône SVG passe à `colors.accent.gold` (opacité 1.0)
- **And** le label passe à `colors.accent.gold` avec `fontWeight="700"`
- **And** le fond de l'item est `colors.accent.gold + '18'` (gold très transparent)

**AC3 — Inactive state correct**
- **Given** l'utilisateur n'est PAS sur la route d'un item
- **When** il voit cet item
- **Then** l'icône SVG est en `colors.text.secondary` avec opacité 0.6
- **And** le label est en `colors.text.secondary` avec `fontWeight="400"`
- **And** la `borderLeftColor` est `'transparent'`

**AC4 — Hover state fluide**
- **Given** l'utilisateur survole un item non-actif
- **When** le curseur est au-dessus
- **Then** le fond passe à `rgba(255,255,255,0.06)` en transition `transitions.fast`
- **And** l'icône SVG passe à opacité 0.85

**AC5 — Labels séparateurs uppercase muted**
- **Given** la sidebar affiche les groupes de navigation
- **When** l'utilisateur regarde les labels de section
- **Then** les labels (OPÉRATIONS, GESTION, etc.) sont en `colors.text.subtle`, `fontSize={9}`, `letterSpacing={1.5}`, `textTransform: 'uppercase'`

**AC6 — Mode collapsed : icônes seules visibles**
- **Given** la sidebar est en mode collapsed (width=52)
- **When** l'utilisateur voit les icônes seules
- **Then** chaque icône SVG est rendue correctement, centrée, sans label
- **And** l'active state gold s'applique identiquement (barre gauche + fond gold)

**AC7 — Zero emoji dans la navigation**
- **Given** le code de `_layout.tsx` est relu
- **When** on cherche des emojis dans les `NAV_GROUPS`
- **Then** aucun emoji n'est présent — tous remplacés par des composants SVG

## Tasks / Subtasks

- [x] Task 1 — Créer les composants icônes SVG dans `@aureak/ui`
  - [x] 1.1 Créer `aureak/packages/ui/src/icons/` avec `index.ts`
  - [x] 1.2 Créer composant `NavIcon` générique : props `name`, `color`, `size`, `strokeWidth`
  - [x] 1.3 Implémenter les 20 icônes couvrant tous les items NAV_GROUPS :
    - Dashboard → `HomeIcon` (maison outline)
    - Séances → `CalendarIcon` (calendrier outline)
    - Présences → `CheckSquareIcon` (case à cocher)
    - Évaluations → `StarIcon` (étoile outline)
    - Entraînements/Thèmes/Situations → `BookOpenIcon`, `TagIcon`, `LayersIcon`
    - Joueurs → `UsersIcon`
    - Coachs → `UserCheckIcon`
    - Clubs → `ShieldIcon`
    - Groupes → `GridIcon`
    - Implantations → `MapPinIcon`
    - Stages → `TargetIcon`
    - Comparaison → `BarChartIcon`
    - Par implantation → `PieChartIcon`
    - Utilisateurs → `UserIcon`
    - Accès temporaires → `KeyIcon`
    - Tickets → `MessageSquareIcon`
    - Audit → `SearchIcon`
    - Calendrier scolaire → `CalendarDaysIcon`
    - Anomalies → `AlertTriangleIcon`
    - Messages coaches → `ChatIcon`
    - Permissions → `LockIcon`
  - [x] 1.4 Exporter depuis `@aureak/ui/src/index.ts` : `NavIcon` + toutes les icônes nommées

- [x] Task 2 — Mettre à jour `NAV_GROUPS` dans `_layout.tsx`
  - [x] 2.1 Remplacer le champ `icon: string` (emoji) par `icon: React.ComponentType<IconProps>` dans le type `NavItem`
  - [x] 2.2 Mettre à jour chaque entrée `NAV_GROUPS` avec le composant SVG correspondant
  - [x] 2.3 Supprimer tous les emojis du fichier

- [x] Task 3 — Mettre à jour le rendu des items nav dans `_layout.tsx`
  - [x] 3.1 Remplacer `<Text>{icon}</Text>` par `<Icon color={isActive ? colors.accent.gold : colors.text.secondary} size={16} opacity={isActive ? 1 : 0.6} />`
  - [x] 3.2 Mettre à jour le mode collapsed : `<Icon color={isActive ? colors.accent.gold : colors.text.secondary} size={18} />`
  - [x] 3.3 Consolider les styles active/inactive/hover en objet constant (lisibilité)

- [x] Task 4 — Mettre à jour les labels séparateurs
  - [x] 4.1 Passer `color` des séparateurs de `colors.text.secondary` à `colors.text.subtle`
  - [x] 4.2 Vérifier `fontSize={9}`, `letterSpacing={1.5}`, `fontWeight="700"` sur tous les labels groupe

- [x] Task 5 — QA & exports
  - [x] 5.1 Exporter `NavIcon` et les icônes individuelles depuis `@aureak/ui/src/index.ts`
  - [x] 5.2 Vérifier `npx tsc --noEmit` sans erreur
  - [x] 5.3 QA scan : zéro emoji dans `NAV_GROUPS`, console guards présents

## Dev Notes

### Type NavItem mis à jour

```typescript
type NavIconComponent = React.FC<{ color: string; size?: number; strokeWidth?: number }>

type NavItem = {
  label: string
  href : string
  Icon : NavIconComponent
}
```

### Structure NavIcon générique

```typescript
// aureak/packages/ui/src/icons/NavIcon.tsx
import React from 'react'
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg'

export interface NavIconProps {
  color      : string
  size?      : number
  strokeWidth?: number
  style?     : object
}
```

### Règle d'import icons

Les icônes SVG doivent utiliser `react-native-svg` (déjà dans le projet via Expo).
Ne jamais utiliser `lucide-react` direct (non compatible React Native Web sans adapter).
Chaque icône est un composant RN natif — pas de `className`, uniquement props style.

### QA checklist

```bash
# Zéro emoji dans le layout
grep -n "🏠\|📅\|✅\|⭐\|📚\|👥\|🏅\|🏆\|🏟️\|🎯\|📊\|👤\|🔐\|🎫\|🔍\|⚠️\|💬\|👨" aureak/apps/web/app/(admin)/_layout.tsx
# Doit retourner 0 ligne

# Console guards (warnings uniquement)
grep -n "console\." aureak/packages/ui/src/icons/ | grep -v "NODE_ENV"
```

## File List

### New Files
- `aureak/packages/ui/src/icons/index.ts` — exports de tous les composants icônes
- `aureak/packages/ui/src/icons/HomeIcon.tsx`
- `aureak/packages/ui/src/icons/CalendarIcon.tsx`
- `aureak/packages/ui/src/icons/CheckSquareIcon.tsx`
- `aureak/packages/ui/src/icons/StarIcon.tsx`
- `aureak/packages/ui/src/icons/BookOpenIcon.tsx`
- `aureak/packages/ui/src/icons/TagIcon.tsx`
- `aureak/packages/ui/src/icons/LayersIcon.tsx`
- `aureak/packages/ui/src/icons/UsersIcon.tsx`
- `aureak/packages/ui/src/icons/UserCheckIcon.tsx`
- `aureak/packages/ui/src/icons/ShieldIcon.tsx`
- `aureak/packages/ui/src/icons/GridIcon.tsx`
- `aureak/packages/ui/src/icons/MapPinIcon.tsx`
- `aureak/packages/ui/src/icons/TargetIcon.tsx`
- `aureak/packages/ui/src/icons/BarChartIcon.tsx`
- `aureak/packages/ui/src/icons/PieChartIcon.tsx`
- `aureak/packages/ui/src/icons/UserIcon.tsx`
- `aureak/packages/ui/src/icons/KeyIcon.tsx`
- `aureak/packages/ui/src/icons/MessageSquareIcon.tsx`
- `aureak/packages/ui/src/icons/SearchIcon.tsx`
- `aureak/packages/ui/src/icons/CalendarDaysIcon.tsx`
- `aureak/packages/ui/src/icons/AlertTriangleIcon.tsx`
- `aureak/packages/ui/src/icons/ChatIcon.tsx`
- `aureak/packages/ui/src/icons/LockIcon.tsx`

### Modified Files
- `aureak/apps/web/app/(admin)/_layout.tsx` — NAV_GROUPS type NavItem (icon → Icon component), rendu icônes SVG, labels séparateurs subtle
- `aureak/packages/ui/src/index.ts` — exports NavIcon + icônes individuelles

## Dev Agent Record

- [x] Story créée le 2026-04-04
- [x] Dépendances : aucune — peut être implémentée en premier
- [x] Implémentée le 2026-04-05 — commit feat(epic-51): story 51.1

## Change Log

- 2026-04-04 : Story créée — Epic 51, Navigation & Shell Game HUD
