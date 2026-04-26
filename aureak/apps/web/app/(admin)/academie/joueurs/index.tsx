'use client'
// Refonte alignée sur /activites/seances :
//  - Suppression des StatCards
//  - Filtres en <select> natifs avec label uppercase (selectField)
//  - Toggle AUREAK / PROSPECT en segmented (style timeToggle)
//  - Tableau style TableauSeances (card border + lignes alternées + pagination)
import { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Image, TextInput, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listJoueurs, type JoueurListItem } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { avatarBgColor } from '../../../../lib/admin/children/avatarHelpers'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import { AcademieCountsContext } from '../_layout'

const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  ACADÉMICIEN        : require('../../../../assets/badges/badge-academicien.webp'),
  NOUVEAU_ACADÉMICIEN: require('../../../../assets/badges/badge-nouveau.webp'),
  ANCIEN             : require('../../../../assets/badges/badge-ancien.webp'),
  STAGE_UNIQUEMENT   : require('../../../../assets/badges/badge-stage.webp'),
  PROSPECT           : require('../../../../assets/badges/badge-prospect.webp'),
}

type MainToggle   = 'aureak' | 'prospect'
type StatusFilter = 'all' | 'ACADÉMICIEN' | 'NOUVEAU_ACADÉMICIEN' | 'ANCIEN' | 'STAGE_UNIQUEMENT'
const PAGE_SIZE   = 50
const BIRTH_YEARS = Array.from({ length: 15 }, (_, i) => String(2018 - i))

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',                 label: 'Tous les statuts'   },
  { value: 'ACADÉMICIEN',         label: 'Académicien'        },
  { value: 'NOUVEAU_ACADÉMICIEN', label: 'Nouveau'            },
  { value: 'ANCIEN',              label: 'Ancien'             },
  { value: 'STAGE_UNIQUEMENT',    label: 'Stage uniquement'   },
]

