// Story 6.4 / 7.2 — Edge Function : notification parents après clôture de séance
// Déclenchée via Database Webhook sur event_log INSERT WHERE event_type = 'SESSION_CLOSED'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const { record } = await req.json()

  if (record.event_type !== 'SESSION_CLOSED') {
    return new Response('skipped', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const sessionId = record.entity_id

  // Vérifier send-once au niveau session
  const { data: session } = await supabase
    .from('sessions')
    .select('notification_sent_at, tenant_id, group_id')
    .eq('id', sessionId)
    .single()

  if (session?.notification_sent_at) {
    return new Response('already_sent', { status: 200 })
  }

  // Récupérer les thèmes de la séance
  const { data: sessionThemes } = await supabase
    .from('session_themes')
    .select('themes(name)')
    .eq('session_id', sessionId)

  type ThemeRow = { themes?: { name: string } | null }
  const themeNames = (sessionThemes as ThemeRow[] ?? [])
    .map(st => st.themes?.name)
    .filter(Boolean)
    .join(', ') ?? ''

  // Enfants présents
  const { data: attendances } = await supabase
    .from('attendances')
    .select('child_id')
    .eq('session_id', sessionId)
    .in('status', ['present', 'late', 'trial'])

  type AttRow = { child_id: string }
  const childIds = (attendances as AttRow[] ?? []).map(a => a.child_id)

  // Nom du groupe
  const { data: groupData } = await supabase
    .from('groups')
    .select('name')
    .eq('id', session?.group_id)
    .single()

  const groupName = (groupData as { name?: string } | null)?.name ?? 'Groupe'

  // Parents des enfants présents
  const { data: links } = await supabase
    .from('parent_child_links')
    .select('parent_id')
    .in('child_id', childIds)

  type LinkRow = { parent_id: string }
  const parentIds = [...new Set((links as LinkRow[] ?? []).map(l => l.parent_id))]

  let firstSentAt: string | null = null

  for (const parentId of parentIds) {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        tenantId   : session!.tenant_id,
        recipientId: parentId,
        eventType  : 'session_closed',
        referenceId: sessionId,
        urgency    : 'routine',
        title      : `Séance terminée — ${groupName}`,
        body       : `Thèmes : ${themeNames || 'non définis'}. ${childIds.length} enfants présents.`,
      }),
    })
    if (!firstSentAt) firstSentAt = new Date().toISOString()
  }

  // Update send-once atomique sur la session
  if (firstSentAt) {
    await supabase
      .from('sessions')
      .update({ notification_sent_at: firstSentAt })
      .eq('id', sessionId)
      .is('notification_sent_at', null)
  }

  return new Response(JSON.stringify({ sent: parentIds.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
