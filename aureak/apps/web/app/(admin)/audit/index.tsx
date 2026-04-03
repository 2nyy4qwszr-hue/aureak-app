'use client'
// Story 10.4 — Journal d'audit (admin)
import { useEffect, useState } from 'react'
import { listAuditLogs } from '@aureak/api-client'
import type { AuditLog, AuditFilters } from '@aureak/api-client'
import { colors, shadows, radius } from '@aureak/theme'

export default function AuditPage() {
  const [logs, setLogs]         = useState<AuditLog[]>([])
  const [loading, setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters]   = useState<AuditFilters>({})

  const load = async () => {
    setLoading(true)
    try {
      const result = await listAuditLogs(filters)
      setLogs(result.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[audit] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export-audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      if (!res.ok) throw new Error(`export-audit-logs: ${res.status}`)
      const { fileUrl } = await res.json()
      if (fileUrl) window.open(fileUrl, '_blank')
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[audit] handleExport error:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Journal d&apos;audit</h1>
      <p style={styles.subtitle}>{logs.length} entrée{logs.length !== 1 ? 's' : ''} · Filtrez par action, entité ou date</p>

      {/* Filtres */}
      <div style={styles.filterRow}>
        <input
          style={styles.input}
          placeholder="Action (ex: user_suspended)"
          value={filters.action ?? ''}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value || undefined }))}
        />
        <input
          style={styles.input}
          placeholder="Type entité (ex: user)"
          value={filters.entityType ?? ''}
          onChange={e => setFilters(f => ({ ...f, entityType: e.target.value || undefined }))}
        />
        <input
          type="date"
          style={styles.input}
          value={filters.from ?? ''}
          onChange={e => setFilters(f => ({ ...f, from: e.target.value || undefined }))}
        />
        <input
          type="date"
          style={styles.input}
          value={filters.to ?? ''}
          onChange={e => setFilters(f => ({ ...f, to: e.target.value || undefined }))}
        />
        <button style={styles.searchBtn} onClick={load}>Rechercher</button>
        <button
          style={exporting ? { ...styles.exportBtn, opacity: 0.6 } : styles.exportBtn}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Export...' : 'Exporter CSV'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Entité</th>
              <th style={styles.th}>Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={styles.tr}>
                <td style={styles.td}>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>{log.action}</td>
                <td style={styles.td}>
                  {log.entity_type && (
                    <span style={styles.entity}>
                      {log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ''}
                    </span>
                  )}
                </td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px', color: colors.text.muted }}>
                  {log.user_id ? log.user_id.slice(0, 8) + '…' : '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: colors.text.muted }}>
                  Aucune entrée pour ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container  : { padding: '32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  loading    : { padding: '48px', textAlign: 'center', color: colors.text.muted },
  title      : { fontSize: '28px', fontWeight: 800, marginBottom: '8px', fontFamily: 'Rajdhani, sans-serif', color: colors.accent.gold },
  subtitle   : { fontSize: '13px', color: colors.text.muted, marginBottom: '24px' },
  filterRow  : { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' },
  input      : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: '13px' },
  searchBtn  : { padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 600 },
  exportBtn  : { padding: '8px 14px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.muted, cursor: 'pointer', fontWeight: 600 },
  table      : { width: '100%', borderCollapse: 'collapse', backgroundColor: colors.light.surface, borderRadius: '12px', overflow: 'hidden', boxShadow: shadows.sm, border: `1px solid ${colors.border.divider}` },
  th         : { padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: colors.text.subtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${colors.border.divider}`, backgroundColor: colors.light.muted },
  tr         : { borderBottom: `1px solid ${colors.border.divider}` },
  td         : { padding: '10px 14px', fontSize: '13px', color: colors.text.dark },
  entity     : { backgroundColor: colors.accent.gold + '18', border: `1px solid ${colors.border.gold}`, padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: colors.accent.gold },
}
