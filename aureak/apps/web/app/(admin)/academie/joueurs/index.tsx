'use client'
// Story 83.1 — Académie Joueurs : refonte LayoutActivités
// header + StatCards + filtresRow pills/dropdowns + search row + table alignée
import { useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { listJoueurs, type JoueurListItem } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { avatarBgColor } from '../../children/_avatarHelpers'

// ── Badges statut ─────────────────────────────────────────────────────────────────
const BADGE_IMAGES: Record<string, ReturnType<typeof require>> = {
  ACADÉMICIEN        : require('../../../../assets/badges/badge-academicien.webp'),
  NOUVEAU_ACADÉMICIEN: require('../../../../assets/badges/badge-nouveau.webp'),
  ANCIEN             : require('../../../../assets/badges/badge-ancien.webp'),
  STAGE_UNIQUEMENT   : require('../../../../assets/badges/badge-stage.webp'),
  PROSPECT           : require('../../../../assets/badges/badge-prospect.webp'),
}

// ── Navigation Académie ───────────────────────────────────────────────────────────
const ACADEMIE_TABS = [
  { label: 'JOUEURS',       href: '/academie/joueurs'       },
  { label: 'COACHS',        href: '/academie/coachs'        },
  { label: 'SCOUTS',        href: '/academie/scouts'        },
  { label: 'MANAGERS',      href: '/academie/managers'      },
  { label: 'CLUBS',         href: '/academie/clubs'         },
  { label: 'IMPLANTATIONS', href: '/academie/implantations' },
] as const

// ── Constantes ───────────────────────────────────────────────────────────────────
type MainToggle   = 'aureak' | 'prospect'
type StatusFilter = 'all' | 'ACADÉMICIEN' | 'NOUVEAU_ACADÉMICIEN' | 'ANCIEN' | 'STAGE_UNIQUEMENT'
const PAGE_SIZE   = 50
const BIRTH_YEARS = ['all', ...Array.from({ length: 15 }, (_, i) => String(2018 - i))]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',                 label: 'Tous les statuts'   },
  { value: 'ACADÉMICIEN',         label: '🎓 Académicien'     },
  { value: 'NOUVEAU_ACADÉMICIEN', label: '✨ Nouveau'          },
  { value: 'ANCIEN',              label: '📦 Ancien'           },
  { value: 'STAGE_UNIQUEMENT',    label: '🏕 Stage uniquement' },
]

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

