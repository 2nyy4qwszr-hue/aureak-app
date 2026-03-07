// Story 12.4 — API quêtes enfant
import { supabase } from '../supabase'

export type QuestStatus = 'active' | 'completed' | 'expired'

export type PlayerQuest = {
  id           : string
  quest_id     : string
  status       : QuestStatus
  current_value: number
  target_value : number
  period_start : string
  period_end   : string
  completed_at : string | null
  quest_definitions: {
    name        : string
    description : string | null
    icon_url    : string | null
    quest_type  : string
  } | null
}

export async function listActiveQuests(childId: string): Promise<{ data: PlayerQuest[]; error: unknown }> {
  const { data, error } = await supabase
    .from('player_quests')
    .select('*, quest_definitions(name, description, icon_url, quest_type)')
    .eq('child_id', childId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  return { data: (data as PlayerQuest[]) ?? [], error }
}

export async function listAllQuests(childId: string): Promise<{ data: PlayerQuest[]; error: unknown }> {
  const { data, error } = await supabase
    .from('player_quests')
    .select('*, quest_definitions(name, description, icon_url, quest_type)')
    .eq('child_id', childId)
    .order('period_start', { ascending: false })
    .limit(30)
  return { data: (data as PlayerQuest[]) ?? [], error }
}
