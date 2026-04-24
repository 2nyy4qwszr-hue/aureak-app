// Story 105.1 — Styles feature Panini (objets React.CSSProperties dérivés de @aureak/theme)
// Règle : aucune couleur / espacement hardcodé — tout vient de @aureak/theme tokens.
import type { CSSProperties } from 'react'
import { colors, space, radius, shadows } from '@aureak/theme'

export const paniniStyles = {
  root: {
    display       : 'flex',
    flexDirection : 'column',
    minHeight     : '100%',
    background    : colors.light.primary,
    color         : colors.text.dark,
    fontFamily    : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as CSSProperties,

  header: {
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
    padding       : `${space.sm}px ${space.md}px`,
    background    : colors.light.surface,
    borderBottom  : `1px solid ${colors.border.light}`,
    flexWrap      : 'wrap',
    position      : 'sticky',
    top           : 0,
    zIndex        : 10,
  } as CSSProperties,

  headerTitle: {
    margin    : 0,
    fontSize  : 17,
    fontWeight: 600,
    flex      : '1 1 auto',
    minWidth  : 0,
  } as CSSProperties,

  headerRight: {
    display       : 'flex',
    alignItems    : 'center',
    gap           : space.xs,
    flexWrap      : 'wrap',
    justifyContent: 'flex-end',
  } as CSSProperties,

  mainDesktop: {
    display            : 'grid',
    gridTemplateColumns: '320px 1fr',
    gridTemplateRows   : '1fr auto',
    gridTemplateAreas  : `"pool cards" "footer footer"`,
    flex               : 1,
    minHeight          : 0,
  } as CSSProperties,

  mainMobile: {
    display       : 'flex',
    flexDirection : 'column',
    flex          : 1,
    minHeight     : 0,
  } as CSSProperties,

  pool: {
    background    : colors.light.surface,
    borderBottom  : `1px solid ${colors.border.light}`,
  } as CSSProperties,

  poolDesktop: {
    gridArea     : 'pool',
    borderBottom : 'none',
    borderRight  : `1px solid ${colors.border.light}`,
    overflowY    : 'auto',
    height       : '100%',
  } as CSSProperties,

  cards: {
    padding  : `${space.sm}px ${space.md}px ${space.md}px`,
    flex     : 1,
    overflowY: 'auto',
  } as CSSProperties,

  cardsDesktop: {
    gridArea: 'cards',
    padding : space.lg,
  } as CSSProperties,

  cardsHeader: { marginBottom: space.sm } as CSSProperties,

  cardsHeaderTitle: { margin: 0, fontSize: 16 } as CSSProperties,

  cardsHint: {
    margin  : 0,
    fontSize: 12,
    color   : colors.text.muted,
  } as CSSProperties,

  restoreBanner: {
    marginTop   : space.xs,
    padding     : `${space.xs}px ${space.sm}px`,
    background  : colors.status.warningBg,
    borderLeft  : `3px solid ${colors.accent.gold}`,
    borderRadius: radius.xs,
    fontSize    : 12.5,
    color       : colors.text.dark,
  } as CSSProperties,

  footer: {
    background  : colors.light.surface,
    borderTop   : `1px solid ${colors.border.light}`,
    padding     : `${space.sm}px ${space.md}px`,
    position    : 'sticky',
    bottom      : 0,
    zIndex      : 5,
  } as CSSProperties,

  footerDesktop: {
    gridArea: 'footer',
    position: 'static',
    padding : `${space.md}px ${space.lg}px`,
  } as CSSProperties,

  // ─── Photo pool ───────────────────────────────────────────────────
  poolHeader: {
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
    padding       : `${space.sm}px ${space.md}px`,
    borderBottom  : `1px solid ${colors.border.light}`,
  } as CSSProperties,

  poolHeaderTitle: { margin: 0, fontSize: 13, fontWeight: 600 } as CSSProperties,

  poolHeaderSubmeta: {
    margin   : '2px 0 0',
    fontSize : 11,
    color    : colors.accent.gold,
  } as CSSProperties,

  btnUpload: {
    padding    : `${space.xs}px ${space.sm}px`,
    background : colors.accent.gold,
    color      : colors.light.surface,
    borderRadius: radius.xs,
    fontSize   : 13,
    fontWeight : 500,
    cursor     : 'pointer',
    display    : 'inline-block',
    whiteSpace : 'nowrap',
    border     : 'none',
  } as CSSProperties,

  poolDropzone: { padding: `${space.sm}px ${space.md}px`, minHeight: 0 } as CSSProperties,

  dropzoneHint: {
    textAlign   : 'center',
    color       : colors.text.muted,
    fontSize    : 12.5,
    padding     : `${space.lg}px ${space.sm}px`,
    border      : `2px dashed ${colors.border.light}`,
    borderRadius: radius.button,
    margin      : 0,
  } as CSSProperties,

  poolGridMobile: {
    display                 : 'flex',
    gap                     : space.xs,
    overflowX               : 'auto',
    overflowY               : 'hidden',
    WebkitOverflowScrolling : 'touch',
    paddingBottom           : 4,
  } as CSSProperties,

  poolGridDesktop: {
    display            : 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap                : space.xs,
  } as CSSProperties,

  poolItem: (selected: boolean): CSSProperties => ({
    position     : 'relative',
    flex         : '0 0 72px',
    width        : 72,
    height       : 72,
    borderRadius : radius.button,
    overflow     : 'hidden',
    cursor       : 'pointer',
    background   : colors.light.muted,
    border       : `2px solid ${selected ? colors.accent.gold : 'transparent'}`,
    boxShadow    : selected ? `0 0 0 3px ${colors.border.gold}` : 'none',
    transition   : 'border-color 0.12s, transform 0.12s, box-shadow 0.12s',
    userSelect   : 'none',
  }),

  poolItemSquare: {
    flex        : 'initial',
    width       : 'auto',
    height      : 'auto',
    aspectRatio : '1',
  } as CSSProperties,

  poolItemImg: {
    width        : '100%',
    height       : '100%',
    objectFit    : 'cover',
    pointerEvents: 'none',
  } as CSSProperties,

  photoRemoveBtn: {
    position      : 'absolute',
    top           : 2,
    right         : 2,
    width         : 22,
    height        : 22,
    border        : 'none',
    borderRadius  : '50%',
    background    : colors.overlay.modal,
    color         : colors.text.primary,
    fontSize      : 16,
    lineHeight    : 1,
    padding       : 0,
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    zIndex        : 2,
    cursor        : 'pointer',
  } as CSSProperties,

  // ─── Child grid ───────────────────────────────────────────────────
  childGridMobile: {
    display            : 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap                : space.sm,
  } as CSSProperties,

  childGridDesktop: {
    display            : 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap                : space.md,
  } as CSSProperties,

  childCard: (state: { dragOver: boolean; hasPhoto: boolean; canAssign: boolean }): CSSProperties => ({
    background   : colors.light.surface,
    border       : state.hasPhoto
      ? `2px solid ${state.canAssign ? colors.accent.gold : colors.border.light}`
      : `2px dashed ${(state.dragOver || state.canAssign) ? colors.accent.gold : colors.border.light}`,
    borderRadius : radius.button,
    overflow     : 'hidden',
    display      : 'flex',
    flexDirection: 'column',
    transform    : state.dragOver ? 'scale(1.02)' : 'scale(1)',
    boxShadow    : (state.hasPhoto && state.canAssign)
      ? `0 0 0 2px ${colors.border.gold}`
      : 'none',
    transition   : 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
    userSelect   : 'none',
    cursor       : state.hasPhoto ? 'pointer' : 'default',
  }),

  childCardPhoto: {
    position   : 'relative',
    aspectRatio: '2341 / 3512',
    background : colors.light.muted,
  } as CSSProperties,

  childCardPlaceholder: {
    position      : 'absolute',
    inset         : 0,
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    fontSize      : 28,
    color         : colors.text.muted,
  } as CSSProperties,

  childCardNameOverlay: {
    position  : 'absolute',
    left      : 0,
    right     : 0,
    bottom    : 0,
    padding   : `${space.sm}px ${space.xs}px`,
    textAlign : 'center',
    background: `linear-gradient(to top, ${colors.overlay.light}, transparent)`,
  } as CSSProperties,

  childCardPrenom: { fontSize: 12, color: colors.text.muted } as CSSProperties,
  childCardNom: { fontSize: 13, fontWeight: 600, color: colors.text.dark } as CSSProperties,

  childCardAssignHint: {
    position    : 'absolute',
    bottom      : '50%',
    left        : '50%',
    transform   : 'translate(-50%, 50%)',
    background  : colors.accent.gold,
    color       : colors.light.surface,
    fontSize    : 11,
    fontWeight  : 600,
    padding     : '6px 10px',
    borderRadius: 999,
    whiteSpace  : 'nowrap',
    pointerEvents: 'none',
    boxShadow   : shadows.gold,
  } as CSSProperties,

  childCardActions: {
    position: 'absolute',
    top     : 6,
    right   : 6,
    display : 'flex',
    gap     : 4,
    zIndex  : 2,
  } as CSSProperties,

  childCardActionBtn: {
    width         : 32,
    height        : 32,
    border        : 'none',
    borderRadius  : '50%',
    background    : colors.overlay.modal,
    color         : colors.text.primary,
    fontSize      : 14,
    lineHeight    : 1,
    padding       : 0,
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    cursor        : 'pointer',
  } as CSSProperties,

  childCardAutoBadge: {
    position       : 'absolute',
    top            : 8,
    left           : 8,
    background     : colors.accent.gold,
    color          : colors.light.surface,
    fontSize       : 10,
    fontWeight     : 600,
    padding        : '3px 7px',
    borderRadius   : radius.xs,
    textTransform  : 'uppercase',
    letterSpacing  : '0.5px',
    zIndex         : 2,
  } as CSSProperties,

  // ─── Export buttons ───────────────────────────────────────────────
  exportContainer: {
    display   : 'flex',
    alignItems: 'center',
    gap       : space.sm,
    flexWrap  : 'wrap',
  } as CSSProperties,

  exportStatus: {
    flex    : '1 1 100%',
    fontSize: 13,
    color   : colors.text.dark,
  } as CSSProperties,

  exportProgress: { color: colors.accent.gold } as CSSProperties,

  btnPrimary: (disabled: boolean): CSSProperties => ({
    padding     : `${space.sm}px ${space.md}px`,
    background  : disabled ? colors.text.muted : colors.accent.gold,
    color       : colors.light.surface,
    border      : 'none',
    borderRadius: radius.xs,
    fontSize    : 14,
    fontWeight  : 500,
    flex        : '1 1 auto',
    minWidth    : 0,
    cursor      : disabled ? 'not-allowed' : 'pointer',
  }),

  btnSecondary: {
    padding     : `${space.sm}px ${space.md}px`,
    background  : colors.light.surface,
    color       : colors.text.dark,
    border      : `1px solid ${colors.border.light}`,
    borderRadius: radius.xs,
    fontSize    : 14,
    cursor      : 'pointer',
  } as CSSProperties,

  // ─── Modal ajusteur ───────────────────────────────────────────────
  modalOverlay: {
    position      : 'fixed',
    inset         : 0,
    background    : colors.overlay.modal,
    display       : 'flex',
    alignItems    : 'stretch',
    justifyContent: 'stretch',
    zIndex        : 100,
  } as CSSProperties,

  modalOverlayDesktop: {
    alignItems    : 'center',
    justifyContent: 'center',
  } as CSSProperties,

  modal: {
    background    : colors.light.surface,
    width         : '100%',
    height        : '100%',
    maxHeight     : 'none',
    display       : 'flex',
    flexDirection : 'column',
    overflow      : 'hidden',
  } as CSSProperties,

  modalDesktop: {
    borderRadius: radius.card,
    width       : 'min(1100px, 94vw)',
    height      : 'auto',
    maxHeight   : '92vh',
  } as CSSProperties,

  modalHeader: {
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'space-between',
    padding       : `${space.sm}px ${space.md}px`,
    borderBottom  : `1px solid ${colors.border.light}`,
  } as CSSProperties,

  modalHeaderTitle: { margin: 0, fontSize: 15, color: colors.text.dark } as CSSProperties,

  modalClose: {
    border    : 'none',
    background: 'transparent',
    fontSize  : 22,
    lineHeight: 1,
    padding   : '4px 8px',
    cursor    : 'pointer',
    color     : colors.text.dark,
  } as CSSProperties,

  modalBodyMobile: {
    display      : 'flex',
    flexDirection: 'column',
    gap          : space.sm,
    padding      : space.sm,
    background   : colors.light.primary,
    flex         : 1,
    overflowY    : 'auto',
  } as CSSProperties,

  modalBodyDesktop: {
    flexDirection: 'row',
    padding      : space.md,
    gap          : space.md,
    flex         : 'none',
    overflow     : 'visible',
  } as CSSProperties,

  cropperContainerMobile: {
    position    : 'relative',
    background  : colors.background.elevated,
    borderRadius: radius.button,
    overflow    : 'hidden',
    height      : '40vh',
    minHeight   : 240,
    width       : '100%',
  } as CSSProperties,

  cropperContainerDesktop: {
    height: 440,
    flex  : 1,
  } as CSSProperties,

  previewPane: {
    display      : 'flex',
    flexDirection: 'column',
    gap          : 6,
    alignItems   : 'center',
  } as CSSProperties,

  previewPaneLabel: {
    fontSize      : 11,
    color         : colors.text.muted,
    textTransform : 'uppercase',
    letterSpacing : '0.5px',
    fontWeight    : 600,
  } as CSSProperties,

  paniniPreview: {
    background  : colors.light.surface,
    borderRadius: radius.xs,
    boxShadow   : shadows.md,
    overflow    : 'hidden',
    position    : 'relative',
  } as CSSProperties,

  paniniCanvas: {
    display  : 'block',
    width    : '100%',
    height   : '100%',
    objectFit: 'contain',
  } as CSSProperties,

  paniniPreviewEmpty: {
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    width         : '100%',
    height        : '100%',
    color         : colors.text.muted,
    fontSize      : 13,
  } as CSSProperties,

  paniniPreviewError: {
    position      : 'absolute',
    inset         : 0,
    background    : colors.accent.red,
    color         : colors.text.primary,
    padding       : space.xs,
    fontSize      : 11,
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    textAlign     : 'center',
  } as CSSProperties,

  modalControls: {
    padding   : `${space.sm}px ${space.md}px`,
    borderTop : `1px solid ${colors.border.light}`,
  } as CSSProperties,

  modalControlsLabel: {
    display   : 'flex',
    alignItems: 'center',
    gap       : space.sm,
    fontSize  : 13,
    color     : colors.text.dark,
  } as CSSProperties,

  modalControlsRange: { flex: 1 } as CSSProperties,

  modalFooter: {
    display       : 'flex',
    justifyContent: 'flex-end',
    gap           : space.xs,
    padding       : `${space.sm}px ${space.md}px`,
    borderTop     : `1px solid ${colors.border.light}`,
    paddingBottom : `max(${space.sm}px, env(safe-area-inset-bottom))`,
  } as CSSProperties,

  // ─── Loading / error ──────────────────────────────────────────────
  loadingWrap: {
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    height        : '100%',
    flexDirection : 'column',
    gap           : space.sm,
    padding       : space.lg,
    textAlign     : 'center',
  } as CSSProperties,

  errorTitle: { color: colors.accent.red, margin: 0 } as CSSProperties,
}