// ── Étoiles niveau ────────────────────────────────────────────────────────────────
function Stars({ count }: { count: number | null }) {
  if (!count) return <AureakText variant="caption" style={{ color: colors.text.muted }}>—</AureakText>
  return (
    <AureakText variant="caption" style={{ color: colors.accent.gold, letterSpacing: -1 }}>
      {'★'.repeat(count)}{'☆'.repeat(Math.max(0, 5 - count))}
    </AureakText>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────────
export default function AcademieJoueursPage() {
  const router   = useRouter()
  const pathname = usePathname()

  // ── Data ──
  const [joueurs,        setJoueurs]        = useState<JoueurListItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [cntTotal,       setCntTotal]       = useState(0)
  const [cntAcademicien, setCntAcademicien] = useState(0)
  const [cntAncien,      setCntAncien]      = useState(0)
  const [cntProspect,    setCntProspect]    = useState(0)
  const [loadingStats,   setLoadingStats]   = useState(true)

  // ── Filtres ──
  const [toggle,       setToggle]       = useState<MainToggle>('aureak')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search,       setSearch]       = useState('')
  const [birthYear,    setBirthYear]    = useState('all')
  const [niveau,       setNiveau]       = useState('all')
  const [clubFilter,   setClubFilter]   = useState('all')
  const [page,         setPage]         = useState(0)

  // ── Dropdown state ──
  const [statusDropOpen, setStatusDropOpen] = useState(false)
  const [yearDropOpen,   setYearDropOpen]   = useState(false)
  const [niveauDropOpen, setNiveauDropOpen] = useState(false)
  const [clubDropOpen,   setClubDropOpen]   = useState(false)

  const closeAllDrops = () => {
    setStatusDropOpen(false)
    setYearDropOpen(false)
    setNiveauDropOpen(false)
    setClubDropOpen(false)
  }

  // ── Chargement stats ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingStats(true)
      try {
        const [total, acad, acadNew, ancien, prospect] = await Promise.all([
          listJoueurs({ pageSize: 1 }),
          listJoueurs({ computedStatus: 'ACADÉMICIEN',         pageSize: 1 }),
          listJoueurs({ computedStatus: 'NOUVEAU_ACADÉMICIEN', pageSize: 1 }),
          listJoueurs({ computedStatus: 'ANCIEN',              pageSize: 1 }),
          listJoueurs({ computedStatus: 'PROSPECT',            pageSize: 1 }),
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
    })()
    return () => { cancelled = true }
  }, [])

  // ── Chargement joueurs ──
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

  // ── Options dérivées pour dropdowns ──
  const niveaux = useMemo(() => {
    const set = new Set<string>()
    joueurs.forEach(j => { if (j.niveauClub) set.add(j.niveauClub) })
    return ['all', ...Array.from(set).sort()]
  }, [joueurs])

  const clubs = useMemo(() => {
    const set = new Set<string>()
    joueurs.forEach(j => { if (j.currentClub) set.add(j.currentClub) })
    return ['all', ...Array.from(set).sort().slice(0, 30)]
  }, [joueurs])

  // ── Filtrage ──
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

  // ── Handlers ──
  const handleToggle = useCallback((t: MainToggle) => { setToggle(t); setStatusFilter('all'); setPage(0) }, [])
  const handleSearch = useCallback((v: string)      => { setSearch(v); setPage(0) }, [])
  const handleReset  = useCallback(() => {
    setSearch(''); setBirthYear('all'); setNiveau('all'); setStatusFilter('all'); setClubFilter('all'); setPage(0); closeAllDrops()
  }, [])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, filtered.length)
  const hasFilters   = !!(search || birthYear !== 'all' || niveau !== 'all' || statusFilter !== 'all' || clubFilter !== 'all')
  const isGlobal     = statusFilter === 'all' && birthYear === 'all' && niveau === 'all' && clubFilter === 'all'

  // ── Labels pills ──
  const statusLabel = statusFilter !== 'all'
    ? (STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? 'STATUT') + ' ▾'
    : 'STATUT ▾'
  const yearLabel   = birthYear !== 'all'   ? `${birthYear} ▾`   : 'ANNÉE ▾'
  const niveauLabel = niveau !== 'all'      ? `${niveau} ▾`      : 'NIVEAU ▾'
  const clubLabel   = clubFilter !== 'all'  ? `${clubFilter} ▾`  : 'CLUB ▾'

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>ACADÉMIE</AureakText>
          <Pressable style={st.newBtn} onPress={() => router.push('/children/new' as never)}>
            <AureakText style={st.newBtnLabel}>+ Nouveau joueur</AureakText>
          </Pressable>
        </View>
        <View style={st.tabsRow}>
          {ACADEMIE_TABS.map(tab => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
                <AureakText style={[st.tabLabel, isActive && st.tabLabelActive] as never}>
                  {tab.label}
                </AureakText>
                {isActive && <View style={st.tabUnderline} />}
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* ── StatCards ── */}
      <View style={st.statCardsRow}>
        {([
          { picto: '👤', label: 'TOTAL JOUEURS',  value: loadingStats ? '—' : String(cntTotal),        color: colors.text.dark         },
          { picto: '🎓', label: 'ACADÉMICIENS',   value: loadingStats ? '—' : String(cntAcademicien), color: colors.accent.gold        },
          { picto: '📦', label: 'ANCIENS',        value: loadingStats ? '—' : String(cntAncien),       color: colors.text.muted        },
          { picto: '🔍', label: 'PROSPECTS',      value: loadingStats ? '—' : String(cntProspect),     color: colors.status.warning    },
        ] as const).map(card => (
          <View key={card.label} style={st.statCard as never}>
            <AureakText style={st.statCardPicto}>{card.picto}</AureakText>
            <AureakText style={st.statCardLabel}>{card.label}</AureakText>
            <AureakText style={[st.statCardValue, { color: card.color }] as never}>{card.value}</AureakText>
          </View>
        ))}
      </View>

      {/* ── FiltresRow : pills gauche | toggle droite ── */}
      <View style={st.filtresRow}>

        {/* Gauche : GLOBAL + 4 dropdown pills */}
        <View style={st.filtresLeft}>

          {/* GLOBAL */}
          <Pressable
            style={isGlobal ? st.pillActive : st.pillInactive}
            onPress={() => { setStatusFilter('all'); setBirthYear('all'); setNiveau('all'); setClubFilter('all'); setPage(0); closeAllDrops() }}
          >
            <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
          </Pressable>

          {/* STATUT ▾ */}
          <View style={st.dropdownWrapper}>
            <Pressable
              style={statusFilter !== 'all' ? st.pillActive : st.pillInactive}
              onPress={() => { setStatusDropOpen(o => !o); setYearDropOpen(false); setNiveauDropOpen(false); setClubDropOpen(false) }}
            >
              <AureakText style={statusFilter !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                {statusLabel}
              </AureakText>
            </Pressable>
            {statusDropOpen && (
              <View style={st.dropdown}>
                {STATUS_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    style={[st.dropdownItem, statusFilter === opt.value && st.dropdownItemActive]}
                    onPress={() => { setStatusFilter(opt.value); setStatusDropOpen(false); setPage(0) }}
                  >
                    <AureakText style={{ fontSize: 12, fontWeight: statusFilter === opt.value ? '700' : '400', color: statusFilter === opt.value ? colors.text.dark : colors.text.muted }}>
                      {opt.label}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ANNÉE ▾ */}
          <View style={st.dropdownWrapper}>
            <Pressable
              style={birthYear !== 'all' ? st.pillActive : st.pillInactive}
              onPress={() => { setYearDropOpen(o => !o); setStatusDropOpen(false); setNiveauDropOpen(false); setClubDropOpen(false) }}
            >
              <AureakText style={birthYear !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                {yearLabel}
              </AureakText>
            </Pressable>
            {yearDropOpen && (
              <View style={st.dropdown}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {BIRTH_YEARS.map(y => (
                    <Pressable
                      key={y}
                      style={[st.dropdownItem, birthYear === y && st.dropdownItemActive]}
                      onPress={() => { setBirthYear(y); setYearDropOpen(false); setPage(0) }}
                    >
                      <AureakText style={{ fontSize: 12, fontWeight: birthYear === y ? '700' : '400', color: birthYear === y ? colors.text.dark : colors.text.muted }}>
                        {y === 'all' ? 'Toutes les années' : y}
                      </AureakText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* NIVEAU ▾ */}
          <View style={st.dropdownWrapper}>
            <Pressable
              style={niveau !== 'all' ? st.pillActive : st.pillInactive}
              onPress={() => { setNiveauDropOpen(o => !o); setStatusDropOpen(false); setYearDropOpen(false); setClubDropOpen(false) }}
            >
              <AureakText style={niveau !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                {niveauLabel}
              </AureakText>
            </Pressable>
            {niveauDropOpen && (
              <View style={st.dropdown}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {niveaux.map(n => (
                    <Pressable
                      key={n}
                      style={[st.dropdownItem, niveau === n && st.dropdownItemActive]}
                      onPress={() => { setNiveau(n); setNiveauDropOpen(false); setPage(0) }}
                    >
                      <AureakText style={{ fontSize: 12, fontWeight: niveau === n ? '700' : '400', color: niveau === n ? colors.text.dark : colors.text.muted }}>
                        {n === 'all' ? 'Tous les niveaux' : n}
                      </AureakText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* CLUB ▾ */}
          <View style={st.dropdownWrapper}>
            <Pressable
              style={clubFilter !== 'all' ? st.pillActive : st.pillInactive}
              onPress={() => { setClubDropOpen(o => !o); setStatusDropOpen(false); setYearDropOpen(false); setNiveauDropOpen(false) }}
            >
              <AureakText style={clubFilter !== 'all' ? st.pillTextActive : st.pillTextInactive} numberOfLines={1}>
                {clubLabel}
              </AureakText>
            </Pressable>
            {clubDropOpen && (
              <View style={[st.dropdown, { width: 220 }]}>
                <ScrollView style={{ maxHeight: 220 }}>
                  {clubs.map(c => (
                    <Pressable
                      key={c}
                      style={[st.dropdownItem, clubFilter === c && st.dropdownItemActive]}
                      onPress={() => { setClubFilter(c); setClubDropOpen(false); setPage(0) }}
                    >
                      <AureakText style={{ fontSize: 12, fontWeight: clubFilter === c ? '700' : '400', color: clubFilter === c ? colors.text.dark : colors.text.muted }} numberOfLines={1}>
                        {c === 'all' ? 'Tous les clubs' : c}
                      </AureakText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Réinitialiser */}
          {hasFilters && (
            <Pressable onPress={handleReset}>
              <AureakText style={st.resetLabel}>✕ Réinit.</AureakText>
            </Pressable>
          )}
        </View>

        {/* Droite : SegmentedToggle AUREAK / PROSPECT */}
        <View style={st.toggleRow}>
          <Pressable
            style={[st.toggleBtn, toggle === 'aureak' && st.toggleBtnActive] as never}
            onPress={() => handleToggle('aureak')}
          >
            <AureakText style={[st.toggleLabel, toggle === 'aureak' && st.toggleLabelActive] as never}>
              AUREAK
            </AureakText>
          </Pressable>
          <Pressable
            style={[st.toggleBtn, toggle === 'prospect' && st.toggleBtnActive] as never}
            onPress={() => handleToggle('prospect')}
          >
            <AureakText style={[st.toggleLabel, toggle === 'prospect' && st.toggleLabelActive] as never}>
              PROSPECT
            </AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Recherche (ligne séparée) ── */}
      <TextInput
        value={search}
        onChangeText={handleSearch}
        placeholder="Rechercher un joueur…"
        placeholderTextColor={colors.text.muted}
        style={st.searchInput as never}
      />

      {/* ── Table ── */}
      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      ) : filtered.length === 0 ? (
        <View style={st.emptyState}>
          <AureakText style={st.emptyText}>Aucun joueur pour ces filtres</AureakText>
        </View>
      ) : (
        <>
          <View style={st.tableWrapper}>

            {/* Header */}
            <View style={st.tableHeader}>
              <View style={{ width: 36 }} />
              <View style={{ width: 48 }} />
              <View style={{ flex: 1.3, minWidth: 80 }}>
                <AureakText style={st.thText}>NOM</AureakText>
              </View>
              <View style={{ flex: 1.3, minWidth: 80 }}>
                <AureakText style={st.thText}>PRÉNOM</AureakText>
              </View>
              <View style={{ width: 90 }}>
                <AureakText style={st.thText}>NÉ LE</AureakText>
              </View>
              <View style={{ width: 80 }}>
                <AureakText style={st.thText}>NIVEAU</AureakText>
              </View>
              <View style={{ flex: 1.2, minWidth: 80 }}>
                <AureakText style={st.thText}>CLUB</AureakText>
              </View>
              <View style={{ width: 28 }} />
            </View>

            {/* Rows */}
            {paginated.map((joueur, idx) => {
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
                  {/* Badge statut */}
                  <View style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
                    {badgeImg ? (
                      <Image source={badgeImg} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.muted }} />
                    )}
                  </View>

                  {/* Photo */}
                  <View style={{ width: 48, justifyContent: 'center' }}>
                    <PhotoAvatar
                      photoUrl={joueur.currentPhotoUrl}
                      displayName={joueur.displayName}
                      id={joueur.id}
                      nom={joueur.nom}
                      prenom={joueur.prenom}
                    />
                  </View>

                  {/* NOM */}
                  <AureakText style={[st.cellText, { flex: 1.3, minWidth: 80 }] as never} numberOfLines={1}>
                    {nomDisplay}
                  </AureakText>

                  {/* PRÉNOM */}
                  <AureakText style={[st.cellText, { flex: 1.3, minWidth: 80 }] as never} numberOfLines={1}>
                    {prenomDisplay}
                  </AureakText>

                  {/* NÉ LE */}
                  <AureakText style={[st.cellMuted, { width: 90 }] as never}>
                    {birthFormatted}
                  </AureakText>

                  {/* NIVEAU étoiles */}
                  <View style={{ width: 80, justifyContent: 'center' }}>
                    <Stars count={joueur.teamLevelStars} />
                  </View>

                  {/* CLUB */}
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

                  {/* Chevron */}
                  <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <AureakText style={{ color: colors.text.muted }}>›</AureakText>
                  </View>
                </Pressable>
              )
            })}
          </View>

          {/* Pagination */}
          <View style={st.pagination}>
            <AureakText style={st.paginationInfo}>
              {filtered.length > 0
                ? `Affichage de ${displayStart}–${displayEnd} / ${filtered.length} joueurs`
                : 'Aucun joueur'}
            </AureakText>
            <View style={st.paginationBtns}>
              <Pressable
                onPress={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={[st.paginationBtn, page === 0 && st.paginationBtnDisabled] as never}
              >
                <AureakText style={{ color: page === 0 ? colors.text.muted : colors.text.dark, fontSize: 12 }}>←</AureakText>
              </Pressable>
              <AureakText style={st.paginationPage}>{page + 1} / {totalPages}</AureakText>
              <Pressable
                onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={[st.paginationBtn, page >= totalPages - 1 && st.paginationBtnDisabled] as never}
              >
                <AureakText style={{ color: page >= totalPages - 1 ? colors.text.muted : colors.text.dark, fontSize: 12 }}>→</AureakText>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // Header
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
  // Nav tabs (pattern exact séances)
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.accent.gold },
  tabUnderline  : {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  // StatCards
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  statCard: {
    flex           : 1,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    minWidth       : 160,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  statCardPicto: { fontSize: 22, marginBottom: 2 },
  statCardLabel: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign    : 'center',
  },
  statCardValue: {
    fontSize  : 28,
    fontFamily: fonts.display,
    fontWeight: '900',
    color     : colors.text.dark,
  },

  // FiltresRow
  filtresRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    flexWrap      : 'wrap',
    gap           : space.sm,
  },
  filtresLeft: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },

  // Pills dropdowns
  dropdownWrapper : { position: 'relative', zIndex: 9999 },
  pillActive      : { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold },
  pillInactive    : { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.badge, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  pillTextActive  : { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },
  pillTextInactive: { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.muted },
  dropdown: {
    position       : 'absolute',
    top            : 38,
    left           : 0,
    zIndex         : 9999,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    minWidth       : 200,
    padding        : 6,
    // @ts-ignore web
    boxShadow      : shadows.lg,
  },
  dropdownItem      : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  dropdownItemActive: { backgroundColor: colors.accent.gold + '18' },
  resetLabel        : { color: colors.status.absent, fontSize: 12, fontWeight: '600' },

  // SegmentedToggle AUREAK / PROSPECT
  toggleRow: {
    flexDirection: 'row',
    gap          : 0,
    alignSelf    : 'flex-start',
    borderRadius : radius.xs,
    overflow     : 'hidden',
    borderWidth  : 1,
    borderColor  : colors.border.light,
  },
  toggleBtn        : { paddingVertical: 8, paddingHorizontal: space.lg, backgroundColor: colors.light.surface },
  toggleBtnActive  : { backgroundColor: colors.accent.gold },
  toggleLabel      : { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted },
  toggleLabelActive: { color: colors.text.dark },

  // Search (ligne séparée)
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

  // Table
  tableWrapper: { borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' },
  tableHeader : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  cellText : { color: colors.text.dark, fontSize: 13 },
  cellMuted: { color: colors.text.muted, fontSize: 13 },

  // Pagination
  pagination: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  paginationInfo       : { color: colors.text.muted, fontSize: 12 },
  paginationBtns       : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn        : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage       : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },

  emptyState: { padding: space.xl, alignItems: 'center' },
  emptyText : { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
})
