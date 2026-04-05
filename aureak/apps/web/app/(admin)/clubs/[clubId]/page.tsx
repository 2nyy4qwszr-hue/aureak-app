import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getClubDirectoryEntry, updateClubDirectoryEntry, softDeleteClubDirectoryEntry,
  listChildrenOfClub, linkChildToClubDirectory, unlinkChildFromClubDirectory,
  listCoachesOfClub, linkCoachToClubDirectory, unlinkCoachFromClubDirectory,
  listChildDirectory,
  listAvailableCoaches,
  uploadClubLogo, deleteClubLogo,
  listChildrenByClubDirectoryId,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText, Badge, HierarchyBreadcrumb, ConfirmDialog, ListRowSkeleton } from '@aureak/ui'
import { colors, space, shadows } from '@aureak/theme'
import type { ClubDirectoryEntry, BelgianProvince, ClubChildLinkType, ClubRelationType } from '@aureak/types'
import { BELGIAN_PROVINCES, CLUB_RELATION_TYPE_LABELS } from '@aureak/types'
import { RelationTypeSelector } from '../_components'
import RbfaStatusBadge from '../_components/RbfaStatusBadge'
import type { ClubChildLinkRow } from '@aureak/api-client'
import { useToast } from '../../../../components/ToastContext'

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, count, accent, children }: {
  title   : string
  count?  : number
  accent? : string
  children: React.ReactNode
}) {
  return (
    <View style={sec.container}>
      <View style={[sec.header, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : {}]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AureakText variant="label" style={{ color: colors.text.muted, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' as never }}>
            {title}
          </AureakText>
          {count !== undefined && (
            <View style={[sec.countBadge, accent ? { backgroundColor: accent + '20', borderColor: accent } : {}]}>
              <AureakText variant="caption" style={{ fontSize: 10, color: accent ?? colors.text.muted, fontWeight: '700' }}>
                {count}
              </AureakText>
            </View>
          )}
        </View>
      </View>
      <View style={sec.body}>{children}</View>
    </View>
  )
}
const sec = StyleSheet.create({
  container : { backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden' },
  header    : { paddingHorizontal: space.md, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border.divider, backgroundColor: colors.light.muted },
  countBadge: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light },
  body      : { padding: space.md, gap: space.sm },
})

// ── Field display ────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={f.row}>
      <AureakText variant="caption" style={f.label}>{label}</AureakText>
      <AureakText variant="body" style={f.value}>{value || '—'}</AureakText>
    </View>
  )
}
const f = StyleSheet.create({
  row  : { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  label: { width: 200, color: colors.text.muted, fontSize: 12, flexShrink: 0 },
  value: { flex: 1, color: colors.text.dark, fontSize: 13 },
})

// ── Editable field ────────────────────────────────────────────────────────────

function EditField({ label, value, onChange, multiline }: {
  label    : string
  value    : string
  onChange : (v: string) => void
  multiline?: boolean
}) {
  return (
    <View style={ef.wrapper}>
      <AureakText variant="caption" style={ef.label}>{label}</AureakText>
      <TextInput
        style={[ef.input, multiline && ef.textarea]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={colors.text.muted}
      />
    </View>
  )
}
const ef = StyleSheet.create({
  wrapper : { gap: 4 },
  label   : { color: colors.text.muted, fontSize: 11 },
  input   : { backgroundColor: colors.light.primary, borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: space.xs + 2, color: colors.text.dark, fontSize: 13 },
  textarea: { minHeight: 80, textAlignVertical: 'top' as never },
})

// ── Province selector ────────────────────────────────────────────────────────

function ProvinceSelector({ value, onChange }: { value: BelgianProvince | null; onChange: (v: BelgianProvince | null) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>Province</AureakText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Pressable style={[pill.base, value === null && pill.active]} onPress={() => onChange(null)}>
          <AureakText variant="caption" style={{ color: value === null ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>—</AureakText>
        </Pressable>
        {BELGIAN_PROVINCES.map(p => (
          <Pressable key={p} style={[pill.base, value === p && pill.active]} onPress={() => onChange(p)}>
            <AureakText variant="caption" style={{ color: value === p ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>{p}</AureakText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
const pill = StyleSheet.create({
  base  : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  active: { borderColor: colors.accent.gold, backgroundColor: colors.light.muted },
})

// ── Statut badge ─────────────────────────────────────────────────────────────

const RELATION_BADGE_VARIANTS: Record<Exclude<ClubRelationType, 'normal'>, 'gold' | 'light'> = {
  partenaire: 'gold',
  associe   : 'light',
}

const STATUT_COLORS: Record<string, string> = {
  'Académicien': colors.accent.gold,
  'Nouveau'    : colors.entity.stage,
  'Stagiaire'  : colors.status.info,
  'Ancien'     : colors.text.muted,
}

function StatutBadge({ statut }: { statut: string | null }) {
  if (!statut) return null
  const color = STATUT_COLORS[statut] ?? colors.text.muted
  return (
    <View style={{ backgroundColor: color + '20', borderColor: color, borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 }}>
      <AureakText variant="caption" style={{ color, fontSize: 9, fontWeight: '700' }}>{statut.toUpperCase()}</AureakText>
    </View>
  )
}

// ── Player row in a club section ──────────────────────────────────────────────

function PlayerRow({ row, onRemove }: { row: ClubChildLinkRow; onRemove: () => void }) {
  return (
    <View style={pr.row}>
      {/* Avatar initials */}
      <View style={pr.avatar}>
        <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 11 }}>
          {(row.displayName ?? '?').charAt(0).toUpperCase()}
        </AureakText>
      </View>

      {/* Name + meta */}
      <View style={{ flex: 1, gap: 2 }}>
        <AureakText variant="body" style={{ fontSize: 13, fontWeight: '600' }}>
          {row.displayName ?? row.childId.slice(0, 8) + '…'}
        </AureakText>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {row.statut && <StatutBadge statut={row.statut} />}
          {row.niveauClub && (
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
              {row.niveauClub}
            </AureakText>
          )}
        </View>
      </View>

      <Pressable onPress={onRemove} style={pr.removeBtn}>
        <AureakText variant="caption" style={{ color: colors.accent.red, fontSize: 11 }}>Retirer</AureakText>
      </Pressable>
    </View>
  )
}
const pr = StyleSheet.create({
  row      : { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  avatar   : { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent.gold, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  removeBtn: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: colors.border.light },
})

// ── Player picker (searchable) ────────────────────────────────────────────────

type PlayerOption = { id: string; displayName: string; statut: string | null; niveauClub: string | null }

function PlayerPicker({
  players,
  excludeIds,
  onSelect,
  accent,
}: {
  players   : PlayerOption[]
  excludeIds: Set<string>
  onSelect  : (p: PlayerOption) => void
  accent    : string
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return players
      .filter(p => !excludeIds.has(p.id))
      .filter(p => !q || p.displayName.toLowerCase().includes(q))
      .slice(0, 8)
  }, [players, excludeIds, search])

  return (
    <View style={pp.container}>
      <TextInput
        style={pp.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un joueur par nom…"
        placeholderTextColor={colors.text.muted}
        autoComplete={'off' as never}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        {...(Platform.OS === 'web' ? { type: 'search', 'data-form-type': 'other' } as never : {})}
      />
      {search.length > 0 && (
        <View style={pp.results}>
          {filtered.length === 0 ? (
            <AureakText variant="caption" style={{ color: colors.text.muted, padding: space.sm }}>
              Aucun résultat.
            </AureakText>
          ) : (
            filtered.map(p => (
              <Pressable
                key={p.id}
                style={pp.option}
                onPress={() => { onSelect(p); setSearch('') }}
              >
                <View style={{ flex: 1 }}>
                  <AureakText variant="body" style={{ fontSize: 13 }}>{p.displayName}</AureakText>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                    {p.statut && <StatutBadge statut={p.statut} />}
                    {p.niveauClub && (
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                        {p.niveauClub}
                      </AureakText>
                    )}
                  </View>
                </View>
                <View style={[pp.addDot, { backgroundColor: accent }]}>
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 14, lineHeight: 18 }}>+</AureakText>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  )
}
const pp = StyleSheet.create({
  container: { gap: 4 },
  input    : { backgroundColor: colors.light.primary, borderWidth: 1, borderColor: colors.border.light, borderRadius: 7, paddingHorizontal: space.md, paddingVertical: space.xs + 2, color: colors.text.dark, fontSize: 13 },
  results  : { backgroundColor: colors.light.muted, borderRadius: 7, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden' },
  option   : { flexDirection: 'row', alignItems: 'center', padding: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  addDot   : { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
})

// ── Coach row ─────────────────────────────────────────────────────────────────

function CoachRow({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <View style={pr.row}>
      <View style={[pr.avatar, { backgroundColor: colors.status.info }]}>
        <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 11 }}>
          {name.charAt(0).toUpperCase()}
        </AureakText>
      </View>
      <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>{name}</AureakText>
      <Pressable onPress={onRemove} style={pr.removeBtn}>
        <AureakText variant="caption" style={{ color: colors.accent.red, fontSize: 11 }}>Retirer</AureakText>
      </Pressable>
    </View>
  )
}

// ── Annuaire player row (read-only — liaison implicite club_directory_id) ─────

function AnnuairePlayerRow({ player }: { player: { id: string; displayName: string; statut: string | null; niveauClub: string | null } }) {
  return (
    <View style={pr.row}>
      <View style={[pr.avatar, { backgroundColor: colors.status.injured }]}>
        <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 11 }}>
          {player.displayName.charAt(0).toUpperCase()}
        </AureakText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AureakText variant="body" style={{ fontSize: 13, fontWeight: '600' }}>
          {player.displayName}
        </AureakText>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {player.statut && <StatutBadge statut={player.statut} />}
          {player.niveauClub && (
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
              {player.niveauClub}
            </AureakText>
          )}
        </View>
      </View>
      {/* Read-only — pas de bouton Retirer */}
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, fontStyle: 'italic' as never }}>
        via annuaire
      </AureakText>
    </View>
  )
}

// ── EditForm type ────────────────────────────────────────────────────────────

type EditForm = {
  nom: string; matricule: string; label: string; province: BelgianProvince | null
  adresseRue: string; codePostal: string; ville: string; siteInternet: string
  correspondant: string; emailPrincipal: string; telephonePrincipal: string
  responsableSportif: string; emailResponsableSportif: string; telephoneResponsableSportif: string
  clubRelationType: ClubRelationType; actif: boolean; notesInternes: string
}

function entryToForm(e: ClubDirectoryEntry): EditForm {
  return {
    nom: e.nom, matricule: e.matricule ?? '', label: e.label ?? '', province: e.province ?? null,
    adresseRue: e.adresseRue ?? '', codePostal: e.codePostal ?? '', ville: e.ville ?? '', siteInternet: e.siteInternet ?? '',
    correspondant: e.correspondant ?? '', emailPrincipal: e.emailPrincipal ?? '', telephonePrincipal: e.telephonePrincipal ?? '',
    responsableSportif: e.responsableSportif ?? '', emailResponsableSportif: e.emailResponsableSportif ?? '', telephoneResponsableSportif: e.telephoneResponsableSportif ?? '',
    clubRelationType: e.clubRelationType, actif: e.actif, notesInternes: e.notesInternes ?? '',
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClubDetailPage() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>()
  const router     = useRouter()
  const tenantId   = useAuthStore((s) => s.tenantId)
  const user       = useAuthStore((s) => s.user)

  const toast = useToast()

  const [club,           setClub]           = useState<ClubDirectoryEntry | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [editing,        setEditing]        = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [form,           setForm]           = useState<EditForm | null>(null)
  const [logoFile,       setLogoFile]       = useState<File | null>(null)
  const [logoPreview,    setLogoPreview]    = useState<string | null>(null)
  const [logoUploading,  setLogoUploading]  = useState(false)
  const [optimisticActif, setOptimisticActif] = useState<boolean | null>(null)
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)

  // Loading state for links (players + coaches)
  const [loadingLinks, setLoadingLinks] = useState(true)

  // Players split by type
  const [currentPlayers,    setCurrentPlayers]    = useState<ClubChildLinkRow[]>([])
  const [affiliatedPlayers, setAffiliatedPlayers] = useState<ClubChildLinkRow[]>([])

  // Coach links
  const [coaches, setCoaches] = useState<{ coachId: string; displayName: string | null; createdAt: string }[]>([])

  // All available players/coaches for the picker
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([])
  const [allCoaches, setAllCoaches] = useState<{ id: string; name: string }[]>([])

  // Annuaire players (implicit link via club_directory_id)
  const [annuairePlayers, setAnnuairePlayers] = useState<Array<{ id: string; displayName: string; statut: string | null; niveauClub: string | null }>>([])

  // Coach picker search
  const [coachSearch, setCoachSearch] = useState('')

  // Excluded sets per section
  const currentIds    = useMemo(() => new Set(currentPlayers.map(p => p.childId)),    [currentPlayers])
  const affiliatedIds = useMemo(() => new Set(affiliatedPlayers.map(p => p.childId)), [affiliatedPlayers])
  const coachIds      = useMemo(() => new Set(coaches.map(c => c.coachId)),            [coaches])

  // Déduplication : exclure les joueurs déjà liés via les sections explicit (current ou affiliated)
  const annuairePlayersDeduped = useMemo(() => {
    const linkedIds = new Set([...currentIds, ...affiliatedIds])
    return annuairePlayers.filter(p => !linkedIds.has(p.id))
  }, [annuairePlayers, currentIds, affiliatedIds])

  const filteredCoaches = useMemo(() => {
    const q = coachSearch.toLowerCase()
    return allCoaches.filter(c => !coachIds.has(c.id) && (!q || c.name.toLowerCase().includes(q))).slice(0, 6)
  }, [allCoaches, coachIds, coachSearch])

  const isDirty = useMemo(() => editing && club && form ? (
    form.nom !== club.nom ||
    form.matricule !== (club.matricule ?? '') ||
    form.label !== (club.label ?? '') ||
    form.ville !== (club.ville ?? '') ||
    form.province !== (club.province ?? null) ||
    form.siteInternet !== (club.siteInternet ?? '') ||
    form.emailPrincipal !== (club.emailPrincipal ?? '') ||
    form.clubRelationType !== club.clubRelationType ||
    form.notesInternes !== (club.notesInternes ?? '')
  ) : false, [editing, club, form])

  const load = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    setLoadingLinks(true)
    try {
      const [clubRes, linksRes, coachesRes, playersRes, coachListRes, annuaireRes] = await Promise.all([
        getClubDirectoryEntry(clubId),
        listChildrenOfClub(clubId),           // all links for this club
        listCoachesOfClub(clubId),
        listChildDirectory({ page: 0, pageSize: 500, actif: true }),
        listAvailableCoaches(),
        listChildrenByClubDirectoryId(clubId), // liaison implicite via club_directory_id
      ])
      if (clubRes.data) {
        setClub(clubRes.data)
        setForm(entryToForm(clubRes.data))
      }
      setCurrentPlayers(linksRes.data.filter(r => r.linkType === 'current'))
      setAffiliatedPlayers(linksRes.data.filter(r => r.linkType === 'affiliated'))
      setCoaches(coachesRes.data)
      setAllPlayers((playersRes.data ?? []).map(p => ({
        id         : p.id,
        displayName: p.displayName,
        statut     : p.statut,
        niveauClub : p.niveauClub,
      })))
      setAllCoaches(coachListRes)
      setAnnuairePlayers(annuaireRes.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] load error:', err)
    } finally {
      setLoading(false)
      setLoadingLinks(false)
    }
  }, [clubId])

  useEffect(() => { load() }, [load])

  // ── Save club info ────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!club || !form || !clubId || !tenantId || !user?.id) return
    setSaving(true); setError(null)

    try {
      // Upload logo en attente (sélectionné mais pas encore envoyé)
      if (logoFile) {
        setLogoUploading(true)
        try {
          const { error: logoErr } = await uploadClubLogo({ clubId, tenantId, file: logoFile, updatedBy: user.id })
          if (logoErr) {
            setError(typeof logoErr === 'string' ? logoErr : 'Erreur lors de l\'upload du logo.')
            return
          }
          setLogoFile(null)
          setLogoPreview(null)
        } finally {
          setLogoUploading(false)
        }
      }

      const { error: err } = await updateClubDirectoryEntry({
        clubId, tenantId, updatedBy: user.id,
        nom: form.nom, matricule: form.matricule || null, label: form.label || null, province: form.province,
        adresseRue: form.adresseRue || null, codePostal: form.codePostal || null, ville: form.ville || null, siteInternet: form.siteInternet || null,
        correspondant: form.correspondant || null, emailPrincipal: form.emailPrincipal || null, telephonePrincipal: form.telephonePrincipal || null,
        responsableSportif: form.responsableSportif || null, emailResponsableSportif: form.emailResponsableSportif || null, telephoneResponsableSportif: form.telephoneResponsableSportif || null,
        clubRelationType: form.clubRelationType, actif: form.actif, notesInternes: form.notesInternes || null,
      })
      if (err) { setError('Erreur lors de la sauvegarde.'); return }
      setEditing(false)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] handleSave error:', err)
      setError('Erreur inattendue lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!clubId || !tenantId || !user?.id) return
    try {
      const { error } = await softDeleteClubDirectoryEntry({ clubId, tenantId, deletedBy: user.id })
      if (error) { setError('Erreur lors de la suppression.'); return }
      router.replace('/clubs' as never)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] handleDelete error:', err)
      setError('Erreur lors de la suppression.')
    }
  }

  // ── Toggle actif (optimistic) ─────────────────────────────────────────────

  const handleToggleActif = async () => {
    if (!club || !clubId || !tenantId || !user?.id) return
    const newValue = !(optimisticActif ?? club.actif)
    setOptimisticActif(newValue)
    try {
      const { error: err } = await updateClubDirectoryEntry({
        clubId, tenantId, updatedBy: user.id, nom: club.nom, actif: newValue,
      })
      if (err) throw new Error('Erreur API')
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] handleToggleActif error:', err)
      setOptimisticActif(!newValue) // rollback
      toast.error('Erreur — modification annulée')
    }
  }

  // Validation + preview local — l'upload réel se déclenche dans handleSave
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/png', 'image/jpeg']
    if (!allowed.includes(file.type)) { setError('Format non supporté. PNG ou JPEG uniquement.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo trop volumineux. Maximum 2 MB.'); return }
    setError(null)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleLogoDelete = async () => {
    if (!club?.logoPath || !clubId || !tenantId || !user?.id) return
    if (typeof window !== 'undefined' && !window.confirm('Supprimer le logo de ce club ?')) return
    setLogoUploading(true)
    try {
      await deleteClubLogo({ clubId, logoPath: club.logoPath, tenantId, deletedBy: user.id })
      const clubRes = await getClubDirectoryEntry(clubId)
      if (clubRes.data) { setClub(clubRes.data); setForm(entryToForm(clubRes.data)) }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] handleLogoDelete error:', err)
    } finally {
      setLogoUploading(false)
    }
  }

  // ── Link helpers ──────────────────────────────────────────────────────────

  const linkPlayer = async (player: PlayerOption, linkType: ClubChildLinkType) => {
    if (!clubId || !tenantId || !user?.id) return
    setError(null)
    const { error: err } = await linkChildToClubDirectory({ clubId, childId: player.id, linkType, tenantId, linkedBy: user.id })
    if (err) { setError('Impossible d\'ajouter ce joueur.'); return }
    const row: ClubChildLinkRow = {
      childId    : player.id,
      displayName: player.displayName,
      statut     : player.statut,
      niveauClub : player.niveauClub,
      linkType,
      createdAt  : new Date().toISOString(),
    }
    if (linkType === 'current')    setCurrentPlayers(prev => [...prev, row])
    else                           setAffiliatedPlayers(prev => [...prev, row])
  }

  const unlinkPlayer = async (childId: string, linkType: ClubChildLinkType) => {
    if (!clubId || !tenantId || !user?.id) return
    try {
      const { error: err } = await unlinkChildFromClubDirectory({ clubId, childId, linkType, tenantId, linkedBy: user.id })
      if (err) { setError('Impossible de retirer ce joueur.'); return }
      if (linkType === 'current')    setCurrentPlayers(prev => prev.filter(p => p.childId !== childId))
      else                           setAffiliatedPlayers(prev => prev.filter(p => p.childId !== childId))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] unlinkPlayer error:', err)
      setError('Erreur inattendue lors du retrait du joueur.')
    }
  }

  const linkCoach = async (coachId: string, name: string) => {
    if (!clubId || !tenantId || !user?.id) return
    const { error: err } = await linkCoachToClubDirectory({ clubId, coachId, tenantId, linkedBy: user.id })
    if (err) { setError('Impossible d\'ajouter ce coach.'); return }
    setCoaches(prev => [...prev, { coachId, displayName: name, createdAt: new Date().toISOString() }])
    setCoachSearch('')
  }

  const unlinkCoach = async (coachId: string) => {
    if (!clubId || !tenantId || !user?.id) return
    try {
      const { error: err } = await unlinkCoachFromClubDirectory({ clubId, coachId, tenantId, linkedBy: user.id })
      if (err) { setError('Impossible de retirer ce coach.'); return }
      setCoaches(prev => prev.filter(c => c.coachId !== coachId))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/detail] unlinkCoach error:', err)
      setError('Erreur inattendue lors du retrait du coach.')
    }
  }

  const setField = (key: keyof EditForm, value: unknown) =>
    setForm(f => f ? { ...f, [key]: value } : f)

  // ── Loading / not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={{ gap: space.md }}>
          {[0,1,2,3].map(i => <View key={i} style={s.skeletonCard} />)}
        </View>
      </ScrollView>
    )
  }

  if (!club || !form) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Pressable onPress={() => router.push('/clubs' as never)} style={s.backBtn}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Clubs</AureakText>
        </Pressable>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Club introuvable.</AureakText>
      </ScrollView>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.pageHeader}>
        <Pressable onPress={() => router.push('/clubs' as never)} style={s.backBtn}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Clubs</AureakText>
        </Pressable>
        <HierarchyBreadcrumb items={[
          { label: 'Clubs', onPress: () => router.push('/clubs' as never) },
          { label: club?.nom ?? 'Club' },
        ]} />
        <View style={s.headerActions}>
          {!editing ? (
            <>
              <Pressable style={s.editBtn} onPress={() => setEditing(true)}>
                <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>Modifier</AureakText>
              </Pressable>
              <Pressable style={s.deleteBtn} onPress={() => setConfirmDeleteVisible(true)}>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>Supprimer</AureakText>
              </Pressable>
            </>
          ) : (
            <>
              {isDirty && (
                <AureakText variant="caption" style={{ color: colors.accent.gold }}>• Modifié</AureakText>
              )}
              <Pressable style={s.cancelBtn} onPress={() => { setEditing(false); setForm(entryToForm(club)); setLogoFile(null); setLogoPreview(null) }}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
              </Pressable>
              <Pressable style={s.saveBtn} onPress={handleSave} disabled={saving}>
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </AureakText>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Title row */}
      <View style={s.titleRow}>
        {/* Logo */}
        <View style={s.logoBox}>
          {club.logoUrl ? (
            <img src={club.logoUrl} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'contain', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm }} alt="logo" />
          ) : (
            <View style={s.logoFallback}>
              <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '800', fontSize: 20 }}>
                {club.nom.charAt(0).toUpperCase()}
              </AureakText>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <AureakText variant="h2">{club.nom}</AureakText>
          {club.matricule && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              Matricule : {club.matricule}
            </AureakText>
          )}
        </View>

        {/* Stat gardiens — affiché uniquement si au moins 1 gardien lié */}
        {club.gardienCount > 0 && (
          <View style={s.gardienStat}>
            <AureakText variant="h3" style={{ color: colors.accent.gold, fontWeight: '800', fontSize: 22 }}>
              {club.gardienCount}
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, textAlign: 'center' as never }}>
              {club.gardienCount === 1 ? 'gardien' : 'gardiens'}{'\n'}à l'académie
            </AureakText>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          {club.clubRelationType !== 'normal' && (
            <Badge
              label={CLUB_RELATION_TYPE_LABELS[club.clubRelationType]}
              variant={RELATION_BADGE_VARIANTS[club.clubRelationType as Exclude<ClubRelationType, 'normal'>]}
            />
          )}
          <Pressable onPress={!editing ? handleToggleActif : undefined} style={{ opacity: editing ? 0.6 : 1 }}>
            <Badge
              label={(optimisticActif ?? club.actif) ? 'Actif' : 'Inactif'}
              variant={(optimisticActif ?? club.actif) ? 'present' : 'zinc'}
            />
          </Pressable>
          {club.notionPageId && <Badge label="Notion" variant="zinc" />}
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={s.errorBanner}>
          <AureakText variant="body" style={{ color: colors.accent.red }}>{error}</AureakText>
        </View>
      )}

      {/* ── Info sections (read/edit) ── */}
      {!editing && (
        <>
          <Section title="Identité">
            <FieldRow label="Nom officiel"  value={club.nom} />
            <FieldRow label="Matricule"     value={club.matricule} />
            <FieldRow label="Label"         value={club.label} />
            <FieldRow label="Province"      value={club.province} />
          </Section>
          <Section title="Adresse">
            <FieldRow label="Rue"           value={club.adresseRue} />
            <FieldRow label="Code postal"   value={club.codePostal} />
            <FieldRow label="Ville"         value={club.ville} />
            <FieldRow label="Site internet" value={club.siteInternet} />
          </Section>
          <Section title="Contact général">
            <FieldRow label="Correspondant" value={club.correspondant} />
            <FieldRow label="Email"         value={club.emailPrincipal} />
            <FieldRow label="Téléphone"     value={club.telephonePrincipal} />
          </Section>
          <Section title="Responsable sportif">
            <FieldRow label="Nom"       value={club.responsableSportif} />
            <FieldRow label="Email"     value={club.emailResponsableSportif} />
            <FieldRow label="Téléphone" value={club.telephoneResponsableSportif} />
          </Section>
          {club.notesInternes && (
            <Section title="Notes internes">
              <AureakText variant="body" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
                {club.notesInternes}
              </AureakText>
            </Section>
          )}
          {club.notionPageId && (
            <Section title="Synchronisation Notion">
              <FieldRow label="Notion page ID" value={club.notionPageId} />
              <FieldRow label="Dernier sync"   value={club.notionSyncedAt ?? 'Jamais'} />
            </Section>
          )}
          <Section title="RBFA">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <RbfaStatusBadge status={club.rbfaStatus ?? 'pending'} score={club.rbfaConfidence} />
            </View>
            {club.rbfaId && <FieldRow label="ID RBFA"       value={club.rbfaId} />}
            {club.rbfaUrl && (
              <View style={f.row}>
                <AureakText variant="caption" style={f.label}>Fiche RBFA</AureakText>
                <Pressable onPress={() => typeof window !== 'undefined' && window.open(club.rbfaUrl!, '_blank')}>
                  <AureakText
                    variant="caption"
                    style={{ color: colors.accent.gold, textDecorationLine: 'underline' as never }}
                  >
                    Voir sur rbfa.be
                  </AureakText>
                </Pressable>
              </View>
            )}
            {club.rbfaConfidence != null && (
              <FieldRow label="Score matching" value={`${Math.round(club.rbfaConfidence)}%`} />
            )}
            {club.lastVerifiedAt && (
              <FieldRow label="Vérifié le" value={new Date(club.lastVerifiedAt).toLocaleDateString('fr-BE')} />
            )}
          </Section>

          <Section title="Logo">
            <View style={{ alignItems: 'center', gap: space.md }}>
              {/* Aperçu logo 100×100 ou fallback initiales */}
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  style={{ width: 100, height: 100, borderRadius: 10, objectFit: 'contain', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm }}
                  alt="logo du club"
                />
              ) : (
                <View style={{ width: 100, height: 100, borderRadius: 10, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center' }}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '800', fontSize: 32 } as never}>
                    {club.nom.charAt(0).toUpperCase()}
                  </AureakText>
                </View>
              )}

              {/* Badge source du logo */}
              {club.logoPath ? (
                club.logoUrl ? (
                  <Badge
                    label={club.logoPath.includes('logo-rbfa') ? 'Logo RBFA' : 'Upload manuel'}
                    variant={club.logoPath.includes('logo-rbfa') ? 'goldOutline' : 'light'}
                  />
                ) : (
                  <Badge label="Logo non disponible" variant="zinc" />
                )
              ) : (
                <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never, fontSize: 12 }}>
                  Aucun logo
                </AureakText>
              )}

              {/* Lien vers la source RBFA si disponible */}
              {club.rbfaLogoUrl && (
                <Pressable onPress={() => typeof window !== 'undefined' && window.open(club.rbfaLogoUrl!, '_blank')}>
                  <AureakText
                    variant="caption"
                    style={{ color: colors.accent.gold, textDecorationLine: 'underline' as never, fontSize: 11 }}
                  >
                    Voir source RBFA
                  </AureakText>
                </Pressable>
              )}

              {/* Suppression rapide sans passer en mode édition */}
              {club.logoPath && !logoUploading && (
                <Pressable onPress={handleLogoDelete}>
                  <AureakText variant="caption" style={{ color: colors.accent.red, fontSize: 11 }}>
                    Supprimer le logo
                  </AureakText>
                </Pressable>
              )}
            </View>
          </Section>
        </>
      )}

      {editing && (
        <>
          <Section title="Identité">
            <EditField label="Nom officiel *" value={form.nom}       onChange={v => setField('nom', v)} />
            <EditField label="Matricule"      value={form.matricule} onChange={v => setField('matricule', v)} />
            <EditField label="Label"          value={form.label}     onChange={v => setField('label', v)} />
            <ProvinceSelector value={form.province} onChange={v => setField('province', v)} />
          </Section>
          <Section title="Adresse">
            <EditField label="Rue"           value={form.adresseRue}   onChange={v => setField('adresseRue', v)} />
            <EditField label="Code postal"   value={form.codePostal}   onChange={v => setField('codePostal', v)} />
            <EditField label="Ville"         value={form.ville}        onChange={v => setField('ville', v)} />
            <EditField label="Site internet" value={form.siteInternet} onChange={v => setField('siteInternet', v)} />
          </Section>
          <Section title="Contact général">
            <EditField label="Correspondant" value={form.correspondant}      onChange={v => setField('correspondant', v)} />
            <EditField label="Email"         value={form.emailPrincipal}     onChange={v => setField('emailPrincipal', v)} />
            <EditField label="Téléphone"     value={form.telephonePrincipal} onChange={v => setField('telephonePrincipal', v)} />
          </Section>
          <Section title="Responsable sportif">
            <EditField label="Nom"       value={form.responsableSportif}          onChange={v => setField('responsableSportif', v)} />
            <EditField label="Email"     value={form.emailResponsableSportif}     onChange={v => setField('emailResponsableSportif', v)} />
            <EditField label="Téléphone" value={form.telephoneResponsableSportif} onChange={v => setField('telephoneResponsableSportif', v)} />
          </Section>
          <Section title="Statut">
            <RelationTypeSelector value={form.clubRelationType} onChange={v => setField('clubRelationType', v)} />
            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xs }}>
              <Pressable style={[pill.base, form.actif && pill.active]} onPress={() => setField('actif', !form.actif)}>
                <AureakText variant="caption" style={{ color: form.actif ? colors.accent.gold : colors.text.muted }}>Actif</AureakText>
              </Pressable>
            </View>
          </Section>
          <Section title="Logo du club">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              {/* Aperçu : preview local en priorité, sinon logo existant, sinon initiales */}
              {(logoPreview || club.logoUrl) ? (
                <img src={logoPreview ?? club.logoUrl!} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'contain', border: `1px solid ${colors.border.light}` }} alt="logo" />
              ) : (
                <View style={s.logoFallback}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '800', fontSize: 22 }}>
                    {club.nom.charAt(0).toUpperCase()}
                  </AureakText>
                </View>
              )}
              <View style={{ gap: 6 }}>
                {/* input[type=file] natif HTML — uniquement web. Upload différé au Save. */}
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  disabled={logoUploading}
                  onChange={handleLogoFileChange}
                  style={{ fontSize: 12, color: logoUploading ? colors.text.muted : colors.text.dark, cursor: logoUploading ? 'not-allowed' : 'pointer' }}
                />
                {logoFile && !logoUploading && (
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11 }}>
                    Prêt : {logoFile.name} — sera uploadé à la sauvegarde
                  </AureakText>
                )}
                {logoUploading && (
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>Upload en cours…</AureakText>
                )}
                {club.logoPath && !logoUploading && !logoFile && (
                  <Pressable onPress={handleLogoDelete}>
                    <AureakText variant="caption" style={{ color: colors.accent.red, fontSize: 11 }}>Supprimer le logo</AureakText>
                  </Pressable>
                )}
              </View>
            </View>
          </Section>
          <Section title="Notes internes">
            <EditField label="" value={form.notesInternes} onChange={v => setField('notesInternes', v)} multiline />
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          JOUEURS — deux sections distinctes
      ══════════════════════════════════════════════════════════════ */}

      {/* ── Section 1 : Joueurs actuellement au club ── */}
      <Section
        title="Joueurs actuellement au club"
        count={currentPlayers.length}
        accent={colors.accent.gold}
      >
        <View style={s.sectionNote}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, fontStyle: 'italic' as never }}>
            Joueurs qui s'entraînent ou jouent actuellement dans ce club (lien opérationnel).
            Un joueur en prêt apparaît ici dans son club d'accueil.
          </AureakText>
        </View>

        {loadingLinks ? (
          <ListRowSkeleton count={3} />
        ) : currentPlayers.length === 0 ? (
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', paddingVertical: space.md }}>Aucun joueur actuellement lié.</AureakText>
        ) : (
          currentPlayers.map(p => (
            <PlayerRow
              key={p.childId}
              row={p}
              onRemove={() => unlinkPlayer(p.childId, 'current')}
            />
          ))
        )}

        <View style={s.pickerWrapper}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginBottom: 4 }}>
            Ajouter un joueur :
          </AureakText>
          <PlayerPicker
            players={allPlayers}
            excludeIds={currentIds}
            onSelect={p => linkPlayer(p, 'current')}
            accent={colors.accent.gold}
          />
        </View>
      </Section>

      {/* ── Section 2 : Joueurs affiliés au club ── */}
      <Section
        title="Joueurs affiliés au club"
        count={affiliatedPlayers.length}
        accent={colors.status.info}
      >
        <View style={s.sectionNote}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, fontStyle: 'italic' as never }}>
            Joueurs officiellement affiliés à ce club au niveau fédéral (matricule, contrat).
            Un joueur peut être affilié ici tout en jouant dans un autre club (prêt).
          </AureakText>
        </View>

        {loadingLinks ? (
          <ListRowSkeleton count={3} />
        ) : affiliatedPlayers.length === 0 ? (
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', paddingVertical: space.md }}>Aucun joueur affilié.</AureakText>
        ) : (
          affiliatedPlayers.map(p => (
            <PlayerRow
              key={p.childId}
              row={p}
              onRemove={() => unlinkPlayer(p.childId, 'affiliated')}
            />
          ))
        )}

        <View style={s.pickerWrapper}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginBottom: 4 }}>
            Ajouter un joueur affilié :
          </AureakText>
          <PlayerPicker
            players={allPlayers}
            excludeIds={affiliatedIds}
            onSelect={p => linkPlayer(p, 'affiliated')}
            accent={colors.status.info}
          />
        </View>
      </Section>

      {/* ── Section 3 : Joueurs via annuaire (auto-match) ── */}
      <Section
        title="Joueurs via annuaire (auto-match)"
        count={annuairePlayersDeduped.length}
        accent={colors.status.injured}
      >
        <View style={s.sectionNote}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, fontStyle: 'italic' as never }}>
            Joueurs dont le profil annuaire pointe vers ce club (champ club_directory_id).
            Ces liens sont créés automatiquement à l'import Notion. Pour les modifier,
            ouvrir la fiche du joueur.
          </AureakText>
        </View>

        {loadingLinks ? (
          <ListRowSkeleton count={3} />
        ) : annuairePlayersDeduped.length === 0 ? (
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', paddingVertical: space.md }}>
            Aucun joueur lié via l'annuaire.
          </AureakText>
        ) : (
          annuairePlayersDeduped.map(p => (
            <AnnuairePlayerRow key={p.id} player={p} />
          ))
        )}
      </Section>

      {/* ── Section 4 : Coachs liés ── */}
      <Section title="Coachs liés" count={coaches.length}>
        {loadingLinks ? (
          <ListRowSkeleton count={3} />
        ) : coaches.length === 0 ? (
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', paddingVertical: space.md }}>Aucun coach lié.</AureakText>
        ) : (
          coaches.map(c => (
            <CoachRow
              key={c.coachId}
              name={c.displayName ?? c.coachId.slice(0, 8) + '…'}
              onRemove={() => unlinkCoach(c.coachId)}
            />
          ))
        )}

        <View style={s.pickerWrapper}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginBottom: 4 }}>
            Ajouter un coach :
          </AureakText>
          <TextInput
            style={pp.input}
            value={coachSearch}
            onChangeText={setCoachSearch}
            placeholder="Rechercher un coach…"
            placeholderTextColor={colors.text.muted}
          />
          {coachSearch.length > 0 && filteredCoaches.length > 0 && (
            <View style={pp.results}>
              {filteredCoaches.map(c => (
                <Pressable
                  key={c.id}
                  style={pp.option}
                  onPress={() => linkCoach(c.id, c.name)}
                >
                  <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>{c.name}</AureakText>
                  <View style={[pp.addDot, { backgroundColor: colors.status.info }]}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 14, lineHeight: 18 }}>+</AureakText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Section>

    </ScrollView>

    <ConfirmDialog
      visible={confirmDeleteVisible}
      title="Supprimer ce club ?"
      message="Cette action est irréversible."
      confirmLabel="Supprimer"
      danger
      onConfirm={() => { setConfirmDeleteVisible(false); handleDelete() }}
      onCancel={() => setConfirmDeleteVisible(false)}
    />
    </>
  )
}

const s = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.md },
  pageHeader   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  backBtn      : { paddingVertical: space.xs, paddingRight: space.sm },
  titleRow     : { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: space.sm },
  logoBox      : { flexShrink: 0 },
  logoFallback : { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center' },
  gardienStat  : { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md, paddingVertical: space.xs, backgroundColor: colors.light.muted, borderRadius: 8, borderWidth: 1, borderColor: colors.border.gold, flexShrink: 0 },

  editBtn  : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 7, borderWidth: 1, borderColor: colors.accent.gold },
  deleteBtn: { paddingHorizontal: space.sm, paddingVertical: space.xs + 2, borderRadius: 7, borderWidth: 1, borderColor: colors.border.light },
  cancelBtn: { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 7, borderWidth: 1, borderColor: colors.border.light },
  saveBtn  : { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 7, backgroundColor: colors.accent.gold },

  errorBanner : { backgroundColor: colors.status.errorBg, borderLeftWidth: 3, borderLeftColor: colors.accent.red, borderRadius: 4, padding: space.md },

  sectionNote  : { backgroundColor: colors.light.primary, borderRadius: 6, padding: space.sm, borderWidth: 1, borderColor: colors.border.light },
  pickerWrapper: { marginTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border.divider, paddingTop: space.sm },

  skeletonCard : { height: 120, backgroundColor: colors.light.surface, borderRadius: 10, opacity: 0.5, borderWidth: 1, borderColor: colors.border.light },
})
