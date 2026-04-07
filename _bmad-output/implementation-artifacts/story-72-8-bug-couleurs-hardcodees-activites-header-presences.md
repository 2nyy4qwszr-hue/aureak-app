# Story 72.8 : BUG — Couleurs hardcodées #18181B et #FFFFFF dans ActivitesHeader et presences/page

Status: done

## Story

En tant qu'admin,
je veux que les couleurs des composants ActivitesHeader et presences/page.tsx soient systématiquement issues des tokens @aureak/theme,
afin qu'aucune valeur hexadécimale hardcodée ne subsiste et que le design system reste cohérent si les tokens changent.

## Acceptance Criteria

1. Le fichier `ActivitesHeader.tsx` ne contient aucune valeur hexadécimale hardcodée — toute couleur utilise un token `colors.*` importé de `@aureak/theme`.
2. Le fichier `presences/page.tsx` ne contient aucune valeur hexadécimale hardcodée — toute couleur utilise un token `colors.*` importé de `@aureak/theme`.
3. Les occurrences de `#18181B` sont remplacées par `colors.text.dark` (token existant dans `@aureak/theme`, valeur `#18181B`).
4. Les occurrences de `#FFFFFF` sont remplacées par `colors.light.surface` (cards blanches) ou `colors.text.primary` (texte blanc sur fond sombre) selon le contexte d'usage.
5. Le rendu visuel des deux pages (`/activites` et `/activites/presences`) est identique avant et après le fix — les couleurs substituées ont la même valeur hexadécimale que les tokens.
6. Un grep sur `#[0-9a-fA-F]{3,6}` dans les deux fichiers cibles ne retourne aucun résultat (hors commentaires `//`).

## Tasks / Subtasks

- [x] T1 — Audit et fix ActivitesHeader.tsx (AC: 1, 3, 4, 6)
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` en entier
  - [x] T1.2 — Identifier toutes les occurrences de couleurs hexadécimales hardcodées (grep `#[0-9a-fA-F]`)
  - [x] T1.3 — Remplacer chaque `#18181B` par `colors.text.dark` — déjà tokenisé lors de story 65-1
  - [x] T1.4 — Remplacer chaque `#FFFFFF` par le token approprié selon contexte — déjà tokenisé lors de story 65-1
  - [x] T1.5 — Vérifier que l'import `colors` depuis `@aureak/theme` est présent en tête de fichier — ✅ présent ligne 8

- [x] T2 — Audit et fix presences/page.tsx (AC: 2, 3, 4, 6)
  - [x] T2.1 — Lire `aureak/apps/web/app/(admin)/activites/presences/page.tsx` en entier
  - [x] T2.2 — Identifier toutes les occurrences de couleurs hexadécimales hardcodées (grep `#[0-9a-fA-F]`)
  - [x] T2.3 — Remplacer chaque `#18181B` par `colors.text.dark` — déjà tokenisé lors de story 65-2
  - [x] T2.4 — Remplacer chaque `#FFFFFF` par le token approprié selon contexte — déjà tokenisé lors de story 65-2
  - [x] T2.5 — Vérifier que l'import `colors` depuis `@aureak/theme` est présent en tête de fichier — ✅ présent ligne 7

- [x] T3 — QA scan post-fix (AC: 5, 6)
  - [x] T3.1 — Grep final sur les deux fichiers : `grep -n "#[0-9a-fA-F]" <fichier> | grep -v "//"` → zéro résultat ✅ confirmé
  - [x] T3.2 — Naviguer vers `/activites` et `/activites/presences` — couleurs identiques (aucune modification apportée, déjà conformes)
  - [x] T3.3 — Vérifier qu'aucune erreur console n'est générée — console guards NODE_ENV déjà présents dans presences/page.tsx

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

---

### T1 — Tokens de substitution

**Correspondances exactes confirmées** (`aureak/packages/theme/src/tokens.ts` lignes 100–106) :

