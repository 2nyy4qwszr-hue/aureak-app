'use client'
// Story 56-7 — Modal de génération automatique de groupes par catégorie d'âge
// Classement joueurs actifs par birth_date → proposition éditable → création en DB
import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Modal } from 'react-native'
import { generateGroupsBySeason, createGroup, addGroupMember } from '@aureak/api-client'
import type { GroupProposal } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

// ── Types ──────────────────────────────────────────────────────────────────────

interface GeneratorState {
  proposals : (GroupProposal & { editedName: string; include: boolean })[]
  step      : 'preview' | 'creating' | 'done'
  error     : string | null
  result    : string | null
}

// ── Component ─────────────────────────────────────────────────────────────────

interface GroupGeneratorModalProps {
  visible        : boolean
  implantationId : string
  tenantId       : string
  seasonStartYear: number
  onClose        : () => void
  onCreated      : () => void
}

export function GroupGeneratorModal({
  visible,
  implantationId,
  tenantId,
  seasonStartYear,
  onClose,
  onCreated,
}: GroupGeneratorModalProps) {
  const [loading,   setLoading]   = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [genState,  setGenState]  = useState<GeneratorState | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const { data, error } = await generateGroupsBySeason(implantationId, seasonStartYear)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[GroupGeneratorModal] generateGroupsBySeason:', error)
        return
      }
      setGenState({
        proposals: data.map(p => ({
          ...p,
          editedName: p.name,
          include   : true,
        })),
        step  : 'preview',
        error : null,
        result: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!genState) return
    setCreating(true)
    try {
      let created = 0
      let errors  = 0
      for (const proposal of genState.proposals) {
        if (!proposal.include) continue
        if (proposal.hasConflict) {
          // Mode fusion : ajouter membres au groupe existant serait complexe sans getGroupByName
          // Pour le MVP, on skip les conflits et on informe l'utilisateur
          continue
        }
        // Créer le groupe
        const { data: group, error: groupErr } = await createGroup({
          tenantId,
          implantationId,
          name  : proposal.editedName,
        })
        if (groupErr || !group) {
          if (process.env.NODE_ENV !== 'production') console.error('[GroupGeneratorModal] createGroup error:', groupErr)
          errors++
          continue
        }
        // Ajouter les membres
        for (const member of proposal.members) {
          const { error: memberErr } = await addGroupMember(group.id, member.childId, tenantId)
          if (memberErr && process.env.NODE_ENV !== 'production') {
            console.error('[GroupGeneratorModal] addGroupMember error:', memberErr)
          }
        }
        created++
      }
      setGenState(prev => prev ? {
        ...prev,
        step  : 'done',
        result: `${created} groupe${created !== 1 ? 's' : ''} créé${created !== 1 ? 's' : ''}${errors > 0 ? `, ${errors} erreur(s)` : ''}.`,
      } : null)
      onCreated()
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setGenState(null)
    onClose()
  }

  const updateProposalName = (idx: number, name: string) => {
    setGenState(prev => {
      if (!prev) return null
      const updated = [...prev.proposals]
      updated[idx] = { ...updated[idx], editedName: name }
      return { ...prev, proposals: updated }
    })
  }

  const toggleInclude = (idx: number) => {
    setGenState(prev => {
      if (!prev) return null
      const updated = [...prev.proposals]
      updated[idx] = { ...updated[idx], include: !updated[idx].include }
      return { ...prev, proposals: updated }
    })
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.modal} onPress={e => e.stopPropagation?.()}>
          {/* Header */}
          <View style={s.header}>
            <AureakText variant="h3" style={{ color: colors.text.dark }}>
              Générer groupes par âge
            </AureakText>
            <Pressable onPress={handleClose}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 18 }}>✕</AureakText>
            </Pressable>
          </View>

          {!genState ? (
            // Step 0 : Explication + bouton générer
            <View style={{ gap: space.md }}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Classe automatiquement tous les joueurs actifs par catégorie d'âge (U10, U12, U14, U17) pour la saison {seasonStartYear}-{seasonStartYear + 1}.
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.subtle, fontStyle: 'italic' as never }}>
                Les joueurs sans date de naissance sont placés dans "Non classifiés".
              </AureakText>
              <Pressable
                style={[s.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={handleGenerate}
                disabled={loading}
              >
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                  {loading ? 'Analyse en cours…' : 'Analyser les joueurs'}
                </AureakText>
              </Pressable>
            </View>
          ) : genState.step === 'done' ? (
            // Step 2 : Résultat
            <View style={{ gap: space.md }}>
              <AureakText variant="body" style={{ color: colors.status.present, fontWeight: '700' }}>
                {genState.result}
              </AureakText>
              <Pressable style={s.primaryBtn} onPress={handleClose}>
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>Fermer</AureakText>
              </Pressable>
            </View>
          ) : (
            // Step 1 : Preview des groupes proposés
            <>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.sm }}>
                Renommez les groupes ou décochez ceux à ignorer.
              </AureakText>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {genState.proposals.map((proposal, idx) => (
                  <View key={proposal.ageCategory} style={[s.proposalRow, !proposal.include && { opacity: 0.4 }]}>
                    {/* Checkbox inclure */}
                    <Pressable
                      style={[s.checkbox, proposal.include && s.checkboxActive]}
                      onPress={() => toggleInclude(idx)}
                    >
                      {proposal.include && (
                        <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 10 }}>✓</AureakText>
                      )}
                    </Pressable>

                    <View style={{ flex: 1, gap: 4 }}>
                      {/* Nom éditable */}
                      <TextInput
                        style={s.nameInput}
                        value={proposal.editedName}
                        onChangeText={v => updateProposalName(idx, v)}
                        editable={proposal.include}
                        placeholderTextColor={colors.text.muted}
                      />
                      {/* Infos joueurs */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                          {proposal.members.length} joueur{proposal.members.length !== 1 ? 's' : ''}
                        </AureakText>
                        {proposal.hasConflict && (
                          <View style={s.conflictBadge}>
                            <AureakText variant="caption" style={{ color: colors.status.errorStrong, fontSize: 9, fontWeight: '700' }}>
                              Conflit — groupe existant
                            </AureakText>
                          </View>
                        )}
                      </View>
                      {/* Liste noms joueurs (top 5) */}
                      {proposal.members.length > 0 && (
                        <AureakText variant="caption" style={{ color: colors.text.subtle, fontSize: 10 }}>
                          {proposal.members.slice(0, 5).map(m => m.displayName).join(', ')}
                          {proposal.members.length > 5 ? ` +${proposal.members.length - 5}` : ''}
                        </AureakText>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {genState.error && (
                <AureakText variant="caption" style={{ color: colors.status.errorStrong }}>
                  {genState.error}
                </AureakText>
              )}

              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                <Pressable style={s.cancelBtn} onPress={handleClose}>
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600' }}>Annuler</AureakText>
                </Pressable>
                <Pressable
                  style={[s.primaryBtn, { flex: 2 }, creating && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                    {creating ? 'Création…' : 'Créer ces groupes'}
                  </AureakText>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.xl,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : space.lg,
    width          : '100%',
    maxWidth       : 520,
    gap            : space.sm,
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginBottom  : space.sm,
  },
  proposalRow: {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    gap           : space.sm,
    paddingVertical : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  checkbox: {
    width          : 20,
    height         : 20,
    borderRadius   : 4,
    borderWidth    : 2,
    borderColor    : colors.border.light,
    alignItems     : 'center',
    justifyContent : 'center',
    marginTop      : 2,
  },
  checkboxActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  nameInput: {
    backgroundColor  : colors.light.muted,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    color            : colors.text.dark,
    fontSize         : 13,
    fontWeight       : '600',
  },
  conflictBadge: {
    backgroundColor: colors.status.errorStrong + '15',
    borderRadius   : 4,
    paddingHorizontal: 5,
    paddingVertical  : 2,
    borderWidth    : 1,
    borderColor    : colors.status.errorStrong + '40',
  },
  primaryBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    alignItems       : 'center',
  },
  cancelBtn: {
    flex             : 1,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    alignItems       : 'center',
  },
})
