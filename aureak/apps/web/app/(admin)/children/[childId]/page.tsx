'use client'
// Fiche joueur/enfant — child_directory
// Vue admin : statut calculé, badges, historique académie + stages
// Édition inline par section (identité, club, adresse, parent1, parent2, notes)
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, Switch } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getChildDirectoryEntry, updateChildDirectoryEntry,
  listChildDirectoryHistory, addChildHistoryEntry, deleteChildHistoryEntry,
  listClubDirectory,
  getChildAcademyStatus,
  listChildAcademyMemberships,
  listChildStageParticipations,
  listAcademySeasons,
  addChildAcademyMembership,
  removeChildAcademyMembership,
  listStages,
  addChildStageParticipation,
  removeChildStageParticipation,
  listChildInjuries, addChildInjury, deleteChildInjury,
  type UpdateChildDirectoryParams,
  type AddInjuryParams,
} from '@aureak/api-client'

// ── Niveaux de compétition ───────────────────────────────────────────────────

const NIVEAU_COMPETITION = ['Elite 1', 'Elite 2', 'Interprovincial', 'Provincial', 'Régional'] as const

// Saisons football statiques — indépendantes de la DB (académie vs terrain)
const FOOTBALL_SEASONS = [
  '2026-2027', '2025-2026', '2024-2025', '2023-2024', '2022-2023',
  '2021-2022', '2020-2021', '2019-2020', '2018-2019', '2017-2018',
  '2016-2017', '2015-2016', '2014-2015',
]
import { ACADEMY_STATUS_CONFIG, generateAcademyBadges } from '@aureak/business-logic'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { FOOTBALL_AGE_CATEGORIES, FOOTBALL_TEAM_LEVELS } from '@aureak/types'
import type {
  ChildDirectoryEntry,
  ChildDirectoryHistory,
  ChildDirectoryInjury,
  ChildAcademyStatusData,
  ChildAcademyMembership,
  ChildStageParticipation,
  AcademySeason,
  Stage,
} from '@aureak/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type EditSection = 'identite' | 'club' | 'adresse' | 'parent1' | 'parent2' | 'notes'

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <AureakText
      variant="caption"
      style={{
        color        : colors.text.muted,
        fontWeight   : '700',
        letterSpacing: 1.2,
        fontSize     : 10,
        textTransform: 'uppercase' as never,
      }}
    >
      {children}
    </AureakText>
  )
}

// ── Section header with edit link ─────────────────────────────────────────────

function SectionHeader({
  title, onEdit, isEditing,
}: { title: string; onEdit: () => void; isEditing: boolean }) {
  return (
    <View style={sh.row}>
      <SectionTitle>{title}</SectionTitle>
      {!isEditing && (
        <Pressable onPress={onEdit} style={sh.editBtn}>
          <AureakText variant="caption" style={sh.editLabel}>Modifier</AureakText>
        </Pressable>
      )}
    </View>
  )
}
const sh = StyleSheet.create({
  row     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xs },
  editBtn : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  editLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '600' as never },
})

// ── Info row (read-only) ──────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={ir.wrap}>
      <AureakText variant="caption" style={ir.label}>{label}</AureakText>
      <AureakText variant="body" style={ir.value}>{value || '—'}</AureakText>
    </View>
  )
}
const ir = StyleSheet.create({
  wrap : { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border.divider, alignItems: 'center' },
  label: { width: 160, color: colors.text.muted, fontSize: 12 },
  value: { flex: 1, fontSize: 13 },
})

// ── Edit row (text input) ─────────────────────────────────────────────────────

