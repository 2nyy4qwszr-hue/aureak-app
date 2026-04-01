'use client'
// Story 11.3 — Dashboard partenariats clubs (admin)
import { useEffect, useState } from 'react'
import {
  listPartnerships, createPartnership, updatePartnership, listPartnerAccessStats,
} from '@aureak/api-client'
import type { ClubPartnership, PartnershipAccessLevel } from '@aureak/api-client'
import { colors } from '@aureak/theme'

const ACCESS_LABELS: Record<PartnershipAccessLevel, string> = {
  read_catalogue: 'Catalogue public',
  read_bronze   : 'Grade Bronze',
  read_silver   : 'Grade Argent et inférieur',
  full_read     : 'Accès complet',
}

export default function PartnershipsPage() {
  const [partnerships, setPartnerships] = useState<ClubPartnership[]>([])
  const [stats, setStats]               = useState<Record<string, number>>({})
  const [loading, setLoading]           = useState(true)
  const [creating, setCreating]         = useState(false)

  // Form state
  const [partnerName, setPartnerName]   = useState('')
  const [accessLevel, setAccessLevel]   = useState<PartnershipAccessLevel>('read_catalogue')
  const [activeUntil, setActiveUntil]   = useState('')
  const [notes, setNotes]               = useState('')
  const [formError, setFormError]       = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const result = await listPartnerships()
      setPartnerships(result.data ?? [])

      // Charger les stats d'accès pour chaque partenariat
      const statsMap: Record<string, number> = {}
      await Promise.all(
        result.data.map(async p => {
          const { count } = await listPartnerAccessStats(p.id)
          statsMap[p.id] = count
        }),
      )
      setStats(statsMap)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[partnerships] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!partnerName.trim()) { setFormError('Le nom du club est requis.'); return }
    setCreating(true)
    setFormError('')
    const { error } = await createPartnership({
      partnerName: partnerName.trim(),
      accessLevel,
      activeUntil: activeUntil || undefined,
      notes      : notes || undefined,
    })
    if (error) {
      setFormError((error as Error)?.message ?? 'Erreur inconnue')
    } else {
      setPartnerName('')
      setActiveUntil('')
      setNotes('')
      await load()
    }
    setCreating(false)
  }

  const handleUpdateExpiry = async (id: string, activeUntil: string | null) => {
    await updatePartnership(id, { active_until: activeUntil ?? undefined })
    await load()
  }

  const isActive = (p: ClubPartnership) =>
    new Date(p.active_from) <= new Date() &&
    (!p.active_until || new Date(p.active_until) >= new Date())

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Partenariats clubs</h1>

      {/* Formulaire création */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Nouveau partenariat</h2>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            placeholder="Nom du club partenaire *"
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
          />
          <select
            value={accessLevel}
            onChange={e => setAccessLevel(e.target.value as PartnershipAccessLevel)}
            style={styles.select}
          >
            {(Object.entries(ACCESS_LABELS) as [PartnershipAccessLevel, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input
            type="date"
            style={styles.input}
            placeholder="Expiration (optionnel)"
            value={activeUntil}
            onChange={e => setActiveUntil(e.target.value)}
          />
        </div>
        <input
          style={{ ...styles.input, width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
          placeholder="Notes (optionnel)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        {formError && <p style={styles.error}>{formError}</p>}
        <button
          style={creating ? { ...styles.createBtn, opacity: 0.6 } : styles.createBtn}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Création...' : 'Créer le partenariat'}
        </button>
      </div>

      {/* Liste */}
      {partnerships.length === 0 ? (
        <p style={styles.empty}>Aucun partenariat configuré.</p>
      ) : (
        partnerships.map(p => (
          <div key={p.id} style={isActive(p) ? styles.partnerCard : { ...styles.partnerCard, opacity: 0.6 }}>
            <div style={styles.partnerHeader}>
              <span style={styles.partnerName}>{p.partner_name}</span>
              <span style={isActive(p) ? styles.activeBadge : styles.inactiveBadge}>
                {isActive(p) ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div style={styles.partnerMeta}>
              <span style={styles.metaChip}>{ACCESS_LABELS[p.access_level]}</span>
              <span style={styles.metaChip}>Actif depuis {new Date(p.active_from).toLocaleDateString('fr-FR')}</span>
              {p.active_until && (
                <span style={styles.metaChip}>Jusqu'au {new Date(p.active_until).toLocaleDateString('fr-FR')}</span>
              )}
              <span style={styles.statChip}>{stats[p.id] ?? 0} accès (30j)</span>
            </div>
            {p.notes && <p style={styles.partnerNotes}>{p.notes}</p>}
            <div style={styles.partnerActions}>
              <button
                style={styles.revokeBtn}
                onClick={() => handleUpdateExpiry(p.id, new Date().toISOString().split('T')[0])}
              >
                Révoquer
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container    : { padding: '24px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  loading      : { padding: '48px', textAlign: 'center', color: colors.text.muted },
  title        : { fontSize: '28px', fontWeight: 700, marginBottom: '24px' },
  card         : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  sectionTitle : { fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: colors.accent.gold },
  formRow      : { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' },
  input        : { padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: '14px' },
  select       : { padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: '14px' },
  createBtn    : { padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 600 },
  error        : { color: colors.status.absent, fontSize: '14px', marginBottom: '10px' },
  empty        : { color: colors.text.muted, fontSize: '14px' },
  partnerCard  : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '16px', marginBottom: '10px' },
  partnerHeader: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' },
  partnerName  : { fontSize: '16px', fontWeight: 700, flex: 1 },
  activeBadge  : { fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.15)', color: colors.status.present, fontWeight: 600 },
  inactiveBadge: { fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: colors.border.light, color: colors.text.muted, fontWeight: 600 },
  partnerMeta  : { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
  metaChip     : { fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: colors.border.light, color: colors.text.muted },
  statChip     : { fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.15)', color: colors.text.dark },
  partnerNotes : { fontSize: '13px', color: colors.text.muted, marginBottom: '10px', fontStyle: 'italic' },
  partnerActions: { display: 'flex', gap: '8px' },
  revokeBtn    : { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: colors.status.absent, color: colors.text.dark, cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
}
