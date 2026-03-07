// @aureak/api-client — Accès temporaire cross-implantation (coach_access_grants)
// Story 2.3 — Accès temporaire cross-implantation coach

import { supabase } from './supabase'
import type { CoachAccessGrant } from '@aureak/types'

// ============================================================
// Types
// ============================================================

export type CreateGrantParams = {
  coachId       : string
  implantationId: string
  expiresAt     : string  // ISO 8601 — doit être dans le futur
  tenantId      : string
  grantedBy     : string
}

// ============================================================
// CRUD
// ============================================================

/**
 * Crée un grant d'accès temporaire pour un coach sur une implantation tierce.
 * Journalise dans audit_logs (AC4 — action = 'grant_created').
 */
export async function createGrant(
  params: CreateGrantParams,
): Promise<{ data: CoachAccessGrant | null; error: unknown }> {
  const { data: grant, error } = await supabase
    .from('coach_access_grants')
    .insert({
      coach_id       : params.coachId,
      implantation_id: params.implantationId,
      expires_at     : params.expiresAt,
      tenant_id      : params.tenantId,
      granted_by     : params.grantedBy,
    })
    .select()
    .single()

  if (error || !grant) return { data: null, error }

  // Audit trail obligatoire (AC4)
  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.grantedBy,
    entity_type: 'coach_access_grant',
    entity_id  : grant.id,
    action     : 'grant_created',
    metadata   : {
      coach_id        : params.coachId,
      implantation_id : params.implantationId,
      granted_by      : params.grantedBy,
      expires_at      : params.expiresAt,
    },
  })

  return {
    data: {
      id            : grant.id,
      tenantId      : grant.tenant_id,
      coachId       : grant.coach_id,
      implantationId: grant.implantation_id,
      grantedBy     : grant.granted_by,
      expiresAt     : grant.expires_at,
      revokedAt     : grant.revoked_at ?? null,
      createdAt     : grant.created_at,
    },
    error: null,
  }
}

/**
 * Liste les grants actifs (non expirés et non révoqués).
 * Filtre optionnel par implantation.
 */
export async function listActiveGrants(implantationId?: string) {
  let query = supabase
    .from('coach_access_grants')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .is('revoked_at', null)
    .order('expires_at', { ascending: true })

  if (implantationId) {
    query = query.eq('implantation_id', implantationId)
  }

  return query
}

/**
 * Révoque un grant manuellement.
 * Journalise dans audit_logs (AC5 — action = 'grant_revoked').
 */
export async function revokeGrant(
  grantId: string,
  revokedBy: string,
): Promise<{ error: unknown }> {
  // Lire le grant avant révocation pour l'audit trail
  const { data: grant } = await supabase
    .from('coach_access_grants')
    .select('tenant_id, coach_id, implantation_id')
    .eq('id', grantId)
    .single()

  const { error } = await supabase
    .from('coach_access_grants')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', grantId)
    .is('revoked_at', null)  // idempotent — ne révoque pas deux fois

  if (error) return { error }

  // Audit trail (AC5)
  if (grant) {
    await supabase.from('audit_logs').insert({
      tenant_id  : grant.tenant_id,
      user_id    : revokedBy,
      entity_type: 'coach_access_grant',
      entity_id  : grantId,
      action     : 'grant_revoked',
      metadata   : {
        coach_id        : grant.coach_id,
        implantation_id : grant.implantation_id,
        revoked_by      : revokedBy,
      },
    })
  }

  return { error: null }
}
