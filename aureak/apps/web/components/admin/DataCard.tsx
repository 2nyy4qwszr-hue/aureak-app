'use client'
// Story 101.1 — <DataCard /> générique responsive
// Desktop (≥1024) : table classique header + rows
// Tablette (640-1024) : table scroll horizontal + sticky first column
// Mobile (<640) : stack de cards empilées (primary en h3 + secondary labellés)
//
// Primitive consommée en masse par Epic 103 (zones admin).
// API minimaliste volontaire : pas de sort/filter/pagination intégrés (cf. 101.2, 101.4).

import React from 'react'
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Platform,
  type TextStyle,
  type ListRenderItem,
} from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoints (alignés sur AdminTopbar — voir story 100.3)
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_MAX = 640
const TABLET_MAX = 1024

const VIRTUALIZATION_THRESHOLD = 100 // AC #7 — au-delà : FlatList

// ─────────────────────────────────────────────────────────────────────────────
// Types (API publique minimaliste — AC #2)
// ─────────────────────────────────────────────────────────────────────────────

export type DataCardColumn<T> = {
  key      : string
  label    : string
  render?  : (row: T) => React.ReactNode
  priority?: 'primary' | 'secondary' | 'tertiary'
  // Desktop/tablette : flex sur la cellule (optionnel)
  flex?    : number
  // Desktop/tablette : largeur fixe en px (optionnel, exclusif avec flex)
  width?   : number
}

