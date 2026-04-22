'use client'
// Story 87.1 — Page liste générique pour les rôles "people" de l'Académie
// (commercial | manager | marketeur). Inspiré du pattern coachs/index.tsx mais
// factorisé pour éviter 3 duplications. Les pages concrètes passent leurs stat
// cards et une colonne optionnelle (ex: PIPELINE pour commerciaux).
// Story 97.6 — remplacement du headerBlock custom par <AdminPageHeader /> v2 +
// <AcademieNavBar /> (cohérence avec Activités/Méthodologie).

import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput, Image, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'
import { listProfilesByRole, getEffectivePermissions } from '@aureak/api-client'
import type { ProfileListRow, ProfileRoleFilter } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { splitName } from './splitName'
import { formatRelativeDate } from './formatRelativeDate'
import { AdminPageHeader } from '../AdminPageHeader'
import { AcademieNavBar } from './AcademieNavBar'
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
  renderStatCards?  : (rows: ProfileListRow[]) => ReactNode
  renderExtraColumn?: ExtraColumn
}

export function PeopleListPage({
  role, title, newButtonLabel, newButtonHref,
  emptyLabel, renderStatCards, renderExtraColumn,
}: PeopleListPageProps) {
  const router   = useRouter()
  const { user, role: authRole } = useAuthStore()
  const academieCounts = useContext(AcademieCountsContext)

  const [rows,     setRows]     = useState<ProfileListRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<StatusFilter>('actifs')
  const [page,     setPage]     = useState(0)

  const [canAccess,     setCanAccess]     = useState<boolean | null>(null)
  const [canReadEmail,  setCanReadEmail]  = useState(false)

  // Permissions : accès Académie + lecture emails
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

  // Chargement profils selon le toggle ACTIFS/TOUS/SUPPRIMÉS
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
  const hasActiveFilters = status !== 'actifs' || search.trim().length > 0

  const resetFilters = () => {
    setSearch('')
    setStatus('actifs')
    setPage(0)
  }

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
      {/* Story 97.6 — AdminPageHeader v2 (titre = sous-section) + AcademieNavBar */}
      <AdminPageHeader
        title={title}
        actionButton={{
          label  : newButtonLabel,
          onPress: () => router.push(newButtonHref as never),
        }}
      />
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* StatCards — délégué à chaque page concrète */}
        {renderStatCards ? renderStatCards(rows) : null}

        {/* FiltresRow : recherche + pills ACTIFS/TOUS/SUPPRIMÉS + Réinitialiser */}
        <View style={s.filtresRow}>
          <View style={s.filtersLeft}>
            <TextInput
              placeholder="Rechercher par nom, prénom, email"
              placeholderTextColor={colors.text.muted}
              value={search}
              onChangeText={t => { setSearch(t); setPage(0) }}
              style={s.searchInput as never}
            />
            <View style={s.pillRow}>
              {(['actifs', 'tous', 'supprimes'] as StatusFilter[]).map(k => (
                <Pressable
                  key={k}
                  onPress={() => { setStatus(k); setPage(0) }}
                  style={status === k ? s.pillActive : s.pillInactive}
                >
                  <AureakText style={(status === k ? s.pillTextActive : s.pillTextInactive) as TextStyle}>
                    {k === 'actifs' ? 'ACTIFS' : k === 'tous' ? 'TOUS' : 'SUPPRIMÉS'}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>
          {hasActiveFilters ? (
            <Pressable
              onPress={resetFilters}
              style={({ pressed }) => [s.resetBtn, pressed && s.resetBtnPressed] as never}
            >
              <AureakText style={s.resetBtnLabel as TextStyle}>Réinitialiser</AureakText>
            </Pressable>
          ) : null}
        </View>

        {/* Tableau */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Chargement…</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>
              {status === 'supprimes' ? 'Aucun profil supprimé' : emptyLabel}
            </AureakText>
          </View>
        ) : (
          <View style={s.tableWrapper}>
            <View style={s.tableHeader}>
              <View style={s.cellPhoto} />
              <AureakText style={[s.thText, s.cellNom]    as never}>NOM</AureakText>
              <AureakText style={[s.thText, s.cellPrenom] as never}>PRÉNOM</AureakText>
              <AureakText style={[s.thText, s.cellEmail]  as never}>EMAIL</AureakText>
              <AureakText style={[s.thText, s.cellDate]   as never}>DATE D'AJOUT</AureakText>
              {renderExtraColumn ? (
                <AureakText style={[s.thText, { width: renderExtraColumn.width ?? 100 }] as never}>
                  {renderExtraColumn.header}
                </AureakText>
              ) : null}
            </View>

            {paginated.map((row, idx) => {
              const { prenom, nom } = splitName(row.displayName)
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={row.userId}
                  onPress={() => router.push(`/profiles/${row.userId}` as never)}
                  style={({ pressed }) => [
                    s.tableRow,
                    { backgroundColor: rowBg },
                    pressed && s.rowPressed,
                  ] as never}
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
              <AureakText variant="caption" style={s.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${filtered.length}`
                  : '0 résultat'}
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
          </View>
        )}

      </ScrollView>
    </View>
  )
}

// ── StatCard helper exporté pour les pages concrètes ─────────────────────────

export function StatCard({
  picto, label, value, valueColor, subLabel,
}: {
  picto     : string
  label     : string
  value     : string
  valueColor?: string
  subLabel? : string
}) {
  return (
    <View style={s.statCard as never}>
      <AureakText style={s.statCardPicto as TextStyle}>{picto}</AureakText>
      <AureakText style={s.statCardLabel as TextStyle}>{label}</AureakText>
      <AureakText style={{ ...s.statCardValue, color: valueColor ?? colors.text.dark } as TextStyle}>
        {value}
      </AureakText>
      {subLabel ? (
        <AureakText style={s.statCardSubLabel as TextStyle}>{subLabel}</AureakText>
      ) : null}
    </View>
  )
}

export function StatCardsRow({ children }: { children: ReactNode }) {
  return <View style={s.statCardsRow}>{children}</View>
}

// ── Avatar ───────────────────────────────────────────────────────────────────

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

// ── Styles principaux ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  // denied
  denied      : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.light.primary },
  deniedTitle : { color: colors.text.dark, marginBottom: space.sm },
  deniedSub   : { color: colors.text.muted, textAlign: 'center' },

  // StatCards
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  statCard: {
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
  statCardPicto : { fontSize: 22, marginBottom: 2 },
  statCardLabel : {
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
  },
  statCardSubLabel: {
    fontSize  : 10,
    color     : colors.text.muted,
    fontStyle : 'italic',
  },

  // FiltresRow
  filtresRow  : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, flexWrap: 'wrap' },
  filtersLeft : { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap', flex: 1 },
  searchInput : {
    minWidth         : 240,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
    color            : colors.text.dark,
    fontSize         : 13,
    fontFamily       : fonts.body,
  },
  pillRow: { flexDirection: 'row', gap: space.xs },
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.accent.gold,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  pillInactive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pillTextActive  : { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },
  pillTextInactive: { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.muted },

  resetBtn       : { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  resetBtnPressed: { opacity: 0.75 },
  resetBtnLabel  : { color: colors.text.muted, fontSize: 12, fontWeight: '600' },

  // Table
  tableWrapper: {
    borderRadius: 10,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
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
  rowPressed: { opacity: 0.75 },

  cellPhoto : { width: 48 },
  cellNom   : { flex: 1.2, minWidth: 80 },
  cellPrenom: { flex: 1.2, minWidth: 80 },
  cellEmail : { flex: 2,   minWidth: 140 },
  cellDate  : { width: 110 },

  cellCenter: { alignItems: 'center', justifyContent: 'center' },
  cellText  : { color: colors.text.dark,  fontSize: 13 },
  cellMuted : { color: colors.text.muted, fontSize: 13 },

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

  emptyState: { alignItems: 'center', paddingVertical: space.xl },
  emptyText : { color: colors.text.muted },
})
