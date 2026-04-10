# Story 47-6 — Design : Avatars fallback via tokens @aureak/theme (suppression couleurs hardcodées)

## Status: done

## Story

**En tant qu'** équipe de développement Aureak,
**Je veux** que la palette de couleurs des avatars fallback (initiales) utilise exclusivement les tokens `@aureak/theme`,
**Afin d'** éliminer les couleurs hardcodées `#8B5CF6` (violet) et `#3B82F6` (bleu) qui violent le design system Light Premium AUREAK.

---

## Contexte

La page `children/[childId]/page.tsx` contient une fonction `avatarBgColor()` locale avec une palette de 7 couleurs hardcodées dont violet (`#8B5CF6`) et bleu (`#3B82F6`) — couleurs absentes du design system AUREAK.

La page `children/index.tsx` a déjà été corrigée (commentaire ligne 99 : « Palette conforme design system AUREAK — noir + or, aucun violet ni bleu ») mais possède une fonction `avatarBgColor()` séparée.

**Anti-pattern identifié** : duplication de la logique `avatarBgColor` dans deux fichiers, avec divergence de palette. La version de `[childId]/page.tsx` utilise des couleurs non conformes.

---

## Acceptance Criteria

### AC1 — Suppression des couleurs hors design system dans `children/[childId]/page.tsx`

**Étant donné** que `avatarBgColor()` dans `children/[childId]/page.tsx` (ligne 331) utilise `['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']`,
**Quand** on remplace cette palette par les tokens `@aureak/theme`,
**Alors** :
- La PALETTE ne contient plus aucune couleur hardcodée
- La nouvelle palette utilise exclusivement : `colors.accent.gold`, `colors.status.success`, `colors.accent.red`, `colors.status.warning`, `colors.text.muted`, `colors.dark.surface`, `colors.dark.elevated`
- Ces 7 tokens correspondent exactement à la palette déjà validée dans `children/index.tsx`

### AC2 — Déduplication : fonction `avatarBgColor` partagée ou alignée

