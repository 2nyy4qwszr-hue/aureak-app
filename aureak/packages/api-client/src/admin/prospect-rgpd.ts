// @aureak/api-client — Story 89.3 : Visibilité conditionnelle RGPD des coordonnées
// parent sur prospects gardiens.
//
// Ce module couvre :
//   - Lecture masquée/démasquée via RPC `get_child_directory_rgpd[_list]` (écrit un log).
//   - Gestion des grants actifs (liste, révocation).
//   - Cycle de vie des demandes d'accès (request → resolve).
//   - Consultation du log immuable d'accès (admin uniquement).
//
// Règle RLS : toutes les lectures/écritures sont tenant-isolées côté DB.

import { supabase } from '../supabase'
import type {
  ChildDirectoryEntry,
  ChildDirectoryEntryRgpd,
  FootballAgeCategory,
  ProspectAccessGrant,
  ProspectAccessGrantWithMeta,
  ProspectAccessRequest,
  ProspectAccessRequestWithMeta,
  ProspectRgpdAccessLog,
  ProspectRgpdAccessLogWithMeta,
  ProspectStatus,
  RgpdGrantReason,
  RgpdRequestStatus,
  TrialOutcome,
} from '@aureak/types'

// ── Helpers mapping snake → camel ─────────────────────────────────────────────

function toChildEntryBase(row: Record<string, unknown>): ChildDirectoryEntry {
  return {
    id             : row.id              as string,
    tenantId       : row.tenant_id       as string,
    displayName    : row.display_name    as string,
    nom            : (row.nom            as string | null) ?? null,
    prenom         : (row.prenom         as string | null) ?? null,
    birthDate      : (row.birth_date     as string | null) ?? null,
    email          : (row.email          as string | null) ?? null,
    tel            : (row.tel            as string | null) ?? null,
    statut         : (row.statut         as string | null) ?? null,
    currentClub    : (row.current_club   as string | null) ?? null,
    niveauClub     : (row.niveau_club    as string | null) ?? null,
    clubDirectoryId: (row.club_directory_id as string | null) ?? null,
    adresseRue     : (row.adresse_rue    as string | null) ?? null,
    codePostal     : (row.code_postal    as string | null) ?? null,
    localite       : (row.localite       as string | null) ?? null,
    parent1Nom     : (row.parent1_nom    as string | null) ?? null,
    parent1Tel     : (row.parent1_tel    as string | null) ?? null,
    parent1Email   : (row.parent1_email  as string | null) ?? null,
    parent2Nom     : (row.parent2_nom    as string | null) ?? null,
    parent2Tel     : (row.parent2_tel    as string | null) ?? null,
    parent2Email   : (row.parent2_email  as string | null) ?? null,
    actif          : row.actif           as boolean,
    notesInternes  : (row.notes_internes as string | null) ?? null,
    contactDeclined: (row.contact_declined as boolean | null) ?? false,
    ageCategory    : (row.age_category     as FootballAgeCategory | null) ?? null,
    playerType     : (row.player_type      as 'youth' | 'senior' | null) ?? null,
    youthLevel     : (row.youth_level      as string | null) ?? null,
    seniorDivision : (row.senior_division  as string | null) ?? null,
    teamLevelStars : (row.team_level_stars as number | null) ?? null,
    prospectStatus : (row.prospect_status  as ProspectStatus | null) ?? null,
    trialUsed      : (row.trial_used       as boolean | null) ?? false,
    trialDate      : (row.trial_date       as string | null) ?? null,
    trialOutcome   : (row.trial_outcome    as TrialOutcome | null) ?? null,
    notionPageId   : (row.notion_page_id   as string | null) ?? null,
    notionSyncedAt : (row.notion_synced_at as string | null) ?? null,
    createdBy      : (row.created_by       as string | null) ?? null,
    deletedAt      : (row.deleted_at       as string | null) ?? null,
    createdAt      : row.created_at        as string,
    updatedAt      : row.updated_at        as string,
  }
}

function toEntryRgpd(row: Record<string, unknown>): ChildDirectoryEntryRgpd {
  return {
    ...toChildEntryBase(row),
    rgpdMasked   : (row.rgpd_masked     as boolean | null) ?? false,
    rgpdAccessVia: (row.rgpd_access_via as RgpdGrantReason | null) ?? null,
  }
}

function toGrant(row: Record<string, unknown>): ProspectAccessGrant {
  return {
    id        : row.id         as string,
    tenantId  : row.tenant_id  as string,
    childId   : row.child_id   as string,
    grantedTo : row.granted_to as string,
    grantedBy : (row.granted_by as string | null) ?? null,
    reason    : row.reason     as RgpdGrantReason,
    grantedAt : row.granted_at as string,
    deletedAt : (row.deleted_at as string | null) ?? null,
    createdAt : row.created_at as string,
    updatedAt : row.updated_at as string,
  }
}

