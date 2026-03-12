'use client'
// Story 21.2 — Sélecteur de blocs thème/séquence/ressource pour le formulaire de création de séance.
// Utilisé dans le Step 3 "Thèmes pédagogiques" de seances/new.tsx.
import React, { useState, useEffect, useMemo } from 'react'
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { listThemes, listSequencesByTheme, listThemeResources } from '@aureak/api-client'
import type { Theme, ThemeSequence, ThemeResource } from '@aureak/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThemeBlockDraft = {
  themeId      : string
  themeName    : string
  sequenceId   : string | null
  sequenceName : string | null
  resourceId   : string | null
  resourceLabel: string | null
}

type ThemeBlockPickerProps = {
  methodFilter: string | null          // category filter (MethodologyMethod value ou null = tous)
  blocks      : ThemeBlockDraft[]
  onAdd       : () => void
  onRemove    : (index: number) => void
  onUpdate    : (index: number, patch: Partial<ThemeBlockDraft>) => void
  onReorder   : (index: number, direction: 'up' | 'down') => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Libellé affiché pour une ressource (selon son type). */
function resourceDisplayLabel(r: ThemeResource, index: number): string {
  if (r.resourceType === 'pdf_coach')       return `📄 Fiche coach`
  if (r.resourceType === 'reference_media') return `🃏 Carte ${index + 1}`
  return r.label?.slice(0, 30) ?? r.url.slice(0, 30)
}

/** Types de ressources admis dans le picker terrain. */
const TERRAIN_RESOURCE_TYPES = ['pdf_coach', 'reference_media'] as const

// ── SimpleSearchSelect ─────────────────────────────────────────────────────────
// Dropdown filtrable (même pattern que SearchableSelect dans new.tsx).

type SSOption = { id: string; label: string }

function SimpleSearchSelect({
  options, value, onSelect, placeholder, disabled = false, zBase = 5,
}: {
  options    : SSOption[]
  value      : string
  onSelect   : (id: string) => void
  placeholder: string
  disabled?  : boolean
  zBase?     : number
}) {
  const [open, setOpen] = useState(false)
  const [q,    setQ]    = useState('')

  const filtered = useMemo(
    () => !q ? options : options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())),
    [options, q]
  )
  const selected = options.find(o => o.id === value)

  return (
    <View style={[s.ssWrap, { zIndex: open ? zBase + 100 : zBase }]}>
      <Pressable
        style={[s.ssTrigger, disabled && s.ssDisabled]}
        onPress={() => { if (!disabled) { setOpen(v => !v); setQ('') } }}
      >
        <AureakText style={{ flex: 1, fontSize: 12, color: selected ? colors.text.dark : colors.text.muted }}>
          {selected?.label ?? placeholder}
        </AureakText>
        <AureakText style={{ fontSize: 10, color: colors.text.muted }}>{open ? '▲' : '▼'}</AureakText>
      </Pressable>
      {open && (
        <View style={s.ssDropdown}>
          {options.length > 5 && (
            <input
              style={{ padding: '4px 8px', fontSize: 12, border: 'none', borderBottom: `1px solid ${colors.border.light}`, outline: 'none', width: '100%', boxSizing: 'border-box' } as never}
              placeholder="Rechercher…"
              value={q}
              onChange={e => setQ(e.target.value)}
              autoFocus
            />
          )}
          {filtered.length === 0 ? (
            <AureakText style={s.ssEmpty}>Aucun résultat</AureakText>
          ) : (
            filtered.map(o => (
              <Pressable
                key={o.id}
                style={[s.ssItem, o.id === value && s.ssItemActive]}
                onPress={() => { onSelect(o.id); setOpen(false); setQ('') }}
              >
                <AureakText style={{ fontSize: 12, color: o.id === value ? colors.text.dark : colors.text.dark }}>
                  {o.label}
                </AureakText>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  )
}

// ── ThemeBlockRow ─────────────────────────────────────────────────────────────
// Un bloc individuel dans le picker.

function ThemeBlockRow({
  block, index, isFirst, isLast, allThemes, onUpdate, onRemove, onReorder,
}: {
  block    : ThemeBlockDraft
  index    : number
  isFirst  : boolean
  isLast   : boolean
  allThemes: Theme[]
  onUpdate : (patch: Partial<ThemeBlockDraft>) => void
  onRemove : () => void
  onReorder: (direction: 'up' | 'down') => void
}) {
  const [sequences, setSequences] = useState<ThemeSequence[]>([])
  const [resources, setResources] = useState<ThemeResource[]>([])
  const [loading,   setLoading]   = useState(false)

  // Charger séquences + ressources quand le thème change
  useEffect(() => {
    if (!block.themeId) { setSequences([]); setResources([]); return }
    setLoading(true)
    Promise.all([
      listSequencesByTheme(block.themeId),
      listThemeResources(block.themeId),
    ]).then(([seqRes, resArray]) => {
      setSequences(seqRes.data ?? [])
      const filtered = (resArray as ThemeResource[]).filter(r =>
        (TERRAIN_RESOURCE_TYPES as readonly string[]).includes(r.resourceType)
      )
      setResources(filtered)
    }).catch(() => {
      setSequences([])
      setResources([])
    }).finally(() => {
      setLoading(false)
    })
  }, [block.themeId])

  const themeOptions    = allThemes.map(t => ({ id: t.id, label: t.name }))
  const sequenceOptions = sequences.map(s => ({ id: s.id, label: s.name }))
  const resourceOptions = resources.map((r, i) => ({ id: r.id, label: resourceDisplayLabel(r, i) }))

  function handleThemeSelect(themeId: string) {
    const theme = allThemes.find(t => t.id === themeId)
    onUpdate({
      themeId,
      themeName   : theme?.name ?? '',
      sequenceId  : null,
      sequenceName: null,
      resourceId  : null,
      resourceLabel: null,
    })
  }

  function handleSequenceSelect(sequenceId: string) {
    const seq = sequences.find(s => s.id === sequenceId)
    onUpdate({ sequenceId, sequenceName: seq?.name ?? null })
  }

  function handleResourceSelect(resourceId: string) {
    const res   = resources.find(r => r.id === resourceId)
    const label = res ? resourceDisplayLabel(res, resources.indexOf(res)) : null
    onUpdate({ resourceId, resourceLabel: label })
  }

  return (
    <View style={s.blockCard}>
      {/* Header : numéro + boutons ordre + supprimer */}
      <View style={s.blockHeader}>
        <AureakText style={s.blockNum}>Thème {index + 1}</AureakText>
        <View style={s.blockActions}>
          <Pressable style={s.actionBtn} onPress={() => onReorder('up')}  disabled={isFirst}>
            <AureakText style={[s.actionBtnText, isFirst && s.actionBtnDisabled]}>↑</AureakText>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={() => onReorder('down')} disabled={isLast}>
            <AureakText style={[s.actionBtnText, isLast && s.actionBtnDisabled]}>↓</AureakText>
          </Pressable>
          <Pressable style={[s.actionBtn, s.actionBtnDanger]} onPress={onRemove}>
            <AureakText style={s.actionBtnText}>✕</AureakText>
          </Pressable>
        </View>
      </View>

      {/* Sélecteur thème */}
      <AureakText style={s.fieldLabel}>Thème</AureakText>
      <SimpleSearchSelect
        options={themeOptions}
        value={block.themeId}
        onSelect={handleThemeSelect}
        placeholder="Sélectionner un thème…"
        zBase={Math.max(1, 10 - index)}
      />

      {loading && <ActivityIndicator size="small" color={colors.accent.gold} style={{ marginTop: 4 }} />}

      {/* Sélecteur séquence (caché si aucune séquence) */}
      {!loading && block.themeId && sequenceOptions.length > 0 && (
        <>
          <AureakText style={s.fieldLabel}>Séquence</AureakText>
          <SimpleSearchSelect
            options={sequenceOptions}
            value={block.sequenceId ?? ''}
            onSelect={handleSequenceSelect}
            placeholder="Séquence (optionnel)…"
            zBase={Math.max(1, 8 - index)}
          />
        </>
      )}

      {/* Sélecteur ressource (caché si aucune ressource terrain) */}
      {!loading && block.themeId && resourceOptions.length > 0 && (
        <>
          <AureakText style={s.fieldLabel}>Ressource terrain</AureakText>
          <SimpleSearchSelect
            options={resourceOptions}
            value={block.resourceId ?? ''}
            onSelect={handleResourceSelect}
            placeholder="Carte / Fiche coach (optionnel)…"
            zBase={Math.max(1, 6 - index)}
          />
        </>
      )}
    </View>
  )
}

// ── ThemeBlockPicker ──────────────────────────────────────────────────────────

export default function ThemeBlockPicker({
  methodFilter, blocks, onAdd, onRemove, onUpdate, onReorder,
}: ThemeBlockPickerProps) {
  const [allThemes,    setAllThemes]    = useState<Theme[]>([])
  const [loadingThemes,setLoadingThemes]= useState(false)

  useEffect(() => {
    setLoadingThemes(true)
    listThemes(methodFilter ? { category: methodFilter } : undefined)
      .then(async ({ data }) => {
        const themes = data ?? []
        // L2 — Si le filtre méthode ne matche aucun thème, fallback sur tous les thèmes
        if (methodFilter && themes.length === 0) {
          const { data: all } = await listThemes()
          setAllThemes(all ?? [])
        } else {
          setAllThemes(themes)
        }
      })
      .catch(() => { setAllThemes([]) })
      .finally(() => { setLoadingThemes(false) })
  }, [methodFilter])

  return (
    <View style={s.container}>
      {loadingThemes ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color={colors.accent.gold} />
          <AureakText style={s.loadingText}>Chargement des thèmes…</AureakText>
        </View>
      ) : (
        <>
          {blocks.map((block, i) => (
            <ThemeBlockRow
              key={i}
              block={block}
              index={i}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
              allThemes={allThemes}
              onUpdate={patch => onUpdate(i, patch)}
              onRemove={() => onRemove(i)}
              onReorder={dir => onReorder(i, dir)}
            />
          ))}

          <Pressable style={s.addBtn} onPress={onAdd}>
            <AureakText style={s.addBtnText}>+ Ajouter un thème</AureakText>
          </Pressable>

          {blocks.length === 0 && (
            <AureakText style={s.emptyHint}>
              Aucun thème — la séance peut être créée sans bloc thème.
            </AureakText>
          )}
        </>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container  : { gap: space.sm },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  loadingText: { fontSize: 12, color: colors.text.muted },
  emptyHint  : { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' as never, textAlign: 'center' as never, paddingVertical: space.sm },

  blockCard  : { backgroundColor: colors.light.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border.light, padding: space.sm, gap: 6 },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  blockNum   : { fontSize: 12, fontWeight: '600' as never, color: colors.text.dark },
  blockActions: { flexDirection: 'row', gap: 4 },

  actionBtn      : { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  actionBtnDanger: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  actionBtnText  : { fontSize: 11, color: colors.text.dark },
  actionBtnDisabled: { opacity: 0.3 } as never,

  fieldLabel : { fontSize: 11, color: colors.text.muted, fontWeight: '600' as never, marginTop: 4 },

  addBtn     : { paddingVertical: space.sm, borderRadius: radius.card, borderWidth: 1, borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '10', alignItems: 'center' as never },
  addBtnText : { fontSize: 13, color: colors.accent.gold, fontWeight: '600' as never },

  // SimpleSearchSelect styles
  ssWrap    : { position: 'relative' as never },
  ssTrigger : { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, backgroundColor: colors.light.primary, paddingHorizontal: space.sm, paddingVertical: 6 },
  ssDisabled: { opacity: 0.5 },
  ssDropdown: { position: 'absolute' as never, top: '100%', left: 0, right: 0, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, maxHeight: 180, overflow: 'scroll' as never, zIndex: 999 } as never,
  ssItem    : { paddingHorizontal: space.sm, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  ssItemActive: { backgroundColor: colors.accent.gold + '15' },
  ssEmpty   : { padding: space.sm, fontSize: 12, color: colors.text.muted, fontStyle: 'italic' as never },
})
