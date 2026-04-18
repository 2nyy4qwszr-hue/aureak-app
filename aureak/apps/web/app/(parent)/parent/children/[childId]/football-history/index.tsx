'use client'
// Historique football — gestion par saison pour le parent
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  listHistoryByChild,
  addHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import { FOOTBALL_AGE_CATEGORIES, FOOTBALL_TEAM_LEVELS } from '@aureak/types'
import type { ChildClubHistory, FootballAgeCategory, FootballTeamLevel } from '@aureak/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const AGE_CATEGORIES = FOOTBALL_AGE_CATEGORIES
const TEAM_LEVELS    = FOOTBALL_TEAM_LEVELS

const TEAM_LEVEL_COLOR: Record<FootballTeamLevel, string> = {
  'Provinciaux'      : colors.text.muted,
  'Interprovinciaux' : colors.status.attention,
  'Régionaux'        : '#7C8CF8',
  'Nationaux'        : colors.accent.gold,
  'International'    : colors.status.present,
}

// ── Generate seasons ───────────────────────────────────────────────────────────
function generateSeasons(count = 10): string[] {
  const year = new Date().getFullYear()
  return Array.from({ length: count }, (_, i) => {
    const start = year - i
    return `${start}-${start + 1}`
  })
}

const SEASONS = generateSeasons(12)

// ── Types ──────────────────────────────────────────────────────────────────────
type FormState = {
  season       : string
  clubName     : string
  isAffiliated : boolean
  ageCategory  : FootballAgeCategory
  teamLevel    : FootballTeamLevel | ''
  notes        : string
}

const EMPTY_FORM: FormState = {
  season      : SEASONS[0],
  clubName    : '',
  isAffiliated: false,
  ageCategory : 'U12',
  teamLevel   : '',
  notes       : '',
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={S.page}>
      <style>{`@keyframes fh-p{0%,100%{opacity:.12}50%{opacity:.35}} .fh-sk{background:${colors.light.muted};border-radius:6px;animation:fh-p 1.9s ease-in-out infinite}`}</style>
      <div className="fh-sk" style={{ height: 13, width: 120, marginBottom: 20 }} />
      <div className="fh-sk" style={{ height: 28, width: 260, marginBottom: 24 }} />
      <div className="fh-sk" style={{ height: 120, marginBottom: 16 }} />
      {[0,1,2].map(i => <div key={i} className="fh-sk" style={{ height: 90, marginBottom: 10, borderRadius: 10 }} />)}
    </div>
  )
}

// ── SeasonBadge ───────────────────────────────────────────────────────────────
function SeasonBadge({ season }: { season: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
      backgroundColor: 'rgba(193,172,92,0.10)',
      border: `1px solid ${colors.accent.gold}40`,
      color: colors.accent.gold, letterSpacing: '0.04em',
    }}>
      {season}
    </span>
  )
}

// ── LevelBadge ────────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: FootballTeamLevel | null }) {
  if (!level) return <span style={{ fontSize: 12, color: colors.text.muted }}>–</span>
  const c = TEAM_LEVEL_COLOR[level]
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
      border: `1px solid ${c}50`, backgroundColor: c + '12', color: c,
    }}>
      {level}
    </span>
  )
}

// ── AffiliationBadge ──────────────────────────────────────────────────────────
function AffiliationBadge({ value }: { value: boolean }) {
  return value ? (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
      backgroundColor: 'rgba(76,175,80,0.10)',
      border: `1px solid ${colors.status.present}40`,
      color: colors.status.present,
    }}>
      Affilié
    </span>
  ) : (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
      backgroundColor: colors.light.muted,
      border: `1px solid ${colors.border.light}`,
      color: colors.text.muted,
    }}>
      Non affilié
    </span>
  )
}