**Étant donné** que la même logique `avatarBgColor(id: string): string` existe dans deux fichiers du même domaine,
**Quand** on applique la correction,
**Alors** :
- Option A (préférée) : la fonction est extraite dans un helper local `_avatarHelpers.ts` dans `app/(admin)/children/` et importée dans les deux fichiers — **ou**
- Option B (acceptable si la complexité d'extraction dépasse la valeur) : la palette dans `[childId]/page.tsx` est alignée token-par-token sur celle de `index.tsx` en copiant la version corrigée
- Dans les deux cas, les deux fichiers utilisent exactement la même palette de tokens

### AC3 — Aucune régression visuelle sur les avatars

**Étant donné** que `avatarBgColor` est utilisée en deux endroits dans `[childId]/page.tsx` (ligne 386 `PlayerHeader` et ligne 2153 carte joueur),
**Quand** la correction est appliquée,
**Alors** :
- Les deux usages continuent d'afficher un fond coloré cohérent basé sur le hash de l'UUID joueur
- La logique de hachage (`hash = id.charCodeAt(i) + ((hash << 5) - hash)`) reste inchangée
- Le rendu fallback (initiales blanches sur fond coloré) fonctionne identiquement

---

## Tasks

- [ ] **T1** — Lire `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` lignes 328-335 et lignes 380-390 et 2150-2160
- [ ] **T2** — Lire `aureak/apps/web/app/(admin)/children/index.tsx` lignes 88-112 pour confirmer la palette tokens de référence
- [ ] **T3** — Décider Option A (helper partagé) ou Option B (copie alignée) selon complexité des imports
- [ ] **T4** — Si Option A : créer `aureak/apps/web/app/(admin)/children/_avatarHelpers.ts` avec la fonction `avatarBgColor` et l'import `colors` depuis `@aureak/theme`
- [ ] **T5** — Modifier `children/[childId]/page.tsx` : remplacer la PALETTE hardcodée par les 7 tokens, ou importer depuis `_avatarHelpers.ts`
- [ ] **T6** — Si Option A : modifier `children/index.tsx` pour importer `avatarBgColor` depuis `_avatarHelpers.ts` et supprimer la fonction locale
- [ ] **T7** — QA scan : `grep -n "8B5CF6\|3B82F6\|EC4899\|06B6D4\|EF4444" children/[childId]/page.tsx` → zéro résultat
- [ ] **T8** — QA scan try/finally et console guards (aucun nouveau state setter dans cette story — scan de confirmation)
- [ ] **T9** — Playwright : screenshot page `/children/[someId]` vérifier avatars rendus avec couleurs gold/emerald/rouge

---

## Implementation Notes

### Palette de référence (conforme design system — source `children/index.tsx` ligne 100-108)

```typescript
import { colors } from '@aureak/theme'

const COLORS = [
  colors.accent.gold,         // or AUREAK   #C1AC5C
  colors.status.success,      // émeraude    #10B981
  colors.accent.red,          // rouge CTA   #E05252
  colors.status.warning,      // ambre       #F59E0B
  colors.text.muted,          // zinc        #71717A
  colors.dark.surface,        // ardoise     #1A1A1A (dark.surface = '#1A1A1A')
  colors.dark.elevated,       // dark élévé  #242424
]
```

### Remplacement cible dans `children/[childId]/page.tsx` (ligne 330-335)

**Avant** :
```typescript
function avatarBgColor(id: string): string {
  const PALETTE = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
```

**Après (Option B — palette alignée)** :
```typescript
function avatarBgColor(id: string): string {
  const COLORS = [
    colors.accent.gold,
    colors.status.success,
    colors.accent.red,
    colors.status.warning,
    colors.text.muted,
    colors.dark.surface,
    colors.dark.elevated,
  ]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
```

> **Note** : `colors` est déjà importé dans `children/[childId]/page.tsx` — vérifier l'import existant avant d'en ajouter un.

### Option A — Helper partagé

Si choisi, créer `aureak/apps/web/app/(admin)/children/_avatarHelpers.ts` :

```typescript
import { colors } from '@aureak/theme'

const AVATAR_COLORS = [
  colors.accent.gold,
  colors.status.success,
  colors.accent.red,
  colors.status.warning,
  colors.text.muted,
  colors.dark.surface,
  colors.dark.elevated,
]

export function avatarBgColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
```

---

## Files to Modify

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Remplacer PALETTE hardcodée (ligne 331) par tokens `@aureak/theme` |
| `aureak/apps/web/app/(admin)/children/index.tsx` | Si Option A : importer depuis `_avatarHelpers.ts` (sinon : aucun changement) |
| `aureak/apps/web/app/(admin)/children/_avatarHelpers.ts` | Créer uniquement si Option A choisie |

**Aucune migration DB — UI uniquement.**

---

## Dependencies

- **Dépend de** : aucune (correction isolated, UI uniquement)
- **Bloqué par** : rien
- **Impacts** : aucun impact sur API, types, ou logique métier

---

## QA Checklist

```bash
# Vérifier suppression couleurs hardcodées
grep -n "8B5CF6\|3B82F6\|EC4899\|06B6D4" aureak/apps/web/app/(admin)/children/[childId]/page.tsx
# → zéro résultat attendu

# Vérifier EF4444 remplacé par colors.accent.red
grep -n "EF4444" aureak/apps/web/app/(admin)/children/[childId]/page.tsx
# → zéro résultat attendu

# Vérifier import @aureak/theme présent
grep -n "from '@aureak/theme'" aureak/apps/web/app/(admin)/children/[childId]/page.tsx
# → au moins 1 résultat

# Vérifier try/finally — aucun nouveau state setter
grep -n "setLoading(false)\|setSaving(false)\|setCreating(false)" aureak/apps/web/app/(admin)/children/[childId]/page.tsx

# Vérifier console guards
grep -n "console\." aureak/apps/web/app/(admin)/children/[childId]/page.tsx | grep -v "NODE_ENV"
```

---

## Commit

```
fix(design): avatars children/[childId] — palette hardcodée → tokens @aureak/theme
```

Epic : 47 (Design/UX batch)
