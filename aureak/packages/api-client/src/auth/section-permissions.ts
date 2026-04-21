// @aureak/api-client — Story 86-3
// Permissions granulaires par rôle × section + overrides individuels par utilisateur.
// RÈGLE : seul ce fichier accède à supabase.from('section_permissions') et
// supabase.from('user_section_overrides').
//
// Matrice par défaut (`section_permissions`) = config globale (pas de tenant).
// Overrides (`user_section_overrides`) = par profil, tenant-scoped via RLS.
// Composition : getEffectivePermissions combine les deux → Record<SectionKey, boolean>.

import { supabase } from '../supabase'
import { isAbortError } from '../utils/is-abort-error'
import type {
  SectionKey,
  UserRole,
  SectionPermissionRow,
  UserSectionOverrideRow,
  EffectivePermissions,
} from '@aureak/types'
import { SECTION_KEYS } from '@aureak/types'

// Story 87.3 — Historique des overrides (actifs + soft-deleted).
export type UserSectionOverrideHistoryEntry = {
  sectionKey: SectionKey
  granted   : boolean
  grantedAt : string
  grantedBy : string | null
  deletedAt : string | null
}

// =============================================================================
// 1. Défauts par rôle
// =============================================================================

/**
 * listDefaultPermissions — toutes les permissions par défaut (80 lignes : 8 rôles × 10 sections).
 * Accessible à tout utilisateur authentifié (besoin sidebar dynamique).
 */
export async function listDefaultPermissions(): Promise<SectionPermissionRow[]> {
  const { data, error } = await supabase
    .from('section_permissions')
    .select('role, section_key, granted, updated_at, updated_by')
    .order('role', { ascending: true })
    .order('section_key', { ascending: true })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listDefaultPermissions] error:', error)
    throw error
  }

  type Raw = { role: string; section_key: string; granted: boolean; updated_at: string; updated_by: string | null }
  return ((data ?? []) as Raw[]).map((r) => ({
    role      : r.role as UserRole,
    sectionKey: r.section_key as SectionKey,
    granted   : r.granted,
    updatedAt : r.updated_at,
    updatedBy : r.updated_by,
  }))
}

/**
 * upsertDefaultPermission — admin met à jour la matrice (défaut rôle × section).
 * Idempotent via PK (role, section_key).
 */
export async function upsertDefaultPermission(
  role      : UserRole,
  sectionKey: SectionKey,
  granted   : boolean,
): Promise<void> {
  const { error } = await supabase
    .from('section_permissions')
    .upsert(
      { role, section_key: sectionKey, granted },
      { onConflict: 'role,section_key' },
    )

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[upsertDefaultPermission] error:', error)
    throw error
  }
}

// =============================================================================
// 2. Overrides individuels par utilisateur
// =============================================================================

/**
 * listUserOverrides — overrides actifs (non soft-deleted) d'un profil.
 * RLS : self OU admin du même tenant.
 */
export async function listUserOverrides(profileId: string): Promise<UserSectionOverrideRow[]> {
  const { data, error } = await supabase
    .from('user_section_overrides')
    .select('profile_id, section_key, tenant_id, granted, granted_at, granted_by, deleted_at')
    .eq('profile_id', profileId)
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listUserOverrides] error:', error)
    throw error
  }

  type Raw = {
    profile_id: string; section_key: string; tenant_id: string; granted: boolean
    granted_at: string; granted_by: string | null; deleted_at: string | null
  }
  return ((data ?? []) as Raw[]).map((r) => ({
    profileId : r.profile_id,
    sectionKey: r.section_key as SectionKey,
    tenantId  : r.tenant_id,
    granted   : r.granted,
    grantedAt : r.granted_at,
    grantedBy : r.granted_by,
    deletedAt : r.deleted_at,
  }))
}

/**
 * upsertUserOverride — admin crée/modifie un override pour un profil + section.
 * tenant_id est dérivé du profil cible (pas de paramètre requis côté appelant).
 * Si un override soft-deleted existe pour (profile_id, section_key), il est réactivé.
 */
