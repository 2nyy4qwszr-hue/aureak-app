'use client'
// Filtres + pagination style activités/seances — réutilisés par toutes les pages méthodologie
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'

// ── Segmented toggle (style timeToggle d'activités/seances) ─────────────────

type SegmentedOption<V extends string> = { value: V; label: string }

type MetSegmentedProps<V extends string> = {
  options : SegmentedOption<V>[]
  value   : V
  onChange: (v: V) => void
}

export function MetSegmented<V extends string>({ options, value, onChange }: MetSegmentedProps<V>) {
  return (
    <View style={st.timeToggle}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[st.timeToggleBtn, active && st.timeToggleBtnActive]}
          >
            <AureakText style={[st.timeToggleText, active && st.timeToggleTextActive] as never}>
              {opt.label}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Select natif (style selectField d'activités/seances) ────────────────────

type MetSelectOption = { value: string; label: string }

type MetSelectProps = {
  label   : string
  value   : string
  options : MetSelectOption[]
  onChange: (v: string) => void
}

const selectNativeStyle: React.CSSProperties = {
  width       : '100%',
  padding     : '7px 10px',
  fontSize    : 13,
  color       : colors.text.dark,
  background  : colors.light.muted,
  border      : `1px solid ${colors.border.divider}`,
  borderRadius: radius.xs,
  outline     : 'none',
  fontFamily  : fonts.body,
}

export function MetSelect({ label, value, options, onChange }: MetSelectProps) {
  return (
    <View style={st.selectField}>
      <AureakText style={st.selectLabel}>{label}</AureakText>
      <select value={value} onChange={e => onChange(e.target.value)} style={selectNativeStyle}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </View>
  )
}

// ── Pagination footer (style pagination d'activités/seances) ────────────────

type MetPaginationProps = {
  page          : number
  pageCount     : number
  total         : number
  pageSize      : number
  itemLabelPlural: string  // ex: "entraînements"
  onPageChange  : (p: number) => void
}

export function MetPagination({ page, pageCount, total, pageSize, itemLabelPlural, onPageChange }: MetPaginationProps) {
  if (total === 0) return null
  const start    = page * pageSize + 1
  const end      = Math.min((page + 1) * pageSize, total)
  const safeMax  = Math.max(1, pageCount)

  return (
    <View style={st.pagination}>
      <AureakText style={st.paginationInfo}>
        Affichage de {start}–{end} sur {total} {itemLabelPlural}
      </AureakText>
      <View style={st.paginationActions}>
        <Pressable
          style={[st.pageBtn, page === 0 && st.pageBtnDisabled]}
          disabled={page === 0}
          onPress={() => onPageChange(Math.max(0, page - 1))}
        >
          <AureakText style={st.pageBtnText}>‹</AureakText>
        </Pressable>
        <AureakText style={st.pageNum}>{page + 1} / {safeMax}</AureakText>
        <Pressable
          style={[st.pageBtn, page >= pageCount - 1 && st.pageBtnDisabled]}
          disabled={page >= pageCount - 1}
          onPress={() => onPageChange(Math.min(pageCount - 1, page + 1))}
        >
          <AureakText style={st.pageBtnText}>›</AureakText>
        </Pressable>
      </View>
    </View>
  )
}

// ── Hook pagination (utilitaire) ─────────────────────────────────────────────

export const PAGE_SIZE = 20

export function usePagination<T>(items: T[], pageSize: number = PAGE_SIZE) {
  const [page, setPage] = React.useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  // Reset page si filtres réduisent les items en-dessous du page courant
  React.useEffect(() => {
    if (page > pageCount - 1) setPage(0)
  }, [pageCount, page])
  const paginated = items.slice(page * pageSize, (page + 1) * pageSize)
  return { page, setPage, pageCount, paginated }
}

// ── Filters row container ────────────────────────────────────────────────────

type MetFiltersRowProps = { children: React.ReactNode }

export function MetFiltersRow({ children }: MetFiltersRowProps) {
  return <View style={st.controls}>{children}</View>
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  // Filters row — segmented à gauche, bouton Filtres aligné à droite (cohérent /activites)
  controls: {
    flexDirection : 'row',
    flexWrap      : 'wrap',
    justifyContent: 'space-between',
    gap           : space.md,
    alignItems    : 'center',
  },

  // Segmented toggle
  timeToggle: {
    flexDirection  : 'row',
    gap            : 4,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : 3,
    alignSelf      : 'flex-end',
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

  // Select field
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
    textTransform: 'uppercase',
    fontFamily   : fonts.display,
  },

  // Pagination
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
  paginationInfo: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  paginationActions: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },
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
  pageNum        : { fontSize: 12, fontFamily: fonts.body, color: colors.text.muted },
})
