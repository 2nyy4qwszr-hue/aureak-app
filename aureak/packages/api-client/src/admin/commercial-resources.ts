// Story 88.5 — Bibliothèque ressources commerciales : CRUD metadata + upload + download
import { supabase } from '../supabase'
import type {
  CommercialResource,
  UpdateCommercialResourceParams,
} from '@aureak/types'

// ── Mapping snake_case → camelCase ─────────────────────────────────────────

function mapRow(r: Record<string, unknown>): CommercialResource {
  return {
    id          : r.id as string,
    tenantId    : r.tenant_id as string,
    title       : r.title as string,
    description : r.description as string,
    resourceType: r.resource_type as CommercialResource['resourceType'],
    filePath    : (r.file_path as string | null) ?? null,
    externalUrl : (r.external_url as string | null) ?? null,
    fileSize    : (r.file_size as number | null) ?? null,
    mimeType    : (r.mime_type as string | null) ?? null,
    uploadedBy  : (r.uploaded_by as string | null) ?? null,
    createdAt   : r.created_at as string,
    updatedAt   : r.updated_at as string,
  }
}

// ── Requêtes ───────────────────────────────────────────────────────────────

/**
 * Liste toutes les ressources commerciales du tenant, ordonnées par resource_type.
 */
export async function listCommercialResources(): Promise<CommercialResource[]> {
  const { data, error } = await supabase
    .from('commercial_resources')
    .select('*')
    .order('resource_type', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  return (data as Record<string, unknown>[]).map(mapRow)
}

/**
 * Met à jour les métadonnées d'une ressource (titre, description, URL externe).
 */
export async function updateCommercialResource(
  id: string,
  params: UpdateCommercialResourceParams,
): Promise<CommercialResource> {
  const patch: Record<string, unknown> = {}
  if (params.title !== undefined)       patch.title = params.title
  if (params.description !== undefined) patch.description = params.description
  if (params.externalUrl !== undefined) patch.external_url = params.externalUrl

  const { data, error } = await supabase
    .from('commercial_resources')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/**
 * Upload un fichier pour une ressource commerciale.
 * Stocke dans le bucket `commercial-resources` avec le chemin : {tenant_id}/{resource_type}/{filename}
 * Met à jour file_path, mime_type, file_size et uploaded_by.
 */
export async function uploadCommercialResourceFile(
  resource: CommercialResource,
  file: File,
): Promise<CommercialResource> {
  const path = `${resource.tenantId}/${resource.resourceType}/${file.name}`

  // Upload vers le bucket (upsert pour écraser l'ancienne version)
  const { error: uploadError } = await supabase.storage
    .from('commercial-resources')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  // Récupérer le user courant pour uploaded_by
  const { data: session } = await supabase.auth.getSession()
  const userId = session?.session?.user?.id ?? null

  // Mettre à jour les métadonnées dans la table
  const { data, error } = await supabase
    .from('commercial_resources')
    .update({
      file_path  : path,
      mime_type  : file.type || null,
      file_size  : file.size,
      uploaded_by: userId,
    })
    .eq('id', resource.id)
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

/**
 * Retourne l'URL de téléchargement d'une ressource.
 * - Pour les webpages : retourne l'external_url directement.
 * - Pour les fichiers : génère une URL signée valide 1h.
 */
export async function getResourceDownloadUrl(
  resource: CommercialResource,
): Promise<string | null> {
  if (resource.resourceType === 'webpage') {
    return resource.externalUrl
  }

  if (!resource.filePath) return null

  const { data, error } = await supabase.storage
    .from('commercial-resources')
    .createSignedUrl(resource.filePath, 3600) // 1h

  if (error) throw error
  return data?.signedUrl ?? null
}
