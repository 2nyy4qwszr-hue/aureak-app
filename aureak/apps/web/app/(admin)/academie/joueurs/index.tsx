'use client'
// Story 75.1 — Académie Hub : refonte page Joueurs
// Remplace le stub créé par story 75.2
import { useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { listJoueurs, type JoueurListItem } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { avatarBgColor } from '../../children/_avatarHelpers'

// ── Badges statut ─────────────────────────────────────────────────────────────────
const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  ACADÉMICIEN       : require('../../../../assets/badges/badge-academicien.webp'),
  NOUVEAU_ACADÉMICIEN: require('../../../../assets/badges/badge-nouveau.webp'),
  ANCIEN            : require('../../../../assets/badges/badge-ancien.webp'),
  STAGE_UNIQUEMENT  : require('../../../../assets/badges/badge-stage.webp'),
  PROSPECT          : require('../../../../assets/badges/badge-prospect.webp'),
}

// ── Constantes ───────────────────────────────────────────────────────────────────
type MainToggle = 'aureak' | 'prospect'
const PAGE_SIZE = 50

const BIRTH_YEARS = ['all', ...Array.from({ length: 15 }, (_, i) => String(2018 - i))]

// ── Helper initiales ──────────────────────────────────────────────────────────────
function getInitials(displayName: string, nom?: string | null, prenom?: string | null): string {
  if (nom && prenom) return (prenom.charAt(0) + nom.charAt(0)).toUpperCase()
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ── PhotoAvatar ───────────────────────────────────────────────────────────────────
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
        <Image
          source={{ uri: photoUrl }}
          style={av.img}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
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

// ── Étoiles niveau ────────────────────────────────────────────────────────────────
function Stars({ count }: { count: number | null }) {
  if (!count) return <AureakText variant="caption" style={{ color: colors.text.muted }}>—</AureakText>
  return (
    <AureakText variant="caption" style={{ color: colors.accent.gold, letterSpacing: -1 }}>
      {'★'.repeat(count)}{'☆'.repeat(Math.max(0, 5 - count))}
    </AureakText>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────────
function StatCard({ label, value, variant }: {
  label  : string
  value  : string
  variant: 'default' | 'gold'
}) {
  const isGold = variant === 'gold'
  return (
    <View style={[sc.card, isGold && sc.cardGold] as never}>
      <AureakText variant="label" style={[sc.label, isGold && sc.labelGold] as never}>{label}</AureakText>
      <AureakText variant="h2"    style={[sc.value, isGold && sc.valueGold] as never}>{value}</AureakText>
    </View>
  )
}

const sc = StyleSheet.create({
  card     : { flex: 1, minWidth: 120, backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.md, boxShadow: shadows.sm } as never,
  cardGold : { backgroundColor: colors.accent.gold },
  label    : { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  labelGold: { color: colors.text.dark },
  value    : { color: colors.text.dark, fontSize: 28, fontWeight: '700' },
  valueGold: { color: colors.text.dark },
})

// ── Page principale ───────────────────────────────────────────────────────────────
export default function AcademieJoueursPage() {
  const router = useRouter()

  // ── Data ──
  const [joueurs,   setJoueurs]   = useState<JoueurListItem[]>([])
  const [loading,   setLoading]   = useState(true)

  // ── Stat counts (chargés séparément pour perf) ──
  const [cntTotal,       setCntTotal]       = useState(0)
  const [cntAcademicien, setCntAcademicien] = useState(0)
  const [cntAncien,      setCntAncien]      = useState(0)
  const [cntProspect,    setCntProspect]    = useState(0)
  const [loadingStats,   setLoadingStats]   = useState(true)

  // ── Filtres ──
  const [toggle,    setToggle]    = useState<MainToggle>('aureak')
  const [search,    setSearch]    = useState('')
  const [birthYear, setBirthYear] = useState('all')
  const [niveau,    setNiveau]    = useState('all')
  const [page,      setPage]      = useState(0)

  // ── Chargement stats (counts via pageSize:1) ──
  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      setLoadingStats(true)
      try {
        const [total, acad, acadNew, ancien, prospect] = await Promise.all([
          listJoueurs({ pageSize: 1 }),
          listJoueurs({ computedStatus: 'ACADÉMICIEN',        pageSize: 1 }),
          listJoueurs({ computedStatus: 'NOUVEAU_ACADÉMICIEN', pageSize: 1 }),
          listJoueurs({ computedStatus: 'ANCIEN',             pageSize: 1 }),
          listJoueurs({ computedStatus: 'PROSPECT',           pageSize: 1 }),
        ])
        if (cancelled) return
        setCntTotal(total.count)
        setCntAcademicien(acad.count + acadNew.count)
        setCntAncien(ancien.count)
        setCntProspect(prospect.count)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieJoueursPage] loadStats error:', err)
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [])

  // ── Chargement joueurs ──
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        // Charger tout en une fois (< 1000 joueurs) pour filtrage client-side
        const { data } = await listJoueurs({ pageSize: 1000 })
        if (!cancelled) setJoueurs(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieJoueursPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── Niveaux disponibles (pour le filtre) ──
  const niveaux = useMemo(() => {
    const set = new Set<string>()
    joueurs.forEach(j => { if (j.niveauClub) set.add(j.niveauClub) })
    return ['all', ...Array.from(set).sort()]
  }, [joueurs])

  // ── Filtrage ──
  const filtered = useMemo(() => {
    const PROSPECT_STATUS = 'PROSPECT'
    return joueurs.filter(j => {
      // Toggle principal
      if (toggle === 'prospect') {
        if (j.computedStatus !== PROSPECT_STATUS) return false
      } else {
        // AUREAK : tout sauf PROSPECT
        if (j.computedStatus === PROSPECT_STATUS) return false
      }
      // Recherche nom
      if (search) {
        const q = search.toLowerCase()
        const name = (j.displayName ?? '').toLowerCase()
        const nom  = (j.nom ?? '').toLowerCase()
        const prenom = (j.prenom ?? '').toLowerCase()
        if (!name.includes(q) && !nom.includes(q) && !prenom.includes(q)) return false
      }
      // Année de naissance
      if (birthYear !== 'all' && j.birthDate) {
        if (!j.birthDate.startsWith(birthYear)) return false
      }
      // Niveau
      if (niveau !== 'all' && j.niveauClub !== niveau) return false
      return true
    })
  }, [joueurs, toggle, search, birthYear, niveau])

  // ── Reset page au changement de filtres ──
  const handleToggle = useCallback((t: MainToggle) => { setToggle(t); setPage(0) }, [])
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0) }, [])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  const hasFilters = search || birthYear !== 'all' || niveau !== 'all'

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* Header */}
        <View style={s.header}>
          <AureakText variant="h2" style={s.title}>Joueurs</AureakText>
          <Pressable
            onPress={() => router.push('/children/new' as never)}
            style={({ pressed }) => [s.btnNew, pressed && s.btnPressed] as never}
          >
            <AureakText variant="label" style={s.btnNewLabel}>+ Nouveau joueur</AureakText>
          </Pressable>
        </View>

        {/* Stat cards */}
        <View style={s.cards}>
          <StatCard label="JOUEURS"       value={loadingStats ? '—' : String(cntTotal)}         variant="default" />
          <StatCard label="ACADÉMICIENS"  value={loadingStats ? '—' : String(cntAcademicien)}   variant="gold" />
          <StatCard label="ANCIENS"       value={loadingStats ? '—' : String(cntAncien)}        variant="default" />
          <StatCard label="PROSPECTS"     value={loadingStats ? '—' : String(cntProspect)}      variant="default" />
        </View>

        {/* Toggle AUREAK / PROSPECT */}
        <View style={s.toggleRow}>
          <Pressable
            onPress={() => handleToggle('aureak')}
            style={[s.toggleBtn, toggle === 'aureak' && s.toggleBtnActive] as never}
          >
            <AureakText variant="label" style={[s.toggleLabel, toggle === 'aureak' && s.toggleLabelActive] as never}>
              AUREAK
            </AureakText>
          </Pressable>
          <Pressable
            onPress={() => handleToggle('prospect')}
            style={[s.toggleBtn, toggle === 'prospect' && s.toggleBtnActive] as never}
          >
            <AureakText variant="label" style={[s.toggleLabel, toggle === 'prospect' && s.toggleLabelActive] as never}>
              PROSPECT
            </AureakText>
          </Pressable>
        </View>

        {/* Filtres secondaires */}
        <View style={s.filtersRow}>
          {/* Recherche */}
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Rechercher…"
            placeholderTextColor={colors.text.muted}
            style={s.searchInput as never}
          />
          {/* Année de naissance */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll}>
            <View style={s.pillsRow}>
              {BIRTH_YEARS.slice(0, 8).map(y => (
                <Pressable
                  key={y}
                  onPress={() => { setBirthYear(y); setPage(0) }}
                  style={[s.pill, birthYear === y && s.pillActive] as never}
                >
                  <AureakText variant="caption" style={[s.pillLabel, birthYear === y && s.pillLabelActive] as never}>
                    {y === 'all' ? 'Toutes' : y}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {/* Niveau */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll}>
            <View style={s.pillsRow}>
              {niveaux.slice(0, 8).map(n => (
                <Pressable
                  key={n}
                  onPress={() => { setNiveau(n); setPage(0) }}
                  style={[s.pill, niveau === n && s.pillActive] as never}
                >
                  <AureakText variant="caption" style={[s.pillLabel, niveau === n && s.pillLabelActive] as never}>
                    {n === 'all' ? 'Tous niveaux' : n}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {/* Réinitialiser */}
          {hasFilters && (
            <Pressable onPress={() => { setSearch(''); setBirthYear('all'); setNiveau('all'); setPage(0) }}>
              <AureakText variant="caption" style={s.resetLabel}>✕ Réinitialiser</AureakText>
            </Pressable>
          )}
        </View>

        {/* Tableau */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Chargement…</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Aucun joueur</AureakText>
          </View>
        ) : (
          <>
            {/* En-têtes */}
            <View style={s.rowHeader}>
              <View style={s.colStatus} />
              <View style={s.colPhoto} />
              <AureakText variant="label" style={[s.colNom,      s.colHeaderText] as never}>NOM</AureakText>
              <AureakText variant="label" style={[s.colPrenom,   s.colHeaderText] as never}>PRÉNOM</AureakText>
              <AureakText variant="label" style={[s.colBirth,    s.colHeaderText] as never}>NÉ LE</AureakText>
              <AureakText variant="label" style={[s.colNiveau,   s.colHeaderText] as never}>NIVEAU</AureakText>
              <AureakText variant="label" style={[s.colClub,     s.colHeaderText] as never}>CLUB</AureakText>
              <View style={s.colView} />
            </View>

            {/* Lignes */}
            {paginated.map((joueur, idx) => {
              const badgeImg = joueur.computedStatus ? BADGE_IMAGES[joueur.computedStatus] : null
              const birthFormatted = joueur.birthDate
                ? joueur.birthDate.split('-').reverse().join('-')
                : '—'
              const nomDisplay    = joueur.nom    ?? joueur.displayName.split(' ').slice(1).join(' ') ?? '—'
              const prenomDisplay = joueur.prenom ?? joueur.displayName.split(' ')[0] ?? '—'
              return (
                <Pressable
                  key={joueur.id}
                  onPress={() => router.push(`/children/${joueur.id}` as never)}
                  style={({ pressed }) => [
                    s.row,
                    idx % 2 === 0 ? s.rowEven : s.rowOdd,
                    pressed && s.rowPressed,
                  ] as never}
                >
                  {/* STATUS badge */}
                  <View style={[s.colStatus, s.cellCenter]}>
                    {badgeImg ? (
                      <Image source={badgeImg} style={s.badgeImg} resizeMode="contain" />
                    ) : (
                      <View style={s.badgePlaceholder} />
                    )}
                  </View>

                  {/* PHOTO */}
                  <View style={s.colPhoto}>
                    <PhotoAvatar
                      photoUrl={joueur.currentPhotoUrl}
                      displayName={joueur.displayName}
                      id={joueur.id}
                      nom={joueur.nom}
                      prenom={joueur.prenom}
                    />
                  </View>

                  {/* NOM */}
                  <AureakText variant="body" style={[s.colNom,    s.cellText] as never} numberOfLines={1}>
                    {nomDisplay}
                  </AureakText>

                  {/* PRÉNOM */}
                  <AureakText variant="body" style={[s.colPrenom, s.cellText] as never} numberOfLines={1}>
                    {prenomDisplay}
                  </AureakText>

                  {/* NÉ LE */}
                  <AureakText variant="body" style={[s.colBirth,  s.cellMuted] as never}>
                    {birthFormatted}
                  </AureakText>

                  {/* NIVEAU étoiles */}
                  <View style={s.colNiveau}>
                    <Stars count={joueur.teamLevelStars} />
                  </View>

                  {/* CLUB logo ou texte */}
                  <View style={s.colClub}>
                    {joueur.clubLogoUrl ? (
                      <Image source={{ uri: joueur.clubLogoUrl }} style={s.clubLogo} resizeMode="contain" />
                    ) : joueur.currentClub ? (
                      <AureakText variant="caption" style={s.clubText as never} numberOfLines={1}>
                        {joueur.currentClub}
                      </AureakText>
                    ) : (
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>—</AureakText>
                    )}
                  </View>

                  {/* VIEW chevron */}
                  <View style={[s.colView, s.cellCenter]}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>›</AureakText>
                  </View>
                </Pressable>
              )
            })}

            {/* Pagination */}
            <View style={s.pagination}>
              <AureakText variant="caption" style={s.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${filtered.length} joueurs`
                  : 'Aucun joueur'}
              </AureakText>
              <View style={s.paginationBtns}>
                <Pressable
                  onPress={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={[s.paginationBtn, page === 0 && s.paginationBtnDisabled] as never}
                >
                  <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
                </Pressable>
                <AureakText variant="caption" style={s.paginationPage}>{page + 1} / {totalPages}</AureakText>
                <Pressable
                  onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={[s.paginationBtn, page >= totalPages - 1 && s.paginationBtnDisabled] as never}
                >
                  <AureakText variant="caption" style={{ color: page >= totalPages - 1 ? colors.text.muted : colors.text.dark }}>→</AureakText>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
  title : { color: colors.text.dark },
  btnNew: { backgroundColor: colors.text.dark, paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.button },
  btnPressed: { opacity: 0.8 },
  btnNewLabel: { color: colors.light.surface, letterSpacing: 0.5 },

  cards: { flexDirection: 'row', gap: space.md, marginBottom: space.lg, flexWrap: 'wrap' },

  // Toggle
  toggleRow   : { flexDirection: 'row', gap: 0, marginBottom: space.md, alignSelf: 'flex-start', borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light },
  toggleBtn   : { paddingVertical: 8, paddingHorizontal: space.lg, backgroundColor: colors.light.surface },
  toggleBtnActive: { backgroundColor: colors.accent.gold },
  toggleLabel : { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted },
  toggleLabelActive: { color: colors.text.dark },

  // Filtres
  filtersRow  : { gap: space.sm, marginBottom: space.md },
  searchInput : { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, paddingHorizontal: space.md, paddingVertical: 8, fontSize: 13, color: colors.text.dark } as never,
  pillsScroll : { maxHeight: 40 },
  pillsRow    : { flexDirection: 'row', gap: space.xs },
  pill        : { paddingVertical: 5, paddingHorizontal: space.sm, borderRadius: radius.badge, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  pillActive  : { backgroundColor: colors.text.dark, borderColor: colors.text.dark },
  pillLabel   : { fontSize: 11, color: colors.text.muted },
  pillLabelActive: { color: colors.light.surface },
  resetLabel  : { color: colors.status.absent, fontSize: 12 },

  // Table
  row      : { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: space.sm },
  rowHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border.light, marginBottom: 2 },
  rowEven  : { backgroundColor: colors.light.surface },
  rowOdd   : { backgroundColor: colors.light.hover },
  rowPressed: { opacity: 0.75 },

  // Columns
  colStatus : { width: 36 },
  colPhoto  : { width: 48 },
  colNom    : { flex: 1.3, minWidth: 80 },
  colPrenom : { flex: 1.3, minWidth: 80 },
  colBirth  : { width: 90 },
  colNiveau : { width: 80 },
  colClub   : { flex: 1.2, minWidth: 80 },
  colView   : { width: 28 },

  cellCenter    : { alignItems: 'center', justifyContent: 'center' },
  cellText      : { color: colors.text.dark, fontSize: 13 },
  cellMuted     : { color: colors.text.muted, fontSize: 13 },
  colHeaderText : { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  badgeImg        : { width: 28, height: 28 },
  badgePlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.muted },

  clubLogo: { width: 24, height: 24, borderRadius: 4 },
  clubText: { color: colors.text.dark, fontSize: 11 },

  // Pagination
  pagination        : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.md, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border.light },
  paginationInfo    : { color: colors.text.muted, fontSize: 12 },
  paginationBtns    : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn     : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage    : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },

  emptyState: { alignItems: 'center', paddingVertical: space.xl },
  emptyText : { color: colors.text.muted },
})
