# Story 73.3 : Design Activités — Filtres temporels pills light premium

Status: done

## Story

En tant qu'admin,
je veux que les filtres temporels AUJOURD'HUI / À VENIR / PASSÉES de la page Activités respectent le design system light premium,
afin que les pills soient cohérentes visuellement avec l'ensemble de l'interface (fond clair, accent gold, typographie Montserrat).

## Acceptance Criteria

1. Le filtre actif affiche un fond `colors.accent.gold` (#C1AC5C) avec texte blanc (`#FFFFFF`) — aucun fond sombre/noir.
2. Les filtres inactifs affichent un fond transparent avec texte `colors.text.muted` et bordure `colors.border.light`.
3. Toutes les pills utilisent `borderRadius: radius.badge` (forme pill arrondie).
4. Le texte de chaque label est en Montserrat, fontSize 11, fontWeight 700, letterSpacing 0.8, uppercase.
5. Aucune couleur hardcodée n'est présente dans le composant — uniquement des tokens `@aureak/theme`.
6. La taille du composant reste compacte (paddingHorizontal 14, paddingVertical 5) et le gap entre pills reste `space.sm`.

## Tasks / Subtasks

- [x] T1 — Modifier `PseudoFiltresTemporels.tsx` (AC: 1, 2, 3, 4, 5, 6)
  - [x] T1.1 — Remplacer `backgroundColor` du pill actif : `colors.text.dark` → `colors.accent.gold`
  - [x] T1.2 — Remplacer `borderColor` du pill actif : `colors.text.dark` → `colors.accent.gold`
  - [x] T1.3 — Remplacer `color` du texte actif : `colors.text.primary` → `'#FFFFFF'` (blanc pur — seule exception autorisée car aucun token `colors.text.white` n'existe dans le projet)
  - [x] T1.4 — Vérifier que le pill inactif conserve `backgroundColor: colors.light.muted`, `borderColor: colors.border.light`, `color: colors.text.muted`
  - [x] T1.5 — Vérifier que tous les autres tokens (radius, space, fontFamily, fontSize, fontWeight, letterSpacing) restent inchangés

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Naviguer sur `/activites` et vérifier que la pill AUJOURD'HUI (filtre par défaut) affiche un fond or champagne (#C1AC5C), texte blanc, sans fond sombre
  - [x] T2.2 — Cliquer sur À VENIR et PASSÉES pour vérifier le changement d'état actif/inactif
  - [x] T2.3 — Vérifier que les pills inactives affichent un fond transparent/muted avec texte gris et bordure légère
  - [x] T2.4 — QA scan : grep sur `PseudoFiltresTemporels.tsx` → zéro `console.` non guardé, zéro couleur hardcodée (hors `#FFFFFF` pour le texte blanc actif)

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText — déjà utilisé dans ce composant
- **Styles via tokens uniquement** — jamais de couleurs hardcodées (exception : `#FFFFFF` pour texte blanc si aucun token dédié)

---

### T1 — Modification `PseudoFiltresTemporels.tsx`

**Diff minimal requis** — seul le `pillStyle` et le `textStyle` inline dans le `.map()` sont à modifier :

```tsx
const pillStyle: ViewStyle = {
  paddingHorizontal: 14,
  paddingVertical  : 5,
  borderRadius     : radius.badge,
  backgroundColor  : isActive ? colors.accent.gold : colors.light.muted,  // ← gold au lieu de text.dark
  borderWidth      : 1,
  borderColor      : isActive ? colors.accent.gold : colors.border.light,  // ← gold au lieu de text.dark
}
const textStyle: TextStyle = {
  fontSize     : 11,
  fontWeight   : '700',
  fontFamily   : 'Montserrat',
  letterSpacing: 0.8,
  color        : isActive ? '#FFFFFF' : colors.text.muted,  // ← blanc pur au lieu de text.primary
}
```

Référence actuelle (à remplacer) : `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` lignes 27–41

---

### Design

Tokens à utiliser :
```tsx
import { colors, space, radius } from '@aureak/theme'

// Pill active
backgroundColor : colors.accent.gold      // '#C1AC5C' — or champagne AUREAK signature
borderColor     : colors.accent.gold
color           : '#FFFFFF'                // blanc pur (pas de token dédié)

// Pill inactive
backgroundColor : colors.light.muted      // fond muted très subtil
borderColor     : colors.border.light     // bordure légère
color           : colors.text.muted       // texte gris
```

Principes design à respecter (source : `_agents/design-vision.md`) :
- **Fond clair** (principe 1) — pas de fond sombre sur les pills actifs
- **Profondeur obligatoire** (principe 3) — la bordure gold donne du relief à la pill active
- **Anti-pattern** : ❌ DARK DOMINANT → fond sombre `colors.text.dark` sur pill active = exactement ce qu'on corrige

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | Modifier | 2 lignes : `backgroundColor` + `borderColor` pill active → `colors.accent.gold` ; 1 ligne : `color` texte actif → `'#FFFFFF'` |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/page.tsx` — non impacté (ne gère que l'état `value` et le callback `onChange`)
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — non impacté
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` — non impacté
- `aureak/packages/theme/src/tokens.ts` — aucun nouveau token requis, `colors.accent.gold` existe déjà
- `aureak/packages/types/src/` — aucun type modifié
- `aureak/packages/api-client/src/` — aucun accès DB, story UI pure

---

### Dépendances à protéger

- Les consommateurs de `PseudoFiltresTemporels` (`page.tsx`, `presences/page.tsx`, `evaluations/page.tsx`) passent `value` et `onChange` — la signature du composant est inchangée
- `TemporalFilter` type export reste identique

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` ligne 39 — `gold: '#C1AC5C'` dans `colors.accent`
- `colors.text.muted` : `aureak/packages/theme/src/tokens.ts` (token texte gris muted)
- `colors.border.light` : `aureak/packages/theme/src/tokens.ts` (bordure légère)
- `colors.light.muted` : `aureak/packages/theme/src/tokens.ts` (fond muted light)
- Composant cible : `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx`
- Pattern gold pill actif déjà utilisé : `aureak/apps/web/app/(admin)/activites/components/` (cohérence avec FiltresScope et autres pills)

---

### Multi-tenant

Non applicable — composant purement UI, aucun accès DB, aucun paramètre tenantId.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` | À modifier |
