# Story 62.2 : Polish — Empty states illustrés SVG gold/blanc

Status: done

## Story

En tant qu'utilisateur de l'app Aureak,
Je veux voir des illustrations SVG élégantes dans les pages vides (aucune séance, aucun joueur, etc.) plutôt que du texte seul,
Afin de vivre une expérience visuelle cohérente et premium même quand il n'y a pas encore de données.

## Acceptance Criteria

**AC1 — Composant `EmptyState` unifié dans `@aureak/ui`**
- **Given** une page n'a pas de données à afficher
- **When** le composant `EmptyState` est rendu
- **Then** il affiche : illustration SVG, titre principal, sous-titre optionnel, et bouton CTA optionnel

**AC2 — 6 variantes SVG distinctes**
- **And** 6 variantes SVG line-art or + blanc sont disponibles via la prop `variant` :
  - `'no-sessions'` : terrain vide avec ballon
  - `'no-players'` : silhouette gardien dans les cages
  - `'no-stages'` : calendrier vide avec étoile
  - `'no-clubs'` : écusson avec point d'interrogation
  - `'no-analytics'` : graphique vide avec loupe
  - `'no-messages'` : bulle vide

**AC3 — Style SVG cohérent**
- **And** toutes les illustrations SVG utilisent : stroke `colors.accent.goldLight`, fill `none`, strokeWidth 1.5, dimensions 120×120px
- **And** une animation subtile `float` (translateY -4px ↔ 0px, 3s infini, ease-in-out) est appliquée aux SVG

**AC4 — Textes par défaut sensés**
- **And** chaque variante a des textes par défaut adaptés au contexte Aureak :
  - `'no-sessions'` : "Aucune séance pour aujourd'hui" / "Créez votre première séance terrain"
  - `'no-players'` : "Aucun joueur dans ce groupe" / "Ajoutez des gardiens à votre groupe"
  - etc.
- **And** les textes peuvent être surchargés via les props `title` et `subtitle`

**AC5 — Usage dans toutes les pages concernées**
- **And** `EmptyState` remplace les messages texte nus dans : `seances/index.tsx`, `children/index.tsx`, `stages/index.tsx`, `clubs/index.tsx`, `analytics/page.tsx`

**AC6 — CTA optionnel**
- **And** si la prop `ctaLabel` et `onCta` sont fournies, un bouton doré s'affiche sous le sous-titre
- **And** le bouton utilise la variante `primary` du composant `Button` existant

**AC7 — Dimensions responsive**
- **And** sur mobile (< 768px), les SVG sont réduits à 80×80px et les textes ajustés

## Tasks / Subtasks

- [ ] Task 1 — Créer les 6 SVG inline dans `EmptyState.tsx` (AC: #2, #3)
  - [ ] 1.1 Créer `aureak/packages/ui/src/EmptyState.tsx`
  - [ ] 1.2 Map `variant → SvgComponent` : 6 fonctions SVG inline (pas de fichiers .svg séparés)
  - [ ] 1.3 Appliquer les styles communs : stroke goldLight, strokeWidth 1.5, fill none, 120×120

- [ ] Task 2 — Animation float (AC: #3)
  - [ ] 2.1 CSS `@keyframes aureak-float` : `translateY(0) → translateY(-4px) → translateY(0)`, 3s ease-in-out infini
  - [ ] 2.2 Respecter `prefers-reduced-motion` : désactiver l'animation si activé

- [ ] Task 3 — Textes par défaut (AC: #4)
  - [ ] 3.1 Objet `EMPTY_STATE_DEFAULTS: Record<EmptyStateVariant, { title, subtitle }>` en haut du fichier

- [ ] Task 4 — Props et exports (AC: #1, #6, #7)
  - [ ] 4.1 Props : `variant: EmptyStateVariant`, `title?: string`, `subtitle?: string`, `ctaLabel?: string`, `onCta?: () => void`
  - [ ] 4.2 Export depuis `@aureak/ui/src/index.ts`
  - [ ] 4.3 Type `EmptyStateVariant` dans `@aureak/ui/src/types.ts` ou inline

- [ ] Task 5 — Intégrer dans les pages concernées (AC: #5)
  - [ ] 5.1 `seances/index.tsx` : remplacer le message texte vide par `<EmptyState variant="no-sessions" ctaLabel="Nouvelle séance" />`
  - [ ] 5.2 `children/index.tsx` : `<EmptyState variant="no-players" />`
  - [ ] 5.3 `stages/index.tsx` : `<EmptyState variant="no-stages" />`
  - [ ] 5.4 `clubs/index.tsx` : `<EmptyState variant="no-clubs" />`
  - [ ] 5.5 `analytics/page.tsx` : `<EmptyState variant="no-analytics" />` (si aucune donnée)

- [ ] Task 6 — QA scan
  - [ ] 6.1 Vérifier `prefers-reduced-motion` guard pour l'animation float
  - [ ] 6.2 Vérifier que les SVG utilisent uniquement `colors.accent.goldLight` — pas de hex hardcodé

## Dev Notes

### SVG exemple "no-sessions" (terrain + ballon)

```typescript
function NoSessionsSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={colors.accent.goldLight} strokeWidth="1.5" strokeLinecap="round">
      {/* Terrain : rectangle */}
      <rect x="10" y="30" width="100" height="60" rx="4" />
      {/* Ligne médiane */}
      <line x1="60" y1="30" x2="60" y2="90" />
      {/* Cercle central */}
      <circle cx="60" cy="60" r="12" />
      {/* Ballon */}
      <circle cx="60" cy="60" r="6" />
    </svg>
  )
}
```

### Objet defaults

```typescript
const EMPTY_STATE_DEFAULTS = {
  'no-sessions' : { title: 'Aucune séance pour aujourd\'hui',     subtitle: 'Créez votre première séance terrain' },
  'no-players'  : { title: 'Aucun joueur dans ce groupe',         subtitle: 'Ajoutez des gardiens à votre groupe' },
  'no-stages'   : { title: 'Aucun stage planifié',                subtitle: 'Organisez votre prochain stage' },
  'no-clubs'    : { title: 'Aucun club dans l\'annuaire',         subtitle: 'Ajoutez des clubs partenaires' },
  'no-analytics': { title: 'Pas encore de données analytics',     subtitle: 'Les statistiques apparaîtront après vos premières séances' },
  'no-messages' : { title: 'Aucun message',                       subtitle: 'La messagerie est vide pour le moment' },
} as const
```

## File List

- `aureak/packages/ui/src/EmptyState.tsx` — créer
- `aureak/packages/ui/src/index.ts` — modifier (export EmptyState)
- `aureak/apps/web/app/(admin)/seances/index.tsx` — modifier
- `aureak/apps/web/app/(admin)/children/index.tsx` — modifier
- `aureak/apps/web/app/(admin)/stages/index.tsx` — modifier
- `aureak/apps/web/app/(admin)/clubs/index.tsx` — modifier
- `aureak/apps/web/app/(admin)/analytics/page.tsx` — modifier