function toRequest(row: Record<string, unknown>): ProspectAccessRequest {
  return {
    id           : row.id             as string,
    tenantId     : row.tenant_id      as string,
    childId      : row.child_id       as string,
    requesterId  : row.requester_id   as string,
    reason       : row.reason         as string,
    status       : row.status         as RgpdRequestStatus,
    requestedAt  : row.requested_at   as string,
    resolvedAt   : (row.resolved_at   as string | null) ?? null,
    resolvedBy   : (row.resolved_by   as string | null) ?? null,
    resolvedNote : (row.resolved_note as string | null) ?? null,
    deletedAt    : (row.deleted_at    as string | null) ?? null,
    createdAt    : row.created_at     as string,
    updatedAt    : row.updated_at     as string,
  }
}

function toLog(row: Record<string, unknown>): ProspectRgpdAccessLog {
  return {
    id         : row.id          as string,
    tenantId   : row.tenant_id   as string,
    childId    : row.child_id    as string,
    accessorId : row.accessor_id as string,
    grantedVia : row.granted_via as RgpdGrantReason,
    accessedAt : row.accessed_at as string,
  }
}

// ── Lecture RGPD (vue + log) ──────────────────────────────────────────────────

/**
 * Retourne la fiche child_directory d'un prospect avec coordonnées masquées/démasquées
 * selon les grants RGPD de l'utilisateur courant. Écrit une ligne dans
 * prospect_rgpd_access_log si l'accès est démasqué (preuve RGPD atomique).
 */
export async function getChildDirectoryRgpd(
  childId: string,
): Promise<ChildDirectoryEntryRgpd | null> {
  const { data, error } = await supabase.rpc('get_child_directory_rgpd', { p_child_id: childId })
  if (error) throw error
  if (!data || (data as unknown[]).length === 0) return null
  return toEntryRgpd((data as Record<string, unknown>[])[0])
}

/**
 * Version batch — évite N+1 sur les listings. Retourne un tableau dans l'ordre
 * rendu par la DB (pas garanti == ordre d'entrée, utiliser un Map côté client si besoin).
 */
export async function listChildDirectoryRgpd(
  childIds: string[],
): Promise<ChildDirectoryEntryRgpd[]> {
  if (childIds.length === 0) return []
  const { data, error } = await supabase.rpc('get_child_directory_rgpd_list', { p_child_ids: childIds })
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map(toEntryRgpd)
}

// ── Demandes d'accès RGPD ─────────────────────────────────────────────────────

export type CreateAccessRequestParams = {
  childId : string
  reason  : string
}

/**
 * Crée une demande d'accès RGPD pour ce prospect. Déclenche ensuite la notification
 * email (Edge Function notify-rgpd-access-request) vers l'admin + créateur initial.
 */
export async function requestRgpdAccess(
  params: CreateAccessRequestParams,
): Promise<ProspectAccessRequest> {
  const trimmed = params.reason.trim()
  if (trimmed.length < 1 || trimmed.length > 500) {
    throw new Error('Le motif doit contenir entre 1 et 500 caractères.')
  }

  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) throw new Error('Utilisateur non authentifié')

  // tenant_id côté insert (RLS vérifie = current_tenant_id()).
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', uid)
    .single()
  if (profileErr) throw profileErr
  const tenantId = profile?.tenant_id as string | undefined
  if (!tenantId) throw new Error('Tenant introuvable pour cet utilisateur')

  const { data, error } = await supabase
    .from('prospect_access_requests')
    .insert({
      tenant_id   : tenantId,
      child_id    : params.childId,
      requester_id: uid,
      reason      : trimmed,
    })
    .select()
    .single()
  if (error) throw error

  // Notifier admin + créateur initial (best-effort — ne pas bloquer si l'Edge Fn échoue).
  try {
    await supabase.functions.invoke('notify-rgpd-access-request', {
      body: { requestId: (data as Record<string, unknown>).id as string },
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[prospect-rgpd] notify-rgpd-access-request failed:', err)
    }
  }

  return toRequest(data as Record<string, unknown>)
}

export type ListAccessRequestsOpts = {
  status? : RgpdRequestStatus
}

/**
 * Liste les demandes d'accès RGPD du tenant.
 * Admin voit tout ; les autres utilisateurs voient uniquement leurs propres demandes (RLS).
 * Enrichit avec les noms requester + prospect pour l'affichage.
 */
export async function listRgpdAccessRequests(
  opts: ListAccessRequestsOpts = {},
): Promise<ProspectAccessRequestWithMeta[]> {
  let q = supabase
    .from('prospect_access_requests')
    .select('*, requester:profiles!requester_id(display_name,email), child:child_directory!child_id(display_name)')
    .is('deleted_at', null)
    .order('requested_at', { ascending: false })

  if (opts.status) q = q.eq('status', opts.status)

  const { data, error } = await q
  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map(row => {
    const requester = (row.requester as Record<string, unknown> | null) ?? null
    const child     = (row.child     as Record<string, unknown> | null) ?? null
    return {
      ...toRequest(row),
      requesterName  : (requester?.display_name as string | null) ?? null,
      requesterEmail : (requester?.email        as string | null) ?? null,
      childName      : (child?.display_name     as string) ?? '—',
    }
  })
}

