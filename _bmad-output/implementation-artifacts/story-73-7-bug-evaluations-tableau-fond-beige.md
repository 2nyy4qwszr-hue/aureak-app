# Story 73.7 : BUG — Évaluations tableau fond beige + mise en page correcte

Status: done

## Story

En tant qu'admin Aureak,
je veux que la page Activités > Évaluations affiche un fond beige cohérent et un tableau bien mis en page,
afin que l'interface soit lisible, visuellement propre et conforme au design system Light Premium.

## Acceptance Criteria

1. Le fond de la page `/activites/evaluations` est entièrement beige (`colors.light.primary` = `#F3EFE7`) — aucune zone blanche visible en dehors des cards.
2. Le `scrollContent` du `ScrollView` a explicitement `backgroundColor: colors.light.primary` pour éviter tout fond blanc résiduel sur le web.
3. Le tableau des évaluations (colonnes JOUEUR | DATE | NOTE K | NOTE C | COMMENTAIRE) s'affiche avec des colonnes bien alignées et proportionnées — header et lignes strictement alignés sur les mêmes flexes.
4. L'état vide (aucune évaluation sur la période) affiche une card visuellement claire : fond `colors.light.surface`, bordure `colors.border.divider`, `borderRadius: radius.card`, padding `space.xl`, texte centré avec icône explicite.
5. Les composants `NoteCircle` (K gold, C gris) et `PlayerAvatar` (initiales, fond `colors.light.elevated`) s'affichent correctement dans chaque ligne du tableau — taille 40×40, bien centrés dans leur colonne.

## Tasks / Subtasks

- [x] T1 — Fond beige ScrollView (AC: 1, 2)
  - [x] T1.1 — Dans `styles.scrollContent`, ajouter `backgroundColor: colors.light.primary`
  - [x] T1.2 — Vérifier que `styles.container` conserve bien `backgroundColor: colors.light.primary` (déjà présent — ne pas modifier)

- [x] T2 — Amélioration état vide (AC: 4)
  - [x] T2.1 — Remplacer `styles.emptyRow` par un bloc avec : fond `colors.light.surface`, `borderRadius: radius.card`, `borderWidth: 1`, `borderColor: colors.border.divider`, `paddingVertical: space.xxl`, `paddingHorizontal: space.lg`, `alignItems: 'center'`, `gap: space.sm`
  - [x] T2.2 — Ajouter un emoji/icône d'état vide et un sous-texte explicatif dans le rendu JSX : icône `📋`, titre "Aucune évaluation", sous-texte "Aucune évaluation sur cette période."

- [x] T3 — Alignement colonnes tableau (AC: 3, 5)
  - [x] T3.1 — S'assurer que `colSignal` dans `styles` (déjà `alignItems: 'center'`) n'est PAS surchargé inutilement dans le JSX — supprimer les `{ alignItems: 'center' }` inline redondants sur les `View` header et lignes colSignal
  - [x] T3.2 — Vérifier visuellement que header et lignes sont alignés : `colJoueur flex:2`, `colDate flex:1`, `colSignal flex:1`, `colComment flex:2`

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Naviguer sur `/activites/evaluations` et vérifier fond beige visible partout (y compris derrière les cards)
  - [x] T4.2 — Vérifier empty state avec filtre temporel "À venir" (qui retourne 0 évals en pratique)
  - [x] T4.3 — Vérifier l'alignement header/lignes sur les 5 colonnes
  - [x] T4.4 — Vérifier NoteCircle et PlayerAvatar bien affichés dans les lignes

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakText (obligatoire pour le texte, garantit Montserrat)
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées (sauf exceptions documentées)
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Fond beige ScrollView

Le problème : sur le web, le `contentContainerStyle` du `ScrollView` reçoit `scrollContent` mais **sans `backgroundColor`**. Le fond du container parent (`colors.light.primary`) est bien défini, mais sur certains navigateurs la zone de contenu du scroll peut afficher un fond blanc par défaut.

Fix minimal dans `styles.scrollContent` :

```typescript
scrollContent: {
  paddingTop       : space.md,
  paddingBottom    : space.xxl,
  backgroundColor  : colors.light.primary,   // ← AJOUTER cette ligne
},
```

