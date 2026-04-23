'use client'
// Story 101.4 — <InfiniteScrollContainer />
//
// Wrapper d'affichage pour listes paginées. Orthogonal à <DataCard /> (AC #12
// de 101.1 : pas de pagination intégrée dans DataCard).
//
// Variants :
//   - `infinite`  : mobile — ScrollView + onScroll auto-loadMore à 70% scroll.
//   - `paginated` : desktop — pagination numérotée classique.
//   - `auto`      : détecte breakpoint (< 640 → infinite, sinon paginated).
//
// Le composant ne fait PAS le fetch : le parent passe `children` déjà rendus
// (typiquement un <DataCard data={hook.data} ... />) + les callbacks du hook
// `usePaginatedList` (onLoadMore=loadMore, hasMore, loading).
//
// Pour le variant paginated : on expose `currentPage`, `totalPages`, `onPageChange`
// en plus — le parent doit mapper page/pageSize → offset dans sa closure fetchPage.

import React, { useCallback, useEffect, useRef } from 'react'
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoints (alignés sur DataCard/FilterSheet)
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_MAX = 640

// Seuil de déclenchement de loadMore : à 70% du scroll on précharge la suite.
const SCROLL_THRESHOLD = 0.7
// Debounce : évite de déclencher 10 fetch si l'utilisateur scroll vite.
const LOAD_DEBOUNCE_MS = 250

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InfiniteScrollVariant = 'auto' | 'infinite' | 'paginated'

