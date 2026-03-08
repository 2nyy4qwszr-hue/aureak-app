'use client'
// Fiche joueur/enfant — child_directory
// Vue admin : statut calculé, badges, historique académie + stages, identité, club, parents
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getChildDirectoryEntry, updateChildDirectoryEntry,
  listChildDirectoryHistory, addChildHistoryEntry, deleteChildHistoryEntry,
  getChildAcademyStatus,
  listChildAcademyMemberships,
  listChildStageParticipations,
  listAcademySeasons,
  addChildAcademyMembership,
  removeChildAcademyMembership,
  listStages,
  addChildStageParticipation,
  removeChildStageParticipation,
} from '@aureak/api-client'
import { ACADEMY_STATUS_CONFIG, generateAcademyBadges } from '@aureak/business-logic'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import {
  FOOTBALL_AGE_CATEGORIES, FOOTBALL_TEAM_LEVELS,
} from '@aureak/types'
import type {
  ChildDirectoryEntry,
  ChildDirectoryHistory,
  ChildAcademyStatusData,
  ChildAcademyMembership,
  ChildStageParticipation,
  AcademySeason,
  Stage,
} from '@aureak/types'

// ── Section header ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <AureakText
      variant="caption"
      style={{
        color        : colors.text.secondary,
        fontWeight   : '700',
        letterSpacing: 1.2,
        fontSize     : 10,
        textTransform: 'uppercase' as never,
        marginBottom : space.xs,
        marginTop    : space.md,
      }}
    >
      {children}
    </AureakText>
  )
}

// ── Info row ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={row.wrap}>
      <AureakText variant="caption" style={row.label}>{label}</AureakText>
      <AureakText variant="body" style={row.value}>{value || '—'}</AureakText>
    </View>
  )
}
const row = StyleSheet.create({
  wrap : { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.accent.zinc + '40' },
  label: { width: 160, color: colors.text.secondary, fontSize: 12 },
  value: { flex: 1, fontSize: 13 },
})

// ── Academy Status Header ─────────────────────────────────────────────────────

