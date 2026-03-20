// Importation de logos RBFA vers Supabase Storage — Story 28-1 / fix 28-3
// Délègue le téléchargement à la Edge Function "import-club-logo" pour contourner
// le CORS bloquant le fetch direct depuis le browser vers les CDN externes (AWS S3, etc.)
//
// Chemin déterministe : {tenantId}/{clubId}/logo-rbfa.{ext}
// Idempotent via upsert Storage (écrase le logo RBFA précédent)

import { supabase } from '../supabase'

export type LogoImportResult =
  | { success: true;  storagePath: string }
  | { success: false; reason: string }

/**
 * Télécharge un logo depuis le CDN RBFA et l'uploade dans Supabase Storage.
 * Le téléchargement est délégué à la Edge Function "import-club-logo" (côté serveur)
 * pour éviter les erreurs CORS lors d'appels cross-origin depuis le browser.
 */
export async function importRbfaLogo(params: {
  rbfaLogoUrl: string
  tenantId   : string
  clubId     : string
}): Promise<LogoImportResult> {
  const { rbfaLogoUrl, tenantId, clubId } = params

  const { data, error } = await supabase.functions.invoke('import-club-logo', {
    body: { logoUrl: rbfaLogoUrl, clubId, tenantId },
  })

  if (error) {
    return { success: false, reason: error.message ?? 'edge_function_error' }
  }

  const result = data as { storagePath?: string; error?: string }

  if (result?.error) {
    return { success: false, reason: result.error }
  }

  if (!result?.storagePath) {
    return { success: false, reason: 'storagePath manquant dans la réponse' }
  }

  return { success: true, storagePath: result.storagePath }
}