export async function upsertUserOverride(
  profileId : string,
  sectionKey: SectionKey,
  granted   : boolean,
): Promise<void> {
  // Récupérer tenant_id du profil cible pour satisfaire RLS + contrainte NOT NULL.
  const { data: profileRow, error: profileErr } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', profileId)
    .single()

  if (profileErr || !profileRow) {
    if (process.env.NODE_ENV !== 'production') console.error('[upsertUserOverride] profile fetch error:', profileErr)
    throw profileErr ?? new Error('Profile not found')
  }

  const { error } = await supabase
    .from('user_section_overrides')
    .upsert(
      {
        profile_id : profileId,
        section_key: sectionKey,
        tenant_id  : (profileRow as { tenant_id: string }).tenant_id,
        granted,
        deleted_at : null,
      },
      { onConflict: 'profile_id,section_key,tenant_id' },
    )

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[upsertUserOverride] error:', error)
    throw error
  }
}

/**
 * deleteUserOverride — soft-delete d'un override (réactive le défaut du rôle).
 */
export async function deleteUserOverride(
  profileId : string,
  sectionKey: SectionKey,
): Promise<void> {
  const { error } = await supabase
    .from('user_section_overrides')
    .update({ deleted_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .eq('section_key', sectionKey)
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[deleteUserOverride] error:', error)
    throw error
  }
}

// =============================================================================
// 3. Composition : permissions effectives (rôle actif + overrides)
// =============================================================================

/**
 * getEffectivePermissions — combine défauts du rôle actif + overrides utilisateur.
 *
 * Résolution par section :
 *   1. Si un override actif existe → utilise granted de l'override
 *   2. Sinon → utilise granted du défaut du rôle actif
 *   3. Sinon (sections non seedées) → false par défaut
 *
 * Signature stable — consommée par la sidebar dynamique de Story 86-4.
 */
export async function getEffectivePermissions(
  profileId : string,
  activeRole: UserRole,
): Promise<EffectivePermissions> {
  // 1. Défauts du rôle actif
  const { data: defaults, error: defErr } = await supabase
    .from('section_permissions')
    .select('section_key, granted')
    .eq('role', activeRole)

  if (defErr) {
    if (!isAbortError(defErr) && process.env.NODE_ENV !== 'production') console.error('[getEffectivePermissions] defaults error:', defErr)
    throw defErr
  }

  // 2. Overrides actifs du profil
  const { data: overrides, error: ovErr } = await supabase
    .from('user_section_overrides')
    .select('section_key, granted')
    .eq('profile_id', profileId)
    .is('deleted_at', null)

  if (ovErr) {
    if (!isAbortError(ovErr) && process.env.NODE_ENV !== 'production') console.error('[getEffectivePermissions] overrides error:', ovErr)
    throw ovErr
  }

  // 3. Composition : initialise toutes les sections à false, puis applique defaults puis overrides
  const result = Object.fromEntries(SECTION_KEYS.map((k) => [k, false])) as EffectivePermissions

  type DefRow = { section_key: string; granted: boolean }
  ;((defaults ?? []) as DefRow[]).forEach((r) => {
    result[r.section_key as SectionKey] = r.granted
  })

  type OvRow = { section_key: string; granted: boolean }
  ;((overrides ?? []) as OvRow[]).forEach((r) => {
    result[r.section_key as SectionKey] = r.granted
  })

  return result
}

/**
 * Story 87.3 — listUserOverridesHistory
 * Overrides actifs ET soft-deleted pour la timeline des changements d'accès.
 * Ne filtre pas sur deleted_at (contrairement à listUserOverrides) — volontaire.
 */
export async function listUserOverridesHistory(profileId: string): Promise<UserSectionOverrideHistoryEntry[]> {
  const { data, error } = await supabase
    .from('user_section_overrides')
    .select('section_key, granted, granted_at, granted_by, deleted_at')
    .eq('profile_id', profileId)
    .order('granted_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[listUserOverridesHistory] error:', error)
    throw error
  }

  type Raw = {
    section_key: string; granted: boolean; granted_at: string
    granted_by : string | null; deleted_at: string | null
  }
  return ((data ?? []) as Raw[]).map((r) => ({
    sectionKey: r.section_key as SectionKey,
    granted   : r.granted,
    grantedAt : r.granted_at,
    grantedBy : r.granted_by,
    deletedAt : r.deleted_at,
  }))
}