Aucun autre fichier à modifier pour ce point.

---

### T2 — Empty state amélioré

État actuel (`styles.emptyRow`) :
```typescript
emptyRow: {
  paddingVertical: space.xl,
  alignItems     : 'center',
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  borderWidth    : 1,
  borderColor    : colors.border.divider,
},
```

Le style est déjà partiellement correct mais le rendu JSX affiche uniquement un texte sans icône :
```tsx
// AVANT
<View style={styles.emptyRow}>
  <AureakText style={styles.emptyText}>Aucune évaluation sur cette période.</AureakText>
</View>
```

Remplacer par :
```tsx
// APRÈS
<View style={styles.emptyRow}>
  <AureakText style={styles.emptyIcon}>📋</AureakText>
  <AureakText style={styles.emptyTitle}>Aucune évaluation</AureakText>
  <AureakText style={styles.emptyText}>Aucune évaluation sur cette période.</AureakText>
</View>
```

Et ajouter dans `styles` :
```typescript
emptyRow: {
  paddingVertical  : space.xxl,
  paddingHorizontal: space.lg,
  alignItems       : 'center',
  gap              : space.sm,
  backgroundColor  : colors.light.surface,
  borderRadius     : radius.card,
  borderWidth      : 1,
  borderColor      : colors.border.divider,
},
emptyIcon: {
  fontSize  : 32,
  lineHeight: 40,
  textAlign : 'center',
},
emptyTitle: {
  fontFamily: fonts.display,
  fontSize  : 15,
  fontWeight: '700',
  color     : colors.text.dark,
  textAlign : 'center',
},
emptyText: {
  fontFamily: fonts.body,
  fontSize  : 13,
  color     : colors.text.muted,
  textAlign : 'center',
},
```

---

### T3 — Suppression des alignItems inline redondants

Dans le JSX de la section tableau (lignes ~443–447 et ~484–491), les `View` header et lignes colSignal ont un `{ alignItems: 'center' }` inline qui duplique ce qui est déjà dans `styles.colSignal`.

Avant :
```tsx
<View style={[styles.colSignal, { alignItems: 'center' }]}>
```

Après :
```tsx
<View style={styles.colSignal}>
```

Ceci s'applique aux 4 occurrences de `colSignal` dans le JSX (2 dans le header, 2 dans les lignes tableau).

---

### Design

Tokens à utiliser :
```tsx
import { colors, space, shadows, radius, fonts } from '@aureak/theme'

// fond page
backgroundColor : colors.light.primary    // #F3EFE7 beige

// fond cards/tableau
backgroundColor : colors.light.surface    // #FFFFFF

// fond lignes alternées
backgroundColor : colors.light.muted      // légèrement grisé

// bordures
borderColor     : colors.border.divider   // neutre léger

// texte
color           : colors.text.dark        // titres/valeurs
color           : colors.text.muted       // labels/secondaires
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifier | 3 changements ciblés (scrollContent bgcolor, emptyRow JSX+styles, retrait alignItems inline) |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/evaluations/index.tsx` — re-export inchangé
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — hors scope
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — hors scope
- `aureak/packages/theme/src/tokens.ts` — aucun nouveau token nécessaire

---

### Dépendances à protéger

- Story 72-4 a ajouté `NoteCircle` et `PlayerAvatar` dans ce fichier — ne pas modifier ces composants
- Les `styles.colJoueur`, `styles.colDate`, `styles.colSignal`, `styles.colComment` sont les seules définitions de largeur de colonnes — ne pas changer les valeurs `flex`

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern empty state : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` (pattern similaire)
- Fichier cible : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
- Story de référence design : `_bmad-output/implementation-artifacts/story-72-4-design-evaluations-cercles-notes-avatars-figma.md`

---

### Multi-tenant

RLS gère l'isolation côté Supabase — aucun paramètre tenantId à ajouter dans cette story purement UI.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes
Story créée par la Story Factory — 2026-04-07. Aucune migration DB. Changements UI uniquement dans `page.tsx`.

### Change Log
- 2026-04-07 : Story créée, status `ready-for-dev`
