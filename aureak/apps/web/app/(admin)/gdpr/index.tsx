'use client'
// Story 10.3 — Panneau Admin demandes RGPD
import { useEffect, useState } from 'react'
import { listAllGdprRequests, processGdprRequest } from '@aureak/api-client'
import type { GdprRequest, GdprRequestStatus } from '@aureak/api-client'
import { colors } from '@aureak/theme'

const STATUS_COLORS: Record<GdprRequestStatus, string> = {
  pending   : colors.accent.gold,
  processing: colors.accent.gold,
  completed : colors.status.present,
  rejected  : colors.status.absent,
}

const TYPE_LABELS: Record<string, string> = {
  access       : 'Accès',
  rectification: 'Rectification',
  erasure      : 'Effacement',
  portability  : 'Portabilité',
}

export default function GdprAdminPage() {
  const [requests, setRequests] = useState<GdprRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const result = await listAllGdprRequests()
    setRequests(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleProcess = async (req: GdprRequest, status: GdprRequestStatus) => {
    setWorking(req.id)
    if (req.request_type === 'access' || req.request_type === 'portability') {
      // Déclencher génération export
      await fetch('/api/generate-gdpr-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId  : req.id,
          requesterId: req.requester_id,
          targetId   : req.target_id,
        }),
      })
    } else {
      await processGdprRequest(req.id, status)
    }
    await load()
    setWorking(null)
  }

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Demandes RGPD</h1>

      {requests.length === 0 && (
        <div style={styles.empty}>Aucune demande RGPD en cours.</div>
      )}

      {requests.map(req => (
        <div key={req.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.typeLabel}>{TYPE_LABELS[req.request_type] ?? req.request_type}</span>
            <span style={{ ...styles.statusBadge, color: STATUS_COLORS[req.status] }}>
              {req.status}
            </span>
            <span style={styles.date}>{new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
          </div>

          <div style={styles.meta}>
            <span style={styles.metaItem}>Demandeur : <code style={styles.code}>{req.requester_id.slice(0, 8)}…</code></span>
            <span style={styles.metaItem}>Cible : <code style={styles.code}>{req.target_id.slice(0, 8)}…</code></span>
          </div>

          {req.file_url && (
            <a href={req.file_url} target="_blank" rel="noreferrer" style={styles.fileLink}>
              Télécharger le fichier
            </a>
          )}

          {req.status === 'pending' && (
            <div style={styles.actions}>
              <button
                style={working === req.id ? { ...styles.btnOk, opacity: 0.5 } : styles.btnOk}
                disabled={working === req.id}
                onClick={() => handleProcess(req, 'completed')}
              >
                {working === req.id ? '...' : 'Traiter'}
              </button>
              <button
                style={working === req.id ? { ...styles.btnDanger, opacity: 0.5 } : styles.btnDanger}
                disabled={working === req.id}
                onClick={() => processGdprRequest(req.id, 'rejected').then(() => load())}
              >
                Rejeter
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container  : { padding: '24px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  loading    : { padding: '48px', textAlign: 'center', color: colors.text.muted },
  title      : { fontSize: '28px', fontWeight: 700, marginBottom: '24px' },
  empty      : { color: colors.text.muted, fontSize: '15px' },
  card       : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '20px', marginBottom: '12px' },
  cardHeader : { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' },
  typeLabel  : { fontWeight: 700, fontSize: '15px' },
  statusBadge: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' },
  date       : { fontSize: '12px', color: colors.text.muted, marginLeft: 'auto' },
  meta       : { display: 'flex', gap: '20px', marginBottom: '10px' },
  metaItem   : { fontSize: '13px', color: colors.text.muted },
  code       : { fontFamily: 'monospace', fontSize: '12px', color: colors.text.muted },
  fileLink   : { display: 'inline-block', color: colors.accent.gold, fontSize: '13px', marginBottom: '10px' },
  actions    : { display: 'flex', gap: '10px', marginTop: '10px' },
  btnOk      : { padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: colors.status.present, color: colors.light.primary, cursor: 'pointer', fontWeight: 600 },
  btnDanger  : { padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: colors.status.absent, color: colors.text.dark, cursor: 'pointer', fontWeight: 600 },
}
