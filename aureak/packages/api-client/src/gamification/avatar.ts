// Story 12.3 — API avatar & items cosmétiques
import { supabase } from '../supabase'

export type AvatarSlot = 'frame' | 'background' | 'accessory' | 'effect' | 'title'

export type AvatarItem = {
  id              : string
  slug            : string
  name            : string
  category        : AvatarSlot
  unlock_condition: Record<string, unknown>
  asset_url       : string | null
  is_active       : boolean
}

export type PlayerAvatar = {
  child_id           : string
  equipped_frame     : string | null
  equipped_background: string | null
  equipped_accessory : string | null
  equipped_effect    : string | null
  equipped_title     : string | null
}

export type UnlockedItem = {
  item_id       : string
  unlocked_at   : string
  unlock_trigger: string
}

export async function listAvatarItems(): Promise<{ data: AvatarItem[]; error: unknown }> {
  const { data, error } = await supabase
    .from('avatar_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return { data: (data as AvatarItem[]) ?? [], error }
}

export async function getPlayerAvatar(childId: string): Promise<{ data: PlayerAvatar | null; error: unknown }> {
  const { data, error } = await supabase
    .from('player_avatars')
    .select('*')
    .eq('child_id', childId)
    .single()
  return { data: data as PlayerAvatar | null, error }
}

export async function listUnlockedItems(childId: string): Promise<{ data: UnlockedItem[]; error: unknown }> {
  const { data, error } = await supabase
    .from('player_unlocked_items')
    .select('item_id, unlocked_at, unlock_trigger')
    .eq('child_id', childId)
  return { data: (data as UnlockedItem[]) ?? [], error }
}

export async function equipAvatarItem(
  childId: string,
  slot   : AvatarSlot,
  itemId : string,
): Promise<{ error: unknown }> {
  // Vérifier que l'item est débloqué
  const { data: unlocked } = await supabase
    .from('player_unlocked_items')
    .select('item_id')
    .eq('child_id', childId)
    .eq('item_id', itemId)
    .single()

  if (!unlocked) return { error: new Error('Item non débloqué') }

  const updateField = `equipped_${slot}` as const
  const { error } = await supabase
    .from('player_avatars')
    .upsert({
      child_id    : childId,
      [updateField]: itemId,
      updated_at  : new Date().toISOString(),
    })
  return { error }
}