/**
 * Résout une demande d'accès (approuve ou rejette). Si approuvée, crée le grant
 * correspondant avec reason='request_approved'. Déclenche la notification email
 * (notify-rgpd-access-resolved) vers le demandeur.
 */
export async function resolveRgpdAccessRequest(
  requestId: string,
  decision : 'approved' | 'rejected',
  note?    : string,
): Promise<ProspectAccessRequest> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) throw new Error('Utilisateur non authentifié')

  const { data, error } = await supabase
    .from('prospect_access_requests')
    .update({
      status       : decision,
      resolved_at  : new Date().toISOString(),
      resolved_by  : uid,
      resolved_note: note ?? null,
    })
    .eq('id', requestId)
    .select()
    .single()
  if (error) throw error

  const request = toRequest(data as Record<string, unknown>)

  if (decision === 'approved') {
    // Crée le grant (ON CONFLICT DO NOTHING géré par l'index unique partiel côté DB).
    const { error: grantErr } = await supabase
      .from('prospect_access_grants')
      .insert({
        tenant_id  : request.tenantId,
        child_id   : request.childId,
        granted_to : request.requesterId,
        granted_by : uid,
        reason     : 'request_approved',
      })
    if (grantErr && grantErr.code !== '23505') {
      // 23505 = unique_violation = grant déjà actif, on ignore
      throw grantErr
    }
  }

  try {
    await supabase.functions.invoke('notify-rgpd-access-resolved', {
      body: { requestId },
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[prospect-rgpd] notify-rgpd-access-resolved failed:', err)
    }
  }

  return request
}

/**
 * Retourne true si l'utilisateur courant a déjà une demande pending pour ce child
 * (utilisé pour désactiver le bouton "Demander l'accès").
 */
export async function hasPendingRgpdRequest(childId: string): Promise<boolean> {
  const { data: userRes } = await supabase.auth.getUser()
  const uid = userRes?.user?.id
  if (!uid) return false

  const { count, error } = await supabase
    .from('prospect_access_requests')
    .select('id', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('requester_id', uid)
    .eq('status', 'pending')
    .is('deleted_at', null)
  if (error) throw error
  return (count ?? 0) > 0
}

// ── Grants actifs ─────────────────────────────────────────────────────────────

/**
 * Liste les grants actifs (deleted_at IS NULL) du tenant, optionnellement filtré
 * par childId. Enrichit avec display_name du bénéficiaire + du prospect.
 */
export async function listRgpdGrants(
  childId?: string,
): Promise<ProspectAccessGrantWithMeta[]> {
  let q = supabase
    .from('prospect_access_grants')
    .select('*, grantee:profiles!granted_to(display_name,email), child:child_directory!child_id(display_name)')
    .is('deleted_at', null)
    .order('granted_at', { ascending: false })

  if (childId) q = q.eq('child_id', childId)

  const { data, error } = await q
  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map(row => {
    const grantee = (row.grantee as Record<string, unknown> | null) ?? null
    const child   = (row.child   as Record<string, unknown> | null) ?? null
    return {
      ...toGrant(row),
      grantedToName  : (grantee?.display_name as string | null) ?? null,
      grantedToEmail : (grantee?.email        as string | null) ?? null,
      childName      : (child?.display_name   as string) ?? '—',
    }
  })
}

/**
 * Révoque un grant (soft-delete via deleted_at = now()).
 * Admin uniquement (RLS).
 * Les grants auto ('creator'|'invitation'|'evaluation') peuvent être réinstaurés
 * automatiquement si l'événement déclencheur se répète (triggers idempotents).
 */
export async function revokeRgpdGrant(grantId: string): Promise<void> {
  const { error } = await supabase
    .from('prospect_access_grants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', grantId)
  if (error) throw error
}

// ── Audit log (admin uniquement) ──────────────────────────────────────────────

/**
 * Liste les lignes du log immuable des accès démasqués.
 * Admin uniquement (RLS). Enrichit avec display_name de l'accesseur + prospect.
 */
export async function listRgpdAccessLog(
  childId?: string,
): Promise<ProspectRgpdAccessLogWithMeta[]> {
  let q = supabase
    .from('prospect_rgpd_access_log')
    .select('*, accessor:profiles!accessor_id(display_name,email), child:child_directory!child_id(display_name)')
    .order('accessed_at', { ascending: false })
    .limit(200)

  if (childId) q = q.eq('child_id', childId)

  const { data, error } = await q
  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map(row => {
    const accessor = (row.accessor as Record<string, unknown> | null) ?? null
    const child    = (row.child    as Record<string, unknown> | null) ?? null
    return {
      ...toLog(row),
      accessorName  : (accessor?.display_name as string | null) ?? null,
      accessorEmail : (accessor?.email        as string | null) ?? null,
      childName     : (child?.display_name    as string) ?? '—',
    }
  })
}
