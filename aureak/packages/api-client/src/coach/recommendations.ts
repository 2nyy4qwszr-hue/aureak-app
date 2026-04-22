// Epic 90 — Story 90.2 : Recommandation coach → prospect entraîneur
// Le coach connecté insère directement dans coach_prospects via la policy RLS
// `coach_prospects_insert` (créée en story 90.1) qui exige
// `current_user_role() = 'coach' AND recommended_by_coach_id = auth.uid()`.
import { supabase } from '../supabase'
import type { CoachProspect, CoachProspectListRow } from '@aureak/types'

// ── Types côté coach ──────────────────────────────────────────────────────

export type RecommendCoachProspectParams = {
  firstName    : string
  lastName     : string
  email?       : string
  phone?       : string
  city         : string
  specialite   : string
  /** Contexte / relation expliquant la recommandation. Stocké dans `notes`. */
  contextNote  : string
}

// ── Mapping snake → camel (subset CoachProspect) ──────────────────────────

function mapProspect(r: Record<string, unknown>): CoachProspect {
  return {
    id                   : r.id as string,
    tenantId             : r.tenant_id as string,
    firstName            : r.first_name as string,
    lastName             : r.last_name as string,
    email                : (r.email as string | null) ?? null,
    phone                : (r.phone as string | null) ?? null,
    city                 : (r.city as string | null) ?? null,
    status               : r.status as CoachProspect['status'],
    currentClub          : (r.current_club as string | null) ?? null,
    specialite           : (r.specialite as string | null) ?? null,
    assignedCommercialId : (r.assigned_commercial_id as string | null) ?? null,
    recommendedByCoachId : (r.recommended_by_coach_id as string | null) ?? null,
    source               : (r.source as string | null) ?? null,
    notes                : (r.notes as string | null) ?? null,
    createdAt            : r.created_at as string,
    updatedAt            : r.updated_at as string,
    deletedAt            : (r.deleted_at as string | null) ?? null,
  }
}

async function resolveTenantId(): Promise<{ userId: string; tenantId: string }> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) throw new Error('Non authentifié')

  const jwtTenant = (user.app_metadata?.tenant_id as string | undefined)
    ?? (user.user_metadata?.tenant_id as string | undefined)
  if (jwtTenant) return { userId: user.id, tenantId: jwtTenant }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile?.tenant_id) {
    throw new Error('tenant_id introuvable (ni JWT, ni profiles)')
  }
  return { userId: user.id, tenantId: profile.tenant_id as string }
}

// ── Mutations coach ───────────────────────────────────────────────────────

export async function recommendCoachProspect(
  params: RecommendCoachProspectParams,
): Promise<CoachProspect> {
  const { userId, tenantId } = await resolveTenantId()

  const payload: Record<string, unknown> = {
    tenant_id                : tenantId,
    first_name               : params.firstName,
    last_name                : params.lastName,
    email                    : params.email ?? null,
    phone                    : params.phone ?? null,
    city                     : params.city,
    status                   : 'identifie',
    current_club             : null,
    specialite               : params.specialite,
    assigned_commercial_id   : null,
    recommended_by_coach_id  : userId,
    source                   : 'recommandation_coach',
    notes                    : params.contextNote,
  }

  const { data, error } = await supabase
    .from('coach_prospects')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach/recommendations] recommend error:', error)
    throw error
  }
  const prospect = mapProspect(data as Record<string, unknown>)

  // AC #5 — Notification in-app aux admins du tenant (silent fail : ne bloque pas la création)
  try {
    const [coachProfileRes, adminsRes] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('user_id').eq('tenant_id', tenantId).eq('user_role', 'admin'),
    ])

    const coachName = (coachProfileRes.data as { display_name: string | null } | null)?.display_name ?? 'Un coach'
    const admins    = (adminsRes.data as { user_id: string }[] | null) ?? []

    if (admins.length > 0) {
      const notifs = admins.map(a => ({
        tenant_id: tenantId,
        user_id  : a.user_id,
        title    : 'Nouvelle recommandation entraîneur',
        body     : `${coachName} a recommandé ${prospect.firstName} ${prospect.lastName}.`,
        type     : 'info',
        payload  : {
          kind                : 'coach_recommendation',
          coachProspectId     : prospect.id,
          coachName,
          prospectFirstName   : prospect.firstName,
          prospectLastName    : prospect.lastName,
          link                : `/developpement/prospection/entraineurs/${prospect.id}`,
        },
      }))
      await supabase.from('inapp_notifications').insert(notifs)
    }
  } catch (notifErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach/recommendations] notify error (non-fatal):', notifErr)
  }

  return prospect
}

// ── Liste coach : "Mes recommandations" ───────────────────────────────────

export async function listMyRecommendations(): Promise<CoachProspectListRow[]> {
  const { userId } = await resolveTenantId()

  const { data, error } = await supabase
    .from('coach_prospects')
    .select('*')
    .eq('recommended_by_coach_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach/recommendations] list error:', error)
    return []
  }

  return ((data ?? []) as Record<string, unknown>[]).map(r => {
    const base = mapProspect(r)
    return {
      ...base,
      assignedDisplayName      : null,
      recommendedByDisplayName : null,
      lastActionAt             : base.updatedAt,
    }
  })
}