function AcademyStatusHeader({ data }: { data: ChildAcademyStatusData }) {
  const cfg    = ACADEMY_STATUS_CONFIG[data.computedStatus]
  const badges = generateAcademyBadges(data)
  return (
    <View style={st.wrapper}>
      {/* Status pill */}
      <View style={[st.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
        <AureakText variant="label" style={{ color: cfg.color, fontWeight: '800', letterSpacing: 1.1, fontSize: 12 }}>
          {cfg.label}
        </AureakText>
      </View>
      {/* Badges row */}
      {badges.length > 0 && (
        <View style={st.badgeRow}>
          {badges.map((b, i) => (
            <View key={i} style={st.badge}>
              <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11 }}>
                {b}
              </AureakText>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
const st = StyleSheet.create({
  wrapper   : { gap: 10 },
  statusPill: {
    alignSelf       : 'flex-start',
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : 20,
    borderWidth      : 1,
  },
  badgeRow  : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge     : {
    backgroundColor : colors.background.elevated,
    borderRadius    : 12,
    borderWidth     : 1,
    borderColor     : colors.accent.zinc,
    paddingHorizontal: 10,
    paddingVertical  : 3,
  },
})

// ── Historique Académie ───────────────────────────────────────────────────────

function HistoriqueSection({
  childId,
  tenantId,
  memberships,
  stageParticipations,
  seasons,
  stages,
  onRefresh,
}: {
  childId            : string
  tenantId           : string
  memberships        : ChildAcademyMembership[]
  stageParticipations: ChildStageParticipation[]
  seasons            : AcademySeason[]
  stages             : Stage[]
  onRefresh          : () => void
}) {
  const [open,        setOpen]        = useState(true)
  const [addingMem,   setAddingMem]   = useState(false)
  const [addingStage, setAddingStage] = useState(false)
  const [selSeason,   setSelSeason]   = useState<string>('')
  const [selStage,    setSelStage]    = useState<string>('')
  const [saving,      setSaving]      = useState(false)

  const alreadyEnrolledSeasonIds = new Set(memberships.map(m => m.seasonId))
  const alreadyAttendedStageIds  = new Set(stageParticipations.map(p => p.stageId))

  const availableSeasons = seasons.filter(s => !alreadyEnrolledSeasonIds.has(s.id))
  const availableStages  = stages.filter(s => !alreadyAttendedStageIds.has(s.id))

  const handleAddMembership = async () => {
    if (!selSeason) return
    setSaving(true)
    await addChildAcademyMembership({ tenantId, childId, seasonId: selSeason })
    setAddingMem(false)
    setSelSeason('')
    setSaving(false)
    onRefresh()
  }

  const handleRemoveMembership = async (id: string) => {
    await removeChildAcademyMembership(id)
    onRefresh()
  }

  const handleAddStage = async () => {
    if (!selStage) return
    setSaving(true)
    await addChildStageParticipation({ tenantId, childId, stageId: selStage })
    setAddingStage(false)
    setSelStage('')
    setSaving(false)
    onRefresh()
  }

  const handleRemoveStage = async (id: string) => {
    await removeChildStageParticipation(id)
    onRefresh()
  }

  return (
    <View style={h.card}>
      <Pressable style={h.toggle} onPress={() => setOpen(v => !v)}>
        <AureakText variant="label" style={{ color: colors.accent.gold, letterSpacing: 1, fontSize: 11 }}>
          {open ? '▾ ' : '▸ '}HISTORIQUE
        </AureakText>
      </Pressable>

      {open && (
        <View style={{ gap: space.md }}>

          {/* ── ACADÉMIE ── */}
          <View>
            <View style={h.subHeader}>
              <AureakText variant="caption" style={h.subTitle}>ACADÉMIE</AureakText>
              {availableSeasons.length > 0 && !addingMem && (
                <Pressable onPress={() => setAddingMem(true)}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11 }}>+ Ajouter</AureakText>
                </Pressable>
              )}
            </View>

            {memberships.length === 0 && !addingMem ? (
              <AureakText variant="caption" style={h.empty}>Aucune saison académie.</AureakText>
            ) : (
              <View style={h.list}>
                {[...memberships]
                  .sort((a, b) => (b.season?.label ?? '').localeCompare(a.season?.label ?? ''))
                  .map(m => (
                    <View key={m.id} style={h.item}>
                      <View style={h.dot} />
                      <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>
                        {m.season?.label ?? m.seasonId}
                        {m.season?.isCurrent && (
                          <AureakText style={{ color: colors.accent.gold, fontSize: 11 }}> (en cours)</AureakText>
                        )}
                      </AureakText>
                      <Pressable onPress={() => handleRemoveMembership(m.id)} style={h.removeBtn}>
                        <AureakText variant="caption" style={{ color: colors.status.absent, fontSize: 10 }}>✕</AureakText>
                      </Pressable>
                    </View>
                  ))}
              </View>
            )}

            {addingMem && (
              <View style={h.addForm}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {availableSeasons.map(s => (
                    <Pressable
                      key={s.id}
                      style={[h.pill, selSeason === s.id && h.pillActive]}
                      onPress={() => setSelSeason(s.id)}
                    >
                      <AureakText variant="caption" style={{ fontSize: 11, color: selSeason === s.id ? colors.accent.gold : colors.text.secondary }}>
                        {s.label}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Pressable style={h.cancelBtn} onPress={() => { setAddingMem(false); setSelSeason('') }}>
                    <AureakText variant="caption" style={{ color: colors.text.secondary }}>Annuler</AureakText>
                  </Pressable>
                  <Pressable style={[h.saveBtn, !selSeason && { opacity: 0.4 }]} onPress={handleAddMembership} disabled={!selSeason || saving}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                      {saving ? '…' : 'Ajouter'}
                    </AureakText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* ── STAGES ── */}
          <View>
            <View style={h.subHeader}>
              <AureakText variant="caption" style={h.subTitle}>STAGES</AureakText>
              {availableStages.length > 0 && !addingStage && (
                <Pressable onPress={() => setAddingStage(true)}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11 }}>+ Ajouter</AureakText>
                </Pressable>
              )}
            </View>

            {stageParticipations.length === 0 && !addingStage ? (
              <AureakText variant="caption" style={h.empty}>Aucun stage.</AureakText>
            ) : (
              <View style={h.list}>
                {[...stageParticipations]
                  .sort((a, b) => (b.stage?.startDate ?? '').localeCompare(a.stage?.startDate ?? ''))
                  .map(p => (
                    <View key={p.id} style={h.item}>
                      <View style={[h.dot, { backgroundColor: '#4FC3F7' }]} />
                      <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>
                        {p.stage?.name ?? p.stageId}
                        {p.stage?.startDate && (
                          <AureakText style={{ color: colors.text.secondary, fontSize: 11 }}>
                            {' '}· {new Date(p.stage.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </AureakText>
                        )}
                      </AureakText>
                      <Pressable onPress={() => handleRemoveStage(p.id)} style={h.removeBtn}>
                        <AureakText variant="caption" style={{ color: colors.status.absent, fontSize: 10 }}>✕</AureakText>
                      </Pressable>
                    </View>
                  ))}
              </View>
            )}

            {addingStage && (
              <View style={h.addForm}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {availableStages.map(s => (
                    <Pressable
                      key={s.id}
                      style={[h.pill, selStage === s.id && h.pillActive]}
                      onPress={() => setSelStage(s.id)}
                    >
                      <AureakText variant="caption" style={{ fontSize: 11, color: selStage === s.id ? colors.accent.gold : colors.text.secondary }}>
                        {s.name}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Pressable style={h.cancelBtn} onPress={() => { setAddingStage(false); setSelStage('') }}>
                    <AureakText variant="caption" style={{ color: colors.text.secondary }}>Annuler</AureakText>
                  </Pressable>
                  <Pressable style={[h.saveBtn, !selStage && { opacity: 0.4 }]} onPress={handleAddStage} disabled={!selStage || saving}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                      {saving ? '…' : 'Ajouter'}
                    </AureakText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const h = StyleSheet.create({
  card    : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '40',
    padding        : space.md,
    marginBottom   : space.xs,
  },
  toggle  : { paddingBottom: space.sm },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subTitle : { color: colors.text.secondary, fontWeight: '700', fontSize: 10, letterSpacing: 0.8 },
  empty    : { color: colors.text.secondary, fontStyle: 'italic' as never, fontSize: 12 },
  list    : { gap: 4 },
  item    : {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc + '30',
  },
  dot     : {
    width          : 6,
    height         : 6,
    borderRadius   : 3,
    backgroundColor: colors.accent.gold,
    flexShrink     : 0,
  },
  removeBtn: {
    width          : 20,
    height         : 20,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.status.absent + '40',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  addForm : {
    backgroundColor: colors.background.elevated,
    borderRadius   : 8,
    padding        : space.sm,
    gap            : space.sm,
    marginTop      : space.xs,
  },
  pill    : {
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderRadius     : 12,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
    backgroundColor  : colors.background.primary,
  },
  pillActive : { borderColor: colors.accent.gold, backgroundColor: colors.background.elevated },
  cancelBtn  : {
    paddingHorizontal: space.md, paddingVertical: space.xs + 2,
    borderRadius: 6, borderWidth: 1, borderColor: colors.accent.zinc,
  },
  saveBtn    : {
    paddingHorizontal: space.md, paddingVertical: space.xs + 2,
    borderRadius: 6, backgroundColor: colors.accent.gold,
  },
})

// ── Football history modal ────────────────────────────────────────────────────

const CATEGORIES = FOOTBALL_AGE_CATEGORIES
const NIVEAUX    = FOOTBALL_TEAM_LEVELS

function AddHistoryModal({
  childId, onClose, onAdded,
}: { childId: string; onClose: () => void; onAdded: () => void }) {
  const [saison,    setSaison]    = useState('')
  const [clubNom,   setClubNom]   = useState('')
  const [categorie, setCategorie] = useState('')
  const [niveau,    setNiveau]    = useState('')
  const [affilie,   setAffilie]   = useState(false)
  const [notes,     setNotes]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleSave = async () => {
    if (!saison.trim() || !clubNom.trim()) {
      setError('Saison et nom du club sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      await addChildHistoryEntry({
        childId, saison: saison.trim(), clubNom: clubNom.trim(),
        categorie: categorie || null, niveau: niveau || null,
        affilie, notes: notes || null,
      })
      onAdded()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
      setSaving(false)
    }
  }

  return (
    <View style={mst.overlay}>
      <View style={mst.box}>
        <AureakText variant="h3" style={{ marginBottom: space.md }}>Ajouter une saison</AureakText>
        {error && <View style={mst.errorBox}><AureakText variant="caption" style={{ color: colors.status.attention }}>{error}</AureakText></View>}
        <AureakText variant="caption" style={mst.fieldLabel}>Saison *</AureakText>
        <TextInput style={mst.input} value={saison} onChangeText={setSaison} placeholder="ex: 2024-2025" placeholderTextColor={colors.text.secondary} />
        <AureakText variant="caption" style={mst.fieldLabel}>Club *</AureakText>
        <TextInput style={mst.input} value={clubNom} onChangeText={setClubNom} placeholder="Nom du club" placeholderTextColor={colors.text.secondary} />
        <AureakText variant="caption" style={mst.fieldLabel}>Catégorie</AureakText>
        <View style={mst.selectRow}>
          {CATEGORIES.map(c => (
            <Pressable key={c} style={[mst.pill, categorie === c && mst.pillActive]} onPress={() => setCategorie(prev => prev === c ? '' : c)}>
              <AureakText variant="caption" style={{ fontSize: 10, color: categorie === c ? colors.accent.gold : colors.text.secondary }}>{c}</AureakText>
            </Pressable>
          ))}
        </View>
        <AureakText variant="caption" style={mst.fieldLabel}>Niveau</AureakText>
        <View style={mst.selectRow}>
          {NIVEAUX.map(n => (
            <Pressable key={n} style={[mst.pill, niveau === n && mst.pillActive]} onPress={() => setNiveau(prev => prev === n ? '' : n)}>
              <AureakText variant="caption" style={{ fontSize: 10, color: niveau === n ? colors.accent.gold : colors.text.secondary }}>{n}</AureakText>
            </Pressable>
          ))}
        </View>
        <View style={[mst.row, { marginTop: space.sm }]}>
          <AureakText variant="caption" style={{ flex: 1 }}>Affilié ACFF/VV</AureakText>
          <Switch value={affilie} onValueChange={setAffilie} />
        </View>
        <AureakText variant="caption" style={mst.fieldLabel}>Notes</AureakText>
        <TextInput style={[mst.input, { height: 64, textAlignVertical: 'top' as never }]} value={notes} onChangeText={setNotes} multiline placeholder="Remarques optionnelles…" placeholderTextColor={colors.text.secondary} />
        <View style={mst.actions}>
          <Pressable style={mst.cancelBtn} onPress={onClose}>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Annuler</AureakText>
          </Pressable>
          <Pressable style={mst.saveBtn} onPress={handleSave} disabled={saving}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>{saving ? '...' : 'Ajouter'}</AureakText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const mst = StyleSheet.create({
  overlay   : { position: 'fixed' as never, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, justifyContent: 'center', alignItems: 'center' },
  box       : { backgroundColor: colors.background.surface, borderRadius: 12, padding: space.xl, width: 560, maxHeight: '90vh' as never, overflowY: 'auto' as never, borderWidth: 1, borderColor: colors.accent.zinc },
  fieldLabel: { color: colors.text.secondary, marginBottom: 4, marginTop: space.sm, fontSize: 11 },
  input     : { backgroundColor: colors.background.elevated, borderWidth: 1, borderColor: colors.accent.zinc, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: space.xs + 2, color: colors.text.primary, fontSize: 13 },
  selectRow : { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: space.xs },
  pill      : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: colors.accent.zinc, backgroundColor: colors.background.elevated },
  pillActive: { borderColor: colors.accent.gold, backgroundColor: colors.background.primary },
  row       : { flexDirection: 'row', alignItems: 'center' },
  actions   : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, marginTop: space.md },
  cancelBtn : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, borderWidth: 1, borderColor: colors.accent.zinc },
  saveBtn   : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, backgroundColor: colors.accent.gold },
  errorBox  : { backgroundColor: colors.status.attention + '20', borderRadius: 6, padding: space.sm, marginBottom: space.sm, borderWidth: 1, borderColor: colors.status.attention },
  twoCol    : { flexDirection: 'row', gap: space.md },
})

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ChildDetailPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()
  const tenantId    = useAuthStore((s) => s.tenantId)

  const [child,        setChild]        = useState<ChildDirectoryEntry | null>(null)
  const [history,      setHistory]      = useState<ChildDirectoryHistory[]>([])
  const [academyData,  setAcademyData]  = useState<ChildAcademyStatusData | null>(null)
  const [memberships,  setMemberships]  = useState<ChildAcademyMembership[]>([])
  const [stages_,      setStages_]      = useState<ChildStageParticipation[]>([])
  const [allSeasons,   setAllSeasons]   = useState<AcademySeason[]>([])
  const [allStages,    setAllStages]    = useState<Stage[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showAddHist,  setShowAddHist]  = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  const loadChild = useCallback(async () => {
    if (!childId) return
    const [entry, hist, acStatus, mems, stParts, seasons, stageList] = await Promise.all([
      getChildDirectoryEntry(childId),
      listChildDirectoryHistory(childId),
      getChildAcademyStatus(childId),
      listChildAcademyMemberships(childId),
      listChildStageParticipations(childId),
      listAcademySeasons(),
      listStages(),
    ])
    setChild(entry)
    setHistory(hist)
    setAcademyData(acStatus.data)
    setMemberships(mems.data)
    setStages_(stParts.data)
    setAllSeasons(seasons.data)
    setAllStages(stageList)
    setLoading(false)
  }, [childId])

  useEffect(() => { loadChild() }, [loadChild])

  const handleDeleteHistory = async (id: string) => {
    setDeletingId(id)
    await deleteChildHistoryEntry(id)
    setHistory(prev => prev.filter(h => h.id !== id))
    setDeletingId(null)
  }

  if (loading) {
    return (
      <View style={s.center}>
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement…</AureakText>
      </View>
    )
  }

  if (!child) {
    return (
      <View style={s.center}>
        <AureakText variant="h3" style={{ color: colors.text.secondary }}>Joueur introuvable</AureakText>
        <Pressable onPress={() => router.back()} style={{ marginTop: space.md }}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        {/* ── Navigation ── */}
        <View style={s.pageHeader}>
          <Pressable onPress={() => router.back()}>
            <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
          </Pressable>
        </View>

        {/* ── Hero : nom + statut calculé + badges ── */}
        <View style={s.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.sm }}>
            <View style={{ flex: 1 }}>
              <AureakText variant="h2">{child.displayName}</AureakText>
              {child.birthDate && (
                <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
                  {new Date(child.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </AureakText>
              )}
            </View>
            <Badge label={child.actif ? 'Actif' : 'Inactif'} variant={child.actif ? 'present' : 'zinc'} />
          </View>

          {/* Statut calculé */}
          {academyData ? (
            <AcademyStatusHeader data={academyData} />
          ) : (
            <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              {child.statut && <Badge label={child.statut} variant="zinc" />}
              <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11 }}>
                (statut importé Notion — en attente de calcul)
              </AureakText>
            </View>
          )}
        </View>

        {/* ── HISTORIQUE : académie + stages (calculé) ── */}
        {tenantId && (
          <HistoriqueSection
            childId={childId!}
            tenantId={tenantId}
            memberships={memberships}
            stageParticipations={stages_}
            seasons={allSeasons}
            stages={allStages}
            onRefresh={loadChild}
          />
        )}

        {/* ── Identité ── */}
        <View style={s.card}>
          <SectionTitle>Identité</SectionTitle>
          <InfoRow label="Nom complet"        value={child.displayName} />
          <InfoRow label="Date de naissance"  value={child.birthDate ? new Date(child.birthDate).toLocaleDateString('fr-FR') : null} />
        </View>

        {/* ── Club actuel ── */}
        <View style={s.card}>
          <SectionTitle>Club actuel</SectionTitle>
          <InfoRow label="Club"   value={child.currentClub} />
          <InfoRow label="Niveau" value={child.niveauClub} />
          {child.clubDirectoryId ? (
            <View style={row.wrap}>
              <AureakText variant="caption" style={row.label}>Fiche annuaire</AureakText>
              <Pressable onPress={() => router.push(`/clubs/${child.clubDirectoryId}` as never)}>
                <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 12 }}>Voir la fiche club →</AureakText>
              </Pressable>
            </View>
          ) : (
            <View style={row.wrap}>
              <AureakText variant="caption" style={row.label}>Annuaire</AureakText>
              <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 12 }}>Club non trouvé dans l'annuaire</AureakText>
            </View>
          )}
        </View>

        {/* ── Adresse ── */}
        {(child.adresseRue || child.codePostal || child.localite) && (
          <View style={s.card}>
            <SectionTitle>Adresse</SectionTitle>
            <InfoRow label="Rue"         value={child.adresseRue} />
            <InfoRow label="Code postal" value={child.codePostal} />
            <InfoRow label="Localité"    value={child.localite} />
          </View>
        )}

        {/* ── Parents ── */}
        <View style={s.card}>
          <SectionTitle>Parent 1</SectionTitle>
          <InfoRow label="Nom"       value={child.parent1Nom} />
          <InfoRow label="Téléphone" value={child.parent1Tel} />
          <InfoRow label="Email"     value={child.parent1Email} />
        </View>

        {(child.parent2Nom || child.parent2Tel || child.parent2Email) && (
          <View style={s.card}>
            <SectionTitle>Parent 2</SectionTitle>
            <InfoRow label="Nom"       value={child.parent2Nom} />
            <InfoRow label="Téléphone" value={child.parent2Tel} />
            <InfoRow label="Email"     value={child.parent2Email} />
          </View>
        )}

        {/* ── Notes internes ── */}
        {child.notesInternes && (
          <View style={s.card}>
            <SectionTitle>Notes internes</SectionTitle>
            <AureakText variant="body" style={{ color: colors.text.secondary, fontSize: 13 }}>
              {child.notesInternes}
            </AureakText>
          </View>
        )}

        {/* ── Parcours football (historique par club/saison) ── */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
            <SectionTitle>Parcours football</SectionTitle>
            <Pressable style={s.addBtn} onPress={() => setShowAddHist(true)}>
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>
                + Saison
              </AureakText>
            </Pressable>
          </View>

          {history.length === 0 ? (
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>
              Aucune saison enregistrée.
            </AureakText>
          ) : (
            <View>
              {history.map(h => (
                <View key={h.id} style={s.histRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                      <AureakText variant="body" style={{ fontWeight: '700', fontSize: 13 }}>{h.saison}</AureakText>
                      {h.affilie && <Badge label="Affilié" variant="present" />}
                    </View>
                    <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
                      {h.clubNom}{h.categorie ? ` · ${h.categorie}` : ''}{h.niveau ? ` · ${h.niveau}` : ''}
                    </AureakText>
                    {h.notes && <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11, marginTop: 2 }}>{h.notes}</AureakText>}
                  </View>
                  <Pressable onPress={() => handleDeleteHistory(h.id)} disabled={deletingId === h.id} style={s.deleteBtn}>
                    <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>
                      {deletingId === h.id ? '...' : 'Suppr.'}
                    </AureakText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Métadonnées ── */}
        <View style={s.card}>
          <SectionTitle>Métadonnées</SectionTitle>
          <InfoRow label="Notion ID"  value={child.notionPageId} />
          <InfoRow label="Créé le"    value={child.createdAt ? new Date(child.createdAt).toLocaleDateString('fr-FR') : null} />
          <InfoRow label="Mis à jour" value={child.updatedAt ? new Date(child.updatedAt).toLocaleDateString('fr-FR') : null} />
        </View>

      </ScrollView>

      {showAddHist && (
        <AddHistoryModal
          childId={childId!}
          onClose={() => setShowAddHist(false)}
          onAdded={() => { setShowAddHist(false); loadChild() }}
        />
      )}
    </>
  )
}

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.background.primary },
  content   : { padding: space.xl, gap: space.sm, maxWidth: 820 },
  center    : { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageHeader: { marginBottom: space.sm },

  heroCard  : {
    backgroundColor: colors.background.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '30',
    padding        : space.md,
    marginBottom   : space.xs,
    gap            : space.sm,
  },

  card      : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    padding        : space.md,
    marginBottom   : space.xs,
  },

  addBtn    : {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.sm + 2,
    paddingVertical  : 4,
    borderRadius     : 6,
  },

  histRow   : {
    flexDirection    : 'row',
    alignItems       : 'flex-start',
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc + '40',
    gap              : space.sm,
  },

  deleteBtn : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 5,
    borderWidth      : 1,
    borderColor      : colors.status.attention + '60',
  },
})
