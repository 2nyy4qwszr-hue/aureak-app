// Story 91-2 — Médiathèque : upload Storage + CRUD media_items + validation admin
import { supabase } from '../supabase'
import type { MediaItem, MediaItemStatus } from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapRow(r: Record<string, unknown>): MediaItem {
  return {
    id         : r.id           as string,
    tenantId   : r.tenant_id    as string,
    uploadedBy : r.uploaded_by  as string,
    filePath   : r.file_path    as string,
    fileType   : r.file_type    as 'image' | 'video',
    title      : r.title        as string,
    description: (r.description as string) ?? '',
    status     : r.status       as MediaItemStatus,
    approvedBy : (r.approved_by as string | null) ?? null,
    approvedAt : (r.approved_at as string | null) ?? null,
    createdAt  : r.created_at   as string,
    updatedAt  : r.updated_at   as string,
    deletedAt  : (r.deleted_at  as string | null) ?? null,
  }
}

// ── Types params ──────────────────────────────────────────────────────────

export type UploadMediaItemParams = {
  file      : File
  title     : string
  description?: string
}

export type ListMediaItemsOpts = {
  status?: MediaItemStatus
}

// ── Upload ────────────────────────────────────────────────────────────────

const BUCKET = 'media-library'

/**
 * Upload un fichier dans le bucket media-library puis crée l'entrée media_items.
 * Le statut initial est `pending`.
 */
export async function uploadMediaItem(params: UploadMediaItemParams): Promise<MediaItem> {
  const { file, title, description } = params

  // Déterminer le type
  const fileType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'

  // Chemin unique
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  // 1. Upload Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  // 2. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 3. Insert DB row
  const { data, error } = await supabase
    .from('media_items')
    .insert({
      uploaded_by: user.id,
      file_path  : storagePath,
      file_type  : fileType,
      title      : title.trim(),
      description: (description ?? '').trim(),
      status     : 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

// ── List ──────────────────────────────────────────────────────────────────

/** Liste les médias (filtre optionnel par statut). Exclut les soft-deleted. */
export async function listMediaItems(opts?: ListMediaItemsOpts): Promise<MediaItem[]> {
  let query = supabase
    .from('media_items')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (opts?.status) {
    query = query.eq('status', opts.status)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) return []
  return (data as Record<string, unknown>[]).map(mapRow)
}

// ── Approve / Reject ──────────────────────────────────────────────────────

/** Approuver un média (admin). */
export async function approveMediaItem(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('media_items')
    .update({
      status     : 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

/** Rejeter un média (admin). */
export async function rejectMediaItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('media_items')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) throw error
}

// ── Soft-delete ───────────────────────────────────────────────────────────

/** Soft-delete un média. */
export async function softDeleteMediaItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('media_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// ── Signed URL ────────────────────────────────────────────────────────────

/** Obtenir une URL signée pour afficher le média. */
export async function getMediaSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600)

  if (error) throw error
  return data.signedUrl
}
