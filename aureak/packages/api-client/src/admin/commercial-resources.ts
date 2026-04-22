// Epic 88 — Story 88.5 : API bibliothèque ressources commerciales + Storage upload
import { supabase } from '../supabase'
import type {
  CommercialResource,
  CommercialResourceType,
  UpdateCommercialResourceParams,
} from '@aureak/types'

const BUCKET = 'commercial-resources'

function mapRow(r: Record<string, unknown>): CommercialResource {
  return {
    id           : r.id as string,
    tenantId     : r.tenant_id as string,
    resourceType : r.resource_type as CommercialResourceType,
    title        : r.title as string,
    description  : (r.description as string | null) ?? null,
    filePath     : (r.file_path as string | null) ?? null,
    externalUrl  : (r.external_url as string | null) ?? null,
    fileSize     : (r.file_size as number | null) ?? null,
    mimeType     : (r.mime_type as string | null) ?? null,
    uploadedBy   : (r.uploaded_by as string | null) ?? null,
    createdAt    : r.created_at as string,
    updatedAt    : r.updated_at as string,
  }
}

const ORDER: Record<CommercialResourceType, number> = {
  powerpoint: 1,
  flyer     : 2,
  webpage   : 3,
  tarifs    : 4,
}

export async function listCommercialResources(): Promise<CommercialResource[]> {
  const { data, error } = await supabase
    .from('commercial_resources')
    .select('*')

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-resources] list error:', error)
    return []
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapRow)
  return rows.sort((a, b) => ORDER[a.resourceType] - ORDER[b.resourceType])
}

export async function updateCommercialResource(params: UpdateCommercialResourceParams): Promise<CommercialResource> {
  const payload: Record<string, unknown> = {}
  if (params.title       !== undefined) payload.title        = params.title
  if (params.description !== undefined) payload.description  = params.description
  if (params.externalUrl !== undefined) payload.external_url = params.externalUrl

  const { data, error } = await supabase
    .from('commercial_resources')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-resources] update error:', error)
    throw error
  }
  return mapRow(data as Record<string, unknown>)
}

/**
 * Upload un fichier dans le bucket `commercial-resources`.
 * Chemin : {tenant_id}/{resource_type}/{filename}
 * Remplace l'ancien fichier si existant.
 */
export async function uploadCommercialResourceFile(
  resourceId: string,
  file: File,
): Promise<CommercialResource> {
  const { data: current, error: fetchErr } = await supabase
    .from('commercial_resources')
    .select('id, tenant_id, resource_type, file_path')
    .eq('id', resourceId)
    .maybeSingle()

  if (fetchErr || !current) {
    throw new Error('Ressource introuvable')
  }

  const tenantId     = current.tenant_id as string
  const resourceType = current.resource_type as CommercialResourceType
  const oldPath      = current.file_path as string | null

  const ext      = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const filename = `${Date.now()}.${ext}`
  const path     = `${tenantId}/${resourceType}/${filename}`

  // Upload nouveau fichier
  const { error: uploadErr } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })

  if (uploadErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-resources] upload error:', uploadErr)
    throw uploadErr
  }

  // Supprime l'ancien (best-effort)
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(BUCKET).remove([oldPath])
  }

  // Met à jour les métadonnées
  const { data: userData } = await supabase.auth.getUser()
  const { data, error: updateErr } = await supabase
    .from('commercial_resources')
    .update({
      file_path    : path,
      file_size    : file.size,
      mime_type    : file.type || null,
      uploaded_by  : userData?.user?.id ?? null,
      external_url : null,
    })
    .eq('id', resourceId)
    .select('*')
    .single()

  if (updateErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-resources] metadata update error:', updateErr)
    throw updateErr
  }
  return mapRow(data as Record<string, unknown>)
}

/**
 * Retourne l'URL pour consulter/télécharger une ressource.
 * - webpage avec external_url → renvoie l'URL directement
 * - fichier uploadé → génère une URL signée Supabase Storage (1h)
 */
export async function getResourceDownloadUrl(resource: CommercialResource): Promise<string | null> {
  if (resource.resourceType === 'webpage' && resource.externalUrl) {
    return resource.externalUrl
  }
  if (!resource.filePath) return null

  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .createSignedUrl(resource.filePath, 3600)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[commercial-resources] signedUrl error:', error)
    return null
  }
  return data?.signedUrl ?? null
}
