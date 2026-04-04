# Story 46.4 : BUG — Séances — "Unexpected text node" erreurs React

Status: done

## Story

En tant qu'admin Aureak consultant la page des séances,
je veux que la page se charge sans erreurs React console,
afin d'éviter des crashes potentiels sur mobile et des warnings qui masquent de vrais bugs.

## Acceptance Criteria

1. La page `(admin)/seances/` se charge sans erreur "Unexpected text node" dans la console ✅
2. Zéro erreur React dans la console browser sur `/seances` ✅
3. Le rendu visuel de la liste des séances est inchangé ✅

## Tasks / Subtasks

- [x] T1 — Identifier la cause
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/seances/index.tsx` — rechercher les nœuds texte directs entre éléments View (ex: `{' '}`, strings littérales hors Text)
  - [x] T1.2 — Vérifier aussi `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`
  - [x] T1.3 — Identifier les patterns `<View>texte direct</View>` ou expressions conditionnelles qui retournent des strings

- [x] T2 — Corriger
  - [x] T2.1 — Wrapper tout texte nu dans `<Text>` (React Native Web n'accepte pas les nœuds texte directs dans View)
  - [x] T2.2 — Remplacer `{condition && 'string'}` par `{condition && <Text>string</Text>}`
  - [x] T2.3 — Remplacer `{' '}` entre éléments par des `marginLeft/marginRight` ou supprimer

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [x] T3.2 — Console browser sur /seances → zéro "Unexpected text node"

## Dev Notes

### Cause racine

Dans `aureak/apps/web/app/(admin)/seances/page.tsx`, deux conditionnels utilisaient des
**string vides comme garde** dans des expressions `&&` au sein d'un `<View>` :

```tsx
// ❌ AVANT — filterImplantId est '' (string vide), pas false ni null
{filterImplantId && filterGroups.length > 0 && (
  <View>...</View>
)}

// ❌ AVANT — filterGroupId idem
{filterGroupId && (
  <Pressable>...</Pressable>
)}
```

En JavaScript, `'' && x` retourne `''` (la string elle-même, pas `false`).
React Native Web valide les enfants de `<View>` et émet
`"Unexpected text node: . A text node cannot be a child of a <View>."` dès qu'un `string`
est enfant direct d'un View.

### Fix appliqué

```tsx
// ✅ APRÈS — conversion explicite en booléen
{!!filterImplantId && filterGroups.length > 0 && (
  <View>...</View>
)}

{!!filterGroupId && (
  <Pressable>...</Pressable>
)}
```

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Lignes 430 et 434 : `filterImplantId &&` → `!!filterImplantId &&`, `filterGroupId &&` → `!!filterGroupId &&` |

## Dev Agent Record

- Investigation : React fiber tree walk + bundle analysis → localisation du View avec `gap:8` (st.filtersWrap)
- Cause confirmée : `'' && expr` retourne `''` en JS, string vide rendue dans un `<View>`
- Fix : `!!filterImplantId` et `!!filterGroupId` pour court-circuiter avec `false` (pas `''`)
- Validation : `npx tsc --noEmit` → 0 erreur ; console browser → 0 "Unexpected text node"
- Playwright : screenshot confirme rendu visuel inchangé (MonthView Avril 2026, filtres corrects)
