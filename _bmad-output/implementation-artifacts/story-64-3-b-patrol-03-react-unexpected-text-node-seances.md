# Story 64.3 : B-PATROL-03 — React "Unexpected text node" dans séances

Status: done

Epic: 64 — Bugfix batch avril 2026 #3

## Story

En tant qu'admin Aureak,
je veux que la page `/seances` s'affiche sans warnings React "Unexpected text node" dans la console,
afin d'avoir une console propre et d'éviter des rendus incorrects sur React Native Web.

## Acceptance Criteria

1. La page `/seances` (et ses sous-composants) charge sans aucun warning "Unexpected text node" dans la console navigateur.
2. Chaque espace, saut de ligne ou chaîne de caractère entre balises View/Pressable/TouchableOpacity est supprimé ou encapsulé dans `<Text>`.
3. Les interpolations conditionnelles `{condition && ' '}` ou `{condition && '\n'}` qui produisent un string nu sont éliminées.
4. `npx tsc --noEmit` retourne 0 erreur après correction.
5. L'apparence visuelle de la page reste identique après correction.

## Tasks / Subtasks

- [x] T1 — Localiser les sources des warnings (AC: 2, 3)
  - [x] T1.1 — Grep dans `aureak/apps/web/app/(admin)/seances/` : `{ }` (espaces JSX nus entre balises)
  - [x] T1.2 — Grep pour `{'\n'}`, `{' '}` entre balises View/Pressable
  - [x] T1.3 — Grep pour les interpolations `{condition && 'texte'}` retournant un string
  - [x] T1.4 — Vérifier également les composants importés utilisés dans seances/ (ex. composants locaux)

- [x] T2 — Corriger chaque occurrence (AC: 2, 3, 5)
  - [x] T2.1 — Supprimer les espaces/sauts de ligne entre balises View lorsqu'ils sont inutiles (formatage code)
  - [x] T2.2 — Wrapper dans `<Text>` tout string intentionnel qui doit rester affiché
  - [x] T2.3 — Remplacer `{condition && ' '}` par `null` si l'espace n'a pas d'effet visuel, sinon `{condition && <Text> </Text>}`

- [x] T3 — Validation (AC: 1, 4)
  - [x] T3.1 — `cd aureak && npx tsc --noEmit` → 0 erreur
  - [x] T3.2 — Vérifier via Playwright ou inspection manuelle que zéro warning "Unexpected text node" subsiste

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** — les composants View, Pressable, ScrollView n'acceptent PAS de text nodes directs
- Seul `Text` (et ses descendants) accepte du texte brut
- Les espaces de formatage entre balises JSX sont des text nodes implicites

---

### T1 — Patterns à détecter

Les warnings "Unexpected text node" en React Native Web sont causés par :

```tsx
// Mauvais — espace nu entre View et Text
<View>
  {' '}
  <Text>Contenu</Text>
</View>

// Mauvais — interpolation conditionnelle retournant string
<View>
  {isActive && ' '}
  <Text>Contenu</Text>
</View>

// Mauvais — saut de ligne interprété
<View>

  <Text>Contenu</Text>
</View>

// Mauvais — string littéral entre balises
<Pressable>
  Texte nu
</Pressable>
```

---

### T2 — Corrections à appliquer

```tsx
// Correct — supprimer l'espace inutile
<View>
  <Text>Contenu</Text>
</View>

// Correct — wrapper dans Text si l'espace est intentionnel
<View style={{ flexDirection: 'row' }}>
  <Text>Label</Text>
  <Text> </Text>
  <Text>Valeur</Text>
</View>

// Correct — utiliser null pour les conditions qui ne produisent rien
<View>
  {isActive && null}
  <Text>Contenu</Text>
</View>

// Correct — string affichable toujours dans Text
<Pressable>
  <Text>Texte</Text>
</Pressable>
```

---

### Grep de diagnostic

```bash
# Chercher espaces et strings nus dans les fichiers seances/
grep -n "{ }" aureak/apps/web/app/(admin)/seances/page.tsx
grep -n "{\\'\\\\n\\'}" aureak/apps/web/app/(admin)/seances/page.tsx
grep -n "{\\'\\'" aureak/apps/web/app/(admin)/seances/page.tsx
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Modifier | Supprimer/encapsuler text nodes nus |
| `aureak/apps/web/app/(admin)/seances/index.tsx` | Modifier si impacté | Vérifier re-export uniquement |

### Fichiers à NE PAS modifier

- `supabase/migrations/` — aucune migration
- `@aureak/api-client` — aucun changement API
- `aureak/apps/web/app/(admin)/seances/new.tsx` — hors scope (sauf si warnings viennent de là)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — hors scope

---

### Multi-tenant

Pas d'impact tenant — correction purement JSX/rendering.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Scan complet des fichiers seances/ — patterns `{condition && 'string'}` et `? ''` identifiés et corrigés.

### Completion Notes List

- `page.tsx` : 5 patterns `&&` ou `? ''` convertis en `? ... : null` (toast, !loading, error modal, presetNameError, counter vide)
- `SessionCard.tsx` : `session.sessionType &&` → ternaire `? : null` ; `cancellationReason &&` → `!!` double négation
- Tous les strings nus dans `&&` chains qui auraient pu rendre un text node dans View corrigés
- `npx tsc --noEmit` → 0 erreur ✓
- QA : try/finally respectés, console guards en place

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/seances/_components/SessionCard.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/seances/index.tsx` | Non modifié (re-export only) |
