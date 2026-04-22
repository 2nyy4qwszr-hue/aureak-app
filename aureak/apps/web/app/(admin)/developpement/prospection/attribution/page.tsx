// Story 88.4 — Page admin attribution : CRUD règles d'attribution commerciale
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  listAttributionRules, updateAttributionRule, deleteAttributionRule,
} from '@aureak/api-client'
import type { AttributionRule } from '@aureak/types'
import { AttributionRuleModal } from '../../../../../components/admin/prospection/AttributionRuleModal'

export default function AttributionRulesPage() {
  const [rules, setRules]         = useState<AttributionRule[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<AttributionRule | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await listAttributionRules()
      setRules(r)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionRulesPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSetDefault(rule: AttributionRule) {
    if (rule.isDefault) return
    setError(null)
    try {
      await updateAttributionRule({ id: rule.id, isDefault: true })
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionRulesPage] setDefault error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  async function handleDelete(rule: AttributionRule) {
    setError(null)
    try {
      await deleteAttributionRule(rule.id)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionRulesPage] delete error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  function handleEdit(rule: AttributionRule) {
    setEditing(rule)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <View style={st.header}>
        <View style={st.headerText}>
          <AureakText style={st.title as never}>Règles d'attribution</AureakText>
          <AureakText style={st.sub as never}>
            Répartition du crédit commercial entre qualifier (identification) et closer (conclusion).
          </AureakText>
        </View>
        <Pressable style={st.addBtn} onPress={handleAdd}>
          <AureakText style={st.addBtnLabel as never}>+ Ajouter une règle</AureakText>
        </Pressable>
      </View>

      {error && (
        <View style={st.errorBanner}>
          <AureakText style={st.errorText as never}>{error}</AureakText>
        </View>
      )}

      {loading ? (
        <AureakText style={st.loading as never}>Chargement…</AureakText>
      ) : rules.length === 0 ? (
        <View style={st.emptyState}>
          <AureakText style={st.emptyText as never}>Aucune règle configurée.</AureakText>
        </View>
      ) : (
        <View style={st.grid}>
          {rules.map(rule => {
            const q = (rule.percentages.qualifier as number | undefined) ?? 0
            const c = (rule.percentages.closer as number | undefined) ?? 0
            return (
              <View key={rule.id} style={st.card}>
                <View style={st.cardHeader}>
                  <AureakText style={st.cardTitle as never}>{rule.ruleName}</AureakText>
                  {rule.isDefault && (
                    <View style={st.defaultBadge}>
                      <AureakText style={st.defaultBadgeLabel as never}>PAR DÉFAUT</AureakText>
                    </View>
                  )}
                </View>

                {rule.description && (
                  <AureakText style={st.cardDesc as never}>{rule.description}</AureakText>
                )}

                <View style={st.pctRow}>
                  <View style={st.pctBlock}>
                    <AureakText style={st.pctLabel as never}>QUALIFIER</AureakText>
                    <AureakText style={st.pctValue as never}>{q} %</AureakText>
                  </View>
                  <View style={st.pctDivider} />
                  <View style={st.pctBlock}>
                    <AureakText style={st.pctLabel as never}>CLOSER</AureakText>
                    <AureakText style={st.pctValue as never}>{c} %</AureakText>
                  </View>
                </View>

                <View style={st.actions}>
                  <Pressable style={st.actionBtn} onPress={() => handleEdit(rule)}>
                    <AureakText style={st.actionBtnLabel as never}>Éditer</AureakText>
                  </Pressable>
                  {!rule.isDefault && (
                    <>
                      <Pressable style={st.actionBtn} onPress={() => handleSetDefault(rule)}>
                        <AureakText style={st.actionBtnLabel as never}>Définir défaut</AureakText>
                      </Pressable>
                      <Pressable style={st.deleteBtn} onPress={() => handleDelete(rule)}>
                        <AureakText style={st.deleteBtnLabel as never}>Supprimer</AureakText>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      <AttributionRuleModal
        visible={modalOpen}
        rule={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => load()}
      />
    </ScrollView>
  )
}

const st = StyleSheet.create({
  scroll : { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  headerText: { gap: 4, flex: 1, minWidth: 240 },
  title     : { color: colors.text.dark, fontWeight: '700', fontFamily: fonts.display, fontSize: 26 },
  sub       : { color: colors.text.muted, fontSize: 13 },

  addBtn: {
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    borderRadius: radius.button, backgroundColor: colors.accent.gold,
    // @ts-ignore
    boxShadow: shadows.sm,
  },
  addBtnLabel: { color: colors.text.dark, fontSize: 14, fontWeight: '700' },

  errorBanner: {
    backgroundColor: colors.status.absent + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    padding: space.sm,
    borderRadius: radius.xs,
  },
  errorText: { color: colors.status.absent, fontSize: 12 },

  loading: { color: colors.text.muted, fontStyle: 'italic' },

  emptyState: {
    padding: space.xxl,
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: {
    flex: 1,
    minWidth: 300,
    backgroundColor: colors.light.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: space.lg,
    gap: space.sm,
    // @ts-ignore
    boxShadow: shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  cardTitle : { color: colors.text.dark, fontSize: 16, fontWeight: '700', fontFamily: fonts.display },
  cardDesc  : { color: colors.text.muted, fontSize: 12 },

  defaultBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: colors.accent.gold,
    borderRadius: radius.xs,
  },
  defaultBadgeLabel: { color: colors.text.dark, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  pctRow: {
    flexDirection: 'row',
    backgroundColor: colors.light.muted,
    borderRadius: radius.xs,
    padding: space.md,
    alignItems: 'center',
  },
  pctBlock: { flex: 1, alignItems: 'center', gap: 2 },
  pctDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border.divider },
  pctLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  pctValue: { color: colors.text.dark, fontSize: 24, fontFamily: fonts.display, fontWeight: '900' },

  actions : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider,
  },
  actionBtnLabel: { color: colors.text.dark, fontSize: 12, fontWeight: '600' },
  deleteBtn: {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.xs, borderWidth: 1, borderColor: colors.status.absent,
  },
  deleteBtnLabel: { color: colors.status.absent, fontSize: 12, fontWeight: '600' },
})
