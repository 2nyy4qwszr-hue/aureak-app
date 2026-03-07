// Story 10.5 — API exports conformes
import { supabase } from '../supabase'

export type ExportType =
  | 'attendance_report'
  | 'evaluation_report'
  | 'mastery_report'
  | 'gdpr_personal_data'
  | 'cross_implantation_anonymous'

export type ExportStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'expired'

export type ExportJob = {
  id          : string
  export_type : ExportType
  status      : ExportStatus
  file_url    : string | null
  file_format : 'csv' | 'json'
  filters     : Record<string, unknown>
  expires_at  : string | null
  created_at  : string
}

export type CreateExportJobParams = {
  exportType: ExportType
  filters   : Record<string, unknown>
  format    : 'csv' | 'json'
}

export async function createExportJob(
  params: CreateExportJobParams,
): Promise<{ data: ExportJob | null; error: unknown }> {
  const { data, error } = await supabase
    .from('export_jobs')
    .insert({
      export_type: params.exportType,
      filters    : params.filters,
      file_format: params.format,
    })
    .select()
    .single()
  return { data: data as ExportJob | null, error }
}

export async function listExportJobs(): Promise<{ data: ExportJob[]; error: unknown }> {
  const { data, error } = await supabase
    .from('export_jobs')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: (data as ExportJob[]) ?? [], error }
}

export async function triggerExport(job: ExportJob, requestedBy: string, tenantId: string) {
  return supabase.functions.invoke('generate-export', {
    body: {
      jobId      : job.id,
      tenantId,
      requestedBy,
      exportType : job.export_type,
      filters    : job.filters,
      format     : job.file_format,
    },
  })
}
