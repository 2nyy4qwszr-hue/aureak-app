// @aureak/api-client — Blessures joueurs (migration 00060)
import { supabase } from '../supabase'
import type { ChildDirectoryInjury } from '@aureak/types'

function toInjury(row: Record<string, unknown>): ChildDirectoryInjury {
  return {
    id         : row.id          as string,
    tenantId   : row.tenant_id   as string,
    childId    : row.child_id    as string,
    type       : row.type        as 'blessure' | 'grosse_blessure',
    zone       : (row.zone        as string | null) ?? null,
    dateDebut  : (row.date_debut  as string | null) ?? null,
    dateFin    : (row.date_fin    as string | null) ?? null,
    commentaire: (row.commentaire as string | null) ?? null,
    createdAt  : row.created_at  as string,
    updatedAt  : row.updated_at  as string,
  }
}

export async function listChildInjuries(
  childId: string,
): Promise<ChildDirectoryInjury[]> {
  const { data, error } = await supabase
    .from('child_directory_injuries')
    .select('*')
    .eq('child_id', childId)
    .order('date_debut', { ascending: false, nullsFirst: true })
  if (error) throw error
  return (data ?? []).map(toInjury)
}

export type AddInjuryParams = {
  tenantId    : string
  childId     : string
  type?       : 'blessure' | 'grosse_blessure'
  zone?       : string | null
  dateDebut?  : string | null
  dateFin?    : string | null
  commentaire?: string | null
}

export async function addChildInjury(
  params: AddInjuryParams,
): Promise<ChildDirectoryInjury> {
  const { data, error } = await supabase
    .from('child_directory_injuries')
    .insert({
      tenant_id  : params.tenantId,
      child_id   : params.childId,
      type       : params.type        ?? 'blessure',
      zone       : params.zone        ?? null,
      date_debut : params.dateDebut   ?? null,
      date_fin   : params.dateFin     ?? null,
      commentaire: params.commentaire ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return toInjury(data)
}

export async function deleteChildInjury(id: string): Promise<void> {
  const { error } = await supabase
    .from('child_directory_injuries')
    .delete()
    .eq('id', id)
  if (error) throw error
}
