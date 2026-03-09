// Admin — Création de fiches et invitations utilisateurs
// Distingue "fiche locale" (pas d'email) de "invitation" (email envoyé)
// IMPORTANT : auth.admin.* requiert service_role → délégué à l'Edge Function create-user-profile

import { supabase } from '../supabase'

export type ProfileRole = 'child' | 'parent' | 'coach' | 'club'

// Champs communs à tous les rôles
type BaseProfileParams = {
  tenantId      : string
  role          : ProfileRole
  firstName     : string
  lastName      : string
  email?        : string
  phone?        : string
  internalNotes?: string
}

// Champs spécifiques enfant
type ChildParams = {
  birthDate?        : string
  gender?           : 'male' | 'female' | 'other'
  strongFoot?       : 'right' | 'left' | 'both'
  ageCategory?      : 'Foot à 5' | 'Foot à 8' | 'Foot à 11' | 'Senior' | ''
  currentClub?      : string
  implantationId?   : string
  groupId?          : string
  // Papa (premier contact)
  parentFirstName?  : string
  parentLastName?   : string
  parentEmail?      : string
  parentPhone?      : string
  // Maman (second contact)
  parent2FirstName? : string
  parent2LastName?  : string
  parent2Email?     : string
  parent2Phone?     : string
}

export type CreateProfileFicheParams  = BaseProfileParams & ChildParams
export type InviteProfileUserParams   = BaseProfileParams & ChildParams & { email: string }

type ProfileResult = { data: { userId: string } | null; error: unknown }

// ── Helper : extract human-readable error from functions.invoke ──────────────
//
// supabase.functions.invoke returns:
//   - FunctionsRelayError  (function not found / network failure)  → generic message
//   - FunctionsHttpError   (function returned a non-2xx body)      → body has { error: string }
//
// We try to read the response body to surface the actual function error message.
async function extractFunctionError(error: unknown): Promise<Error> {
  const baseMsg = (error as { message?: string }).message ?? 'Erreur inconnue'
  try {
    // FunctionsHttpError exposes the raw Response under .context
    const response: Response | undefined = (error as { context?: Response }).context
    if (response && typeof response.json === 'function') {
      const body = await response.json() as { error?: string }
      if (body?.error) return new Error(body.error)
    }
  } catch {
    // JSON parse failed or no context — fall back to SDK message
  }
  return new Error(baseMsg)
}

// ── Créer une fiche sans email ────────────────────────────────────────────────
/**
 * Crée un profil local sans envoyer d'invitation.
 * Délègue auth.admin.createUser à l'Edge Function create-user-profile (service_role).
 */
export async function createProfileFiche(
  params: CreateProfileFicheParams,
): Promise<ProfileResult> {
  const { data, error } = await supabase.functions.invoke('create-user-profile', {
    body: { mode: 'fiche', ...flattenParams(params) },
  })

  if (error) return { data: null, error: await extractFunctionError(error) }
  if (data?.error) return { data: null, error: new Error(data.error) }
  return { data: data?.data ?? null, error: null }
}

// ── Envoyer une invitation ────────────────────────────────────────────────────
/**
 * Invite un utilisateur par email ET crée son profil avec tous les champs.
 * Délègue auth.admin.inviteUserByEmail à l'Edge Function create-user-profile (service_role).
 */
export async function inviteProfileUser(
  params: InviteProfileUserParams,
): Promise<ProfileResult> {
  const { data, error } = await supabase.functions.invoke('create-user-profile', {
    body: { mode: 'invite', ...flattenParams(params) },
  })

  if (error) return { data: null, error: await extractFunctionError(error) }
  if (data?.error) return { data: null, error: new Error(data.error) }
  return { data: data?.data ?? null, error: null }
}

// ── Helper : aplatit les paramètres pour l'envoi JSON ────────────────────────

function flattenParams(params: CreateProfileFicheParams) {
  return {
    tenantId        : params.tenantId,
    role            : params.role,
    firstName       : params.firstName       ?? null,
    lastName        : params.lastName        ?? null,
    email           : params.email           ?? null,
    phone           : params.phone           ?? null,
    internalNotes   : params.internalNotes   ?? null,
    birthDate       : params.birthDate       ?? null,
    gender          : params.gender          ?? null,
    strongFoot      : params.strongFoot      ?? null,
    ageCategory     : params.ageCategory     ?? null,
    currentClub     : params.currentClub     ?? null,
    implantationId  : params.implantationId  ?? null,
    groupId         : params.groupId         ?? null,
    parentFirstName : params.parentFirstName  ?? null,
    parentLastName  : params.parentLastName   ?? null,
    parentEmail     : params.parentEmail      ?? null,
    parentPhone     : params.parentPhone      ?? null,
    parent2FirstName: params.parent2FirstName ?? null,
    parent2LastName : params.parent2LastName  ?? null,
    parent2Email    : params.parent2Email     ?? null,
    parent2Phone    : params.parent2Phone     ?? null,
  }
}