function getInitials(displayName: string, nom?: string | null, prenom?: string | null): string {
  if (nom && prenom) return (prenom.charAt(0) + nom.charAt(0)).toUpperCase()
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function PhotoAvatar({ photoUrl, displayName, id, nom, prenom }: {
  photoUrl   : string | null
  displayName: string
  id         : string
  nom?       : string | null
  prenom?    : string | null
}) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = photoUrl && !imgError
  const bg        = avatarBgColor(id)
  const initials  = getInitials(displayName, nom, prenom)
  return (
    <View style={[av.circle, { backgroundColor: showPhoto ? 'transparent' : bg }]}>
      {showPhoto ? (
        <Image source={{ uri: photoUrl }} style={av.img} onError={() => setImgError(true)} resizeMode="cover" />
      ) : (
        <AureakText style={av.initials as never}>{initials}</AureakText>
      )}
    </View>
  )
}
const av = StyleSheet.create({
  circle  : { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img     : { width: 40, height: 40, borderRadius: 20 },
  initials: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
})

function Stars({ count }: { count: number | null }) {
  if (!count) return <AureakText variant="caption" style={{ color: colors.text.muted }}>—</AureakText>
  return (
    <AureakText variant="caption" style={{ color: colors.accent.gold, letterSpacing: -1 }}>
      {'★'.repeat(count)}{'☆'.repeat(Math.max(0, 5 - count))}
    </AureakText>
  )
}

export default function AcademieJoueursPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)
  const { width }      = useWindowDimensions()
  const isMobile       = width <= 640

  const [joueurs, setJoueurs] = useState<JoueurListItem[]>([])
  const [loading, setLoading] = useState(true)

  const [toggle,       setToggle]       = useState<MainToggle>('aureak')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search,       setSearch]       = useState('')
  const [birthYear,    setBirthYear]    = useState('all')
  const [niveau,       setNiveau]       = useState('all')
  const [clubFilter,   setClubFilter]   = useState('all')
  const [page,         setPage]         = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await listJoueurs({ pageSize: 1000 })
        if (!cancelled) setJoueurs(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieJoueursPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const niveaux = useMemo(() => {
    const set = new Set<string>()
    joueurs.forEach(j => { if (j.niveauClub) set.add(j.niveauClub) })
    return Array.from(set).sort()
  }, [joueurs])

  const clubs = useMemo(() => {
    const set = new Set<string>()
    joueurs.forEach(j => { if (j.currentClub) set.add(j.currentClub) })
    return Array.from(set).sort().slice(0, 30)
  }, [joueurs])

  const filtered = useMemo(() => {
    const PROSPECT_STATUS = 'PROSPECT'
    return joueurs.filter(j => {
      if (toggle === 'prospect') {
        if (j.computedStatus !== PROSPECT_STATUS) return false
      } else {
        if (j.computedStatus === PROSPECT_STATUS) return false
      }
      if (statusFilter !== 'all' && j.computedStatus !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(j.displayName ?? '').toLowerCase().includes(q) &&
          !(j.nom  ?? '').toLowerCase().includes(q) &&
          !(j.prenom ?? '').toLowerCase().includes(q)
        ) return false
      }
      if (birthYear !== 'all' && j.birthDate && !j.birthDate.startsWith(birthYear)) return false
      if (niveau !== 'all' && j.niveauClub !== niveau) return false
      if (clubFilter !== 'all' && j.currentClub !== clubFilter) return false
      return true
    })
  }, [joueurs, toggle, statusFilter, search, birthYear, niveau, clubFilter])

  const handleToggle = useCallback((t: MainToggle) => { setToggle(t); setStatusFilter('all'); setPage(0) }, [])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  return (
    <View style={st.container}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <View style={st.controls}>
          <View style={st.timeToggle}>
            {(['aureak', 'prospect'] as MainToggle[]).map(v => {
              const active = toggle === v
              return (
                <Pressable
                  key={v}
                  onPress={() => handleToggle(v)}
                  style={[st.timeToggleBtn, active && st.timeToggleBtnActive]}
                >
                  <AureakText
                    style={[st.timeToggleText, active && st.timeToggleTextActive] as never}
                  >
                    {v === 'aureak' ? 'Aureak' : 'Prospect'}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>

          <View style={st.selectField}>
            <AureakText style={st.selectLabel}>Statut</AureakText>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(0) }}
              style={selectNativeStyle}
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </View>

          <View style={st.selectField}>
            <AureakText style={st.selectLabel}>Année</AureakText>
            <select
              value={birthYear}
              onChange={e => { setBirthYear(e.target.value); setPage(0) }}
              style={selectNativeStyle}
            >
              <option value="all">Toutes les années</option>
              {BIRTH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </View>

          <View style={st.selectField}>
            <AureakText style={st.selectLabel}>Niveau</AureakText>
            <select
              value={niveau}
              onChange={e => { setNiveau(e.target.value); setPage(0) }}
              style={selectNativeStyle}
            >
              <option value="all">Tous les niveaux</option>
              {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </View>

          <View style={st.selectField}>
            <AureakText style={st.selectLabel}>Club</AureakText>
            <select
              value={clubFilter}
              onChange={e => { setClubFilter(e.target.value); setPage(0) }}
              style={selectNativeStyle}
            >
              <option value="all">Tous les clubs</option>
              {clubs.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </View>
        </View>

        <View style={st.searchWrap}>
          <TextInput
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(0) }}
            placeholder="Rechercher un joueur…"
            placeholderTextColor={colors.text.muted}
            style={st.searchInput as never}
          />
        </View>

        {loading ? (
          <View style={st.loadingState}>
            <AureakText style={st.loadingText}>Chargement des joueurs…</AureakText>
          </View>
        ) : (
          <View style={[st.card, isMobile && st.cardMobile]}>
            {!isMobile && (
              <View style={st.tableHeader}>
                <View style={{ width: 36 }} />
                <View style={{ width: 48 }} />
                <AureakText style={[st.colHeader, { flex: 1.3, minWidth: 80 }] as never}>NOM</AureakText>
                <AureakText style={[st.colHeader, { flex: 1.3, minWidth: 80 }] as never}>PRÉNOM</AureakText>
                <AureakText style={[st.colHeader, { width: 90 }] as never}>NÉ LE</AureakText>
                <AureakText style={[st.colHeader, { width: 80 }] as never}>NIVEAU</AureakText>
                <AureakText style={[st.colHeader, { flex: 1.2, minWidth: 80 }] as never}>CLUB</AureakText>
                <View style={{ width: 28 }} />
              </View>
            )}

            {filtered.length === 0 ? (
              <View style={st.emptyRow}>
                <AureakText style={st.emptyText}>Aucun joueur pour ces filtres.</AureakText>
              </View>
            ) : paginated.map((joueur, idx) => {
              const badgeImg       = joueur.computedStatus ? BADGE_IMAGES[joueur.computedStatus] : null
              const birthFormatted = joueur.birthDate ? joueur.birthDate.split('-').reverse().join('-') : '—'
              const nomDisplay     = joueur.nom    ?? joueur.displayName.split(' ').slice(1).join(' ') ?? '—'
              const prenomDisplay  = joueur.prenom ?? joueur.displayName.split(' ')[0] ?? '—'
              const rowBg          = idx % 2 === 0 ? colors.light.surface : colors.light.muted

              return (
                <Pressable
                  key={joueur.id}
                  onPress={() => router.push(`/children/${joueur.id}` as never)}
                  style={({ pressed }) => [st.tableRow, { backgroundColor: rowBg }, pressed && { opacity: 0.8 }] as never}
                >
                  <View style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
                    {badgeImg ? (
                      <Image source={badgeImg} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.muted }} />
                    )}
                  </View>

                  <View style={{ width: 48, justifyContent: 'center' }}>
                    <PhotoAvatar
                      photoUrl={joueur.currentPhotoUrl}
                      displayName={joueur.displayName}
                      id={joueur.id}
                      nom={joueur.nom}
                      prenom={joueur.prenom}
                    />
                  </View>

                  <AureakText style={[st.cellText, { flex: 1.3, minWidth: 80 }] as never} numberOfLines={1}>
                    {nomDisplay}
                  </AureakText>

                  <AureakText style={[st.cellText, { flex: 1.3, minWidth: 80 }] as never} numberOfLines={1}>
                    {prenomDisplay}
                  </AureakText>

                  <AureakText style={[st.cellMuted, { width: 90 }] as never}>
                    {birthFormatted}
                  </AureakText>

                  <View style={{ width: 80, justifyContent: 'center' }}>
                    <Stars count={joueur.teamLevelStars} />
                  </View>

                  <View style={{ flex: 1.2, minWidth: 80, justifyContent: 'center' }}>
                    {joueur.clubLogoUrl ? (
                      <Image source={{ uri: joueur.clubLogoUrl }} style={{ width: 24, height: 24, borderRadius: 4 }} resizeMode="contain" />
                    ) : joueur.currentClub ? (
                      <AureakText style={{ color: colors.text.dark, fontSize: 11 }} numberOfLines={1}>
                        {joueur.currentClub}
                      </AureakText>
                    ) : (
                      <AureakText style={{ color: colors.text.muted, fontSize: 11 }}>—</AureakText>
                    )}
                  </View>

                  <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <AureakText style={{ color: colors.text.muted }}>›</AureakText>
                  </View>
                </Pressable>
              )
            })}

            <View style={st.pagination}>
              <AureakText style={st.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} sur ${filtered.length} joueurs`
                  : 'Aucun joueur'}
              </AureakText>
              <View style={st.paginationActions}>
                <Pressable
                  onPress={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={[st.pageBtn, page === 0 && st.pageBtnDisabled] as never}
                >
                  <AureakText style={st.pageBtnText}>‹</AureakText>
                </Pressable>
                <AureakText style={st.pageNum}>{page + 1} / {totalPages}</AureakText>
                <Pressable
                  onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={[st.pageBtn, page >= totalPages - 1 && st.pageBtnDisabled] as never}
                >
                  <AureakText style={st.pageBtnText}>›</AureakText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <PrimaryAction
        label="Nouveau joueur"
        onPress={() => router.push('/children/new' as never)}
      />
    </View>
  )
}

const selectNativeStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '7px 10px',
  fontSize     : 13,
  color        : colors.text.dark,
  background   : colors.light.muted,
  border       : `1px solid ${colors.border.divider}`,
  borderRadius : radius.xs,
  outline      : 'none',
  fontFamily   : fonts.body,
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  scroll   : { flex: 1, backgroundColor: colors.light.primary },
  content  : { paddingTop: space.md, paddingBottom: 64, gap: space.md },

  controls: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    gap              : space.md,
    paddingHorizontal: space.lg,
    alignItems       : 'flex-end',
  },

  timeToggle: {
    flexDirection  : 'row',
    gap            : 4,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : 3,
  },
  timeToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : radius.xs - 2,
    borderWidth      : 1,
    borderColor      : 'transparent',
  },
  timeToggleBtnActive: {
    backgroundColor: colors.light.surface,
    borderColor    : colors.border.divider,
  },
  timeToggleText: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  timeToggleTextActive: {
    color     : colors.text.dark,
    fontWeight: '600',
  },

  selectField: {
    flexGrow : 1,
    flexBasis: 160,
    gap      : 4,
  },
  selectLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    fontFamily   : fonts.display,
  },

  searchWrap: { paddingHorizontal: space.lg },
  searchInput: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    fontSize         : 13,
    color            : colors.text.dark,
  },

  card: {
    borderRadius    : 10,
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    overflow        : 'hidden',
    borderWidth     : 1,
    borderColor     : colors.border.divider,
  },
  cardMobile: { marginHorizontal: space.sm },

  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : colors.light.muted,
    paddingVertical  : 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  cellText : { color: colors.text.dark,  fontSize: 13 },
  cellMuted: { color: colors.text.muted, fontSize: 13 },

  emptyRow: { padding: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },
  emptyText: { color: colors.text.muted, fontSize: 14, fontFamily: fonts.body },

  loadingState: { padding: space.xl, alignItems: 'center' },
  loadingText : { color: colors.text.muted, fontSize: 14 },

  pagination: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  paginationInfo   : { color: colors.text.muted, fontSize: 12 },
  paginationActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pageBtn: {
    width          : 28,
    height         : 28,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    justifyContent : 'center',
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText    : { fontSize: 16, color: colors.text.dark },
  pageNum        : { fontSize: 12, color: colors.text.muted },
})
