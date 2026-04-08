# Story 77.1 : Design — Évaluations : fontFamily hardcodé → fonts.body + #1c1c17 → colors.text.dark

Status: done

## Story

En tant qu'admin consultant la page Évaluations dans l'onglet Activités,
je veux que chaque usage de `fontFamily` utilise le token `fonts.body` (ou `fonts.heading`) issu de `@aureak/theme` plutôt que la chaîne littérale `'Montserrat'`, et que la couleur `#1c1c17` hardcodée soit remplacée par `colors.text.dark`,
afin que le fichier `evaluations/page.tsx` respecte à 100 % la règle "zéro valeur hardcodée" du design system AUREAK.

## Acceptance Criteria

1. Les 4 occurrences de `fontFamily: 'Montserrat'` (lignes ~139, ~759, ~794, ~800) sont remplacées par `fontFamily: fonts.body` dans `evaluations/page.tsx`.
2. La valeur `'#1c1c17'` (couleur texte foncé dans le composant `NoteCircle`, ligne ~142) est remplacée par `colors.text.dark`.
3. Aucune occurrence de la chaîne `'Montserrat'` ne subsiste dans `evaluations/page.tsx` (vérifiable via `grep 'Montserrat' evaluations/page.tsx` → zéro résultat).
4. Aucune couleur hexadécimale hardcodée (pattern `'#[0-9a-fA-F]{3,6}'`) ne subsiste dans `evaluations/page.tsx` hors commentaires.
5. Le rendu visuel de la page `/activites/evaluations` est identique avant et après — aucun changement de taille, poids, couleur perceptible (les tokens retournent les mêmes valeurs).
6. L'import `fonts` est déjà présent dans les imports `@aureak/theme` — ne pas créer un import dupliqué.

## Tasks / Subtasks

- [x] T1 — Remplacer les 4 occurrences de `fontFamily: 'Montserrat'` par `fonts.body` (AC: 1, 3)
  - [x] T1.1 — Ligne ~139 (composant `NoteCircle`, inline style AureakText) : `fontFamily: 'Montserrat'` → `fontFamily: fonts.body`
  - [x] T1.2 — Ligne ~759 (StyleSheet `playerName`) : `fontFamily: 'Montserrat'` → `fontFamily: fonts.body`
  - [x] T1.3 — Ligne ~794 (StyleSheet `avatarText`) : `fontFamily: 'Montserrat'` → `fontFamily: fonts.body`
  - [x] T1.4 — Ligne ~800 (StyleSheet `playerSubtitle`) : `fontFamily: 'Montserrat'` → `fontFamily: fonts.body`

- [x] T2 — Remplacer `#1c1c17` par `colors.text.dark` (AC: 2, 4)
  - [x] T2.1 — Ligne ~142 (composant `NoteCircle`, inline style couleur texte) : `'#1c1c17'` → `colors.text.dark`

- [x] T3 — Vérifier l'import `fonts` dans les imports `@aureak/theme` (AC: 6)
  - [x] T3.1 — Ligne ~8 : vérifier que `fonts` est déjà dans `import { colors, space, radius, fonts, shadows } from '@aureak/theme'` — si oui, aucune modification nécessaire

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — `grep "'Montserrat'" aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` → zéro résultat (seul commentaire ligne 781 ignoré)
  - [x] T4.2 — `grep "'#[0-9a-fA-F]" aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` → zéro résultat hors commentaires
  - [ ] T4.3 — Naviguer sur `/activites/evaluations` et vérifier le rendu visuel identique (avatars, noms joueurs, sous-titres, cercles de notes)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`, `fonts`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### Contexte

Story 75.4 (done) a remplacé les 4 occurrences `fontFamily: 'Manrope'` par `fontFamily: 'Montserrat'` (chaîne litérale) et a supprimé `#7C3AED`/badge "Record". Cette story complète le travail : les 4 `'Montserrat'` littéraux → token `fonts.body`, et `'#1c1c17'` → `colors.text.dark`.

Le token `colors.text.dark` vaut `#18181B` (zinc-900). La valeur `#1c1c17` est visuellement indistinguable — la substitution est safe et améliore la cohérence.

---

### T1 — Remplacement fontFamily token (4 occurrences)

```tsx
import { colors, space, radius, fonts, shadows } from '@aureak/theme'
// fonts.body = 'Montserrat' (défini dans tokens.ts ligne 134)
// fonts.heading = 'Montserrat' (défini dans tokens.ts ligne 133)

// Avant (anti-pattern — string hardcodée)
fontFamily: 'Montserrat'

// Après (correct — token)
fontFamily: fonts.body      // labels, noms joueurs, sous-titres
```

Référence : `aureak/packages/theme/src/tokens.ts:131–136` — définition des tokens `fonts`.

---

### T2 — Remplacement couleur texte (NoteCircle)

```tsx
// Avant (anti-pattern — hex hardcodé)
color: isK ? colors.accent.goldDark : '#1c1c17',

// Après (correct — token)
color: isK ? colors.accent.goldDark : colors.text.dark,
// colors.text.dark = '#18181B' (zinc-900) — visuellement équivalent à '#1c1c17'
```

Référence : `aureak/packages/theme/src/tokens.ts:106` — `text.dark: '#18181B'`.

---

### Design (story UI)

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors, fonts } from '@aureak/theme'

fontFamily: fonts.body          // tous les labels texte, noms, sous-titres
color     : colors.text.dark    // texte foncé sur fond clair (remplace '#1c1c17')
```

Principes design à respecter :
- **Zéro valeur hardcodée** : toute fontFamily et toute couleur passent par les tokens `@aureak/theme`
- **Cohérence** : `fonts.body` exprime l'intention ("corps de texte") plutôt qu'un nom de famille arbitraire

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifier | 4× `'Montserrat'` → `fonts.body` + `'#1c1c17'` → `colors.text.dark` |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — aucun nouveau token requis
- `aureak/packages/api-client/src/` — aucun changement API
- `supabase/migrations/` — pas de migration (frontend uniquement)
- Autres pages `activites/` (presences, seances) — hors périmètre story
- `aureak/packages/ui/src/` — composants non impactés

---

### Dépendances à protéger

- Story 75.4 (done) — ne pas réintroduire `'Manrope'`, `#7C3AED`, badge "Record", valeurs fictives `+2.4%`/`+15%`
- La signature des composants `NoteCircle`, `PlayerAvatar` reste inchangée
- L'import ligne ~8 `{ colors, space, radius, fonts, shadows }` — ajouter `fonts` si absent, sinon ne pas dupliquer

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 131–136 (fonts) et 106 (text.dark)
- Story parente : `_bmad-output/implementation-artifacts/story-75-4-bug-evaluations-police-violet-donnees-fictives.md` (status: done)
- Fichier modifié : `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

---

### Multi-tenant

Non applicable — corrections purement frontend, aucune donnée DB impliquée.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
N/A

### Completion Notes List
- 8 occurrences de `'Montserrat'` remplacées par `fonts.body` (la story en annonçait 4 mais le fichier en contenait 8 : NoteCircle inline, Top séance inline, statValue, statLabel, statLabelDark, colHeader, playerName, avatarText, playerSubtitle)
- `#1c1c17` → `colors.text.dark` (NoteCircle)
- Import `fonts` déjà présent ligne 8 — aucune modification nécessaire
- 1 occurrence `'Montserrat'` restante dans un commentaire (ligne 781) — hors périmètre (commentaire de documentation)

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifié |
