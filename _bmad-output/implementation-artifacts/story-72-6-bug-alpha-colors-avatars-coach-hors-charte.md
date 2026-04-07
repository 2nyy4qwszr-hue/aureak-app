# Story 72.6 : BUG — Couleurs avatars coach hors charte dans TableauSeances

Status: done

## Story

En tant qu'administrateur consultant le tableau des séances,
je veux que les avatars des coachs affichent uniquement des couleurs conformes à la charte AUREAK (gold, vert, rouge, orange, gris),
afin que l'interface soit cohérente visuellement et n'introduise pas de violet ni de bleu non autorisés par la charte.

## Acceptance Criteria

1. La constante de palette des couleurs d'avatars coach dans `TableauSeances.tsx` ne contient aucune couleur hors charte : ni violet (`#8B5CF6`), ni bleu (`#3B82F6`), ni cyan (`#06B6D4`), ni rose (`#EC4899`).
2. La palette autorisée contient uniquement des couleurs issues des tokens `@aureak/theme` : gold (`colors.accent.gold`), vert (`colors.status.success`), rouge (`colors.accent.red`), orange (`colors.status.warning`), gris (`colors.accent.silver`).
3. Chaque avatar coach dans `CoachAvatars` reçoit une couleur de fond distincte par rotation d'index sur la palette conforme (index `i % PALETTE.length`).
4. La couleur de fond de chaque avatar est appliquée avec une opacité `+ '33'` (alpha 20%) pour rester dans le registre subtil et premium de la charte.
5. Le badge "+N" (extra coachs) conserve son fond `colors.accent.goldLight` existant — aucun changement sur cet élément.
6. Aucune couleur hardcodée (`#XXXXXX`) n'est présente dans la section `CoachAvatars` — toutes les valeurs passent par les tokens.
7. Le rendu visuel du tableau des séances est inchangé structurellement (taille des avatars, overlap `-6`, bordure blanche) — seule la couleur de fond varie.

## Tasks / Subtasks

- [x] T1 — Ajouter la constante palette conforme et l'utiliser dans CoachAvatars (AC: 1, 2, 3, 4, 6)
  - [x] T1.1 — Dans `TableauSeances.tsx`, juste avant la fonction `getInitials` (ligne ~133), ajouter la constante `COACH_AVATAR_COLORS` avec 5 couleurs issues des tokens (voir Dev Notes)
  - [x] T1.2 — Dans `CoachAvatars`, modifier `backgroundColor` de l'avatarStyle pour utiliser `COACH_AVATAR_COLORS[i % COACH_AVATAR_COLORS.length] + '33'` au lieu de `colors.accent.gold + '33'`
  - [x] T1.3 — Vérifier qu'aucune couleur hardcodée ne subsiste dans la section avatars (grep `#[0-9A-Fa-f]{6}` sur les lignes 132–185)

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — Naviguer sur `/activites` et vérifier que les avatars coach affichent des couleurs variées par coach (gold, vert, rouge, orange, gris)
  - [x] T2.2 — Vérifier qu'aucune couleur violette ni bleue n'apparaît dans les avatars
  - [x] T2.3 — Vérifier que le badge "+N" reste sur fond `goldLight` (non affecté)
  - [x] T2.4 — Vérifier qu'il n'y a aucune erreur console JS

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius` — jamais de valeurs hardcodées
- **Styles via tokens uniquement** — la palette doit référencer les tokens, pas des hex locaux
- **Try/finally obligatoire** sur tout state setter de chargement (non impacté par ce fix)

---

### T1 — Constante COACH_AVATAR_COLORS et usage dans CoachAvatars

**Emplacement exact** : `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx`

**Insérer juste avant `function getInitials`** (actuellement ligne 134) :

```tsx
// Palette avatars coach — couleurs conformes à la charte AUREAK uniquement
// Aucune couleur violette (#8B5CF6) ni bleue (#3B82F6) autorisée
const COACH_AVATAR_COLORS = [
  colors.accent.gold,    // '#C1AC5C' — or champagne AUREAK
  colors.status.success, // '#10B981' — vert émeraude
  colors.accent.red,     // '#E05252' — rouge CTA
  colors.status.warning, // '#F59E0B' — ambre/orange
  colors.accent.silver,  // '#9CA3AF' — argent/gris
] as const
```

**Modifier dans `CoachAvatars`** — ligne `backgroundColor` de l'avatarStyle :

```tsx
// AVANT (ligne ~168) :
backgroundColor: colors.accent.gold + '33',

// APRÈS :
backgroundColor: COACH_AVATAR_COLORS[i % COACH_AVATAR_COLORS.length] + '33',
```

**Code complet de `CoachAvatars` après modification** :

```tsx
function CoachAvatars({
  coachIds,
  coachNames,
}: {
  coachIds  : string[]
  coachNames: Map<string, string>
}) {
  const MAX_SHOWN = 2
  const shown     = coachIds.slice(0, MAX_SHOWN)
  const extra     = coachIds.length - MAX_SHOWN

  if (coachIds.length === 0) {
    return <AureakText style={styles.cellMuted}>—</AureakText>
  }

  return (
    <View style={styles.avatarRow}>
      {shown.map((id, i) => {
        const name = coachNames.get(id) ?? '?'
        const init = getInitials(name)
        const avatarStyle: ViewStyle = {
          width          : 28,
          height         : 28,
          borderRadius   : 14,
          justifyContent : 'center',
          alignItems     : 'center',
          borderWidth    : 1.5,
          borderColor    : colors.light.surface,
          backgroundColor: COACH_AVATAR_COLORS[i % COACH_AVATAR_COLORS.length] + '33',
          marginLeft     : i > 0 ? -6 : 0,
        }
        return (
          <View key={id} style={avatarStyle}>
            <AureakText style={styles.avatarText}>{init}</AureakText>
          </View>
        )
      })}
      {extra > 0 && (
        <View style={[styles.avatarExtra, { marginLeft: -6 }]}>
          <AureakText style={styles.avatarExtraText}>+{extra}</AureakText>
        </View>
      )}
    </View>
  )
}
```

---

### Design

Tokens utilisés :
```tsx
import { colors } from '@aureak/theme'

// Palette rotative avatars coach (alpha 20%)
COACH_AVATAR_COLORS[i % 5] + '33'

// Badge +N extra — inchangé
backgroundColor: colors.accent.goldLight  // '#D6C98E'
```

Principes design à respecter :
- Cohérence charte AUREAK : uniquement gold, vert, rouge, orange, gris
- Opacité `+ '33'` (alpha 20%) = registre subtil et premium
- Différenciation visuelle par coach via rotation d'index

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | Modifier | Ajouter `COACH_AVATAR_COLORS` + modifier `backgroundColor` dans `CoachAvatars` |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — la `playerTiers.avatarPalette` existante sert d'autres composants ; ce fix est localisé dans TableauSeances uniquement
- `aureak/packages/types/src/entities.ts` — aucun type impacté
- `aureak/packages/api-client/` — aucune API impactée
- Tous les autres composants de `/activites/components/` — non concernés par ce fix

### Dépendances à protéger

- Aucune dépendance critique : `CoachAvatars` est un composant interne non exporté, utilisé uniquement dans `TableauSeances.tsx`
- La constante `COACH_AVATAR_COLORS` est locale au fichier — aucun impact sur les packages partagés

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` lignes 38–51 (`colors.accent.*`) et 52–76 (`colors.status.*`)
- Composant cible : `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` lignes 132–184 (section `CoachAvatars`)
- Couleurs à exclure (hors charte) : `#8B5CF6` (violet), `#3B82F6` (bleu), `#06B6D4` (cyan), `#EC4899` (rose) — présentes dans `playerTiers.avatarPalette` ligne 324 de tokens.ts
- Couleurs autorisées : `colors.accent.gold` (#C1AC5C), `colors.status.success` (#10B981), `colors.accent.red` (#E05252), `colors.status.warning` (#F59E0B), `colors.accent.silver` (#9CA3AF)

---

### Multi-tenant

Non applicable — fix purement visuel côté client, aucune donnée DB impliquée.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/components/TableauSeances.tsx` | À modifier |
