'use client'
// Story 21.3 — Éditeur de blocs ateliers pour les formulaires création/édition de séance.
import React, { useRef } from 'react'
import { View, StyleSheet, TextInput, Pressable, Image } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { uploadWorkshopPdf, uploadWorkshopCard } from '@aureak/api-client'
import type { SessionWorkshopDraft } from '@aureak/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkshopBlockEditorProps = {
  workshops : SessionWorkshopDraft[]
  onAdd     : () => void
  onRemove  : (index: number) => void
  onUpdate  : (index: number, patch: Partial<SessionWorkshopDraft>) => void
  onReorder : (index: number, direction: 'up' | 'down') => void
  tenantId  : string
  sessionId?: string   // null/undefined en mode création (uploads différés), set en édition
}

const MAX_WORKSHOPS = 4

// ── WorkshopBlock ─────────────────────────────────────────────────────────────

function WorkshopBlock({
  draft, index, isFirst, isLast, tenantId, sessionId, showOrder,
  onUpdate, onRemove, onReorder,
}: {
  draft     : SessionWorkshopDraft
  index     : number
  isFirst   : boolean
  isLast    : boolean
  tenantId  : string
  sessionId?: string
  showOrder : boolean
  onUpdate  : (patch: Partial<SessionWorkshopDraft>) => void
  onRemove  : () => void
  onReorder : (dir: 'up' | 'down') => void
}) {
  const pdfInputRef  = useRef<HTMLInputElement | null>(null)
  const cardInputRef = useRef<HTMLInputElement | null>(null)

  async function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    // En création, sessionId est inconnu → on garde le fichier en mémoire via URL.createObjectURL
    // comme URL temporaire; le vrai upload se fait au moment de addSessionWorkshop si sessionId fourni.
    // Ici on fait l'upload immédiatement si sessionId est connu, sinon on garde l'object URL.
    if (sessionId) {
      onUpdate({ pdfUploading: true })
      const { url, error } = await uploadWorkshopPdf(file, tenantId, sessionId)
      onUpdate({ pdfUrl: error ? null : url, pdfFile: null, pdfUploading: false })
    } else {
      // Mode création : sessionId inconnu → stocker le File + blob URL preview.
      // Le vrai upload se fera dans handleCreate après createSession().
      const objectUrl = URL.createObjectURL(file)
      onUpdate({ pdfUrl: objectUrl, pdfFile: file, pdfUploading: false })
    }
    // Reset l'input pour permettre re-sélection du même fichier
    e.target.value = ''
  }

  async function handleCardSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    if (sessionId) {
      onUpdate({ cardUploading: true })
      const { url, error } = await uploadWorkshopCard(file, tenantId, sessionId)
      onUpdate({ cardUrl: error ? null : url, cardFile: null, cardUploading: false })
    } else {
      const objectUrl = URL.createObjectURL(file)
      onUpdate({ cardUrl: objectUrl, cardFile: file, cardUploading: false })
    }
    e.target.value = ''
  }

  const pdfName = draft.pdfUrl
    ? draft.pdfUrl.startsWith('blob:')
      ? 'Fichier sélectionné'
      : draft.pdfUrl.split('/').pop()?.slice(0, 40) ?? 'PDF'
    : null

  return (
    <View style={s.blockCard}>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <View style={s.blockHeader}>
        <View style={s.blockHeaderLeft}>
          <View style={s.badgeGold}>
            <AureakText style={s.badgeText}>Atelier {index + 1}</AureakText>
          </View>
          <TextInput
            style={s.titleInput}
            value={draft.title}
            onChangeText={t => onUpdate({ title: t })}
            placeholder={`Atelier ${index + 1} — Titre libre…`}
            placeholderTextColor={colors.text.muted}
          />
        </View>
        <View style={s.blockActions}>
          {showOrder && (
            <>
              <Pressable style={s.actionBtn} onPress={() => onReorder('up')} disabled={isFirst}>
                <AureakText style={[s.actionBtnText, isFirst && s.disabled] as never}>↑</AureakText>
              </Pressable>
              <Pressable style={s.actionBtn} onPress={() => onReorder('down')} disabled={isLast}>
                <AureakText style={[s.actionBtnText, isLast && s.disabled] as never}>↓</AureakText>
              </Pressable>
            </>
          )}
          <Pressable style={[s.actionBtn, s.actionBtnDanger]} onPress={onRemove}>
            <AureakText style={s.actionBtnText}>✕</AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Page PDF ─────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <AureakText style={s.sectionLabel}>📄 Page PDF</AureakText>
        <View style={s.pdfRow}>
          {/* Bouton upload caché */}
          <input
            ref={el => { pdfInputRef.current = el }}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handlePdfSelect as never}
          />
          <Pressable
            style={s.uploadBtn}
            onPress={() => pdfInputRef.current?.click()}
            disabled={draft.pdfUploading}
          >
            <AureakText style={s.uploadBtnText}>
              {draft.pdfUploading ? '⏳ Upload…' : '📄 Choisir un PDF'}
            </AureakText>
          </Pressable>
          <AureakText style={s.orText}>ou</AureakText>
          <TextInput
            style={[s.urlInput, { flex: 1 }]}
            value={draft.pdfUrl && !draft.pdfUrl.startsWith('blob:') ? draft.pdfUrl : ''}
            onChangeText={url => onUpdate({ pdfUrl: url.trim() || null })}
            placeholder="URL externe…"
            placeholderTextColor={colors.text.muted}
          />
        </View>
        {pdfName && !draft.pdfUploading && (
          <View style={s.filePreview}>
            <AureakText style={s.filePreviewText}>📎 {pdfName}</AureakText>
            {draft.pdfUrl && !draft.pdfUrl.startsWith('blob:') && (
              <Pressable onPress={() => (window as never as Window & { open: (u: string, t: string) => void }).open(draft.pdfUrl!, '_blank')}>
                <AureakText style={s.linkText}>Voir →</AureakText>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ── Carte ────────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <AureakText style={s.sectionLabel}>🃏 Carte</AureakText>
        <TextInput
          style={s.urlInput}
          value={draft.cardLabel ?? ''}
          onChangeText={lbl => onUpdate({ cardLabel: lbl.trim() || null })}
          placeholder="Label de la carte…"
          placeholderTextColor={colors.text.muted}
        />
        <View style={s.cardRow}>
          <input
            ref={el => { cardInputRef.current = el }}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCardSelect as never}
          />
          <Pressable
            style={s.uploadBtn}
            onPress={() => cardInputRef.current?.click()}
            disabled={draft.cardUploading}
          >
            <AureakText style={s.uploadBtnText}>
              {draft.cardUploading ? '⏳ Upload…' : '🃏 Choisir une image'}
            </AureakText>
          </Pressable>
          {draft.cardUrl && (
            <Image
              source={{ uri: draft.cardUrl }}
              style={s.cardPreview}
              resizeMode="cover"
            />
          )}
        </View>
      </View>

      {/* ── Notes ────────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={s.notesHeader}>
          <AureakText style={s.sectionLabel}>Notes</AureakText>
          <AureakText style={s.counter}>{draft.notes.length}/200</AureakText>
        </View>
        <TextInput
          style={[s.urlInput, s.notesInput]}
          value={draft.notes}
          onChangeText={t => onUpdate({ notes: t.slice(0, 200) })}
          placeholder="Notes optionnelles…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  )
}

// ── WorkshopBlockEditor ───────────────────────────────────────────────────────

export default function WorkshopBlockEditor({
  workshops, onAdd, onRemove, onUpdate, onReorder, tenantId, sessionId,
}: WorkshopBlockEditorProps) {
  const canAdd = workshops.length < MAX_WORKSHOPS

  return (
    <View style={s.container}>
      {workshops.map((w, i) => (
        <WorkshopBlock
          key={i}
          draft={w}
          index={i}
          isFirst={i === 0}
          isLast={i === workshops.length - 1}
          tenantId={tenantId}
          sessionId={sessionId}
          showOrder={workshops.length > 1}
          onUpdate={patch => onUpdate(i, patch)}
          onRemove={() => onRemove(i)}
          onReorder={dir => onReorder(i, dir)}
        />
      ))}

      <Pressable
        style={[s.addBtn, !canAdd && s.addBtnDisabled]}
        onPress={canAdd ? onAdd : undefined}
      >
        <AureakText style={[s.addBtnText, !canAdd && s.addBtnDisabledText] as never}>
          {canAdd ? '+ Ajouter un atelier' : `Maximum ${MAX_WORKSHOPS} ateliers par séance`}
        </AureakText>
      </Pressable>

      {workshops.length === 0 && (
        <AureakText style={s.emptyHint}>
          Aucun atelier — la séance peut être créée sans atelier.
        </AureakText>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container : { gap: space.sm },
  emptyHint : { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' as never, textAlign: 'center' as never, paddingVertical: space.sm },

  blockCard   : { backgroundColor: colors.light.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border.light, padding: space.sm, gap: space.sm, boxShadow: shadows.sm } as never,
  blockHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flex: 1, marginRight: space.xs },
  blockActions: { flexDirection: 'row', gap: 4 },

  badgeGold   : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.accent.gold + '20', borderWidth: 1, borderColor: colors.accent.gold + '50' },
  badgeText   : { fontSize: 10, fontWeight: '700' as never, color: colors.accent.gold },

  titleInput  : { flex: 1, fontSize: 13, color: colors.text.dark, borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, paddingHorizontal: space.sm, paddingVertical: 5, backgroundColor: colors.light.muted },

  actionBtn      : { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  actionBtnDanger: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  actionBtnText  : { fontSize: 11, color: colors.text.dark },
  disabled       : { opacity: 0.3 } as never,

  section      : { gap: 4 },
  sectionLabel : { fontSize: 10, fontWeight: '600' as never, color: colors.text.muted, textTransform: 'uppercase' as never, letterSpacing: 0.4 },

  pdfRow  : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  cardRow : { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 4 },

  uploadBtn    : { paddingHorizontal: space.sm, paddingVertical: 6, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.gold, backgroundColor: colors.accent.gold + '10' },
  uploadBtnText: { fontSize: 11, color: colors.accent.gold, fontWeight: '600' as never },

  orText  : { fontSize: 11, color: colors.text.muted, paddingHorizontal: 2 },
  urlInput: { fontSize: 12, color: colors.text.dark, borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, paddingHorizontal: space.sm, paddingVertical: 5, backgroundColor: colors.light.muted },
  notesInput: { minHeight: 44, textAlignVertical: 'top' as never },

  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter    : { fontSize: 10, color: colors.text.muted },

  filePreview    : { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 2 },
  filePreviewText: { fontSize: 11, color: colors.text.muted, flex: 1 },
  linkText       : { fontSize: 11, color: colors.accent.gold, fontWeight: '600' as never },

  cardPreview: { width: 40, height: 40, borderRadius: 4, borderWidth: 1, borderColor: colors.border.light },

  addBtn            : { paddingVertical: space.sm, borderRadius: radius.card, borderWidth: 1, borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '10', alignItems: 'center' as never },
  addBtnDisabled    : { borderColor: colors.border.light, backgroundColor: colors.light.muted },
  addBtnText        : { fontSize: 13, color: colors.accent.gold, fontWeight: '600' as never },
  addBtnDisabledText: { color: colors.text.muted },
})
