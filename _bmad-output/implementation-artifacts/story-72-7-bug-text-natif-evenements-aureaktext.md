# Story 72.7 : BUG — `<Text>` natif React Native dans evenements/page.tsx → remplacer par `<AureakText>`

Status: done

## Story

En tant qu'administrateur consultant la page Évènements,
je veux que tous les textes affichés (pills de filtres, labels, icônes empty state) utilisent le composant `<AureakText>` de `@aureak/ui`,
afin que la police Montserrat soit appliquée uniformément sur tous les éléments texte de la page et que le design system soit respecté.

## Acceptance Criteria

1. Aucun `<Text>` importé de `react-native` n'est présent dans `evenements/page.tsx` — l'import `Text` doit être supprimé de la ligne d'import react-native.
2. Tous les textes dans les pills de filtres (pill "Tous" + pills par type d'événement) utilisent `<AureakText>` avec les mêmes styles qu'avant.
3. Tous les textes dans l'empty state (icône emoji, titre, sous-titre, CTA) utilisent `<AureakText>`.
4. Tous les textes dans le empty state stub (icône, titre, sous-titre) utilisent `<AureakText>`.
5. Après le remplacement, la page `/evenements` s'affiche sans erreur JS console et la police Montserrat est visible sur tous les éléments texte.
6. Aucun style inline hardcodé de couleur ou taille n'est introduit lors du remplacement — les tokens `colors.*` et la prop `variant` d'`AureakText` sont utilisés.
7. Le fichier `evenements/index.tsx` (re-export) n'est pas modifié — seul `page.tsx` est concerné.

## Tasks / Subtasks

- [x] T1 — Audit et remplacement des `<Text>` natifs dans evenements/page.tsx (AC: 1, 2, 3, 4)
  - [x] T1.1 — Ouvrir `aureak/apps/web/app/(admin)/evenements/page.tsx` et recenser toutes les occurrences de `<Text` (import et usages JSX)
  - [x] T1.2 — Supprimer `Text` de la ligne d'import react-native (ligne ~4-6) si présent
  - [x] T1.3 — Remplacer chaque `<Text ...>` par `<AureakText ...>` et chaque `</Text>` par `</AureakText>` en préservant exactement les styles existants
  - [x] T1.4 — Vérifier que `AureakText` est déjà importé depuis `@aureak/ui` (ligne 9) — ne pas dupliquer l'import
  - [x] T1.5 — Pour les occurrences avec style objet inline (ex: `{ fontSize: 10, fontWeight: '700' }`), préférer `variant="caption"` ou `variant="body"` d'`AureakText` si applicable, sinon conserver le style inline via prop `style`

- [x] T2 — QA scan du fichier modifié (AC: 5, 6)
  - [x] T2.1 — Vérifier absence de `<Text` (natif) dans le fichier après modification
  - [x] T2.2 — Vérifier absence de couleurs hardcodées introduites (grep `#[0-9a-fA-F]{3,6}` hors constantes déjà existantes)
  - [x] T2.3 — Vérifier que les console guards sont présents (`process.env.NODE_ENV !== 'production'` sur tout `console.error`)

- [x] T3 — Validation visuelle (AC: 5)
  - [x] T3.1 — Naviguer sur `http://localhost:8081/evenements` et vérifier que la page s'affiche correctement
  - [x] T3.2 — Vérifier que la police Montserrat est visible sur les pills de filtres, les labels de cards et les textes d'empty state
  - [x] T3.3 — Vérifier zéro erreur JS dans la console navigateur
  - [x] T3.4 — Tester le filtre "Tous" + au moins un filtre par type d'événement → vérifier que les pills actives s'affichent correctement

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, **AureakText**, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées

---

### T1 — Pattern de remplacement

Import react-native AVANT (avec `Text` natif) :
```tsx
import {
  View, StyleSheet, ScrollView, Pressable, Modal, Text,
} from 'react-native'
```

Import react-native APRÈS (sans `Text`) :
```tsx
import {
  View, StyleSheet, ScrollView, Pressable, Modal,
} from 'react-native'
```

L'import `AureakText` est déjà présent ligne 9 :
```tsx
import { AureakText } from '@aureak/ui'
```

Remplacement type pour une pill de filtre :
```tsx
// AVANT (natif — Montserrat non appliqué)
<Text style={[s.filterPillText, !activeType && s.filterPillTextActive]}>
  Tous
</Text>

// APRÈS (AureakText — Montserrat garanti)
<AureakText style={StyleSheet.flatten([s.filterPillText, !activeType && s.filterPillTextActive])}>
  Tous
</AureakText>
```

Remplacement type pour un empty state :
```tsx
// AVANT
<Text style={s.emptyIcon}>📅</Text>
<Text variant="body" style={{ fontWeight: '700', color: colors.text.dark }}>
  Aucun évènement
</Text>

// APRÈS
<AureakText style={s.emptyIcon}>📅</AureakText>
<AureakText variant="body" style={{ fontWeight: '700', color: colors.text.dark, marginBottom: 4 }}>
  Aucun évènement
</AureakText>
```

---

### Design

Tokens à utiliser (déjà en place, ne pas modifier) :
```tsx
import { colors, space, radius, shadows } from '@aureak/theme'

// Pills filtres
color           : colors.text.muted        // état inactif
color           : colors.text.dark         // état actif
backgroundColor : colors.light.surface
borderColor     : colors.border.light

// Empty state
color           : colors.text.dark         // titre
color           : colors.text.muted        // sous-titre
fontSize        : 40                       // emoji icon (emptyIcon style)
```

`AureakText` supporte les props suivantes :
- `variant` : `"h1" | "h2" | "h3" | "body" | "caption"` — applique la police Montserrat + taille prédéfinie
- `style` : StyleSheet ou objet inline pour surcharges (fontWeight, color, etc.)
- `color` : prop directe pour la couleur (alternative à `style.color`)

---

### Localisation des occurrences à remplacer

Les 6 emplacements de `<Text>` natif potentiellement présents (à vérifier dans la version locale) :

| # | Composant / Zone | JSX approximatif |
|---|-----------------|-----------------|
| 1 | `EventTypePill` | pill label `{cfg.label}` |
| 2 | Pill "Tous" | filtre horizontal label "Tous" |
| 3 | Pill filtres par type | `{typeCfg.label}` dans le map |
| 4 | Empty state principal — icône | `📅` |
| 5 | Empty state principal — titre | "Aucun évènement" |
| 6 | Empty state stub — icône | `{STUB_TYPE_ICONS[activeType!] ?? '📋'}` |

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/evenements/page.tsx` | Modifier | Supprimer import `Text` react-native + remplacer 6 occurrences `<Text>` par `<AureakText>` |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/evenements/index.tsx` — re-export uniquement, non concerné
- `aureak/packages/ui/src/AureakText.tsx` — composant stable, aucune modification
- `aureak/packages/theme/src/tokens.ts` — tokens non impactés
- Toute autre page ou composant — périmètre strictement limité à `evenements/page.tsx`

---

### Dépendances à protéger

- Aucune autre story ne dépend de `evenements/page.tsx` actuellement
- Le composant `EventTypePill` et `StatusBadge` sont locaux à ce fichier — leur refactoring reste dans le périmètre de ce fichier uniquement

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Composant AureakText : `aureak/packages/ui/src/AureakText.tsx`
- Pattern AureakText dans page similaire : `aureak/apps/web/app/(admin)/stages/index.tsx`
- Story parente (Epic 72) : `_bmad-output/implementation-artifacts/story-72-1-design-dashboard-sessions-sites-evenements.md`

---

### Multi-tenant

Aucun impact multi-tenant — fix purement UI, aucune requête DB, aucune RLS concernée.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Fix déjà appliqué : `evenements/page.tsx` ne contient aucun `<Text>` natif react-native. `Text` n'est pas dans l'import react-native (ligne 5). Tous les éléments texte utilisent déjà `<AureakText>` de `@aureak/ui`. Aucune modification de code n'était nécessaire. Story marquée done sans commit (aucun changement de code).

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/evenements/page.tsx` | À modifier |
