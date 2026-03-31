// Admin — Envoi de notifications via Edge Function
// Conformité ARCH-1 : wrapper centralisé autour de supabase.functions.invoke.
// Ne jamais appeler supabase.functions.invoke directement depuis un composant UI.

import { supabase } from '../supabase'

export type SendGradeNotificationParams = {
  coachId   : string
  gradeId   : string | null
  gradeLabel: string
  gradeEmoji: string
}

/**
 * Envoie une notification push au coach après attribution d'un grade.
 * Lit le tenantId depuis la session courante.
 */
export async function sendGradeNotification(
  params: SendGradeNotificationParams
): Promise<{ error: unknown }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const tenantId = (
    sessionData?.session?.user?.app_metadata as Record<string, string> | undefined
  )?.tenant_id ?? ''

  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      tenantId   : tenantId,
      recipientId: params.coachId,
      eventType  : 'grade_awarded',
      referenceId: params.gradeId,
      urgency    : 'routine',
      title      : 'Félicitations !',
      body       : `Vous avez obtenu le grade ${params.gradeLabel} ${params.gradeEmoji}`,
    },
  })

  return { error }
}