function EditRow({
  label, value, onChange, placeholder, multiline,
}: {
  label      : string
  value      : string
  onChange   : (v: string) => void
  placeholder?: string
  multiline?  : boolean
}) {
  return (
    <View style={[er.wrap, multiline && { alignItems: 'flex-start' }]}>
      <AureakText variant="caption" style={[er.label, multiline && { paddingTop: 8 }] as never}>{label}</AureakText>
      <TextInput
        style={[er.input, multiline && { height: 72, textAlignVertical: 'top' as never }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor={colors.text.muted}
        multiline={multiline}
      />
    </View>
  )
}
const er = StyleSheet.create({
  wrap : { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border.divider, alignItems: 'center' },
  label: { width: 160, color: colors.text.muted, fontSize: 12 },
  input: {
    flex             : 1,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '60',
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    color            : colors.text.dark,
    fontSize         : 13,
  },
})

// ── Edit actions ──────────────────────────────────────────────────────────────

function EditActions({
  saving, onSave, onCancel, error,
}: { saving: boolean; onSave: () => void; onCancel: () => void; error?: string | null }) {
  return (
    <View style={ea.wrap}>
      {error && (
        <AureakText variant="caption" style={ea.error}>{error}</AureakText>
      )}
      <View style={ea.row}>
        <Pressable style={ea.cancel} onPress={onCancel} disabled={saving}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
        </Pressable>
        <Pressable style={[ea.save, saving && { opacity: 0.5 }]} onPress={onSave} disabled={saving}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const ea = StyleSheet.create({
  wrap  : { marginTop: space.sm, gap: 4 },
  row   : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  cancel: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light },
  save  : { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.accent.gold },
  error : { color: colors.status.attention, fontSize: 11, backgroundColor: colors.status.attention + '15', borderRadius: 5, padding: 6, borderWidth: 1, borderColor: colors.status.attention + '40' },
})

// ── Club autocomplete ─────────────────────────────────────────────────────────

function ClubAutocomplete({
  value, onChange,
}: {
  value   : string
  onChange: (nom: string, directoryId: string | null) => void
}) {
  const [input,   setInput]   = useState(value)
  const [results, setResults] = useState<Array<{ id: string; nom: string }>>([])
  const [open,    setOpen]    = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setInput(value) }, [value])

  const handleChange = (text: string) => {
    setInput(text)
    onChange(text, null)
    if (timer.current) clearTimeout(timer.current)
    if (text.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await listClubDirectory({ search: text, pageSize: 8 })
        setResults(data.map(c => ({ id: c.id, nom: c.nom })))
        setOpen(data.length > 0)
      } catch { setResults([]); setOpen(false) }
    }, 300)
  }

  const handleSelect = (club: { id: string; nom: string }) => {
    setInput(club.nom)
    onChange(club.nom, club.id)
    setResults([])
    setOpen(false)
  }

  const handleBlur = () => { setTimeout(() => { setResults([]); setOpen(false) }, 200) }

  return (
    <View style={{ position: 'relative' as never, flex: 1, zIndex: 10 }}>
      <TextInput
        style={er.input}
        value={input}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder="Nom du club…"
        placeholderTextColor={colors.text.muted}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {open && results.length > 0 && (
        <View style={ac.dropdown}>
          {results.map(c => (
            <Pressable key={c.id} style={ac.item} onPress={() => handleSelect(c)}>
              <AureakText variant="caption" style={ac.itemText}>{c.nom}</AureakText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}
const ac = StyleSheet.create({
  dropdown: {
    position       : 'absolute' as never,
    top            : '100%' as never,
    left           : 0,
    right          : 0,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '60',
    borderRadius   : radius.xs,
    zIndex         : 999,
    elevation      : 8,
  },
  item    : { paddingHorizontal: space.sm, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  itemText: { color: colors.text.dark, fontSize: 12 },
})

// ── Niveau de compétition (select pills) ──────────────────────────────────────

function NiveauSelect({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={ns.wrap}>
      {NIVEAU_COMPETITION.map(n => (
        <Pressable
          key={n}
          style={[ns.pill, value === n && ns.pillActive]}
          onPress={() => onChange(value === n ? '' : n)}
        >
          <AureakText variant="caption" style={{ fontSize: 11, color: value === n ? colors.accent.gold : colors.text.muted }}>
            {n}
          </AureakText>
        </Pressable>
      ))}
    </View>
  )
}
const ns = StyleSheet.create({
  wrap     : { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 },
  pill     : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  pillActive: { borderColor: colors.accent.gold, backgroundColor: colors.light.primary },
})

// ── Academy Status Header ─────────────────────────────────────────────────────

function AcademyStatusHeader({ data }: { data: ChildAcademyStatusData }) {
  const cfg    = ACADEMY_STATUS_CONFIG[data.computedStatus]
  const badges = generateAcademyBadges(data)
  return (
    <View style={ast.wrapper}>
      <View style={[ast.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
        <AureakText variant="label" style={{ color: cfg.color, fontWeight: '800', letterSpacing: 1.1, fontSize: 12 }}>
          {cfg.label}
        </AureakText>
      </View>
      {badges.length > 0 && (
        <View style={ast.badgeRow}>
          {badges.map((b, i) => (
            <View key={i} style={ast.badge}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>{b}</AureakText>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
const ast = StyleSheet.create({
  wrapper   : { gap: 10 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeRow  : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge     : { backgroundColor: colors.light.muted, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, paddingHorizontal: 10, paddingVertical: 3 },
})

// ── Historique Section ────────────────────────────────────────────────────────

function HistoriqueSection({
  childId, tenantId, memberships, stageParticipations, seasons, stages, onRefresh,
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
  const [selSeason,   setSelSeason]   = useState('')
  const [selStage,    setSelStage]    = useState('')
  const [saving,      setSaving]      = useState(false)

  const alreadyEnrolledSeasonIds = new Set(memberships.map(m => m.seasonId))
  const alreadyAttendedStageIds  = new Set(stageParticipations.map(p => p.stageId))
  const availableSeasons = seasons.filter(s => !alreadyEnrolledSeasonIds.has(s.id))
  const availableStages  = stages.filter(s  => !alreadyAttendedStageIds.has(s.id))

  const handleAddMembership = async () => {
    if (!selSeason) return
    setSaving(true)
    await addChildAcademyMembership({ tenantId, childId, seasonId: selSeason })
    setAddingMem(false); setSelSeason(''); setSaving(false); onRefresh()
  }

  const handleRemoveMembership = async (id: string) => {
    await removeChildAcademyMembership(id); onRefresh()
  }

  const handleAddStage = async () => {
    if (!selStage) return
    setSaving(true)
    await addChildStageParticipation({ tenantId, childId, stageId: selStage })
    setAddingStage(false); setSelStage(''); setSaving(false); onRefresh()
  }

  const handleRemoveStage = async (id: string) => {
    await removeChildStageParticipation(id); onRefresh()
  }

  return (
    <View style={hst.card}>
      <Pressable style={hst.toggle} onPress={() => setOpen(v => !v)}>
        <AureakText variant="label" style={{ color: colors.accent.gold, letterSpacing: 1, fontSize: 11 }}>
          {open ? '▾ ' : '▸ '}HISTORIQUE
        </AureakText>
      </Pressable>

      {open && (
        <View style={{ gap: space.md }}>

          {/* ACADÉMIE */}
          <View>
            <View style={hst.subHeader}>
              <AureakText variant="caption" style={hst.subTitle}>ACADÉMIE</AureakText>
              {availableSeasons.length > 0 && !addingMem && (
                <Pressable onPress={() => setAddingMem(true)}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11 }}>+ Ajouter</AureakText>
                </Pressable>
              )}
            </View>
            {memberships.length === 0 && !addingMem ? (
              <AureakText variant="caption" style={hst.empty}>Aucune saison académie.</AureakText>
            ) : (
              <View style={hst.list}>
                {[...memberships]
                  .sort((a, b) => (b.season?.label ?? '').localeCompare(a.season?.label ?? ''))
                  .map(m => (
                    <View key={m.id} style={hst.item}>
                      <View style={hst.dot} />
                      <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>
                        {m.season?.label ?? m.seasonId}
                        {m.season?.isCurrent && (
                          <AureakText style={{ color: colors.accent.gold, fontSize: 11 }}> (en cours)</AureakText>
                        )}
                      </AureakText>
                      <Pressable onPress={() => handleRemoveMembership(m.id)} style={hst.removeBtn}>
                        <AureakText variant="caption" style={{ color: colors.status.absent, fontSize: 10 }}>✕</AureakText>
                      </Pressable>
                    </View>
                  ))}
              </View>
            )}
            {addingMem && (
              <View style={hst.addForm}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {availableSeasons.map(s => (
                    <Pressable key={s.id} style={[hst.pill, selSeason === s.id && hst.pillActive]} onPress={() => setSelSeason(s.id)}>
                      <AureakText variant="caption" style={{ fontSize: 11, color: selSeason === s.id ? colors.accent.gold : colors.text.muted }}>{s.label}</AureakText>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Pressable style={hst.cancelBtn} onPress={() => { setAddingMem(false); setSelSeason('') }}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
                  </Pressable>
                  <Pressable style={[hst.saveBtn, !selSeason && { opacity: 0.4 }]} onPress={handleAddMembership} disabled={!selSeason || saving}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>{saving ? '…' : 'Ajouter'}</AureakText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* STAGES */}
          <View>
            <View style={hst.subHeader}>
              <AureakText variant="caption" style={hst.subTitle}>STAGES</AureakText>
              {!addingStage && (
                <Pressable onPress={() => setAddingStage(true)}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11 }}>+ Ajouter</AureakText>
                </Pressable>
              )}
            </View>
            {stageParticipations.length === 0 && !addingStage ? (
              <AureakText variant="caption" style={hst.empty}>Aucun stage.</AureakText>
            ) : (
              <View style={hst.list}>
                {[...stageParticipations]
                  .sort((a, b) => (b.stage?.startDate ?? '').localeCompare(a.stage?.startDate ?? ''))
                  .map(p => (
                    <View key={p.id} style={hst.item}>
                      <View style={[hst.dot, { backgroundColor: '#4FC3F7' }]} />
                      <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>
                        {p.stage?.name ?? p.stageId}
                        {p.stage?.startDate && (
                          <AureakText style={{ color: colors.text.muted, fontSize: 11 }}>
                            {' '}· {new Date(p.stage.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </AureakText>
                        )}
                      </AureakText>
                      <Pressable onPress={() => handleRemoveStage(p.id)} style={hst.removeBtn}>
                        <AureakText variant="caption" style={{ color: colors.status.absent, fontSize: 10 }}>✕</AureakText>
                      </Pressable>
                    </View>
                  ))}
              </View>
            )}
            {addingStage && (
              <View style={hst.addForm}>
                {availableStages.length === 0 ? (
                  <AureakText variant="caption" style={hst.empty}>
                    {stages.length === 0
                      ? 'Aucun stage enregistré dans le système.'
                      : 'Tous les stages disponibles ont déjà été ajoutés.'}
                  </AureakText>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {availableStages.map(s => (
                      <Pressable key={s.id} style={[hst.pill, selStage === s.id && hst.pillActive]} onPress={() => setSelStage(s.id)}>
                        <AureakText variant="caption" style={{ fontSize: 11, color: selStage === s.id ? colors.accent.gold : colors.text.muted }}>{s.name}</AureakText>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Pressable style={hst.cancelBtn} onPress={() => { setAddingStage(false); setSelStage('') }}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
                  </Pressable>
                  {availableStages.length > 0 && (
                    <Pressable style={[hst.saveBtn, !selStage && { opacity: 0.4 }]} onPress={handleAddStage} disabled={!selStage || saving}>
                      <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>{saving ? '…' : 'Ajouter'}</AureakText>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

        </View>
      )}
    </View>
  )
}

const hst = StyleSheet.create({
  card    : { backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.accent.gold + '40', padding: space.md, marginBottom: space.xs },
  toggle  : { paddingBottom: space.sm },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subTitle : { color: colors.text.muted, fontWeight: '700', fontSize: 10, letterSpacing: 0.8 },
  empty    : { color: colors.text.muted, fontStyle: 'italic' as never, fontSize: 12 },
  list    : { gap: 4 },
  item    : { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  dot     : { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent.gold, flexShrink: 0 },
  removeBtn: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.status.absent + '40', alignItems: 'center', justifyContent: 'center' },
  addForm : { backgroundColor: colors.light.muted, borderRadius: 8, padding: space.sm, gap: space.sm, marginTop: space.xs },
  pill    : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.primary },
  pillActive: { borderColor: colors.accent.gold, backgroundColor: colors.light.muted },
  cancelBtn : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light },
  saveBtn   : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, backgroundColor: colors.accent.gold },
})

// ── Blessures section ─────────────────────────────────────────────────────────

const INJURY_TYPE_LABELS: Record<'blessure' | 'grosse_blessure', string> = {
  blessure       : 'Blessure légère',
  grosse_blessure: 'Blessure longue durée',
}

function BlessuresSection({
  childId, tenantId, injuries, onRefresh,
}: {
  childId  : string
  tenantId : string
  injuries : ChildDirectoryInjury[]
  onRefresh: () => void
}) {
  const [adding,      setAdding]      = useState(false)
  const [type,        setType]        = useState<'blessure' | 'grosse_blessure'>('blessure')
  const [zone,        setZone]        = useState('')
  const [dateDebut,   setDateDebut]   = useState('')
  const [dateFin,     setDateFin]     = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  const resetForm = () => {
    setType('blessure'); setZone(''); setDateDebut('')
    setDateFin(''); setCommentaire(''); setError(null)
  }

  const handleAdd = async () => {
    setSaving(true); setError(null)
    try {
      await addChildInjury({
        tenantId, childId, type,
        zone       : zone        || null,
        dateDebut  : dateDebut   || null,
        dateFin    : dateFin     || null,
        commentaire: commentaire || null,
      } satisfies AddInjuryParams)
      resetForm(); setAdding(false); onRefresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await deleteChildInjury(id); onRefresh() } catch { /* ignore */ }
    setDeletingId(null)
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return iso }
  }

  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
        <SectionTitle>Blessures</SectionTitle>
        {!adding && (
          <Pressable style={s.addBtn} onPress={() => setAdding(true)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>
              + Ajouter
            </AureakText>
          </Pressable>
        )}
      </View>

      {injuries.length === 0 && !adding && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
          Aucune blessure enregistrée.
        </AureakText>
      )}

      {injuries.length > 0 && (
        <View style={{ gap: 4, marginBottom: adding ? space.sm : 0 }}>
          {injuries.map(inj => (
            <View key={inj.id} style={blss.row}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' as never }}>
                  <View style={[blss.typeBadge, inj.type === 'grosse_blessure' && blss.typeBadgeSevere]}>
                    <AureakText variant="caption" style={{ fontSize: 10, color: inj.type === 'grosse_blessure' ? '#B91C1C' : '#9A3412' }}>
                      {inj.type === 'grosse_blessure' ? '⚠ Longue durée' : 'Légère'}
                    </AureakText>
                  </View>
                  {inj.zone && (
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>{inj.zone}</AureakText>
                  )}
                </View>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 2 }}>
                  {formatDate(inj.dateDebut) ?? '—'} → {inj.dateFin ? formatDate(inj.dateFin) : 'en cours'}
                </AureakText>
                {inj.commentaire && (
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 2 }}>{inj.commentaire}</AureakText>
                )}
              </View>
              <Pressable onPress={() => handleDelete(inj.id)} disabled={deletingId === inj.id} style={s.deleteBtn}>
                <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>
                  {deletingId === inj.id ? '...' : 'Suppr.'}
                </AureakText>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {adding && (
        <View style={blss.form}>
          {error && (
            <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>{error}</AureakText>
          )}

          {/* Type */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' as never }}>
            {(['blessure', 'grosse_blessure'] as const).map(t => (
              <Pressable key={t} style={[blss.typePill, type === t && blss.typePillActive]} onPress={() => setType(t)}>
                <AureakText variant="caption" style={{ fontSize: 11, color: type === t ? colors.accent.gold : colors.text.muted }}>
                  {INJURY_TYPE_LABELS[t]}
                </AureakText>
              </Pressable>
            ))}
          </View>

          <EditRow label="Zone / Nature" value={zone} onChange={setZone} placeholder="ex: cheville gauche, genou…" />
          <EditRow label="Date début" value={dateDebut} onChange={setDateDebut} placeholder="YYYY-MM-DD" />
          <EditRow label="Date fin" value={dateFin} onChange={setDateFin} placeholder="YYYY-MM-DD (vide = en cours)" />
          <EditRow label="Commentaire" value={commentaire} onChange={setCommentaire} placeholder="Notes optionnelles…" multiline />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, marginTop: space.xs }}>
            <Pressable style={hst.cancelBtn} onPress={() => { resetForm(); setAdding(false) }}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
            </Pressable>
            <Pressable style={[hst.saveBtn, saving && { opacity: 0.5 }]} onPress={handleAdd} disabled={saving}>
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>{saving ? '…' : 'Enregistrer'}</AureakText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const blss = StyleSheet.create({
  row         : { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  typeBadge   : { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
  typeBadgeSevere: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  form        : { backgroundColor: colors.light.muted, borderRadius: 8, padding: space.sm, gap: 4, marginTop: space.sm, borderWidth: 1, borderColor: colors.border.light },
  typePill    : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.primary },
  typePillActive: { borderColor: colors.accent.gold, backgroundColor: colors.light.muted },
})

// ── Football history modal ────────────────────────────────────────────────────

function AddHistoryModal({
  childId, tenantId, onClose, onAdded,
}: {
  childId : string
  tenantId: string
  onClose : () => void
  onAdded : () => void
}) {
  const [saison,    setSaison]    = useState('')
  const [clubNom,   setClubNom]   = useState('')
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
        tenantId, childId, saison: saison.trim(), clubNom: clubNom.trim(),
        niveau: niveau || null,
        affilie, notes: notes || null,
      })
      onAdded()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
      setSaving(false)
    }
  }

  const seasonSuggestions = FOOTBALL_SEASONS

  return (
    <View style={mst.overlay}>
      <View style={mst.box}>
        <AureakText variant="h3" style={{ marginBottom: space.md }}>Ajouter une saison football</AureakText>
        {error && <View style={mst.errorBox}><AureakText variant="caption" style={{ color: colors.status.attention }}>{error}</AureakText></View>}

        {/* Saison — pills des saisons connues + saisie libre */}
        <AureakText variant="caption" style={mst.fieldLabel}>Saison *</AureakText>
        {seasonSuggestions.length > 0 && (
          <View style={[mst.selectRow, { marginBottom: 6 }]}>
            {seasonSuggestions.map(label => (
              <Pressable
                key={label}
                style={[mst.pill, saison === label && mst.pillActive]}
                onPress={() => setSaison(prev => prev === label ? '' : label)}
              >
                <AureakText variant="caption" style={{ fontSize: 10, color: saison === label ? colors.accent.gold : colors.text.muted }}>{label}</AureakText>
              </Pressable>
            ))}
          </View>
        )}
        <TextInput
          style={mst.input}
          value={saison}
          onChangeText={setSaison}
          placeholder="ou saisir manuellement ex: 2024-2025"
          placeholderTextColor={colors.text.muted}
          autoComplete="off"
          autoCorrect={false}
        />

        {/* Club — autocomplete annuaire */}
        <AureakText variant="caption" style={mst.fieldLabel}>Club *</AureakText>
        <View style={{ zIndex: 20 }}>
          <ClubAutocomplete
            value={clubNom}
            onChange={(nom) => setClubNom(nom)}
          />
        </View>

        {/* Niveau — menu pills fixes */}
        <AureakText variant="caption" style={mst.fieldLabel}>Niveau</AureakText>
        <NiveauSelect value={niveau} onChange={setNiveau} />

        {/* Affilié */}
        <View style={[mst.row, { marginTop: space.sm }]}>
          <AureakText variant="caption" style={{ flex: 1 }}>Affilié ACFF/VV</AureakText>
          <Switch value={affilie} onValueChange={setAffilie} />
        </View>

        {/* Notes */}
        <AureakText variant="caption" style={mst.fieldLabel}>Notes</AureakText>
        <TextInput
          style={[mst.input, { height: 64, textAlignVertical: 'top' as never }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Remarques optionnelles…"
          placeholderTextColor={colors.text.muted}
        />

        <View style={mst.actions}>
          <Pressable style={mst.cancelBtn} onPress={onClose}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
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
  box       : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.xl, width: 560, maxHeight: '90vh' as never, overflowY: 'auto' as never, borderWidth: 1, borderColor: colors.border.light },
  fieldLabel: { color: colors.text.muted, marginBottom: 4, marginTop: space.sm, fontSize: 11 },
  input     : { backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, paddingHorizontal: space.sm, paddingVertical: space.xs + 2, color: colors.text.dark, fontSize: 13 },
  selectRow : { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: space.xs },
  pill      : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  pillActive: { borderColor: colors.accent.gold, backgroundColor: colors.light.primary },
  row       : { flexDirection: 'row', alignItems: 'center' },
  actions   : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, marginTop: space.md },
  cancelBtn : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light },
  saveBtn   : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, backgroundColor: colors.accent.gold },
  errorBox  : { backgroundColor: colors.status.attention + '20', borderRadius: 6, padding: space.sm, marginBottom: space.sm, borderWidth: 1, borderColor: colors.status.attention },
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
  const [injuries,     setInjuries]     = useState<ChildDirectoryInjury[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showAddHist,  setShowAddHist]  = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editSection, setEditSection] = useState<EditSection | null>(null)
  const [draft,       setDraft]       = useState<Partial<ChildDirectoryEntry>>({})
  const [savingEdit,  setSavingEdit]  = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)
  const [togglingActif, setTogglingActif] = useState(false)

  const loadChild = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const [entryR, histR, acStatusR, memsR, stPartsR, seasonsR, stageListR, injuriesR] = await Promise.allSettled([
        getChildDirectoryEntry(childId),
        listChildDirectoryHistory(childId),
        getChildAcademyStatus(childId),
        listChildAcademyMemberships(childId),
        listChildStageParticipations(childId),
        listAcademySeasons(),
        listStages(),
        listChildInjuries(childId),
      ])

      const entry     = entryR.status     === 'fulfilled' ? entryR.value     : null
      const hist      = histR.status      === 'fulfilled' ? histR.value      : []
      const acStatus  = acStatusR.status  === 'fulfilled' ? acStatusR.value  : { data: null, error: null }
      const mems      = memsR.status      === 'fulfilled' ? memsR.value      : { data: [], error: null }
      const stParts   = stPartsR.status   === 'fulfilled' ? stPartsR.value   : { data: [], error: null }
      const seasons   = seasonsR.status   === 'fulfilled' ? seasonsR.value   : { data: [], error: null }
      const stageList = stageListR.status === 'fulfilled' ? stageListR.value : []
      const injList   = injuriesR.status  === 'fulfilled' ? injuriesR.value  : []

      setChild(entry)
      setHistory(hist)
      setAcademyData(acStatus.data)
      setMemberships(mems.data)
      setStages_(stParts.data)
      setAllSeasons(seasons.data)
      setAllStages(stageList as Stage[])
      setInjuries(injList)
    } catch (e) {
      console.error('[ChildDetailPage] loadChild error', e)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { loadChild() }, [loadChild])

  // ── Edit helpers ────────────────────────────────────────────────────────────

  const startEdit = (section: EditSection) => {
    if (!child) return
    setEditSection(section)
    setDraft({ ...child })
    setSaveError(null)
  }

  const cancelEdit = () => {
    setEditSection(null)
    setDraft({})
    setSaveError(null)
  }

  const saveEdit = async (fields: UpdateChildDirectoryParams) => {
    if (!child) return
    setSavingEdit(true)
    setSaveError(null)
    try {
      await updateChildDirectoryEntry(child.id, fields)
      setChild(prev => prev ? { ...prev, ...fields } : prev)
      setEditSection(null)
      setDraft({})
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    }
    setSavingEdit(false)
  }

  const handleToggleActif = async () => {
    if (!child || togglingActif) return
    setTogglingActif(true)
    const newActif = !child.actif
    try {
      await updateChildDirectoryEntry(child.id, { actif: newActif })
      setChild(prev => prev ? { ...prev, actif: newActif } : prev)
    } catch { /* ignore */ }
    setTogglingActif(false)
  }

  // ── Section saves ───────────────────────────────────────────────────────────

  const saveIdentite = () => saveEdit({
    displayName: draft.displayName || child!.displayName,
    birthDate  : draft.birthDate   ?? null,
  })

  const saveClub = () => saveEdit({
    currentClub    : draft.currentClub     ?? null,
    niveauClub     : draft.niveauClub      ?? null,
    clubDirectoryId: draft.clubDirectoryId ?? null,
  })

  const saveAdresse = () => saveEdit({
    adresseRue: draft.adresseRue ?? null,
    codePostal: draft.codePostal ?? null,
    localite  : draft.localite   ?? null,
  })

  const saveParent1 = () => saveEdit({
    parent1Nom  : draft.parent1Nom   ?? null,
    parent1Tel  : draft.parent1Tel   ?? null,
    parent1Email: draft.parent1Email ?? null,
  })

  const saveParent2 = () => saveEdit({
    parent2Nom  : draft.parent2Nom   ?? null,
    parent2Tel  : draft.parent2Tel   ?? null,
    parent2Email: draft.parent2Email ?? null,
  })

  const saveNotes = () => saveEdit({
    notesInternes: draft.notesInternes ?? null,
  })

  // ── History ─────────────────────────────────────────────────────────────────

  const handleDeleteHistory = async (id: string) => {
    setDeletingId(id)
    await deleteChildHistoryEntry(id)
    setHistory(prev => prev.filter(h => h.id !== id))
    setDeletingId(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.center}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      </View>
    )
  }

  if (!child) {
    return (
      <View style={s.center}>
        <AureakText variant="h3" style={{ color: colors.text.muted }}>Joueur introuvable</AureakText>
        <Pressable onPress={() => router.back()} style={{ marginTop: space.md }}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  const isEditing = (sec: EditSection) => editSection === sec

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        {/* ── Navigation ── */}
        <View style={s.pageHeader}>
          <Pressable onPress={() => router.back()}>
            <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
          </Pressable>
        </View>

        {/* ── Hero : nom + statut calculé + toggle actif ── */}
        <View style={s.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: space.sm }}>
            <View style={{ flex: 1 }}>
              <AureakText variant="h2" color={colors.accent.gold}>{child.displayName}</AureakText>
              {child.birthDate && (
                <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
                  {new Date(child.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </AureakText>
              )}
            </View>
            {/* Toggle actif/inactif cliquable */}
            <Pressable onPress={handleToggleActif} disabled={togglingActif} style={s.actifToggle}>
              <View style={[s.actifDot, { backgroundColor: child.actif ? '#10B981' : '#9E9E9E' }]} />
              <AureakText variant="caption" style={{ color: child.actif ? '#10B981' : colors.text.muted, fontSize: 11, fontWeight: '600' }}>
                {child.actif ? 'Actif' : 'Inactif'}
              </AureakText>
            </Pressable>
          </View>

          {/* Statut académie calculé */}
          {academyData ? (
            <AcademyStatusHeader data={academyData} />
          ) : (
            <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              {child.statut && <Badge label={child.statut} variant="zinc" />}
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                (statut importé Notion — en attente de calcul)
              </AureakText>
            </View>
          )}
        </View>

        {/* ── HISTORIQUE : académie + stages ── */}
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
          <SectionHeader title="Identité" onEdit={() => startEdit('identite')} isEditing={isEditing('identite')} />
          {isEditing('identite') ? (
            <>
              <EditRow
                label="Nom complet"
                value={draft.displayName ?? ''}
                onChange={v => setDraft(d => ({ ...d, displayName: v }))}
                placeholder="Prénom Nom"
              />
              <EditRow
                label="Date de naissance"
                value={draft.birthDate ?? ''}
                onChange={v => setDraft(d => ({ ...d, birthDate: v || null }))}
                placeholder="YYYY-MM-DD"
              />
              <EditActions saving={savingEdit} onSave={saveIdentite} onCancel={cancelEdit} error={saveError} />
            </>
          ) : (
            <>
              <InfoRow label="Nom complet"       value={child.displayName} />
              <InfoRow label="Date de naissance" value={child.birthDate ? new Date(child.birthDate).toLocaleDateString('fr-FR') : null} />
            </>
          )}
        </View>

        {/* ── Club actuel ── */}
        <View style={s.card}>
          <SectionHeader title="Club actuel" onEdit={() => startEdit('club')} isEditing={isEditing('club')} />
          {isEditing('club') ? (
            <>
              <View style={[er.wrap, { alignItems: 'flex-start' }]}>
                <AureakText variant="caption" style={[er.label, { paddingTop: 8 }] as never}>Club</AureakText>
                <ClubAutocomplete
                  value={draft.currentClub ?? ''}
                  onChange={(nom, directoryId) => setDraft(d => ({ ...d, currentClub: nom || null, clubDirectoryId: directoryId }))}
                />
              </View>
              <View style={[er.wrap, { alignItems: 'flex-start' }]}>
                <AureakText variant="caption" style={[er.label, { paddingTop: 8 }] as never}>Niveau</AureakText>
                <NiveauSelect
                  value={draft.niveauClub ?? ''}
                  onChange={v => setDraft(d => ({ ...d, niveauClub: v || null }))}
                />
              </View>
              <EditActions saving={savingEdit} onSave={saveClub} onCancel={cancelEdit} error={saveError} />
            </>
          ) : (
            <>
              <InfoRow label="Club"   value={child.currentClub} />
              <InfoRow label="Niveau" value={child.niveauClub} />
              {child.clubDirectoryId ? (
                <View style={ir.wrap}>
                  <AureakText variant="caption" style={ir.label}>Fiche annuaire</AureakText>
                  <Pressable onPress={() => router.push(`/clubs/${child.clubDirectoryId}` as never)}>
                    <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 12 }}>Voir la fiche club →</AureakText>
                  </Pressable>
                </View>
              ) : (
                <View style={ir.wrap}>
                  <AureakText variant="caption" style={ir.label}>Annuaire</AureakText>
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>Club non trouvé dans l'annuaire</AureakText>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Adresse (toujours visible) ── */}
        <View style={s.card}>
          <SectionHeader title="Adresse" onEdit={() => startEdit('adresse')} isEditing={isEditing('adresse')} />
          {isEditing('adresse') ? (
            <>
              <EditRow
                label="Rue"
                value={draft.adresseRue ?? ''}
                onChange={v => setDraft(d => ({ ...d, adresseRue: v || null }))}
                placeholder="Rue et numéro"
              />
              <EditRow
                label="Code postal"
                value={draft.codePostal ?? ''}
                onChange={v => setDraft(d => ({ ...d, codePostal: v || null }))}
                placeholder="ex: 1000"
              />
              <EditRow
                label="Localité"
                value={draft.localite ?? ''}
                onChange={v => setDraft(d => ({ ...d, localite: v || null }))}
                placeholder="Ville"
              />
              <EditActions saving={savingEdit} onSave={saveAdresse} onCancel={cancelEdit} error={saveError} />
            </>
          ) : (
            <>
              <InfoRow label="Rue"         value={child.adresseRue} />
              <InfoRow label="Code postal" value={child.codePostal} />
              <InfoRow label="Localité"    value={child.localite} />
            </>
          )}
        </View>

        {/* ── Parent 1 ── */}
        <View style={s.card}>
          <SectionHeader title="Parent 1" onEdit={() => startEdit('parent1')} isEditing={isEditing('parent1')} />
          {isEditing('parent1') ? (
            <>
              <EditRow
                label="Nom"
                value={draft.parent1Nom ?? ''}
                onChange={v => setDraft(d => ({ ...d, parent1Nom: v || null }))}
                placeholder="Prénom Nom"
              />
              <EditRow
                label="Téléphone"
                value={draft.parent1Tel ?? ''}
                onChange={v => setDraft(d => ({ ...d, parent1Tel: v || null }))}
                placeholder="+32 xxx xx xx xx"
              />
              <EditRow
                label="Email"
                value={draft.parent1Email ?? ''}
                onChange={v => setDraft(d => ({ ...d, parent1Email: v || null }))}
                placeholder="email@exemple.be"
              />
              <EditActions saving={savingEdit} onSave={saveParent1} onCancel={cancelEdit} error={saveError} />
            </>
          ) : (
            <>
              <InfoRow label="Nom"       value={child.parent1Nom} />
              <InfoRow label="Téléphone" value={child.parent1Tel} />
              <InfoRow label="Email"     value={child.parent1Email} />
            </>
          )}
        </View>

        {/* ── Parent 2 ── */}
        <View style={s.card}>
          <SectionHeader title="Parent 2" onEdit={() => startEdit('parent2')} isEditing={isEditing('parent2')} />
          {isEditing('parent2') ? (
            <>
              <EditRow
                label="Nom"
                value={draft.parent2Nom ?? ''}
                onChange={v => setDraft(d => ({ ...d, parent2Nom: v || null }))}
                placeholder="Prénom Nom"
              />
              <EditRow
                label="Téléphone"
                value={draft.parent2Tel ?? ''}
                onChange={v => setDraft(d => ({ ...d, parent2Tel: v || null }))}
                placeholder="+32 xxx xx xx xx"
              />
              <EditRow
                label="Email"
                value={draft.parent2Email ?? ''}
                onChange={v => setDraft(d => ({ ...d, parent2Email: v || null }))}
                placeholder="email@exemple.be"
              />
              <EditActions saving={savingEdit} onSave={saveParent2} onCancel={cancelEdit} error={saveError} />
            </>
          ) : (
            <>
              <InfoRow label="Nom"       value={child.parent2Nom} />
              <InfoRow label="Téléphone" value={child.parent2Tel} />
              <InfoRow label="Email"     value={child.parent2Email} />
            </>
          )}
        </View>

        {/* ── Notes internes (toujours visible) ── */}
        <View style={s.card}>
          <SectionHeader title="Notes internes" onEdit={() => startEdit('notes')} isEditing={isEditing('notes')} />
          {isEditing('notes') ? (
            <>
              <EditRow
                label="Notes"
                value={draft.notesInternes ?? ''}
                onChange={v => setDraft(d => ({ ...d, notesInternes: v || null }))}
                placeholder="Remarques internes…"
                multiline
              />
              <EditActions saving={savingEdit} onSave={saveNotes} onCancel={cancelEdit} error={saveError} />
            </>
          ) : (
            child.notesInternes ? (
              <AureakText variant="body" style={{ color: colors.text.muted, fontSize: 13, lineHeight: 20 }}>
                {child.notesInternes}
              </AureakText>
            ) : (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
                Aucune note.
              </AureakText>
            )
          )}
        </View>

        {/* ── Parcours football ── */}
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
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
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
                    <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
                      {h.clubNom}{h.categorie ? ` · ${h.categorie}` : ''}{h.niveau ? ` · ${h.niveau}` : ''}
                    </AureakText>
                    {h.notes && (
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 2 }}>{h.notes}</AureakText>
                    )}
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

        {/* ── Blessures ── */}
        {tenantId && (
          <BlessuresSection
            childId={childId!}
            tenantId={tenantId}
            injuries={injuries}
            onRefresh={loadChild}
          />
        )}

        {/* ── Métadonnées ── */}
        <View style={s.card}>
          <SectionTitle>Métadonnées</SectionTitle>
          <InfoRow label="Créé le"    value={child.createdAt ? new Date(child.createdAt).toLocaleDateString('fr-FR') : null} />
          <InfoRow label="Mis à jour" value={child.updatedAt ? new Date(child.updatedAt).toLocaleDateString('fr-FR') : null} />
        </View>

      </ScrollView>

      {showAddHist && tenantId && (
        <AddHistoryModal
          childId={childId!}
          tenantId={tenantId}
          onClose={() => setShowAddHist(false)}
          onAdded={() => { setShowAddHist(false); loadChild() }}
        />
      )}
    </>
  )
}

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.xl, gap: space.sm, maxWidth: 820 },
  center    : { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageHeader: { marginBottom: space.sm },

  heroCard  : {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '30',
    padding        : space.md,
    marginBottom   : space.xs,
    gap            : space.sm,
    ...shadows.sm,
  },

  actifToggle: {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : 5,
    paddingHorizontal: 10,
    paddingVertical  : 5,
    borderRadius  : 20,
    borderWidth   : 1,
    borderColor   : colors.border.light,
    backgroundColor: colors.light.muted,
  },
  actifDot: {
    width       : 7,
    height      : 7,
    borderRadius: 4,
  },

  card      : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    marginBottom   : space.xs,
    ...shadows.sm,
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
    borderBottomColor: colors.border.divider,
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
