'use client'
// Page liste générique pour les rôles "people" de l'Académie (commercial | manager | marketeur).
// Refonte alignée sur /activites/seances :
//  - Suppression des StatCards (renderStatCards et renderStatCardsRow legacy ignorés)
//  - Filtres en <select> natif (Statut: Actifs/Tous/Supprimés) + recherche
//  - Tableau style TableauSeances (border + lignes alternées + pagination)

import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput, Image, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'
import { listProfilesByRole, getEffectivePermissions } from '@aureak/api-client'
import type { ProfileListRow, ProfileRoleFilter } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { splitName } from './splitName'
import { formatRelativeDate } from './formatRelativeDate'
import { AcademieNavBar } from './AcademieNavBar'
import { PrimaryAction } from '../PrimaryAction'
import { FilterSheet } from '../FilterSheet'
import { AcademieCountsContext } from '../../../app/(admin)/academie/_layout'

type StatusFilter = 'actifs' | 'tous' | 'supprimes'
const PAGE_SIZE = 25

type ExtraColumn = {
  header: string
  cell  : (row: ProfileListRow) => ReactNode
  width?: number
}

type PeopleListPageProps = {
  role              : ProfileRoleFilter
  title             : string
  newButtonLabel    : string
  newButtonHref     : string
  emptyLabel        : string
  // Conservés pour compat API mais ignorés (plus de StatCards dans la refonte)
  renderStatCards?  : (rows: ProfileListRow[]) => ReactNode
  renderExtraColumn?: ExtraColumn
}