export type InfiniteScrollContainerProps = {
  children   : React.ReactNode
  onLoadMore : () => void
  hasMore    : boolean
  loading    : boolean
  variant?   : InfiniteScrollVariant
  /** Callback erreur : si fourni, affiche un bouton retry. */
  error?     : Error | null
  onRetry?   : () => void
  /** Empty state (ex: aucune donnée). Rendu si `isEmpty` est vrai. */
  emptyState?: React.ReactNode
  isEmpty?   : boolean
  /** --- Pagination (variant paginated uniquement) --- */
  currentPage? : number        // 0-based
  totalPages?  : number
  onPageChange?: (page: number) => void
  /** --- Info range (variant paginated) --- */
  rangeStart?: number
  rangeEnd?  : number
  total?     : number
  unitLabel? : string          // ex: "clubs", "joueurs" — default ""
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal — router par breakpoint
// ─────────────────────────────────────────────────────────────────────────────

export function InfiniteScrollContainer(props: InfiniteScrollContainerProps) {
  const { width } = useWindowDimensions()
  const variant = props.variant ?? 'auto'

  const effective: 'infinite' | 'paginated' =
    variant === 'auto'
      ? (width < MOBILE_MAX ? 'infinite' : 'paginated')
      : variant

  // Empty state : rendu en amont (avant le scroll), mais on laisse la place
  // pour le header/filters qui sont dans children. Donc si isEmpty, on rend
  // uniquement l'empty state SANS le container scroll.
  if (props.isEmpty && !props.loading) {
    return (
      <View style={s.emptyWrap}>
        {props.emptyState ?? <DefaultEmpty />}
      </View>
    )
  }

  if (effective === 'infinite') return <InfiniteVariant {...props} />
  return <PaginatedVariant {...props} />
}

export default InfiniteScrollContainer

// ─────────────────────────────────────────────────────────────────────────────
// Variant INFINITE (mobile)
// ─────────────────────────────────────────────────────────────────────────────

function InfiniteVariant({
  children,
  onLoadMore,
  hasMore,
  loading,
  error,
  onRetry,
}: InfiniteScrollContainerProps) {
  // Debounce : on garde une ref pour le dernier appel programmé.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guard : évite le double-fire pendant qu'un loadMore est déjà programmé/en vol.
  const scheduledRef = useRef(false)

  useEffect(() => {
    // Quand loading repasse à false, on libère le guard pour permettre
    // le prochain loadMore (scroll continu).
    if (!loading) scheduledRef.current = false
  }, [loading])

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    // Si le contenu tient dans le viewport, pas de scroll à détecter.
    if (contentSize.height <= layoutMeasurement.height) return
    const ratio = (contentOffset.y + layoutMeasurement.height) / contentSize.height
    if (ratio < SCROLL_THRESHOLD) return
    if (loading || !hasMore || scheduledRef.current) return

    scheduledRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onLoadMore()
    }, LOAD_DEBOUNCE_MS)
  }, [loading, hasMore, onLoadMore])

  return (
    <ScrollView
      style={s.scrollFlex}
      contentContainerStyle={s.scrollContent}
      onScroll={handleScroll}
      scrollEventThrottle={100}
    >
      {children}

      {/* Footer : loader / fin / erreur */}
      <View style={s.footer}>
        {error ? (
          <View style={s.errorBlock}>
            <AureakText style={s.errorText as never}>
              Erreur lors du chargement : {error.message}
            </AureakText>
            {onRetry ? (
              <Pressable onPress={onRetry} style={s.retryBtn} accessibilityRole="button">
                <AureakText style={s.retryLabel as never}>Réessayer</AureakText>
              </Pressable>
            ) : null}
          </View>
        ) : loading ? (
          <AureakText style={s.footerMuted as never}>Chargement…</AureakText>
        ) : !hasMore ? (
          <AureakText style={s.footerMuted as never}>Fin des résultats</AureakText>
        ) : null}
      </View>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant PAGINATED (desktop)
// ─────────────────────────────────────────────────────────────────────────────

function PaginatedVariant({
  children,
  loading,
  error,
  onRetry,
  currentPage,
  totalPages,
  onPageChange,
  rangeStart,
  rangeEnd,
  total,
  unitLabel,
}: InfiniteScrollContainerProps) {
  const showPagination =
    typeof currentPage === 'number' &&
    typeof totalPages === 'number' &&
    typeof onPageChange === 'function' &&
    totalPages > 1

  return (
    <View style={s.paginatedWrap}>
      {children}

      {error ? (
        <View style={s.errorBlock}>
          <AureakText style={s.errorText as never}>
            Erreur lors du chargement : {error.message}
          </AureakText>
          {onRetry ? (
            <Pressable onPress={onRetry} style={s.retryBtn} accessibilityRole="button">
              <AureakText style={s.retryLabel as never}>Réessayer</AureakText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showPagination ? (
        <View style={s.pagination}>
          <AureakText style={s.paginationInfo as never}>
            {typeof rangeStart === 'number' && typeof rangeEnd === 'number' && typeof total === 'number'
              ? `${rangeStart}–${rangeEnd} / ${total}${unitLabel ? ' ' + unitLabel : ''}`
              : ''}
          </AureakText>
          <View style={s.paginationBtns}>
            <Pressable
              disabled={currentPage === 0 || loading}
              onPress={() => onPageChange(Math.max(0, currentPage - 1))}
              style={[s.pageBtn, (currentPage === 0 || loading) && s.pageBtnDisabled] as never}
              accessibilityRole="button"
              accessibilityLabel="Page précédente"
            >
              <AureakText style={{
                color: (currentPage === 0 || loading) ? colors.text.muted : colors.text.dark,
              } as never}>
                ←
              </AureakText>
            </Pressable>
            <AureakText style={s.paginationPage as never}>
              {currentPage + 1} / {totalPages}
            </AureakText>
            <Pressable
              disabled={currentPage >= totalPages - 1 || loading}
              onPress={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
              style={[s.pageBtn, (currentPage >= totalPages - 1 || loading) && s.pageBtnDisabled] as never}
              accessibilityRole="button"
              accessibilityLabel="Page suivante"
            >
              <AureakText style={{
                color: (currentPage >= totalPages - 1 || loading) ? colors.text.muted : colors.text.dark,
              } as never}>
                →
              </AureakText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state par défaut
// ─────────────────────────────────────────────────────────────────────────────

function DefaultEmpty() {
  return (
    <View style={s.defaultEmpty}>
      <AureakText style={s.defaultEmptyText as never}>Aucune donnée</AureakText>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scrollFlex   : { flex: 1 },
  scrollContent: { paddingBottom: space.xl },

  paginatedWrap: { gap: space.md },

  footer: {
    paddingVertical: space.lg,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  footerMuted: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontFamily: fonts.body,
  },

  errorBlock: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.status.absent,
    padding        : space.md,
    gap            : space.sm,
    alignItems     : 'center',
  },
  errorText: {
    color     : colors.status.absent,
    fontSize  : 13,
    fontFamily: fonts.body,
    textAlign : 'center',
  },
  retryBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.status.absent,
    backgroundColor  : colors.light.surface,
  },
  retryLabel: {
    color     : colors.status.absent,
    fontSize  : 12,
    fontWeight: '600',
  },

  pagination: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  paginationInfo: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  paginationBtns: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  pageBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pageBtnDisabled: { opacity: 0.4 },
  paginationPage : {
    color            : colors.text.muted,
    fontSize         : 12,
    paddingHorizontal: space.xs,
  },

  emptyWrap: {
    padding        : space.xl,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  defaultEmpty: {
    padding        : space.xxl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
  },
  defaultEmptyText: {
    color     : colors.text.muted,
    fontSize  : 14,
    fontFamily: fonts.body,
  },
})
