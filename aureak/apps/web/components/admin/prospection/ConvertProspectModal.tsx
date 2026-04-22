'use client'
// Story 88.4 — Modale conversion prospect : suggestion attribution + ajustement manuel
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, Modal, TextInput, ScrollView } from 'react-native'
import {
  suggestAttribution, saveAttributionResult, updateClubProspect,
} from '@aureak/api-client'
import type { AttributionSuggestion } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'

type Props = {
  visible        : boolean
  clubProspectId : string
  onClose        : () => void
  onSuccess?     : () => void
}

type EditableRow = {
  commercialId : string
  displayName  : string
  actionCount  : number
  percentage   : number
}

export function ConvertProspectModal({ visible, clubProspectId, onClose, onSuccess }: Props) {
  const [suggestion, setSuggestion] = useState<AttributionSuggestion | null>(null)
  const [rows, setRows]             = useState<EditableRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const s = await suggestAttribution(clubProspectId)
        if (cancelled) return
        setSuggestion(s)
        setRows((s?.commercials ?? []).map(c => ({
          commercialId : c.commercialId,
          displayName  : c.displayName,
          actionCount  : c.actionCount,
          percentage   : c.suggestedPercentage,
        })))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ConvertProspectModal] suggest error:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [visible, clubProspectId])

  const total = rows.reduce((a, r) => a + r.percentage, 0)

  function updatePct(id: string, pct: number) {
    setRows(prev => prev.map(r => r.commercialId === id ? { ...r, percentage: pct } : r))
  }

  async function handleConfirm() {
    if (total !== 100) {
      setError(`Le total doit être 100 % (actuellement ${total} %)`)
      return
    }
    if (!suggestion) return

    setSaving(true)
    setError(null)
    try {
      await saveAttributionResult(clubProspectId, {
        ruleId      : suggestion.ruleApplied.id,
        commercials : rows.map(r => ({
          id          : r.commercialId,
          displayName : r.displayName,
          percentage  : r.percentage,
        })),
      })
      // Le statut "converti" déclenche le trigger auto-log (changement_statut)
      await updateClubProspect({ id: clubProspectId, status: 'converti' })
      onSuccess?.()
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ConvertProspectModal] confirm error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.modal}>
          <ScrollView contentContainerStyle={s.body}>
            <AureakText variant="h2" style={s.title as never}>Convertir en client</AureakText>
            <AureakText style={s.sub as never}>
              Répartition du crédit commercial suggérée par la règle par défaut.
              Tu peux l'ajuster manuellement avant validation.
            </AureakText>

            {loading ? (
              <AureakText style={s.loading as never}>Calcul de la suggestion…</AureakText>
            ) : !suggestion ? (
              <View style={s.warningCard}>
                <AureakText style={s.warningText as never}>
                  Aucune règle par défaut configurée.
                  Crée-en une dans l'onglet Attribution.
                </AureakText>
              </View>
            ) : rows.length === 0 ? (
              <View style={s.warningCard}>
                <AureakText style={s.warningText as never}>
                  Aucune action enregistrée pour ce prospect —
                  impossible de calculer une suggestion automatique.
                </AureakText>
              </View>
            ) : (
              <>
                <View style={s.ruleCard}>
                  <AureakText style={s.ruleLabel as never}>RÈGLE APPLIQUÉE</AureakText>
                  <AureakText style={s.ruleName as never}>{suggestion.ruleApplied.ruleName}</AureakText>
                  {suggestion.ruleApplied.description && (
                    <AureakText style={s.ruleDesc as never}>{suggestion.ruleApplied.description}</AureakText>
                  )}
                </View>

                <View style={s.tableHeader}>
                  <View style={{ flex: 2 }}><AureakText style={s.th as never}>COMMERCIAL</AureakText></View>
                  <View style={{ width: 80 }}><AureakText style={s.th as never}>ACTIONS</AureakText></View>
                  <View style={{ width: 110 }}><AureakText style={s.th as never}>% ATTRIBUÉ</AureakText></View>
                </View>

                {rows.map(r => (
                  <View key={r.commercialId} style={s.row}>
                    <View style={{ flex: 2 }}>
                      <AureakText style={s.name as never}>{r.displayName}</AureakText>
                    </View>
                    <AureakText style={[s.cellMuted, { width: 80 }] as never}>{r.actionCount}</AureakText>
                    <TextInput
                      style={[s.pctInput, { width: 110 }] as never}
                      value={String(r.percentage)}
                      onChangeText={t => updatePct(r.commercialId, Number(t) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                ))}

                <View style={[s.totalRow, total !== 100 && s.totalRowError] as never}>
                  <AureakText style={s.totalLabel as never}>TOTAL</AureakText>
                  <AureakText style={[s.totalValue, total !== 100 && { color: colors.status.absent }] as never}>
                    {total} %
                  </AureakText>
                </View>
              </>
            )}

            {error && <AureakText style={s.error as never}>{error}</AureakText>}

            <View style={s.actions}>
              <Pressable style={s.btnCancel} onPress={onClose} disabled={saving}>
                <AureakText style={s.btnCancelLabel as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[s.btnSubmit, (saving || total !== 100 || rows.length === 0) && s.btnDisabled]}
                onPress={handleConfirm}
                disabled={saving || total !== 100 || rows.length === 0}
              >
                <AureakText style={s.btnSubmitLabel as never}>
                  {saving ? 'Conversion…' : 'Valider la conversion'}
                </AureakText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: space.md },
  modal   : { backgroundColor: colors.light.surface, borderRadius: radius.card, width: '100%', maxWidth: 620, maxHeight: '92%' },
  body    : { padding: space.lg, gap: space.md },
  title   : { color: colors.text.dark, fontWeight: '700' },
  sub     : { color: colors.text.muted, fontSize: 13 },
  loading : { color: colors.text.muted, fontStyle: 'italic', fontSize: 13 },

  ruleCard: {
    backgroundColor: colors.accent.gold + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
    padding        : space.md,
    borderRadius   : radius.xs,
    gap            : 4,
  },
  ruleLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  ruleName : { color: colors.text.dark, fontSize: 15, fontWeight: '700', fontFamily: fonts.display },
  ruleDesc : { color: colors.text.subtle, fontSize: 12 },

  warningCard: {
    padding: space.md,
    backgroundColor: colors.status.amberText + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.status.amberText,
    borderRadius: radius.xs,
  },
  warningText: { color: colors.text.dark, fontSize: 13 },

  tableHeader: {
    flexDirection    : 'row',
    paddingVertical  : 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  th: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  row: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingVertical  : 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  name     : { color: colors.text.dark, fontSize: 14, fontWeight: '600' },
  cellMuted: { color: colors.text.muted, fontSize: 13 },
  pctInput : {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : 6,
    color            : colors.text.dark,
    backgroundColor  : colors.light.primary,
    textAlign        : 'center',
    fontWeight       : '700',
  },

  totalRow: {
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    marginTop      : space.xs,
  },
  totalRowError: { backgroundColor: colors.status.absent + '15' },
  totalLabel   : { color: colors.text.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  totalValue   : { color: colors.text.dark, fontSize: 18, fontWeight: '800' },

  error : { color: colors.status.absent, fontSize: 12 },

  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.md },
  btnCancel: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  btnCancelLabel: { color: colors.text.muted },
  btnSubmit: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.xs, backgroundColor: colors.status.present },
  btnDisabled: { opacity: 0.4 },
  btnSubmitLabel: { color: '#fff', fontWeight: '700' },
})
