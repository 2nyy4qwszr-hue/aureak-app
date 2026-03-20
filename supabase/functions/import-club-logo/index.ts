// Edge Function: import-club-logo
// Télécharge un logo depuis une URL externe (ex: CDN RBFA) côté serveur
// et l'uploade dans Supabase Storage bucket "club-logos".
// Contourne le CORS bloquant le download client-side depuis le browser.
//
// Body JSON attendu: { logoUrl: string, clubId: string, tenantId: string }
// Retourne: { storagePath: string } ou { error: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status : 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const LOGO_BUCKET    = 'club-logos'
const MAX_SIZE_BYTES = 2 * 1024 * 1024  // 2 MB
const DOWNLOAD_TIMEOUT = 15_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabaseUrl     = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { logoUrl, clubId, tenantId } = await req.json() as {
      logoUrl : string
      clubId  : string
      tenantId: string
    }

    if (!logoUrl || !clubId || !tenantId) {
      return err(400, 'logoUrl, clubId et tenantId sont requis')
    }

    // 1. Téléchargement de l'image (côté serveur — pas de CORS)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)

    let blob: Blob
    let contentType: string

    try {
      const res = await fetch(logoUrl, {
        signal : controller.signal,
        headers: { 'User-Agent': 'Aureak Club Sync/1.0' },
      })
      clearTimeout(timeout)

      if (!res.ok) return err(502, `Erreur HTTP ${res.status} lors du téléchargement`)

      contentType = res.headers.get('content-type') ?? 'image/jpeg'
      blob = await res.blob()
    } catch (e) {
      clearTimeout(timeout)
      return err(502, `Échec téléchargement: ${e instanceof Error ? e.message : 'inconnu'}`)
    }

    if (blob.size > MAX_SIZE_BYTES) {
      return err(413, `Logo trop volumineux: ${blob.size} octets (max 2 MB)`)
    }

    // 2. Chemin déterministe dans Storage
    const ext         = contentType.includes('png') ? 'png' : 'jpg'
    const storagePath = `${tenantId}/${clubId}/logo-rbfa.${ext}`

    // 3. Upload (upsert — idempotent)
    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(storagePath, blob, { upsert: true, contentType })

    if (uploadError) return err(500, `Erreur Storage: ${uploadError.message}`)

    // 4. Mise à jour logo_path dans club_directory
    const { error: dbError } = await supabase
      .from('club_directory')
      .update({ logo_path: storagePath })
      .eq('id', clubId)
      .eq('tenant_id', tenantId)

    if (dbError) {
      // Rollback Storage si la DB échoue
      await supabase.storage.from(LOGO_BUCKET).remove([storagePath])
      return err(500, `Erreur DB: ${dbError.message}`)
    }

    return ok({ storagePath })

  } catch (e) {
    return err(500, e instanceof Error ? e.message : 'Erreur inconnue')
  }
})
