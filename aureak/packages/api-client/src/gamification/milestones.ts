// Story 59-7 — API Milestones académie
// Gestion des jalons collectifs (SESSION_100, PLAYER_500, etc.)
import { supabase } from '../supabase'
import type { AcademyMilestone } from '@aureak/types'

export type { AcademyMilestone }

/** getUnceledbratedMilestones — milestones atteints mais pas encore célébrés */
export async function getUnceledbratedMilestones(): Promise<{ data: AcademyMilestone[]; error: unknown }> {
  try {
    const { data, error } = await supabase
      .from('academy_milestones')
      .select('*')
      .not('reached_at', 'is', null)
      .eq('celebrated', false)
      .order('reached_at', { ascending: true })
      .limit(10)

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] getUnceledbratedMilestones error:', error)
      return { data: [], error }
    }

    const milestones: AcademyMilestone[] = (data ?? []).map(r => ({
      id             : r.id,
      tenantId       : r.tenant_id,
      milestoneCode  : r.milestone_code,
      milestoneLabel : r.milestone_label,
      thresholdValue : r.threshold_value,
      currentValue   : r.current_value,
      reachedAt      : r.reached_at,
      celebrated     : r.celebrated,
      createdAt      : r.created_at,
    }))

    return { data: milestones, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] getUnceledbratedMilestones exception:', err)
    return { data: [], error: err }
  }
}

/** checkAcademyMilestones — appelle la RPC SQL check_academy_milestones() */
export async function checkAcademyMilestones(): Promise<{ data: AcademyMilestone[]; error: unknown }> {
  try {
    // Récupérer le tenant_id depuis le profil connecté
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'No user' }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] checkAcademyMilestones profile error:', profileErr)
      return { data: [], error: profileErr }
    }

    const { data, error } = await supabase.rpc('check_academy_milestones', {
      p_tenant_id: profile.tenant_id,
    })

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] checkAcademyMilestones rpc error:', error)
      return { data: [], error }
    }

    // data est un JSONB array
    const rows = (data as unknown[]) ?? []
    const milestones: AcademyMilestone[] = rows.map((r: unknown) => {
      const m = r as Record<string, unknown>
      return {
        id             : m['id'] as string,
        tenantId       : profile.tenant_id,
        milestoneCode  : m['milestone_code'] as string,
        milestoneLabel : m['milestone_label'] as string,
        thresholdValue : m['threshold_value'] as number,
        currentValue   : m['current_value'] as number,
        reachedAt      : m['reached_at'] as string | null ?? null,
        celebrated     : m['celebrated'] as boolean,
        createdAt      : new Date().toISOString(),
      }
    })

    return { data: milestones, error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] checkAcademyMilestones exception:', err)
    return { data: [], error: err }
  }
}

/** markMilestoneCelebrated — marque un milestone comme célébré (celebrated = true) */
export async function markMilestoneCelebrated(id: string): Promise<{ error: unknown }> {
  try {
    const { error } = await supabase
      .from('academy_milestones')
      .update({ celebrated: true })
      .eq('id', id)

    if (error) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] markMilestoneCelebrated error:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[milestones] markMilestoneCelebrated exception:', err)
    return { error: err }
  }
}
