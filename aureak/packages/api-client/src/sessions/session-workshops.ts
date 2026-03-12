// Story 21.3 — Ateliers (workshops) liés aux séances opérationnelles
// Table : session_workshops (migration 00074)
import { supabase } from '../supabase'
import type { SessionWorkshop } from '@aureak/types'

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapWorkshop(r: Record<string, unknown>): SessionWorkshop {
  return {
    id        : r['id']         as string,
    tenantId  : r['tenant_id']  as string,
    sessionId : r['session_id'] as string,
    title     : r['title']      as string,
    sortOrder : (r['sort_order'] as number) ?? 0,
    pdfUrl    : (r['pdf_url']   as string | null) ?? null,
    cardLabel : (r['card_label'] as string | null) ?? null,
    cardUrl   : (r['card_url']  as string | null) ?? null,
    notes     : (r['notes']     as string | null) ?? null,
    createdAt : r['created_at'] as string,
    updatedAt : r['updated_at'] as string,
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/** Lister les ateliers d'une séance, triés par sort_order. */
export async function listSessionWorkshops(
  sessionId: string
): Promise<SessionWorkshop[]> {
  const { data, error } = await supabase
    .from('session_workshops')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  if (error) return []
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapWorkshop)
}

export type AddSessionWorkshopParams = {
  sessionId  : string
  tenantId   : string
  title      : string
  sortOrder  : number
  pdfUrl?    : string
  cardLabel? : string
  cardUrl?   : string
  notes?     : string
}

/** Ajouter un atelier à une séance. */
export async function addSessionWorkshop(
  params: AddSessionWorkshopParams
): Promise<{ data: SessionWorkshop | null; error: string | null }> {
  const { data, error } = await supabase
    .from('session_workshops')
    .insert({
      tenant_id  : params.tenantId,
      session_id : params.sessionId,
      title      : params.title,
      sort_order : params.sortOrder,
      pdf_url    : params.pdfUrl   ?? null,
      card_label : params.cardLabel ?? null,
      card_url   : params.cardUrl  ?? null,
      notes      : params.notes    ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data ? mapWorkshop(data as unknown as Record<string, unknown>) : null, error: null }
}

export type UpdateSessionWorkshopPatch = Partial<Pick<
  SessionWorkshop,
  'title' | 'pdfUrl' | 'cardLabel' | 'cardUrl' | 'notes' | 'sortOrder'
>>

/** Mettre à jour un atelier. */
export async function updateSessionWorkshop(
  workshopId: string,
  patch: UpdateSessionWorkshopPatch
): Promise<{ error: string | null }> {
  const updates: Record<string, unknown> = {}
  if (patch.title     !== undefined) updates['title']      = patch.title
  if (patch.pdfUrl    !== undefined) updates['pdf_url']    = patch.pdfUrl
  if (patch.cardLabel !== undefined) updates['card_label'] = patch.cardLabel
  if (patch.cardUrl   !== undefined) updates['card_url']   = patch.cardUrl
  if (patch.notes     !== undefined) updates['notes']      = patch.notes
  if (patch.sortOrder !== undefined) updates['sort_order'] = patch.sortOrder

  if (Object.keys(updates).length === 0) return { error: null }

  const { error } = await supabase
    .from('session_workshops')
    .update(updates)
    .eq('id', workshopId)

  return { error: error?.message ?? null }
}

/** Supprimer un atelier. */
export async function removeSessionWorkshop(
  workshopId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('session_workshops')
    .delete()
    .eq('id', workshopId)

  return { error: error?.message ?? null }
}

// ─── Upload Storage ──────────────────────────────────────────────────────────

const BUCKET = 'session-workshops'

/**
 * Upload un fichier PDF vers session-workshops/{tenantId}/{sessionId}/pdf_{uuid}.pdf
 * Bucket public → retourne l'URL publique directe.
 */
export async function uploadWorkshopPdf(
  file: File,
  tenantId: string,
  sessionId: string
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const path = `${tenantId}/${sessionId}/pdf_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'application/pdf' })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

/**
 * Upload une image de carte vers session-workshops/{tenantId}/{sessionId}/card_{uuid}.{ext}
 * Bucket public → retourne l'URL publique directe.
 */
export async function uploadWorkshopCard(
  file: File,
  tenantId: string,
  sessionId: string
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${tenantId}/${sessionId}/card_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