export function PeopleListPage({
  role, newButtonLabel, newButtonHref,
  emptyLabel, renderExtraColumn,
}: PeopleListPageProps) {
  const router   = useRouter()
  const { user, role: authRole } = useAuthStore()
  const academieCounts = useContext(AcademieCountsContext)

  const [rows,    setRows]    = useState<ProfileListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState<StatusFilter>('actifs')
  const [page,    setPage]    = useState(0)

  const [canAccess,    setCanAccess]    = useState<boolean | null>(null)
  const [canReadEmail, setCanReadEmail] = useState(false)

  useEffect(() => {
    if (!user?.id || !authRole) {
      setCanAccess(null)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const perms = await getEffectivePermissions(user.id, authRole as UserRole)
        if (cancelled) return
        setCanAccess(perms.academie === true)
        setCanReadEmail(perms.admin === true)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PeopleListPage] permissions error:', err)
        if (cancelled) return
        setCanAccess(false)
        setCanReadEmail(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [user?.id, authRole])

  useEffect(() => {
    if (canAccess !== true) return
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const { data } = await listProfilesByRole({
          role,
          page          : 0,
          pageSize      : 500,
          includeDeleted: status === 'tous',
          deletedOnly   : status === 'supprimes',
        })
        if (cancelled) return
        setRows(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PeopleListPage] load error:', err)
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [role, status, canAccess])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length === 0) return rows
    return rows.filter(r => {
      const name  = (r.displayName ?? '').toLowerCase()
      const email = (r.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [rows, search])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  if (canAccess === false) {
    return (
      <View style={s.denied}>
        <AureakText variant="h2" style={s.deniedTitle}>Accès refusé</AureakText>
        <AureakText variant="body" style={s.deniedSub}>
          Contactez votre administrateur pour obtenir l'accès à l'Académie.
        </AureakText>
      </View>
    )
  }

  return (
    <View style={s.page}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Story 110.x — Search inline avec bouton Filtres aligné droite (marginLeft auto) */}
        <View style={s.controls}>
          <View style={s.searchWrap}>
            <TextInput
              placeholder="Rechercher par nom, prénom, email"
              placeholderTextColor={colors.text.muted}
              value={search}
              onChangeText={t => { setSearch(t); setPage(0) }}
              style={s.searchInput as never}
            />
          </View>
          <FilterSheet
            activeCount={status !== 'actifs' ? 1 : 0}
            onReset={() => { setStatus('actifs'); setPage(0) }}
            triggerLabel="Filtrer"
          >
            <View style={s.selectField}>
              <AureakText style={s.selectLabel}>Statut</AureakText>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value as StatusFilter); setPage(0) }}
                style={selectNativeStyle}
              >
                <option value="actifs">Actifs</option>
                <option value="tous">Tous</option>
                <option value="supprimes">Supprimés</option>
              </select>
            </View>
          </FilterSheet>
        </View>

        {loading ? (
          <View style={s.loadingState}>
            <AureakText style={s.loadingText}>Chargement…</AureakText>
          </View>
        ) : (
          <View style={s.card}>
            <View style={s.tableHeader}>
              <View style={s.cellPhoto} />
              <AureakText style={[s.colHeader, s.cellNom]    as never}>NOM</AureakText>
              <AureakText style={[s.colHeader, s.cellPrenom] as never}>PRÉNOM</AureakText>
              <AureakText style={[s.colHeader, s.cellEmail]  as never}>EMAIL</AureakText>
              <AureakText style={[s.colHeader, s.cellDate]   as never}>DATE D'AJOUT</AureakText>
              {renderExtraColumn ? (
                <AureakText style={[s.colHeader, { width: renderExtraColumn.width ?? 100 }] as never}>
                  {renderExtraColumn.header}
                </AureakText>
              ) : null}
            </View>

            {filtered.length === 0 ? (
              <View style={s.emptyRow}>
                <AureakText style={s.emptyText}>
                  {status === 'supprimes' ? 'Aucun profil supprimé' : emptyLabel}
                </AureakText>
              </View>
            ) : paginated.map((row, idx) => {
              const { prenom, nom } = splitName(row.displayName)
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={row.userId}
                  onPress={() => router.push(`/profiles/${row.userId}` as never)}
                  style={({ pressed }) => [s.tableRow, { backgroundColor: rowBg }, pressed && s.rowPressed] as never}
                >
                  <View style={[s.cellPhoto, s.cellCenter]}>
                    <Avatar url={row.avatarUrl} displayName={row.displayName} />
                  </View>
                  <AureakText variant="body" style={[s.cellNom,    s.cellText]  as never} numberOfLines={1}>{nom}</AureakText>
                  <AureakText variant="body" style={[s.cellPrenom, s.cellText]  as never} numberOfLines={1}>{prenom}</AureakText>
                  <AureakText variant="body" style={[s.cellEmail,  s.cellMuted] as never} numberOfLines={1}>
                    {canReadEmail ? (row.email ?? '—') : '—'}
                  </AureakText>
                  <AureakText variant="body" style={[s.cellDate,   s.cellMuted] as never}>
                    {formatRelativeDate(row.createdAt)}
                  </AureakText>
                  {renderExtraColumn ? (
                    <View style={{ width: renderExtraColumn.width ?? 100 }}>
                      {renderExtraColumn.cell(row)}
                    </View>
                  ) : null}
                </Pressable>
              )
            })}

            <View style={s.pagination}>
              <AureakText style={s.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} sur ${filtered.length}`
                  : '0 résultat'}
              </AureakText>
              <View style={s.paginationActions}>
                <Pressable
                  onPress={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={[s.pageBtn, page === 0 && s.pageBtnDisabled] as never}
                >
                  <AureakText style={s.pageBtnText}>‹</AureakText>
                </Pressable>
                <AureakText style={s.pageNum}>{page + 1} / {totalPages}</AureakText>
                <Pressable
                  onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={[s.pageBtn, page >= totalPages - 1 && s.pageBtnDisabled] as never}
                >
                  <AureakText style={s.pageBtnText}>›</AureakText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <PrimaryAction
        label={newButtonLabel.replace(/^\+\s*/, '')}
        onPress={() => router.push(newButtonHref as never)}
      />
    </View>
  )
}

// Exports legacy conservés pour compat des appels existants ;
// rendus no-op afin que les anciens renderStatCards={…} ne provoquent rien.
export function StatCard(_props: {
  picto     : string
  label     : string
  value     : string
  valueColor?: string
  subLabel? : string
}) {
  return null
}

export function StatCardsRow(_props: { children: ReactNode }) {
  return null
}

function Avatar({ url, displayName }: { url: string | null; displayName: string | null }) {
  if (url) return <Image source={{ uri: url }} style={avatarS.img} />
  const initials = getInitials(displayName)
  return (
    <View style={avatarS.fallback}>
      <AureakText style={avatarS.initials as TextStyle}>{initials}</AureakText>
    </View>
  )
}

function getInitials(displayName: string | null): string {
  if (!displayName) return '?'
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const avatarS = StyleSheet.create({
  img: { width: 32, height: 32, borderRadius: 16 },
  fallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.light.muted,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.5,
  },
})

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

const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1, backgroundColor: colors.light.primary },
  scrollContent: { paddingTop: space.md, paddingBottom: 64, gap: space.md },

  denied      : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.light.primary },
  deniedTitle : { color: colors.text.dark, marginBottom: space.sm },
  deniedSub   : { color: colors.text.muted, textAlign: 'center' },

  controls: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    gap              : space.md,
    paddingHorizontal: space.lg,
    alignItems       : 'center',
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

  searchWrap : { flex: 1, minWidth: 200 },
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
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
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
  rowPressed: { opacity: 0.75 },

  cellPhoto : { width: 48 },
  cellNom   : { flex: 1.2, minWidth: 80 },
  cellPrenom: { flex: 1.2, minWidth: 80 },
  cellEmail : { flex: 2,   minWidth: 140 },
  cellDate  : { width: 110 },

  cellCenter: { alignItems: 'center', justifyContent: 'center' },
  cellText  : { color: colors.text.dark,  fontSize: 13 },
  cellMuted : { color: colors.text.muted, fontSize: 13 },

  pagination: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
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

  emptyRow : { padding: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },
  emptyText: { color: colors.text.muted, fontSize: 14, fontFamily: fonts.body },

  loadingState: { padding: space.xl, alignItems: 'center' },
  loadingText : { color: colors.text.muted, fontSize: 14 },
})
