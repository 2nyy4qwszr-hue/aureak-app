# Story 62.4 : Polish — Tooltips éducatifs contextuels ?

Status: done

## Story

En tant que parent ou nouveau coach utilisant l'app Aureak,
Je veux voir un petit bouton "?" à côté des métriques et termes techniques qui m'explique leur signification,
Afin de comprendre l'application sans avoir besoin d'une formation préalable.

## Acceptance Criteria

**AC1 — Composant `HelpTooltip` disponible dans `@aureak/ui`**
- **Given** un développeur place `<HelpTooltip content="Explication..." />`
- **When** l'utilisateur clique sur le "?"
- **Then** un popover s'affiche avec le texte explicatif, un titre optionnel et un bouton de fermeture

**AC2 — Design du bouton "?"**
- **And** le bouton est un cercle de 18px de diamètre, fond `colors.light.hover`, texte "?" en Montserrat 600 taille 11, couleur `colors.text.muted`
- **And** au hover, le fond devient `colors.accent.goldLight` et le texte `colors.accent.gold`

**AC3 — Popover accessible**
- **And** le popover a un `role="tooltip"` et un `aria-label` décrivant le contenu
- **And** il est fermable via la touche Echap et via un clic en dehors du popover
- **And** le focus est capturé dans le popover tant qu'il est ouvert (accessibilité clavier)

**AC4 — Positionnement intelligent**
- **And** le popover s'affiche par défaut en bas-droite du bouton "?"
- **And** si le popover sort du viewport (bord droit ou bas), il bascule automatiquement (left/top)
- **And** une petite flèche CSS pointe vers le bouton "?"

**AC5 — Usage dans les fiches joueur**
- **And** dans `children/[childId]/page.tsx`, un `<HelpTooltip>` est placé à côté de : "Taux de présence", "Note de maîtrise", "Statut académie"
- **And** les textes explicatifs sont en français simple, compréhensibles par un parent non sportif

**AC6 — Usage dans le dashboard**
- **And** dans `dashboard/page.tsx`, un `<HelpTooltip>` est placé à côté de chaque KPI tile : "Taux de présence", "Séances ce mois", "Joueurs actifs"

**AC7 — Contenu formaté**
- **And** la prop `content` accepte du texte simple ou un `React.ReactNode` pour du contenu enrichi (lien, liste)
- **And** une prop `title` optionnelle affiche un titre gras en haut du popover

## Tasks / Subtasks

- [ ] Task 1 — Créer `HelpTooltip.tsx` dans `@aureak/ui` (AC: #1, #2, #3, #4, #7)
  - [ ] 1.1 Composant `HelpTooltip({ content, title, placement? })`
  - [ ] 1.2 State `isOpen: boolean` + toggle au clic sur "?"
  - [ ] 1.3 Popover : `position: absolute`, `zIndex: 1000`, fond `colors.light.surface`, shadow `shadows.lg`, border `colors.border.gold`, maxWidth 280px
  - [ ] 1.4 Calcul position : `getBoundingClientRect()` du bouton + ajustement si hors viewport
  - [ ] 1.5 Fermeture : keydown Escape + clic outside (handler sur `document`)
  - [ ] 1.6 Accessibilité : `role="tooltip"`, `aria-expanded`, focus management
  - [ ] 1.7 Flèche CSS via `::before` pseudo-élément
  - [ ] 1.8 Exporter depuis `@aureak/ui/src/index.ts`

- [ ] Task 2 — Définir les textes éducatifs Aureak (AC: #5, #6)
  - [ ] 2.1 Créer `aureak/packages/ui/src/helpTexts.ts` avec les définitions Aureak :
    - `HELP_TEXTS.attendance` : "Pourcentage de séances auxquelles le joueur a assisté sur les 30 derniers jours."
    - `HELP_TEXTS.mastery` : "Note moyenne attribuée par les coachs sur la maîtrise technique, de 1 (débutant) à 5 (expert)."
    - `HELP_TEXTS.academyStatus` : "Statut du joueur dans l'académie : Académicien = inscrit cette saison, Ancien = ex-joueur, Prospect = en évaluation."
    - `HELP_TEXTS.activeKpi`, `HELP_TEXTS.sessionsKpi`, etc.

- [ ] Task 3 — Intégrer dans `children/[childId]/page.tsx` (AC: #5)
  - [ ] 3.1 Identifier les 3 métriques : taux présence, note maîtrise, statut académie
  - [ ] 3.2 Placer `<HelpTooltip content={HELP_TEXTS.attendance} />` à droite du label

- [ ] Task 4 — Intégrer dans `dashboard/page.tsx` (AC: #6)
  - [ ] 4.1 Identifier les 3 KPI tiles principaux
  - [ ] 4.2 Ajouter `<HelpTooltip>` à côté du titre de chaque tile

- [ ] Task 5 — QA scan
  - [ ] 5.1 Vérifier cleanup event listener `document click` et keydown au démontage
  - [ ] 5.2 Vérifier accessible keyboard navigation

## Dev Notes

### Structure HelpTooltip

```typescript
interface HelpTooltipProps {
  content  : React.ReactNode
  title?   : string
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}
```

### Fermeture clic outside

```typescript
useEffect(() => {
  if (!isOpen) return
  const handler = (e: MouseEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
  }
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [isOpen])
```

### Notes QA
- `removeEventListener` sur document OBLIGATOIRE — BLOCKER
- Popover : zIndex suffisant pour passer au-dessus des cards et de la sidebar

## File List

- `aureak/packages/ui/src/HelpTooltip.tsx` — créer
- `aureak/packages/ui/src/helpTexts.ts` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export HelpTooltip, HELP_TEXTS)
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — modifier (HelpTooltip)
- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — modifier (HelpTooltip sur KPIs)