export type DataCardProps<T> = {
  data       : T[]
  columns    : DataCardColumn<T>[]
  onRowPress?: (row: T) => void
  emptyState?: React.ReactNode
  loading?   : boolean
  // Clé unique par row pour FlatList — fallback sur index
  keyExtractor?: (row: T, index: number) => string
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal — router par breakpoint
// ─────────────────────────────────────────────────────────────────────────────

export function DataCard<T>(props: DataCardProps<T>) {
  const { width } = useWindowDimensions()

  if (props.loading) {
    if (width < MOBILE_MAX) return <MobileSkeleton />
    return <DesktopSkeleton />
  }

  if (!props.data || props.data.length === 0) {
    return (
      <View style={s.emptyWrap}>
        {props.emptyState ?? <DefaultEmptyState />}
      </View>
    )
  }

  if (width < MOBILE_MAX) return <MobileVariant {...props} />
  if (width < TABLET_MAX) return <TabletVariant {...props} />
  return <DesktopVariant {...props} />
}

export default DataCard

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderCell<T>(col: DataCardColumn<T>, row: T): React.ReactNode {
  if (col.render) return col.render(row)
  // Fallback : accès brut `row[col.key]` (cast volontaire car API générique)
  const val = (row as Record<string, unknown>)[col.key]
  if (val === null || val === undefined || val === '') return '—'
  return String(val)
}

function cellStyle<T>(col: DataCardColumn<T>): { flex?: number; width?: number; minWidth?: number } {
  if (col.width) return { width: col.width }
  return { flex: col.flex ?? 1, minWidth: 80 }
}

function defaultKeyExtractor<T>(row: T, index: number): string {
  const rec = row as Record<string, unknown>
  if (typeof rec?.id === 'string') return rec.id
  return String(index)
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant DESKTOP (≥1024) — table classique
// ─────────────────────────────────────────────────────────────────────────────

function DesktopVariant<T>({ data, columns, onRowPress, keyExtractor }: DataCardProps<T>) {
  const useVirtual = data.length > VIRTUALIZATION_THRESHOLD
  const extractor  = keyExtractor ?? defaultKeyExtractor

  const renderRow = (row: T, index: number) => (
    <DesktopRow<T>
      key={extractor(row, index)}
      row={row}
      columns={columns}
      index={index}
      onPress={onRowPress}
    />
  )

  const flatRenderRow: ListRenderItem<T> = ({ item, index }) => renderRow(item, index)

  return (
    <View
      style={s.tableWrap}
      accessibilityRole={Platform.OS === 'web' ? ('list' as never) : undefined}
    >
      <View style={s.tableHeader}>
        {columns.map(col => (
          <AureakText
            key={col.key}
            style={[s.headerText, cellStyle(col)] as never}
            numberOfLines={1}
          >
            {col.label}
          </AureakText>
        ))}
      </View>
      {useVirtual ? (
        <FlatList
          data={data}
          keyExtractor={extractor}
          renderItem={flatRenderRow}
          initialNumToRender={30}
          windowSize={10}
          removeClippedSubviews
        />
      ) : (
        data.map((row, i) => renderRow(row, i))
      )}
    </View>
  )
}

function DesktopRow<T>({ row, columns, index, onPress }: {
  row     : T
  columns : DataCardColumn<T>[]
  index   : number
  onPress?: (row: T) => void
}) {
  const [hover, setHover] = React.useState(false)
  const bg = hover
    ? colors.light.hover
    : index % 2 === 0 ? colors.light.surface : colors.light.muted

  const cells = columns.map(col => (
    <View key={col.key} style={[s.cell, cellStyle(col)] as never}>
      <CellRenderer value={renderCell(col, row)} />
    </View>
  ))

  // A11y : si aucun onPress, rendre un View non-interactif (évite le "button"
  // sans action annoncé par les screen readers).
  if (!onPress) {
    return (
      <View
        accessibilityRole={Platform.OS === 'web' ? ('listitem' as never) : undefined}
        style={[s.row, { backgroundColor: bg }] as never}
      >
        {cells}
      </View>
    )
  }

  const pressableProps = Platform.OS === 'web'
    ? { onHoverIn: () => setHover(true), onHoverOut: () => setHover(false) }
    : {}

  return (
    <Pressable
      onPress={() => onPress(row)}
      accessibilityRole={Platform.OS === 'web' ? ('listitem' as never) : 'button'}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: bg },
        pressed && s.rowPressed,
      ] as never}
      {...pressableProps}
    >
      {cells}
    </Pressable>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant TABLETTE (640-1024) — scroll horizontal + sticky first column
// ─────────────────────────────────────────────────────────────────────────────

function TabletVariant<T>({ data, columns, onRowPress, keyExtractor }: DataCardProps<T>) {
  const extractor = keyExtractor ?? defaultKeyExtractor

  // Sticky : première colonne priority='primary', sinon la première tout court
  const primaryIdx = Math.max(0, columns.findIndex(c => c.priority === 'primary'))
  const stickyCol  = columns[primaryIdx]
  const otherCols  = columns.filter((_, i) => i !== primaryIdx)

  const STICKY_WIDTH = 140

  return (
    <View style={s.tableWrap}>
      <View style={s.tabletHeaderRow}>
        {/* Sticky header cell */}
        <View style={[s.tabletSticky, { width: STICKY_WIDTH, backgroundColor: colors.light.muted }] as never}>
          <AureakText style={s.headerText as TextStyle} numberOfLines={1}>
            {stickyCol?.label ?? ''}
          </AureakText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={s.tabletScrollContent}
        >
          {otherCols.map(col => (
            <View key={col.key} style={[s.tabletHeaderCell, cellStyle(col)] as never}>
              <AureakText style={s.headerText as TextStyle} numberOfLines={1}>
                {col.label}
              </AureakText>
            </View>
          ))}
        </ScrollView>
      </View>
      {data.map((row, i) => {
        const bg = i % 2 === 0 ? colors.light.surface : colors.light.muted
        const rowInner = (
          <>
            <View style={[s.tabletSticky, { width: STICKY_WIDTH, backgroundColor: bg }] as never}>
              {stickyCol ? <CellRenderer value={renderCell(stickyCol, row)} bold /> : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabletScrollContent}
            >
              {otherCols.map(col => (
                <View key={col.key} style={[s.cell, cellStyle(col)] as never}>
                  <CellRenderer value={renderCell(col, row)} />
                </View>
              ))}
            </ScrollView>
          </>
        )

        if (!onRowPress) {
          return (
            <View
              key={extractor(row, i)}
              style={[s.tabletRow, { backgroundColor: bg }] as never}
            >
              {rowInner}
            </View>
          )
        }

        return (
          <Pressable
            key={extractor(row, i)}
            onPress={() => onRowPress(row)}
            accessibilityRole="button"
            style={({ pressed }) => [
              s.tabletRow,
              { backgroundColor: bg },
              pressed && s.rowPressed,
            ] as never}
          >
            {rowInner}
          </Pressable>
        )
      })}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant MOBILE (<640) — stack de cards
// ─────────────────────────────────────────────────────────────────────────────

function MobileVariant<T>({ data, columns, onRowPress, keyExtractor }: DataCardProps<T>) {
  const useVirtual = data.length > VIRTUALIZATION_THRESHOLD
  const extractor  = keyExtractor ?? defaultKeyExtractor

  const primaryCol   = columns.find(c => c.priority === 'primary') ?? columns[0]
  const secondaryCols = columns.filter(c => c !== primaryCol && c.priority !== 'tertiary')

  const renderCard = (row: T, index: number) => (
    <MobileCard<T>
      key={extractor(row, index)}
      row={row}
      primaryCol={primaryCol}
      secondaryCols={secondaryCols}
      onPress={onRowPress}
    />
  )

  const flatRenderItem: ListRenderItem<T> = ({ item, index }) => renderCard(item, index)

  if (useVirtual) {
    return (
      <FlatList
        data={data}
        keyExtractor={extractor}
        renderItem={flatRenderItem}
        contentContainerStyle={s.mobileStack}
        initialNumToRender={15}
        windowSize={10}
        removeClippedSubviews
      />
    )
  }

  return (
    <View style={s.mobileStack}>
      {data.map((row, i) => renderCard(row, i))}
    </View>
  )
}

function MobileCard<T>({ row, primaryCol, secondaryCols, onPress }: {
  row          : T
  primaryCol   : DataCardColumn<T> | undefined
  secondaryCols: DataCardColumn<T>[]
  onPress?     : (row: T) => void
}) {
  const content = (
    <>
      {primaryCol ? (
        <AureakText style={s.mobilePrimary as TextStyle} numberOfLines={1}>
          {renderCellPlain(primaryCol, row)}
        </AureakText>
      ) : null}
      {secondaryCols.length > 0 ? (
        <View style={s.mobileSecondaryLine}>
          {secondaryCols.map((col, idx) => (
            <React.Fragment key={col.key}>
              {idx > 0 ? <AureakText style={s.mobileSeparator as TextStyle}> · </AureakText> : null}
              <AureakText style={s.mobileSecondary as TextStyle} numberOfLines={1}>
                <AureakText style={s.mobileSecondaryLabel as TextStyle}>{col.label}: </AureakText>
                {renderCellMobileInline(col, row)}
              </AureakText>
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </>
  )

  // A11y : pas de Pressable si pas de onPress (évite un "button" sans action).
  if (!onPress) {
    return <View style={s.mobileCard as never}>{content}</View>
  }

  return (
    <Pressable
      onPress={() => onPress(row)}
      accessibilityRole="button"
      style={({ pressed }) => [s.mobileCard, pressed && s.mobileCardPressed] as never}
    >
      {content}
    </Pressable>
  )
}

// Sur mobile (inline dans AureakText), on force un fallback string
function renderCellMobileInline<T>(col: DataCardColumn<T>, row: T): React.ReactNode {
  const rendered = renderCell(col, row)
  if (typeof rendered === 'string' || typeof rendered === 'number') return rendered
  // ReactNode custom (ex: <Badge />) peut être rendu — laissé tel quel
  return rendered as React.ReactNode
}

function renderCellPlain<T>(col: DataCardColumn<T>, row: T): React.ReactNode {
  return renderCell(col, row)
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell renderer — accepte string, number ou ReactNode
// ─────────────────────────────────────────────────────────────────────────────

function CellRenderer({ value, bold }: { value: React.ReactNode; bold?: boolean }) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <AureakText
        style={[s.cellText, bold && s.cellTextBold] as never}
        numberOfLines={1}
      >
        {value}
      </AureakText>
    )
  }
  return <>{value}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons (AC #6)
// ─────────────────────────────────────────────────────────────────────────────

function DesktopSkeleton() {
  return (
    <View style={s.tableWrap}>
      <View style={s.tableHeader}>
        <View style={[s.skeletonBar, { width: 80, flex: 1 }] as never} />
        <View style={[s.skeletonBar, { width: 80, flex: 1 }] as never} />
        <View style={[s.skeletonBar, { width: 80, flex: 1 }] as never} />
      </View>
      {[0, 1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[s.row, { backgroundColor: i % 2 === 0 ? colors.light.surface : colors.light.muted }] as never}
        >
          <View style={[s.skeletonBar, { flex: 1 }] as never} />
          <View style={[s.skeletonBar, { flex: 1 }] as never} />
          <View style={[s.skeletonBar, { flex: 1 }] as never} />
        </View>
      ))}
    </View>
  )
}

function MobileSkeleton() {
  return (
    <View style={s.mobileStack}>
      {[0, 1, 2].map(i => (
        <View key={i} style={s.mobileCard}>
          <View style={[s.skeletonBar, { width: '60%', height: 16 }] as never} />
          <View style={[s.skeletonBar, { width: '90%', height: 12, marginTop: space.xs }] as never} />
        </View>
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state par défaut
// ─────────────────────────────────────────────────────────────────────────────

function DefaultEmptyState() {
  return (
    <View style={s.emptyInner}>
      <AureakText style={s.emptyText as TextStyle}>Aucune donnée</AureakText>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Table desktop ──
  tableWrap: {
    borderRadius  : radius.card,
    borderWidth   : 1,
    borderColor   : colors.border.divider,
    overflow      : 'hidden',
    backgroundColor: colors.light.surface,
    // @ts-ignore web only
    boxShadow     : shadows.sm,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm + 2,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  headerText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
    // @ts-ignore web only — hover transition
    transition       : '0.15s background-color',
  },
  rowPressed: { opacity: 0.75 },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    color   : colors.text.dark,
    fontSize: 13,
  },
  cellTextBold: {
    fontWeight: '600',
    color     : colors.text.dark,
  },

  // ── Tablette ──
  tabletHeaderRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabletHeaderCell: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm + 2,
    justifyContent   : 'center',
  },
  tabletScrollContent: {
    flexDirection: 'row',
    gap          : space.sm,
  },
  tabletSticky: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm + 2,
    borderRightWidth : 1,
    borderRightColor : colors.border.divider,
    justifyContent   : 'center',
    // @ts-ignore web only — sticky position
    position         : 'sticky',
    left             : 0,
    zIndex           : 2,
  },
  tabletRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },

  // ── Mobile stack ──
  mobileStack: {
    gap    : space.sm,
    padding: 0,
  },
  mobileCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    gap            : space.xs,
    // @ts-ignore web only
    boxShadow      : shadows.sm,
  },
  mobileCardPressed: { opacity: 0.75 },
  mobilePrimary: {
    fontSize  : 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color     : colors.text.dark,
  },
  mobileSecondaryLine: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    alignItems   : 'center',
  },
  mobileSecondary: {
    fontSize: 13,
    color   : colors.text.muted,
  },
  mobileSecondaryLabel: {
    fontWeight: '600',
    color     : colors.text.subtle,
    fontSize  : 12,
  },
  mobileSeparator: {
    color   : colors.text.subtle,
    fontSize: 13,
  },

  // ── Empty / Loading ──
  emptyWrap: {
    alignItems     : 'center',
    justifyContent : 'center',
    paddingVertical: space.xl,
  },
  emptyInner: {
    alignItems     : 'center',
    justifyContent : 'center',
    paddingVertical: space.xl,
  },
  emptyText: {
    color   : colors.text.muted,
    fontSize: 14,
  },
  skeletonBar: {
    height         : 14,
    borderRadius   : radius.xs,
    backgroundColor: colors.border.light,
    marginVertical : 4,
  },
})
