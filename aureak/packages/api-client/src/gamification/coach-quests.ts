// Story 59-5 — API quêtes hebdomadaires coaches
import { supabase } from '../supabase'
import type { CoachQuest, CoachQuestWithDefinition } from '@aureak/types'

// ── getCoachWeeklyQuests — quêtes actives de la semaine pour un coach ─────────

export async function getCoachWeeklyQuests(
  coachId: string,
): Promise<{ data: CoachQuestWithDefinition[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('coach_quests')
      .select('*, quest_definitions(code, name, description, icon_url, quest_type, xp_reward)')
      .eq('coach_id', coachId)
      .in('status', ['active', 'completed'])
      .gte('period_end', new Date().toISOString().slice(0, 10))
      .order('created_at', { ascending: true })

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] getCoachWeeklyQuests error:', error)
      return { data: [], error }
    }

    const quests: CoachQuestWithDefinition[] = (data ?? []).map(r => ({
      id                : r.id,
      tenantId          : r.tenant_id,
      coachId           : r.coach_id,
      questDefinitionId : r.quest_definition_id,
      status            : r.status,
      currentValue      : r.current_value,
      targetValue       : r.target_value,
      periodStart       : r.period_start,
      periodEnd         : r.period_end,
      completedAt       : r.completed_at ?? null,
      createdAt         : r.created_at,
      questDefinition   : r.quest_definitions ? {
        code       : r.quest_definitions.code,
        name       : r.quest_definitions.name,
        description: r.quest_definitions.description ?? null,
        iconUrl    : r.quest_definitions.icon_url    ?? null,
        questType  : r.quest_definitions.quest_type,
        xpReward   : r.quest_definitions.xp_reward,
      } : null,
    }))

    return { data: quests, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] getCoachWeeklyQuests exception:', err)
    return { data: [], error: err }
  }
}

// ── assignCoachWeeklyQuests — déclenche l'assignation des quêtes ──────────────

export async function assignCoachWeeklyQuests(
  coachId: string,
): Promise<{ error: unknown }> {
  try {
    const { error } = await supabase.rpc('assign_weekly_coach_quests', {
      p_coach_id: coachId,
    })

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] assignCoachWeeklyQuests error:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] assignCoachWeeklyQuests exception:', err)
    return { error: err }
  }
}

// ── updateCoachQuestProgress — incrémente la progression d'une quête ──────────

export async function updateCoachQuestProgress(
  questId: string,
  delta: number,
): Promise<{ data: CoachQuest | null; error: unknown }> {
  try {
    // Récupérer la valeur actuelle
    const { data: current, error: fetchErr } = await supabase
      .from('coach_quests')
      .select('*')
      .eq('id', questId)
      .single()

    if (fetchErr || !current) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] updateCoachQuestProgress fetch error:', fetchErr)
      return { data: null, error: fetchErr }
    }

    const newValue      = current.current_value + delta
    const isCompleted   = newValue >= current.target_value
    const updatedStatus = isCompleted ? 'completed' : current.status

    const { data: updated, error: updateErr } = await supabase
      .from('coach_quests')
      .update({
        current_value: newValue,
        status       : updatedStatus,
        completed_at : isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', questId)
      .select()
      .single()

    if (updateErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] updateCoachQuestProgress update error:', updateErr)
      return { data: null, error: updateErr }
    }

    const quest: CoachQuest = {
      id               : updated.id,
      tenantId         : updated.tenant_id,
      coachId          : updated.coach_id,
      questDefinitionId: updated.quest_definition_id,
      status           : updated.status,
      currentValue     : updated.current_value,
      targetValue      : updated.target_value,
      periodStart      : updated.period_start,
      periodEnd        : updated.period_end,
      completedAt      : updated.completed_at ?? null,
      createdAt        : updated.created_at,
    }

    return { data: quest, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-quests] updateCoachQuestProgress exception:', err)
    return { data: null, error: err }
  }
}
