# Story 12.3 : Avatar System — Équipement & Items Débloquables

Status: ready-for-dev

## Story

En tant qu'Enfant,
Je veux personnaliser mon avatar en équipant les items que j'ai débloqués grâce à ma progression pédagogique,
Afin de sentir que mon investissement dans l'apprentissage se traduit visuellement, de façon unique et méritée.

## Acceptance Criteria

**AC1 — Galerie items**
- **When** l'enfant ouvre la section "Avatar"
- **Then** son avatar actuel est affiché avec les 5 slots (frame, background, accessory, effect, title)
- **And** galerie : débloqués = équipables, verrouillés = grisés avec condition de déblocage
- **And** jamais de prix monétaire — uniquement conditions d'apprentissage

**AC2 — Équipement immédiat**
- **And** équipement d'un item = UPSERT `player_avatars` — pas de confirmation requise

**AC3 — Animation déblocage**
- **And** déblocage → animation révélation + notification in-app "Nouvel item débloqué : [nom]"

**AC4 — Score total**
- **And** `player_progress.total_points` affiché (cache)

**AC5 — Aucun achat**
- **And** `avatar_items` n'a aucun champ `price` ou `is_purchasable`

**AC6 — RLS**
- **And** enfant ne peut équiper que ses propres items débloqués

## Tasks / Subtasks

- [ ] Task 1 — Mutation `equipAvatarItem(childId, slot, itemId)` (AC: #2)
  - [ ] 1.1 UPSERT `player_avatars` via `@aureak/api-client`
  - [ ] 1.2 Vérifier item présent dans `player_unlocked_items` avant équipement

- [ ] Task 2 — Écran avatar mobile (AC: #1–#4)
  - [ ] 2.1 Créer `apps/mobile/app/(child)/avatar/index.tsx`
  - [ ] 2.2 Afficher avatar avec slots visuels
  - [ ] 2.3 Grille items : débloqués vs verrouillés (avec hint de condition)
  - [ ] 2.4 Animation déblocage (expo-reanimated ou expo-confetti)

- [ ] Task 3 — Notification in-app (AC: #3)
  - [ ] 3.1 Toast/banner "Nouvel item débloqué" déclenché après `check_and_award_items`
  - [ ] 3.2 Réagir aux changements `player_unlocked_items` via Supabase Realtime

## Dev Notes

### API `equipAvatarItem`

```typescript
// packages/api-client/src/avatar/equipAvatarItem.ts
export async function equipAvatarItem(
  childId: string,
  slot: 'frame' | 'background' | 'accessory' | 'effect' | 'title',
  itemId: string
) {
  // Vérifier que l'item est débloqué
  const { data: unlocked } = await supabase
    .from('player_unlocked_items')
    .select('item_id')
    .eq('child_id', childId)
    .eq('item_id', itemId)
    .single()

  if (!unlocked) throw new Error('Item not unlocked')

  const updateField = `equipped_${slot}` as const
  await supabase
    .from('player_avatars')
    .upsert({ child_id: childId, [updateField]: itemId, updated_at: new Date().toISOString() })
}
```

### Realtime pour déblocages

```typescript
// Écouter les nouveaux items débloqués via Supabase Realtime
const channel = supabase
  .channel('avatar-unlocks')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'player_unlocked_items',
    filter: `child_id=eq.${childId}`
  }, (payload) => {
    // Déclencher animation + notification in-app
    showUnlockAnimation(payload.new.item_id)
  })
  .subscribe()
```

### Condition de déblocage affichée

```typescript
// Traduire unlock_condition JSONB en message lisible
function getUnlockHint(condition: { type: string; [key: string]: any }): string {
  switch (condition.type) {
    case 'badge':          return `Obtiens le badge "${condition.badge_code}"`
    case 'total_points':   return `Atteins ${condition.min_points} points`
    case 'themes_acquired': return `Maîtrise ${condition.count} thèmes`
    default: return 'Condition inconnue'
  }
}
```

### Dépendances

- **Prérequis** : Story 12.1 (`avatar_items`, `player_avatars`, `player_unlocked_items`) + Story 12.2 (`check_and_award_items` pour déblocages)

### References
- [Source: epics.md#Story-12.3] — lignes 2725–2747

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
