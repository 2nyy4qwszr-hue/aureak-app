'use client'
// Story 10.5 — Exports conformes (admin)
import { useEffect, useState } from 'react'
import { createExportJob, listExportJobs, triggerExport } from '@aureak/api-client'
import type { ExportJob, ExportType } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const EXPORT_TYPES: { value: ExportType; label: string }[] = [
  { value: 'attendance_report',            label: 'Rapport de présences' },
  { value: 'evaluation_report',            label: 'Rapport d\'évaluations' },
  { value: 'mastery_report',               label: 'Rapport de maîtrise' },
  { value: 'gdpr_personal_data',           label: 'Données personnelles RGPD' },
  { value: 'cross_implantation_anonymous', label: 'Comparaison anonymisée inter-implantations' },
]

const STATUS_COLORS: Record<string, string> = {
  queued    : colors.text.muted,
  processing: colors.accent.gold,
  ready     : colors.status.present,
  failed    : colors.status.absent,
  expired   : colors.border.light,
}

export default function ExportsPage() {
  const user                    = useAuthStore(s => s.user)
  const tenantId                = useAuthStore(s => s.tenantId)
  const [jobs, setJobs]         = useState<ExportJob[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [exportType, setExportType] = useState<ExportType>('attendance_report')
  const [format, setFormat]     = useState<'csv' | 'json'>('csv')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const result = await listExportJobs()
      setJobs(result.data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[exports] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const filters: Record<string, string> = {}
      if (from) filters.from = new Date(from).toISOString()
      if (to)   filters.to   = new Date(to).toISOString()

      const { data: job, error } = await createExportJob({ exportType, filters, format })
      if (!error && job && user && tenantId) {
        // Déclencher immédiatement
        await triggerExport(job, user.id, tenantId)
        await load()
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[exports] handleCreate error:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Exports conformes</h1>

      {/* Formulaire création */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Nouvel export</h2>

        <div style={styles.formRow}>
          <select
            value={exportType}
            onChange={e => setExportType(e.target.value as ExportType)}
            style={styles.select}
          >
            {EXPORT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={format}
            onChange={e => setFormat(e.target.value as 'csv' | 'json')}
            style={styles.select}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div style={styles.formRow}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={styles.input} placeholder="Du" />
          <span style={styles.sep}>→</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={styles.input} placeholder="Au" />
        </div>

        <button
          style={creating ? { ...styles.createBtn, opacity: 0.6 } : styles.createBtn}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Génération en cours...' : 'Générer l\'export'}
        </button>
      </div>

      {/* Liste jobs */}
      <h2 style={styles.sectionTitle}>Historique des exports</h2>
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : jobs.length === 0 ? (
        <div style={styles.empty}>Aucun export généré.</div>
      ) : (
        jobs.map(job => (
          <div key={job.id} style={styles.jobRow}>
            <div style={styles.jobLeft}>
              <span style={styles.jobType}>
                {EXPORT_TYPES.find(t => t.value === job.export_type)?.label ?? job.export_type}
              </span>
              <span style={styles.jobFormat}>{job.file_format.toUpperCase()}</span>
            </div>
            <span style={{ ...styles.statusBadge, color: STATUS_COLORS[job.status] ?? colors.text.muted }}>
              {job.status}
            </span>
            <span style={styles.jobDate}>{new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
            {job.file_url && job.status === 'ready' && (
              <a href={job.file_url} target="_blank" rel="noreferrer" style={styles.dlLink}>
                Télécharger
              </a>
            )}
          </div>
        ))
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container  : { padding: '24px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  loading    : { padding: '48px', textAlign: 'center', color: colors.text.muted },
  title      : { fontSize: '28px', fontWeight: 700, marginBottom: '24px' },
  card       : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '20px', marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: colors.accent.gold },
  formRow    : { display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' },
  select     : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: '14px' },
  input      : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: '14px' },
  sep        : { color: colors.text.muted },
  createBtn  : { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 600 },
  empty      : { color: colors.text.muted, fontSize: '14px' },
  jobRow     : { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: colors.light.surface, borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' },
  jobLeft    : { display: 'flex', gap: '8px', alignItems: 'center', flex: 1 },
  jobType    : { fontSize: '14px', fontWeight: 500 },
  jobFormat  : { fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: colors.border.light, color: colors.text.muted },
  statusBadge: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' },
  jobDate    : { fontSize: '12px', color: colors.text.muted },
  dlLink     : { color: colors.accent.gold, fontSize: '13px', fontWeight: 600 },
}
