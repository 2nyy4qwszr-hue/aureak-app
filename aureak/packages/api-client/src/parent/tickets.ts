// Story 7.4 — Système de tickets parent
import { supabase } from '../supabase'

export type TicketCategory = 'absence' | 'retard' | 'question' | 'logistique'
export type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed'

export type CreateTicketParams = {
  childId   ?: string
  sessionId ?: string
  category   : TicketCategory
  subject    : string
  body       : string
}

export type Ticket = {
  id         : string
  tenantId   : string
  parentId   : string
  childId    : string | null
  sessionId  : string | null
  category   : TicketCategory
  subject    : string
  body       : string
  status     : TicketStatus
  assignedTo : string | null
  createdAt  : string
  updatedAt  : string | null
}

export type TicketReply = {
  id        : string
  ticketId  : string
  tenantId  : string
  authorId  : string
  body      : string
  createdAt : string
}

export async function createTicket(
  params: CreateTicketParams
): Promise<{ data: Ticket | null; error: unknown }> {
  const { data: userResult } = await supabase.auth.getUser()
  const tenantId = (userResult?.user?.app_metadata?.['tenant_id'] as string | undefined) ?? ''

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      tenant_id : tenantId,
      parent_id : userResult?.user?.id,
      child_id  : params.childId ?? null,
      session_id: params.sessionId ?? null,
      category  : params.category,
      subject   : params.subject,
      body      : params.body,
    })
    .select()
    .single()

  return { data: data as Ticket | null, error }
}

export async function replyToTicket(
  ticketId: string,
  body    : string
): Promise<{ data: TicketReply | null; error: unknown }> {
  const { data: userResult } = await supabase.auth.getUser()
  const tenantId = (userResult?.user?.app_metadata?.['tenant_id'] as string | undefined) ?? ''

  const { data, error } = await supabase
    .from('ticket_replies')
    .insert({
      ticket_id: ticketId,
      tenant_id: tenantId,
      author_id: userResult?.user?.id,
      body,
    })
    .select()
    .single()

  return { data: data as TicketReply | null, error }
}

export async function updateTicketStatus(
  ticketId : string,
  newStatus: TicketStatus
): Promise<{ error: unknown }> {
  const { data: userResult } = await supabase.auth.getUser()
  const tenantId = (userResult?.user?.app_metadata?.['tenant_id'] as string | undefined) ?? ''

  // Récupérer l'ancien statut pour audit
  const { data: current } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', ticketId)
    .single()

  const { error } = await supabase
    .from('tickets')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (!error && current?.status !== newStatus) {
    await supabase.from('audit_logs').insert({
      tenant_id  : tenantId,
      user_id    : userResult?.user?.id,
      action     : 'ticket_status_changed',
      entity_type: 'ticket',
      entity_id  : ticketId,
      metadata   : { old_status: current?.status, new_status: newStatus },
    })
  }

  return { error }
}

export async function listMyTickets(): Promise<{ data: Ticket[]; error: unknown }> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  return { data: (data as Ticket[]) ?? [], error }
}

// Admin/Coach : liste tous les tickets du tenant avec filtre optionnel (RLS gère l'accès)
export async function listAllTickets(
  status?: TicketStatus
): Promise<{ data: Ticket[]; error: unknown }> {
  let query = supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data: (data as Ticket[]) ?? [], error }
}

// Obtenir un ticket par ID
export async function getTicketById(
  ticketId: string
): Promise<{ data: Ticket | null; error: unknown }> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single()

  return { data: data as Ticket | null, error }
}

// Lister les réponses d'un ticket
export async function listTicketReplies(
  ticketId: string
): Promise<{ data: TicketReply[]; error: unknown }> {
  const { data, error } = await supabase
    .from('ticket_replies')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  return { data: (data as TicketReply[]) ?? [], error }
}

export async function getTicketWithReplies(
  ticketId: string
): Promise<{ ticket: Ticket | null; replies: TicketReply[]; error: unknown }> {
  const [ticketResult, repliesResult] = await Promise.all([
    supabase.from('tickets').select('*').eq('id', ticketId).single(),
    supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true }),
  ])

  return {
    ticket : ticketResult.data as Ticket | null,
    replies: (repliesResult.data as TicketReply[]) ?? [],
    error  : ticketResult.error ?? repliesResult.error,
  }
}
