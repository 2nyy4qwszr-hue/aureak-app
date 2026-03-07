// Story 10.3 — API droits RGPD
import { supabase } from '../supabase'

export type GdprRequestType = 'access' | 'rectification' | 'erasure' | 'portability'
export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected'

export type GdprRequest = {
  id              : string
  requester_id    : string
  target_id       : string
  request_type    : GdprRequestType
  status          : GdprRequestStatus
  rejection_reason: string | null
  file_url        : string | null
  processed_at    : string | null
  created_at      : string
}

export async function submitGdprRequest(
  targetId: string,
  type    : GdprRequestType,
): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('submit_gdpr_request', {
    p_target_id: targetId,
    p_type     : type,
  })
  return { data: data as string | null, error }
}

export async function listMyGdprRequests(): Promise<{ data: GdprRequest[]; error: unknown }> {
  const { data, error } = await supabase
    .from('gdpr_requests')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: (data as GdprRequest[]) ?? [], error }
}

export async function listAllGdprRequests(): Promise<{ data: GdprRequest[]; error: unknown }> {
  const { data, error } = await supabase
    .from('gdpr_requests')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: (data as GdprRequest[]) ?? [], error }
}

export async function processGdprRequest(
  requestId       : string,
  status          : GdprRequestStatus,
  fileUrl?        : string,
  rejectionReason?: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('process_gdpr_request', {
    p_request_id       : requestId,
    p_status           : status,
    p_file_url         : fileUrl ?? null,
    p_rejection_reason : rejectionReason ?? null,
  })
  return { error }
}