// ── Modal Form ─────────────────────────────────────────────────────────────────
function HistoryModal({
  initial,
  usedSeasons,
  onSave,
  onClose,
}: {
  initial       : FormState | null  // null = creation
  usedSeasons   : string[]
  onSave        : (f: FormState) => Promise<void>
  onClose       : () => void
}) {
  const [form,    setForm]    = useState<FormState>(initial ?? EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState<string | null>(null)

  const isEdit = initial !== null

  const availableSeasons = isEdit
    ? SEASONS
    : SEASONS.filter(s => !usedSeasons.includes(s))

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    if (!form.clubName.trim()) { setErr('Le nom du club est requis.'); return }
    if (!form.ageCategory)     { setErr('La catégorie d\'âge est requise.'); return }
    setSaving(true)
    try {
      await onSave(form)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur inattendue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>{isEdit ? 'Modifier la saison' : 'Nouvelle saison'}</h2>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {err && (
          <div style={S.errorBanner}>{err}</div>
        )}

        <div style={S.fieldGrid}>
          {/* Saison */}
          <div style={S.field}>
            <label style={S.label}>Saison</label>
            <select
              value={form.season}
              onChange={e => set('season', e.target.value)}
              style={S.select}
              disabled={isEdit}
            >
              {availableSeasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              {isEdit && !availableSeasons.includes(form.season) && (
                <option value={form.season}>{form.season}</option>
              )}
            </select>
          </div>

          {/* Club */}
          <div style={S.field}>
            <label style={S.label}>Club</label>
            <input
              value={form.clubName}
              onChange={e => set('clubName', e.target.value)}
              placeholder="Nom du club (ex: RSC Anderlecht)"
              style={S.input}
            />
          </div>

          {/* Catégorie d'âge */}
          <div style={S.field}>
            <label style={S.label}>Catégorie d'âge</label>
            <select
              value={form.ageCategory}
              onChange={e => set('ageCategory', e.target.value as FootballAgeCategory)}
              style={S.select}
            >
              {AGE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Niveau d'équipe */}
          <div style={S.field}>
            <label style={S.label}>Niveau d'équipe <span style={{ color: colors.text.muted, fontWeight: 400 }}>(optionnel)</span></label>
            <select
              value={form.teamLevel}
              onChange={e => set('teamLevel', e.target.value as FootballTeamLevel | '')}
              style={S.select}
            >
              <option value="">– Non renseigné</option>
              {TEAM_LEVELS.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Affilié */}
        <div style={{ ...S.field, marginTop: 16 }}>
          <label style={S.checkRow} onClick={() => set('isAffiliated', !form.isAffiliated)}>
            <div style={{
              ...S.checkbox,
              backgroundColor : form.isAffiliated ? colors.status.present : colors.light.muted,
              borderColor     : form.isAffiliated ? colors.status.present : colors.border.light,
            }}>
              {form.isAffiliated && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.dark }}>Affiliation officielle</div>
              <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                Le joueur était officiellement affilié à ce club cette saison
              </div>
            </div>
          </label>
        </div>

        {/* Notes */}
        <div style={{ ...S.field, marginTop: 16 }}>
          <label style={S.label}>Notes <span style={{ color: colors.text.muted, fontWeight: 400 }}>(optionnel)</span></label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Informations complémentaires, blessures, contexte..."
            style={{ ...S.input, minHeight: 72, resize: 'vertical' as const }}
          />
        </div>

        {/* Actions */}
        <div style={S.modalActions}>
          <button style={S.btnGhost} onClick={onClose} disabled={saving}>Annuler</button>
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function FootballHistoryPage() {
  const { childId }  = useLocalSearchParams<{ childId: string }>()
  const router       = useRouter()
  const user         = useAuthStore(s => s.user)
  const tenantId     = useAuthStore(s => s.tenantId)

  const [history,   setHistory]   = useState<ChildClubHistory[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<{ mode: 'create' } | { mode: 'edit'; entry: ChildClubHistory } | null>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const load = async () => {
    if (!childId) return
    try {
      const { data } = await listHistoryByChild(childId)
      setHistory(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[football-history] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [childId])

  const usedSeasons = history.map(h => h.season)

  const handleSave = async (form: FormState) => {
    if (!childId || !tenantId) return

    if (modal?.mode === 'edit') {
      const { error } = await updateHistoryEntry({
        id           : modal.entry.id,
        tenantId,
        clubName     : form.clubName,
        isAffiliated : form.isAffiliated,
        ageCategory  : form.ageCategory,
        teamLevel    : form.teamLevel || null,
        notes        : form.notes || null,
      })
      if (error) throw new Error('Erreur lors de la mise à jour.')
    } else {
      const { error } = await addHistoryEntry({
        tenantId,
        childId,
        season       : form.season,
        clubName     : form.clubName,
        isAffiliated : form.isAffiliated,
        ageCategory  : form.ageCategory,
        teamLevel    : form.teamLevel || null,
        notes        : form.notes || null,
      })
      if (error) throw new Error('Erreur lors de l\'ajout.')
    }

    setModal(null)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!tenantId) return
    setDeleting(id)
    await deleteHistoryEntry(id, tenantId)
    setDeleting(null)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  if (loading) return <Skeleton />

  const affiliatedCount = history.filter(h => h.isAffiliated).length

  return (
    <div style={S.page}>
      <style>{`
        .fh-row:hover { background: rgba(255,255,255,0.025) !important; }
        .fh-del:hover { color: ${colors.status.absent} !important; }
        .fh-edit:hover { color: ${colors.accent.gold} !important; }
      `}</style>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <button
        style={S.back}
        onClick={() => router.push(`/parent/children/${childId}` as never)}
      >
        ← Fiche joueur
      </button>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Historique football</h1>
          <p style={S.pageSubtitle}>
            {history.length} saison{history.length !== 1 ? 's' : ''} enregistrée{history.length !== 1 ? 's' : ''} · {affiliatedCount} affiliation{affiliatedCount !== 1 ? 's' : ''} officielle{affiliatedCount !== 1 ? 's' : ''}
          </p>
        </div>
        {usedSeasons.length < SEASONS.length && (
          <button
            style={S.btnPrimary}
            onClick={() => setModal({ mode: 'create' })}
          >
            + Ajouter une saison
          </button>
        )}
      </div>

      {/* ── Distinction info box ─────────────────────────────────────────────── */}
      <div style={S.infoBox}>
        <div style={{ fontSize: 13, color: colors.accent.gold, fontWeight: 700, marginBottom: 4 }}>
          Deux notions distinctes
        </div>
        <div style={{ fontSize: 12, color: colors.text.muted, lineHeight: 1.6 }}>
          <strong style={{ color: colors.text.dark }}>Club lié dans l'app</strong> — le club partenaire qui suit le gardien dans AUREAK (accès opérationnel).<br/>
          <strong style={{ color: colors.text.dark }}>Historique d'affiliation</strong> — les clubs auxquels le joueur était rattaché officiellement chaque saison (indépendant de l'app).
        </div>
      </div>

      {/* ── Timeline ────────────────────────────────────────────────────────── */}
      {history.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚽</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucune saison enregistrée</div>
          <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 20 }}>
            Documentez le parcours football de votre joueur saison par saison.
          </div>
          <button style={S.btnPrimary} onClick={() => setModal({ mode: 'create' })}>
            + Ajouter la première saison
          </button>
        </div>
      ) : (
        <div style={S.timeline}>
          {history.map((entry, i) => (
            <div key={entry.id} className="fh-row" style={{
              ...S.timelineRow,
              borderBottom: i < history.length - 1 ? `1px solid ${colors.border.light}` : 'none',
            }}>
              {/* Timeline dot */}
              <div style={S.dot}>
                <div style={{
                  ...S.dotInner,
                  backgroundColor: entry.isAffiliated ? colors.status.present : colors.light.muted,
                  borderColor    : entry.isAffiliated ? colors.status.present : colors.border.light,
                }} />
                {i < history.length - 1 && <div style={S.dotLine} />}
              </div>

              {/* Content */}
              <div style={S.timelineContent}>
                <div style={S.timelineTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <SeasonBadge season={entry.season} />
                    <AffiliationBadge value={entry.isAffiliated} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }} className="fh-actions">
                    <button
                      className="fh-edit"
                      style={S.iconBtn}
                      onClick={() => setModal({
                        mode : 'edit',
                        entry,
                      })}
                    >
                      ✎
                    </button>
                    <button
                      className="fh-del"
                      style={{ ...S.iconBtn, opacity: deleting === entry.id ? 0.4 : 1 }}
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={S.clubRow}>
                  <span style={S.clubName}>{entry.clubName}</span>
                  <span style={S.catBadge}>{entry.ageCategory}</span>
                  <LevelBadge level={entry.teamLevel} />
                </div>

                {entry.notes && (
                  <div style={S.notes}>"{entry.notes}"</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {modal && (
        <HistoryModal
          initial={modal.mode === 'edit' ? {
            season      : modal.entry.season,
            clubName    : modal.entry.clubName,
            isAffiliated: modal.entry.isAffiliated,
            ageCategory : modal.entry.ageCategory,
            teamLevel   : modal.entry.teamLevel ?? '',
            notes       : modal.entry.notes ?? '',
          } : null}
          usedSeasons={usedSeasons}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page     : { padding: '24px 30px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 760 },
  back     : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 18, display: 'block', transition: 'color 0.15s' },
  header   : { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', margin: '0 0 4px', letterSpacing: '0.02em' },
  pageSubtitle: { fontSize: 13, color: colors.text.muted, margin: 0 },

  infoBox  : { padding: '14px 16px', borderRadius: 10, marginBottom: 24, backgroundColor: 'rgba(193,172,92,0.04)', border: `1px solid ${colors.accent.gold}30` },

  // Timeline
  timeline       : { display: 'flex', flexDirection: 'column' as const, backgroundColor: colors.light.surface, borderRadius: 12, border: `1px solid ${colors.border.light}`, overflow: 'hidden' },
  timelineRow    : { display: 'flex', gap: 0, padding: '0 0', transition: 'background 0.12s' },
  dot            : { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '20px 0 0 20px', flexShrink: 0, width: 36 },
  dotInner       : { width: 12, height: 12, borderRadius: '50%', border: '2px solid', flexShrink: 0 },
  dotLine        : { width: 2, flex: 1, backgroundColor: colors.border.light, margin: '6px 0', minHeight: 24 },
  timelineContent: { flex: 1, padding: '18px 20px 18px 12px', minWidth: 0 },
  timelineTop    : { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  clubRow        : { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 6 },
  clubName       : { fontSize: 16, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: colors.text.dark, letterSpacing: '0.01em' },
  catBadge       : { fontSize: 12, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: colors.light.muted, border: `1px solid ${colors.border.light}`, color: colors.text.muted },
  notes          : { fontSize: 13, color: colors.text.muted, fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 },
  iconBtn        : { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: colors.text.muted, padding: '2px 6px', borderRadius: 4, transition: 'color 0.12s', lineHeight: 1 },

  empty  : { backgroundColor: colors.light.surface, borderRadius: 12, border: `1px solid ${colors.border.light}`, padding: '48px 24px', textAlign: 'center' as const },

  // Modal
  backdrop    : { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.70)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal       : { backgroundColor: colors.light.muted, borderRadius: 14, border: `1px solid ${colors.border.light}`, padding: '28px 28px 24px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' as const },
  modalHeader : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle  : { fontSize: 20, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', margin: 0, letterSpacing: '0.02em' },
  closeBtn    : { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: colors.text.muted, padding: '4px', borderRadius: 4 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  errorBanner : { padding: '10px 14px', borderRadius: 8, marginBottom: 16, backgroundColor: 'rgba(244,67,54,0.08)', border: `1px solid ${colors.status.absent}30`, fontSize: 13, color: colors.status.absent },

  // Form
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' },
  field    : { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label    : { fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  input    : { padding: '9px 12px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'Poppins, sans-serif' },
  select   : { padding: '9px 12px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface, color: colors.text.dark, fontSize: 14, outline: 'none', cursor: 'pointer' },
  checkRow : { display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' as const },
  checkbox : { width: 20, height: 20, borderRadius: 5, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' },

  // Buttons
  btnPrimary: { padding: '10px 18px', borderRadius: 8, border: `1px solid ${colors.accent.gold}`, backgroundColor: 'rgba(193,172,92,0.12)', color: colors.accent.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em' },
  btnGhost  : { padding: '10px 16px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}
