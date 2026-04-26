// Epic 91 — Story 91.2 : API médiathèque — CRUD + Storage upload + URLs signées
import { supabase } from '../supabase'
import type {
  MediaItem,
  MediaFileType,
  MediaItemStatus,
  CreateMediaItemParams,
} from '@aureak/types'

const BUCKET = 'media-library'

type Row = Record<string, unknown>

function mapRow(r: Row, displayNameByUploader?: Map<string, string | null>): MediaItem {
  const uploaderId = r.uploaded_by as string
  return {
    id              : r.id as string,
    tenantId        : r.tenant_id as string,
    uploadedBy      : uploaderId,
    filePath        : r.file_path as string,
    fileType        : r.file_type as MediaFileType,
    title           : r.title as string,
    description     : (r.description as string | null) ?? null,
    status          : r.status as MediaItemStatus,
    approvedBy      : (r.approved_by as string | null) ?? null,
    approvedAt      : (r.approved_at as string | null) ?? null,
    rejectionReason : (r.rejection_reason as string | null) ?? null,
    fileSize        : (r.file_size as number | null) ?? null,
    mimeType        : (r.mime_type as string | null) ?? null,
    createdAt       : r.created_at as string,
    updatedAt       : r.updated_at as string,
    deletedAt       : (r.deleted_at as string | null) ?? null,
    uploaderDisplayName: displayNameByUploader?.get(uploaderId) ?? null,
  }
}

// FK media_items.uploaded_by → auth.users(id), donc PostgREST ne peut pas joindre
// directement profiles. On résout les display_name via un fetch séparé.
async function resolveUploaderNames(rows: Row[]): Promise<Map<string, string | null>> {
  const ids = [...new Set(rows.map(r => r.uploaded_by as string).filter(Boolean))]
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids)
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] profiles fetch error:', error)
    return new Map()
  }
  return new Map((data ?? []).map(p => [p.id as string, (p.display_name as string | null) ?? null]))
}

export type ListMediaItemsFilters = {
  status?    : MediaItemStatus
  uploadedBy?: string
}

export async function listMediaItems(filters: ListMediaItemsFilters = {}): Promise<MediaItem[]> {
  let q = supabase
    .from('media_items')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.status)     q = q.eq('status', filters.status)
  if (filters.uploadedBy) q = q.eq('uploaded_by', filters.uploadedBy)

  const { data, error } = await q
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] list error:', error)
    return []
  }
  const rows  = (data ?? []) as Row[]
  const names = await resolveUploaderNames(rows)
  return rows.map(r => mapRow(r, names))
}

export async function uploadMediaItem(
  file: File,
  metadata: Omit<CreateMediaItemParams, 'filePath'>,
): Promise<MediaItem> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) throw new Error('Utilisateur non authentifié')

  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileErr || !profileData?.tenant_id) {
    throw new Error('Profil introuvable ou tenant manquant')
  }
  const tenantId = profileData.tenant_id as string

  const ext      = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`
  const path     = `${tenantId}/${userId}/${filename}`

  const { error: uploadErr } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })

  if (uploadErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] upload error:', uploadErr)
    throw uploadErr
  }

  const { data, error: insertErr } = await supabase
    .from('media_items')
    .insert({
      tenant_id   : tenantId,
      uploaded_by : userId,
      file_path   : path,
      file_type   : metadata.fileType,
      title       : metadata.title,
      description : metadata.description ?? null,
      file_size   : metadata.fileSize ?? file.size,
      mime_type   : metadata.mimeType ?? file.type ?? null,
    })
    .select('*')
    .single()

  if (insertErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] insert error:', insertErr)
    await supabase.storage.from(BUCKET).remove([path])
    throw insertErr
  }
  const row   = data as Row
  const names = await resolveUploaderNames([row])
  return mapRow(row, names)
}

export async function approveMediaItem(id: string): Promise<MediaItem> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id ?? null

  const { data, error } = await supabase
    .from('media_items')
    .update({
      status           : 'approved',
      approved_by      : userId,
      approved_at      : new Date().toISOString(),
      rejection_reason : null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] approve error:', error)
    throw error
  }
  const row   = data as Row
  const names = await resolveUploaderNames([row])
  return mapRow(row, names)
}

export async function rejectMediaItem(id: string, reason: string): Promise<MediaItem> {
  const trimmed = reason.trim()
  if (trimmed.length < 5) throw new Error('La raison de rejet doit contenir au moins 5 caractères')

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id ?? null

  const { data, error } = await supabase
    .from('media_items')
    .update({
      status           : 'rejected',
      approved_by      : userId,
      approved_at      : new Date().toISOString(),
      rejection_reason : trimmed,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] reject error:', error)
    throw error
  }
  const row   = data as Row
  const names = await resolveUploaderNames([row])
  return mapRow(row, names)
}

export async function softDeleteMediaItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('media_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] delete error:', error)
    throw error
  }
}

export async function getMediaItemUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[media-items] signedUrl error:', error)
    return null
  }
  return data?.signedUrl ?? null
}
