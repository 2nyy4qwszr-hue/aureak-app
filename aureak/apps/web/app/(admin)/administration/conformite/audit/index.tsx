'use client'
// Story 10.4 — Journal d'audit (admin)
// Story 99.5 — AdminPageHeader v2 ("Audit")
// tbd-audit-timeline : Timeline lisible + filtres utilisateur/type
import { useEffect, useState, useMemo } from 'react'
import { listAuditLogs } from '@aureak/api-client'
import type { AuditLog, AuditFilters } from '@aureak/api-client'
import { colors, shadows, radius } from '@aureak/theme'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

// ── Action icons ─────────────────────────────────────────────────────────────

const ACTION_ICON: Record<string, string> = {
  create  : '＋',
  update  : '✎',
  delete  : '✕',
  login   : '→',
  logout  : '←',
  invite  : '✉',
  suspend : '⊘',
  restore : '↺',
  export  : '↓',
}

function getActionIcon(action: string): string {
  const key = Object.keys(ACTION_ICON).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_ICON[key] : '●'
}

function getActionColor(action: string): string {
  if (action.includes('delete') || action.includes('suspend')) return colors.accent.red
  if (action.includes('create') || action.includes('restore')) return colors.status.success
  if (action.includes('update') || action.includes('export'))  return colors.accent.gold
  if (action.includes('login'))                                return colors.status.present
  return colors.text.subtle
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── Timeline Entry ────────────────────────────────────────────────────────────

function TimelineEntry({ log, isLast }: { log: AuditLog; isLast: boolean }) {
  const icon  = getActionIcon(log.action)
  const color = getActionColor(log.action)

  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16 }}>
      {/* Vertical line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          backgroundColor: color + '18',
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color, flexShrink: 0,
        }}>
          {icon}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, backgroundColor: colors.border.divider, marginTop: 4 }} />
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        backgroundColor: colors.light.surface,
        borderRadius: radius.xs,
        border: `1px solid ${colors.border.divider}`,
        padding: '10px 14px',
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'monospace' }}>
            {log.action}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: colors.text.subtle }}>
              {fmtDate(log.created_at)}
            </span>
            <span style={{ fontSize: 11, color: colors.text.muted, fontFamily: 'monospace' }}>
              {fmtTime(log.created_at)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {log.entity_type && (
            <span style={{
              backgroundColor: colors.accent.gold + '18',
              border: `1px solid ${colors.border.gold}`,
              padding: '2px 8px', borderRadius: 20,
              fontSize: 11, color: colors.accent.gold, fontWeight: 600,
            }}>
              {log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ''}
            </span>
          )}
          {log.user_id && (
            <span style={{
              backgroundColor: colors.light.muted,
              border: `1px solid ${colors.border.divider}`,
              padding: '2px 8px', borderRadius: 20,
              fontSize: 11, color: colors.text.muted, fontFamily: 'monospace',
            }}>
              user:{log.user_id.slice(0, 8)}…
            </span>
          )}
        </div>

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <details style={{ marginTop: 6 }}>
            <summary style={{ fontSize: 11, color: colors.text.subtle, cursor: 'pointer' }}>
              Métadonnées
            </summary>
            <pre style={{
              fontSize: 11, color: colors.text.muted,
              backgroundColor: colors.light.muted,
              padding: '6px 10px', borderRadius: 4,
              marginTop: 4, overflow: 'auto', maxHeight: 100,
            }}>
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [logs,      setLogs]      = useState<AuditLog[]>([])
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters,   setFilters]   = useState<AuditFilters>({})

  // Client-side filters
  const [filterUser, setFilterUser]     = useState('')
  const [filterType, setFilterType]     = useState('')

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

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Unique entity types for dropdown
  const entityTypes = useMemo(
    () => [...new Set(logs.map(l => l.entity_type).filter(Boolean))].sort(),
    [logs]
  )

  // Unique user_ids (truncated)
  const userIds = useMemo(
    () => [...new Set(logs.map(l => l.user_id).filter(Boolean))],
    [logs]
  )

  // Filtered logs (client-side)
  const displayedLogs = useMemo(() => logs.filter(l => {
    if (filterUser && l.user_id !== filterUser) return false
    if (filterType && l.entity_type !== filterType) return false
    return true
  }), [logs, filterUser, filterType])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export-audit-logs', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(filters),
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
    <div>
      {/* Story 99.5 — AdminPageHeader v2 */}
      <AdminPageHeader title="Audit" />
      <div style={st.container}>
      <p style={st.subtitle}>
        {displayedLogs.length}{displayedLogs.length !== logs.length ? `/${logs.length}` : ''} entrée{displayedLogs.length !== 1 ? 's' : ''} · Timeline chronologique
      </p>

      {/* ── Server filters ── */}
      <div style={st.filterRow}>
        <input
          style={st.input}
          placeholder="Action (ex: user_suspended)"
          value={filters.action ?? ''}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value || undefined }))}
        />
        <input
          type="date"
          style={st.input}
          value={filters.from ?? ''}
          onChange={e => setFilters(f => ({ ...f, from: e.target.value || undefined }))}
        />
        <input
          type="date"
          style={st.input}
          value={filters.to ?? ''}
          onChange={e => setFilters(f => ({ ...f, to: e.target.value || undefined }))}
        />
        <button style={st.searchBtn} onClick={load}>Rechercher</button>
        <button
          style={exporting ? { ...st.exportBtn, opacity: 0.6 } : st.exportBtn}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Export...' : 'Exporter CSV'}
        </button>
      </div>

      {/* ── Client-side filters ── */}
      {logs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            style={st.select}
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
          >
            <option value="">Tous les utilisateurs</option>
            {userIds.map(uid => (
              <option key={uid} value={uid ?? ''}>
                {uid ? uid.slice(0, 8) + '…' : '(anonyme)'}
              </option>
            ))}
          </select>

          <select
            style={st.select}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Tous les types</option>
            {entityTypes.map(t => (
              <option key={t} value={t ?? ''}>{t}</option>
            ))}
          </select>

          {(filterUser || filterType) && (
            <button
              style={{ ...st.exportBtn, cursor: 'pointer' }}
              onClick={() => { setFilterUser(''); setFilterType('') }}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      {loading ? (
        <div style={st.loading}>Chargement…</div>
      ) : displayedLogs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 40,
          backgroundColor: colors.light.surface,
          borderRadius: radius.card,
          border: `1px dashed ${colors.border.divider}`,
          color: colors.text.muted,
        }}>
          Aucune entrée pour ces filtres.
        </div>
      ) : (
        <div style={{ padding: '4px 0' }}>
          {displayedLogs.map((log, i) => (
            <TimelineEntry key={log.id} log={log} isLast={i === displayedLogs.length - 1} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

const st: Record<string, React.CSSProperties> = {
  container : { padding: '32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 900 },
  loading   : { padding: '48px', textAlign: 'center', color: colors.text.muted },
  title     : { fontSize: '28px', fontWeight: 800, marginBottom: '8px', fontFamily: 'Montserrat, sans-serif', color: colors.accent.gold },
  subtitle  : { fontSize: '13px', color: colors.text.muted, marginBottom: '24px' },
  filterRow : { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' },
  input     : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: '13px' },
  select    : { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: '13px', cursor: 'pointer' },
  searchBtn : { padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 600 },
  exportBtn : { padding: '8px 14px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.muted, fontWeight: 600 },
}
