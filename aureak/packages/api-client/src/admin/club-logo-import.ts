// Importation de logos RBFA vers Supabase Storage — Story 28-1
// Chemin déterministe : {tenantId}/{clubId}/logo-rbfa.{ext}
// Idempotent via upsert Storage (écrase le logo RBFA précédent)

import { supabase } from '../supabase'

const LOGO_BUCKET        = 'club-logos'
const DOWNLOAD_TIMEOUT   = 15_000
const MAX_SIZE_BYTES     = 2 * 1024 * 1024   // 2 MB

export type LogoImportResult =
  | { success: true;  storagePath: string }
  | { success: false; reason: string }

/**
 * Télécharge un logo depuis le CDN RBFA et l'uploade dans Supabase Storage.
 * En cas d'erreur Storage, retourne success: false (pas de modification DB).
 */
export async function importRbfaLogo(params: {
  rbfaLogoUrl: string
  tenantId   : string
  clubId     : string
}): Promise<LogoImportResult> {
  const { rbfaLogoUrl, tenantId, clubId } = params

  // 1. Téléchargement
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)
  let blob: Blob
  let contentType: string

  try {
    const res = await fetch(rbfaLogoUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return { success: false, reason: `HTTP ${res.status} downloading logo` }

    contentType = res.headers.get('content-type') ?? 'image/jpeg'
    blob        = await res.blob()
  } catch (err) {
    clearTimeout(timeout)
    return { success: false, reason: err instanceof Error ? err.message : 'download_failed' }
  }

  if (blob.size > MAX_SIZE_BYTES) {
    return { success: false, reason: `Logo trop volumineux: ${blob.size} octets (max 2 MB)` }
  }

  // 2. Chemin déterministe
  const ext         = contentType.includes('png') ? 'png' : 'jpg'
  const storagePath = `${tenantId}/${clubId}/logo-rbfa.${ext}`

  // 3. Upload (upsert)
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(storagePath, blob, { upsert: true, contentType })

  if (uploadError) return { success: false, reason: uploadError.message }

  return { success: true, storagePath }
}
