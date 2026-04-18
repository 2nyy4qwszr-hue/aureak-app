'use client'
// Story 88.4 — Page admin CRUD des règles d'attribution commerciale
import React, { useEffect, useState, useCallback } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  listAttributionRules,
  createAttributionRule,
  updateAttributionRule,
  deleteAttributionRule,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { AttributionRule, CreateAttributionRuleParams, UpdateAttributionRuleParams } from '@aureak/types'
import { AttributionRuleModal } from './_components/AttributionRuleModal'

export default function AttributionPage() {
  const { tenantId } = useAuthStore()
  const [rules, setRules]           = useState<AttributionRule[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editingRule, setEditingRule] = useState<AttributionRule | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listAttributionRules()
      setRules(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRules() }, [loadRules])

  const handleCreate = () => {
    setEditingRule(null)
    setShowModal(true)
  }

  const handleEdit = (rule: AttributionRule) => {
    setEditingRule(rule)
    setShowModal(true)
  }

  const handleSave = async (params: CreateAttributionRuleParams | UpdateAttributionRuleParams) => {
    if (editingRule) {
      await updateAttributionRule(editingRule.id, params as UpdateAttributionRuleParams, tenantId ?? undefined)
    } else {
      if (!tenantId) throw new Error('Tenant ID manquant')
      await createAttributionRule(params as CreateAttributionRuleParams, tenantId)
    }
    await loadRules()
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await deleteAttributionRule(id)
      await loadRules()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionPage] delete error:', err)
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (rule: AttributionRule) => {
    if (rule.isDefault) return
    try {
      await updateAttributionRule(rule.id, { isDefault: true }, tenantId ?? undefined)
      await loadRules()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AttributionPage] set default error:', err)
    }
  }

  if (loading && rules.length === 0) {
    return (
      <View style={s.container}>
        <AureakText variant="body" style={s.loadingText}>Chargement des règles...</AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <AureakText variant="h1" style={s.title}>Règles d'attribution</AureakText>
          <AureakText variant="body" style={s.sub}>
            Configurez la répartition du crédit commercial entre qualificateur et closer
          </AureakText>
        </View>
        <Pressable style={s.addBtn} onPress={handleCreate}>
          <AureakText style={s.addBtnText}>+ Ajouter une règle</AureakText>
        </Pressable>
      </View>

      {/* Cards */}
      {rules.length === 0 ? (
        <View style={s.emptyCard as object}>
          <AureakText variant="body" style={s.emptyText}>
            Aucune règle configurée. Créez votre première règle d'attribution.
          </AureakText>
        </View>
      ) : (
        <View style={s.grid}>
          {rules.map(rule => (
            <View key={rule.id} style={s.ruleCard as object}>
              {/* Header */}
              <View style={s.ruleHeader}>
                <View style={s.ruleNameRow}>
                  <AureakText style={s.ruleName}>{rule.ruleName}</AureakText>
                  {rule.isDefault && (
                    <View style={s.defaultBadge}>
                      <AureakText style={s.defaultBadgeText}>Par défaut</AureakText>
                    </View>
                  )}
                </View>
                {rule.description ? (
                  <AureakText style={s.ruleDesc} numberOfLines={2}>{rule.description}</AureakText>
                ) : null}
              </View>

              {/* Percentages bar */}
              <View style={s.ruleBarContainer}>
                <View style={[s.ruleBarQ, { flex: rule.percentages.qualifier || 1 }] as never} />
                <View style={[s.ruleBarC, { flex: rule.percentages.closer || 1 }] as never} />
              </View>
              <View style={s.ruleBarLabels}>
                <AureakText style={s.ruleBarLabel}>Qualif. {rule.percentages.qualifier}%</AureakText>
                <AureakText style={s.ruleBarLabel}>Closer {rule.percentages.closer}%</AureakText>
              </View>

              {/* Actions */}
              <View style={s.ruleActions}>
                {!rule.isDefault && (
                  <Pressable style={s.ruleActionBtn} onPress={() => handleSetDefault(rule)}>
                    <AureakText style={s.ruleActionText}>Définir par défaut</AureakText>
                  </Pressable>
                )}
                <Pressable style={s.ruleActionBtn} onPress={() => handleEdit(rule)}>
                  <AureakText style={s.ruleActionText}>Modifier</AureakText>
                </Pressable>
                {!rule.isDefault && (
                  <Pressable
                    style={s.ruleActionBtn}
                    onPress={() => handleDelete(rule.id)}
                    disabled={deleting === rule.id}
                  >
                    <AureakText style={[s.ruleActionText, s.ruleActionDelete] as never}>
                      {deleting === rule.id ? '...' : 'Supprimer'}
                    </AureakText>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modal */}
      <AttributionRuleModal
        visible={showModal}
        rule={editingRule}
        onClose={() => {
          setShowModal(false)
          setEditingRule(null)
        }}
        onSave={handleSave}
      />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-start',
    marginBottom  : space.xl,
    flexWrap      : 'wrap',
    gap           : space.md,
  },
  headerLeft: {
    flex    : 1,
    minWidth: 200,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
  },
  addBtn: {
    backgroundColor  : colors.accent.gold,
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
  },
  addBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
  loadingText: {
    color    : colors.text.muted,
    textAlign: 'center',
    marginTop: space.xl,
  },
  emptyCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.xl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    boxShadow      : shadows.sm,
  },
  emptyText: {
    color    : colors.text.muted,
    textAlign: 'center',
  },
  grid: {
    gap: space.md,
  },
  ruleCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    boxShadow      : shadows.sm,
  },
  ruleHeader: {
    marginBottom: space.md,
  },
  ruleNameRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    marginBottom : 4,
  },
  ruleName: {
    fontSize  : 16,
    fontFamily: fonts.display,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  defaultBadge: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
  },
  defaultBadgeText: {
    fontSize  : 10,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ruleDesc: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  ruleBarContainer: {
    flexDirection: 'row',
    height       : 8,
    borderRadius : 4,
    overflow     : 'hidden',
  },
  ruleBarQ: {
    backgroundColor: colors.accent.gold,
  },
  ruleBarC: {
    backgroundColor: colors.status.infoText,
  },
  ruleBarLabels: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    marginTop     : 4,
    marginBottom  : space.md,
  },
  ruleBarLabel: {
    fontSize  : 10,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
  },
  ruleActions: {
    flexDirection   : 'row',
    gap             : space.sm,
    borderTopWidth  : 1,
    borderTopColor  : colors.border.divider,
    paddingTop      : space.sm,
  },
  ruleActionBtn: {
    paddingVertical  : 4,
    paddingHorizontal: space.sm,
  },
  ruleActionText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.accent.gold,
  },
  ruleActionDelete: {
    color: colors.status.errorText,
  },
})