```
#18181B  →  colors.text.dark       (texte zinc-900 sur fond clair)
#FFFFFF  →  colors.light.surface   (fond blanc card)       si contexte = fond
#FFFFFF  →  colors.text.primary    (texte blanc sur dark)  si contexte = texte sur fond sombre
```

**Pattern d'import déjà présent dans les deux fichiers :**

```tsx
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
```

Aucun import supplémentaire nécessaire — `colors` est déjà importé.

---

### T2 — Règle de substitution selon contexte

| Usage | Token correct | Valeur |
|-------|---------------|--------|
| `color: '#18181B'` (texte sur fond clair) | `colors.text.dark` | `#18181B` |
| `backgroundColor: '#FFFFFF'` (fond card, surface) | `colors.light.surface` | `#FFFFFF` |
| `color: '#FFFFFF'` (texte sur fond sombre) | `colors.text.primary` | `#FFFFFF` |
| `borderColor: '#FFFFFF'` | `colors.light.surface` | `#FFFFFF` |

**Aucune valeur visuelle ne change** — les tokens ont exactement les mêmes valeurs hexadécimales.

---

### Design

Tokens à utiliser (source : `aureak/packages/theme/src/tokens.ts`) :

```tsx
import { colors } from '@aureak/theme'

// Texte sur fond clair (labels, titres admin)
color: colors.text.dark         // #18181B — zinc-900

// Fond card blanc (surfaces admin web)
backgroundColor: colors.light.surface  // #FFFFFF

// Texte sur fond sombre (boutons, dark cards)
color: colors.text.primary      // #FFFFFF
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Modifier | Remplacer couleurs hardcodées par tokens |
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier | Remplacer couleurs hardcodées par tokens |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — les tokens sont corrects, ne pas modifier leurs valeurs
- `aureak/apps/web/app/(admin)/activites/presences/index.tsx` — re-export uniquement, non impacté
- `aureak/apps/web/app/(admin)/activites/components/FiltresScope.tsx` — hors périmètre
- `aureak/apps/web/app/(admin)/activites/components/PseudoFiltresTemporels.tsx` — hors périmètre
- Toute migration Supabase — aucune DB concernée par ce fix

---

### Dépendances à protéger

- Story 65-1 utilise `ActivitesHeader` — ne pas modifier les props ni l'export du composant
- Story 65-2 utilise `presences/page.tsx` — ne pas modifier la logique métier, uniquement les valeurs de style
- Story 72-3 (`design-presences-statcards-heatmap-figma`) modifie aussi `presences/page.tsx` — vérifier que les deux stories ne créent pas de conflit si exécutées dans le même sprint

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 100–106 (section `text`) et 17–23 (section `light`)
- Pattern de référence ActivitesHeader : `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` — `colors.text.dark` déjà utilisé lignes 53 et 91
- Pattern de référence presences : `aureak/apps/web/app/(admin)/activites/presences/page.tsx` — `getCellStyle()` utilise déjà des tokens lignes 65–68
- Story liée : `_bmad-output/implementation-artifacts/story-72-3-design-presences-statcards-heatmap-figma.md`

---

### Multi-tenant

Aucune logique multi-tenant concernée — fix purement stylistique. RLS non impacté.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
Aucun — audit grep confirme zéro hex hardcodé dans les deux fichiers cibles.

### Completion Notes List
- Les deux fichiers étaient déjà entièrement tokenisés avant implémentation.
- `ActivitesHeader.tsx` : `colors` importé depuis `@aureak/theme` ligne 8, tous les styles utilisent des tokens.
- `presences/page.tsx` : `colors, space, radius, shadows, fonts` importés depuis `@aureak/theme` ligne 7, tous les styles utilisent des tokens.
- Grep `#[0-9a-fA-F]` sur les deux fichiers → 0 résultats confirmé.
- La tokenisation avait été réalisée lors des stories 65-1 (ActivitesHeader) et 65-2 (presences/page).
- Story marquée done sans modification des fichiers source (déjà conformes).

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` | Vérifié — déjà conforme, aucune modification nécessaire |
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Vérifié — déjà conforme, aucune modification nécessaire |
