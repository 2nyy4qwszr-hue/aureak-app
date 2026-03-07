// @aureak/api-client — Gestion des clubs (partenaires & communs)
// Story 2.5 — Accès clubs filtré par RLS via auth.uid()

import { supabase } from './supabase'
import type { Club } from '@aureak/types'

// ============================================================
// Types
// ============================================================

export type CreateClubParams = {
  name       : string
  email      : string
  accessLevel: 'partner' | 'common'
  tenantId   : string
  createdBy  : string  // user_id de l'admin qui crée le club
}

export type UpdateClubAccessLevelParams = {
  clubId     : string
  accessLevel: 'partner' | 'common'
  tenantId   : string
  updatedBy  : string
}

// ============================================================
// CRUD
// ============================================================

/**
 * Crée un compte club : invitation Auth + profil + enregistrement clubs.
 * IMPORTANT : inviteUserByEmail NE crée PAS le profil — créé manuellement ici.
 * Le Custom Access Token Hook injecte role='club' au premier login.
 */
export async function createClub(
  params: CreateClubParams,
): Promise<{ data: Club | null; error: unknown }> {
  // 1. Inviter l'utilisateur (envoie le magic link)
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    params.email,
    { data: { role: 'club', tenant_id: params.tenantId } },
  )
  if (authError || !authData?.user) return { data: null, error: authError }

  const userId = authData.user.id

  // 2. Créer le profil (status = 'pending' jusqu'à activation du lien)
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id  : userId,
    tenant_id: params.tenantId,
    user_role: 'club',
    status   : 'pending',
  })
  if (profileError) return { data: null, error: profileError }

  // 3. Créer l'enregistrement club
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .insert({
      user_id          : userId,
      tenant_id        : params.tenantId,
      name             : params.name,
      club_access_level: params.accessLevel,
    })
    .select()
    .single()

  if (clubError || !club) return { data: null, error: clubError }

  // 4. Audit trail
  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.createdBy,
    entity_type: 'club',
    entity_id  : userId,
    action     : 'club_created',
    metadata   : {
      club_name   : params.name,
      access_level: params.accessLevel,
      email       : params.email,
    },
  })

  return {
    data: {
      userId         : club.user_id,
      tenantId       : club.tenant_id,
      name           : club.name,
      clubAccessLevel: club.club_access_level,
      deletedAt      : club.deleted_at ?? null,
      createdAt      : club.created_at,
    },
    error: null,
  }
}

/**
 * Liste tous les clubs actifs du tenant courant.
 */
export async function listClubs() {
  return supabase
    .from('clubs')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })
}

/**
 * Lie un enfant à un club. Journalise dans audit_logs.
 */
export async function linkChildToClub(
  params: { clubId: string; childId: string; tenantId: string; linkedBy: string },
): Promise<{ error: unknown }> {
  const { error } = await supabase.from('club_child_links').insert({
    club_id : params.clubId,
    child_id: params.childId,
  })
  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.linkedBy,
    entity_type: 'club_child_link',
    entity_id  : params.childId,
    action     : 'child_linked_to_club',
    metadata   : { club_id: params.clubId, child_id: params.childId },
  })

  return { error: null }
}

/**
 * Supprime le lien enfant <-> club.
 * DELETE physique autorisé (table de liaison — pas de soft-delete).
 * Journalise dans audit_logs pour traçabilité.
 */
export async function unlinkChildFromClub(
  params: { clubId: string; childId: string; tenantId: string; unlinkedBy: string },
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('club_child_links')
    .delete()
    .eq('club_id', params.clubId)
    .eq('child_id', params.childId)

  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.unlinkedBy,
    entity_type: 'club_child_link',
    entity_id  : params.childId,
    action     : 'child_unlinked_from_club',
    metadata   : { club_id: params.clubId, child_id: params.childId },
  })

  return { error: null }
}

/**
 * Met à jour le niveau d'accès d'un club.
 * Effectif immédiatement via RLS (lu depuis clubs.club_access_level) — AC4.
 */
export async function updateClubAccessLevel(
  params: UpdateClubAccessLevelParams,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('clubs')
    .update({ club_access_level: params.accessLevel })
    .eq('user_id', params.clubId)

  if (error) return { error }

  await supabase.from('audit_logs').insert({
    tenant_id  : params.tenantId,
    user_id    : params.updatedBy,
    entity_type: 'club',
    entity_id  : params.clubId,
    action     : 'club_access_level_updated',
    metadata   : { new_access_level: params.accessLevel },
  })

  return { error: null }
}
