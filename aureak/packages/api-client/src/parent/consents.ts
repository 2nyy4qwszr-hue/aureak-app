// Story 10.2 — API consentements parentaux
import { supabase } from '../supabase'

export type ConsentType = 'photos_videos' | 'data_processing' | 'marketing' | 'sharing_clubs'

export type Consent = {
  id          : string
  child_id    : string
  consent_type: ConsentType
  version     : number
  granted     : boolean
  granted_at  : string | null
  revoked_at  : string | null
  created_at  : string
}

export async function listConsentsByChild(
  childId: string,
): Promise<{ data: Consent[]; error: unknown }> {
  const { data, error } = await supabase
    .from('consents')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
  return { data: (data as Consent[]) ?? [], error }
}

export async function revokeConsent(
  childId    : string,
  consentType: ConsentType,
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('revoke_consent', {
    p_child_id    : childId,
    p_consent_type: consentType,
  })
  return { error }
}

export async function grantConsent(
  childId    : string,
  consentType: ConsentType,
  version    : number = 1,
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('grant_consent', {
    p_child_id    : childId,
    p_consent_type: consentType,
    p_version     : version,
  })
  return { error }
}
